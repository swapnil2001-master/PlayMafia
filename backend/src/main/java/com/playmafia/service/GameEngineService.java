package com.playmafia.service;

import com.playmafia.dto.PlayerView;
import com.playmafia.dto.RoleView;
import com.playmafia.dto.RoomView;
import com.playmafia.model.GameConfig;
import com.playmafia.model.Phase;
import com.playmafia.model.Player;
import com.playmafia.model.Role;
import com.playmafia.model.Room;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Owns all game state and transitions. State lives in memory, keyed by room code.
 * Every mutation ends by broadcasting the updated room to connected clients.
 */
@Service
public class GameEngineService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ConcurrentHashMap<String, Room> rooms = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messaging;

    public GameEngineService(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    // ---------------------------------------------------------------- lifecycle

    public Room createRoom(String hostName, String roomName) {
        String code = uniqueCode();
        String hostId = UUID.randomUUID().toString();
        Room room = new Room(code, blankTo(roomName, hostName + "'s Room"), hostId);
        room.getPlayers().add(new Player(hostId, hostName, true));
        rooms.put(code, room);
        return room;
    }

    public Player joinRoom(String code, String name) {
        Room room = require(code);
        if (room.getPhase() != Phase.WAITING) {
            throw badRequest("Game already started");
        }
        boolean nameTaken = room.getPlayers().stream()
                .anyMatch(p -> p.getName().equalsIgnoreCase(name));
        if (nameTaken) {
            throw badRequest("That name is already taken in this room");
        }
        Player player = new Player(UUID.randomUUID().toString(), name, false);
        room.getPlayers().add(player);
        broadcast(room);
        return player;
    }

    public void leaveRoom(String code, String playerId) {
        Room room = rooms.get(code);
        if (room == null) return;
        Player player = room.findPlayer(playerId);
        if (player == null) return;
        room.getPlayers().remove(player);
        if (room.getPlayers().isEmpty()) {
            rooms.remove(code);
            return;
        }
        // Reassign host if the host left while still in the lobby.
        if (player.isHost() && room.getPhase() == Phase.WAITING) {
            Player next = room.getPlayers().get(0);
            next.setHost(true);
            room.setHostId(next.getId());
        }
        broadcast(room);
    }

    // ---------------------------------------------------------------- config

    public void updateConfig(String code, String hostId, GameConfig config) {
        Room room = requireHost(code, hostId);
        room.setConfig(config);
        if (room.getPhase() == Phase.WAITING) {
            room.setPhase(Phase.CONFIG);
        }
        broadcast(room);
    }

    // ---------------------------------------------------------------- start

    public void startGame(String code, String hostId) {
        Room room = requireHost(code, hostId);
        List<Player> activePlayers = room.getPlayers().stream().filter(p -> !p.isHost()).toList();
        int activePlayerCount = activePlayers.size();
        GameConfig cfg = room.getConfig();

        if (activePlayerCount < 2) {
            throw badRequest("Need at least 2 active players to start");
        }
        if (cfg.specialCount() > activePlayerCount) {
            throw badRequest("Special roles exceed active player count");
        }
        if (cfg.getMafia() < 1) {
            throw badRequest("Need at least 1 Mafia");
        }

        List<Role> deck = new ArrayList<>();
        addN(deck, Role.MAFIA, cfg.getMafia());
        addN(deck, Role.DOCTOR, cfg.getDoctor());
        addN(deck, Role.DETECTIVE, cfg.getDetective());
        addN(deck, Role.BODYGUARD, cfg.getBodyguard());
        addN(deck, Role.JESTER, cfg.getJester());
        while (deck.size() < activePlayerCount) {
            deck.add(Role.VILLAGER);
        }
        Collections.shuffle(deck, RANDOM);

        for (int i = 0; i < activePlayers.size(); i++) {
            Player p = activePlayers.get(i);
            p.setRole(deck.get(i));
            p.setAlive(true);
            p.setReady(false);
        }

        // Set host (God) role to null and keep them alive but not active
        Player hostPlayer = room.findPlayer(hostId);
        if (hostPlayer != null) {
            hostPlayer.setRole(null);
            hostPlayer.setAlive(true);
            hostPlayer.setReady(true);
        }

        room.setPhase(Phase.ROLE_REVEAL);
        room.setRound(0);
        room.setWinner(null);
        room.getLog().clear();
        resetNightTargets(room);

        // Deliver each secret role privately to active players, then broadcast.
        for (Player p : activePlayers) {
            sendRole(code, p);
        }
        broadcast(room);
    }

    public void setReady(String code, String playerId) {
        Room room = require(code);
        Player player = room.findPlayer(playerId);
        if (player == null) throw badRequest("Player not in room");
        player.setReady(true);

        boolean allReady = room.getPlayers().stream().allMatch(Player::isReady);
        if (allReady && room.getPhase() == Phase.ROLE_REVEAL) {
            room.setRound(1);
            room.setPhase(Phase.NIGHT);
            resetNightTargets(room);
            room.getLog().add("Night 1 begins.");
        }
        broadcast(room);
    }

    // ---------------------------------------------------------------- God actions

    public void kill(String code, String hostId, String targetId) {
        Room room = requireHost(code, hostId);
        Player target = requireTarget(room, targetId);
        target.setAlive(false);
        room.getLog().add(target.getName() + " died.");
        broadcast(room);
    }

    public void revive(String code, String hostId, String targetId) {
        Room room = requireHost(code, hostId);
        Player target = requireTarget(room, targetId);
        target.setAlive(true);
        room.getLog().add(target.getName() + " was revived.");
        broadcast(room);
    }

    public void voteOut(String code, String hostId, String targetId) {
        Room room = requireHost(code, hostId);
        Player target = requireTarget(room, targetId);
        target.setAlive(false);
        room.getLog().add(target.getName() + " was voted out.");
        broadcast(room);
    }

    /** Advance the phase along Night -> Day -> Voting -> Result -> Night. */
    public void advancePhase(String code, String hostId) {
        Room room = requireHost(code, hostId);
        switch (room.getPhase()) {
            case NIGHT -> {
                if (room.getMafiaTargetId() != null) {
                    String mafiaTargetId = room.getMafiaTargetId();
                    Player target = room.findPlayer(mafiaTargetId);
                    if (target != null) {
                        boolean saved = false;
                        if (mafiaTargetId.equals(room.getDoctorTargetId())) {
                            saved = true;
                        }
                        if (mafiaTargetId.equals(room.getBodyguardTargetId())) {
                            saved = true;
                        }
                        if (saved) {
                            room.getLog().add("An attack was prevented during the night.");
                        } else {
                            target.setAlive(false);
                            room.getLog().add(target.getName() + " died at night.");
                        }
                    }
                } else {
                    room.getLog().add("No one died at night.");
                }
                resetNightTargets(room);
                room.setPhase(Phase.DAY);
                room.getLog().add("Day " + room.getRound() + " begins. Discuss.");
            }
            case DAY -> { room.setPhase(Phase.VOTING); room.getLog().add("Voting has begun."); }
            case VOTING -> room.setPhase(Phase.RESULT);
            case RESULT -> {
                room.setRound(room.getRound() + 1);
                room.setPhase(Phase.NIGHT);
                resetNightTargets(room);
                room.getLog().add("Night " + room.getRound() + " begins.");
            }
            default -> throw badRequest("Cannot advance from " + room.getPhase());
        }
        broadcast(room);
    }

    public void setMafiaTarget(String code, String hostId, String targetId) {
        Room room = requireHost(code, hostId);
        if (room.getPhase() != Phase.NIGHT) {
            throw badRequest("Can only set Mafia target during the night.");
        }
        Player target = requireTarget(room, targetId);
        if (!target.isAlive()) {
            throw badRequest("Target player is already dead.");
        }
        room.setMafiaTargetId(targetId);
        broadcast(room);
    }

    public void setDoctorTarget(String code, String hostId, String targetId) {
        Room room = requireHost(code, hostId);
        if (room.getPhase() != Phase.NIGHT) {
            throw badRequest("Can only set Doctor target during the night.");
        }
        if (room.getMafiaTargetId() == null && isRoleAlive(room, Role.MAFIA)) {
            throw badRequest("Mafia must choose a kill target before Doctor can protect.");
        }
        Player target = requireTarget(room, targetId);
        if (!target.isAlive()) {
            throw badRequest("Target player is already dead.");
        }
        room.setDoctorTargetId(targetId);
        broadcast(room);
    }

    public void setDetectiveTarget(String code, String hostId, String targetId) {
        Room room = requireHost(code, hostId);
        if (room.getPhase() != Phase.NIGHT) {
            throw badRequest("Can only set Detective target during the night.");
        }
        Player target = requireTarget(room, targetId);
        if (!target.isAlive()) {
            throw badRequest("Target player is already dead.");
        }
        room.setDetectiveTargetId(targetId);
        broadcast(room);
    }

    public void setBodyguardTarget(String code, String hostId, String targetId) {
        Room room = requireHost(code, hostId);
        if (room.getPhase() != Phase.NIGHT) {
            throw badRequest("Can only set Bodyguard target during the night.");
        }
        Player target = requireTarget(room, targetId);
        if (!target.isAlive()) {
            throw badRequest("Target player is already dead.");
        }
        room.setBodyguardTargetId(targetId);
        broadcast(room);
    }

    private boolean isRoleAlive(Room room, Role role) {
        return room.getPlayers().stream()
                .anyMatch(p -> p.isAlive() && p.getRole() == role);
    }

    private boolean hasActiveNightRoles(Room room) {
        return isRoleAlive(room, Role.DOCTOR) ||
               isRoleAlive(room, Role.DETECTIVE) ||
               isRoleAlive(room, Role.BODYGUARD);
    }

    private void resetNightTargets(Room room) {
        room.setMafiaTargetId(null);
        room.setDoctorTargetId(null);
        room.setDetectiveTargetId(null);
        room.setBodyguardTargetId(null);
    }

    public void endGame(String code, String hostId, String winner) {
        Room room = requireHost(code, hostId);
        room.setWinner(winner);
        room.setPhase(Phase.GAME_END);
        room.getLog().add("Game over. Winner: " + winner + ".");
        broadcast(room);
    }

    // ---------------------------------------------------------------- views

    public RoomView publicView(Room room) {
        boolean reveal = room.getPhase() == Phase.GAME_END && room.getConfig().isRevealRolesAtEnd();
        return toView(room, reveal);
    }

    /** God-only view always includes every role. */
    public RoomView godView(String code, String hostId) {
        Room room = requireHost(code, hostId);
        return toView(room, true);
    }

    public RoleView roleView(String code, String playerId) {
        Room room = require(code);
        Player p = room.findPlayer(playerId);
        if (p == null || p.getRole() == null) {
            throw badRequest("No role assigned yet");
        }
        Role r = p.getRole();
        return new RoleView(r.name(), r.getLabel(), r.getDescription(), r.getTeam());
    }

    public Room require(String code) {
        Room room = rooms.get(code == null ? "" : code.toUpperCase());
        if (room == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found");
        return room;
    }

    // ---------------------------------------------------------------- helpers

    private RoomView toView(Room room, boolean includeRoles) {
        List<PlayerView> players = new ArrayList<>();
        for (Player p : room.getPlayers()) {
            String role = includeRoles && p.getRole() != null ? p.getRole().getLabel() : null;
            String team = includeRoles && p.getRole() != null ? p.getRole().getTeam() : null;
            players.add(new PlayerView(p.getId(), p.getName(), p.isHost(), p.isAlive(), p.isReady(), role, team));
        }
        return new RoomView(
                room.getCode(), room.getName(), room.getHostId(),
                room.getPhase().name(), room.getRound(), room.getWinner(),
                room.getConfig(), players, new ArrayList<>(room.getLog()),
                includeRoles ? room.getMafiaTargetId() : null,
                includeRoles ? room.getDoctorTargetId() : null,
                includeRoles ? room.getDetectiveTargetId() : null,
                includeRoles ? room.getBodyguardTargetId() : null,
                room.getMafiaTargetId() != null,
                room.getMafiaTargetId() != null || !isRoleAlive(room, Role.MAFIA)
        );
    }

    private void broadcast(Room room) {
        messaging.convertAndSend("/topic/room/" + room.getCode(), publicView(room));
        messaging.convertAndSend("/topic/god/" + room.getCode(), toView(room, true));
    }

    private void sendRole(String code, Player p) {
        Role r = p.getRole();
        RoleView view = new RoleView(r.name(), r.getLabel(), r.getDescription(), r.getTeam());
        messaging.convertAndSend("/topic/player/" + p.getId(), view);
    }

    private void addN(List<Role> deck, Role role, int n) {
        for (int i = 0; i < n; i++) deck.add(role);
    }

    private Room requireHost(String code, String hostId) {
        Room room = require(code);
        if (!room.getHostId().equals(hostId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can do that");
        }
        return room;
    }

    private Player requireTarget(Room room, String targetId) {
        Player target = room.findPlayer(targetId);
        if (target == null) throw badRequest("Target player not found");
        if (target.isHost()) throw badRequest("Cannot target the host (God).");
        return target;
    }

    private String uniqueCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            code = sb.toString();
        } while (rooms.containsKey(code));
        return code;
    }

    public RoleView submitDetectiveAction(String code, String playerId, String targetId) {
        Room room = require(code);
        if (room.getPhase() != Phase.NIGHT) {
            throw badRequest("Can only perform night actions during the night.");
        }
        Player player = room.findPlayer(playerId);
        if (player == null || !player.isAlive() || player.getRole() != Role.DETECTIVE) {
            throw badRequest("Only an alive Detective can perform this action.");
        }
        Player target = requireTarget(room, targetId);
        room.setDetectiveTargetId(targetId);
        broadcast(room);

        Role r = target.getRole();
        return new RoleView(r.name(), r.getLabel(), r.getDescription(), r.getTeam());
    }

    private static String blankTo(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value.trim();
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}

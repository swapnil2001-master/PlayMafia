package com.playmafia.model;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class Room {
    private String code;
    private String name;
    private String hostId;
    private Phase phase = Phase.WAITING;
    private int round = 0;
    private String winner; // "town" | "mafia" | "jester" | null
    private GameConfig config = new GameConfig();
    private final List<Player> players = new CopyOnWriteArrayList<>();
    private final List<String> log = new CopyOnWriteArrayList<>();

    private String mafiaTargetId;
    private String doctorTargetId;
    private String detectiveTargetId;
    private String bodyguardTargetId;

    public Room() {}

    public String getMafiaTargetId() { return mafiaTargetId; }
    public void setMafiaTargetId(String id) { this.mafiaTargetId = id; }

    public String getDoctorTargetId() { return doctorTargetId; }
    public void setDoctorTargetId(String id) { this.doctorTargetId = id; }

    public String getDetectiveTargetId() { return detectiveTargetId; }
    public void setDetectiveTargetId(String id) { this.detectiveTargetId = id; }

    public String getBodyguardTargetId() { return bodyguardTargetId; }
    public void setBodyguardTargetId(String id) { this.bodyguardTargetId = id; }

    public Room(String code, String name, String hostId) {
        this.code = code;
        this.name = name;
        this.hostId = hostId;
    }

    public Player findPlayer(String id) {
        for (Player p : players) {
            if (p.getId().equals(id)) return p;
        }
        return null;
    }

    public List<Player> alivePlayers() {
        List<Player> alive = new ArrayList<>();
        for (Player p : players) {
            if (p.isAlive()) alive.add(p);
        }
        return alive;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getHostId() { return hostId; }
    public void setHostId(String hostId) { this.hostId = hostId; }

    public Phase getPhase() { return phase; }
    public void setPhase(Phase phase) { this.phase = phase; }

    public int getRound() { return round; }
    public void setRound(int round) { this.round = round; }

    public String getWinner() { return winner; }
    public void setWinner(String winner) { this.winner = winner; }

    public GameConfig getConfig() { return config; }
    public void setConfig(GameConfig config) { this.config = config; }

    public List<Player> getPlayers() { return players; }
    public List<String> getLog() { return log; }
}

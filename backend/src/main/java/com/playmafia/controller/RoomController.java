package com.playmafia.controller;

import com.playmafia.dto.ActionRequest;
import com.playmafia.dto.CreateRoomRequest;
import com.playmafia.dto.JoinResponse;
import com.playmafia.dto.JoinRoomRequest;
import com.playmafia.dto.RoleView;
import com.playmafia.dto.RoomView;
import com.playmafia.model.GameConfig;
import com.playmafia.model.Player;
import com.playmafia.model.Room;
import com.playmafia.service.GameEngineService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final GameEngineService engine;

    public RoomController(GameEngineService engine) {
        this.engine = engine;
    }

    @PostMapping
    public JoinResponse create(@Valid @RequestBody CreateRoomRequest req) {
        Room room = engine.createRoom(req.hostName(), req.roomName());
        return new JoinResponse(room.getCode(), room.getHostId(), true);
    }

    @PostMapping("/{code}/join")
    public JoinResponse join(@PathVariable String code, @Valid @RequestBody JoinRoomRequest req) {
        Player player = engine.joinRoom(code.toUpperCase(), req.name());
        return new JoinResponse(code.toUpperCase(), player.getId(), false);
    }

    @GetMapping("/{code}")
    public RoomView get(@PathVariable String code) {
        return engine.publicView(engine.require(code.toUpperCase()));
    }

    @GetMapping("/{code}/god")
    public RoomView god(@PathVariable String code, @RequestParam String hostId) {
        return engine.godView(code.toUpperCase(), hostId);
    }

    @GetMapping("/{code}/role")
    public RoleView role(@PathVariable String code, @RequestParam String playerId) {
        return engine.roleView(code.toUpperCase(), playerId);
    }

    @PostMapping("/{code}/config")
    public void config(@PathVariable String code, @RequestParam String hostId, @RequestBody GameConfig config) {
        engine.updateConfig(code.toUpperCase(), hostId, config);
    }

    @PostMapping("/{code}/start")
    public void start(@PathVariable String code, @RequestParam String hostId) {
        engine.startGame(code.toUpperCase(), hostId);
    }

    @PostMapping("/{code}/ready")
    public void ready(@PathVariable String code, @RequestParam String playerId) {
        engine.setReady(code.toUpperCase(), playerId);
    }

    @PostMapping("/{code}/kill")
    public void kill(@PathVariable String code, @RequestBody ActionRequest req) {
        engine.kill(code.toUpperCase(), req.hostId(), req.targetId());
    }

    @PostMapping("/{code}/revive")
    public void revive(@PathVariable String code, @RequestBody ActionRequest req) {
        engine.revive(code.toUpperCase(), req.hostId(), req.targetId());
    }

    @PostMapping("/{code}/voteout")
    public void voteOut(@PathVariable String code, @RequestBody ActionRequest req) {
        engine.voteOut(code.toUpperCase(), req.hostId(), req.targetId());
    }

    @PostMapping("/{code}/mafia-target")
    public void mafiaTarget(@PathVariable String code, @RequestBody ActionRequest req) {
        engine.setMafiaTarget(code.toUpperCase(), req.hostId(), req.targetId());
    }

    @PostMapping("/{code}/doctor-target")
    public void doctorTarget(@PathVariable String code, @RequestBody ActionRequest req) {
        engine.setDoctorTarget(code.toUpperCase(), req.hostId(), req.targetId());
    }

    @PostMapping("/{code}/detective-target")
    public void detectiveTarget(@PathVariable String code, @RequestBody ActionRequest req) {
        engine.setDetectiveTarget(code.toUpperCase(), req.hostId(), req.targetId());
    }

    @PostMapping("/{code}/bodyguard-target")
    public void bodyguardTarget(@PathVariable String code, @RequestBody ActionRequest req) {
        engine.setBodyguardTarget(code.toUpperCase(), req.hostId(), req.targetId());
    }

    @PostMapping("/{code}/advance")
    public void advance(@PathVariable String code, @RequestParam String hostId) {
        engine.advancePhase(code.toUpperCase(), hostId);
    }

    @PostMapping("/{code}/end")
    public void end(@PathVariable String code, @RequestParam String hostId, @RequestParam String winner) {
        engine.endGame(code.toUpperCase(), hostId, winner);
    }

    @PostMapping("/{code}/leave")
    public void leave(@PathVariable String code, @RequestParam String playerId) {
        engine.leaveRoom(code.toUpperCase(), playerId);
    }

    @PostMapping("/{code}/actions/detective")
    public RoleView submitDetectiveAction(@PathVariable String code, @RequestBody ActionRequest req) {
        return engine.submitDetectiveAction(code.toUpperCase(), req.hostId(), req.targetId());
    }
}

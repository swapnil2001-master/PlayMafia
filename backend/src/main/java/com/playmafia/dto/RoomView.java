package com.playmafia.dto;

import com.playmafia.model.GameConfig;

import java.util.List;

/** Full public snapshot of a room broadcast to every connected client. */
public record RoomView(
        String code,
        String name,
        String hostId,
        String phase,
        int round,
        String winner,
        GameConfig config,
        List<PlayerView> players,
        List<String> log
) {}

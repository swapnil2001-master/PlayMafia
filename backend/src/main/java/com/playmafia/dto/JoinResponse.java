package com.playmafia.dto;

/** Returned when a player creates or joins a room. Client stores playerId as its identity. */
public record JoinResponse(
        String roomCode,
        String playerId,
        boolean host
) {}

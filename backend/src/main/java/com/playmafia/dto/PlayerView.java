package com.playmafia.dto;

/**
 * Public projection of a player. {@code role} and {@code team} are only populated
 * for the God view or once roles are revealed at game end.
 */
public record PlayerView(
        String id,
        String name,
        boolean host,
        boolean alive,
        boolean ready,
        String role,
        String team
) {}

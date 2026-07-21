package com.playmafia.dto;

/** A single player's private role, delivered only to that player. */
public record RoleView(
        String role,
        String label,
        String description,
        String team
) {}

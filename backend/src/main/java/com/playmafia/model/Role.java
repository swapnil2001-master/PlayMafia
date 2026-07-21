package com.playmafia.model;

/** All assignable roles. VILLAGER is the default filler role. */
public enum Role {
    VILLAGER("Villager", "You win with the town. You have no night action.", "town"),
    MAFIA("Mafia", "Each night, secretly eliminate a townsperson.", "mafia"),
    DOCTOR("Doctor", "Each night, choose one player to protect.", "town"),
    DETECTIVE("Detective", "Each night, investigate one player's alignment.", "town"),
    BODYGUARD("Bodyguard", "Protect a player, taking the hit in their place.", "town"),
    JESTER("Jester", "You win only if the town votes YOU out.", "neutral");

    private final String label;
    private final String description;
    private final String team;

    Role(String label, String description, String team) {
        this.label = label;
        this.description = description;
        this.team = team;
    }

    public String getLabel() { return label; }
    public String getDescription() { return description; }
    public String getTeam() { return team; }
}

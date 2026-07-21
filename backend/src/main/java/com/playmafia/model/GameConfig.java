package com.playmafia.model;

/** Host-chosen role counts and options. Villagers are computed as the remainder. */
public class GameConfig {
    private int mafia = 1;
    private int doctor = 1;
    private int detective = 1;
    private int bodyguard = 0;
    private int jester = 0;
    private boolean anonymousVoting = true;
    private boolean revealRolesAtEnd = true;

    public int getMafia() { return mafia; }
    public void setMafia(int mafia) { this.mafia = mafia; }

    public int getDoctor() { return doctor; }
    public void setDoctor(int doctor) { this.doctor = doctor; }

    public int getDetective() { return detective; }
    public void setDetective(int detective) { this.detective = detective; }

    public int getBodyguard() { return bodyguard; }
    public void setBodyguard(int bodyguard) { this.bodyguard = bodyguard; }

    public int getJester() { return jester; }
    public void setJester(int jester) { this.jester = jester; }

    public boolean isAnonymousVoting() { return anonymousVoting; }
    public void setAnonymousVoting(boolean anonymousVoting) { this.anonymousVoting = anonymousVoting; }

    public boolean isRevealRolesAtEnd() { return revealRolesAtEnd; }
    public void setRevealRolesAtEnd(boolean revealRolesAtEnd) { this.revealRolesAtEnd = revealRolesAtEnd; }

    /** Number of special (non-villager) roles requested. */
    public int specialCount() {
        return mafia + doctor + detective + bodyguard + jester;
    }
}

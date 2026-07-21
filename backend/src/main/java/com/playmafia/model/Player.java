package com.playmafia.model;

public class Player {
    private String id;
    private String name;
    private boolean host;
    private boolean alive = true;
    private boolean ready = false;
    private Role role;

    public Player() {}

    public Player(String id, String name, boolean host) {
        this.id = id;
        this.name = name;
        this.host = host;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isHost() { return host; }
    public void setHost(boolean host) { this.host = host; }

    public boolean isAlive() { return alive; }
    public void setAlive(boolean alive) { this.alive = alive; }

    public boolean isReady() { return ready; }
    public void setReady(boolean ready) { this.ready = ready; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}

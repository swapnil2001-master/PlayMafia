package com.playmafia.model;

/** High-level state machine for a room. */
public enum Phase {
    WAITING,        // lobby, players joining
    CONFIG,         // host configuring roles
    ROLE_REVEAL,    // roles assigned, players viewing their secret role
    NIGHT,          // night actions (God controlled)
    DAY,            // discussion
    VOTING,         // town voting
    RESULT,         // round result shown
    GAME_END        // winner revealed
}

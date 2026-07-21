package com.playmafia.dto;

/** Generic God action carrying the acting host and a target player. */
public record ActionRequest(
        String hostId,
        String targetId
) {}

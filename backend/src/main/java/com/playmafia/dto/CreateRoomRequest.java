package com.playmafia.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateRoomRequest(
        @NotBlank String hostName,
        String roomName
) {}

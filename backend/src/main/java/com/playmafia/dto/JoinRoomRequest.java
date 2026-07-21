package com.playmafia.dto;

import jakarta.validation.constraints.NotBlank;

public record JoinRoomRequest(
        @NotBlank String name
) {}

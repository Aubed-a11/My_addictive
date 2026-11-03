package bj.myaddictive.live.dto;

import jakarta.validation.constraints.NotNull;

public record VoterSondageRequest(@NotNull Long optionId) {}

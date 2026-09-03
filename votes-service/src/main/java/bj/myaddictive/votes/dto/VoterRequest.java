package bj.myaddictive.votes.dto;

import jakarta.validation.constraints.NotNull;

public record VoterRequest(@NotNull Long candidatId) {}

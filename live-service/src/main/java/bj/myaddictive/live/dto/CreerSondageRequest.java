package bj.myaddictive.live.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreerSondageRequest(
        @NotBlank String question,
        @Size(min = 2, message = "Un sondage doit proposer au moins 2 options.") List<String> options
) {}

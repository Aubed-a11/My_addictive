package bj.myaddictive.live.dto;

import java.util.List;

public record SondageResultat(
        Long sondageId,
        Long evenementId,
        String question,
        boolean actif,
        long totalVotes,
        List<OptionResultat> options,
        Long optionVoteeParMoi
) {}

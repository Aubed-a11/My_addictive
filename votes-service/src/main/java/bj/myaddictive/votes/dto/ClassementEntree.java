package bj.myaddictive.votes.dto;

/**
 * Une ligne du classement pondere (section 7.1) : combine le vote du
 * public et la note du jury selon les ponderations de la competition.
 */
public record ClassementEntree(
        Long candidatId,
        String nom,
        long nombreVotes,
        Double noteJury,
        double scoreFinal
) {}

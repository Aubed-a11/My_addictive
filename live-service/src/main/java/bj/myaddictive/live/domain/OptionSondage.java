package bj.myaddictive.live.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "option_sondage")
public class OptionSondage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sondage_id", nullable = false)
    private Long sondageId;

    @Column(nullable = false)
    private String texte;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSondageId() { return sondageId; }
    public void setSondageId(Long sondageId) { this.sondageId = sondageId; }
    public String getTexte() { return texte; }
    public void setTexte(String texte) { this.texte = texte; }
}

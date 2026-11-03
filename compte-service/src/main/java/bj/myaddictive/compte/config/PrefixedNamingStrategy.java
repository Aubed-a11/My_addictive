package bj.myaddictive.compte.config;

import org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy;
import org.hibernate.boot.model.naming.Identifier;
import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment;

/**
 * Base de donnees unique (SQLite) partagee par tous les services : chaque
 * service prefixe ses tables ("compte_") pour qu'elles restent distinctes et
 * identifiables dans le fichier commun (ex. compte_titre, compte_utilisateur...).
 */
public class PrefixedNamingStrategy extends CamelCaseToUnderscoresNamingStrategy {
    private static final String PREFIXE = "compte_";

    private static Identifier prefixer(Identifier base) {
        if (base == null) return null;
        String texte = base.getText();
        if (texte.startsWith(PREFIXE)) return base;
        return Identifier.toIdentifier(PREFIXE + texte, base.isQuoted());
    }

    @Override
    public Identifier toPhysicalTableName(Identifier name, JdbcEnvironment context) {
        return prefixer(super.toPhysicalTableName(name, context));
    }

    @Override
    public Identifier toPhysicalSequenceName(Identifier name, JdbcEnvironment context) {
        return prefixer(super.toPhysicalSequenceName(name, context));
    }
}

#!/usr/bin/env python3
"""Migration des anciennes bases H2 (une par service) vers la base SQLite unique.

Deux commandes :
  python3 migrer_h2_sqlite.py sql <service>            -> ecrit sur stdout les ordres H2 "CSVWRITE"
                                                          qui exportent les tables du service en CSV
  python3 migrer_h2_sqlite.py importer <base.db> <dossier_csv>
                                                       -> remplace le contenu des tables SQLite par
                                                          les donnees exportees (seules les colonnes
                                                          qui existent encore dans SQLite sont reprises)
"""
import csv, os, re, sqlite3, sys

TABLES = {
    'compte':    ['utilisateur', 'code_verification', 'favori'],
    'media':     ['article', 'offre_promotion'],
    'musique':   ['album', 'titre', 'achat', 'ecoute'],
    'live':      ['chaine', 'evenement', 'podcast', 'billet', 'abonnement_chaine', 'abonnement_fan_club',
                  'abonnement_podcast', 'sondage', 'option_sondage', 'sondage_vote'],
    'votes':     ['competition', 'candidat', 'portefeuille', 'mouvement_portefeuille', 'vote'],
    'boutique':  ['vendeur', 'produit', 'commande', 'ligne_commande', 'panier_item'],
    'paiement':  ['transaction'],
}
NUL = '__NULL__'


def commande_sql(service):
    for t in TABLES[service]:
        # "TRANSACTION" etc. sont des noms courants : on les met entre guillemets
        print(f"CALL CSVWRITE('/out/{service}__{t}.csv', 'SELECT * FROM \"{t.upper()}\"', 'charset=UTF-8 nullString={NUL}');")


def normaliser(valeur, type_sql):
    if valeur is None:
        return None
    t = (type_sql or '').lower()
    if 'bit' in t or 'bool' in t:
        return 1 if valeur.strip().upper() in ('TRUE', '1', 'T') else 0
    if 'timestamp' in t or 'datetime' in t:
        v = valeur.strip().replace('T', ' ')
        v = re.sub(r'(Z|[+-]\d\d(:?\d\d)?)$', '', v)      # fuseau eventuel
        m = re.match(r'^(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d)(?:\.(\d+))?$', v)
        if m:
            frac = (m.group(2) or '0')[:3].ljust(3, '0')
            return f'{m.group(1)}.{frac}'
        return v
    if any(k in t for k in ('int', 'bigint')):
        try:
            return int(valeur)
        except ValueError:
            return valeur
    if any(k in t for k in ('double', 'float', 'real', 'numeric', 'decimal')):
        try:
            return float(valeur)
        except ValueError:
            return valeur
    return valeur


def importer(base, dossier):
    con = sqlite3.connect(base, timeout=60)
    con.execute('PRAGMA busy_timeout=60000')
    total = 0
    for service, tables in TABLES.items():
        for t in tables:
            fichier = os.path.join(dossier, f'{service}__{t}.csv')
            cible = f'{service}_{t}'
            if not os.path.isfile(fichier):
                print(f'  - {cible}: pas de fichier exporte, ignore')
                continue
            colonnes = {r[1].lower(): r[2] for r in con.execute(f'PRAGMA table_info("{cible}")')}
            if not colonnes:
                print(f'  ! {cible}: table absente de SQLite (services pas encore demarres ?), ignore')
                continue
            with open(fichier, newline='', encoding='utf-8') as f:
                lecteur = csv.reader(f)
                entete = next(lecteur, None)
                if not entete:
                    print(f'  - {cible}: fichier vide')
                    continue
                noms = [h.strip().lower() for h in entete]
                utiles = [(i, n) for i, n in enumerate(noms) if n in colonnes]
                ignorees = [n for n in noms if n not in colonnes]
                lignes = []
                for ligne in lecteur:
                    if not ligne:
                        continue
                    lignes.append([normaliser(None if ligne[i] == NUL else ligne[i], colonnes[n]) for i, n in utiles])
            con.execute(f'DELETE FROM "{cible}"')
            if lignes:
                cols = ', '.join(f'"{n}"' for _, n in utiles)
                marques = ', '.join('?' for _ in utiles)
                con.executemany(f'INSERT OR REPLACE INTO "{cible}" ({cols}) VALUES ({marques})', lignes)
            con.commit()
            total += len(lignes)
            extra = f' (colonnes abandonnees : {", ".join(ignorees)})' if ignorees else ''
            print(f'  + {cible}: {len(lignes)} lignes{extra}')
    con.execute('PRAGMA wal_checkpoint(TRUNCATE)')
    con.close()
    print(f'Termine : {total} lignes reprises.')


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == 'sql':
        commande_sql(sys.argv[2])
    elif len(sys.argv) == 4 and sys.argv[1] == 'importer':
        importer(sys.argv[2], sys.argv[3])
    else:
        print(__doc__); sys.exit(1)

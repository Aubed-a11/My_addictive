-- Cree une base PostgreSQL par microservice (pattern "database per service", section 21.4).
-- Execute automatiquement au premier demarrage du conteneur postgres (docker-entrypoint-initdb.d).
CREATE DATABASE compte_db;
CREATE DATABASE media_db;
CREATE DATABASE musique_db;
CREATE DATABASE live_db;
CREATE DATABASE votes_db;
CREATE DATABASE boutique_db;
CREATE DATABASE paiement_db;

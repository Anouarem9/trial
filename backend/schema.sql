-- Reference schema. The Spring Boot app creates these tables automatically
-- (spring.jpa.hibernate.ddl-auto=update). Run this only if you want to
-- provision the database manually.

CREATE DATABASE IF NOT EXISTS gestion_tournois CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_tournois;

CREATE TABLE IF NOT EXISTS tournois (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    lieu VARCHAR(255),
    date_debut DATE NOT NULL,
    date_fin DATE,
    nombre_equipes INT NOT NULL DEFAULT 8,
    statut VARCHAR(20) NOT NULL DEFAULT 'A_VENIR',
    description TEXT
);

CREATE TABLE IF NOT EXISTS equipes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    ville VARCHAR(255),
    entraineur VARCHAR(255),
    logo_url VARCHAR(500),
    tournoi_id BIGINT,
    CONSTRAINT fk_equipe_tournoi FOREIGN KEY (tournoi_id) REFERENCES tournois(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS joueurs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    numero INT,
    poste VARCHAR(20),
    date_naissance DATE,
    equipe_id BIGINT,
    CONSTRAINT fk_joueur_equipe FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tournoi_id BIGINT NOT NULL,
    equipe1_id BIGINT,
    equipe2_id BIGINT,
    score_equipe1 INT,
    score_equipe2 INT,
    date_match DATETIME,
    lieu VARCHAR(255),
    round INT NOT NULL,
    position INT NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'A_VENIR',
    CONSTRAINT fk_match_tournoi FOREIGN KEY (tournoi_id) REFERENCES tournois(id) ON DELETE CASCADE,
    CONSTRAINT fk_match_equipe1 FOREIGN KEY (equipe1_id) REFERENCES equipes(id) ON DELETE SET NULL,
    CONSTRAINT fk_match_equipe2 FOREIGN KEY (equipe2_id) REFERENCES equipes(id) ON DELETE SET NULL
);

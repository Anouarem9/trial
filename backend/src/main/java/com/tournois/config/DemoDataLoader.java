package com.tournois.config;

import com.tournois.entity.Equipe;
import com.tournois.entity.Joueur;
import com.tournois.entity.Matche;
import com.tournois.entity.Tournoi;
import com.tournois.repository.EquipeRepository;
import com.tournois.repository.JoueurRepository;
import com.tournois.repository.MatcheRepository;
import com.tournois.repository.TournoiRepository;
import com.tournois.service.BracketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DemoDataLoader implements CommandLineRunner {

    private final TournoiRepository tournoiRepo;
    private final EquipeRepository equipeRepo;
    private final JoueurRepository joueurRepo;
    private final MatcheRepository matcheRepo;
    private final BracketService bracketService;

    private final Random rng = new Random(42);

    @Override
    @Transactional
    public void run(String... args) {
        if (tournoiRepo.count() > 0) {
            log.info("Demo data already present, skipping.");
            return;
        }

        log.info("Seeding demo data…");
        LocalDate today = LocalDate.now();

        // ---- Create independent teams ----
        String[][] topClubs = {
            {"Wydad AC", "Casablanca", "Faouzi Benzarti", "https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Wydad_AC_logo.svg/200px-Wydad_AC_logo.svg.png"},
            {"Raja CA", "Casablanca", "Sa Pinto", "https://upload.wikimedia.org/wikipedia/en/thumb/9/9d/Raja_Club_Athletic_Logo.svg/200px-Raja_Club_Athletic_Logo.svg.png"},
            {"ES Tunis", "Tunis", "Nabil Maâloul", "https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/ES_Tunis_%28logo%29.svg/200px-ES_Tunis_%28logo%29.svg.png"},
            {"USM Alger", "Alger", "Abdelhak Benchikha", "https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/USM_Alger_%28logo%29.svg/200px-USM_Alger_%28logo%29.svg.png"},
            {"MC Alger", "Alger", "Patrice Beaumelle", "https://upload.wikimedia.org/wikipedia/en/thumb/0/02/Mouloudia_Club_d%27Alger_logo.svg/200px-Mouloudia_Club_d%27Alger_logo.svg.png"},
            {"AS FAR", "Rabat", "Alexandre Santos", "https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/AS_FAR_%28logo%29.svg/200px-AS_FAR_%28logo%29.svg.png"},
            {"CS Sfaxien", "Sfax", "Lassaad Dridi", "https://upload.wikimedia.org/wikipedia/en/thumb/b/b6/CS_Sfaxien_%28logo%29.svg/200px-CS_Sfaxien_%28logo%29.svg.png"},
            {"CR Belouizdad", "Alger", "Marcos Paquetá", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/CR_Belouizdad.svg/200px-CR_Belouizdad.svg.png"},
        };
        List<Equipe> topTeams = new ArrayList<>();
        for (String[] t : topClubs) {
            Equipe e = newEquipe(t[0], t[1], t[2], t[3]);
            seedPlayers(e, true);
            topTeams.add(e);
        }

        String[][] univClubs = {
            {"FSJES Rabat", "Rabat", "Karim Mokhtari"},
            {"ENSA Marrakech", "Marrakech", "Yassine El Idrissi"},
            {"FST Settat", "Settat", "Omar Bennani"},
            {"ENCG Tanger", "Tanger", "Mehdi Ait Ali"},
        };
        List<Equipe> univTeams = new ArrayList<>();
        for (String[] t : univClubs) {
            Equipe e = newEquipe(t[0], t[1], t[2], null);
            seedPlayers(e, false);
            univTeams.add(e);
        }

        String[][] quartiersClubs = {
            {"FC Tabriquet", "Salé", "Hamza Idrissi"},
            {"AS Bettana", "Salé", "Tarik Bouzid"},
            {"Hay Salam SC", "Salé", "Younes Saidi"},
            {"Médina FC", "Salé", "Anas Tazi"},
            {"FC Bouknadel", "Salé", "Rachid El Khalfi"},
            {"AS Sidi Moussa", "Salé", "Hicham Belmir"},
            {"Olympique Karia", "Salé", "Driss El Alami"},
            {"Atletico Souissi", "Rabat", "Saad Lamrini"},
        };
        List<Equipe> quartiersTeams = new ArrayList<>();
        for (String[] t : quartiersClubs) {
            Equipe e = newEquipe(t[0], t[1], t[2], null);
            seedPlayers(e, false);
            quartiersTeams.add(e);
        }

        // ---- Tournament 1: Coupe du Maghreb, 8 top teams, bracket already running ----
        Tournoi coupe = newTournoi("Coupe du Maghreb 2026", "Stade Mohammed V, Casablanca",
                today.minusDays(7), today.plusDays(7), 8,
                "Tournoi régional opposant les meilleures équipes du Maghreb.");
        register(coupe, topTeams);

        var matches = bracketService.generate(coupe.getId());
        scheduleMatches(matches, "Stade Mohammed V, Casablanca");
        var firstRound = matches.stream().filter(m -> m.getRound() == 1).toList();
        int[][] scores = {{2, 1}, {0, 3}, {1, 2}, {4, 2}};
        for (int i = 0; i < firstRound.size() && i < scores.length; i++) {
            bracketService.setScore(firstRound.get(i).getId(), scores[i][0], scores[i][1]);
        }

        // ---- Tournament 2: Coupe Universitaire, 4 university teams, upcoming ----
        Tournoi univ = newTournoi("Coupe Universitaire 2026", "Complexe sportif universitaire, Rabat",
                today.plusDays(15), today.plusDays(22), 4,
                "Compétition inter-facultés.");
        register(univ, univTeams);

        // ---- Tournament 3: Tournoi des Quartiers, 8 neighborhood teams, upcoming ----
        Tournoi quartiers = newTournoi("Tournoi des Quartiers", "Terrain municipal, Salé",
                today.plusDays(3), today.plusDays(20), 8,
                "Tournoi amical estival.");
        register(quartiers, quartiersTeams);

        // ---- Bonus: register 2 top teams into the Quartiers tournament to show team reuse ----
        // (showing that a team can appear in multiple tournaments)
        // We won't actually trigger any matches; just illustrates the M2M model.
        // Skipped to keep team counts matching tournament size.

        log.info("Demo data seeded: {} tournois, {} équipes (indépendantes), {} joueurs",
                tournoiRepo.count(), equipeRepo.count(), joueurRepo.count());
    }

    private Tournoi newTournoi(String nom, String lieu, LocalDate debut, LocalDate fin, int nb, String desc) {
        Tournoi t = new Tournoi();
        t.setNom(nom);
        t.setLieu(lieu);
        t.setDateDebut(debut);
        t.setDateFin(fin);
        t.setNombreEquipes(nb);
        t.setStatut(Tournoi.StatutTournoi.A_VENIR);
        t.setDescription(desc);
        return tournoiRepo.save(t);
    }

    private Equipe newEquipe(String nom, String ville, String entraineur, String logoUrl) {
        Equipe e = new Equipe();
        e.setNom(nom);
        e.setVille(ville);
        e.setEntraineur(entraineur);
        if (logoUrl != null && !logoUrl.isBlank()) e.setLogoUrl(logoUrl);
        return equipeRepo.save(e);
    }

    private void register(Tournoi t, List<Equipe> equipes) {
        for (Equipe e : equipes) t.getEquipes().add(e);
        tournoiRepo.save(t);
    }

    private void scheduleMatches(List<Matche> matches, String lieu) {
        LocalDateTime kickoff = LocalDateTime.now().withMinute(0).withSecond(0).withNano(0).plusHours(2);
        int hourStep = 0;
        for (Matche m : matches) {
            m.setDateMatch(kickoff.plusHours(hourStep));
            m.setLieu(lieu);
            matcheRepo.save(m);
            hourStep += 3;
        }
    }

    private void seedPlayers(Equipe equipe, boolean topTier) {
        String[][] roster = {
            {"Bono",      "Yassine",   "MAR"},
            {"Hakimi",    "Achraf",    "MAR"},
            {"Saiss",     "Romain",    "MAR"},
            {"Mazraoui",  "Noussair",  "MAR"},
            {"Aguerd",    "Nayef",     "MAR"},
            {"Amrabat",   "Sofyan",    "MAR"},
            {"Ounahi",    "Azzedine",  "MAR"},
            {"Amallah",   "Selim",     "MAR"},
            {"Ziyech",    "Hakim",     "MAR"},
            {"En-Nesyri", "Youssef",   "MAR"},
            {"Boufal",    "Sofiane",   "MAR"},
        };
        Joueur.Poste[] postes = {
            Joueur.Poste.GARDIEN,
            Joueur.Poste.DEFENSEUR, Joueur.Poste.DEFENSEUR, Joueur.Poste.DEFENSEUR, Joueur.Poste.DEFENSEUR,
            Joueur.Poste.MILIEU, Joueur.Poste.MILIEU, Joueur.Poste.MILIEU,
            Joueur.Poste.ATTAQUANT, Joueur.Poste.ATTAQUANT, Joueur.Poste.ATTAQUANT
        };
        List<Joueur> joueurs = new ArrayList<>();
        for (int i = 0; i < 11; i++) {
            Joueur j = new Joueur();
            j.setNom(roster[i][0] + suffix(equipe.getId(), i));
            j.setPrenom(roster[i][1]);
            j.setNationalite(roster[i][2]);
            j.setNumero(i + 1);
            j.setPoste(postes[i]);
            j.setDateNaissance(LocalDate.of(1995 + (i % 8), 1 + (i % 12), 1 + (i % 28)));

            j.setMatchsJoues(5 + rng.nextInt(25));
            j.setCartonsJaunes(rng.nextInt(6));
            j.setCartonsRouges(rng.nextDouble() < 0.15 ? 1 : 0);

            switch (postes[i]) {
                case GARDIEN -> {
                    j.setButs(0);
                    j.setPassesDecisives(rng.nextInt(2));
                }
                case DEFENSEUR -> {
                    j.setButs(rng.nextInt(4));
                    j.setPassesDecisives(rng.nextInt(5));
                }
                case MILIEU -> {
                    j.setButs(rng.nextInt(8));
                    j.setPassesDecisives(rng.nextInt(12));
                }
                case ATTAQUANT -> {
                    j.setButs(5 + rng.nextInt(20));
                    j.setPassesDecisives(rng.nextInt(10));
                }
            }
            j.setEquipe(equipe);
            joueurs.add(j);
        }
        joueurRepo.saveAll(joueurs);
    }

    private String suffix(Long teamId, int playerIdx) {
        char a = (char) ('A' + (int) (teamId % 26));
        return " " + a + (playerIdx + 1);
    }
}

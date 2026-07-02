# Gestion des Tournois (Football)

Application web de gestion de tournois de football à élimination directe.

**Stack** : Spring Boot 3 · MySQL 8 · React 18 (Vite)

## Structure

```
Gestion des tournois/
├── backend/      Spring Boot REST API (Java 17)
│   ├── pom.xml
│   ├── schema.sql                  (référence — créé auto par Hibernate)
│   └── src/main/java/com/tournois/
│       ├── entity/                 (Tournoi, Equipe, Joueur, Matche)
│       ├── repository/             (Spring Data JPA)
│       ├── service/                (BracketService — élimination directe)
│       ├── controller/             (REST /api/...)
│       ├── dto/                    (MatcheDTO, EquipeSummary, ScoreUpdate)
│       └── config/                 (CORS, gestion d'erreurs)
└── frontend/     React + Vite
    └── src/
        ├── api.js                  (client axios)
        ├── App.jsx                 (routing)
        ├── components/             (Modal)
        └── pages/                  (Dashboard, Tournois, Equipes, Joueurs…)
```

## Pré-requis

- **Java 17+** et **Maven 3.8+**
- **Node.js 18+** et **npm**
- **MySQL 8+** lancé sur `localhost:3306` (user `root`, mot de passe vide)

> Le backend utilise le driver officiel **MySQL Connector/J** (`com.mysql:mysql-connector-j`).
> Attention : XAMPP fournit MariaDB (pas MySQL). Pour utiliser un vrai serveur MySQL,
> arrêtez le module MySQL de XAMPP puis démarrez le service MySQL (`net start MySQL97`
> dans un terminal administrateur, si MySQL Server est installé en service Windows).

Si vos identifiants MySQL diffèrent, modifiez [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties).

## Lancer le backend

```powershell
cd backend
mvn spring-boot:run
```

L'API démarre sur **http://localhost:8080**. La base `gestion_tournois` et toutes les tables sont créées automatiquement au premier lancement.

### Endpoints REST

| Méthode | URL | Description |
|---|---|---|
| GET / POST | `/api/tournois` | Liste / créer un tournoi |
| GET / PUT / DELETE | `/api/tournois/{id}` | Détail / modifier / supprimer |
| GET | `/api/tournois/{id}/matches` | Tableau (bracket) du tournoi |
| POST | `/api/tournois/{id}/bracket` | Générer le tableau d'élimination directe |
| GET / POST | `/api/equipes?tournoiId=` | Liste / créer une équipe |
| GET / PUT / DELETE | `/api/equipes/{id}` | Détail / modifier / supprimer |
| GET / POST | `/api/joueurs?equipeId=` | Liste / créer un joueur |
| GET / PUT / DELETE | `/api/joueurs/{id}` | Détail / modifier / supprimer |
| PUT | `/api/matches/{id}/score` | Saisir un score `{ scoreEquipe1, scoreEquipe2 }` |
| PUT | `/api/matches/{id}/programmation` | Programmer un match `{ dateMatch, lieu }` |

## Lancer le frontend

```powershell
cd frontend
npm install
npm run dev
```

L'app est servie sur **http://localhost:5173**. Vite proxifie automatiquement `/api/*` vers le backend Spring Boot.

## Utilisation

1. **Créer un tournoi** depuis l'onglet *Tournois* (choisir un nombre d'équipes en puissance de 2 : 2, 4, 8, 16, 32).
2. **Créer des équipes** dans l'onglet *Équipes*, en sélectionnant le tournoi correspondant.
3. **Ajouter des joueurs** depuis la page détail d'une équipe.
4. Lorsque le nombre d'équipes inscrites = nombre d'équipes du tournoi, cliquer sur **« Générer le tableau »** dans la page détail du tournoi.
5. **Cliquer sur un match** dans le bracket pour saisir le score. Le gagnant avance automatiquement au tour suivant.
6. À l'issue de la finale, le tournoi passe au statut **Terminé**.

## Règles d'élimination directe

- Le nombre d'équipes doit être une puissance de 2.
- Les égalités sont interdites — saisissez impérativement un vainqueur.
- Les équipes sont tirées au sort à la génération du tableau.
- Régénérer le tableau efface tous les résultats précédents.
"# trial" 

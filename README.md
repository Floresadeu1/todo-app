# Mes tâches — application To-Do (INF562)

Application **Next.js** de gestion de tâches organisées par **projets**. Toutes les données sont
enregistrées **dans le navigateur, avec IndexedDB**. L'application est testée en **BDD**
(Cucumber + Playwright), avec des **tests unitaires**, des **tests de performance Grafana k6 Browser**,
et une **intégration continue GitHub Actions** qui lance les tests à chaque push.

![Tests](https://github.com/Floresadeu1/todo-app/actions/workflows/tests.yml/badge.svg)

## Fonctionnalités

| Projets | Tâches |
|---|---|
| Créer un projet (nom obligatoire, 50 caractères max., pas de doublon, casse ignorée) | Ajouter une tâche dans un projet (titre obligatoire, 100 caractères max.) |
| Renommer un projet (Entrée = enregistrer, Échap = annuler) | Modifier le titre et/ou changer la tâche de projet |
| Supprimer un projet **vide** (refusé s'il contient des tâches) | Marquer une tâche terminée / non terminée |
| Filtrer : un projet ou « Tous les projets » | Supprimer une tâche |
| Badge du nombre de tâches restantes par projet | **Annuler** une suppression pendant 6 secondes |

Le compteur « N tâches restantes » correspond **toujours à la vue affichée**.

## Lancer l'application

```bash
npm install
npm run dev          # http://localhost:3000
```

## Architecture

```
app/                 page Next.js (App Router)
components/          TodoApp (état + logique d'écran), BarreProjets, SectionTaches, Notification
lib/regles.js        règles métier PURES (validations, compteur) — testées unitairement
lib/db.js            accès à IndexedDB (base "todo-db", magasins "projets" et "taches")
features/            scénarios BDD en français (Gherkin) + étapes + page object
tests/               tests unitaires (node:test)
k6/                  tests de performance k6 Browser
.github/workflows/   intégration continue
```

**IndexedDB** : base `todo-db` (version 1).

- Le magasin `projets` a la clé `id` en auto-incrément et un index **unique** `nomNormalise`, qui sert de filet de sécurité contre les doublons.
- Le magasin `taches` a la clé `id` en auto-incrément et un index `projetId`, qui sert à compter les tâches d'un projet.
- Une écriture n'est considérée comme terminée qu'au `oncomplete` de sa transaction.

## Les tests

### Pyramide des tests

| Niveau | Outil | Nombre | Durée |
|---|---|---|---|
| Unitaires (règles métier) | `node:test` | 26 tests | < 1 s |
| Acceptation / bout en bout (BDD) | Cucumber.js 12 + Playwright | 41 scénarios, 256 étapes | ≈ 1 min |
| Performance | Grafana k6 Browser | 1 à 5 navigateurs + 4 volumes | ≈ 1 min |

```bash
npm run test:unitaires   # tests unitaires seuls
npm test                 # unitaires + build + démarrage du serveur + 41 scénarios BDD
```

Le rapport HTML Cucumber est écrit dans `rapports/cucumber.html`.

### Tests BDD (`features/`)

Les scénarios sont écrits en français (`# language: fr`) et répartis dans 4 fichiers :

- `projets.feature` (17 scénarios) : création, ordre alphabétique, renommage, suppression, annulation.
- `taches.feature` (15 scénarios) : ajout, modification, déplacement, terminée / non terminée, suppression, annulation, délai d'annulation.
- `vues.feature` (5 scénarios) : filtres, compteur, badges, projet proposé par défaut.
- `persistance.feature` (4 scénarios) : les données sont bien dans IndexedDB et survivent à un rechargement.

**Techniques du cours utilisées :**

- **Classes d'équivalence** : nom vide, doublon exact, doublon avec une autre casse (`Scénario: Plan`).
- **Valeurs limites** : 1 / 50 / 51 caractères pour un projet et 1 / 100 / 101 pour une tâche, avec les tags `@limites`.
- **Deux niveaux d'oracle** :
  - ce que l'utilisateur **voit** à l'écran ;
  - ce qui est **réellement enregistré** : lecture directe d'IndexedDB dans `persistance.feature`.
- **Isolation (F.I.R.S.T.)** : chaque scénario a un **nouveau contexte de navigateur**, donc un IndexedDB vide. Aucun scénario ne dépend d'un autre.
- **Pas de test instable (flaky)** :
  - aucune attente fixe (`sleep`) : on attend que le résultat apparaisse ;
  - le scénario des 6 secondes utilise une **horloge simulée** (`page.clock`, tag `@horloge`) : il est instantané et déterministe.
- **Page object** (`features/support/page-todo.js`) : tous les sélecteurs (`data-testid`) sont à un seul endroit.
- **Testabilité** :
  - l'attribut `data-pret` indique que les données sont chargées ;
  - `window.todoEcrituresEnCours` indique qu'il n'y a plus d'écriture en cours avant un rechargement.

### Tests unitaires (`tests/regles.test.mjs`)

Ils testent `lib/regles.js` sans navigateur. Les limites (50 et 100) sont écrites **en dur, d'après
la spécification**, et ne sont pas lues dans les constantes du code. Si le code contenait par erreur
`TITRE_MAX = 101`, un test basé sur `TITRE_MAX + 1` serait faux lui aussi et passerait quand même :
**l'oracle ne doit pas venir du code testé.** Ce point a été vérifié avec 5 mutants faits à la main,
tous détectés.

## Tests de performance — Grafana k6 Browser (`k6/`)

k6 pilote de **vrais navigateurs Chromium**. Les durées mesurées vont de l'action jusqu'à ce que son
**effet soit visible** (aucun `waitForTimeout`).

**Installation de k6** (une seule fois) :

- Windows : `winget install k6 --source winget`
- macOS : `brew install k6`

Lancement :

```bash
npm run build
npm start                         # terminal 1 : application en production

# terminal 2 :
npm run perf:parcours             # parcours utilisateur, 1 navigateur
k6 run -e VUS=5 k6/parcours.js    # 5 navigateurs en même temps
npm run perf:benchmark            # 1 000 / 2 000 / 5 000 / 10 000 tâches
```

Sous PowerShell, pour enchaîner de 1 à 5 navigateurs :
`1..5 | ForEach-Object { k6 run -e VUS=$_ k6/parcours.js }`

### 1. Parcours utilisateur (`k6/parcours.js`) — 1 à 5 navigateurs

Chaque navigateur fait 2 fois le parcours complet :

1. ouvrir l'application ;
2. créer un projet ;
3. ajouter 10 tâches ;
4. en terminer une, en modifier une, en supprimer une ;
5. recharger la page.

Des vérifications contrôlent ensuite que les données sont conservées.

**Seuils de réussite** :

- 100 % des vérifications réussies ;
- p(95) de l'ajout d'une tâche < 1 s ;
- p(95) du chargement < 5 s.

Chaque navigateur a son propre IndexedDB : c'est le cas réel, puisque chaque utilisateur a ses
données dans son navigateur. La montée de 1 à 5 navigateurs mesure donc surtout la charge sur le
serveur Next.js qui sert les pages, et sur la machine.

### 2. Benchmark de volume (`k6/benchmark.js`)

Pour chaque volume N, on mesure les 4 opérations à deux niveaux :

- **le niveau données** : les opérations directement dans IndexedDB ;
- **le niveau écran** : ce que l'utilisateur vit quand la liste contient déjà N tâches.

Résultats sur la machine de développement (durées en ms) :

| Opération | 1 000 | 2 000 | 5 000 | 10 000 |
|---|---:|---:|---:|---:|
| IndexedDB : insérer N tâches | 57 | 130 | 281 | 647 |
| IndexedDB : lire N tâches | 8 | 14 | 29 | 56 |
| IndexedDB : modifier N tâches | 68 | 167 | 345 | 721 |
| IndexedDB : supprimer N tâches | 54 | 109 | 241 | 605 |
| Écran : afficher N tâches (rechargement) | 249 | 357 | 698 | 1 146 |
| Écran : ajouter 1 tâche parmi N | 329 | 389 | 632 | 1 072 |
| Écran : cocher 1 tâche parmi N | 214 | 261 | 364 | 544 |
| Écran : supprimer 1 tâche parmi N | 266 | 308 | 444 | 815 |

**Analyse :**

- **IndexedDB n'est pas le goulot d'étranglement.** Les opérations sont à peu près **linéaires** : environ ×10 entre 1 000 et 10 000 tâches. Lire 10 000 tâches prend environ 50 ms.
- **Le coût vient de l'écran.** Après chaque action, l'application **relit toute la base** (`recharger()`) et React **réaffiche toute la liste**. Ajouter **une seule** tâche coûte donc environ 0,3 s avec 1 000 tâches, et environ 1 s avec 10 000 : ce coût est proportionnel à N, pas constant.
- **Améliorations possibles :**
  - mettre à jour seulement l'élément modifié dans l'état React, au lieu de tout relire ;
  - ne rendre que les lignes visibles (virtualisation de la liste) ;
  - paginer ou trier par projet avec l'index `projetId`.

Les résultats détaillés sont écrits dans `rapports/` : `k6-benchmark.txt` et les fichiers JSON.

## Intégration continue (`.github/workflows/tests.yml`)

À **chaque push** et à chaque pull request, GitHub Actions lance deux jobs :

1. **Tests unitaires et BDD** :
   1. `npm ci` ;
   2. installation de Chromium ;
   3. `npm test`.

   Le rapport Cucumber est publié en artefact, **même en cas d'échec**.
2. **Performance (k6 Browser)** : ce job ne démarre que si le premier est vert.
   1. Build de l'application.
   2. Parcours avec 1, 2, 3, 4 puis 5 navigateurs.
   3. Benchmark complet.

   Les résultats sont publiés en artefact. Si un seuil k6 n'est pas respecté, le job échoue.

## Limites connues et écarts avec la spécification

- **Accents** : « Étude » et « Etude » sont considérés comme **deux projets différents**, car la normalisation ignore la casse mais pas les accents. Ce comportement est volontaire et documenté par un test unitaire. Il serait à confirmer avec le client.
- **Données locales** : les données sont propres à **un navigateur sur une machine**. Elles ne sont ni synchronisées entre appareils, ni sauvegardées sur un serveur. Vider les données du site efface tout.
- **Gros volumes** : au-delà de quelques milliers de tâches, chaque action sur l'écran ralentit (voir l'analyse du benchmark).
- Les tests BDD ne tournent que sur **Chromium**. Ils pourraient être étendus à Firefox et WebKit avec Playwright.

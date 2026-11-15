// tests/regles.test.mjs
// Tests UNITAIRES des règles métier (lib/regles.js), avec l'outil de test intégré à Node.
// Bas de la pyramide : pas de navigateur, pas d'IndexedDB, des millisecondes par test.
// Lancer : npm run test:unitaires

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  normaliser,
  texteCompteur,
  validerProjet,
  validerSuppressionProjet,
  validerTache,
} from "../lib/regles.js";

// IMPORTANT : les limites viennent de la SPÉCIFICATION, écrites en dur dans les tests.
// Si on utilisait les constantes du code (TITRE_MAX + 1), un code faux (TITRE_MAX = 101)
// serait « vérifié » par un test tout aussi faux : l'oracle ne doit pas venir du code testé.
const NOM_PROJET_MAX_SPEC = 50;
const TITRE_MAX_SPEC = 100;

// Jeu de données commun : deux projets existants
const ETUDE = { id: 1, nom: "Etude", nomNormalise: "etude" };
const MAISON = { id: 2, nom: "Maison", nomNormalise: "maison" };
const PROJETS = [ETUDE, MAISON];

describe("normaliser", () => {
  test("enlève les espaces autour et met en minuscules", () => {
    assert.equal(normaliser("  Études  "), "études");
  });

  test("garde les accents : « Étude » et « Etude » restent différents", () => {
    assert.notEqual(normaliser("Étude"), normaliser("Etude"));
  });
});

describe("validerProjet", () => {
  test("accepte un nom nouveau", () => {
    assert.equal(validerProjet("Sport", PROJETS), null);
  });

  // Classes d'équivalence invalides : nom vide, nom blanc
  for (const nom of ["", "   "]) {
    test(`refuse un nom vide ou blanc (« ${nom} »)`, () => {
      assert.equal(validerProjet(nom, PROJETS), "Le nom du projet est obligatoire");
    });
  }

  // Doublons : exact, autre casse, espaces autour
  for (const nom of ["Etude", "etude", "  ETUDE  "]) {
    test(`refuse un doublon (« ${nom} »)`, () => {
      assert.equal(validerProjet(nom, PROJETS), "Ce projet existe déjà");
    });
  }

  // Valeurs limites : 50 caractères acceptés, 51 refusés
  test("accepte 50 caractères", () => {
    assert.equal(validerProjet("a".repeat(NOM_PROJET_MAX_SPEC), PROJETS), null);
  });

  test("refuse 51 caractères", () => {
    assert.equal(
      validerProjet("a".repeat(NOM_PROJET_MAX_SPEC + 1), PROJETS),
      "Le nom du projet ne doit pas dépasser 50 caractères"
    );
  });

  test("renommage : un projet ne se compare pas à lui-même", () => {
    assert.equal(validerProjet("ETUDE", PROJETS, ETUDE.id), null);
  });

  test("renommage : refuse le nom d'un AUTRE projet", () => {
    assert.equal(validerProjet("Maison", PROJETS, ETUDE.id), "Ce projet existe déjà");
  });
});

describe("validerTache", () => {
  test("accepte une tâche valide", () => {
    assert.equal(validerTache("Réviser", ETUDE.id, PROJETS), null);
  });

  test("refuse toute tâche tant qu'aucun projet n'existe", () => {
    assert.equal(validerTache("Réviser", 1, []), "Créez d'abord un projet");
  });

  for (const titre of ["", "   "]) {
    test(`refuse un titre vide ou blanc (« ${titre} »)`, () => {
      assert.equal(validerTache(titre, ETUDE.id, PROJETS), "Le titre est obligatoire");
    });
  }

  // Valeurs limites : 100 caractères acceptés, 101 refusés
  test("accepte 100 caractères", () => {
    assert.equal(validerTache("a".repeat(TITRE_MAX_SPEC), ETUDE.id, PROJETS), null);
  });

  test("refuse 101 caractères", () => {
    assert.equal(
      validerTache("a".repeat(TITRE_MAX_SPEC + 1), ETUDE.id, PROJETS),
      "Le titre ne doit pas dépasser 100 caractères"
    );
  });

  test("les espaces autour ne comptent pas dans la longueur", () => {
    assert.equal(validerTache(`  ${"a".repeat(TITRE_MAX_SPEC)}  `, ETUDE.id, PROJETS), null);
  });

  test("refuse un projet inexistant", () => {
    assert.equal(validerTache("Réviser", 99, PROJETS), "Choisissez un projet");
  });

  test("ordre des contrôles : sans projet, c'est ce message qui gagne sur le titre vide", () => {
    assert.equal(validerTache("", 1, []), "Créez d'abord un projet");
  });
});

describe("validerSuppressionProjet", () => {
  test("autorise la suppression d'un projet vide", () => {
    assert.equal(validerSuppressionProjet(0), null);
  });

  test("refuse si le projet contient au moins une tâche", () => {
    assert.equal(
      validerSuppressionProjet(1),
      "Impossible de supprimer un projet qui contient des tâches"
    );
  });
});

describe("texteCompteur", () => {
  // Les trois formes : zéro, singulier, pluriel
  for (const [restantes, attendu] of [
    [0, "Aucune tâche restante"],
    [1, "1 tâche restante"],
    [2, "2 tâches restantes"],
  ]) {
    test(`${restantes} → « ${attendu} »`, () => {
      assert.equal(texteCompteur(restantes), attendu);
    });
  }
});

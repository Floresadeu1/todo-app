// features/step_definitions/taches.steps.js

import { Given as Soit, When as Quand, Then as Alors } from "@cucumber/cucumber";
import { expect } from "playwright/test";

// ---------- Soit ----------

Soit("la tâche {string} existe dans le projet {string}", async function (titre, projet) {
  await this.todo.creerTache(titre, projet);
  await expect(this.todo.tache(titre)).toBeVisible();
});

Soit("la tâche {string} est terminée", async function (titre) {
  await this.todo.basculerTerminee(titre);
  await expect(this.todo.tache(titre)).toHaveAttribute("data-terminee", "true");
});

// ---------- Quand ----------

Quand("je crée la tâche {string} dans le projet {string}", async function (titre, projet) {
  await this.todo.creerTache(titre, projet);
});

Quand("je crée la tâche {string} sans projet", async function (titre) {
  await this.todo.creerTache(titre); // aucun projet n'existe : rien à choisir
});

Quand("je crée la tâche {string} sans choisir de projet", async function (titre) {
  await this.todo.creerTache(titre); // on garde le projet proposé par défaut
});

Quand(
  "je crée une tâche dont le titre fait {int} caractères dans le projet {string}",
  async function (longueur, projet) {
    await this.todo.creerTache("a".repeat(longueur), projet);
  }
);

Quand("je modifie le titre de la tâche {string} en {string}", async function (titre, nouveau) {
  await this.todo.modifierTache(titre, { nouveauTitre: nouveau });
});

Quand("je déplace la tâche {string} vers le projet {string}", async function (titre, projet) {
  await this.todo.modifierTache(titre, { nouveauProjet: projet });
});

Quand(
  "je commence à modifier le titre de la tâche {string} en {string} puis j'appuie sur Échap",
  async function (titre, nouveau) {
    await this.todo.modifierTache(titre, { nouveauTitre: nouveau, annulerAvecEchap: true });
  }
);

Quand("je marque la tâche {string} comme terminée", async function (titre) {
  await this.todo.basculerTerminee(titre);
});

Quand("je marque la tâche {string} comme à faire", async function (titre) {
  await this.todo.basculerTerminee(titre);
});

Quand("je supprime la tâche {string}", async function (titre) {
  await this.todo.supprimerTache(titre);
});

Quand("{int} secondes s'écoulent", async function (secondes) {
  // Horloge simulée (scénarios @horloge) : le temps avance sans attendre réellement
  await this.page.clock.runFor(secondes * 1000);
});

// ---------- Alors ----------

Alors("la tâche {string} apparaît dans le projet {string}", async function (titre, projet) {
  const tache = this.todo.tache(titre);
  await expect(tache).toBeVisible();
  // Vue « Toutes les tâches » : chaque tâche porte l'étiquette de son projet.
  // Vue d'un projet : pas d'étiquette, c'est le titre de la vue qui donne le projet.
  const etiquette = tache.getByTestId("projet-de-la-tache");
  if ((await etiquette.count()) > 0) await expect(etiquette).toHaveText(projet);
  else await expect(this.todo.titreVue()).toHaveText(projet);
});

Alors("la tâche {string} est absente de la liste", async function (titre) {
  await expect(this.todo.tache(titre)).toHaveCount(0);
});

Alors("la tâche est refusée avec le message {string}", async function (message) {
  await expect(this.todo.erreurTache()).toHaveText(message);
});

Alors("la tâche est {word}", async function (resultat) {
  if (resultat === "acceptée") {
    await expect(this.todo.lignesTaches()).toHaveCount(1);
    await expect(this.todo.erreurTache()).toHaveCount(0);
  } else if (resultat === "refusée") {
    await expect(this.todo.erreurTache()).toHaveText(
      "Le titre ne doit pas dépasser 100 caractères"
    );
    await expect(this.todo.lignesTaches()).toHaveCount(0);
  } else {
    throw new Error(`Résultat inconnu : « ${resultat} » (attendu : acceptée ou refusée)`);
  }
});

Alors("la liste des tâches est vide", async function () {
  await expect(this.todo.lignesTaches()).toHaveCount(0);
});

Alors("la tâche {string} est affichée comme terminée", async function (titre) {
  await expect(this.todo.tache(titre)).toHaveAttribute("data-terminee", "true");
  await expect(this.todo.tache(titre).getByTestId("terminer")).toBeChecked();
});

Alors("la tâche {string} est affichée comme à faire", async function (titre) {
  await expect(this.todo.tache(titre)).toHaveAttribute("data-terminee", "false");
  await expect(this.todo.tache(titre).getByTestId("terminer")).not.toBeChecked();
});

Alors("le compteur indique {string}", async function (texte) {
  await expect(this.todo.compteur()).toHaveText(texte);
});

Alors("le message de suppression a disparu", async function () {
  await expect(this.todo.notification()).toHaveCount(0);
});
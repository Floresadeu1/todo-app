// features/step_definitions/projets.steps.js
// Une fonction par phrase Gherkin. Given / When / Then sont renommés Soit / Quand / Alors.
// (Pour Cucumber, le mot-clé ne compte pas : seule la phrase relie le scénario au code.)

import { Given as Soit, When as Quand, Then as Alors } from "@cucumber/cucumber";
import { expect } from "playwright/test";

// ---------- Soit ----------

Soit("le gestionnaire de tâches est ouvert", async function () {
  await this.todo.ouvrir();
});

Soit("le projet {string} existe", async function (nom) {
  await this.todo.creerProjet(nom);
  await expect(this.todo.projet(nom)).toBeVisible();
});

// ---------- Quand ----------

Quand("je crée le projet {string}", async function (nom) {
  await this.todo.creerProjet(nom);
});

Quand("je crée un projet dont le nom fait {int} caractères", async function (longueur) {
  await this.todo.creerProjet("a".repeat(longueur));
});

Quand("je renomme le projet {string} en {string}", async function (ancien, nouveau) {
  await this.todo.renommerProjet(ancien, nouveau);
});

Quand(
  "je commence à renommer le projet {string} en {string} puis j'appuie sur Échap",
  async function (ancien, nouveau) {
    await this.todo.renommerProjet(ancien, nouveau, { annulerAvecEchap: true });
  }
);

Quand("je supprime le projet {string}", async function (nom) {
  await this.todo.supprimerProjet(nom);
});

Quand("j'annule la suppression", async function () {
  await this.todo.annulerSuppression();
});

// ---------- Alors ----------

Alors("le projet {string} apparaît dans la liste des projets", async function (nom) {
  await expect(this.todo.projet(nom)).toBeVisible();
});

Alors("le projet {string} est absent de la liste des projets", async function (nom) {
  await expect(this.todo.projet(nom)).toHaveCount(0);
});

Alors("le projet {string} est proposé pour les nouvelles tâches", async function (nom) {
  await expect(this.todo.optionsProjetDuFormulaire()).toContainText([nom]);
});

Alors("les projets affichés sont, dans l'ordre :", async function (tableau) {
  const nomsAttendus = tableau.raw().map((ligne) => ligne[0]);
  await expect(this.todo.nomsProjets()).toHaveText(nomsAttendus);
});

Alors("le projet est refusé avec le message {string}", async function (message) {
  await expect(this.todo.erreurProjet()).toHaveText(message);
});

Alors("la liste contient {int} projet(s)", async function (nombre) {
  await expect(this.todo.lignesProjets()).toHaveCount(nombre);
});

Alors("le projet est {word}", async function (resultat) {
  if (resultat === "accepté") {
    await expect(this.todo.lignesProjets()).toHaveCount(1);
    await expect(this.todo.erreurProjet()).toHaveCount(0);
  } else if (resultat === "refusé") {
    await expect(this.todo.erreurProjet()).toHaveText(
      "Le nom du projet ne doit pas dépasser 50 caractères"
    );
    await expect(this.todo.lignesProjets()).toHaveCount(0);
  } else {
    throw new Error(`Résultat inconnu : « ${resultat} » (attendu : accepté ou refusé)`);
  }
});

Alors("le message {string} est affiché", async function (message) {
  await expect(this.todo.messageNotification()).toHaveText(message);
});
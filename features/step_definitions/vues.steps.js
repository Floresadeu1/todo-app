// features/step_definitions/vues.steps.js

import { When as Quand, Then as Alors } from "@cucumber/cucumber";
import { expect } from "playwright/test";

Quand("j'affiche le projet {string}", async function (nom) {
  await this.todo.afficherProjet(nom);
});

Quand("j'affiche tous les projets", async function () {
  await this.todo.afficherTousLesProjets();
});

Alors("le titre de la vue est {string}", async function (titre) {
  await expect(this.todo.titreVue()).toHaveText(titre);
});

Alors("seules les tâches suivantes sont affichées :", async function (tableau) {
  const titresAttendus = tableau.raw().map((ligne) => ligne[0]);
  await expect(this.todo.titresAffiches()).toHaveText(titresAttendus);
});

Alors("la liste contient {int} tâche(s)", async function (nombre) {
  await expect(this.todo.lignesTaches()).toHaveCount(nombre);
});

Alors("le badge du projet {string} indique {int}", async function (nom, nombre) {
  await expect(this.todo.badgeDuProjet(nom)).toHaveText(String(nombre));
});
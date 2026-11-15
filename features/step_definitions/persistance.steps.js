// features/step_definitions/persistance.steps.js

import assert from "node:assert/strict";
import { When as Quand, Then as Alors } from "@cucumber/cucumber";

Quand("je recharge la page", async function () {
  await this.todo.recharger();
});

Alors("IndexedDB contient {int} projet(s) et {int} tâche(s)", async function (nbProjets, nbTaches) {
  const { projets, taches } = await this.todo.lireIndexedDB();
  assert.equal(projets.length, nbProjets, "nombre de projets dans IndexedDB");
  assert.equal(taches.length, nbTaches, "nombre de tâches dans IndexedDB");
});

Alors(
  "dans IndexedDB, la tâche {string} appartient au projet {string} et n'est pas terminée",
  async function (titre, nomProjet) {
    const { projets, taches } = await this.todo.lireIndexedDB();
    const tache = taches.find((t) => t.titre === titre);
    assert.ok(tache, `la tâche « ${titre} » est absente d'IndexedDB`);
    const projet = projets.find((p) => p.id === tache.projetId);
    assert.equal(projet?.nom, nomProjet, "projet de la tâche");
    assert.equal(tache.terminee, false, "état de la tâche");
  }
);
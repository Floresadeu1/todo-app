// features/support/monde.js
// Le « monde » Cucumber : ce qui est partagé par toutes les étapes d'UN scénario
// (le navigateur, la page, le page object), et les hooks avant/après.

import {
  After,
  AfterAll,
  Before,
  BeforeAll,
  Status,
  World,
  setDefaultTimeout,
  setWorldConstructor,
} from "@cucumber/cucumber";
import { chromium } from "playwright";
import { PageTodo } from "./page-todo.js";

setDefaultTimeout(30_000); // une étape échoue si elle dure plus de 30 secondes

const URL_APP = process.env.URL_APP || "http://localhost:3000";
let navigateur; // un seul navigateur pour toute la suite (le lancer prend du temps)

BeforeAll(async function () {
  navigateur = await chromium.launch({
    headless: process.env.HEADLESS !== "false", // HEADLESS=false pour voir le navigateur
    executablePath: process.env.CHROMIUM_PATH || undefined, // facultatif
  });
});

AfterAll(async function () {
  await navigateur?.close();
});

class MondeTodo extends World {
  async ouvrirUnNouveauContexte() {
    // Nouveau contexte = nouveau profil de navigateur = IndexedDB VIDE.
    // Chaque scénario part donc de zéro : les scénarios sont isolés (F.I.R.S.T.).
    this.contexte = await navigateur.newContext({ locale: "fr-FR" });
    this.page = await this.contexte.newPage();
    this.todo = new PageTodo(this.page, URL_APP);
  }
}
setWorldConstructor(MondeTodo);

Before(async function () {
  await this.ouvrirUnNouveauContexte();
});

// Scénarios @horloge : l'horloge de la page est simulée, on avance le temps à volonté
Before({ tags: "@horloge" }, async function () {
  await this.page.clock.install();
});

After(async function ({ result }) {
  // En cas d'échec, une capture d'écran est jointe au rapport HTML
  if (result?.status === Status.FAILED && this.page) {
    this.attach(await this.page.screenshot({ fullPage: true }), "image/png");
  }
  await this.contexte?.close();
});
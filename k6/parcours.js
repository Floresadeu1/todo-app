// k6/parcours.js
// Test de performance « parcours utilisateur » avec Grafana k6 Browser.
// Chaque utilisateur virtuel (VU) = un vrai navigateur Chromium qui utilise l'application
// comme un humain : créer un projet, ajouter des tâches, en terminer une, en modifier une,
// en supprimer une, recharger la page.
//
// Lancer (l'application doit tourner : npm run build puis npm start) :
//   k6 run -e VUS=1 k6/parcours.js        (1 navigateur)
//   k6 run -e VUS=5 k6/parcours.js        (5 navigateurs en même temps)
//
// Aucune attente fixe (pas de sleep / waitForTimeout) : on attend que le résultat
// soit VISIBLE à l'écran, et c'est ce temps-là qu'on mesure.

import { browser } from "k6/browser";
import { check } from "k6";
import { Trend } from "k6/metrics";

const URL_APP = __ENV.URL_APP || "http://localhost:3000";
const VUS = Number(__ENV.VUS || 1);
const TACHES_PAR_VU = Number(__ENV.TACHES_PAR_VU || 10);

// Nos propres mesures (en millisecondes)
const tempsChargement = new Trend("ui_chargement", true);
const tempsCreationProjet = new Trend("ui_creation_projet", true);
const tempsAjoutTache = new Trend("ui_ajout_tache", true);
const tempsTerminer = new Trend("ui_terminer_tache", true);
const tempsModification = new Trend("ui_modification_tache", true);
const tempsSuppression = new Trend("ui_suppression_tache", true);
const tempsRechargement = new Trend("ui_rechargement", true);

export const options = {
  scenarios: {
    parcours: {
      executor: "per-vu-iterations",
      vus: VUS,
      iterations: 2, // chaque navigateur fait le parcours 2 fois
      maxDuration: "5m",
      options: { browser: { type: "chromium" } },
    },
  },
  // Critères de réussite : si l'un d'eux n'est pas respecté, k6 termine en échec
  thresholds: {
    checks: ["rate==1.0"], // toutes les vérifications doivent réussir
    ui_ajout_tache: ["p(95)<1000"], // 95 % des ajouts visibles en moins d'1 s
    ui_chargement: ["p(95)<5000"],
  },
};

const sel = (id) => `[data-testid="${id}"]`;

/** Attend qu'il y ait exactement n lignes de tâches à l'écran. */
async function attendreNombreDeTaches(page, n) {
  await page.waitForFunction(
    (attendu) => document.querySelectorAll('[data-testid="tache"]').length === attendu,
    { timeout: 30000 },
    n
  );
}

/** Mesure la durée d'une action, de son début jusqu'à ce que son effet soit visible. */
async function mesurer(trend, action) {
  const debut = Date.now();
  await action();
  trend.add(Date.now() - debut);
}

export default async function () {
  // Nouveau contexte = navigateur « neuf », IndexedDB vide (comme dans les tests BDD)
  const contexte = await browser.newContext();
  const page = await contexte.newPage();

  try {
    await mesurer(tempsChargement, async () => {
      await page.goto(URL_APP);
      await page.locator('[data-testid="application"][data-pret="true"]').waitFor();
    });

    // 1. Créer un projet
    const nomProjet = `Projet VU${__VU}`;
    await mesurer(tempsCreationProjet, async () => {
      await page.locator(sel("nom-projet")).fill(nomProjet);
      await page.locator(sel("ajouter-projet")).click();
      await page.locator(sel("projet")).first().waitFor();
    });

    // 2. Ajouter des tâches (on attend que chaque tâche APPARAISSE, pas un délai fixe)
    for (let i = 1; i <= TACHES_PAR_VU; i++) {
      await mesurer(tempsAjoutTache, async () => {
        await page.locator(sel("titre-tache")).fill(`Tâche ${i}`);
        await page.locator(sel("ajouter-tache")).click();
        await attendreNombreDeTaches(page, i);
      });
    }

    // 3. Terminer la première tâche
    await mesurer(tempsTerminer, async () => {
      await page.locator(`${sel("tache")} ${sel("terminer")}`).first().click();
      await page.locator('[data-testid="tache"][data-terminee="true"]').waitFor();
    });

    // 4. Modifier le titre de la deuxième tâche
    await mesurer(tempsModification, async () => {
      await page.locator(`${sel("tache")} ${sel("modifier")}`).nth(1).click();
      await page.locator(sel("edition-titre")).fill("Tâche modifiée");
      await page.locator(sel("enregistrer")).click();
      await page.waitForFunction(() =>
        [...document.querySelectorAll('[data-testid="titre"]')].some(
          (e) => e.textContent === "Tâche modifiée"
        )
      );
    });

    // 5. Supprimer la dernière tâche
    await mesurer(tempsSuppression, async () => {
      await page.locator(`${sel("tache")} ${sel("supprimer-tache")}`).last().click();
      await attendreNombreDeTaches(page, TACHES_PAR_VU - 1);
    });

    // 6. Recharger : les données doivent revenir depuis IndexedDB
    await page.waitForFunction(() => !window.todoEcrituresEnCours);
    await mesurer(tempsRechargement, async () => {
      await page.reload();
      await page.locator('[data-testid="application"][data-pret="true"]').waitFor();
      await attendreNombreDeTaches(page, TACHES_PAR_VU - 1);
    });

    // Vérifications (oracles) après le rechargement
    const nbTaches = await page.locator(sel("tache")).count();
    const nbTerminees = await page.locator('[data-testid="tache"][data-terminee="true"]').count();
    const compteur = await page.locator(sel("compteur")).textContent();
    check(null, {
      "les tâches sont conservées après rechargement": () => nbTaches === TACHES_PAR_VU - 1,
      "la tâche terminée est conservée": () => nbTerminees === 1,
      "le compteur est juste": () => compteur === `${TACHES_PAR_VU - 2} tâches restantes`,
    });
  } finally {
    await page.close();
    await contexte.close();
  }
}

// Enregistre aussi le résumé dans rapports/ (pour le README et la CI)
export function handleSummary(data) {
  return {
    stdout: resumeTexte(data),
    [`rapports/k6-parcours-${VUS}vu.json`]: JSON.stringify(data, null, 2),
  };
}

function resumeTexte(data) {
  const lignes = [`\nParcours utilisateur — ${VUS} navigateur(s), ${TACHES_PAR_VU} tâches chacun\n`];
  lignes.push("mesure                    moyenne     p(95)       max");
  for (const nom of Object.keys(data.metrics).filter((n) => n.startsWith("ui_")).sort()) {
    const v = data.metrics[nom].values;
    lignes.push(
      `${nom.padEnd(25)} ${fmt(v.avg)} ${fmt(v["p(95)"])} ${fmt(v.max)}`
    );
  }
  const c = data.metrics.checks.values;
  lignes.push(`\nvérifications réussies : ${c.passes}/${c.passes + c.fails}\n`);
  return lignes.join("\n");
}

function fmt(ms) {
  return `${ms.toFixed(0)} ms`.padEnd(11);
}

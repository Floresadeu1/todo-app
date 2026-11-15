// k6/benchmark.js
// Benchmark de volume avec Grafana k6 Browser : 1 000, 2 000, 5 000 puis 10 000 tâches.
// Pour chaque volume, on mesure les 4 opérations (insertion, lecture, modification, suppression)
// à DEUX niveaux :
//   - niveau DONNÉES : directement dans IndexedDB (base "todo-db", magasins "projets" et "taches")
//   - niveau ÉCRAN   : ce que vit l'utilisateur (afficher N tâches, ajouter / cocher / supprimer
//                      UNE tâche quand il y en a déjà N)
//
// Lancer (l'application doit tourner : npm run build puis npm start) :
//   k6 run k6/benchmark.js
//   k6 run -e VOLUMES=1000,2000 k6/benchmark.js     (pour choisir les volumes)

import { browser } from "k6/browser";
import { check } from "k6";
import { Trend } from "k6/metrics";

const URL_APP = __ENV.URL_APP || "http://localhost:3000";
const VOLUMES = (__ENV.VOLUMES || "1000,2000,5000,10000").split(",").map(Number);

const OPERATIONS = {
  idb_insertion: "IndexedDB : insérer N tâches",
  idb_lecture: "IndexedDB : lire N tâches",
  idb_modification: "IndexedDB : modifier N tâches",
  idb_suppression: "IndexedDB : supprimer N tâches",
  ui_affichage: "Écran : afficher N tâches (rechargement)",
  ui_ajout_une: "Écran : ajouter 1 tâche parmi N",
  ui_terminer_une: "Écran : cocher 1 tâche parmi N",
  ui_suppression_une: "Écran : supprimer 1 tâche parmi N",
};
const trends = {};
for (const nom of Object.keys(OPERATIONS)) trends[nom] = new Trend(nom, true);

// Un seuil par volume : c'est ce qui fait apparaître une ligne par volume dans le résumé k6
const thresholds = { checks: ["rate==1.0"] };
for (const nom of Object.keys(OPERATIONS)) {
  for (const n of VOLUMES) thresholds[`${nom}{taches:${n}}`] = ["max>=0"];
}

export const options = {
  scenarios: {
    benchmark: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 1,
      maxDuration: "30m",
      options: { browser: { type: "chromium" } },
    },
  },
  thresholds,
};

const sel = (id) => `[data-testid="${id}"]`;

async function attendreNombreDeTaches(page, n) {
  await page.waitForFunction(
    (attendu) => document.querySelectorAll('[data-testid="tache"]').length === attendu,
    { timeout: 300000 },
    n
  );
}

async function attendrePret(page) {
  await page.locator('[data-testid="application"][data-pret="true"]').waitFor({ timeout: 300000 });
}

async function mesurerEcran(nom, n, action) {
  const debut = Date.now();
  await action();
  trends[nom].add(Date.now() - debut, { taches: String(n) });
}

/**
 * Exécuté DANS le navigateur : une opération IndexedDB chronométrée avec performance.now().
 * etape = "inserer" | "lire" | "modifier" | "supprimer"
 */
function operationIndexedDB([etape, n]) {
  return new Promise((ok, ko) => {
    const ouverture = indexedDB.open("todo-db");
    ouverture.onerror = () => ko(ouverture.error);
    ouverture.onsuccess = () => {
      const db = ouverture.result;
      const debut = performance.now();
      const fin = (resultat) => {
        db.close();
        ok({ duree: performance.now() - debut, ...resultat });
      };

      if (etape === "inserer") {
        // Le projet qui va contenir les N tâches, puis les N tâches, dans UNE transaction
        const tx = db.transaction(["projets", "taches"], "readwrite");
        tx.objectStore("projets").add({ nom: "Benchmark", nomNormalise: "benchmark" }).onsuccess = (e) => {
          const projetId = e.target.result;
          const taches = tx.objectStore("taches");
          for (let i = 1; i <= n; i++) {
            taches.add({ titre: `Tâche ${i}`, projetId, terminee: false, creeLe: new Date().toISOString() });
          }
        };
        tx.oncomplete = () => fin({});
        tx.onerror = () => ko(tx.error);
      } else if (etape === "lire") {
        const tx = db.transaction("taches", "readonly");
        const requete = tx.objectStore("taches").getAll();
        tx.oncomplete = () => fin({ nombre: requete.result.length });
        tx.onerror = () => ko(tx.error);
      } else if (etape === "modifier") {
        // Lire puis réécrire chaque tâche (terminee = true), comme le ferait l'application
        const tx = db.transaction("taches", "readwrite");
        const magasin = tx.objectStore("taches");
        magasin.getAll().onsuccess = (e) => {
          for (const t of e.target.result) magasin.put({ ...t, terminee: true });
        };
        tx.oncomplete = () => fin({});
        tx.onerror = () => ko(tx.error);
      } else if (etape === "supprimer") {
        // Supprimer les tâches UNE PAR UNE par leur clé (comme le bouton corbeille)
        const tx = db.transaction("taches", "readwrite");
        const magasin = tx.objectStore("taches");
        magasin.getAllKeys().onsuccess = (e) => {
          for (const id of e.target.result) magasin.delete(id);
        };
        tx.oncomplete = () => fin({});
        tx.onerror = () => ko(tx.error);
      }
    };
  });
}

async function mesurerIndexedDB(page, nom, etape, n) {
  const r = await page.evaluate(operationIndexedDB, [etape, n]);
  trends[nom].add(r.duree, { taches: String(n) });
  return r;
}

export default async function () {
  for (const n of VOLUMES) {
    // Navigateur neuf pour chaque volume : IndexedDB vide, mesures indépendantes
    const contexte = await browser.newContext();
    const page = await contexte.newPage();
    try {
      await page.goto(URL_APP);
      await attendrePret(page);

      // ----- INSERTION (données) -----
      await mesurerIndexedDB(page, "idb_insertion", "inserer", n);

      // ----- LECTURE (données) -----
      const lecture = await mesurerIndexedDB(page, "idb_lecture", "lire", n);

      // ----- LECTURE (écran) : recharger et attendre que les N tâches soient affichées -----
      await mesurerEcran("ui_affichage", n, async () => {
        await page.reload();
        await attendrePret(page);
        await attendreNombreDeTaches(page, n);
      });

      // ----- Les 3 actions d'un utilisateur quand la liste contient déjà N tâches -----
      await mesurerEcran("ui_ajout_une", n, async () => {
        await page.locator(sel("titre-tache")).fill("Tâche en plus");
        await page.locator(sel("ajouter-tache")).click();
        await attendreNombreDeTaches(page, n + 1);
      });

      await mesurerEcran("ui_terminer_une", n, async () => {
        await page.locator(`${sel("tache")} ${sel("terminer")}`).first().click();
        await page.locator('[data-testid="tache"][data-terminee="true"]').waitFor({ timeout: 300000 });
      });

      await mesurerEcran("ui_suppression_une", n, async () => {
        await page.locator(`${sel("tache")} ${sel("supprimer-tache")}`).last().click();
        await attendreNombreDeTaches(page, n);
      });

      await page.waitForFunction(() => !window.todoEcrituresEnCours, { timeout: 300000 });

      // ----- MODIFICATION puis SUPPRESSION (données) -----
      await mesurerIndexedDB(page, "idb_modification", "modifier", n);
      await mesurerIndexedDB(page, "idb_suppression", "supprimer", n);
      const apres = await page.evaluate(operationIndexedDB, ["lire", 0]);

      check(null, {
        [`${n} : IndexedDB contient bien ${n} tâches après insertion`]: () => lecture.nombre === n,
        [`${n} : IndexedDB est vide après la suppression`]: () => apres.nombre === 0,
      });
    } finally {
      await page.close();
      await contexte.close();
    }
  }
}

// ---------- Résumé : un tableau lisible + un fichier JSON dans rapports/ ----------

export function handleSummary(data) {
  const tableau = construireTableau(data);
  return {
    stdout: tableau,
    "rapports/k6-benchmark.txt": tableau,
    "rapports/k6-benchmark.json": JSON.stringify(data, null, 2),
  };
}

function construireTableau(data) {
  const largeur = 44;
  let texte = "\nBenchmark (durées en millisecondes)\n\n";
  texte += "opération".padEnd(largeur) + VOLUMES.map((n) => String(n).padStart(9)).join("") + "\n";
  texte += "-".repeat(largeur + 9 * VOLUMES.length) + "\n";
  for (const [nom, libelle] of Object.entries(OPERATIONS)) {
    texte += libelle.padEnd(largeur);
    for (const n of VOLUMES) {
      const m = data.metrics[`${nom}{taches:${n}}`];
      texte += (m ? m.values.max.toFixed(0) : "-").padStart(9);
    }
    texte += "\n";
  }
  const c = data.metrics.checks ? data.metrics.checks.values : { passes: 0, fails: 0 };
  texte += `\nvérifications réussies : ${c.passes}/${c.passes + c.fails}\n`;
  return texte;
}

// lib/db.js
// Accès à IndexedDB : toutes les données de l'application sont enregistrées dans le navigateur.
// Ce fichier ne contient AUCUNE règle métier (elles seront dans lib/regles.js).

const NOM_BASE = "todo-db";
const VERSION = 1;

let basePromise = null; // la base n'est ouverte qu'une seule fois

/** Ouvre la base (et crée les magasins d'objets au premier lancement). */
export function ouvrirBase() {
  if (typeof window === "undefined") {
    // Next.js peut exécuter du code côté serveur, où IndexedDB n'existe pas
    return Promise.reject(new Error("IndexedDB n'est disponible que dans le navigateur"));
  }
  if (!basePromise) {
    basePromise = new Promise((resoudre, rejeter) => {
      const requete = indexedDB.open(NOM_BASE, VERSION);

      // Appelé seulement à la création de la base ou quand VERSION augmente
      requete.onupgradeneeded = () => {
        const db = requete.result;
        if (!db.objectStoreNames.contains("projets")) {
          const projets = db.createObjectStore("projets", { keyPath: "id", autoIncrement: true });
          projets.createIndex("nomNormalise", "nomNormalise", { unique: true });
        }
        if (!db.objectStoreNames.contains("taches")) {
          const taches = db.createObjectStore("taches", { keyPath: "id", autoIncrement: true });
          taches.createIndex("projetId", "projetId", { unique: false });
        }
      };

      requete.onsuccess = () => resoudre(requete.result);
      requete.onerror = () => rejeter(requete.error);
    });
  }
  return basePromise;
}

/**
 * Exécute une opération dans une transaction et attend qu'elle soit TERMINÉE.
 * On attend "oncomplete" (et pas seulement "onsuccess") : la donnée est alors
 * réellement écrite, même si l'utilisateur recharge la page juste après.
 */
async function transaction(magasin, mode, operation) {
  const db = await ouvrirBase();
  return new Promise((resoudre, rejeter) => {
    const tx = db.transaction(magasin, mode);
    const requete = operation(tx.objectStore(magasin));
    let resultat;
    if (requete) requete.onsuccess = () => { resultat = requete.result; };
    tx.oncomplete = () => resoudre(resultat);
    tx.onerror = () => rejeter(tx.error);
    tx.onabort = () => rejeter(tx.error);
  });
}

// ---------- Projets ----------

export function listerProjets() {
  return transaction("projets", "readonly", (s) => s.getAll());
}

/** Ajoute un projet et renvoie son id. */
export function ajouterProjet(projet) {
  return transaction("projets", "readwrite", (s) => s.add(projet));
}


/** Remplace un projet existant (même id) par sa nouvelle version (renommage). */
export function modifierProjet(projet) {
  return transaction("projets", "readwrite", (s) => s.put(projet));
}


/** Supprime un projet et toutes ses tâches. */
export function supprimerProjet(id) {
  return transaction("projets", "readwrite", (s) => s.delete(id));
}

// ---------- Tâches ----------

export function listerTaches() {
  return transaction("taches", "readonly", (s) => s.getAll());
}

/** Nombre de tâches d'un projet (utilise l'index projetId). */
export function compterTachesDuProjet(projetId) {
  return transaction("taches", "readonly", (s) => s.index("projetId").count(projetId));
}

/** Ajoute une tâche et renvoie son id. */
export function ajouterTache(tache) {
  return transaction("taches", "readwrite", (s) => s.add(tache));
}

/** Remplace une tâche existante (même id) par sa nouvelle version. */
export function modifierTache(tache) {
  return transaction("taches", "readwrite", (s) => s.put(tache));
}

export function supprimerTache(id) {
  return transaction("taches", "readwrite", (s) => s.delete(id));
}
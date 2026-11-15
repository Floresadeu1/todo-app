// components/TodoApp.js
"use client"; // ce composant s'exécute dans le navigateur (il utilise IndexedDB)

import { useCallback, useEffect, useState } from "react";
import * as db from "@/lib/db";
import {
  normaliser,
  texteCompteur,
  validerProjet,
  validerSuppressionProjet,
  validerTache,
} from "@/lib/regles";
import SectionProjets from "./SectionProjets";
import SectionTaches from "./SectionTaches";

export default function TodoApp() {
  const [projets, setProjets] = useState([]);
  const [taches, setTaches] = useState([]);
  const [pret, setPret] = useState(false); // true quand les données sont chargées
  const [erreurProjet, setErreurProjet] = useState(null);
  const [erreurTache, setErreurTache] = useState(null);
  const [filtre, setFiltre] = useState("tous"); // "tous" ou l'id d'un projet

  // Relit tout depuis IndexedDB : l'écran montre toujours ce qui est vraiment enregistré
  const recharger = useCallback(async () => {
    const [p, t] = await Promise.all([db.listerProjets(), db.listerTaches()]);
    p.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
    t.sort((a, b) => a.id - b.id);
    setProjets(p);
    setTaches(t);
  }, []);

  // Au démarrage : lire IndexedDB, puis signaler que l'application est prête
  useEffect(() => {
    recharger().then(() => setPret(true));
  }, [recharger]);

  // ---------- Projets ----------

  /**
   * Valide tout de suite (sans attendre IndexedDB) et renvoie true si le nom est accepté.
   * L'écriture se fait ensuite en arrière-plan : le formulaire peut se vider immédiatement,
   * sans risquer d'effacer ce que l'utilisateur tape pendant l'enregistrement.
   */
  function creerProjet(nom) {
    const erreur = validerProjet(nom, projets);
    setErreurProjet(erreur);
    if (erreur) return false;
    enregistrerProjet(nom.trim());
    return true;
  }

  async function enregistrerProjet(nom) {
    try {
      await db.ajouterProjet({ nom, nomNormalise: normaliser(nom) });
    } catch {
      // Filet de sécurité : l'index unique d'IndexedDB refuse un doublon
      setErreurProjet("Ce projet existe déjà");
    }
    await recharger();
  }

  async function supprimerProjet(id) {
    const nombreDeTaches = await db.compterTachesDuProjet(id);
    const erreur = validerSuppressionProjet(nombreDeTaches);
    setErreurProjet(erreur);
    if (erreur) return;
    await db.supprimerProjet(id);
    await recharger();
  }

  // ---------- Tâches ----------

  /** Même principe que creerProjet : validation immédiate, écriture en arrière-plan. */
  function creerTache(titre, projetId) {
    const erreur = validerTache(titre, projetId, projets);
    setErreurTache(erreur);
    if (erreur) return false;
    enregistrerTache({
      titre: titre.trim(),
      projetId,
      terminee: false,
      creeLe: new Date().toISOString(),
    });
    return true;
  }

  async function enregistrerTache(tache) {
    await db.ajouterTache(tache);
    await recharger();
  }

  async function basculerTerminee(tache) {
    await db.modifierTache({ ...tache, terminee: !tache.terminee });
    await recharger();
  }

  async function supprimerTache(id) {
    await db.supprimerTache(id);
    await recharger();
  }

  // Si le projet filtré a été supprimé, on revient à « Tous les projets »
  const filtreEffectif =
    filtre !== "tous" && projets.some((p) => String(p.id) === filtre) ? filtre : "tous";
  const tachesAffichees =
    filtreEffectif === "tous"
      ? taches
      : taches.filter((t) => String(t.projetId) === filtreEffectif);
  const restantes = taches.filter((t) => !t.terminee).length;

  return (
    <main data-testid="application" data-pret={pret ? "true" : "false"}>
      <h1>Mes tâches</h1>
      <SectionProjets
        projets={projets}
        erreur={erreurProjet}
        onCreer={creerProjet}
        onSupprimer={supprimerProjet}
      />
      <SectionTaches
        projets={projets}
        taches={tachesAffichees}
        erreur={erreurTache}
        filtre={filtreEffectif}
        compteur={texteCompteur(restantes)}
        onFiltrer={setFiltre}
        onCreer={creerTache}
        onBasculer={basculerTerminee}
        onSupprimer={supprimerTache}
      />
    </main>
  );
}
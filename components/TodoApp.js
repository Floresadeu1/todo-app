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
import BarreProjets from "./BarreProjets";
import SectionTaches from "./SectionTaches";
import Notification from "./Notification";

export default function TodoApp() {
  const [projets, setProjets] = useState([]);
  const [taches, setTaches] = useState([]);
  const [pret, setPret] = useState(false); // true quand les données sont chargées
  const [erreurProjet, setErreurProjet] = useState(null);
  const [erreurTache, setErreurTache] = useState(null);
  const [vue, setVue] = useState("tous"); // "tous" ou l'id (en texte) du projet affiché
  // Dernière suppression, tant qu'on peut encore l'annuler : { type: "tache" | "projet", objet }
  const [suppression, setSuppression] = useState(null);

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

  /** Renomme un projet : mêmes règles qu'à la création, sans se comparer à lui-même. */
  function renommerProjet(projet, nouveauNom) {
    const erreur = validerProjet(nouveauNom, projets, projet.id);
    setErreurProjet(erreur);
    if (erreur) return false;
    const nom = nouveauNom.trim();
    enregistrerRenommage({ ...projet, nom, nomNormalise: normaliser(nom) });
    return true;
  }

  async function enregistrerRenommage(projet) {
    try {
      await db.modifierProjet(projet);
    } catch {
      setErreurProjet("Ce projet existe déjà");
    }
    await recharger();
  }

  async function supprimerProjet(projet) {
    const nombreDeTaches = await db.compterTachesDuProjet(projet.id);
    const erreur = validerSuppressionProjet(nombreDeTaches);
    setErreurProjet(erreur);
    if (erreur) return;
    await db.supprimerProjet(projet.id);
    setSuppression({ type: "projet", objet: projet }); // on garde une copie pour pouvoir annuler
    await recharger();
  }

  function choisirVue(nouvelleVue) {
    setVue(nouvelleVue);
    setErreurProjet(null);
    setErreurTache(null);
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

  /** Modifie le titre et/ou le projet d'une tâche : mêmes règles qu'à la création. */
  function modifierTache(tache, nouveauTitre, nouveauProjetId) {
    const erreur = validerTache(nouveauTitre, nouveauProjetId, projets);
    setErreurTache(erreur);
    if (erreur) return false;
    enregistrerModification({ ...tache, titre: nouveauTitre.trim(), projetId: nouveauProjetId });
    return true;
  }

  async function enregistrerModification(tache) {
    await db.modifierTache(tache);
    await recharger();
  }

  async function basculerTerminee(tache) {
    const modifiee = { ...tache, terminee: !tache.terminee };
    // 1. L'écran change tout de suite (la case se coche immédiatement)…
    setTaches((actuelles) => actuelles.map((t) => (t.id === tache.id ? modifiee : t)));
    // 2. …puis on enregistre et on relit IndexedDB pour rester fidèle à ce qui est stocké
    await db.modifierTache(modifiee);
    await recharger();
  }

  async function supprimerTache(tache) {
    await db.supprimerTache(tache.id);
    setSuppression({ type: "tache", objet: tache }); // on garde une copie pour pouvoir annuler
    await recharger();
  }

  // ---------- Annulation d'une suppression ----------

  /**
   * La suppression est déjà enregistrée dans IndexedDB. Annuler = remettre la copie gardée,
   * AVEC SON id d'origine (put), pour que la tâche ou le projet revienne exactement comme avant.
   */
  async function annulerSuppression() {
    if (!suppression) return;
    const { type, objet } = suppression;
    setSuppression(null);
    try {
      if (type === "tache") await db.modifierTache(objet);
      else await db.modifierProjet(objet);
    } catch {
      // Cas rare : un projet du même nom a été créé entre-temps (index unique)
      setErreurProjet("Impossible de restaurer : un projet porte déjà ce nom");
    }
    await recharger();
  }

  const fermerNotification = useCallback(() => setSuppression(null), []);

  // ---------- Ce qu'on affiche ----------

  // Si le projet affiché a été supprimé, on revient à « Tous les projets »
  const projetAffiche = projets.find((p) => String(p.id) === vue) || null;
  const tachesAffichees = projetAffiche
    ? taches.filter((t) => t.projetId === projetAffiche.id)
    : taches;

  // Le compteur correspond TOUJOURS à ce qui est affiché
  const restantesAffichees = tachesAffichees.filter((t) => !t.terminee).length;

  // Tâches restantes par projet, pour les badges de la colonne de gauche
  const restantesParProjet = {};
  for (const t of taches) {
    if (!t.terminee) restantesParProjet[t.projetId] = (restantesParProjet[t.projetId] || 0) + 1;
  }
  const restantesTotal = taches.filter((t) => !t.terminee).length;

  return (
    <div className="appli" data-testid="application" data-pret={pret ? "true" : "false"}>
      <header className="entete">
        <h1>Mes tâches</h1>
        <p className="sous-titre">Organisez votre travail par projet</p>
      </header>

      <div className="grille">
        <BarreProjets
          projets={projets}
          vue={projetAffiche ? vue : "tous"}
          restantesParProjet={restantesParProjet}
          restantesTotal={restantesTotal}
          erreur={erreurProjet}
          onChoisir={choisirVue}
          onCreer={creerProjet}
          onRenommer={renommerProjet}
          onSupprimer={supprimerProjet}
          onAnnulerErreur={() => setErreurProjet(null)}
        />
        <SectionTaches
          projets={projets}
          projetAffiche={projetAffiche}
          taches={tachesAffichees}
          erreur={erreurTache}
          compteur={texteCompteur(restantesAffichees)}
          onCreer={creerTache}
          onModifier={modifierTache}
          onAnnulerErreur={() => setErreurTache(null)}
          onBasculer={basculerTerminee}
          onSupprimer={supprimerTache}
        />
      </div>

      {suppression && (
        <Notification
          message={
            suppression.type === "tache"
              ? `Tâche « ${suppression.objet.titre} » supprimée`
              : `Projet « ${suppression.objet.nom} » supprimé`
          }
          onAnnuler={annulerSuppression}
          onFermer={fermerNotification}
        />
      )}
    </div>
  );
}
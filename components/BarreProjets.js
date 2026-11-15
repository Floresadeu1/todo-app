// components/BarreProjets.js
// Colonne de gauche : la liste des projets (un clic affiche ses tâches),
// l'ajout, le renommage et la suppression d'un projet.
"use client";

import { useState } from "react";
import { couleurDuProjet } from "./couleurs";
import { IconeCorbeille, IconeCrayon } from "./Icones";

export default function BarreProjets({
  projets, vue, restantesParProjet, restantesTotal, erreur,
  onChoisir, onCreer, onRenommer, onSupprimer, onAnnulerErreur,
}) {
  const [nom, setNom] = useState("");               // champ « Nouveau projet »
  const [enEdition, setEnEdition] = useState(null); // id du projet en cours de renommage
  const [nomEdition, setNomEdition] = useState(""); // texte du champ de renommage

  function soumettre(evenement) {
    evenement.preventDefault(); // empêche le rechargement de la page par le formulaire
    if (onCreer(nom)) setNom(""); // on vide le champ seulement si le projet est accepté
  }

  function commencerEdition(projet) {
    setEnEdition(projet.id);
    setNomEdition(projet.nom);
    onAnnulerErreur();
  }

  function annulerEdition() {
    setEnEdition(null);
    onAnnulerErreur();
  }

  function enregistrerEdition(projet) {
    if (onRenommer(projet, nomEdition)) setEnEdition(null);
  }

  return (
    <aside className="carte barre" aria-labelledby="titre-projets">
      <h2 id="titre-projets" className="surtitre">Projets</h2>

      <ul className="menu" data-testid="liste-projets">
        <li>
          <button
            type="button"
            className={`entree ${vue === "tous" ? "active" : ""}`}
            data-testid="filtre-tous"
            aria-pressed={vue === "tous"}
            onClick={() => onChoisir("tous")}
          >
            <span className="pastille pastille-tous" aria-hidden="true" />
            <span className="nom">Tous les projets</span>
            <span className="badge">{restantesTotal}</span>
          </button>
        </li>

        {projets.map((p) =>
          enEdition === p.id ? (
            // ----- Ligne en mode édition -----
            <li key={p.id} className="ligne-projet edition" data-testid="projet-en-edition">
              <input
                autoFocus
                data-testid="edition-nom-projet"
                aria-label="Nouveau nom du projet"
                value={nomEdition}
                onChange={(e) => setNomEdition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") enregistrerEdition(p);
                  if (e.key === "Escape") annulerEdition();
                }}
              />
              <div className="actions-edition">
                <button type="button" className="principal petit" data-testid="enregistrer-projet"
                  onClick={() => enregistrerEdition(p)}>
                  Enregistrer
                </button>
                <button type="button" className="secondaire petit" data-testid="annuler-projet"
                  onClick={annulerEdition}>
                  Annuler
                </button>
              </div>
            </li>
          ) : (
            // ----- Ligne normale -----
            <li key={p.id} className="ligne-projet" data-testid="projet">
              <button
                type="button"
                className={`entree ${vue === String(p.id) ? "active" : ""}`}
                data-testid="choisir-projet"
                aria-pressed={vue === String(p.id)}
                onClick={() => onChoisir(String(p.id))}
              >
                <span className="pastille" style={{ background: couleurDuProjet(p.id) }} aria-hidden="true" />
                <span className="nom" data-testid="nom-projet-liste" title={p.nom}>{p.nom}</span>
                <span className="badge" data-testid="compteur-projet">{restantesParProjet[p.id] || 0}</span>
              </button>
              <button
                type="button"
                className="icone"
                data-testid="renommer-projet"
                aria-label={`Renommer le projet ${p.nom}`}
                title="Renommer le projet"
                onClick={() => commencerEdition(p)}
              >
                <IconeCrayon />
              </button>
              <button
                type="button"
                className="icone danger"
                data-testid="supprimer-projet"
                aria-label={`Supprimer le projet ${p.nom}`}
                title="Supprimer le projet"
                onClick={() => onSupprimer(p)}
              >
                <IconeCorbeille />
              </button>
            </li>
          )
        )}
      </ul>

      {projets.length === 0 && (
        <p className="vide petit" data-testid="aucun-projet">
          {"Aucun projet pour l'instant : créez-en un ci-dessous."}
        </p>
      )}

      <form className="ajout-projet" onSubmit={soumettre} noValidate>
        <input
          data-testid="nom-projet"
          aria-label="Nom du projet"
          placeholder="Nouveau projet"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <button type="submit" className="principal" data-testid="ajouter-projet">
          Ajouter
        </button>
      </form>

      {erreur && (
        <p className="erreur" role="alert" data-testid="erreur-projet">{erreur}</p>
      )}
    </aside>
  );
}

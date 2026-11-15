// components/SectionProjets.js
"use client";

import { useState } from "react";

export default function SectionProjets({ projets, erreur, onCreer, onSupprimer }) {
  const [nom, setNom] = useState(""); // texte tapé dans le champ

  function soumettre(evenement) {
    evenement.preventDefault(); // empêche le rechargement de la page par le formulaire
    if (onCreer(nom)) setNom(""); // on vide le champ seulement si le projet est accepté
  }

  return (
    <section aria-labelledby="titre-projets">
      <h2 id="titre-projets">Projets</h2>

      <form onSubmit={soumettre} noValidate>
        <input
          data-testid="nom-projet"
          aria-label="Nom du projet"
          placeholder="Nouveau projet"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <button type="submit" data-testid="ajouter-projet">
          Ajouter le projet
        </button>
      </form>

      {erreur && (
        <p className="erreur" role="alert" data-testid="erreur-projet">
          {erreur}
        </p>
      )}

      {projets.length === 0 ? (
        <p className="vide" data-testid="aucun-projet">
          {"Aucun projet pour l'instant."}
        </p>
      ) : (
        <ul data-testid="liste-projets">
          {projets.map((p) => (
            <li key={p.id} data-testid="projet">
              <span className="nom" data-testid="nom-projet-liste">{p.nom}</span>
              <button
                type="button"
                className="secondaire"
                data-testid="supprimer-projet"
                aria-label={`Supprimer le projet ${p.nom}`}
                onClick={() => onSupprimer(p.id)}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
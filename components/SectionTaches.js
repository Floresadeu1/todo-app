// components/SectionTaches.js
"use client";

import { useState } from "react";

export default function SectionTaches({
  projets, taches, erreur, filtre, compteur,
  onFiltrer, onCreer, onBasculer, onSupprimer,
}) {
  const [titre, setTitre] = useState("");
  const [projetChoisi, setProjetChoisi] = useState("");

  // Par défaut (ou si le projet choisi a été supprimé) : le premier projet de la liste
  const projetId = projets.some((p) => String(p.id) === projetChoisi)
    ? projetChoisi
    : projets[0] ? String(projets[0].id) : "";

  function soumettre(evenement) {
    evenement.preventDefault();
    if (onCreer(titre, Number(projetId))) setTitre("");
  }

  function nomDuProjet(id) {
    const projet = projets.find((p) => p.id === id);
    return projet ? projet.nom : "?";
  }

  return (
    <section aria-labelledby="titre-taches">
      <h2 id="titre-taches">Tâches</h2>

      <form onSubmit={soumettre} noValidate>
        <input
          data-testid="titre-tache"
          aria-label="Titre de la tâche"
          placeholder="Nouvelle tâche"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
        />
        <select
          data-testid="projet-tache"
          aria-label="Projet de la tâche"
          value={projetId}
          onChange={(e) => setProjetChoisi(e.target.value)}
        >
          {projets.map((p) => (
            <option key={p.id} value={String(p.id)}>{p.nom}</option>
          ))}
        </select>
        <button type="submit" data-testid="ajouter-tache">
          Ajouter la tâche
        </button>
      </form>

      {erreur && (
        <p className="erreur" role="alert" data-testid="erreur-tache">
          {erreur}
        </p>
      )}

      <label className="filtre">
        Afficher :{" "}
        <select
          data-testid="filtre-projet"
          value={filtre}
          onChange={(e) => onFiltrer(e.target.value)}
        >
          <option value="tous">Tous les projets</option>
          {projets.map((p) => (
            <option key={p.id} value={String(p.id)}>{p.nom}</option>
          ))}
        </select>
      </label>

      {taches.length === 0 ? (
        <p className="vide" data-testid="aucune-tache">Aucune tâche à afficher.</p>
      ) : (
        <ul data-testid="liste-taches">
          {taches.map((t) => (
            <li
              key={t.id}
              data-testid="tache"
              data-terminee={String(t.terminee)}
              className={t.terminee ? "terminee" : ""}
            >
              <input
                type="checkbox"
                data-testid="terminer"
                aria-label={`Terminer ${t.titre}`}
                checked={t.terminee}
                onChange={() => onBasculer(t)}
              />
              <span className="nom" data-testid="titre">{t.titre}</span>
              <span className="etiquette" data-testid="projet-de-la-tache">
                {nomDuProjet(t.projetId)}
              </span>
              <button
                type="button"
                className="secondaire"
                data-testid="supprimer-tache"
                aria-label={`Supprimer la tâche ${t.titre}`}
                onClick={() => onSupprimer(t.id)}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="compteur" data-testid="compteur">{compteur}</p>
    </section>
  );
}
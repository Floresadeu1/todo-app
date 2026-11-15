// components/SectionTaches.js
// Partie droite : les tâches du projet affiché (ou de tous les projets).
"use client";

import { useEffect, useState } from "react";
import { couleurDuProjet } from "./couleurs";
import { IconeCorbeille, IconeCrayon } from "./Icones";

export default function SectionTaches({
  projets, projetAffiche, taches, erreur, compteur,
  onCreer, onModifier, onAnnulerErreur, onBasculer, onSupprimer,
}) {
  const [titre, setTitre] = useState("");
  const [projetChoisi, setProjetChoisi] = useState("");
  const [enEdition, setEnEdition] = useState(null);         // id de la tâche en cours de modification
  const [titreEdition, setTitreEdition] = useState("");
  const [projetEdition, setProjetEdition] = useState("");

  // Quand on change de projet affiché, le formulaire propose ce projet par défaut
  useEffect(() => {
    setProjetChoisi(projetAffiche ? String(projetAffiche.id) : "");
  }, [projetAffiche]);

  // Projet du formulaire : le choix de l'utilisateur s'il existe encore, sinon le premier projet
  const projetId = projets.some((p) => String(p.id) === projetChoisi)
    ? projetChoisi
    : projets[0] ? String(projets[0].id) : "";

  function soumettre(evenement) {
    evenement.preventDefault();
    if (onCreer(titre, Number(projetId))) setTitre("");
  }

  function commencerEdition(tache) {
    setEnEdition(tache.id);
    setTitreEdition(tache.titre);
    setProjetEdition(String(tache.projetId));
    onAnnulerErreur();
  }

  function annulerEdition() {
    setEnEdition(null);
    onAnnulerErreur();
  }

  function enregistrerEdition(tache) {
    if (onModifier(tache, titreEdition, Number(projetEdition))) setEnEdition(null);
  }

  function projetDe(id) {
    return projets.find((p) => p.id === id);
  }

  return (
    <section className="carte contenu" aria-labelledby="titre-vue">
      <div className="entete-section">
        <h2 id="titre-vue" data-testid="titre-vue">
          {projetAffiche ? projetAffiche.nom : "Toutes les tâches"}
        </h2>
        <p className="compteur" data-testid="compteur">{compteur}</p>
      </div>

      <form className="ajout-tache" onSubmit={soumettre} noValidate>
        <input
          data-testid="titre-tache"
          aria-label="Titre de la tâche"
          placeholder="Ajouter une tâche…"
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
        <button type="submit" className="principal" data-testid="ajouter-tache">
          Ajouter
        </button>
      </form>

      {erreur && (
        <p className="erreur" role="alert" data-testid="erreur-tache">{erreur}</p>
      )}

      {taches.length === 0 ? (
        <div className="etat-vide" data-testid="aucune-tache">
          <p className="etat-vide-titre">Aucune tâche ici</p>
          <p className="vide">
            {projets.length === 0
              ? "Commencez par créer un projet dans la colonne de gauche."
              : "Ajoutez votre première tâche avec le champ ci-dessus."}
          </p>
        </div>
      ) : (
        <ul className="liste-taches" data-testid="liste-taches">
          {taches.map((t) => {
            // ----- Ligne en mode édition -----
            if (enEdition === t.id) {
              return (
                <li key={t.id} className="tache edition" data-testid="tache-en-edition">
                  <input
                    autoFocus
                    data-testid="edition-titre"
                    aria-label="Nouveau titre"
                    value={titreEdition}
                    onChange={(e) => setTitreEdition(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") enregistrerEdition(t);
                      if (e.key === "Escape") annulerEdition();
                    }}
                  />
                  <select
                    data-testid="edition-projet"
                    aria-label="Nouveau projet"
                    value={projetEdition}
                    onChange={(e) => setProjetEdition(e.target.value)}
                  >
                    {projets.map((p) => (
                      <option key={p.id} value={String(p.id)}>{p.nom}</option>
                    ))}
                  </select>
                  <button type="button" className="principal petit" data-testid="enregistrer"
                    onClick={() => enregistrerEdition(t)}>
                    Enregistrer
                  </button>
                  <button type="button" className="secondaire petit" data-testid="annuler"
                    onClick={annulerEdition}>
                    Annuler
                  </button>
                </li>
              );
            }

            // ----- Ligne normale -----
            const projet = projetDe(t.projetId);
            return (
              <li
                key={t.id}
                className={`tache ${t.terminee ? "terminee" : ""}`}
                data-testid="tache"
                data-terminee={String(t.terminee)}
              >
                <input
                  type="checkbox"
                  data-testid="terminer"
                  aria-label={`Terminer ${t.titre}`}
                  checked={t.terminee}
                  onChange={() => onBasculer(t)}
                />
                <span className="titre" data-testid="titre">{t.titre}</span>
                {!projetAffiche && projet && (
                  <span
                    className="etiquette"
                    data-testid="projet-de-la-tache"
                    style={{ color: couleurDuProjet(projet.id) }}
                  >
                    <span className="pastille" style={{ background: couleurDuProjet(projet.id) }} aria-hidden="true" />
                    {projet.nom}
                  </span>
                )}
                <button
                  type="button"
                  className="icone"
                  data-testid="modifier"
                  aria-label={`Modifier la tâche ${t.titre}`}
                  title="Modifier la tâche"
                  onClick={() => commencerEdition(t)}
                >
                  <IconeCrayon />
                </button>
                <button
                  type="button"
                  className="icone danger"
                  data-testid="supprimer-tache"
                  aria-label={`Supprimer la tâche ${t.titre}`}
                  title="Supprimer la tâche"
                  onClick={() => onSupprimer(t)}
                >
                  <IconeCorbeille />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

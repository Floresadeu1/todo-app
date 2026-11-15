// lib/regles.js
// Règles métier de l'application : fonctions PURES (pas d'IndexedDB, pas d'affichage).
// Chaque fonction de validation renvoie null si tout est valide, sinon le message d'erreur.

export const TITRE_MAX = 100;
export const NOM_PROJET_MAX = 50;

/** Forme comparable d'un nom : sans espaces autour, en minuscules ("  Études " → "études"). */
export function normaliser(texte) {
  return texte.trim().toLocaleLowerCase("fr");
}

/**
 * Vérifie le nom d'un projet par rapport aux projets existants.
 * idAIgnorer : lors d'un renommage, le projet ne doit pas se comparer à lui-même.
 */
export function validerProjet(nom, projetsExistants, idAIgnorer = null) {
  const propre = nom.trim();
  if (propre === "") return "Le nom du projet est obligatoire";
  if (propre.length > NOM_PROJET_MAX) {
    return `Le nom du projet ne doit pas dépasser ${NOM_PROJET_MAX} caractères`;
  }
  const doublon = projetsExistants.some(
    (p) => p.id !== idAIgnorer && p.nomNormalise === normaliser(propre)
  );
  if (doublon) return "Ce projet existe déjà";
  return null;
}

/** Vérifie une tâche (à l'ajout comme à la modification). */
export function validerTache(titre, projetId, projetsExistants) {
  if (projetsExistants.length === 0) return "Créez d'abord un projet";
  const propre = titre.trim();
  if (propre === "") return "Le titre est obligatoire";
  if (propre.length > TITRE_MAX) {
    return `Le titre ne doit pas dépasser ${TITRE_MAX} caractères`;
  }
  if (!projetsExistants.some((p) => p.id === projetId)) return "Choisissez un projet";
  return null;
}

/** Un projet ne peut être supprimé que s'il ne contient plus aucune tâche. */
export function validerSuppressionProjet(nombreDeTaches) {
  if (nombreDeTaches > 0) return "Impossible de supprimer un projet qui contient des tâches";
  return null;
}

/** Texte du compteur de tâches restantes (gère le singulier et le pluriel). */
export function texteCompteur(restantes) {
  if (restantes === 0) return "Aucune tâche restante";
  if (restantes === 1) return "1 tâche restante";
  return `${restantes} tâches restantes`;
}
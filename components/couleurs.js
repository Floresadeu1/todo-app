// components/couleurs.js
// Chaque projet reçoit une couleur, toujours la même pour un même projet (choisie selon son id).
const COULEURS = ["#4f6bed", "#16a34a", "#ea580c", "#9333ea", "#0891b2", "#db2777", "#ca8a04"];

export function couleurDuProjet(id) {
  return COULEURS[id % COULEURS.length];
}

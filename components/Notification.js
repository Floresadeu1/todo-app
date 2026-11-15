// components/Notification.js
// Bandeau affiché en bas de l'écran après une suppression, avec un bouton « Annuler ».
"use client";

import { useEffect } from "react";

export const DUREE_ANNULATION_MS = 6000; // le bouton « Annuler » reste disponible 6 secondes

export default function Notification({ message, onAnnuler, onFermer }) {
  // Le bandeau disparaît tout seul après quelques secondes
  useEffect(() => {
    const minuteur = setTimeout(onFermer, DUREE_ANNULATION_MS);
    return () => clearTimeout(minuteur); // nettoyage si le bandeau change ou disparaît avant
  }, [message, onFermer]);

  return (
    <div className="notification" role="status" data-testid="notification">
      <span data-testid="message-notification">{message}</span>
      <button type="button" className="lien" data-testid="annuler-suppression" onClick={onAnnuler}>
        Annuler
      </button>
      <button type="button" className="fermer" aria-label="Fermer" onClick={onFermer}>
        ×
      </button>
    </div>
  );
}
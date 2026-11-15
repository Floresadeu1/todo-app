// features/support/page-todo.js
// Page object (cours p. 282) : TOUS les sélecteurs de l'application sont ici, et nulle part ailleurs.
// Sélecteurs stables : attributs data-testid. Aucune attente fixe (pas de sleep) :
// les assertions de Playwright attendent automatiquement que la condition soit vraie.

import { expect } from "playwright/test";

export class PageTodo {
  constructor(page, url) {
    this.page = page;
    this.url = url;
  }

  // ---------- Navigation ----------

  async ouvrir() {
    await this.page.goto(this.url);
    await this.attendreChargement();
  }

  async recharger() {
    await this.attendreFinDesEcritures(); // sinon une écriture en cours serait perdue
    await this.page.reload();
    await this.attendreChargement();
  }

  async attendreChargement() {
    // L'application met data-pret="true" quand IndexedDB a été lue.
    // Délai de 30 s : avec « npm run dev », la page est compilée au premier chargement.
    await expect(this.page.getByTestId("application")).toHaveAttribute("data-pret", "true", {
      timeout: 30_000,
    });
  }

  async attendreFinDesEcritures() {
    // lib/db.js tient à jour window.todoEcrituresEnCours (nombre d'écritures pas encore terminées)
    await this.page.waitForFunction(() => !window.todoEcrituresEnCours);
  }

  // ---------- Projets ----------

  async creerProjet(nom) {
    await this.page.getByTestId("nom-projet").fill(nom);
    await this.page.getByTestId("ajouter-projet").click();
  }

  lignesProjets() {
    return this.page.getByTestId("projet");
  }

  nomsProjets() {
    return this.page.getByTestId("nom-projet-liste");
  }

  /** La ligne du projet dont le nom est EXACTEMENT celui donné. */
  projet(nom) {
    return this.lignesProjets().filter({
      has: this.page.getByTestId("nom-projet-liste").getByText(nom, { exact: true }),
    });
  }

  badgeDuProjet(nom) {
    return this.projet(nom).getByTestId("compteur-projet");
  }

  optionsProjetDuFormulaire() {
    return this.page.getByTestId("projet-tache").locator("option");
  }

  erreurProjet() {
    return this.page.getByTestId("erreur-projet");
  }

  async renommerProjet(ancienNom, nouveauNom, { annulerAvecEchap = false } = {}) {
    await this.projet(ancienNom).getByTestId("renommer-projet").click();
    const champ = this.page.getByTestId("edition-nom-projet");
    await champ.fill(nouveauNom);
    if (annulerAvecEchap) await champ.press("Escape");
    else await this.page.getByTestId("enregistrer-projet").click();
  }

  async supprimerProjet(nom) {
    await this.projet(nom).getByTestId("supprimer-projet").click();
  }

  async afficherProjet(nom) {
    await this.projet(nom).getByTestId("choisir-projet").click();
    await expect(this.titreVue()).toHaveText(nom);
  }

  async afficherTousLesProjets() {
    await this.page.getByTestId("filtre-tous").click();
    await expect(this.titreVue()).toHaveText("Toutes les tâches");
  }

  // ---------- Tâches ----------

  /**
   * projet : le nom du projet à choisir dans la liste déroulante,
   * ou undefined pour garder le projet proposé par défaut.
   */
  async creerTache(titre, projet) {
    await this.page.getByTestId("titre-tache").fill(titre);
    if (projet !== undefined) {
      await this.page.getByTestId("projet-tache").selectOption({ label: projet });
    }
    await this.page.getByTestId("ajouter-tache").click();
  }

  lignesTaches() {
    return this.page.getByTestId("tache");
  }

  /** La ligne de la tâche dont le titre est EXACTEMENT celui donné. */
  tache(titre) {
    return this.lignesTaches().filter({
      has: this.page.getByTestId("titre").getByText(titre, { exact: true }),
    });
  }

  titresAffiches() {
    return this.page.getByTestId("liste-taches").getByTestId("titre");
  }

  erreurTache() {
    return this.page.getByTestId("erreur-tache");
  }

  compteur() {
    return this.page.getByTestId("compteur");
  }

  titreVue() {
    return this.page.getByTestId("titre-vue");
  }

  async modifierTache(titre, { nouveauTitre, nouveauProjet, annulerAvecEchap = false }) {
    await this.tache(titre).getByTestId("modifier").click();
    const champ = this.page.getByTestId("edition-titre");
    if (nouveauTitre !== undefined) await champ.fill(nouveauTitre);
    if (nouveauProjet !== undefined) {
      await this.page.getByTestId("edition-projet").selectOption({ label: nouveauProjet });
    }
    if (annulerAvecEchap) await champ.press("Escape");
    else await this.page.getByTestId("enregistrer").click();
  }

  /** Coche ou décoche la case « terminée » d'une tâche. */
  async basculerTerminee(titre) {
    await this.tache(titre).getByTestId("terminer").click();
  }

  async supprimerTache(titre) {
    await this.tache(titre).getByTestId("supprimer-tache").click();
    // Le bandeau « Annuler » prouve que la suppression est enregistrée ET que le minuteur
    // des 6 secondes est lancé. Sans cette attente, un test qui avance l'horloge
    // pourrait le faire AVANT que le minuteur existe (bug de course trouvé avec npm run dev).
    await expect(this.notification()).toBeVisible();
  }

  notification() {
    return this.page.getByTestId("notification");
  }

  messageNotification() {
    return this.page.getByTestId("message-notification");
  }

  async annulerSuppression() {
    await this.page.getByTestId("annuler-suppression").click();
  }

  // ---------- Lecture directe d'IndexedDB (oracle au niveau des données) ----------

  /** Renvoie { projets: [...], taches: [...] } tels qu'ils sont enregistrés dans le navigateur. */
  async lireIndexedDB() {
    await this.attendreFinDesEcritures();
    return this.page.evaluate(
      () =>
        new Promise((ok, ko) => {
          const ouverture = indexedDB.open("todo-db");
          ouverture.onerror = () => ko(ouverture.error);
          ouverture.onsuccess = () => {
            const db = ouverture.result;
            const tx = db.transaction(["projets", "taches"], "readonly");
            const projets = tx.objectStore("projets").getAll();
            const taches = tx.objectStore("taches").getAll();
            tx.oncomplete = () => {
              db.close();
              ok({ projets: projets.result, taches: taches.result });
            };
            tx.onerror = () => ko(tx.error);
          };
        })
    );
  }
}
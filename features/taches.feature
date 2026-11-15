# language: fr
@taches
Fonctionnalité: Gestion des tâches
  Afin de ne rien oublier
  En tant qu'utilisateur du gestionnaire de tâches
  Je veux ajouter, modifier, terminer et supprimer des tâches rangées dans des projets

  Contexte:
    Soit le gestionnaire de tâches est ouvert
    Et le projet "Etude" existe
    Et le projet "Maison" existe

  # ---------- Ajouter ----------

  Scénario: Ajouter une tâche dans un projet
    Quand je crée la tâche "Réviser INF563" dans le projet "Etude"
    Alors la tâche "Réviser INF563" apparaît dans le projet "Etude"
    Et le compteur indique "1 tâche restante"

  Scénario: Ajouter des tâches dans des projets différents
    Quand je crée la tâche "Réviser INF563" dans le projet "Etude"
    Et je crée la tâche "Faire les courses" dans le projet "Maison"
    Alors la tâche "Réviser INF563" apparaît dans le projet "Etude"
    Et la tâche "Faire les courses" apparaît dans le projet "Maison"
    Et le compteur indique "2 tâches restantes"

  Scénario: Refuser une tâche sans titre
    Quand je crée la tâche "" dans le projet "Etude"
    Alors la tâche est refusée avec le message "Le titre est obligatoire"
    Et la liste des tâches est vide

  # Valeurs limites : 100 caractères acceptés, 101 refusés.
  @limites
  Plan du scénario: Longueur maximale du titre d'une tâche
    Quand je crée une tâche dont le titre fait <longueur> caractères dans le projet "Etude"
    Alors la tâche est <resultat>

    Exemples:
      | longueur | resultat |
      | 1        | acceptée |
      | 100      | acceptée |
      | 101      | refusée  |

  # ---------- Modifier ----------

  Scénario: Modifier le titre d'une tâche
    Soit la tâche "Réviser" existe dans le projet "Etude"
    Quand je modifie le titre de la tâche "Réviser" en "Réviser le chapitre 5"
    Alors la tâche "Réviser le chapitre 5" apparaît dans le projet "Etude"
    Et la tâche "Réviser" est absente de la liste

  Scénario: Déplacer une tâche vers un autre projet
    Soit la tâche "Faire les courses" existe dans le projet "Etude"
    Quand je déplace la tâche "Faire les courses" vers le projet "Maison"
    Alors la tâche "Faire les courses" apparaît dans le projet "Maison"

  Scénario: Refuser une modification avec un titre vide
    Soit la tâche "Réviser" existe dans le projet "Etude"
    Quand je modifie le titre de la tâche "Réviser" en ""
    Alors la tâche est refusée avec le message "Le titre est obligatoire"

  Scénario: Annuler une modification avec la touche Échap
    Soit la tâche "Réviser" existe dans le projet "Etude"
    Quand je commence à modifier le titre de la tâche "Réviser" en "Autre titre" puis j'appuie sur Échap
    Alors la tâche "Réviser" apparaît dans le projet "Etude"
    Et la tâche "Autre titre" est absente de la liste

  # ---------- Terminer (deux états : à faire ⇄ terminée) ----------

  Scénario: Marquer une tâche comme terminée
    Soit la tâche "Réviser" existe dans le projet "Etude"
    Et la tâche "Faire les courses" existe dans le projet "Maison"
    Quand je marque la tâche "Réviser" comme terminée
    Alors la tâche "Réviser" est affichée comme terminée
    Et le compteur indique "1 tâche restante"

  Scénario: Remettre une tâche terminée à faire
    Soit la tâche "Réviser" existe dans le projet "Etude"
    Et la tâche "Réviser" est terminée
    Quand je marque la tâche "Réviser" comme à faire
    Alors la tâche "Réviser" est affichée comme à faire
    Et le compteur indique "1 tâche restante"

  # ---------- Supprimer ----------

  Scénario: Supprimer une tâche
    Soit la tâche "Réviser" existe dans le projet "Etude"
    Quand je supprime la tâche "Réviser"
    Alors la liste des tâches est vide
    Et le message "Tâche « Réviser » supprimée" est affiché
    Et le compteur indique "Aucune tâche restante"

  Scénario: Annuler la suppression d'une tâche restaure son état
    Soit la tâche "Réviser" existe dans le projet "Etude"
    Et la tâche "Réviser" est terminée
    Quand je supprime la tâche "Réviser"
    Et j'annule la suppression
    Alors la tâche "Réviser" apparaît dans le projet "Etude"
    Et la tâche "Réviser" est affichée comme terminée

  # Le temps est contrôlé (horloge simulée) : pas besoin d'attendre 6 vraies secondes.
  @horloge
  Scénario: Passé le délai d'annulation, la suppression est définitive
    Soit la tâche "Réviser" existe dans le projet "Etude"
    Quand je supprime la tâche "Réviser"
    Et 6 secondes s'écoulent
    Alors le message de suppression a disparu
    Et la liste des tâches est vide

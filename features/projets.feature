# language: fr
@projets
Fonctionnalité: Gestion des projets
  Afin de ranger mes tâches par thème
  En tant qu'utilisateur du gestionnaire de tâches
  Je veux créer, renommer et supprimer des projets

  Contexte:
    Soit le gestionnaire de tâches est ouvert

  Scénario: Créer un projet
    Quand je crée le projet "Etude"
    Alors le projet "Etude" apparaît dans la liste des projets
    Et le projet "Etude" est proposé pour les nouvelles tâches

  Scénario: Les projets sont classés par ordre alphabétique
    Quand je crée le projet "Travaux pratiques"
    Et je crée le projet "Etude"
    Alors les projets affichés sont, dans l'ordre :
      | Etude             |
      | Travaux pratiques |

  # Classes d'équivalence invalides : nom vide, doublon exact, doublon avec une autre casse.
  # (Les cellules d'un tableau Gherkin sont rognées : le nom « blanc » est testé
  #  par les tests unitaires de lib/regles.js.)
  Plan du scénario: Refuser un nom de projet invalide
    Soit le projet "Etude" existe
    Quand je crée le projet "<nom>"
    Alors le projet est refusé avec le message "<message>"
    Et la liste contient 1 projet

    Exemples:
      | nom   | message                          |
      |       | Le nom du projet est obligatoire |
      | Etude | Ce projet existe déjà            |
      | ETUDE | Ce projet existe déjà            |

  Scénario: Les espaces autour du nom ne créent pas un nouveau projet
    Soit le projet "Etude" existe
    Quand je crée le projet "   Etude   "
    Alors le projet est refusé avec le message "Ce projet existe déjà"

  # Valeurs limites : 50 caractères acceptés, 51 refusés.
  @limites
  Plan du scénario: Longueur maximale du nom d'un projet
    Quand je crée un projet dont le nom fait <longueur> caractères
    Alors le projet est <resultat>

    Exemples:
      | longueur | resultat |
      | 1        | accepté  |
      | 50       | accepté  |
      | 51       | refusé   |

  Scénario: Renommer un projet
    Soit le projet "Tp" existe
    Quand je renomme le projet "Tp" en "Travaux pratiques"
    Alors le projet "Travaux pratiques" apparaît dans la liste des projets
    Et le projet "Tp" est absent de la liste des projets

  Scénario: Un projet peut changer la casse de son propre nom
    Soit le projet "etude" existe
    Quand je renomme le projet "etude" en "Etude"
    Alors le projet "Etude" apparaît dans la liste des projets

  Scénario: Refuser de renommer un projet avec le nom d'un autre projet
    Soit le projet "Etude" existe
    Et le projet "Tp" existe
    Quand je renomme le projet "Tp" en "etude"
    Alors le projet est refusé avec le message "Ce projet existe déjà"

  Scénario: Annuler un renommage avec la touche Échap
    Soit le projet "Tp" existe
    Quand je commence à renommer le projet "Tp" en "Autre nom" puis j'appuie sur Échap
    Alors le projet "Tp" apparaît dans la liste des projets
    Et le projet "Autre nom" est absent de la liste des projets

  Scénario: Supprimer un projet vide
    Soit le projet "Tp" existe
    Quand je supprime le projet "Tp"
    Alors le projet "Tp" est absent de la liste des projets
    Et le message "Projet « Tp » supprimé" est affiché

  Scénario: Refuser la suppression d'un projet qui contient des tâches
    Soit le projet "Etude" existe
    Et la tâche "Réviser" existe dans le projet "Etude"
    Quand je supprime le projet "Etude"
    Alors le projet est refusé avec le message "Impossible de supprimer un projet qui contient des tâches"
    Et le projet "Etude" apparaît dans la liste des projets

  Scénario: Annuler la suppression d'un projet
    Soit le projet "Tp" existe
    Quand je supprime le projet "Tp"
    Et j'annule la suppression
    Alors le projet "Tp" apparaît dans la liste des projets

  Scénario: Aucune tâche ne peut être créée tant qu'il n'existe aucun projet
    Quand je crée la tâche "Réviser" sans projet
    Alors la tâche est refusée avec le message "Créez d'abord un projet"
    Et la liste des tâches est vide

# language: fr
@vues
Fonctionnalité: Afficher les tâches par projet
  Afin de me concentrer sur un sujet à la fois
  En tant qu'utilisateur du gestionnaire de tâches
  Je veux afficher les tâches d'un seul projet

  Contexte:
    Soit le gestionnaire de tâches est ouvert
    Et le projet "Etude" existe
    Et le projet "Maison" existe
    Et la tâche "Réviser" existe dans le projet "Etude"
    Et la tâche "Faire les courses" existe dans le projet "Maison"
    Et la tâche "Ranger le salon" existe dans le projet "Maison"

  Scénario: Afficher les tâches d'un seul projet
    Quand j'affiche le projet "Maison"
    Alors le titre de la vue est "Maison"
    Et seules les tâches suivantes sont affichées :
      | Faire les courses |
      | Ranger le salon   |

  Scénario: Revenir à toutes les tâches
    Soit j'affiche le projet "Maison"
    Quand j'affiche tous les projets
    Alors le titre de la vue est "Toutes les tâches"
    Et la liste contient 3 tâches

  Scénario: Le compteur correspond à ce qui est affiché
    Soit la tâche "Ranger le salon" est terminée
    Quand j'affiche le projet "Maison"
    Alors le compteur indique "1 tâche restante"
    Quand j'affiche tous les projets
    Alors le compteur indique "2 tâches restantes"

  Scénario: Chaque projet affiche son nombre de tâches restantes
    Soit la tâche "Ranger le salon" est terminée
    Alors le badge du projet "Etude" indique 1
    Et le badge du projet "Maison" indique 1

  Scénario: Le formulaire propose le projet affiché
    Soit j'affiche le projet "Maison"
    Quand je crée la tâche "Arroser les plantes" sans choisir de projet
    Et j'affiche tous les projets
    Alors la tâche "Arroser les plantes" apparaît dans le projet "Maison"

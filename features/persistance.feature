# language: fr
@persistance
Fonctionnalité: Sauvegarde dans IndexedDB
  Afin de retrouver mes tâches quand je reviens
  En tant qu'utilisateur du gestionnaire de tâches
  Je veux que mes projets et mes tâches soient enregistrés dans le navigateur

  Contexte:
    Soit le gestionnaire de tâches est ouvert
    Et le projet "Etude" existe
    Et la tâche "Réviser" existe dans le projet "Etude"

  # Oracle au niveau des DONNÉES : on lit directement la base du navigateur
  Scénario: Les données sont enregistrées dans IndexedDB
    Alors IndexedDB contient 1 projet et 1 tâche
    Et dans IndexedDB, la tâche "Réviser" appartient au projet "Etude" et n'est pas terminée

  # Oracle au niveau de l'INTERFACE : ce que l'utilisateur voit après être revenu
  Scénario: Les données sont toujours là après un rechargement de la page
    Quand je recharge la page
    Alors le projet "Etude" apparaît dans la liste des projets
    Et la tâche "Réviser" apparaît dans le projet "Etude"

  Scénario: Les modifications sont conservées après un rechargement
    Soit le projet "Maison" existe
    Quand je renomme le projet "Etude" en "Cours"
    Et je déplace la tâche "Réviser" vers le projet "Maison"
    Et je modifie le titre de la tâche "Réviser" en "Réviser le chapitre 5"
    Et je marque la tâche "Réviser le chapitre 5" comme terminée
    Et je recharge la page
    Alors le projet "Cours" apparaît dans la liste des projets
    Et la tâche "Réviser le chapitre 5" apparaît dans le projet "Maison"
    Et la tâche "Réviser le chapitre 5" est affichée comme terminée

  Scénario: Une suppression est conservée après un rechargement
    Quand je supprime la tâche "Réviser"
    Et je recharge la page
    Alors la liste des tâches est vide
    Et IndexedDB contient 1 projet et 0 tâche

# Planning cantine écodélégués — Collège Jean Giono

Gestion des tables de tri au self. Planning en ligne où les élèves s'inscrivent eux-mêmes pour aider au service du midi, selon leur emploi du temps.

* **Postes :** scan plateau, pain et fruits, biodéchets et emballages (2 places de titulaire et 2 de remplaçant chacun).
* **Calendrier :** vraies dates, du 2 novembre 2026 au 30 juin 2027, lundi, mardi, jeudi et vendredi, par demi-heure de 11h30 à 13h30, hors vacances (zone B) et jours fériés. Un élève peut s'inscrire pour une date ou chaque semaine jusqu'en juin.
* **Page élève :** `index.html` (GitHub Pages).
* **Affiche à imprimer avec QR code :** `affiche.html`.
* **Vue professeur :** `admin.html` (code professeur) : taux de remplissage, postes à pourvoir, planning nominatif de la semaine, liste des élèves.
* **Serveur :** `apps_script/Code.gs`, Apps Script lié à un Google Sheet propre au collège.

## Installation
1. Créer un Google Sheet vide (« Planning brigade cantine »), puis Extensions > Apps Script et coller `apps_script/Code.gs`.
2. Déployer > Nouveau déploiement > Application Web : exécuter en tant que *Moi*, accès *Tout le monde*.
3. Coller l'adresse `…/exec` dans `index.html`, ligne `var ADRESSE_PLANNING = "";`. Tant qu'elle est vide, la page tourne en aperçu, sans rien enregistrer.
4. Settings > Pages > Deploy from a branch > `main` / `/ (root)`.

Jours, créneaux, postes, places, remplaçants, dates de début et de fin, fermetures et code professeur se règlent dans l'onglet « Réglages » du Sheet. « Inscriptions ouvertes : Non » fige le planning. Le classeur se télécharge en Excel via Fichier > Télécharger.

## Données personnelles
* Données collectées : prénom, initiale du nom, classe, créneaux choisis. Aucun nom de famille complet, aucune adresse mail.
* La page publique n'affiche **aucun nom** : une place occupée apparaît seulement comme « Pris ». Chaque élève ne voit ses créneaux qu'avec son code personnel à 4 chiffres. Ce code n'est lisible que par le professeur (Sheet et vue professeur), pour aider un élève qui l'a oublié.
* Les noms ne sont visibles que dans le Google Sheet et dans la vue professeur, protégée par un code.
* L'onglet « Inscriptions » est vidé en fin d'année scolaire.

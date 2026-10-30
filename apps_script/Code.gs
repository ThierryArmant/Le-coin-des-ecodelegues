/**
 * Brigade cantine — Collège Jean Giono : serveur du planning d'inscription
 * (la page élève est index.html, hébergée sur GitHub Pages)
 *
 * Installation (une seule fois) :
 * 1. Crée un Google Sheet vide, par exemple « Planning brigade cantine ».
 * 2. Dans ce Sheet : Extensions > Apps Script. Remplace tout le contenu par ce fichier.
 * 3. Déployer > Nouveau déploiement > Type : Application Web
 *      Exécuter en tant que : Moi
 *      Qui a accès : Tout le monde
 *    Autorise l'accès quand Google le demande.
 * 4. Copie l'adresse du déploiement (…/exec) et colle-la dans index.html,
 *    ligne « var ADRESSE_PLANNING = "" ».
 *
 * Mise à jour du script : colle la nouvelle version, enregistre, puis
 * Déployer > Gérer les déploiements > crayon > Version : Nouvelle version > Déployer.
 * L'adresse reste la même.
 *
 * Réglages (onglet « Réglages ») : jours, créneaux, postes et places, dates de début
 * et de fin, fermetures (vacances et jours fériés). Les dates s'écrivent JJ/MM/AAAA ;
 * une période s'écrit « JJ/MM/AAAA > JJ/MM/AAAA ».
 * Pour retirer un élève : supprime sa ligne dans l'onglet « Inscriptions ».
 *
 * Données personnelles : la page publique n'affiche aucun nom. Prénom, initiale
 * et classe ne sont visibles que dans ce Sheet. Vide l'onglet « Inscriptions »
 * en fin d'année scolaire.
 */

const ONGLET_INSCRIPTIONS = 'Inscriptions';
const ONGLET_REGLAGES = 'Réglages';

// Calendrier 2026-2027, zone B (académie d'Aix-Marseille)
const REGLAGES_PAR_DEFAUT = [
  ['Paramètre', 'Valeur', 'Aide'],
  ['Titre', 'Brigade cantine Giono', 'Titre affiché en haut de la page'],
  ['Jours', 'Lundi, Mardi, Jeudi, Vendredi', 'Jours de cantine, séparés par des virgules'],
  ['Créneaux', '11h30-12h00, 12h00-12h30, 12h30-13h00, 13h00-13h30', 'Séparés par des virgules'],
  ['Postes', 'Scan plateau:2; Pain et fruits:2; Biodéchets et emballages:2', 'Nom:nombre de places, séparés par des points-virgules'],
  ['Inscriptions ouvertes', 'Oui', 'Oui ou Non'],
  ['Code professeur', '', 'Code d\'accès à la vue admin (admin.html), 6 caractères minimum. Ne le donne pas aux élèves.'],
  ['Remplaçants par poste', '2', 'Places de remplaçant (doublure) par poste, en cas d\'absence ; 0 pour aucune'],
  ['Début', '02/11/2026', 'Premier jour du planning (JJ/MM/AAAA)'],
  ['Fin', '30/06/2027', 'Dernier jour du planning (JJ/MM/AAAA)'],
  ['Fermetures',
    '19/12/2026 > 03/01/2027; 20/02/2027 > 07/03/2027; 29/03/2027; 17/04/2027 > 02/05/2027; 06/05/2027 > 07/05/2027; 17/05/2027',
    'Vacances et jours fériés : dates ou périodes « début > fin », séparées par des points-virgules'],
];

const ENTETES_INSCRIPTIONS = ['ID', 'Horodatage', 'Date', 'Jour', 'Créneau', 'Poste', 'Prénom', 'Initiale', 'Classe', 'Empreinte code', 'Rôle'];
const NOMS_JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/* ---------- Points d'entrée ---------- */

function doGet(e) {
  return repondre_(() => {
    const action = (e && e.parameter && e.parameter.action) || 'getData';
    if (action !== 'getData') throw new Error('Action inconnue.');
    return getData(null);
  });
}

function doPost(e) {
  return repondre_(() => {
    const corps = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (corps.action === 'getData') return getData(corps);
    if (corps.action === 'inscrire') return inscrire(corps);
    if (corps.action === 'retirer') return retirer(corps.id, corps);
    if (corps.action === 'admin') return admin(corps.code);
    throw new Error('Action inconnue.');
  });
}

function repondre_(fn) {
  let sortie;
  try { sortie = fn(); } catch (err) { sortie = { erreur: String(err && err.message || err) }; }
  return ContentService.createTextOutput(JSON.stringify(sortie)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- API appelée par la page ---------- */

/**
 * Données publiques : aucune information nominative.
 * Chaque place prise n'indique que date, créneau et poste.
 * Si l'élève fournit son identité et son code, ses propres inscriptions sont marquées « mien ».
 */
function getData(identite) {
  preparerOnglets_();
  const config = lireReglages_();
  const liste = lireInscriptions_();
  let id = null, codeRefuse = false;
  if (identite && identite.prenom) {
    id = verifierIdentite_(identite);
    const siennes = liste.filter(i => cle_(i) === id.cle);
    if (siennes.length && siennes[0].empreinte !== id.empreinte) { codeRefuse = true; id = null; }
  }
  return {
    config: config,
    aujourdhui: Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd'),
    codeRefuse: codeRefuse,
    inscriptions: liste.map(i => {
      const mien = !!id && cle_(i) === id.cle;
      const o = { date: i.date, creneau: i.creneau, poste: i.poste, role: i.role, mien: mien };
      if (mien) o.id = i.id;
      return o;
    }),
  };
}

/**
 * demande : { date, creneau, poste, role ('titulaire' ou 'remplacant'), repeter, prenom, initiale, classe, code }
 * Avec repeter = true, inscrit aussi le même jour de la semaine, même créneau
 * et même poste, chaque semaine ouverte jusqu'à la fin du planning.
 */
function inscrire(demande) {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(20000);
  try {
    const config = lireReglages_();
    if (!config.ouvert) throw new Error('Les inscriptions sont fermées pour le moment.');
    const id = verifierIdentite_(demande);
    const aujourdhui = Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd');
    const ouvertes = datesOuvertes_(config).filter(d => d >= aujourdhui);
    if (ouvertes.indexOf(demande.date) < 0) throw new Error('Cette date n\'est pas ouverte.');
    if (config.creneaux.indexOf(demande.creneau) < 0) throw new Error('Créneau inconnu.');
    const poste = config.postes.filter(p => p.nom === demande.poste)[0];
    if (!poste) throw new Error('Poste inconnu.');
    const role = demande.role === 'remplacant' ? 'remplacant' : 'titulaire';
    const capacite = role === 'remplacant' ? config.remplacants : poste.places;
    if (capacite < 1) throw new Error('Pas de place de remplaçant sur ce poste.');

    const liste = lireInscriptions_();
    const dejaInscrit = liste.filter(i => cle_(i) === id.cle)[0];
    if (dejaInscrit && dejaInscrit.empreinte !== id.empreinte) {
      throw new Error('Ce prénom et cette classe sont déjà utilisés avec un autre code. Reprends ton code habituel.');
    }

    const jourSemaine = jourDe_(demande.date);
    const cibles = demande.repeter
      ? ouvertes.filter(d => d >= demande.date && jourDe_(d) === jourSemaine)
      : [demande.date];

    const lignes = [], ajoutees = [], sautees = [];
    cibles.forEach(d => {
      const memeCase = liste.filter(i => i.date === d && i.creneau === demande.creneau);
      const dejaLa = memeCase.some(i => cle_(i) === id.cle);
      const pleine = memeCase.filter(i => i.poste === poste.nom && i.role === role).length >= capacite;
      if (dejaLa || pleine) { sautees.push(d); return; }
      lignes.push([Utilities.getUuid().slice(0, 8), new Date(), d, NOMS_JOURS[jourDe_(d)], demande.creneau, poste.nom,
                   id.prenom, id.initiale, id.classe, id.empreinte, role === 'remplacant' ? 'Remplaçant' : 'Titulaire']);
      ajoutees.push(d);
    });

    if (!lignes.length) {
      throw new Error(cibles.length === 1
        ? 'Place indisponible : le poste est complet ou tu as déjà un poste sur ce créneau.'
        : 'Aucune place disponible sur ces semaines.');
    }
    const f = feuille_(ONGLET_INSCRIPTIONS);
    f.getRange(f.getLastRow() + 1, 1, lignes.length, lignes[0].length).setValues(lignes);
    SpreadsheetApp.flush();
    const sortie = getData(demande);
    sortie.ajoutees = ajoutees;
    sortie.sautees = sautees;
    return sortie;
  } finally {
    verrou.releaseLock();
  }
}

function retirer(idInscription, identite) {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(20000);
  try {
    const id = verifierIdentite_(identite);
    const f = feuille_(ONGLET_INSCRIPTIONS);
    const valeurs = f.getDataRange().getDisplayValues();
    for (let r = 1; r < valeurs.length; r++) {
      if (String(valeurs[r][0]) === String(idInscription)) {
        const ligne = { prenom: valeurs[r][6], initiale: valeurs[r][7], classe: valeurs[r][8] };
        if (cle_(ligne) !== id.cle || valeurs[r][9] !== id.empreinte) {
          throw new Error('Code incorrect : seule la personne inscrite peut se retirer.');
        }
        f.deleteRow(r + 1);
        SpreadsheetApp.flush();
        return getData(identite);
      }
    }
    throw new Error('Cette inscription n\'existe plus.');
  } finally {
    verrou.releaseLock();
  }
}

/**
 * Vue admin : toutes les inscriptions avec les noms, réservée au code professeur
 * (onglet « Réglages »). Une pause est imposée après chaque code faux.
 */
function admin(code) {
  preparerOnglets_();
  const brut = feuille_(ONGLET_REGLAGES).getDataRange().getDisplayValues()
    .filter(l => String(l[0]).trim() === 'Code professeur')[0];
  const attendu = brut ? String(brut[1]).trim() : '';
  if (attendu.length < 6) throw new Error('Choisis d\'abord un code d\'au moins 6 caractères dans l\'onglet « Réglages », ligne « Code professeur ».');
  if (String(code || '') !== attendu) { Utilities.sleep(2000); throw new Error('Code professeur incorrect.'); }
  const config = lireReglages_();
  return {
    config: config,
    aujourdhui: Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd'),
    dates: datesOuvertes_(config),
    inscriptions: lireInscriptions_().map(i => ({
      date: i.date, creneau: i.creneau, poste: i.poste, role: i.role,
      prenom: i.prenom, initiale: i.initiale, classe: i.classe,
    })),
  };
}

/* ---------- Calendrier ---------- */

// "02/11/2026", "2/11/2026" ou "2026-11-02" -> "2026-11-02"
function normDate_(s) {
  s = String(s || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return '';
}

function jourDe_(iso) {
  const p = iso.split('-').map(Number);
  return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay();
}

function datesOuvertes_(config) {
  const jours = config.jours.map(j => NOMS_JOURS.indexOf(j)).filter(n => n >= 0);
  const sortie = [];
  if (!config.debut || !config.fin) return sortie;
  const p = config.debut.split('-').map(Number);
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  for (let k = 0; k < 400; k++) {
    const iso = d.toISOString().slice(0, 10);
    if (iso > config.fin) break;
    const ferme = config.fermetures.some(f => iso >= f[0] && iso <= f[1]);
    if (!ferme && jours.indexOf(d.getUTCDay()) >= 0) sortie.push(iso);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return sortie;
}

/* ---------- Outils internes ---------- */

function feuille_(nom) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nom);
}

function preparerOnglets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let r = ss.getSheetByName(ONGLET_REGLAGES);
  if (!r) {
    r = ss.insertSheet(ONGLET_REGLAGES);
    r.getRange(1, 1, REGLAGES_PAR_DEFAUT.length, 3).setNumberFormat('@').setValues(REGLAGES_PAR_DEFAUT);
    r.getRange(1, 1, 1, 3).setFontWeight('bold');
    r.setColumnWidth(1, 170); r.setColumnWidth(2, 520); r.setColumnWidth(3, 420);
  } else {
    // Ajoute les réglages apparus depuis la première installation
    const presents = r.getRange(1, 1, Math.max(1, r.getLastRow()), 1).getDisplayValues().map(l => l[0]);
    REGLAGES_PAR_DEFAUT.slice(1).forEach(l => {
      if (presents.indexOf(l[0]) < 0) {
        r.getRange(r.getLastRow() + 1, 1, 1, 3).setNumberFormat('@').setValues([l]);
      }
    });
  }
  let f = ss.getSheetByName(ONGLET_INSCRIPTIONS);
  if (!f) {
    f = ss.insertSheet(ONGLET_INSCRIPTIONS, 0);
    f.getRange(1, 1, 1, ENTETES_INSCRIPTIONS.length).setValues([ENTETES_INSCRIPTIONS]).setFontWeight('bold');
    f.setFrozenRows(1);
    f.getRange('C:C').setNumberFormat('@');
    f.hideColumns(10);
    return;
  }
  if (f.getRange(1, 3).getDisplayValue() !== 'Date') {
    // Ancienne version sans date : ajoute la colonne « Date »
    f.showColumns(1, f.getMaxColumns());
    f.insertColumnBefore(3);
    f.getRange(1, 1, 1, ENTETES_INSCRIPTIONS.length).setValues([ENTETES_INSCRIPTIONS]).setFontWeight('bold');
    f.getRange('C:C').setNumberFormat('@');
    f.hideColumns(10);
  }
  if (f.getRange(1, 11).getDisplayValue() !== 'Rôle') {
    f.getRange(1, 1, 1, ENTETES_INSCRIPTIONS.length).setValues([ENTETES_INSCRIPTIONS]).setFontWeight('bold');
  }
}

function lireReglages_() {
  const valeurs = feuille_(ONGLET_REGLAGES).getDataRange().getDisplayValues();
  const brut = {};
  valeurs.slice(1).forEach(l => { brut[String(l[0]).trim()] = String(l[1]).trim(); });
  const liste = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
  const postes = String(brut['Postes'] || '').split(';').map(x => x.trim()).filter(Boolean).map(x => {
    const morceaux = x.split(':');
    return { nom: morceaux[0].trim(), places: Math.max(1, parseInt(morceaux[1], 10) || 1) };
  });
  const fermetures = String(brut['Fermetures'] || '').split(';').map(x => x.trim()).filter(Boolean).map(x => {
    const bornes = x.split('>').map(normDate_);
    return [bornes[0], bornes[1] || bornes[0]];
  }).filter(b => b[0]);
  return {
    titre: brut['Titre'] || 'Brigade cantine Giono',
    jours: liste(brut['Jours']),
    creneaux: liste(brut['Créneaux']),
    postes: postes,
    ouvert: !/^non$/i.test(brut['Inscriptions ouvertes'] || 'Oui'),
    debut: normDate_(brut['Début']),
    fin: normDate_(brut['Fin']),
    fermetures: fermetures,
    remplacants: Math.max(0, parseInt(brut['Remplaçants par poste'], 10) || 0),
  };
}

function lireInscriptions_() {
  const valeurs = feuille_(ONGLET_INSCRIPTIONS).getDataRange().getDisplayValues();
  return valeurs.slice(1).filter(l => l[0] !== '' && normDate_(l[2])).map(l => ({
    id: String(l[0]), date: normDate_(l[2]), creneau: String(l[4]), poste: String(l[5]),
    prenom: String(l[6]), initiale: String(l[7]), classe: String(l[8]), empreinte: String(l[9]),
    role: /rempla/i.test(l[10] || '') ? 'remplacant' : 'titulaire',
  }));
}

function verifierIdentite_(d) {
  const prenom = String(d.prenom || '').trim().replace(/\s+/g, ' ');
  const initiale = String(d.initiale || '').trim().charAt(0).toUpperCase();
  const classe = String(d.classe || '').trim().toUpperCase().replace(/\s+/g, '');
  const code = String(d.code || '').trim();
  if (prenom.length < 2 || prenom.length > 30) throw new Error('Indique ton prénom.');
  if (!/^[A-ZÀ-Ý]$/i.test(initiale)) throw new Error('Indique l\'initiale de ton nom.');
  if (classe.length < 2 || classe.length > 12) throw new Error('Indique ta classe (ex. 4E2).');
  if (!/^\d{4}$/.test(code)) throw new Error('Ton code doit faire 4 chiffres.');
  const prenomPropre = prenom.charAt(0).toUpperCase() + prenom.slice(1);
  const empreinte = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, code + '|' + SpreadsheetApp.getActiveSpreadsheet().getId())
  );
  const id = { prenom: prenomPropre, initiale: initiale, classe: classe, empreinte: empreinte };
  id.cle = cle_(id);
  return id;
}

function cle_(o) {
  const n = s => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
  return n(o.prenom) + '|' + n(o.initiale) + '|' + n(o.classe);
}

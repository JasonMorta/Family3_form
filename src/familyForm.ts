// @ts-nocheck
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const DRAFT_KEY = 'family3_form_draft_v5';
const PHOTO_STORE = new Map();
const repeatableGroups = ['parents', 'children', 'siblings', 'partners'];

const RELATIONSHIP_GROUPS = {
  parents: {
    singular: 'parent',
    singularLabelKey: 'entryLabels.parent',
    includeBirthDate: true,
    optionValues: ['Biological parent', 'Adoptive parent', 'Step-parent', 'Foster parent', 'Guardian', 'Other'],
    optionKeys: ['options.parent.biological', 'options.parent.adoptive', 'options.parent.step', 'options.parent.foster', 'options.parent.guardian', 'options.other'],
    labelKey: 'relationship.parentType',
    addButtonKey: 'buttons.addParent',
  },
  children: {
    singular: 'child',
    singularLabelKey: 'entryLabels.child',
    includeBirthDate: false,
    optionValues: ['Biological child', 'Adopted child', 'Stepchild', 'Foster child', 'Ward', 'Other'],
    optionKeys: ['options.child.biological', 'options.child.adopted', 'options.child.step', 'options.child.foster', 'options.child.ward', 'options.other'],
    labelKey: 'relationship.childType',
    addButtonKey: 'buttons.addChild',
  },
  siblings: {
    singular: 'sibling',
    singularLabelKey: 'entryLabels.sibling',
    includeBirthDate: false,
    optionValues: ['Full sibling', 'Half sibling', 'Step-sibling', 'Adoptive sibling', 'Foster sibling', 'Other'],
    optionKeys: ['options.sibling.full', 'options.sibling.half', 'options.sibling.step', 'options.sibling.adoptive', 'options.sibling.foster', 'options.other'],
    labelKey: 'relationship.siblingType',
    addButtonKey: 'buttons.addSibling',
  },
  partners: {
    singular: 'partner',
    singularLabelKey: 'entryLabels.partner',
    includeBirthDate: false,
    optionValues: ['Spouse', 'Partner', 'Fiancé / fiancée', 'Former spouse', 'Former partner', 'Other'],
    optionKeys: ['options.partner.spouse', 'options.partner.partner', 'options.partner.fiance', 'options.partner.formerSpouse', 'options.partner.formerPartner', 'options.other'],
    labelKey: 'relationship.partnerType',
    addButtonKey: 'buttons.addPartner',
  },
};

const translations = {
  en: {
    hero: {
      title: 'Add a family member',
      copy: 'Every family tree becomes more meaningful with fuller stories, stronger links, and clearer history. Only your full name and birth date are required, but taking a little extra time to complete the rest of this form can help preserve relationships, memories, and details that may matter deeply to your family in the future.',
      firebaseEnabled: 'Firebase submit mode enabled',
      saveTarget: 'New records will be stored in the Firestore collection <strong>Family3_Form_Submissions</strong>.',
      saveTargetLatest: 'Latest save target: <strong>Family3_Form_Submissions</strong> (new record created).',
      autoSave: 'Your progress saves automatically on this device while you type.',
      restored: 'Saved progress was restored on this device.',
      autoSavedAt: 'Saved automatically on this device. Last saved: {{stamp}}.',
    },
    common: {
      required: 'Required', optional: 'Optional', selectOne: 'Select one',
    },
    buttons: {
      back: 'Back', next: 'Next', submit: 'Submit form', submitting: 'Submitting...', cancel: 'Cancel', usePhoto: 'Use this photo',
      choosePhoto: 'Choose photo', replacePhoto: 'Replace photo', removePhoto: 'Remove photo',
      addParent: 'Add parent', addChild: 'Add child', addSibling: 'Add sibling', addPartner: 'Add partner', remove: 'Remove',
    },
    steps: {
      step1: { kicker: 'Step 1', title: 'Core identity', desc: 'Capture the essentials for the family member being added. Only full name and birth date are required.' },
      step2: { kicker: 'Step 2', title: 'Profile photo', desc: 'Add and crop the main photo that will represent this person on the tree.' },
      step3: { kicker: 'Step 3', title: 'Life details', desc: 'Add useful timeline and location details that help place this person in the family story.' },
      step4: { kicker: 'Step 4', title: 'Life story', desc: 'Add the personal details and memories that help this family member feel real on the tree.' },
      step5: { kicker: 'Step 5', title: 'Parents', desc: 'Add every parent or parent figure connected to this person. You can add biological parents, step-parents, adoptive parents, foster parents, guardians, or any other parent figure.' },
      step6: { kicker: 'Step 6', title: 'Children and siblings', desc: 'Add close family members linked to this person. Keep these entries simple so they are easy to fill in.' },
      step7: { kicker: 'Step 7', title: 'Partners and notes', desc: 'Add partners or spouses, plus any final notes that should travel with this person’s record.' },
      step8: { kicker: 'Step 8', title: 'Review and submit', desc: 'Review the information and submit the form to Firebase.' },
      progress: ['Identity', 'Photo', 'Life', 'Story', 'Parents', 'Children', 'Partners', 'Review'],
      counter: 'Step {{current}} of {{total}}',
    },
    fields: {
      fullName: 'Full name and surname', birthDate: 'Birth date', nickname: 'Nickname or preferred name', prefix: 'Title or prefix', maidenName: 'Birth surname',
      gender: 'Gender', birthPlace: 'Birth place', stillAlive: 'Still living?', deathDate: 'Death date', deathPlace: 'Death place', currentLocation: 'Current town or city',
      heritage: 'Nationality or heritage', occupation: 'Occupation', education: 'Education or training', maritalStatus: 'Marital status', languages: 'Languages spoken',
      biography: 'About this person', achievements: 'Important life moments', interests: 'Interests and hobbies', personality: 'Personality and how people remember them', familyNotes: 'Additional family notes',
      relationshipName: 'Full name', relationshipBirthDate: 'Birth date',
    },
    placeholders: {
      prefix: 'Mr, Mrs, Dr', place: 'Town, city, or country', currentLocation: 'Where they live or are based', heritage: 'South African, British, Xhosa, etc.',
      education: 'School, degree, trade, or training', languages: 'Separate with commas',
      biography: 'A short summary of who this person is and why they matter in the family.', achievements: 'Important moments, achievements, work, or milestones.',
      interests: 'Things they enjoy, collect, create, or care about.', personality: 'Describe their character, habits, sayings, or memorable traits.',
      familyNotes: 'Anything else that would help the family understand this person’s place in the tree.',
    },
    help: {
      biography: 'Write a short summary about who they are, what kind of person they are, or what matters most about them.',
      achievements: 'Examples: military service, awards, work they were proud of, moving country, raising a family, or special milestones.',
      interests: 'Things they enjoy doing, collecting, making, watching, or talking about.',
      personality: 'Examples: funny, strict, kind, quiet, loved singing, always told jokes, had a favourite saying.',
      familyNotes: 'Add anything else that helps the family understand this person’s place in the tree.',
      relationshipName: 'Enter the full name that should appear on the family tree.',
      relationshipBirthDate: 'Add a date if it is known.',
      relationshipType: 'Choose the relationship that best fits.',
      photoWidget: 'Upload, crop, and preview the photo before it is saved.',
      noPhoto: 'No photo selected yet.',
      photoReady: 'Photo ready.',
      photoReadyPending: 'Photo ready and waiting to be uploaded.',
    },
    groups: { parents: 'Parents', children: 'Children', siblings: 'Siblings', partners: 'Partners' },
    relationship: { parentType: 'What kind of parent is this?', childType: 'What kind of child is this?', siblingType: 'What kind of sibling is this?', partnerType: 'What kind of partner is this?' },
    options: {
      yes: 'Yes', no: 'No', notSure: 'Not sure', other: 'Other',
      gender: { female: 'Female', male: 'Male', other: 'Other', preferNotToSay: 'Prefer not to say' },
      marital: { single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed', separated: 'Separated', partnered: 'Partnered' },
      parent: { biological: 'Biological parent', adoptive: 'Adoptive parent', step: 'Step-parent', foster: 'Foster parent', guardian: 'Guardian' },
      child: { biological: 'Biological child', adopted: 'Adopted child', step: 'Stepchild', foster: 'Foster child', ward: 'Ward' },
      sibling: { full: 'Full sibling', half: 'Half sibling', step: 'Step-sibling', adoptive: 'Adoptive sibling', foster: 'Foster sibling' },
      partner: { spouse: 'Spouse', partner: 'Partner', fiance: 'Fiancé / fiancée', formerSpouse: 'Former spouse', formerPartner: 'Former partner' },
    },
    review: { name: 'Name:', birthDate: 'Birth date:', birthPlace: 'Birth place:', currentLocation: 'Current location:', occupation: 'Occupation:' },
    entryLabels: { parent: 'Parent', child: 'Child', sibling: 'Sibling', partner: 'Partner' },
    crop: { title: 'Adjust photo', desc: 'Move the image so the face sits nicely in the preview.', zoom: 'Zoom', horizontal: 'Move left and right', vertical: 'Move up and down', preview: 'Preview' },
    status: {
      invalidImage: 'Please choose a valid image file.', photoFail: 'That photo could not be prepared.',
      requiredBeforeSubmit: 'Please complete the required fields before submitting.', fixHighlighted: 'Please fix the highlighted fields before submitting.',
      duplicateTitle: 'This person already exists.', duplicateStopped: 'A person with this full name already exists.',
      duplicateName: 'Name',
      firebaseInitFailed: 'Firebase could not be initialised. Check your config values.',
      submittedSuccess: 'Form submitted successfully to Firebase.',
      restored: 'Saved progress was restored on this device.',
    },
    validation: { required: 'Please fill in this field.' },
    entry: { itemNumber: '{{name}} {{number}}' },
  },
  af: {
    hero: {
      title: 'Voeg ’n familielid by',
      copy: 'Elke stamboom word meer betekenisvol met voller stories, sterker skakels en duideliker geskiedenis. Net jou volle naam en geboortedatum is verpligtend, maar as jy ’n bietjie ekstra tyd neem om die res van hierdie vorm in te vul, kan dit help om verhoudings, herinneringe en besonderhede te bewaar wat later baie vir jou familie kan beteken.',
      firebaseEnabled: 'Firebase indienmodus is geaktiveer',
      saveTarget: 'Nuwe rekords sal in die Firestore-versameling <strong>Family3_Form_Submissions</strong> gestoor word.',
      saveTargetLatest: 'Nuutste stoorplek: <strong>Family3_Form_Submissions</strong> (nuwe rekord geskep).',
      autoSave: 'Jou vordering word outomaties op hierdie toestel gestoor terwyl jy tik.',
      restored: 'Gestoorde vordering is op hierdie toestel herstel.',
      autoSavedAt: 'Outomaties op hierdie toestel gestoor. Laas gestoor: {{stamp}}.',
    },
    common: { required: 'Verpligtend', optional: 'Opsioneel', selectOne: 'Kies een' },
    buttons: {
      back: 'Terug', next: 'Volgende', submit: 'Dien vorm in', submitting: 'Besig om in te dien...', cancel: 'Kanselleer', usePhoto: 'Gebruik hierdie foto',
      choosePhoto: 'Kies foto', replacePhoto: 'Vervang foto', removePhoto: 'Verwyder foto',
      addParent: 'Voeg ouer by', addChild: 'Voeg kind by', addSibling: 'Voeg broer of suster by', addPartner: 'Voeg maat by', remove: 'Verwyder',
    },
    steps: {
      step1: { kicker: 'Stap 1', title: 'Basiese besonderhede', desc: 'Vul die belangrikste besonderhede in vir die familielid wat bygevoeg word. Net volle naam en geboortedatum is verpligtend.' },
      step2: { kicker: 'Stap 2', title: 'Profielfoto', desc: 'Voeg die hoof foto by en sny dit sodat dit hierdie persoon op die boom verteenwoordig.' },
      step3: { kicker: 'Stap 3', title: 'Lewensbesonderhede', desc: 'Voeg tydlyn- en plekbesonderhede by wat help om hierdie persoon in die familieverhaal te plaas.' },
      step4: { kicker: 'Stap 4', title: 'Lewensverhaal', desc: 'Voeg persoonlike besonderhede en herinneringe by wat help om hierdie familielid eg op die boom te laat voel.' },
      step5: { kicker: 'Stap 5', title: 'Ouers', desc: 'Voeg elke ouer of ouerfiguur by wat met hierdie persoon verbind is. Jy kan biologiese ouers, stiefouers, aangenome ouers, pleegouers, voogde of enige ander ouerfiguur byvoeg.' },
      step6: { kicker: 'Stap 6', title: 'Kinders en broers of susters', desc: 'Voeg naby familielede by wat aan hierdie persoon gekoppel is. Hou hierdie inskrywings eenvoudig sodat dit maklik is om in te vul.' },
      step7: { kicker: 'Stap 7', title: 'Maats en notas', desc: 'Voeg maats of eggenote by, plus enige laaste notas wat saam met hierdie persoon se rekord moet gaan.' },
      step8: { kicker: 'Stap 8', title: 'Gaan na en dien in', desc: 'Gaan die inligting na en dien die vorm na Firebase in.' },
      progress: ['Identiteit', 'Foto', 'Lewe', 'Verhaal', 'Ouers', 'Kinders', 'Maats', 'Oorsig'],
      counter: 'Stap {{current}} van {{total}}',
    },
    fields: {
      fullName: 'Volle naam en van', birthDate: 'Geboortedatum', nickname: 'Bynaam of verkose naam', prefix: 'Titel of voorvoegsel', maidenName: 'Nooiensvan of geboortenaam',
      gender: 'Geslag', birthPlace: 'Geboorteplek', stillAlive: 'Leef die persoon nog?', deathDate: 'Sterfdatum', deathPlace: 'Plek van afsterwe', currentLocation: 'Huidige dorp of stad',
      heritage: 'Nasionaliteit of herkoms', occupation: 'Beroep', education: 'Opleiding of skool', maritalStatus: 'Huwelikstatus', languages: 'Tale wat gepraat word',
      biography: 'Meer oor hierdie persoon', achievements: 'Belangrike lewensoomblikke', interests: 'Belangstellings en stokperdjies', personality: 'Persoonlikheid en hoe mense hulle onthou', familyNotes: 'Bykomende familienotas',
      relationshipName: 'Volle naam', relationshipBirthDate: 'Geboortedatum',
    },
    placeholders: {
      prefix: 'Mnr, Mev, Dr', place: 'Dorp, stad of land', currentLocation: 'Waar hulle woon of bly', heritage: 'Suid-Afrikaans, Brits, Xhosa, ens.',
      education: 'Skool, graad, ambag of opleiding', languages: 'Skei met kommas',
      biography: '’n Kort beskrywing van wie hierdie persoon is en waarom hulle in die familie belangrik is.', achievements: 'Belangrike oomblikke, prestasies, werk of mylpale.',
      interests: 'Dinge waarvan hulle hou, versamel, maak of waaroor hulle omgee.', personality: 'Beskryf hul karakter, gewoontes, sêgoed of onthoubare eienskappe.',
      familyNotes: 'Enigiets anders wat die familie help om hierdie persoon se plek in die boom te verstaan.',
    },
    help: {
      biography: 'Skryf kortliks wie hulle is, watter soort mens hulle is, of wat die belangrikste van hulle is.',
      achievements: 'Voorbeelde: militêre diens, toekennings, werk waarop hulle trots was, verhuising, ’n gesin grootmaak, of spesiale mylpale.',
      interests: 'Dinge wat hulle geniet om te doen, te versamel, te maak, te kyk of oor te praat.',
      personality: 'Voorbeelde: snaaks, streng, vriendelik, stil, lief vir sing, het altyd grappies vertel, of ’n gunsteling sêding gehad.',
      familyNotes: 'Voeg enigiets anders by wat die familie help om hierdie persoon se plek in die boom te verstaan.',
      relationshipName: 'Tik die volle naam wat op die stamboom moet verskyn.',
      relationshipBirthDate: 'Voeg ’n datum by as dit bekend is.',
      relationshipType: 'Kies die verhouding wat die beste pas.',
      photoWidget: 'Laai die foto op, sny dit en kyk dit na voordat dit gestoor word.',
      noPhoto: 'Nog geen foto gekies nie.',
      photoReady: 'Foto is gereed.',
      photoReadyPending: 'Foto is gereed en wag om opgelaai te word.',
    },
    groups: { parents: 'Ouers', children: 'Kinders', siblings: 'Broers en susters', partners: 'Maats' },
    relationship: { parentType: 'Watter soort ouer is dit?', childType: 'Watter soort kind is dit?', siblingType: 'Watter soort broer of suster is dit?', partnerType: 'Watter soort maat is dit?' },
    options: {
      yes: 'Ja', no: 'Nee', notSure: 'Nie seker nie', other: 'Ander',
      gender: { female: 'Vroulik', male: 'Manlik', other: 'Ander', preferNotToSay: 'Verkies om nie te sê nie' },
      marital: { single: 'Ongetroud', married: 'Getroud', divorced: 'Geskei', widowed: 'Weduwee of wewenaar', separated: 'Apart', partnered: 'In ’n verhouding' },
      parent: { biological: 'Biologiese ouer', adoptive: 'Aangenome ouer', step: 'Stiefouer', foster: 'Pleegouer', guardian: 'Voog' },
      child: { biological: 'Biologiese kind', adopted: 'Aangenome kind', step: 'Stiefkind', foster: 'Pleegkind', ward: 'Wykind' },
      sibling: { full: 'Vol broer of suster', half: 'Halfbroer of -suster', step: 'Stiefbroer of -suster', adoptive: 'Aangenome broer of suster', foster: 'Pleegbroer of -suster' },
      partner: { spouse: 'Eggenoot of eggenote', partner: 'Maat', fiance: 'Verloofde', formerSpouse: 'Vorige eggenoot of eggenote', formerPartner: 'Vorige maat' },
    },
    review: { name: 'Naam:', birthDate: 'Geboortedatum:', birthPlace: 'Geboorteplek:', currentLocation: 'Huidige plek:', occupation: 'Beroep:' },
    entryLabels: { parent: 'Ouer', child: 'Kind', sibling: 'Broer of suster', partner: 'Maat' },
    crop: { title: 'Pas foto aan', desc: 'Skuif die beeld sodat die gesig mooi in die voorskou sit.', zoom: 'Zoem', horizontal: 'Skuif links en regs', vertical: 'Skuif op en af', preview: 'Voorskou' },
    status: {
      invalidImage: 'Kies asseblief ’n geldige beeldlêer.', photoFail: 'Daardie foto kon nie voorberei word nie.',
      requiredBeforeSubmit: 'Voltooi asseblief die verpligte velde voordat jy indien.', fixHighlighted: 'Maak asseblief die uitgeligde velde reg voordat jy indien.',
      duplicateTitle: 'Hierdie persoon bestaan reeds.', duplicateStopped: '’n Persoon met hierdie volle naam bestaan reeds in Firebase. Indiening is gestop.',
      duplicateName: 'Naam',
      firebaseInitFailed: 'Firebase kon nie begin word nie. Gaan jou konfigurasiewaardes na.',
      submittedSuccess: 'Vorm is suksesvol na Firebase gestuur.',
      restored: 'Gestoorde vordering is op hierdie toestel herstel.',
    },
    validation: { required: 'Vul asseblief hierdie veld in.' },
    entry: { itemNumber: '{{name}} {{number}}' },
  },
};

let form = null;
let stillAliveSelect = null;
let statusMessage = null;
let submitBtn = null;
let duplicatePreview = null;
let saveTargetText = null;
let draftHintText = null;
let cropDialog = null;
let cropCanvas = null;
let cropPreview = null;
let cropZoom = null;
let cropX = null;
let cropY = null;
let saveCropBtn = null;
let cancelCropBtn = null;
let closeCropperBtn = null;
let wizardProgress = null;
let prevStepBtn = null;
let nextStepBtn = null;
let wizardStepCount = null;
let reviewName = null;
let reviewBirthDate = null;
let reviewBirthPlace = null;
let reviewCurrentLocation = null;
let reviewOccupation = null;
let stepPanels = [];

function cacheDomRefs() {
  form = document.getElementById('familyIntakeForm');
  stillAliveSelect = document.getElementById('stillAlive');
  statusMessage = document.getElementById('statusMessage');
  submitBtn = document.getElementById('submitBtn');
  duplicatePreview = document.getElementById('duplicatePreview');
  saveTargetText = document.getElementById('saveTargetText');
  draftHintText = document.getElementById('draftHintText');
  cropDialog = document.getElementById('cropDialog');
  cropCanvas = document.getElementById('cropCanvas');
  cropPreview = document.getElementById('cropPreview');
  cropZoom = document.getElementById('cropZoom');
  cropX = document.getElementById('cropX');
  cropY = document.getElementById('cropY');
  saveCropBtn = document.getElementById('saveCropBtn');
  cancelCropBtn = document.getElementById('cancelCropBtn');
  closeCropperBtn = document.getElementById('closeCropperBtn');
  wizardProgress = document.getElementById('wizardProgress');
  prevStepBtn = document.getElementById('prevStepBtn');
  nextStepBtn = document.getElementById('nextStepBtn');
  wizardStepCount = document.getElementById('wizardStepCount');
  reviewName = document.getElementById('reviewName');
  reviewBirthDate = document.getElementById('reviewBirthDate');
  reviewBirthPlace = document.getElementById('reviewBirthPlace');
  reviewCurrentLocation = document.getElementById('reviewCurrentLocation');
  reviewOccupation = document.getElementById('reviewOccupation');
  stepPanels = [...document.querySelectorAll('.step-panel')];
}

let currentStep = 0;
let activeCropSession = null;
let currentLanguage = 'en';
let lastAutoSaveStamp = '';

const FRONTEND_CONFIG = {
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  },
  imgbbApiKey: import.meta.env.VITE_IMGBB_API_KEY || '',
};

let firestoreDb = null;

export function initFamilyForm() {
  cacheDomRefs();
  if (!form || !wizardProgress) {
    console.warn('Family form root nodes were not found during init.');
    return;
  }
  restoreDraft();
  buildWizardProgress();
  buildAllPhotoWidgets();
  initRepeatableGroups();
  wireCropperEvents();
  wireFormEvents();
  initLanguageSwitcher();
  buildCustomSelects();
  updateDeathFields();
  applyTranslations();
  updateWizardUI();

  try {
    firestoreDb = initializeFirebase(FRONTEND_CONFIG.firebase);
  } catch (error) {
    console.warn('Firebase was not initialised on page load.', error);
    setStatus(t('status.firebaseInitFailed'), true);
  }
}

function t(path, vars = {}) {
  const value = path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), translations[currentLanguage]);
  if (value == null) return path;
  if (typeof value !== 'string') return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

function applyTranslations() {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll('[data-lang-choice]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.langChoice === currentLanguage);
  });

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  document.querySelectorAll('[data-i18n-option]').forEach((option) => {
    option.textContent = t(option.dataset.i18nOption);
  });

  buildWizardProgress();
  updateWizardUI();
  updateDraftHintText();
  document.querySelectorAll('.photo-widget').forEach(buildPhotoWidget);
  document.querySelectorAll('.repeatable-list').forEach((list) => {
    list.querySelectorAll('.entry-card').forEach(refreshEntryCardText);
  });
  buildCustomSelects();
  refreshReviewLabels();
  if (duplicatePreview && !duplicatePreview.classList.contains('hidden') && duplicatePreview.dataset.name && duplicatePreview.dataset.birthDate) {
    renderDuplicatePreview({ fullName: duplicatePreview.dataset.name, birthDate: duplicatePreview.dataset.birthDate });
  }
}

function initLanguageSwitcher() {
  document.querySelectorAll('[data-lang-choice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentLanguage = btn.dataset.langChoice;
      applyTranslations();
      persistDraft();
    });
  });
}

function buildWizardProgress() {
  if (!wizardProgress) return;
  const labels = t('steps.progress');
  wizardProgress.innerHTML = '';
  labels.forEach((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'wizard-progress-btn';
    button.textContent = `${index + 1}. ${label}`;
    button.addEventListener('click', () => goToStep(index, true));
    wizardProgress.appendChild(button);
  });
}

function updateWizardUI() {
  if (!wizardStepCount || !prevStepBtn || !nextStepBtn || !submitBtn) return;
  stepPanels.forEach((panel, index) => panel.classList.toggle('is-active', index === currentStep));
  [...wizardProgress.children].forEach((button, index) => {
    button.classList.toggle('is-active', index === currentStep);
    button.classList.toggle('is-complete', index < currentStep);
  });
  wizardStepCount.textContent = t('steps.counter', { current: currentStep + 1, total: stepPanels.length });
  prevStepBtn.disabled = currentStep === 0;
  const isLast = currentStep === stepPanels.length - 1;
  nextStepBtn.classList.toggle('hidden', isLast);
  submitBtn.classList.toggle('hidden', !isLast);
  if (isLast) renderReviewSummary();
}

function goToStep(targetStep, allowJump = false) {
  if (targetStep < 0 || targetStep >= stepPanels.length) return;
  if (targetStep > currentStep && !validateCurrentStep()) return;
  if (!allowJump && Math.abs(targetStep - currentStep) > 1) return;
  currentStep = targetStep;
  persistDraft();
  updateWizardUI();
  document.getElementById('wizardProgress')?.scrollIntoView({
  behavior: 'smooth',
  block: 'start',
});
}

function validateCurrentStep() {
  const panel = stepPanels[currentStep];
  if (!panel) return true;
  const requiredFields = [...panel.querySelectorAll('[data-step-required="true"]')];
  for (const field of requiredFields) {
    if (!String(field.value || '').trim()) {
      field.setCustomValidity(t('validation.required'));
      field.reportValidity();
      return false;
    }
    field.setCustomValidity('');
  }
  return true;
}

function renderReviewSummary() {
  if (!reviewName || !reviewBirthDate || !reviewBirthPlace || !reviewCurrentLocation || !reviewOccupation) return;
  reviewName.textContent = document.getElementById('fullName')?.value?.trim() || '—';
  reviewBirthDate.textContent = document.getElementById('birthDate')?.value?.trim() || '—';
  reviewBirthPlace.textContent = form.elements.namedItem('birthPlace')?.value?.trim() || '—';
  reviewCurrentLocation.textContent = form.elements.namedItem('currentLocation')?.value?.trim() || '—';
  reviewOccupation.textContent = form.elements.namedItem('occupation')?.value?.trim() || '—';
}

function refreshReviewLabels() {
  document.querySelector('[data-i18n="review.name"]').textContent = t('review.name');
  document.querySelector('[data-i18n="review.birthDate"]').textContent = t('review.birthDate');
  document.querySelector('[data-i18n="review.birthPlace"]').textContent = t('review.birthPlace');
  document.querySelector('[data-i18n="review.currentLocation"]').textContent = t('review.currentLocation');
  document.querySelector('[data-i18n="review.occupation"]').textContent = t('review.occupation');
}

function buildAllPhotoWidgets() {
  document.querySelectorAll('.photo-widget').forEach(buildPhotoWidget);
}

function buildPhotoWidget(widget) {
  const photoKey = widget.dataset.photoField;
  if (!photoKey) return;
  widget.innerHTML = '';

  const note = document.createElement('p');
  note.textContent = t('help.photoWidget');

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.hidden = true;

  const previewShell = document.createElement('div');
  previewShell.className = 'photo-preview-shell';

  const preview = document.createElement('img');
  preview.className = 'photo-preview';
  preview.alt = 'Selected photo preview';
  preview.hidden = true;

  const meta = document.createElement('div');
  meta.className = 'photo-meta';
  meta.textContent = t('help.noPhoto');

  const actions = document.createElement('div');
  actions.className = 'photo-actions';

  const uploadButton = document.createElement('button');
  uploadButton.type = 'button';
  uploadButton.className = 'primary-btn btn';
  uploadButton.textContent = t('buttons.choosePhoto');
  uploadButton.addEventListener('click', () => fileInput.click());

  const replaceButton = document.createElement('button');
  replaceButton.type = 'button';
  replaceButton.className = 'secondary-btn btn';
  replaceButton.textContent = t('buttons.replacePhoto');
  replaceButton.addEventListener('click', () => fileInput.click());

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'danger-btn btn';
  removeButton.textContent = t('buttons.removePhoto');
  removeButton.addEventListener('click', () => {
    PHOTO_STORE.delete(photoKey);
    preview.hidden = true;
    preview.removeAttribute('src');
    meta.textContent = t('help.noPhoto');
    fileInput.value = '';
    persistDraft();
  });

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus(t('status.invalidImage'), true);
      return;
    }
    try {
      await openCropper(file, photoKey, preview, meta);
    } catch (error) {
      console.error(error);
      setStatus(t('status.photoFail'), true);
    }
  });

  actions.append(uploadButton, replaceButton, removeButton);
  previewShell.append(preview, meta);
  widget.append(note, fileInput, previewShell, actions);

  const existing = PHOTO_STORE.get(photoKey);
  if (existing) {
    preview.src = existing.dataUrl;
    preview.hidden = false;
    meta.textContent = existing.url ? t('help.photoReady') : t('help.photoReadyPending');
  }
}

async function openCropper(file, photoKey, previewEl, metaEl) {
  const img = await loadImageFromFile(file);
  activeCropSession = { img, photoKey, previewEl, metaEl, originalName: file.name };
  cropZoom.value = '1';
  cropX.value = '0';
  cropY.value = '0';
  renderCropper();
  cropDialog.showModal();
}

function wireCropperEvents() {
  [cropZoom, cropX, cropY].forEach((input) => input.addEventListener('input', renderCropper));
  saveCropBtn.addEventListener('click', commitCrop);
  cancelCropBtn.addEventListener('click', closeCropper);
  closeCropperBtn.addEventListener('click', closeCropper);
}

function closeCropper() {
  activeCropSession = null;
  cropDialog.close();
}

function renderCropper() {
  if (!activeCropSession) return;
  const zoom = Number(cropZoom.value);
  const offsetX = Number(cropX.value);
  const offsetY = Number(cropY.value);
  const ctx = cropCanvas.getContext('2d');
  const previewCtx = cropPreview.getContext('2d');
  ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
  previewCtx.clearRect(0, 0, cropPreview.width, cropPreview.height);
  drawImageCover(ctx, cropCanvas, activeCropSession.img, zoom, offsetX, offsetY);
  ctx.strokeStyle = 'rgba(255,255,255,.95)';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, cropCanvas.width - 3, cropCanvas.height - 3);
  drawImageCover(previewCtx, cropPreview, activeCropSession.img, zoom, offsetX * (200 / 320), offsetY * (200 / 320));
}

function drawImageCover(ctx, canvas, img, zoom, offsetX, offsetY) {
  const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * zoom;
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const x = (canvas.width - drawWidth) / 2 + offsetX;
  const y = (canvas.height - drawHeight) / 2 + offsetY;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, x, y, drawWidth, drawHeight);
}

function commitCrop() {
  if (!activeCropSession) return;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 200;
  exportCanvas.height = 200;
  const ctx = exportCanvas.getContext('2d');
  drawImageCover(ctx, exportCanvas, activeCropSession.img, Number(cropZoom.value), Number(cropX.value) * (200 / 320), Number(cropY.value) * (200 / 320));
  const dataUrl = exportCanvas.toDataURL('image/webp', 0.88);
  const fullNameValue = document.getElementById('fullName')?.value || '';
  PHOTO_STORE.set(activeCropSession.photoKey, { dataUrl, filename: buildPhotoFilenameFromFullName(fullNameValue), url: '', deleteUrl: '' });
  activeCropSession.previewEl.src = dataUrl;
  activeCropSession.previewEl.hidden = false;
  activeCropSession.metaEl.textContent = t('help.photoReady');
  persistDraft();
  closeCropper();
}

function buildPhotoFilenameFromFullName(fullName) {
  const safeBase = String(fullName || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${safeBase || 'person-photo'}-${Date.now()}.webp`;
}

function initRepeatableGroups() {
  document.querySelectorAll('[data-add-list]').forEach((button) => {
    button.addEventListener('click', () => {
      addEntry(button.dataset.addList);
      persistDraft();
    });
  });

  const draft = getDraft();
  repeatableGroups.forEach((group) => {
    const count = Number(draft?.repeatCounts?.[group] || 0);
    const values = collectDraftGroupValues(group, draft?.formValues || {}, count);
    values.forEach((entry) => addEntry(group, entry));
  });
}

function addEntry(groupName, values = {}) {
  const list = document.querySelector(`.repeatable-list[data-list="${groupName}"]`);
  const config = RELATIONSHIP_GROUPS[groupName];
  if (!list || !config) return;

  const index = list.children.length;
  const card = document.createElement('section');
  card.className = 'entry-card';
  card.dataset.group = groupName;
  card.dataset.index = String(index);

  card.innerHTML = `
    <div class="entry-card-header">
      <h4 class="entry-title"></h4>
      <button type="button" class="danger-btn btn entry-remove-btn"></button>
    </div>
    <div class="grid two-col compact-grid entry-grid">
      <label class="field relationship-name-field">
        <span><span class="entry-name-label"></span> <em class="entry-optional"></em></span>
        <small class="field-help entry-name-help"></small>
        <input type="text" name="${groupName}_${index}_name" value="${escapeHtml(values.name || '')}" />
      </label>
      <label class="field relationship-type-field">
        <span><span class="entry-type-label"></span> <em class="entry-optional"></em></span>
        <small class="field-help entry-type-help"></small>
        <select name="${groupName}_${index}_type" data-custom-select="true">
          <option value="" data-i18n-option="common.selectOne">${escapeHtml(t('common.selectOne'))}</option>
          ${config.optionValues.map((value, idx) => `<option value="${escapeHtml(value)}" data-i18n-key="${config.optionKeys[idx]}" ${values.type === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}
        </select>
      </label>
      ${config.includeBirthDate ? `
      <label class="field relationship-birth-field">
        <span><span class="entry-birth-label"></span> <em class="entry-optional"></em></span>
        <small class="field-help entry-birth-help"></small>
        <input type="date" name="${groupName}_${index}_birthDate" value="${escapeHtml(values.birthDate || '')}" />
      </label>
      ` : ''}
    </div>
    <div class="photo-widget" data-photo-field="relationships.${groupName}.${index}.photo"></div>
  `;

  card.querySelector('.entry-remove-btn').addEventListener('click', () => {
    removeEntry(card);
    persistDraft();
  });

  list.appendChild(card);
  refreshEntryCardText(card);
  buildPhotoWidget(card.querySelector('.photo-widget'));
  buildCustomSelects(card);
}

function refreshEntryCardText(card) {
  const groupName = card.dataset.group;
  const config = RELATIONSHIP_GROUPS[groupName];
  const number = Number(card.dataset.index) + 1;
  card.querySelector('.entry-title').textContent = t('entry.itemNumber', { name: t(config.singularLabelKey), number });
  card.querySelector('.entry-remove-btn').textContent = t('buttons.remove');
  const optionalNodes = card.querySelectorAll('.entry-optional');
  optionalNodes.forEach((el) => { el.textContent = t('common.optional'); });
  card.querySelector('.entry-name-label').textContent = t('fields.relationshipName');
  card.querySelector('.entry-name-help').textContent = t('help.relationshipName');
  card.querySelector('.entry-type-label').textContent = t(config.labelKey);
  card.querySelector('.entry-type-help').textContent = t('help.relationshipType');
  const birthLabel = card.querySelector('.entry-birth-label');
  if (birthLabel) birthLabel.textContent = t('fields.relationshipBirthDate');
  const birthHelp = card.querySelector('.entry-birth-help');
  if (birthHelp) birthHelp.textContent = t('help.relationshipBirthDate');
  card.querySelectorAll('[data-i18n-key]').forEach((option) => { option.textContent = t(option.dataset.i18nKey); });
}

function removeEntry(card) {
  const groupName = card.dataset.group;
  const index = card.dataset.index;
  PHOTO_STORE.delete(`relationships.${groupName}.${index}.photo`);
  card.remove();
  normalizeEntryIndices(groupName);
}

function normalizeEntryIndices(groupName) {
  const cards = [...document.querySelectorAll(`.entry-card[data-group="${groupName}"]`)];
  cards.forEach((card, newIndex) => {
    const oldIndex = card.dataset.index;
    if (oldIndex !== String(newIndex)) {
      remapPhotoKey(`relationships.${groupName}.${oldIndex}.photo`, `relationships.${groupName}.${newIndex}.photo`);
      card.dataset.index = String(newIndex);
      card.querySelectorAll('[name]').forEach((field) => { field.name = field.name.replace(`${groupName}_${oldIndex}_`, `${groupName}_${newIndex}_`); });
      const photoWidget = card.querySelector('.photo-widget');
      if (photoWidget) {
        photoWidget.dataset.photoField = `relationships.${groupName}.${newIndex}.photo`;
        buildPhotoWidget(photoWidget);
      }
    }
    refreshEntryCardText(card);
    buildCustomSelects(card);
  });
}

function remapPhotoKey(oldKey, newKey) {
  if (!PHOTO_STORE.has(oldKey)) return;
  PHOTO_STORE.set(newKey, PHOTO_STORE.get(oldKey));
  PHOTO_STORE.delete(oldKey);
}

function wireFormEvents() {
  stillAliveSelect?.addEventListener('change', updateDeathFields);
  form.addEventListener('input', handleFormInteraction);
  form.addEventListener('change', handleFormInteraction);
  form.addEventListener('submit', handleSubmit);
  prevStepBtn.addEventListener('click', () => goToStep(currentStep - 1));
  nextStepBtn.addEventListener('click', () => goToStep(currentStep + 1));
}

function handleFormInteraction(event) {
  const target = event?.target;
  if (target?.name === 'fullName' || target?.name === 'birthDate') clearDuplicatePreview();
  if (currentStep === stepPanels.length - 1) renderReviewSummary();
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    target.setCustomValidity('');
  }
  persistDraft();
}

function updateDeathFields() {
  if (!stillAliveSelect) return;
  const hideDeath = stillAliveSelect.value === 'true';
  document.querySelectorAll('.death-field').forEach((field) => field.classList.toggle('hidden', hideDeath));
}

async function handleSubmit(event) {
  event.preventDefault();
  clearDuplicatePreview();
  setStatus('');

  if (!validateCurrentStep()) {
    setStatus(t('status.requiredBeforeSubmit'), true);
    return;
  }
  if (!form.reportValidity()) {
    setStatus(t('status.fixHighlighted'), true);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = t('buttons.submitting');

  try {
    if (!firestoreDb) firestoreDb = initializeFirebase(FRONTEND_CONFIG.firebase);
    const submission = buildSubmissionObject();
    const duplicateMatch = await findExistingPersonByFullName(firestoreDb, submission.person.name);
    if (duplicateMatch) {
      renderDuplicatePreview(duplicateMatch);
      setStatus(t('status.duplicateStopped'), true);
      return;
    }
    await uploadPendingPhotos(submission, FRONTEND_CONFIG.imgbbApiKey || '');
    const savedDocumentId = await saveSubmissionToFirebase(firestoreDb, submission);
    await logSavedSubmissionFromFirebase(firestoreDb, savedDocumentId);

    localStorage.removeItem(DRAFT_KEY);
    lastAutoSaveStamp = '';
    setStatus(t('status.submittedSuccess'), false, true);
    saveTargetText.innerHTML = t('hero.saveTargetLatest');
    draftHintText.textContent = t('hero.autoSave');

    form.reset();
    PHOTO_STORE.clear();
    document.querySelectorAll('.repeatable-list').forEach((list) => { list.innerHTML = ''; });
    buildAllPhotoWidgets();
    buildCustomSelects();
    currentStep = 0;
    updateDeathFields();
    updateWizardUI();
  } catch (error) {
    console.error(error);
    setStatus(error.message || t('status.fixHighlighted'), true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = t('buttons.submit');
  }
}

function buildSubmissionObject() {
  const data = new FormData(form);
  const now = new Date().toISOString();
  return {
    id: `sub_${Date.now()}`,
    person: {
      name: getValue(data, 'fullName'),
      birthDate: getValue(data, 'birthDate'),
      photo: getPhotoValue('person.photo'),
      nickname: getValue(data, 'nickname'),
      prefix: getValue(data, 'prefix'),
      maidenName: getValue(data, 'maidenName'),
      gender: getValue(data, 'gender'),
      birthPlace: getValue(data, 'birthPlace'),
      currentLocation: getValue(data, 'currentLocation'),
      heritage: getValue(data, 'heritage'),
      isAlive: getValue(data, 'stillAlive'),
      deathDate: getValue(data, 'deathDate'),
      deathPlace: getValue(data, 'deathPlace'),
      occupation: getValue(data, 'occupation'),
      education: getValue(data, 'education'),
      maritalStatus: getValue(data, 'maritalStatus'),
      languages: getValue(data, 'languages'),
      biography: getValue(data, 'biography'),
      achievements: getValue(data, 'achievements'),
      interests: getValue(data, 'interests'),
      personality: getValue(data, 'personality'),
      familyNotes: getValue(data, 'familyNotes'),
      submissionMeta: { submittedAt: now, status: 'pending' },
      relationships: Object.fromEntries(repeatableGroups.map((groupName) => [groupName, collectRelationshipEntries(data, groupName)])),
      node: {
        title: '',
        coverImage: '',
        imageCaption: '',
        eventDate: '',
        location: '',
        notes: '',
      },
    },
  };
}

function getValue(data, key) { return String(data.get(key) || '').trim(); }

function collectRelationshipEntries(data, groupName) {
  const cards = [...document.querySelectorAll(`.entry-card[data-group="${groupName}"]`)];
  return cards.map((card, index) => ({
    type: getValue(data, `${groupName}_${index}_type`),
    name: getValue(data, `${groupName}_${index}_name`),
    birthDate: getValue(data, `${groupName}_${index}_birthDate`),
    photo: getPhotoValue(`relationships.${groupName}.${index}.photo`),
  })).filter((entry) => entry.type || entry.name || entry.birthDate || entry.photo);
}

function getPhotoValue(photoKey) {
  const photo = PHOTO_STORE.get(photoKey);
  return photo ? (photo.url || photo.dataUrl || '') : '';
}

async function uploadPendingPhotos(submission, apiKey) {
  const entries = [...PHOTO_STORE.entries()];
  if (!entries.length) return;
  if (!apiKey) throw new Error('No ImgBB API key was found in FRONTEND_CONFIG.imgbbApiKey.');
  for (const [key, photo] of entries) {
    const submissionPath = getSubmissionPhotoPath(key);
    if (photo.url) {
      setDeepValue(submission, submissionPath, photo.url);
      continue;
    }
    const uploaded = await uploadImageToImgbb(photo.dataUrl, apiKey, photo.filename);
    PHOTO_STORE.set(key, { ...photo, url: uploaded.url, deleteUrl: uploaded.deleteUrl || '' });
    setDeepValue(submission, submissionPath, uploaded.url);
  }
}

async function uploadImageToImgbb(dataUrl, apiKey, filename) {
  const base64 = dataUrl.split(',')[1];
  const body = new URLSearchParams();
  body.set('key', apiKey); body.set('image', base64); body.set('name', filename);
  const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body });
  const result = await response.json();
  if (!response.ok || !result?.success) throw new Error(result?.error?.message || 'One of the photos could not be uploaded.');
  return { url: result.data.url, deleteUrl: result.data.delete_url || '' };
}

function getSubmissionPhotoPath(photoKey) {
  return photoKey.startsWith('relationships.') ? `person.${photoKey}` : photoKey;
}

function setDeepValue(target, path, value) {
  const segments = path.split('.');
  let cursor = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const next = segments[i + 1];
    const numeric = /^\d+$/.test(next);
    if (!(segment in cursor)) cursor[segment] = numeric ? [] : {};
    cursor = cursor[segment];
  }
  cursor[segments.at(-1)] = value;
}

function initializeFirebase(firebaseConfig) {
  const missingKeys = Object.entries(firebaseConfig).filter(([, value]) => !String(value || '').trim()).map(([key]) => key);
  if (missingKeys.length) throw new Error(`Your Firebase config is missing values: ${missingKeys.join(', ')}.`);
  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
  return firebase.firestore(app);
}

async function saveSubmissionToFirebase(db, submission) {
  const collectionRef = db.collection('Family3_Form_Submissions');
  const docRef = await collectionRef.add(submission);
  return docRef.id;
}

async function findExistingPersonByFullName(db, fullName) {
  const normalizedName = normalizeComparableValue(fullName);
  if (!normalizedName) return null;
  const snapshot = await db.collection('Family3_Form_Submissions').get();
  for (const doc of snapshot.docs) {
    const record = doc.data() || {};
    const recordName = normalizeComparableValue(record?.person?.name || '');
    if (recordName === normalizedName) {
      return { id: doc.id, fullName: record?.person?.name || '' };
    }
  }
  return null;
}

function normalizeComparableValue(value) { return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase(); }

function renderDuplicatePreview(match) {
  duplicatePreview.dataset.name = match.fullName || '';
  duplicatePreview.innerHTML = `
    <strong>${escapeHtml(t('status.duplicateTitle'))}</strong><br>
    ${escapeHtml(t('status.duplicateName'))}: ${escapeHtml(match.fullName || 'Unknown')}
  `;
  duplicatePreview.classList.remove('hidden');
}

function clearDuplicatePreview() {
  duplicatePreview.textContent = '';
  duplicatePreview.classList.add('hidden');
  delete duplicatePreview.dataset.name;
}

async function logSavedSubmissionFromFirebase(db, documentId) {
  const docSnapshot = await db.collection('Family3_Form_Submissions').doc(documentId).get();
  if (!docSnapshot.exists) {
    console.warn('The saved Firebase record could not be loaded again for console logging.', documentId);
    return;
  }
  console.log('Family3 saved Firebase record:', { documentId: docSnapshot.id, ...docSnapshot.data() });
}

function persistDraft() {
  const now = new Date();
  lastAutoSaveStamp = now.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  const draft = {
    uiLanguage: currentLanguage,
    formValues: Object.fromEntries(new FormData(form).entries()),
    photos: [...PHOTO_STORE.entries()],
    repeatCounts: Object.fromEntries(repeatableGroups.map((group) => [group, document.querySelectorAll(`.entry-card[data-group="${group}"]`).length])),
    currentStep,
    savedAt: lastAutoSaveStamp,
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  updateDraftHintText();
}

function updateDraftHintText() {
  if (!draftHintText) return;
  if (lastAutoSaveStamp) {
    draftHintText.textContent = t('hero.autoSavedAt', { stamp: lastAutoSaveStamp });
  } else {
    draftHintText.textContent = t('hero.autoSave');
  }
}

function getDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; }
}

function restoreDraft() {
  const draft = getDraft();
  if (!draft) return;
  currentLanguage = draft.uiLanguage || 'en';
  Object.entries(draft.formValues || {}).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);
    if (field && 'value' in field) field.value = value;
  });
  PHOTO_STORE.clear();
  (draft.photos || []).forEach(([key, value]) => PHOTO_STORE.set(key, value));
  currentStep = Math.min(Number(draft.currentStep || 0), stepPanels.length - 1);
  lastAutoSaveStamp = draft.savedAt || '';
  setStatus(t('status.restored'), false, true);
}

function collectDraftGroupValues(groupName, values, count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    list.push({ type: values[`${groupName}_${i}_type`] || '', name: values[`${groupName}_${i}_name`] || '', birthDate: values[`${groupName}_${i}_birthDate`] || '' });
  }
  return list;
}

function setStatus(message, isError = false, isSuccess = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('is-error', Boolean(isError));
  statusMessage.classList.toggle('is-success', Boolean(isSuccess));
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildCustomSelects(scope = document) {
  scope.querySelectorAll('select[data-custom-select="true"]').forEach((select) => {
    if (select.nextElementSibling?.classList.contains('custom-select')) {
      refreshCustomSelect(select);
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    const menu = document.createElement('div');
    menu.className = 'custom-select-menu hidden';
    wrapper.append(trigger, menu);
    select.classList.add('is-hidden-native-select');
    select.after(wrapper);

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      closeAllCustomSelects(wrapper);
      wrapper.classList.toggle('is-open');
      menu.classList.toggle('hidden');
    });

    document.addEventListener('click', (event) => {
      if (!wrapper.contains(event.target)) {
        wrapper.classList.remove('is-open');
        menu.classList.add('hidden');
      }
    });

    refreshCustomSelect(select);
  });
}

function refreshCustomSelect(select) {
  const wrapper = select.nextElementSibling;
  if (!wrapper?.classList.contains('custom-select')) return;
  const trigger = wrapper.querySelector('.custom-select-trigger');
  const menu = wrapper.querySelector('.custom-select-menu');
  menu.innerHTML = '';
  [...select.options].forEach((option) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'custom-select-option';
    item.textContent = getOptionLabel(option);
    item.dataset.value = option.value;
    if (option.selected) item.classList.add('is-selected');
    item.addEventListener('click', () => {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      wrapper.classList.remove('is-open');
      menu.classList.add('hidden');
      refreshCustomSelect(select);
    });
    menu.appendChild(item);
  });
  const selected = select.selectedOptions[0] || select.options[0];
  trigger.textContent = selected ? getOptionLabel(selected) : t('common.selectOne');
}

function getOptionLabel(option) {
  if (option.dataset.i18nOption) return t(option.dataset.i18nOption);
  if (option.dataset.i18nKey) return t(option.dataset.i18nKey);
  return option.textContent;
}

function closeAllCustomSelects(except) {
  document.querySelectorAll('.custom-select').forEach((wrapper) => {
    if (wrapper === except) return;
    wrapper.classList.remove('is-open');
    wrapper.querySelector('.custom-select-menu')?.classList.add('hidden');
  });
}

function capitalize(text) {
  return String(text || '').charAt(0).toUpperCase() + String(text || '').slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

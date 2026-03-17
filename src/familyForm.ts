// @ts-nocheck
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { DEFAULT_APP_STATE_COLLECTION, DEFAULT_FORM_SUBMISSIONS_COLLECTION, DEFAULT_FAMILY_DISPLAY_NAME, DEFAULT_FAMILY_SLUG, DEFAULT_SAVED_PEOPLE_DOCUMENT, buildFamilyDisplayNameFromSlug, buildFamilyScopedCollectionName, findFamilyOption, sanitizeFamilySlug } from './familyConfig';

const DRAFT_KEY_PREFIX = 'family3_form_draft_v7';
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
      familyReferenceValid: 'Family reference: {{family}} ✓',
      familyReferencePending: 'Family reference: {{family}}',
      familyReferenceMissing: 'Please use the correct family link to open and complete this form.',
      editModeMessage: 'Editing {{person}} for {{family}}.',
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
      missingFamilyLink: 'Please use the correct family link to open and complete this form.',
      invalidFamilyLink: 'This form link is not active for a valid family tree. Please use the correct link.',
      invalidEditLink: 'This edit link is no longer valid for this family tree. Please ask for a new link.',
      familyNotFound: 'That family tree could not be found right now. Please use the correct family link.',
      familyCheckFailed: 'The family link could not be checked right now. Please try again.',
      loadingFamily: 'Opening the family form…',
      loadingEditLink: "Loading this person's details…",
      updatePerson: 'Update person',
      firebaseInitFailed: 'Firebase could not be initialised. Check your config values.',
      submittedSuccess: 'Form submitted successfully to Firebase.',
      restartCountdown: 'Form submitted successfully. This form will restart in {{seconds}} seconds.',
      restartNow: 'Restarting the form now…',
      restored: 'Saved progress was restored on this device.',
    },
    validation: { required: 'Please fill in this field.' },
    entry: { itemNumber: '{{name}} {{number}}' },
  },
  af: {
    hero: {
      title: 'Voeg ’n familielid by',
      familyReferenceValid: 'Familieverwysing: {{family}} ✓',
      familyReferencePending: 'Familieverwysing: {{family}}',
      familyReferenceMissing: 'Gebruik asseblief die korrekte familieskakel om hierdie vorm oop te maak en te voltooi.',
      editModeMessage: 'Jy wysig {{person}} vir {{family}}.',
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
      missingFamilyLink: 'Gebruik asseblief die korrekte familieskakel om hierdie vorm oop te maak en te voltooi.',
      invalidFamilyLink: 'Hierdie vormskakel is nie aktief vir ’n geldige stamboom nie. Gebruik asseblief die korrekte skakel.',
      invalidEditLink: 'Hierdie wysigskakel is nie meer geldig vir hierdie stamboom nie. Vra asseblief vir ’n nuwe skakel.',
      familyNotFound: 'Daardie stamboom kon nie nou gevind word nie. Gebruik asseblief die korrekte familieskakel.',
      familyCheckFailed: 'Die familieskakel kon nie nou nagegaan word nie. Probeer asseblief weer.',
      loadingFamily: 'Die familievorm word gelaai…',
      loadingEditLink: 'Hierdie persoon se besonderhede word gelaai…',
      updatePerson: 'Werk persoon by',
      firebaseInitFailed: 'Firebase kon nie begin word nie. Gaan jou konfigurasiewaardes na.',
      submittedSuccess: 'Vorm is suksesvol na Firebase gestuur.',
      restartCountdown: 'Vorm is suksesvol ingestuur. Hierdie vorm sal oor {{seconds}} sekondes herbegin.',
      restartNow: 'Die vorm herbegin nou…',
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
let familyContextText = null;
let formAccessMessage = null;
let familyFormWizardShell = null;
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
  familyContextText = document.getElementById('familyContextText');
  formAccessMessage = document.getElementById('formAccessMessage');
  familyFormWizardShell = document.getElementById('familyFormWizardShell');
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

  logSubmitDebug('DOM refs cached', {
    formFound: Boolean(form),
    statusMessageFound: Boolean(statusMessage),
    submitBtnFound: Boolean(submitBtn),
    saveTargetTextFound: Boolean(saveTargetText),
    familySelectorFound: false,
    familyContextTextFound: Boolean(familyContextText),
    draftHintTextFound: Boolean(draftHintText),
    wizardProgressFound: Boolean(wizardProgress),
    stepPanelCount: stepPanels.length,
  });
}

let currentStep = 0;
let activeCropSession = null;
let currentLanguage = 'en';
let currentFamilySlug = '';
let currentFamilyDisplayName = '';
let currentEditPersonId = '';
let isEditMode = false;
let currentFamilyIsVerified = false;
let familyValidationToken = 0;
let familySavedPeopleCache = new Map();
let lastAutoSaveStamp = '';
let restartCountdownTimer = null;
let restartCountdownValue = 0;
let isRestartCountdownActive = false;
const FORM_GATE_MIN_LOADING_MS = 1200;


function normalizeComparableValue(value) { return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase(); }

function getRequestedFamilySlugFromLocation() {
  if (typeof window === 'undefined') return '';
  try {
    const url = new URL(window.location.href);
    return sanitizeFamilySlug(url.searchParams.get('family') || '');
  } catch (error) {
    return '';
  }
}

function getEditPersonIdFromLocation() {
  if (typeof window === 'undefined') return '';
  try {
    const url = new URL(window.location.href);
    return String(url.searchParams.get('editPersonId') || '').trim();
  } catch (error) {
    return '';
  }
}

function getCurrentDraftKey() {
  const familyKey = sanitizeFamilySlug(currentFamilySlug || DEFAULT_FAMILY_SLUG);
  const editKey = String(currentEditPersonId || 'new').trim() || 'new';
  return `${DRAFT_KEY_PREFIX}_${familyKey}_${editKey}`;
}

function getCurrentFamilyRecord() {
  return findFamilyOption(currentFamilySlug) || {
    slug: currentFamilySlug || DEFAULT_FAMILY_SLUG,
    displayName: buildFamilyDisplayNameFromSlug(currentFamilySlug || DEFAULT_FAMILY_SLUG) || DEFAULT_FAMILY_DISPLAY_NAME,
  };
}

function getActiveFormSubmissionsCollectionName() {
  return buildFamilyScopedCollectionName(DEFAULT_FORM_SUBMISSIONS_COLLECTION, currentFamilySlug || DEFAULT_FAMILY_SLUG);
}

function getActiveAppStateCollectionName() {
  return buildFamilyScopedCollectionName(DEFAULT_APP_STATE_COLLECTION, currentFamilySlug || DEFAULT_FAMILY_SLUG);
}

function updateSubmitAvailability() {
  if (!submitBtn) return;
  const shouldDisable = isRestartCountdownActive || !currentFamilyIsVerified;
  submitBtn.disabled = shouldDisable;
}

function updateFamilyContextUi() {
  if (familyContextText) {
    if (currentFamilyIsVerified && currentFamilyDisplayName) {
      familyContextText.textContent = t('hero.familyReferenceValid', { family: currentFamilyDisplayName });
      familyContextText.dataset.state = 'valid';
    } else if (currentFamilyDisplayName) {
      familyContextText.textContent = t('hero.familyReferencePending', { family: currentFamilyDisplayName });
      familyContextText.dataset.state = 'pending';
    } else {
      familyContextText.textContent = t('hero.familyReferenceMissing');
      familyContextText.dataset.state = 'empty';
    }
  }

  if (saveTargetText) {
    saveTargetText.innerHTML = '';
  }

  updateSubmitAvailability();
}

function applyFamilySelection(value, { allowFallback = false } = {}) {
  const trimmedValue = String(value || '').trim();
  const family = findFamilyOption(trimmedValue) || (allowFallback ? getCurrentFamilyRecord() : null);
  if (family) {
    currentFamilySlug = family.slug;
    currentFamilyDisplayName = family.displayName;
    currentFamilyIsVerified = false;
    updateFamilyContextUi();
    return true;
  }

  currentFamilySlug = '';
  currentFamilyDisplayName = '';
  currentFamilyIsVerified = false;
  updateFamilyContextUi();
  return false;
}

async function verifyCurrentFamilySelection() {
  const validationToken = ++familyValidationToken;
  const rawValue = String(currentFamilySlug || '').trim();
  const wasApplied = applyFamilySelection(rawValue);
  if (!wasApplied || !currentFamilySlug) {
    currentFamilyIsVerified = false;
    updateFamilyContextUi();
    return false;
  }

  try {
    if (!firestoreDb) {
      firestoreDb = initializeFirebase(FRONTEND_CONFIG.firebase);
    }
    const scopedCollection = getActiveAppStateCollectionName();
    const configSnapshot = await firestoreDb.collection(scopedCollection).doc('familytree.config').get();
    if (validationToken !== familyValidationToken) return currentFamilyIsVerified;
    currentFamilyIsVerified = Boolean(configSnapshot.exists);
    if (currentFamilyIsVerified) {
      const matched = findFamilyOption(rawValue) || findFamilyOption(currentFamilySlug);
      if (matched) {
        currentFamilyDisplayName = matched.displayName;
      }
      setStatus('', false, true);
      familySavedPeopleCache.delete(currentFamilySlug);
      await refreshRelationshipAutocompleteOptions();
      persistDraft();
    } else {
      setStatus(t('status.familyNotFound'), true);
    }
  } catch (error) {
    if (validationToken !== familyValidationToken) return false;
    currentFamilyIsVerified = false;
    setStatus(t('status.familyCheckFailed'), true);
  }

  updateFamilyContextUi();
  return currentFamilyIsVerified;
}

function wireFamilySelector() {
  const requestedFamilySlug = getRequestedFamilySlugFromLocation();
  const requestedFamily = findFamilyOption(requestedFamilySlug);
  if (requestedFamily) {
    applyFamilySelection(requestedFamily.slug, { allowFallback: true });
    return;
  }

  currentFamilySlug = '';
  currentFamilyDisplayName = '';
  currentFamilyIsVerified = false;
  updateFamilyContextUi();
}

function getSavedPersonName(record) {
  return String(record?.person?.name || record?.name || '').trim();
}

function getSavedPersonId(record) {
  return String(record?.firebaseDocumentId || record?.person?.firebaseDocumentId || '').trim();
}

async function fetchSavedPeopleForCurrentFamily(db) {
  if (!currentFamilySlug) return [];
  if (familySavedPeopleCache.has(currentFamilySlug)) {
    return familySavedPeopleCache.get(currentFamilySlug) || [];
  }

  const snapshot = await db.collection(getActiveAppStateCollectionName()).doc(DEFAULT_SAVED_PEOPLE_DOCUMENT).get();
  let records = [];
  if (snapshot.exists) {
    const raw = snapshot.data() || {};
    const data = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
    const savedPeople = Array.isArray(data?.savedPeople) ? data.savedPeople : [];
    records = savedPeople.filter((record) => getSavedPersonName(record));
  }

  familySavedPeopleCache.set(currentFamilySlug, records);
  return records;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function ensureMinimumLoading(startedAt, minimumMs = FORM_GATE_MIN_LOADING_MS) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < minimumMs) {
    await wait(minimumMs - elapsed);
  }
}

function setFormLoadingState(messageKey = 'status.loadingFamily', messageVars = {}) {
  if (familyFormWizardShell) {
    familyFormWizardShell.classList.add('hidden');
    familyFormWizardShell.classList.remove('is-revealed');
  }

  if (formAccessMessage) {
    const resolvedMessage = messageKey ? t(messageKey, messageVars) : '';
    formAccessMessage.textContent = resolvedMessage;
    formAccessMessage.dataset.state = 'loading';
    formAccessMessage.dataset.messageKey = messageKey || '';
    formAccessMessage.dataset.messageVars = messageKey ? JSON.stringify(messageVars || {}) : '';
    formAccessMessage.classList.toggle('hidden', !resolvedMessage);
  }

  if (draftHintText) {
    draftHintText.classList.add('hidden');
  }

  isEditMode = false;
  applyEditModeUiState();
  updateSubmitAvailability();
}

function setFormInfoState(message = '', messageKey = '', messageVars = {}) {
  if (familyFormWizardShell) {
    familyFormWizardShell.classList.add('hidden');
    familyFormWizardShell.classList.remove('is-revealed');
  }

  if (formAccessMessage) {
    const resolvedMessage = messageKey ? t(messageKey, messageVars) : message;
    formAccessMessage.textContent = resolvedMessage;
    formAccessMessage.dataset.state = 'info';
    formAccessMessage.dataset.messageKey = messageKey || '';
    formAccessMessage.dataset.messageVars = messageKey ? JSON.stringify(messageVars || {}) : '';
    formAccessMessage.classList.toggle('hidden', !resolvedMessage);
  }

  if (draftHintText) {
    draftHintText.classList.add('hidden');
  }

  isEditMode = false;
  applyEditModeUiState();
  updateSubmitAvailability();
}

function setFormAccessState(isAllowed, message = '', messageKey = '', messageVars = {}) {
  if (familyFormWizardShell) {
    if (isAllowed) {
      familyFormWizardShell.classList.remove('hidden');
      familyFormWizardShell.classList.remove('is-revealed');
      window.requestAnimationFrame(() => {
        familyFormWizardShell?.classList.add('is-revealed');
      });
    } else {
      familyFormWizardShell.classList.add('hidden');
      familyFormWizardShell.classList.remove('is-revealed');
    }
  }

  if (formAccessMessage) {
    const resolvedMessage = messageKey ? t(messageKey, messageVars) : message;
    formAccessMessage.textContent = resolvedMessage;
    formAccessMessage.dataset.state = isAllowed ? 'allowed' : 'blocked';
    formAccessMessage.dataset.messageKey = messageKey || '';
    formAccessMessage.dataset.messageVars = messageKey ? JSON.stringify(messageVars || {}) : '';
    formAccessMessage.classList.toggle('hidden', !resolvedMessage);
  }

  if (draftHintText) {
    draftHintText.classList.toggle('hidden', !isAllowed);
  }

  if (!isAllowed) {
    isEditMode = false;
    applyEditModeUiState();
  }

  updateSubmitAvailability();
}

function getMissingFamilyLinkMessage() {
  return t('status.missingFamilyLink');
}

function getInvalidFamilyLinkMessage() {
  return t('status.invalidFamilyLink');
}

function getInvalidEditLinkMessage() {
  return t('status.invalidEditLink');
}

async function refreshRelationshipAutocompleteOptions() {
  const datalist = document.getElementById('savedPeopleRelationshipOptions');
  if (!datalist) return;
  if (!firestoreDb || !currentFamilySlug) {
    datalist.innerHTML = '';
    return;
  }
  const records = await fetchSavedPeopleForCurrentFamily(firestoreDb);
  const names = [...new Set(records.map(getSavedPersonName).filter(Boolean).sort((a, b) => a.localeCompare(b)))];
  datalist.innerHTML = names.map((name) => `<option value="${escapeHtml(name)}"></option>`).join('');
}

async function findSavedPersonByName(db, fullName) {
  const normalizedName = normalizeComparableValue(fullName);
  if (!normalizedName) return null;
  const records = await fetchSavedPeopleForCurrentFamily(db);
  return records.find((record) => normalizeComparableValue(getSavedPersonName(record)) === normalizedName) || null;
}

function setPhotoStoreValue(photoKey, photoUrl) {
  if (!photoKey) return;
  const nextUrl = String(photoUrl || '').trim();
  if (!nextUrl) {
    PHOTO_STORE.delete(photoKey);
    return;
  }
  PHOTO_STORE.set(photoKey, { dataUrl: '', filename: '', url: nextUrl, deleteUrl: '' });
}

function populateRelationshipCardFromSavedPerson(card, record) {
  if (!card || !record) return;
  const person = record.person || {};
  const nameInput = card.querySelector('input[name$="_name"]');
  const birthInput = card.querySelector('input[name$="_birthDate"]');
  if (nameInput) nameInput.value = person.name || '';
  if (birthInput && person.birthDate) birthInput.value = person.birthDate;
  const photoWidget = card.querySelector('.photo-widget');
  const photoKey = photoWidget?.dataset?.photoField || '';
  setPhotoStoreValue(photoKey, person.photo || '');
  if (photoWidget) buildPhotoWidget(photoWidget);
}

async function tryAutofillRelationshipCard(card, lookupName) {
  if (!firestoreDb || !currentFamilySlug) return;
  const record = await findSavedPersonByName(firestoreDb, lookupName);
  if (!record) return;
  populateRelationshipCardFromSavedPerson(card, record);
  persistDraft();
}

function wireRelationshipCardAutocomplete(card) {
  const nameInput = card?.querySelector('input[name$="_name"]');
  if (!nameInput || nameInput.dataset.autofillReady === 'true') return;
  nameInput.dataset.autofillReady = 'true';
  nameInput.setAttribute('list', 'savedPeopleRelationshipOptions');
  const handler = () => { void tryAutofillRelationshipCard(card, nameInput.value); };
  nameInput.addEventListener('change', handler);
  nameInput.addEventListener('blur', handler);
}

function clearRepeatableGroups() {
  document.querySelectorAll('.repeatable-list').forEach((list) => { list.innerHTML = ''; });
}

function applySubmissionRecordToForm(record) {
  if (!form || !record?.person) return;
  const person = record.person || {};
  form.reset();
  PHOTO_STORE.clear();
  clearRepeatableGroups();

  const fieldMap = {
    fullName: person.name || '',
    birthDate: person.birthDate || '',
    nickname: person.nickname || '',
    prefix: person.prefix || '',
    maidenName: person.maidenName || '',
    gender: person.gender || '',
    birthPlace: person.birthPlace || '',
    currentLocation: person.currentLocation || '',
    heritage: person.heritage || '',
    stillAlive: person.isAlive || '',
    deathDate: person.deathDate || '',
    deathPlace: person.deathPlace || '',
    occupation: person.occupation || '',
    education: person.education || '',
    maritalStatus: person.maritalStatus || '',
    languages: person.languages || '',
    biography: person.biography || '',
    achievements: person.achievements || '',
    interests: person.interests || '',
    personality: person.personality || '',
    familyNotes: person.familyNotes || '',
  };

  Object.entries(fieldMap).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);
    if (field && 'value' in field) field.value = value;
  });

  if (person.photo) {
    setPhotoStoreValue('person.photo', person.photo);
  }

  repeatableGroups.forEach((groupName) => {
    const entries = Array.isArray(person.relationships?.[groupName]) ? person.relationships[groupName] : [];
    entries.forEach((entry) => addEntry(groupName, entry));
  });

  buildAllPhotoWidgets();
  buildCustomSelects();
  updateDeathFields();
  renderReviewSummary();
}

function applyEditModeUiState() {
  if (!submitBtn) return;
  submitBtn.textContent = isEditMode ? t('status.updatePerson') : t('buttons.submit');
}

async function loadEditModePerson() {
  if (!firestoreDb || !currentEditPersonId || !currentFamilySlug) return false;
  const records = await fetchSavedPeopleForCurrentFamily(firestoreDb);
  const matched = records.find((record) => getSavedPersonId(record) === currentEditPersonId);
  if (!matched) {
    setFormAccessState(false, '', 'status.invalidEditLink');
    setStatus('', false, true);
    return false;
  }
  isEditMode = true;
  setFormAccessState(true, '', 'hero.editModeMessage', { person: getSavedPersonName(matched), family: currentFamilyDisplayName });
  applySubmissionRecordToForm(matched);
  applyEditModeUiState();
  updateSubmitAvailability();
  setStatus(t('hero.editModeMessage', { person: getSavedPersonName(matched), family: currentFamilyDisplayName }), false, true);
  return true;
}

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
const SUBMIT_DEBUG_ENABLED = true;

function logSubmitDebug(stage, payload = null) {
  if (!SUBMIT_DEBUG_ENABLED) return;
  const time = new Date().toISOString();
  if (payload === null) {
    console.log(`[Family3 Submit Debug][${time}] ${stage}`);
    return;
  }
  console.log(`[Family3 Submit Debug][${time}] ${stage}`, payload);
}

export async function initFamilyForm() {
  cacheDomRefs();
  if (!form || !wizardProgress) {
    console.warn('Family form root nodes were not found during init.');
    return;
  }

  currentEditPersonId = getEditPersonIdFromLocation();
  wireFamilySelector();
  const restoredDraft = currentFamilySlug && !currentEditPersonId ? restoreDraft() : false;
  buildWizardProgress();
  buildAllPhotoWidgets();
  initRepeatableGroups();
  wireCropperEvents();
  wireFormEvents();
  initLanguageSwitcher();
  buildCustomSelects();
  updateDeathFields();
  applyTranslations();
  updateFamilyContextUi();
  updateWizardUI();
  applyEditModeUiState();

  try {
    firestoreDb = initializeFirebase(FRONTEND_CONFIG.firebase);
    if (currentFamilySlug) {
      const loadingStartedAt = Date.now();
      setFormLoadingState('status.loadingFamily');
      const familyIsValid = await verifyCurrentFamilySelection();
      if (!familyIsValid) {
        await ensureMinimumLoading(loadingStartedAt);
        setFormAccessState(false, '', 'status.invalidFamilyLink');
        return;
      }

      if (currentEditPersonId) {
        setFormLoadingState('status.loadingEditLink');
        const editLoaded = await loadEditModePerson();
        await ensureMinimumLoading(loadingStartedAt);
        if (!editLoaded) return;
      } else {
        await ensureMinimumLoading(loadingStartedAt);
        setFormAccessState(true, '');
      }

      await refreshRelationshipAutocompleteOptions();
    } else {
      const loadingStartedAt = Date.now();
      setFormLoadingState('status.loadingFamily');
      await ensureMinimumLoading(loadingStartedAt);
      setFormInfoState('', 'status.missingFamilyLink');
    }
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
  updateFamilyContextUi();
  if (formAccessMessage?.dataset?.messageKey) {
    let vars = {};
    try {
      vars = formAccessMessage.dataset.messageVars ? JSON.parse(formAccessMessage.dataset.messageVars) : {};
    } catch (error) {
      vars = {};
    }
    formAccessMessage.textContent = t(formAccessMessage.dataset.messageKey, vars);
    formAccessMessage.classList.toggle('hidden', !formAccessMessage.textContent);
  }
  applyEditModeUiState();
  updateSubmitAvailability();
  document.querySelectorAll('.photo-widget').forEach(buildPhotoWidget);
  document.querySelectorAll('.repeatable-list').forEach((list) => {
    list.querySelectorAll('.entry-card').forEach((card) => {
      refreshEntryCardText(card);
      wireRelationshipCardAutocomplete(card);
    });
  });
  buildCustomSelects();
  void refreshRelationshipAutocompleteOptions();
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
    button.disabled = isRestartCountdownActive;
  });
  wizardStepCount.textContent = t('steps.counter', { current: currentStep + 1, total: stepPanels.length });
  prevStepBtn.disabled = isRestartCountdownActive || currentStep === 0;
  const isLast = currentStep === stepPanels.length - 1;
  nextStepBtn.classList.toggle('hidden', isLast);
  submitBtn.classList.toggle('hidden', !isLast);
  nextStepBtn.disabled = isRestartCountdownActive;
  submitBtn.disabled = isRestartCountdownActive;
  if (isLast) renderReviewSummary();
}

function goToStep(targetStep, allowJump = false) {
  if (isRestartCountdownActive) return;
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

function clearRestartCountdown() {
  if (restartCountdownTimer) {
    window.clearInterval(restartCountdownTimer);
    restartCountdownTimer = null;
  }
  restartCountdownValue = 0;
  isRestartCountdownActive = false;
}

function resetFormAfterSubmit() {
  form.reset();
  PHOTO_STORE.clear();
  document.querySelectorAll('.repeatable-list').forEach((list) => { list.innerHTML = ''; });
  buildAllPhotoWidgets();
  buildCustomSelects();
  currentStep = 0;
  updateDeathFields();
  updateWizardUI();
  setStatus('');
  document.getElementById('wizardProgress')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
  logSubmitDebug('Form reset completed');
}

function startSubmitRestartCountdown(seconds = 5) {
  clearRestartCountdown();
  isRestartCountdownActive = true;
  restartCountdownValue = seconds;
  setStatus(t('status.restartCountdown', { seconds: restartCountdownValue }), false, true);
  updateWizardUI();
  logSubmitDebug('Submit restart countdown started', { seconds: restartCountdownValue });

  restartCountdownTimer = window.setInterval(() => {
    restartCountdownValue -= 1;

    if (restartCountdownValue <= 0) {
      clearRestartCountdown();
      setStatus(t('status.restartNow'), false, true);
      logSubmitDebug('Submit restart countdown completed');
      resetFormAfterSubmit();
      return;
    }

    setStatus(t('status.restartCountdown', { seconds: restartCountdownValue }), false, true);
    logSubmitDebug('Submit restart countdown tick', { seconds: restartCountdownValue });
  }, 1000);
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
    preview.src = existing.url || existing.dataUrl || '';
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
        <input type="text" name="${groupName}_${index}_name" list="savedPeopleRelationshipOptions" value="${escapeHtml(values.name || '')}" />
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
  const photoWidget = card.querySelector('.photo-widget');
  if (values.photo) {
    setPhotoStoreValue(`relationships.${groupName}.${index}.photo`, values.photo);
  }
  buildPhotoWidget(photoWidget);
  buildCustomSelects(card);
  wireRelationshipCardAutocomplete(card);
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
    wireRelationshipCardAutocomplete(card);
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
  logSubmitDebug('Submit triggered', {
    currentStep,
    totalSteps: stepPanels.length,
    firestoreReady: Boolean(firestoreDb),
  });
  clearDuplicatePreview();
  setStatus('');

  if (!validateCurrentStep()) {
    logSubmitDebug('Submit stopped: current step validation failed', { currentStep });
    setStatus(t('status.requiredBeforeSubmit'), true);
    return;
  }
  if (!form.reportValidity()) {
    logSubmitDebug('Submit stopped: native form validity failed');
    setStatus(t('status.fixHighlighted'), true);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = t('buttons.submitting');
  logSubmitDebug('Submit button locked');

  try {
    if (!firestoreDb) {
      logSubmitDebug('Initialising Firebase during submit');
      firestoreDb = initializeFirebase(FRONTEND_CONFIG.firebase);
    }

    if (!currentFamilySlug || !currentFamilyIsVerified) {
      setFormAccessState(false, '', currentFamilySlug ? 'status.invalidFamilyLink' : 'status.missingFamilyLink');
      setStatus(currentFamilySlug ? t('status.invalidFamilyLink') : t('status.missingFamilyLink'), true);
      return;
    }

    const submission = buildSubmissionObject();
    logSubmitDebug('Submission object built', {
      id: submission.id,
      personName: submission.person.name,
      birthDate: submission.person.birthDate,
      hasPhoto: Boolean(submission.person.photo),
      familySlug: currentFamilySlug,
    });

    if (!isEditMode) {
      const duplicateMatch = await findExistingPersonByFullName(firestoreDb, submission.person.name);
      logSubmitDebug('Duplicate check completed', {
        duplicateFound: Boolean(duplicateMatch),
        duplicateDocumentId: duplicateMatch?.documentId || null,
      });

      if (duplicateMatch) {
        renderDuplicatePreview(duplicateMatch);
        setStatus(t('status.duplicateStopped'), true);
        logSubmitDebug('Submit stopped: duplicate record found', {
          duplicateDocumentId: duplicateMatch.documentId,
        });
        return;
      }
    }

    logSubmitDebug('Uploading pending photos');
    await uploadPendingPhotos(submission, FRONTEND_CONFIG.imgbbApiKey || '');
    logSubmitDebug('Pending photo upload finished', {
      hasPersonPhoto: Boolean(submission.person.photo),
    });

    if (isEditMode && currentEditPersonId) {
      await updateSavedPersonInFirebase(firestoreDb, currentEditPersonId, submission);
      logSubmitDebug('Saved person updated in Firebase app state', {
        editPersonId: currentEditPersonId,
        familySlug: currentFamilySlug,
      });
      setStatus(`Saved person updated for ${currentFamilyDisplayName}.`, false, true);
      localStorage.removeItem(getCurrentDraftKey());
      lastAutoSaveStamp = '';
      if (draftHintText) draftHintText.textContent = t('hero.autoSave');
      return;
    }

    const savedDocumentId = await saveSubmissionToFirebase(firestoreDb, submission);
    logSubmitDebug('Submission saved to Firebase', {
      savedDocumentId,
      submissionId: submission.id,
    });

    await logSavedSubmissionFromFirebase(firestoreDb, savedDocumentId);
    logSubmitDebug('Saved submission re-read from Firebase', { savedDocumentId });

    localStorage.removeItem(getCurrentDraftKey());
    lastAutoSaveStamp = '';
    currentStep = stepPanels.length - 1;
    updateWizardUI();
    startSubmitRestartCountdown(5);
    logSubmitDebug('Draft cleared and success countdown started');


    if (draftHintText) {
      draftHintText.textContent = t('hero.autoSave');
      logSubmitDebug('Updated draftHintText copy');
    } else {
      logSubmitDebug('draftHintText element missing; skipping textContent update');
    }

  } catch (error) {
    console.error(error);
    logSubmitDebug('Submit failed with error', {
      message: error?.message || String(error),
      stack: error?.stack || null,
    });
    setStatus(error.message || t('status.fixHighlighted'), true);
  } finally {
    if (!isRestartCountdownActive) {
      submitBtn.disabled = false;
    }
    submitBtn.textContent = isEditMode ? t('status.updatePerson') : t('buttons.submit');
    updateWizardUI();
    logSubmitDebug('Submit button unlocked');
  }
}

function buildSubmissionObject() {
  const data = new FormData(form);
  const now = new Date().toISOString();
  return {
    id: `sub_${Date.now()}`,
    familySlug: currentFamilySlug || DEFAULT_FAMILY_SLUG,
    familyDisplayName: currentFamilyDisplayName || DEFAULT_FAMILY_DISPLAY_NAME,
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
      submissionMeta: { submittedAt: now, updatedAt: now, status: isEditMode ? 'updated' : 'pending' },
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
  const collectionRef = db.collection(getActiveFormSubmissionsCollectionName());
  const docRef = await collectionRef.add(submission);
  return docRef.id;
}

async function findExistingPersonByFullName(db, fullName) {
  const normalizedName = normalizeComparableValue(fullName);
  if (!normalizedName) return null;
  const snapshot = await db.collection(getActiveFormSubmissionsCollectionName()).get();
  for (const doc of snapshot.docs) {
    const record = doc.data() || {};
    const recordName = normalizeComparableValue(record?.person?.name || '');
    if (recordName === normalizedName) {
      return { id: doc.id, fullName: record?.person?.name || '' };
    }
  }
  return null;
}

async function updateSavedPersonInFirebase(db, recordId, submission) {
  const collectionRef = db.collection(getActiveAppStateCollectionName());
  const docRef = collectionRef.doc(DEFAULT_SAVED_PEOPLE_DOCUMENT);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('The saved people library for this family could not be found.');
  }

  const raw = snapshot.data() || {};
  const envelopeData = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  const savedPeople = Array.isArray(envelopeData?.savedPeople) ? envelopeData.savedPeople : [];
  const targetIndex = savedPeople.findIndex((record) => getSavedPersonId(record) === recordId);
  if (targetIndex < 0) {
    throw new Error('The saved person referenced by this edit link could not be found.');
  }

  const existingRecord = savedPeople[targetIndex] || {};
  const existingPerson = existingRecord.person || {};
  const nextNow = new Date().toISOString();
  const nextRecord = {
    ...existingRecord,
    familySlug: currentFamilySlug || existingRecord.familySlug || '',
    familyDisplayName: currentFamilyDisplayName || existingRecord.familyDisplayName || '',
    firebaseDocumentId: recordId,
    person: {
      ...existingPerson,
      ...submission.person,
      submissionMeta: {
        ...(existingPerson.submissionMeta || {}),
        ...(submission.person.submissionMeta || {}),
        submittedAt: existingPerson.submissionMeta?.submittedAt || submission.person.submissionMeta?.submittedAt || nextNow,
        updatedAt: nextNow,
        status: 'updated',
      },
      node: existingPerson.node || submission.person.node || {
        title: '',
        coverImage: '',
        imageCaption: '',
        eventDate: '',
        location: '',
        notes: '',
      },
      relationships: submission.person.relationships || existingPerson.relationships || {},
    },
  };

  const nextSavedPeople = [...savedPeople];
  nextSavedPeople[targetIndex] = nextRecord;
  familySavedPeopleCache.set(currentFamilySlug, nextSavedPeople);

  const nextPayload = raw?.data && typeof raw.data === 'object'
    ? {
        ...raw,
        data: {
          ...envelopeData,
          savedPeople: nextSavedPeople,
        },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }
    : {
        ...envelopeData,
        savedPeople: nextSavedPeople,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

  await docRef.set(nextPayload, { merge: false });
}

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
  const docSnapshot = await db.collection(getActiveFormSubmissionsCollectionName()).doc(documentId).get();
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
    familySlug: currentFamilySlug,
    familyDisplayName: currentFamilyDisplayName,
    editPersonId: currentEditPersonId,
    formValues: Object.fromEntries(new FormData(form).entries()),
    photos: [...PHOTO_STORE.entries()],
    repeatCounts: Object.fromEntries(repeatableGroups.map((group) => [group, document.querySelectorAll(`.entry-card[data-group="${group}"]`).length])),
    currentStep,
    savedAt: lastAutoSaveStamp,
  };
  localStorage.setItem(getCurrentDraftKey(), JSON.stringify(draft));
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
  try { return JSON.parse(localStorage.getItem(getCurrentDraftKey()) || 'null'); } catch { return null; }
}

function restoreDraft() {
  const draft = getDraft();
  if (!draft) return false;
  currentLanguage = draft.uiLanguage || 'en';
  if (!getRequestedFamilySlugFromLocation() && draft.familySlug) {
    applyFamilySelection(draft.familySlug, { syncInput: true, allowFallback: true });
  }
  Object.entries(draft.formValues || {}).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);
    if (field && 'value' in field) field.value = value;
  });
  PHOTO_STORE.clear();
  (draft.photos || []).forEach(([key, value]) => PHOTO_STORE.set(key, value));
  currentStep = Math.min(Number(draft.currentStep || 0), stepPanels.length - 1);
  lastAutoSaveStamp = draft.savedAt || '';
  setStatus(t('status.restored'), false, true);
  return true;
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

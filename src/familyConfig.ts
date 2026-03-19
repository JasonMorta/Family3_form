export const DEFAULT_FAMILY_DISPLAY_NAME = 'Coetzee';
export const DEFAULT_FAMILY_SLUG = 'coetzee';
export const DEFAULT_FORM_SUBMISSIONS_COLLECTION = 'Family3_Form_Submissions';
export const DEFAULT_APP_STATE_COLLECTION = 'FamilyTree_App_State';
export const DEFAULT_SAVED_PEOPLE_DOCUMENT = 'familyTreeAppSavedPeople';
export const DEFAULT_UPDATE_REQUESTS_COLLECTION = 'FamilyTree_Update_Requests';

export function sanitizeFamilySlug(value: string) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  const normalized = raw
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || '';
}

export function buildFamilyDisplayNameFromSlug(value: string) {
  const safeSlug = sanitizeFamilySlug(value);
  if (!safeSlug) return '';
  return safeSlug
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildFamilyScopedCollectionName(baseName: string, slug: string) {
  const safeBase = String(baseName || '').trim();
  const safeSlug = sanitizeFamilySlug(slug);
  return safeBase && safeSlug ? `${safeBase}_${safeSlug}` : safeBase;
}

export function findFamilyOption(value: string) {
  const safeSlug = sanitizeFamilySlug(value);
  if (!safeSlug) return null;
  return {
    slug: safeSlug,
    displayName: buildFamilyDisplayNameFromSlug(safeSlug) || safeSlug,
  };
}

export type SelectOption = {
  value: string;
  i18nOption?: string;
  text?: string;
};

export type BaseField = {
  kind: 'input' | 'select' | 'textarea';
  name?: string;
  id?: string;
  type?: string;
  labelKey?: string;
  helpKey?: string;
  placeholderKey?: string;
  placeholder?: string;
  required?: boolean;
  full?: boolean;
  className?: string;
  dataStepRequired?: boolean;
  customSelect?: boolean;
  rows?: number;
  options?: SelectOption[];
};

export type StepHeaderDef = {
  kickerKey: string;
  titleKey: string;
  descKey: string;
};

export type StepContentDef =
  | { type: 'fields'; gridClassName?: string; fields: BaseField[] }
  | { type: 'photo'; photoField: string }
  | { type: 'repeatable'; groups: Array<{ name: string; titleKey: string; addButtonKey: string }> }
  | { type: 'repeatableWithNotes'; groups: Array<{ name: string; titleKey: string; addButtonKey: string }>; notesField: BaseField }
  | { type: 'review' };

export type StepDef = {
  step: number;
  header: StepHeaderDef;
  content: StepContentDef;
};

export const familyFormTiers = {
  hero: {
    eyebrow: 'Family3 Form',
    languages: [
      { code: 'en', label: 'English', active: true },
      { code: 'af', label: 'Afrikaans', active: false },
    ],
  },
  steps: [
    {
      step: 0,
      header: {
        kickerKey: 'steps.step1.kicker',
        titleKey: 'steps.step1.title',
        descKey: 'steps.step1.desc',
      },
      content: {
        type: 'fields',
        gridClassName: 'grid two-col',
        fields: [
          { kind: 'input', id: 'fullName', name: 'fullName', type: 'text', labelKey: 'fields.fullName', required: true, dataStepRequired: true },
          { kind: 'input', id: 'birthDate', name: 'birthDate', type: 'date', labelKey: 'fields.birthDate', required: true, dataStepRequired: true },
          { kind: 'input', name: 'nickname', type: 'text', labelKey: 'fields.nickname' },
          { kind: 'input', name: 'prefix', type: 'text', labelKey: 'fields.prefix', placeholderKey: 'placeholders.prefix', placeholder: 'Mr, Mrs, Dr' },
          { kind: 'input', name: 'maidenName', type: 'text', labelKey: 'fields.maidenName' },
          {
            kind: 'select',
            name: 'gender',
            labelKey: 'fields.gender',
            customSelect: true,
            options: [
              { value: '', i18nOption: 'common.selectOne', text: 'Select one' },
              { value: 'Female', i18nOption: 'options.gender.female', text: 'Female' },
              { value: 'Male', i18nOption: 'options.gender.male', text: 'Male' },
              { value: 'Other', i18nOption: 'options.gender.other', text: 'Other' },
              { value: 'Prefer not to say', i18nOption: 'options.gender.preferNotToSay', text: 'Prefer not to say' },
            ],
          },
        ],
      },
    },
    {
      step: 1,
      header: {
        kickerKey: 'steps.step2.kicker',
        titleKey: 'steps.step2.title',
        descKey: 'steps.step2.desc',
      },
      content: { type: 'photo', photoField: 'person.photo' },
    },
    {
      step: 2,
      header: {
        kickerKey: 'steps.step3.kicker',
        titleKey: 'steps.step3.title',
        descKey: 'steps.step3.desc',
      },
      content: {
        type: 'fields',
        gridClassName: 'grid two-col',
        fields: [
          { kind: 'input', name: 'birthPlace', type: 'text', labelKey: 'fields.birthPlace', placeholderKey: 'placeholders.place', placeholder: 'Town, city, or country' },
          {
            kind: 'select',
            id: 'stillAlive',
            name: 'stillAlive',
            labelKey: 'fields.stillAlive',
            customSelect: true,
            options: [
              { value: '', i18nOption: 'common.selectOne', text: 'Select one' },
              { value: 'true', i18nOption: 'options.yes', text: 'Yes' },
              { value: 'false', i18nOption: 'options.no', text: 'No' },
              { value: 'unknown', i18nOption: 'options.notSure', text: 'Not sure' },
            ],
          },
          { kind: 'input', name: 'deathDate', type: 'date', labelKey: 'fields.deathDate', className: 'death-field' },
          { kind: 'input', name: 'deathPlace', type: 'text', labelKey: 'fields.deathPlace', placeholderKey: 'placeholders.place', placeholder: 'Town, city, or country', className: 'death-field' },
          { kind: 'input', name: 'currentLocation', type: 'text', labelKey: 'fields.currentLocation', placeholderKey: 'placeholders.currentLocation', placeholder: 'Where they live or are based' },
          { kind: 'input', name: 'heritage', type: 'text', labelKey: 'fields.heritage', placeholderKey: 'placeholders.heritage', placeholder: 'South African, British, Xhosa, etc.' },
          { kind: 'input', name: 'occupation', type: 'text', labelKey: 'fields.occupation' },
          { kind: 'input', name: 'education', type: 'text', labelKey: 'fields.education', placeholderKey: 'placeholders.education', placeholder: 'School, degree, trade, or training' },
        ],
      },
    },
    {
      step: 3,
      header: {
        kickerKey: 'steps.step4.kicker',
        titleKey: 'steps.step4.title',
        descKey: 'steps.step4.desc',
      },
      content: {
        type: 'fields',
        gridClassName: 'grid two-col',
        fields: [
          {
            kind: 'select',
            name: 'maritalStatus',
            labelKey: 'fields.maritalStatus',
            customSelect: true,
            options: [
              { value: '', i18nOption: 'common.selectOne', text: 'Select one' },
              { value: 'Single', i18nOption: 'options.marital.single', text: 'Single' },
              { value: 'Married', i18nOption: 'options.marital.married', text: 'Married' },
              { value: 'Divorced', i18nOption: 'options.marital.divorced', text: 'Divorced' },
              { value: 'Widowed', i18nOption: 'options.marital.widowed', text: 'Widowed' },
              { value: 'Separated', i18nOption: 'options.marital.separated', text: 'Separated' },
              { value: 'Partnered', i18nOption: 'options.marital.partnered', text: 'Partnered' },
            ],
          },
          { kind: 'input', name: 'languages', type: 'text', labelKey: 'fields.languages', placeholderKey: 'placeholders.languages', placeholder: 'Separate with commas' },
          { kind: 'textarea', name: 'biography', labelKey: 'fields.biography', helpKey: 'help.biography', placeholderKey: 'placeholders.biography', placeholder: 'A short summary of who this person is and why they matter in the family.', rows: 4, full: true },
          { kind: 'textarea', name: 'achievements', labelKey: 'fields.achievements', helpKey: 'help.achievements', placeholderKey: 'placeholders.achievements', placeholder: 'Important moments, achievements, work, or milestones.', rows: 4, full: true },
          { kind: 'textarea', name: 'interests', labelKey: 'fields.interests', helpKey: 'help.interests', placeholderKey: 'placeholders.interests', placeholder: 'Things they enjoy, collect, create, or care about.', rows: 3, full: true },
          { kind: 'textarea', name: 'personality', labelKey: 'fields.personality', helpKey: 'help.personality', placeholderKey: 'placeholders.personality', placeholder: 'Describe their character, habits, sayings, or memorable traits.', rows: 4, full: true },
        ],
      },
    },
    {
      step: 4,
      header: {
        kickerKey: 'steps.step5.kicker',
        titleKey: 'steps.step5.title',
        descKey: 'steps.step5.desc',
      },
      content: {
        type: 'repeatable',
        groups: [{ name: 'parents', titleKey: 'groups.parents', addButtonKey: 'buttons.addParent' }],
      },
    },
    {
      step: 5,
      header: {
        kickerKey: 'steps.step6.kicker',
        titleKey: 'steps.step6.title',
        descKey: 'steps.step6.desc',
      },
      content: {
        type: 'repeatable',
        groups: [
          { name: 'children', titleKey: 'groups.children', addButtonKey: 'buttons.addChild' },
          { name: 'siblings', titleKey: 'groups.siblings', addButtonKey: 'buttons.addSibling' },
        ],
      },
    },
    {
      step: 6,
      header: {
        kickerKey: 'steps.step7.kicker',
        titleKey: 'steps.step7.title',
        descKey: 'steps.step7.desc',
      },
      content: {
        type: 'repeatableWithNotes',
        groups: [{ name: 'partners', titleKey: 'groups.partners', addButtonKey: 'buttons.addPartner' }],
        notesField: {
          kind: 'textarea',
          name: 'familyNotes',
          labelKey: 'fields.familyNotes',
          helpKey: 'help.familyNotes',
          placeholderKey: 'placeholders.familyNotes',
          placeholder: 'Anything else that would help the family understand this person’s place in the tree.',
          rows: 4,
          full: true,
        },
      },
    },
    {
      step: 7,
      header: {
        kickerKey: 'steps.step8.kicker',
        titleKey: 'steps.step8.title',
        descKey: 'steps.step8.desc',
      },
      content: { type: 'review' },
    },
  ] as StepDef[],
};

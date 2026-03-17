import React from 'react';
import { familyFormTiers, type BaseField, type StepDef } from '../familyFormTiers';

function Requirement({ required }: { required?: boolean }) {
  return (
    <em data-i18n={required ? 'common.required' : 'common.optional'}>
      {required ? 'Required' : 'Optional'}
    </em>
  );
}

function FieldControl({ field }: { field: BaseField }) {
  if (field.kind === 'textarea') {
    return (
      <textarea
        name={field.name}
        rows={field.rows ?? 4}
        data-i18n-placeholder={field.placeholderKey}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.kind === 'select') {
    return (
      <select
        id={field.id}
        name={field.name}
        data-custom-select={field.customSelect ? 'true' : undefined}
      >
        {field.options?.map((option) => (
          <option
            key={`${field.name}-${option.value || 'empty'}`}
            value={option.value}
            data-i18n-option={option.i18nOption}
          >
            {option.text}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      id={field.id}
      name={field.name}
      type={field.type ?? 'text'}
      required={field.required}
      data-step-required={field.dataStepRequired ? 'true' : undefined}
      data-i18n-placeholder={field.placeholderKey}
      placeholder={field.placeholder}
    />
  );
}

function FormField({ field }: { field: BaseField }) {
  const classNames = ['field'];
  if (field.full) classNames.push('field-full');
  if (field.className) classNames.push(field.className);

  return (
    <label className={classNames.join(' ')}>
      <span>
        <span data-i18n={field.labelKey}>{field.labelKey}</span>{' '}
        <Requirement required={field.required} />
      </span>
      {field.helpKey ? (
        <small className="field-help" data-i18n={field.helpKey}>
          {field.helpKey}
        </small>
      ) : null}
      <FieldControl field={field} />
    </label>
  );
}

function StepHeader({ step }: { step: StepDef }) {
  return (
    <div className="step-header">
      <p className="step-kicker" data-i18n={step.header.kickerKey}>
        {step.header.kickerKey}
      </p>
      <h2 data-i18n={step.header.titleKey}>{step.header.titleKey}</h2>
      <p data-i18n={step.header.descKey}>{step.header.descKey}</p>
    </div>
  );
}

function RepeatableGroupCard({ name, titleKey, addButtonKey }: { name: string; titleKey: string; addButtonKey: string }) {
  return (
    <div className="step-group-card">
      <div className="step-group-header">
        <h3 data-i18n={titleKey}>{titleKey}</h3>
        <button className="secondary-btn btn add-entry-btn" data-add-list={name} data-i18n={addButtonKey} type="button">
          {addButtonKey}
        </button>
      </div>
      <div className="repeatable-list" data-list={name}></div>
    </div>
  );
}

function StepContent({ step }: { step: StepDef }) {
  const { content } = step;

  if (content.type === 'photo') {
    return (
      <div className="step-block">
        <div className="photo-widget" data-photo-field={content.photoField}></div>
      </div>
    );
  }

  if (content.type === 'fields') {
    return (
      <div className={content.gridClassName ?? 'grid'}>
        {content.fields.map((field) => (
          <FormField key={`${step.step}-${field.name ?? field.id ?? field.labelKey}`} field={field} />
        ))}
      </div>
    );
  }

  if (content.type === 'repeatable') {
    return (
      <div className="stacked-step-groups">
        {content.groups.map((group) => (
          <RepeatableGroupCard key={group.name} {...group} />
        ))}
      </div>
    );
  }

  if (content.type === 'repeatableWithNotes') {
    return (
      <>
        <div className="stacked-step-groups">
          {content.groups.map((group) => (
            <RepeatableGroupCard key={group.name} {...group} />
          ))}
        </div>
        <div className="step-block top-space">
          <div className="grid">
            <FormField field={content.notesField} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="review-box">
        <p><strong data-i18n="review.name">Name:</strong> <span id="reviewName">—</span></p>
        <p><strong data-i18n="review.birthDate">Birth date:</strong> <span id="reviewBirthDate">—</span></p>
        <p><strong data-i18n="review.birthPlace">Birth place:</strong> <span id="reviewBirthPlace">—</span></p>
        <p><strong data-i18n="review.currentLocation">Current location:</strong> <span id="reviewCurrentLocation">—</span></p>
        <p><strong data-i18n="review.occupation">Occupation:</strong> <span id="reviewOccupation">—</span></p>
      </div>
      <div aria-live="polite" className="duplicate-preview hidden" id="duplicatePreview"></div>
      <p aria-live="polite" className="status-message" id="statusMessage"></p>
    </>
  );
}

function CropDialog() {
  return (
    <dialog className="crop-dialog" id="cropDialog">
      <div className="crop-dialog-inner">
        <div className="crop-header">
          <div>
            <h2 data-i18n="crop.title">Adjust photo</h2>
            <p data-i18n="crop.desc">Move the image so the face sits nicely in the preview.</p>
          </div>
          <button aria-label="Close photo editor" className="icon-btn" id="closeCropperBtn" type="button">✕</button>
        </div>
        <div className="crop-layout">
          <div className="crop-stage-wrap">
            <canvas height="320" id="cropCanvas" width="320"></canvas>
          </div>
          <div className="crop-controls">
            <label className="field">
              <span data-i18n="crop.zoom">Zoom</span>
              <input id="cropZoom" max="3" min="1" step="0.01" type="range" defaultValue="1" />
            </label>
            <label className="field">
              <span data-i18n="crop.horizontal">Move left and right</span>
              <input id="cropX" max="160" min="-160" step="1" type="range" defaultValue="0" />
            </label>
            <label className="field">
              <span data-i18n="crop.vertical">Move up and down</span>
              <input id="cropY" max="160" min="-160" step="1" type="range" defaultValue="0" />
            </label>
            <div className="crop-preview-block">
              <span data-i18n="crop.preview">Preview</span>
              <canvas height="200" id="cropPreview" width="200"></canvas>
            </div>
          </div>
        </div>
        <div className="crop-actions">
          <button className="secondary-btn btn" data-i18n="buttons.cancel" id="cancelCropBtn" type="button">Cancel</button>
          <button className="primary-btn btn" data-i18n="buttons.usePhoto" id="saveCropBtn" type="button">Use this photo</button>
        </div>
      </div>
    </dialog>
  );
}

export function FamilyFormRenderer() {
  return (
    <>
      <div className="page-shell">
        <header className="hero">
          <div className="hero-topbar">
            <p className="eyebrow">{familyFormTiers.hero.eyebrow}</p>
            <div aria-label="Language switcher" className="language-switcher">
              {familyFormTiers.hero.languages.map((language) => (
                <button
                  key={language.code}
                  className={`lang-btn${language.active ? ' is-active' : ''}`}
                  data-lang-choice={language.code}
                  type="button"
                >
                  {language.label}
                </button>
              ))}
            </div>
          </div>
          <h1 data-i18n="hero.title">Add a family member</h1>
          <p className="hero-copy" data-i18n="hero.copy">
            Every family tree becomes more meaningful with fuller stories, stronger links, and clearer history. Only your full name and birth date are required, but taking a little extra time to complete the rest of this form can help preserve relationships, memories, and details that may matter deeply to your family in the future.
          </p>
          <div className="hero-actions">
            <p className="save-target" id="familyContextText"></p>
            <p className="draft-hint" data-i18n="hero.autoSave" id="draftHintText">Your progress saves automatically on this device while you type.</p>
            <div className="access-message hidden" aria-live="polite" id="formAccessMessage"></div>
          </div>
        </header>

        <main>
          <form id="familyIntakeForm" noValidate>
            <datalist id="savedPeopleRelationshipOptions"></datalist>
            <section className="wizard-shell" id="familyFormWizardShell">
              <div className="wizard-progress" id="wizardProgress"></div>
              <div className="wizard-stage">
                {familyFormTiers.steps.map((step, index) => (
                  <section key={step.step} className={`step-panel${index === 0 ? ' is-active' : ''}`} data-step={step.step}>
                    <StepHeader step={step} />
                    <StepContent step={step} />
                  </section>
                ))}
              </div>
              <footer className="wizard-footer">
                <button className="secondary-btn btn" data-i18n="buttons.back" id="prevStepBtn" type="button">Back</button>
                <div className="wizard-footer-center">
                  <span className="wizard-step-count" id="wizardStepCount">Step 1 of 8</span>
                </div>
                <button className="primary-btn btn" data-i18n="buttons.next" id="nextStepBtn" type="button">Next</button>
                <button className="primary-btn btn hidden" data-i18n="buttons.submit" id="submitBtn" type="submit">Submit form</button>
              </footer>
            </section>
          </form>
        </main>
      </div>
      <CropDialog />
    </>
  );
}

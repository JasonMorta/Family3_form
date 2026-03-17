import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`

:root {
  --bg: #090b0f;
  --bg-2: #0f1218;
  --shell: linear-gradient(180deg, rgba(18, 21, 28, 0.68), rgba(11, 13, 18, 0.78));
  --panel: rgba(19, 22, 29, 0.66);
  --panel-2: rgba(24, 28, 36, 0.62);
  --panel-3: rgba(18, 22, 29, 0.8);
  --text: #f5f0dd;
  --text-soft: #e6dcc0;
  --muted: #b8af97;
  --muted-2: #968f7c;
  --line: rgba(230, 211, 152, 0.20);
  --line-2: rgba(255, 255, 255, 0.08);
  --accent: #d1b15c;
  --accent-strong: #e0c370;
  --accent-soft: rgba(209, 177, 92, 0.16);
  --danger: #d27a6c;
  --success: #8eb795;
  --shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  --blur: blur(22px);
  --radius-xs: 8px;
  --radius-sm: 10px;
  --radius-md: 12px;
  --radius-lg: 16px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  font-family: Inter, system-ui, sans-serif;
  background: #090b0f;
  color: var(--text);
}

body { min-height: 100vh; }

#root { min-height: 100vh; }

.page-shell {
  position: relative;
  z-index: 1;
  max-width: 1120px;
  margin: 0 auto;
  padding: 30px 18px 64px;
}

.hero,
.wizard-shell,
.crop-dialog {
  border: 1px solid var(--line);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  box-shadow: var(--shadow);
}

.hero {
  background:
    radial-gradient(circle at 78% 10%, rgba(209, 177, 92, 0.18), transparent 20%),
    linear-gradient(180deg, rgba(17, 20, 26, 0.88), rgba(10, 12, 16, 0.92));
  color: var(--text);
  padding: 30px;
  border-radius: var(--radius-lg);
  margin-bottom: 22px;
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01) 50%, transparent 80%);
  pointer-events: none;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: .12em;
  font-size: .8rem;
  color: var(--accent-strong);
  font-weight: 800;
}

.hero h1 {
  margin: 0 0 12px;
  font-size: clamp(2rem, 4vw, 3.1rem);
  line-height: 1.06;
  letter-spacing: -0.03em;
}

.hero-copy {
  margin: 0;
  max-width: 68ch;
  line-height: 1.7;
  color: var(--text-soft);
  font-size: 1.04rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 14px;
  align-items: center;
  margin-top: 22px;
}

.save-target,
.draft-hint {
  flex-basis: 100%;
  margin: 0;
  color: var(--muted);
}

.draft-hint { font-size: .95rem; }

.access-message {
  flex-basis: 100%;
  margin: 0;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-soft);
  line-height: 1.65;
}

.access-message[data-state='blocked'] {
  border-color: rgba(210, 122, 108, 0.45);
  background: rgba(210, 122, 108, 0.12);
  color: #f2d4cf;
}

.access-message[data-state='allowed'] {
  border-color: rgba(142, 183, 149, 0.4);
  background: rgba(142, 183, 149, 0.12);
  color: #d7efdb;
}

.access-message[data-state='info'] {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
}

.access-message[data-state='loading'] {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border-color: rgba(209, 177, 92, 0.34);
  background: rgba(209, 177, 92, 0.12);
  color: var(--text);
}

.access-message[data-state='loading']::before {
  content: '';
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.18);
  border-top-color: var(--accent-strong);
  animation: family3Spin 0.85s linear infinite;
  flex: 0 0 auto;
}


.save-later-btn,
.save-footer-btn { white-space: nowrap; }

.firebase-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(142, 183, 149, 0.36);
  background: rgba(142, 183, 149, 0.12) !important;
  color: #d7efdb !important;
  font-weight: 700;
}

.firebase-pill::before {
  content: '';
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #7fb889;
  box-shadow: 0 0 0 6px rgba(127, 184, 137, 0.12);
}

.wizard-shell {
  background: var(--shell);
  border-radius: var(--radius-lg);
  overflow: visible;
}

.wizard-shell:not(.hidden) {
  opacity: 0;
  filter: blur(18px);
  transform: translateY(18px) scale(0.985);
}

.wizard-shell.is-revealed {
  opacity: 1;
  filter: blur(0);
  transform: translateY(0) scale(1);
  transition: opacity 0.7s ease, filter 0.8s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.wizard-progress {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
  padding: 18px;
  border-bottom: 1px solid var(--line-2);
  background: rgba(255, 255, 255, 0.03);
}

.wizard-progress-btn {
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius-sm);
  padding: 10px 10px;
  cursor: pointer;
  font: inherit;
  color: var(--muted);
  transition: .2s ease;
  font-weight: 600;
}

.wizard-progress-btn:hover {
  background: rgba(255,255,255,0.06);
  color: var(--text-soft);
  border-color: rgba(209, 177, 92, 0.34);
}

.wizard-progress-btn.is-active {
  background: linear-gradient(180deg, rgba(209, 177, 92, 0.24), rgba(209, 177, 92, 0.16));
  color: var(--text);
  border-color: rgba(209, 177, 92, 0.5);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06), 0 6px 16px rgba(0,0,0,0.22);
}

.wizard-progress-btn.is-complete {
  border-color: rgba(209, 177, 92, 0.22);
  background: rgba(209, 177, 92, 0.07);
  color: var(--text-soft);
}

.wizard-stage { padding: 30px; }
.step-panel { display: none; }
.step-panel.is-active { display: block; }
.step-header { margin-bottom: 24px; }

.step-kicker {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: .12em;
  font-size: .78rem;
  color: var(--accent-strong);
  font-weight: 700;
}

.step-header h2 {
  margin: 0 0 8px;
  font-size: 1.9rem;
  letter-spacing: -0.02em;
}

.step-header p,
.photo-widget p,
.photo-meta,
.field-help,
.status-message,
.crop-header p {
  color: var(--muted);
  line-height: 1.65;
}

.step-header p { max-width: 72ch; margin: 0; }

.grid { display: grid; gap: 30px; }
.two-col { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.compact-grid { gap: 14px; }

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field span,
.crop-preview-block span {
  font-weight: 650;
  color: var(--text);
}

.field em {
  font-style: normal;
  color: var(--muted-2);
  font-weight: 500;
  font-size: .92rem;
}

.field input,
.field select,
.field textarea,
.secondary-btn,
.primary-btn,
.icon-btn,
.wizard-progress-btn {
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
  color: var(--text);
  font: inherit;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 13px 14px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
}

.field input::placeholder,
.field textarea::placeholder { color: #8d8678; }

.field textarea { resize: vertical; min-height: 104px; }

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: rgba(209, 177, 92, 0.55);
  box-shadow: 0 0 0 3px rgba(209, 177, 92, 0.12);
}

.field-full { grid-column: 1 / -1; }

.sub-card,
.entry-card,
.step-group-card,
.review-box,
.step-block,
.crop-stage-wrap,
.photo-widget {
  background: var(--panel-2);
  border: 1px solid var(--line-2);
  border-radius: var(--radius-md);
  padding: 18px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.split-cards,
.stacked-step-groups {
  display: grid;
  gap: 16px;
}

.split-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }

.step-group-header,
.entry-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.sub-card h3,
.step-group-card h3,
.entry-title { margin: 0; font-size: 1rem; }

.repeatable-list { display: grid; gap: 14px; }

.photo-widget {
  border-style: solid;
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));
  margin-top: 14px;
}

.photo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.photo-preview-shell {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}

.photo-preview {
  width: 92px;
  height: 92px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.03);
}

.secondary-btn,
.primary-btn,
.icon-btn,
.family3-body .btn {
  padding: 11px 16px;
  cursor: pointer;
  transition: background-color .2s ease, border-color .2s ease, transform .2s ease, color .2s ease, box-shadow .2s ease;
  font-weight: 650;
  border-radius: var(--radius-sm) !important;
}

.secondary-btn:hover,
.primary-btn:hover,
.icon-btn:hover,
.family3-body .btn:hover {
  transform: translateY(-1px);
}

.primary-btn,
.family3-body .btn-primary,
.save-later-btn,
.save-footer-btn,
.add-entry-btn,
#saveCropBtn {
  background: linear-gradient(180deg, rgba(209, 177, 92, 0.22), rgba(209, 177, 92, 0.14)) !important;
  border-color: rgba(209, 177, 92, 0.44) !important;
  color: var(--text) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
}

.primary-btn:hover,
.family3-body .btn-primary:hover,
.save-later-btn:hover,
.save-footer-btn:hover,
.add-entry-btn:hover,
#saveCropBtn:hover {
  background: linear-gradient(180deg, rgba(224, 195, 112, 0.28), rgba(209, 177, 92, 0.18)) !important;
  border-color: rgba(224, 195, 112, 0.58) !important;
  color: #fff8e7 !important;
  box-shadow: 0 10px 24px rgba(0,0,0,0.22);
}

.secondary-btn,
.family3-body .btn-outline-secondary,
.family3-body .btn-outline-primary {
  background: rgba(255,255,255,0.03) !important;
  border-color: var(--line) !important;
  color: var(--text-soft) !important;
}

.secondary-btn:hover,
.family3-body .btn-outline-secondary:hover,
.family3-body .btn-outline-primary:hover {
  background: rgba(255,255,255,0.07) !important;
  border-color: rgba(209, 177, 92, 0.3) !important;
  color: var(--text) !important;
}

.icon-btn,
.danger-btn,
.family3-body .btn-outline-danger {
  background: rgba(210, 122, 108, 0.08) !important;
  border-color: rgba(210, 122, 108, 0.32) !important;
  color: #f1c5be !important;
}

.icon-btn:hover,
.danger-btn:hover,
.family3-body .btn-outline-danger:hover {
  background: rgba(210, 122, 108, 0.16) !important;
  border-color: rgba(210, 122, 108, 0.48) !important;
  color: #ffe7e2 !important;
}

.primary-btn:disabled,
.secondary-btn:disabled,
.icon-btn:disabled,
.family3-body .btn:disabled {
  opacity: .45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.wizard-footer {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 20px 30px 28px;
  border-top: 1px solid var(--line-2);
  background: rgba(255,255,255,0.02);
}

.wizard-footer-center { text-align: center; }

.wizard-step-count {
  color: var(--muted);
  font-weight: 600;
}

.status-message { margin: 0; min-height: 24px; }
.status-message.is-error { color: #f0aba0; }
.status-message.is-success { color: #bfe3c4; }

.duplicate-preview {
  width: 100%;
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(209, 177, 92, 0.32);
  background: rgba(209, 177, 92, 0.08);
  color: #eddcb4;
  line-height: 1.6;
}

@keyframes family3Spin {
  to { transform: rotate(360deg); }
}

.hidden { display: none !important; }

.crop-dialog {
  border-radius: var(--radius-lg);
  padding: 0;
  max-width: 920px;
  width: calc(100% - 28px);
  background: linear-gradient(180deg, rgba(18, 21, 28, 0.96), rgba(10, 12, 16, 0.98));
  color: var(--text);
}

.crop-dialog::backdrop { background: rgba(4, 6, 10, .72); }
.crop-dialog-inner { padding: 22px; }

.crop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.crop-header h2 { margin: 0 0 6px; }

.crop-layout {
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 18px;
  align-items: start;
}

.crop-stage-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
}

#cropCanvas, #cropPreview {
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  max-width: 100%;
}

.crop-controls { display: grid; gap: 14px; }
.crop-preview-block { display: grid; gap: 8px; }
.crop-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 18px; }

.review-box p { color: var(--text-soft); }
.review-box strong { color: var(--text); }
.top-space { margin-top: 16px; }
.field-help { display:block; margin-top: -2px; font-size: .92rem; }
.entry-card-header .btn, .step-group-header .btn { min-width: 118px; }

@media (max-width: 980px) {
  .wizard-progress { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 920px) {
  .two-col,
  .split-cards,
  .crop-layout { grid-template-columns: 1fr; }

  .wizard-footer { grid-template-columns: 1fr 1fr; }
  .wizard-footer-center { grid-column: 1 / -1; order: -1; }
}

@media (max-width: 640px) {
  .page-shell { padding-inline: 12px; }
  .hero { padding: 22px; }
  .wizard-stage { padding: 20px; }
  .wizard-footer { padding: 18px 20px 22px; }
  .wizard-progress { grid-template-columns: repeat(2, 1fr); }
}

.hero-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.language-switcher {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(14px);
}

.lang-btn {
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted);
  padding: 8px 12px;
  border-radius: 8px;
  font: inherit;
  font-weight: 700;
}

.lang-btn.is-active {
  color: var(--text);
  background: linear-gradient(180deg, rgba(209, 177, 92, 0.20), rgba(209, 177, 92, 0.10));
  border-color: rgba(209, 177, 92, 0.35);
}

.is-hidden-native-select {
  position: absolute !important;
  left: -9999px !important;
  width: 1px !important;
  height: 1px !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

.field { position: relative; }

.custom-select {
  position: relative;
}

.custom-select-trigger {
  width: 100%;
  padding: 13px 14px;
  text-align: left;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
  color: var(--text);
  font: inherit;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
  position: relative;
}

.custom-select-trigger::after {
  content: '▾';
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-soft);
  font-size: .95rem;
}

.custom-select.is-open .custom-select-trigger,
.custom-select-trigger:focus {
  outline: none;
  border-color: rgba(209, 177, 92, 0.55);
  box-shadow: 0 0 0 3px rgba(209, 177, 92, 0.12);
}

.custom-select-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 30;
  display: grid;
  gap: 6px;
  padding: 8px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(209, 177, 92, 0.22);
  background: linear-gradient(180deg, rgba(20,24,31,0.96), rgba(13,16,22,0.98));
  box-shadow: 0 18px 40px rgba(0,0,0,0.38);
  backdrop-filter: blur(18px);
}

.custom-select-option {
  width: 100%;
  text-align: left;
  padding: 11px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-soft);
  font: inherit;
}

.custom-select-option:hover,
.custom-select-option.is-selected {
  background: rgba(209, 177, 92, 0.12);
  border-color: rgba(209, 177, 92, 0.26);
  color: var(--text);
}

.firebase-pill {
  border-radius: var(--radius-sm) !important;
}

.primary-btn,
.family3-body .btn-primary,
.add-entry-btn,
#saveCropBtn,
#submitBtn,
#nextStepBtn {
  background: linear-gradient(180deg, rgba(209, 177, 92, 0.22), rgba(209, 177, 92, 0.14)) !important;
  border-color: rgba(209, 177, 92, 0.44) !important;
}

.secondary-btn,
.family3-body .btn-outline-secondary,
.family3-body .btn-outline-primary,
#prevStepBtn,
#cancelCropBtn {
  background: rgba(255,255,255,0.03) !important;
  border-color: var(--line) !important;
}

.danger-btn,
.family3-body .btn-outline-danger,
.entry-remove-btn {
  background: rgba(210, 122, 108, 0.08) !important;
  border-color: rgba(210, 122, 108, 0.32) !important;
}

.entry-grid {
  align-items: start;
}

.entry-card-header .btn, .step-group-header .btn {
  min-width: 132px;
}

@media (max-width: 640px) {
  .hero-topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .field input[type="date"] {
  min-width: 300px;
  width: fit-content;
}

  .language-switcher {
    width: 100%;
  }

  .lang-btn {
    flex: 1 1 50%;
  }
}


/* Minimal utility replacements for removed Bootstrap classes */
.family3-body {
  margin: 0;
  min-height: 100vh;
}
.btn {
  appearance: none;
  border: none;
  background: none;
  font: inherit;
  cursor: pointer;
}
.hidden {
  display: none !important;
}
.d-flex { display: flex; }
.flex-wrap { flex-wrap: wrap; }
.align-items-center { align-items: center; }
.gap-3 { gap: 1rem; }
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
}
.px-3 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.fs-6 { font-size: 1rem; }

`;
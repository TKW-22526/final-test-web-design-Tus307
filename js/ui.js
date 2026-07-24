import { qs, qsa, copyToClipboard } from './utils.js';

const TOAST_DURATION_MS = 3200;

let toastContainer = null;
let stylesInjected = false;

const TAB_CONFIG = [
  { radio: 'tab-visualization', panel: 'panel-visualization' },
  { radio: 'tab-logger', panel: 'panel-logger' },
  { radio: 'tab-result', panel: 'panel-result' },
  { radio: 'tab-explanation', panel: 'panel-explanation' },
];

function injectDynamicStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.setAttribute('data-source', 'ui.js');
  style.textContent = `
    .ui-toast-container{
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .ui-toast{
      pointer-events: auto;
      min-width: 220px;
      max-width: 340px;
      padding: 12px 16px;
      border-radius: var(--radius-md, 10px);
      font-family: var(--font-display, sans-serif);
      font-size: 13px;
      color: var(--text-primary, #e7e9ee);
      background: linear-gradient(180deg, var(--surface-strong, rgba(255,255,255,0.06)), rgba(255,255,255,0.02));
      border: 1px solid var(--border-glass, rgba(255,255,255,0.09));
      backdrop-filter: blur(var(--blur-glass, 20px)) saturate(140%);
      -webkit-backdrop-filter: blur(var(--blur-glass, 20px)) saturate(140%);
      box-shadow: 0 12px 30px rgba(0,0,0,0.35);
      opacity: 0;
      transform: translateY(8px);
      transition: opacity .22s var(--ease, ease), transform .22s var(--ease, ease);
    }
    .ui-toast.is-visible{ opacity: 1; transform: translateY(0); }
    .ui-toast.is-leaving{ opacity: 0; transform: translateY(8px); }
    .ui-toast--success{ border-color: rgba(110,231,183,0.4); }
    .ui-toast--error{ border-color: rgba(248,113,113,0.45); }
    .ui-toast--info{ border-color: var(--border-glass-strong, rgba(255,255,255,0.16)); }

    .ui-fade-in{ animation: uiFadeIn .25s var(--ease, ease); }
    @keyframes uiFadeIn{
      from{ opacity: 0; transform: translateY(4px); }
      to{ opacity: 1; transform: translateY(0); }
    }
    .ui-pulse{ animation: uiPulse .4s var(--ease, ease); }
    @keyframes uiPulse{
      0%{ transform: scale(1); }
      40%{ transform: scale(1.03); }
      100%{ transform: scale(1); }
    }
    @media (prefers-reduced-motion: reduce){
      .ui-toast, .ui-fade-in, .ui-pulse{ transition: none; animation: none; }
    }
  `;
  document.head.appendChild(style);
}

function getToastContainer() {
  injectDynamicStyles();
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'ui-toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function replayAnimation(element, className) {
  if (!element) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

export function getDomRefs() {
  return {
    algorithmSelect: qs('#algorithm-select'),
    modeEncrypt: qs('#mode-encrypt'),
    modeDecrypt: qs('#mode-decrypt'),
    modeDecryptLabel: qs('label[for="mode-decrypt"]'),

    inputPrimary: qs('#input-primary'),
    inputSecondaryWrap: qs('#input-secondary-wrap'),
    inputSecondary: qs('#input-secondary'),
    inputSecondaryHint: qs('#input-secondary-hint'),

    btnPrev: qs('#btn-prev'),
    btnNext: qs('#btn-next'),
    btnReset: qs('#btn-reset'),

    progressLabel: qs('#progress-label'),
    progressCount: qs('#progress-count'),
    progressBar: qs('#progress-bar'),
    progressFill: qs('#progress-fill'),

    tabRadios: qsa('input[name="tabs"]'),

    visualizationCanvas: qs('#visualization-canvas'),
    visualizationAlgoTag: qs('#visualization-algo-tag'),

    loggerOutput: qs('#logger-output'),
    btnDownloadLog: qs('#btn-download-log'),

    resultOutput: qs('#result-output'),
    btnCopyResult: qs('#btn-copy-result'),

    explanationContent: qs('#explanation-content'),
  };
}

export function initTabs(refs, onChange) {
  injectDynamicStyles();

  function syncActiveTab() {
    TAB_CONFIG.forEach(({ radio, panel }) => {
      const radioEl = qs(`#${radio}`);
      const panelEl = qs(`#${panel}`);
      if (!radioEl || !panelEl) return;

      const isActive = radioEl.checked;
      radioEl.setAttribute('aria-selected', String(isActive));
      radioEl.setAttribute('tabindex', isActive ? '0' : '-1');
      panelEl.setAttribute('aria-hidden', String(!isActive));
      panelEl.style.display = isActive ? 'block' : 'none';

      if (isActive) {
        replayAnimation(panelEl, 'ui-fade-in');
      }
    });
  }

  TAB_CONFIG.forEach(({ radio, panel }) => {
    const radioEl = qs(`#${radio}`);
    const panelEl = qs(`#${panel}`);
    if (!radioEl || !panelEl) return;

    radioEl.setAttribute('role', 'tab');
    radioEl.setAttribute('aria-controls', panel);
    panelEl.setAttribute('role', 'tabpanel');
    panelEl.setAttribute('aria-labelledby', radio);

    radioEl.addEventListener('change', () => {
      if (!radioEl.checked) return;
      syncActiveTab();
      if (onChange) onChange(radio);
    });
  });

  syncActiveTab();
}

export function updateProgress(refs, currentStep, totalSteps) {
  const percent = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
  refs.progressFill.style.width = `${percent}%`;
  refs.progressBar.setAttribute('aria-valuenow', String(percent));
  refs.progressCount.textContent = `Bước ${currentStep} / ${totalSteps}`;
}

export function toggleSecondaryInput(refs, isVisible, hintText, exactLength) {
  const wasHidden = refs.inputSecondaryWrap.classList.contains('is-hidden');
  refs.inputSecondaryWrap.classList.toggle('is-hidden', !isVisible);
  if (hintText) {
    refs.inputSecondaryHint.textContent = hintText;
  }
  if (Number.isInteger(exactLength) && exactLength > 0) {
    refs.inputSecondary.maxLength = exactLength;
  } else {
    refs.inputSecondary.removeAttribute('maxlength');
  }
  if (isVisible && wasHidden) {
    replayAnimation(refs.inputSecondaryWrap, 'ui-fade-in');
  }
}

export function toggleDecryptMode(refs, isDecodable) {
  refs.modeDecrypt.classList.toggle('is-hidden', !isDecodable);
  if (refs.modeDecryptLabel) {
    refs.modeDecryptLabel.classList.toggle('is-hidden', !isDecodable);
  }

  if (!isDecodable && refs.modeDecrypt.checked) {
    refs.modeEncrypt.checked = true;
    return true;
  }
  return false;
}

export function setAlgorithmTag(refs, label) {
  refs.visualizationAlgoTag.textContent = label;
}

export function setExplanation(refs, text) {
  refs.explanationContent.textContent = text;
  replayAnimation(refs.explanationContent, 'ui-fade-in');
}

export function setResult(refs, text) {
  refs.resultOutput.textContent = text;
  replayAnimation(refs.resultOutput, 'ui-pulse');
}

export async function copyResultToClipboard(refs) {
  return copyToClipboard(refs.resultOutput.textContent.trim());
}

export function showToast(message, type = 'info') {
  const container = getToastContainer();

  const toast = document.createElement('div');
  toast.className = `ui-toast ui-toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    toast.classList.remove('is-visible');
    toast.classList.add('is-leaving');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  setTimeout(dismiss, TOAST_DURATION_MS);
  return { dismiss };
}
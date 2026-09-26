'use strict';

const resumeContent = document.getElementById('resumeContent');
const resumeStatus = document.getElementById('resumeStatus');
const langEnBtn = document.getElementById('langEnBtn');
const langSvBtn = document.getElementById('langSvBtn');
const query = new URLSearchParams(location.search);
const storedLang = storageGet('resumeLang');
const variantCache = new Map();
let variantRequest = 0;
let currentPanel = ['profile', 'work', 'skills', 'education', 'projects'].includes(query.get('panel')) ? query.get('panel') : 'profile';
window.__resumeLang = ['en', 'sv'].includes(query.get('lang')) ? query.get('lang') : (storedLang === 'sv' ? 'sv' : 'en');

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
function t(object, field) {
  return window.__resumeLang === 'sv' && object?.[`${field}_sv`] ? object[`${field}_sv`] : (object?.[field] || '');
}
function tArr(object, field) {
  const fieldName = window.__resumeLang === 'sv' && Array.isArray(object?.[`${field}_sv`]) ? `${field}_sv` : field;
  return Array.isArray(object?.[fieldName]) ? object[fieldName] : [];
}
function labels() {
  return window.__resumeLang === 'sv'
    ? { profile: 'Profil', work: 'Erfarenhet', skills: 'Kompetenser', education: 'Utbildning', projects: 'Utvalda projekt', coreStack: 'Kärnkompetens', languages: 'Språk', platforms: 'Plattformar', focus: 'Fokus', contact: 'Kontakt', sections: 'CV-avsnitt', empty: 'Inga utvalda projekt i denna CV-inriktning.' }
    : { profile: 'Profile', work: 'Experience', skills: 'Skills', education: 'Education', projects: 'Selected projects', coreStack: 'Core stack', languages: 'Languages', platforms: 'Platforms', focus: 'Focus', contact: 'Contact', sections: 'Resume sections', empty: 'No selected projects in this CV focus.' };
}
function syncResumeUrl(replace = false) {
  const next = new URL(location.href);
  next.searchParams.set('lang', window.__resumeLang);
  if (window.__currentVariantId) next.searchParams.set('focus', window.__currentVariantId);
  if (currentPanel === 'profile') next.searchParams.delete('panel');
  else next.searchParams.set('panel', currentPanel);
  if (next.href !== location.href) history[replace ? 'replaceState' : 'pushState'](null, '', `${next.pathname}${next.search}${next.hash}`);
}
function setStatus(message, state = 'info') {
  resumeStatus.textContent = message;
  resumeStatus.dataset.state = state;
}
function variantStatus(variant) {
  return variant ? t(variant, 'description') : '';
}
function updateDocumentTitle() {
  const title = window.__currentVariantMeta?.title;
  document.title = `${title ? `${title} · ` : ''}${window.__resumeLang === 'sv' ? 'CV' : 'Resume'} — Joakim Moléni`;
}
function setResumeLang(lang, updateUrl = true) {
  window.__resumeLang = lang === 'sv' ? 'sv' : 'en';
  storageSet('resumeLang', window.__resumeLang);
  document.body.dataset.resumeLang = window.__resumeLang;
  document.documentElement.lang = window.__resumeLang;
  const english = window.__resumeLang === 'en';
  langEnBtn.classList.toggle('active', english);
  langSvBtn.classList.toggle('active', !english);
  langEnBtn.setAttribute('aria-pressed', String(english));
  langSvBtn.setAttribute('aria-pressed', String(!english));
  translateResumeShell(window.__resumeLang);
  document.querySelectorAll('#variantList .tab-btn').forEach(button => {
    const variant = window.__resumeVariants?.find(item => item.id === button.dataset.variant);
    if (variant) button.title = t(variant, 'description');
  });
  document.getElementById('commandFeedback').textContent = '';
  if (window.__currentResumeData) {
    renderResume(window.__currentResumeData, window.__currentVariantMeta?.mode);
    setStatus(variantStatus(window.__currentVariantMeta), 'ready');
  }
  updateDocumentTitle();
  if (updateUrl) syncResumeUrl();
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}
function normalizeVariants(variants) {
  return variants.map((variant, index) => ({
    id: variant.id || `variant-${index + 1}`,
    title: variant.title || variant.id,
    description: variant.description || '',
    description_sv: variant.description_sv || variant.description || '',
    path: variant.path || `./assets/data/variants/${variant.id}.json`,
    mode: variant.template || variant.id
  }));
}
function initVariants(variants) {
  const list = document.getElementById('variantList');
  list.replaceChildren();
  variants.forEach((variant, index) => {
    const button = document.createElement('button');
    button.className = 'tab-btn';
    button.type = 'button';
    button.id = `tab-${variant.id}`;
    button.dataset.variant = variant.id;
    button.dataset.number = String(index + 1);
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'resumeContent');
    button.setAttribute('aria-selected', 'false');
    button.setAttribute('tabindex', index === 0 ? '0' : '-1');
    button.title = t(variant, 'description');
    button.textContent = variant.title;
    button.addEventListener('click', () => selectVariant(variant.id));
    button.addEventListener('keydown', event => {
      const target = tabTarget(event, index, variants.length);
      if (target === null) return;
      list.children[target].focus();
      selectVariant(variants[target].id);
    });
    list.appendChild(button);
  });
  resumeContent.setAttribute('role', 'tabpanel');
}
function tabTarget(event, index, length) {
  if (event.altKey || event.ctrlKey || event.metaKey) return null;
  const targets = { ArrowRight: (index + 1) % length, ArrowLeft: (index + length - 1) % length, Home: 0, End: length - 1 };
  if (!(event.key in targets)) return null;
  event.preventDefault();
  return targets[event.key];
}
function mergeResumeData(baseData, overrideData) {
  return { ...baseData, ...overrideData, personal: { ...baseData.personal, ...overrideData.personal }, skills: { ...baseData.skills, ...overrideData.skills }, variants: baseData.variants || [] };
}
function selectPanel(panel, updateUrl = true) {
  if (!document.getElementById(`resume-${panel}`)) return false;
  currentPanel = panel;
  document.querySelectorAll('.resume-panel').forEach(section => { section.hidden = section.dataset.panel !== panel; });
  document.querySelectorAll('.section-tab').forEach(button => {
    const selected = button.dataset.panel === panel;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  if (updateUrl) syncResumeUrl();
  return true;
}
async function selectVariant(variantId, updateUrl = true) {
  const variant = window.__resumeVariants?.find(item => item.id === variantId);
  if (!variant) return;
  const request = ++variantRequest;
  resumeContent.setAttribute('aria-busy', 'true');
  setStatus(window.__resumeLang === 'sv' ? `Laddar ${variant.title}…` : `Loading ${variant.title}…`, 'loading');
  let merged;
  let failed = false;
  try {
    let data = variantCache.get(variant.id);
    if (!data) {
      data = await fetchJson(variant.path);
      variantCache.set(variant.id, data);
    }
    merged = mergeResumeData(window.__baseResumeData || {}, data);
  } catch (error) {
    console.error(`Could not load resume variant ${variant.id}.`, error);
    failed = true;
    merged = window.__baseResumeData || {};
  }
  if (request !== variantRequest) return;
  window.__currentResumeData = merged;
  window.__currentVariantId = variant.id;
  window.__currentVariantMeta = variant;
  document.body.dataset.resumeVariant = variant.id;
  document.querySelectorAll('#variantList .tab-btn').forEach(button => {
    const selected = button.dataset.variant === variant.id;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  resumeContent.setAttribute('aria-labelledby', `tab-${variant.id}`);
  renderResume(merged, variant.mode);
  resumeContent.setAttribute('aria-busy', 'false');
  setStatus(failed
    ? (window.__resumeLang === 'sv' ? 'Variantfilen kunde inte laddas. Grund-CV visas.' : 'Variant file could not be loaded. Showing the base resume.')
    : variantStatus(variant), failed ? 'error' : 'ready');
  storageSet('resumeVariant', variant.id);
  updateDocumentTitle();
  if (updateUrl) syncResumeUrl();
}

function renderListSection(label, values) {
  if (!values.length) return '';
  return `<section><h3 class="resume-section-title">${escapeHtml(label)}</h3><ul class="skill-list">${values.map(value => `<li class="skill-item"><span class="skill-bullet" aria-hidden="true">›</span>${escapeHtml(value)}</li>`).join('')}</ul></section>`;
}
function renderResume(data, variantId = 'default') {
  const { personal = {}, experience = [], skills = {}, education = [], projects = [] } = data || {};
  const l = labels();
  const swedish = window.__resumeLang === 'sv';
  const chipLabel = /modern/i.test(variantId) ? (swedish ? 'Backendprofil' : 'Backend profile')
    : /platform/i.test(variantId) ? (swedish ? 'Plattform & ledarskap' : 'Platform & leadership')
      : (swedish ? 'Kärnsystemsprofil' : 'Core systems profile');
  const contacts = [];
  if (t(personal, 'location')) contacts.push(`<div class="contact-item contact-location">${escapeHtml(t(personal, 'location'))}</div>`);
  if (personal.email) contacts.push(`<div class="contact-item"><a href="mailto:${escapeHtml(personal.email)}">${escapeHtml(personal.email)}</a></div>`);
  if (personal.github) contacts.push(`<div class="contact-item"><a href="https://${escapeHtml(personal.github)}" target="_blank" rel="noopener noreferrer">${escapeHtml(personal.github)}</a></div>`);
  if (personal.linkedin) contacts.push(`<div class="contact-item"><a href="https://${escapeHtml(personal.linkedin)}" target="_blank" rel="noopener noreferrer">${escapeHtml(personal.linkedin)}</a></div>`);
  const experienceHtml = experience.map((job, index) => `
    <article class="job">
      <span class="job-number no-print" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      <div class="job-header"><h3 class="job-company">${escapeHtml(t(job, 'company'))}</h3><span class="job-years">${escapeHtml(t(job, 'years'))}</span></div>
      <p class="job-position">${escapeHtml(t(job, 'role'))}</p>
      <ul class="job-highlights">${tArr(job, 'highlights').map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    </article>`).join('');
  const educationHtml = education.map(item => `<div class="education-item"><h3 class="education-school">${escapeHtml(item.school)}${t(item, 'degree') ? ` — ${escapeHtml(t(item, 'degree'))}` : ''}</h3><p class="education-years">${escapeHtml(t(item, 'years'))}</p></div>`).join('');
  const projectsHtml = projects.map(project => `<article class="resume-project-item"><h3 class="resume-project-name">${escapeHtml(t(project, 'name'))}</h3><p class="resume-project-description">${escapeHtml(t(project, 'description'))}</p>${project.tech?.length ? `<p class="resume-project-tech">${project.tech.map(escapeHtml).join(' · ')}</p>` : ''}</article>`).join('');
  const panels = [
    { id: 'profile', content: `<p class="profile-text">${escapeHtml(t(data, 'profile'))}</p><div class="resume-summary">${renderListSection(l.coreStack, tArr(data, 'coreStack'))}</div>` },
    { id: 'work', content: experienceHtml },
    { id: 'skills', content: `<div class="resume-skills-grid">${renderListSection(l.languages, tArr(skills, 'languages'))}${renderListSection(l.platforms, tArr(skills, 'platforms'))}${renderListSection(l.focus, tArr(skills, 'concepts'))}</div>` },
    { id: 'education', content: educationHtml },
    { id: 'projects', content: projectsHtml || `<p>${l.empty}</p>`, empty: !projects.length }
  ];
  resumeContent.innerHTML = `
    <header class="resume-head">
      <div><p class="resume-chip">${escapeHtml(chipLabel)}</p><h1 class="resume-name">${escapeHtml(personal.name)}</h1><p class="resume-title">${escapeHtml(t(personal, 'title'))}</p></div>
      <div class="resume-head__contact" aria-label="${l.contact}">${contacts.join('')}</div>
    </header>
    <div class="resume-section-tabs no-print" role="tablist" aria-label="${l.sections}">${panels.map(panel => `<button class="section-tab" id="section-tab-${panel.id}" type="button" role="tab" data-panel="${panel.id}" aria-selected="false" aria-controls="resume-${panel.id}" tabindex="-1">${l[panel.id]}</button>`).join('')}</div>
    ${panels.map((panel, index) => `<section class="resume-panel" id="resume-${panel.id}" data-panel="${panel.id}" data-empty="${Boolean(panel.empty)}" role="tabpanel" aria-labelledby="section-tab-${panel.id}" tabindex="0" hidden><div class="panel-heading"><h2 class="resume-section-title">${l[panel.id]}</h2><span class="panel-code no-print" aria-hidden="true">JM0${index + 1}</span></div>${panel.content}</section>`).join('')}`;
  const buttons = [...resumeContent.querySelectorAll('.section-tab')];
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => selectPanel(button.dataset.panel));
    button.addEventListener('keydown', event => {
      const target = tabTarget(event, index, buttons.length);
      if (target === null) return;
      buttons[target].focus();
      selectPanel(buttons[target].dataset.panel);
    });
  });
  selectPanel(currentPanel, false);
}

function showHelp() {
  const help = document.getElementById('resumeHelp');
  help.hidden = !help.hidden;
  document.querySelectorAll('[data-resume-command="help"]').forEach(button => button.setAttribute('aria-expanded', String(!help.hidden)));
}
async function runCommand(raw) {
  const command = raw.trim().toLowerCase();
  const feedback = document.getElementById('commandFeedback');
  feedback.textContent = '';
  if (!command) return;
  if (command === 'help' || command === '?') { showHelp(); return; }
  if (command === 'print' || command === 'pdf') { window.print(); return; }
  if (command === 'home' || command === 'exit') { location.href = './index.html'; return; }
  if (command === 'en' || command === 'sv') { setResumeLang(command); return; }
  if (/^[123]$/.test(command)) {
    const variant = window.__resumeVariants?.[Number(command) - 1];
    if (variant) { await selectVariant(variant.id); return; }
  }
  const aliases = { profil: 'profile', experience: 'work', erfarenhet: 'work', kompetenser: 'skills', utbildning: 'education', projekt: 'projects' };
  if (selectPanel(aliases[command] || command)) return;
  feedback.textContent = window.__resumeLang === 'sv' ? `Okänt kommando: ${raw}. Skriv help för att se valen.` : `Unknown command: ${raw}. Type help to see the options.`;
}

async function loadResume() {
  try {
    setStatus(window.__resumeLang === 'sv' ? 'Laddar CV…' : 'Loading resume…', 'loading');
    const base = await fetchJson('./assets/data/resume-data.json');
    window.__baseResumeData = base;
    window.__resumeVariants = normalizeVariants(base.variants || []);
    if (window.__resumeVariants.length) {
      initVariants(window.__resumeVariants);
      const requested = new URLSearchParams(location.search).get('focus') || storageGet('resumeVariant');
      const selected = window.__resumeVariants.find(variant => variant.id === requested) || window.__resumeVariants[0];
      await selectVariant(selected.id, false);
    } else {
      window.__currentResumeData = base;
      renderResume(base);
      setStatus(window.__resumeLang === 'sv' ? 'Grund-CV visas.' : 'Showing base resume.', 'ready');
    }
    syncResumeUrl(true);
  } catch (error) {
    console.error('Could not load resume data.', error);
    setStatus(window.__resumeLang === 'sv' ? 'CV-data kunde inte laddas. Den sparade engelska kärnsystemsversionen visas.' : 'Resume data could not be loaded. Showing the saved English Core Systems CV.', 'error');
  }
}

setResumeLang(window.__resumeLang, false);
document.querySelectorAll('[data-requires-js]').forEach(element => { element.hidden = false; });
langEnBtn.addEventListener('click', () => setResumeLang('en'));
langSvBtn.addEventListener('click', () => setResumeLang('sv'));
document.getElementById('btnExportPdf').addEventListener('click', () => window.print());
document.querySelectorAll('[data-resume-command]').forEach(button => button.addEventListener('click', () => runCommand(button.dataset.resumeCommand)));
document.getElementById('resumeCommandForm').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.getElementById('resumeCommand');
  runCommand(input.value);
  input.value = '';
});
document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || document.querySelector('dialog[open]')) return;
  if (event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
  if (event.key === 'F1') { event.preventDefault(); showHelp(); }
  if (event.key === 'F3') { event.preventDefault(); location.href = './index.html'; }
});
window.addEventListener('popstate', () => {
  const currentQuery = new URLSearchParams(location.search);
  currentPanel = ['profile', 'work', 'skills', 'education', 'projects'].includes(currentQuery.get('panel')) ? currentQuery.get('panel') : 'profile';
  setResumeLang(currentQuery.get('lang') === 'sv' ? 'sv' : 'en', false);
  const variants = window.__resumeVariants || [];
  const selected = variants.find(variant => variant.id === currentQuery.get('focus')) || variants[0];
  if (selected) selectVariant(selected.id, false);
});
loadResume();

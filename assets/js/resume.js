'use strict';

const resumeContent = document.getElementById('resumeContent');
const resumeStatus = document.getElementById('resumeStatus');
const langEnBtn = document.getElementById('langEnBtn');
const langSvBtn = document.getElementById('langSvBtn');
const exportButton = document.getElementById('btnExportPdf');

const query = new URLSearchParams(location.search);
const requestedLang = query.get('lang');
window.__resumeLang = ['en', 'sv'].includes(requestedLang) ? requestedLang : (storageGet('resumeLang') || 'en');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function updateQuery(key, value) {
  if (!history.replaceState) return;
  const next = new URL(location.href);
  if (value) next.searchParams.set(key, value);
  else next.searchParams.delete(key);
  history.replaceState(null, '', `${next.pathname}${next.search}${next.hash}`);
}

function t(object, field) {
  if (!object) return '';
  const localized = `${field}_sv`;
  if (window.__resumeLang === 'sv' && object[localized]) return object[localized];
  return object[field] || '';
}

function tArr(object, field) {
  if (!object) return [];
  const localized = `${field}_sv`;
  if (window.__resumeLang === 'sv' && Array.isArray(object[localized])) return object[localized];
  return Array.isArray(object[field]) ? object[field] : [];
}

function setStatus(message, state = 'info') {
  if (!resumeStatus) return;
  resumeStatus.textContent = message;
  resumeStatus.dataset.state = state;
}

function variantStatus(variant) {
  if (!variant) return '';
  const description = t(variant, 'description');
  return window.__resumeLang === 'sv'
    ? `${variant.title} — ${description}`
    : `${variant.title} — ${description}`;
}

function setResumeLang(lang, updateUrl = true) {
  const safeLang = lang === 'sv' ? 'sv' : 'en';
  window.__resumeLang = safeLang;
  storageSet('resumeLang', safeLang);
  document.body.dataset.resumeLang = safeLang;
  document.documentElement.lang = safeLang;

  const isEnglish = safeLang === 'en';
  langEnBtn?.classList.toggle('active', isEnglish);
  langSvBtn?.classList.toggle('active', !isEnglish);
  langEnBtn?.setAttribute('aria-pressed', String(isEnglish));
  langSvBtn?.setAttribute('aria-pressed', String(!isEnglish));
  if (updateUrl) updateQuery('lang', safeLang === 'sv' ? 'sv' : '');

  if (window.__currentResumeData) {
    renderResume(window.__currentResumeData, window.__currentVariantId || 'default');
    setStatus(variantStatus(window.__currentVariantMeta), 'ready');
  }
}

setResumeLang(window.__resumeLang, false);
langEnBtn?.addEventListener('click', () => setResumeLang('en'));
langSvBtn?.addEventListener('click', () => setResumeLang('sv'));
exportButton?.addEventListener('click', () => window.print());

/* Hide the controls while reading on small screens; reveal them on upward scroll. */

(() => {
  const topbar = document.querySelector('.resume-topbar');
  if (!topbar) return;
  let lastY = 0;
  let scheduled = false;

  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      topbar.classList.toggle('topbar-hidden', window.innerWidth <= 900 && y > lastY && y > 80);
      lastY = y;
      scheduled = false;
    });
  }, { passive: true });
})();

async function fetchJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}

function normalizeVariants(variants) {
  return variants.map((variant, index) => {
    const id = variant.id || `variant-${index + 1}`;
    return {
      id,
      title: variant.title || id,
      description: variant.description || '',
      description_sv: variant.description_sv || variant.description || '',
      path: variant.path || `./assets/data/variants/${id}.json`,
      mode: variant.template || id
    };
  });
}

function initVariants(variants) {
  const list = document.getElementById('variantList');
  if (!list) return;
  list.replaceChildren();

  variants.forEach((variant, index) => {
    const button = document.createElement('button');
    button.className = 'tab-btn';
    button.type = 'button';
    button.id = `tab-${variant.id}`;
    button.dataset.variant = variant.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', 'resumeContent');
    button.setAttribute('aria-selected', 'false');
    button.setAttribute('tabindex', index === 0 ? '0' : '-1');
    button.title = variant.description;
    button.textContent = variant.title;
    button.addEventListener('click', () => selectVariant(variant.id));
    button.addEventListener('keydown', event => handleTabKeydown(event, index, variants));
    list.appendChild(button);
  });

  resumeContent?.setAttribute('role', 'tabpanel');
}

function handleTabKeydown(event, index, variants) {
  const keyMap = {
    ArrowRight: Math.min(index + 1, variants.length - 1),
    ArrowLeft: Math.max(index - 1, 0),
    Home: 0,
    End: variants.length - 1
  };
  if (!(event.key in keyMap)) return;
  event.preventDefault();
  const target = keyMap[event.key];
  document.getElementById(`tab-${variants[target].id}`)?.focus();
  selectVariant(variants[target].id);
}

function mergeResumeData(baseData, overrideData) {
  return {
    ...baseData,
    ...overrideData,
    personal: { ...(baseData.personal || {}), ...(overrideData.personal || {}) },
    skills: { ...(baseData.skills || {}), ...(overrideData.skills || {}) },
    variants: baseData.variants || []
  };
}

const variantCache = new Map();

async function selectVariant(variantId) {
  const variants = window.__resumeVariants || [];
  const variant = variants.find(entry => entry.id === variantId);
  if (!variant) return;

  document.querySelectorAll('#variantList .tab-btn').forEach(button => {
    const selected = button.dataset.variant === variantId;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
    button.setAttribute('tabindex', selected ? '0' : '-1');
  });

  setStatus(window.__resumeLang === 'sv' ? `Laddar ${variant.title}…` : `Loading ${variant.title}…`, 'loading');

  try {
    let data = variantCache.get(variant.id);
    if (!data) {
      data = await fetchJson(variant.path);
      variantCache.set(variant.id, data);
    }

    const merged = mergeResumeData(window.__baseResumeData || {}, data);
    window.__currentResumeData = merged;
    window.__currentVariantId = variant.id;
    window.__currentVariantMeta = variant;
    document.body.dataset.resumeVariant = variant.id;
    resumeContent?.setAttribute('aria-labelledby', `tab-${variant.id}`);
    renderResume(merged, variant.mode);
    setStatus(variantStatus(variant), 'ready');
    storageSet('resumeVariant', variant.id);
    updateQuery('focus', variant.id);
    document.title = `${variant.title} Resume — Joakim Moléni`;
  } catch (error) {
    console.error(`Could not load resume variant ${variant.id}.`, error);
    const fallback = window.__baseResumeData || {};
    window.__currentResumeData = fallback;
    window.__currentVariantId = variant.id;
    window.__currentVariantMeta = variant;
    renderResume(fallback, variant.mode);
    setStatus(window.__resumeLang === 'sv' ? 'Variantfilen kunde inte laddas. Grund-CV visas.' : 'Variant file could not be loaded. Showing the base resume.', 'error');
  }
}

async function loadResume() {
  try {
    setStatus(window.__resumeLang === 'sv' ? 'Laddar CV…' : 'Loading resume…', 'loading');
    const baseData = await fetchJson('./assets/data/resume-data.json');
    const variants = normalizeVariants(baseData.variants || []);
    window.__baseResumeData = baseData;
    window.__resumeVariants = variants;

    if (!variants.length) {
      window.__currentResumeData = baseData;
      renderResume(baseData, 'default');
      setStatus(window.__resumeLang === 'sv' ? 'Grund-CV visas.' : 'Showing base resume.', 'ready');
      return;
    }

    initVariants(variants);
    const requested = query.get('focus') || storageGet('resumeVariant');
    const selected = variants.some(variant => variant.id === requested) ? requested : variants[0].id;
    await selectVariant(selected);
  } catch (error) {
    console.error('Could not load resume data.', error);
    if (resumeContent) resumeContent.innerHTML = '<p class="resume-error">Resume data could not be loaded. Please return to the portfolio or use the email link above.</p>';
    setStatus(window.__resumeLang === 'sv' ? 'CV-data kunde inte laddas.' : 'Resume data could not be loaded.', 'error');
  }
}

function renderResume(data, variantId = 'default') {
  const { personal = {}, experience = [], skills = {}, education = [], projects = [] } = data || {};
  const isSwedish = window.__resumeLang === 'sv';
  const labels = isSwedish
    ? { contact: 'Kontakt', coreStack: 'Kärnkompetens', languages: 'Språk', focus: 'Fokus', profile: 'Profil', experience: 'Erfarenhet', education: 'Utbildning', projects: 'Utvalda projekt' }
    : { contact: 'Contact', coreStack: 'Core stack', languages: 'Languages', focus: 'Focus', profile: 'Profile', experience: 'Experience', education: 'Education', projects: 'Selected projects' };

  const isModern = /modern/i.test(variantId);
  const isMainframe = /mainframe|standard/i.test(variantId);
  const isPlatform = /platform/i.test(variantId);
  const chipLabel = isMainframe
    ? (isSwedish ? 'Kärnsystemsprofil' : 'Core systems profile')
    : isModern
      ? (isSwedish ? 'Backendprofil' : 'Backend profile')
      : isPlatform
        ? (isSwedish ? 'Plattform & ledarskap' : 'Platform & leadership')
        : (isSwedish ? 'CV-profil' : 'Resume profile');

  const contactItems = [];
  const location = isSwedish && personal.location_sv ? personal.location_sv : personal.location;
  if (location) contactItems.push(`<div class="contact-item contact-location">${escapeHtml(location)}</div>`);
  if (personal.email) contactItems.push(`<div class="contact-item contact-email"><a href="mailto:${escapeHtml(personal.email)}" class="contact-link">${escapeHtml(personal.email)}</a></div>`);
  if (personal.github) contactItems.push(`<div class="contact-item contact-github"><a href="https://${escapeHtml(personal.github)}" target="_blank" rel="noopener noreferrer" class="contact-link">${escapeHtml(personal.github)}</a></div>`);
  if (personal.linkedin) contactItems.push(`<div class="contact-item contact-linkedin"><a href="https://${escapeHtml(personal.linkedin)}" target="_blank" rel="noopener noreferrer" class="contact-link">${escapeHtml(personal.linkedin)}</a></div>`);

  const coreStack = tArr(data, 'coreStack');
  const concepts = tArr(skills, 'concepts');
  const languages = Array.isArray(skills.languages) ? skills.languages : [];

  const sidebarSections = [];
  if (coreStack.length) sidebarSections.push(renderListSection(labels.coreStack, coreStack));
  if (languages.length) sidebarSections.push(renderListSection(labels.languages, languages));
  if (concepts.length) sidebarSections.push(renderListSection(labels.focus, concepts));

  const experienceHtml = experience.map(job => {
    const company = isSwedish && job.company_sv ? job.company_sv : job.company;
    const years = isSwedish && job.years_sv ? job.years_sv : job.years;
    const highlights = tArr(job, 'highlights');
    return `
      <article class="job">
        <div class="job-header"><h3 class="job-company">${escapeHtml(company)}</h3><span class="job-years">${escapeHtml(years)}</span></div>
        <p class="job-position">${escapeHtml(t(job, 'role'))}</p>
        <ul class="job-highlights">${highlights.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </article>`;
  }).join('');

  const educationHtml = education.length ? `
    <section>
      <h2 class="resume-section-title">${labels.education}</h2>
      ${education.map(item => {
        const degree = isSwedish && item.degree_sv ? item.degree_sv : item.degree;
        const label = degree ? `${item.school} — ${degree}` : item.school;
        return `<div class="education-item"><div class="education-school">${escapeHtml(label)}</div><div class="education-years">${escapeHtml(item.years)}</div></div>`;
      }).join('')}
    </section>` : '';

  const projectsHtml = projects.length ? `
    <section>
      <h2 class="resume-section-title">${labels.projects}</h2>
      <div class="resume-project-list">
        ${projects.map(project => `
          <article class="resume-project-item">
            <h3 class="resume-project-name">${escapeHtml(t(project, 'name'))}</h3>
            <p class="resume-project-description">${escapeHtml(t(project, 'description'))}</p>
            ${Array.isArray(project.tech) && project.tech.length ? `<p class="resume-project-tech">${project.tech.map(escapeHtml).join(' · ')}</p>` : ''}
          </article>`).join('')}
      </div>
    </section>` : '';

  if (!resumeContent) return;
  resumeContent.innerHTML = `
    <header class="resume-head">
      <div class="resume-head__main">
        <p class="resume-chip">${escapeHtml(chipLabel)}</p>
        <h1 class="resume-name">${escapeHtml(personal.name)}</h1>
        <p class="resume-title">${escapeHtml(t(personal, 'title'))}</p>
      </div>
      <div class="resume-head__contact" aria-label="${labels.contact}">${contactItems.join('')}</div>
    </header>
    <div class="resume-body">
      <aside class="resume-left" aria-label="${labels.coreStack}">${sidebarSections.join('')}</aside>
      <div class="resume-right">
        <section><h2 class="resume-section-title">${labels.profile}</h2><p class="profile-text">${escapeHtml(t(data, 'profile'))}</p></section>
        <section><h2 class="resume-section-title">${labels.experience}</h2>${experienceHtml}</section>
        ${educationHtml}
        ${projectsHtml}
      </div>
    </div>`;
}

function renderListSection(label, values) {
  return `<section><h2 class="resume-section-title">${escapeHtml(label)}</h2><ul class="skill-list">${values.map(value => `<li class="skill-item">${escapeHtml(value)}</li>`).join('')}</ul></section>`;
}

loadResume();

// Resume-specific logic (theme/nav handled by shared script.js)
const resumeContent = document.getElementById('resumeContent');
const resumeStatus = document.getElementById('resumeStatus');
const langEnBtn = document.getElementById('langEnBtn');
const langSvBtn = document.getElementById('langSvBtn');

// Auto-hide topbar on scroll (mobile only)
(function() {
  const topbar = document.querySelector('.resume-topbar');
  if (!topbar) return;
  let lastY = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (window.innerWidth <= 900) {
        if (y > lastY && y > 60) {
          topbar.classList.add('topbar-hidden');
        } else {
          topbar.classList.remove('topbar-hidden');
        }
      } else {
        topbar.classList.remove('topbar-hidden');
      }
      lastY = y;
      ticking = false;
    });
  }, { passive: true });
})();

// Language state (storageGet/storageSet are defined in script.js, loaded first)
window.__resumeLang = storageGet('resumeLang') || 'en';

function setResumeLang(lang) {
  const safeLang = lang === 'sv' ? 'sv' : 'en';
  window.__resumeLang = safeLang;
  storageSet('resumeLang', safeLang);
  document.body.setAttribute('data-resume-lang', safeLang);

  if (langEnBtn && langSvBtn) {
    const isEn = safeLang === 'en';
    langEnBtn.classList.toggle('active', isEn);
    langSvBtn.classList.toggle('active', !isEn);
    langEnBtn.setAttribute('aria-pressed', String(isEn));
    langSvBtn.setAttribute('aria-pressed', String(!isEn));
  }

  // Re-render if data is loaded
  if (window.__currentResumeData) {
    renderResume(window.__currentResumeData, window.__currentVariantId || 'default');
  }
}

setResumeLang(window.__resumeLang);
langEnBtn?.addEventListener('click', () => setResumeLang('en'));
langSvBtn?.addEventListener('click', () => setResumeLang('sv'));

// Helper: get localized field value
function t(obj, field) {
  if (!obj) return '';
  const lang = window.__resumeLang;
  if (lang === 'sv' && obj[field + '_sv']) return obj[field + '_sv'];
  return obj[field] || '';
}

function tArr(obj, field) {
  if (!obj) return [];
  const lang = window.__resumeLang;
  if (lang === 'sv' && Array.isArray(obj[field + '_sv'])) return obj[field + '_sv'];
  return Array.isArray(obj[field]) ? obj[field] : [];
}

function setStatus(message, type = 'info') {
  if (!resumeStatus) return;
  resumeStatus.textContent = message;
  resumeStatus.dataset.state = type;
}

// Load and render resume data
async function loadResume() {
  try {
    setStatus('Loading resume data...', 'loading');
    const baseData = await fetchJson('./assets/data/resume-data.json');
    const variants = normalizeVariants(baseData.variants || []);

    window.__baseResumeData = baseData;
    window.__resumeVariants = variants;

    if (variants.length) {
      initVariantsFromData(variants);
      await selectVariant(variants[0].id);
      return;
    }

    window.__currentResumeData = baseData;
    window.__currentVariantId = 'default';
    renderResume(baseData, 'default');
    setStatus('Showing default resume.', 'ready');
  } catch (error) {
    console.error('Error loading resume data:', error);
    if (resumeContent) {
      resumeContent.innerHTML = '<p class="resume-error">Error loading resume data.</p>';
    }
    setStatus('Could not load resume data.', 'error');
  }
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

function normalizeVariants(variants) {
  return variants.map((variant, index) => {
    const id = variant.id || `variant-${index + 1}`;
    const fallbackPath = `./assets/data/variants/${id}.json`;
    return {
      id,
      title: variant.title || id,
      description: variant.description || '',
      path: variant.path || fallbackPath,
      mode: variant.template || id
    };
  });
}

function initVariantsFromData(variants) {
  const list = document.getElementById('variantList');
  if (!list || !Array.isArray(variants)) return;

  list.innerHTML = '';
  variants.forEach((variant, idx) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (idx === 0 ? ' active' : '');
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(idx === 0));
    btn.dataset.variant = variant.id;
    btn.textContent = variant.title;
    btn.addEventListener('click', () => selectVariant(variant.id));
    list.appendChild(btn);
  });
}

// Variant JSONs never change within a session — fetch each once
const variantCache = new Map();

async function selectVariant(variantId) {
  const variants = window.__resumeVariants || [];
  const variant = variants.find(entry => entry.id === variantId);
  if (!variant) return;

  document.querySelectorAll('#variantList .tab-btn').forEach(btn => {
    const active = btn.dataset.variant === variantId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });

  try {
    setStatus(`Loading ${variant.title}...`, 'loading');
    let variantData = variantCache.get(variant.id);
    if (!variantData) {
      variantData = await fetchJson(variant.path);
      variantCache.set(variant.id, variantData);
    }
    const mergedData = mergeResumeData(window.__baseResumeData || {}, variantData);
    window.__currentResumeData = mergedData;
    window.__currentVariantId = variant.id;
    window.__currentVariantMeta = variant;
    renderResume(mergedData, variant.mode || variant.id);
    setStatus(`Showing ${variant.title}.`, 'ready');

    const statusElement = document.getElementById('resumeStatus');
    statusElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    console.warn(`Failed to load variant ${variant.id}, falling back to base resume.`, error);
    const baseData = window.__baseResumeData || {};
    window.__currentResumeData = baseData;
    window.__currentVariantId = variant.id;
    window.__currentVariantMeta = variant;
    renderResume(baseData, variant.mode || variant.id);
    setStatus(`Showing base resume. Variant file missing for ${variant.title}.`, 'warning');
  }
}

function mergeResumeData(baseData, overrideData) {
  return {
    ...baseData,
    ...overrideData,
    personal: {
      ...(baseData.personal || {}),
      ...(overrideData.personal || {})
    },
    skills: {
      ...(baseData.skills || {}),
      ...(overrideData.skills || {})
    },
    variants: baseData.variants || []
  };
}

// Attach export handler to button
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnExportPdf');
  if (btn) {
    btn.addEventListener('click', exportPdf);
  }
});

function exportPdf() {
  // Print CSS (@media print in resume.css) already hides the UI chrome
  window.print();
}

function renderResume(data, variantId = 'default') {
  const { personal = {}, experience = [], skills = {}, education = [], projects = [] } = data || {};
  const profile = t(data, 'profile');
  const coreStack = tArr(data, 'coreStack');

  // Variant-specific behavior
  const variant = (data.variants || []).find(v => v.id === variantId) || { id: 'default' };

  const normalizedVariantId = variantId || variant.id || 'default';
  const isModern = /modern/i.test(normalizedVariantId);
  const isMainframe = /mainframe|standard/i.test(normalizedVariantId);
  const isPlatform = /platform/i.test(normalizedVariantId);
  const concepts = tArr(skills, 'concepts');

  const isSv = window.__resumeLang === 'sv';

  // Localized section labels
  const labels = isSv
    ? { contact: 'Kontakt', coreStack: 'Kärnkompetens', languages: 'Språk', focus: 'Fokus', profile: 'Profil', experience: 'Erfarenhet', education: 'Utbildning', projects: 'Utvalda projekt' }
    : { contact: 'Contact', coreStack: 'Core Stack', languages: 'Languages', focus: 'Focus', profile: 'Profile', experience: 'Experience', education: 'Education', projects: 'Selected Projects' };

  const chipLabel = isMainframe
    ? (isSv ? 'Kärnsystemsprofil' : 'Core systems profile')
    : isModern
    ? (isSv ? 'Backendprofil' : 'Backend profile')
    : isPlatform
    ? (isSv ? 'Plattformsprofil' : 'Platform profile')
    : (isSv ? 'CV-profil' : 'Resume profile');

  const leftParts = [];

  const personalTitle = t(personal, 'title');
  const personalLocation = (isSv && personal.location_sv ? personal.location_sv : personal.location) || '';

  leftParts.push(`
    <div class="resume-left">
      <p class="resume-chip">${chipLabel}</p>
      <h1 class="resume-name">${personal.name || ''}</h1>
      <p class="resume-title">${personalTitle}</p>
  `);

  // Contact — only render entries that exist in the data
  const contactItems = [
    personalLocation && `<div class="contact-item contact-location">${personalLocation}</div>`,
    personal.email && `<div class="contact-item contact-email"><a href="mailto:${personal.email}" class="contact-link">${personal.email}</a></div>`,
    personal.github && `<div class="contact-item contact-github"><a href="https://${personal.github}" target="_blank" rel="noopener noreferrer" class="contact-link">${personal.github}</a></div>`,
    personal.linkedin && `<div class="contact-item contact-linkedin"><a href="https://${personal.linkedin}" target="_blank" rel="noopener noreferrer" class="contact-link">${personal.linkedin}</a></div>`
  ].filter(Boolean);

  leftParts.push(`
      <section>
        <h2 class="resume-section-title">${labels.contact}</h2>
        ${contactItems.join('')}
      </section>
  `);

  // Core stack
  if (coreStack && coreStack.length) {
    leftParts.push(`
      <section>
        <h2 class="resume-section-title">${labels.coreStack}</h2>
        <ul class="skill-list">
          ${coreStack.map(skill => `<li class="skill-item">${skill}</li>`).join('')}
        </ul>
      </section>
    `);
  }

  // Languages
  if (skills && skills.languages && skills.languages.length) {
    leftParts.push(`
      <section>
        <h2 class="resume-section-title">${labels.languages}</h2>
        <ul class="skill-list">
          ${skills.languages.map(lang => `<li class="skill-item">${lang}</li>`).join('')}
        </ul>
      </section>
    `);
  }

  if (concepts.length) {
    leftParts.push(`
      <section>
        <h2 class="resume-section-title">${labels.focus}</h2>
        <ul class="skill-list">
          ${concepts.map(concept => `<li class="skill-item">${concept}</li>`).join('')}
        </ul>
      </section>
    `);
  }

  leftParts.push('</div>');

  // Right column
  const rightParts = [];
  rightParts.push('<div class="resume-right">');

  rightParts.push(`
    <section>
      <h2 class="resume-section-title">${labels.profile}</h2>
      <p class="profile-text">${profile}</p>
    </section>
  `);

  // Experience
  rightParts.push(`<section><h2 class="resume-section-title">${labels.experience}</h2>`);

  experience.forEach(job => {
    const highlights = tArr(job, 'highlights');
    const items = highlights;
    const jobRole = t(job, 'role');
    const jobCompany = isSv && job.company_sv ? job.company_sv : job.company;
    const jobYears = isSv && job.years_sv ? job.years_sv : job.years;
    rightParts.push(`
      <div class="job">
        <div class="job-header">
          <span class="job-company">${jobCompany}</span>
          <span class="job-years">${jobYears}</span>
        </div>
        <div class="job-position">${jobRole}</div>
        <ul class="job-highlights">
          ${items.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>
    `);
  });

  rightParts.push('</section>');

  // Education
  if (education && education.length) {
    rightParts.push(`<section><h2 class="resume-section-title">${labels.education}</h2>`);
    education.forEach(ed => {
      const edSchool = ed.school || '';
      const edDegree = isSv && ed.degree_sv ? ed.degree_sv : (ed.degree || '');
      const edLabel = edDegree ? `${edSchool} — ${edDegree}` : edSchool;
      rightParts.push(`<div class="education-item"><div class="education-school">${edLabel}</div><div class="education-years">${ed.years || ''}</div></div>`);
    });
    rightParts.push('</section>');
  }

  if (Array.isArray(projects) && projects.length) {
    rightParts.push(`<section><h2 class="resume-section-title">${labels.projects}</h2><div class="resume-project-list">`);
    projects.forEach(project => {
      const projectName = t(project, 'name');
      const projectDesc = t(project, 'description');
      const tech = Array.isArray(project.tech) && project.tech.length
        ? `<p class="resume-project-tech">${project.tech.join(' · ')}</p>`
        : '';
      rightParts.push(`
        <article class="resume-project-item">
          <h3 class="resume-project-name">${projectName}</h3>
          <p class="resume-project-description">${projectDesc}</p>
          ${tech}
        </article>
      `);
    });
    rightParts.push('</div></section>');
  }

  rightParts.push('</div>');

  if (resumeContent) {
    resumeContent.innerHTML = leftParts.join('') + rightParts.join('');
  }
}

// Load resume on page load
document.addEventListener('DOMContentLoaded', loadResume);

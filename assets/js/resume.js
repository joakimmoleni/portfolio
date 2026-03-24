// Theme persistence
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;
const resumeContent = document.getElementById('resumeContent');
const resumeStatus = document.getElementById('resumeStatus');
const readModeBtn = document.getElementById('readModeBtn');
const editModeBtn = document.getElementById('editModeBtn');
const resumeEditPanel = document.getElementById('resumeEditPanel');

function setStatus(message, type = 'info') {
  if (!resumeStatus) return;
  resumeStatus.textContent = message;
  resumeStatus.dataset.state = type;
}

function setResumeMode(mode) {
  const safeMode = mode === 'edit' ? 'edit' : 'read';
  document.body.setAttribute('data-resume-mode', safeMode);
  localStorage.setItem('resumeMode', safeMode);

  if (resumeEditPanel) {
    resumeEditPanel.hidden = safeMode !== 'edit';
  }

  if (readModeBtn && editModeBtn) {
    const isRead = safeMode === 'read';
    readModeBtn.classList.toggle('active', isRead);
    editModeBtn.classList.toggle('active', !isRead);
    readModeBtn.setAttribute('aria-pressed', String(isRead));
    editModeBtn.setAttribute('aria-pressed', String(!isRead));
  }
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 
                   (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
htmlElement.setAttribute('data-theme', savedTheme);
updateThemeToggle(savedTheme);

const savedResumeMode = localStorage.getItem('resumeMode') || 'read';
setResumeMode(savedResumeMode);

themeToggle?.addEventListener('click', () => {
  const currentTheme = htmlElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  htmlElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggle(newTheme);
});

function updateThemeToggle(theme) {
  const darkIcon = document.getElementById('darkmode');
  const lightIcon = document.getElementById('lightmode');
  
  if (darkIcon && lightIcon) {
    darkIcon.classList.toggle('hidden', theme !== 'dark');
    lightIcon.classList.toggle('hidden', theme !== 'light');
  }
}

readModeBtn?.addEventListener('click', () => setResumeMode('read'));
editModeBtn?.addEventListener('click', () => setResumeMode('edit'));

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
    const li = document.createElement('li');
    li.className = 'tab-item';
    li.innerHTML = `
      <button class="tab-btn${idx === 0 ? ' active' : ''}" type="button" role="tab" data-variant="${variant.id}">
        ${variant.title}
      </button>
    `;
    li.querySelector('button').addEventListener('click', async () => {
      await selectVariant(variant.id);
    });
    list.appendChild(li);
  });
}

async function selectVariant(variantId) {
  const variants = window.__resumeVariants || [];
  const variant = variants.find(entry => entry.id === variantId);
  if (!variant) return;

  document.querySelectorAll('#variantList .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.variant === variantId);
  });

  try {
    setStatus(`Loading ${variant.title}...`, 'loading');
    const variantData = await fetchJson(variant.path);
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
  const controls = document.querySelectorAll('.nav-back, header, .no-print');
  const prevStyles = [];
  controls.forEach(el => {
    prevStyles.push([el, el.style.display]);
    el.style.display = 'none';
  });

  try {
    window.print();
  } catch (err) {
    console.error('print failed', err);
  } finally {
    prevStyles.forEach(([el, val]) => { el.style.display = val || ''; });
  }
}

function renderResume(data, variantId = 'default') {
  const { personal, profile, coreStack, experience, skills, education, projects } = data;

  // Variant-specific behavior
  const variant = (data.variants || []).find(v => v.id === variantId) || { id: 'default' };

  const normalizedVariantId = variantId || variant.id || 'default';
  const isModern = /modern/i.test(normalizedVariantId);
  const isMainframe = /mainframe|standard/i.test(normalizedVariantId);
  const isPlatform = /platform/i.test(normalizedVariantId);
  const concepts = Array.isArray(skills?.concepts) ? skills.concepts : [];

  const leftParts = [];

  leftParts.push(`
    <div class="resume-left">
      <p class="resume-chip">${isMainframe ? 'Core systems profile' : isModern ? 'Backend profile' : isPlatform ? 'Platform profile' : 'Resume profile'}</p>
      <h1 class="resume-name">${personal.name}</h1>
      <p class="resume-title">${personal.title}</p>
  `);

  // Contact
  leftParts.push(`
      <section>
        <h2 class="resume-section-title">Contact</h2>
        <div class="contact-item contact-location">${personal.location}</div>
        <div class="contact-item contact-email"><a href="mailto:${personal.email}" class="contact-link">${personal.email}</a></div>
        <div class="contact-item contact-github"><a href="https://${personal.github}" target="_blank" class="contact-link">${personal.github}</a></div>
        <div class="contact-item contact-linkedin"><a href="https://${personal.linkedin}" target="_blank" class="contact-link">${personal.linkedin}</a></div>
      </section>
  `);

  // Core stack / skills prioritized for modern
  if (coreStack && coreStack.length) {
    leftParts.push(`
      <section>
        <h2 class="resume-section-title">Core Stack</h2>
        <ul class="skill-list">
          ${coreStack.map(skill => `<li class="skill-item">${skill}</li>`).join('')}
        </ul>
      </section>
    `);
  }

  // Languages / specialties
  if (skills && skills.languages && skills.languages.length) {
    leftParts.push(`
      <section>
        <h2 class="resume-section-title">Languages</h2>
        <ul class="skill-list">
          ${skills.languages.map(lang => `<li class="skill-item">${lang}</li>`).join('')}
        </ul>
      </section>
    `);
  }

  if (concepts.length) {
    leftParts.push(`
      <section>
        <h2 class="resume-section-title">Focus</h2>
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

  // In mainframe variant, show profile first too
  rightParts.push(`
    <section>
      <h2 class="resume-section-title">Profile</h2>
      <p class="profile-text">${profile}</p>
    </section>
  `);

  // Experience
  rightParts.push('<section><h2 class="resume-section-title">Experience</h2>');

  experience.forEach(job => {
    const highlights = Array.isArray(job.highlights) ? job.highlights : [];
    const items = isModern ? highlights.slice(0, 2) : highlights;
    rightParts.push(`
      <div class="job">
        <div class="job-header">
          <span class="job-company">${job.company}</span>
          <span class="job-years">${job.years}</span>
        </div>
        <div class="job-position">${job.role}</div>
        <ul class="job-highlights">
          ${items.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>
    `);
  });

  rightParts.push('</section>');

  // Education (if mainframe variant, show more detail)
  if (education && education.length) {
    rightParts.push('<section><h2 class="resume-section-title">Education</h2>');
    education.forEach(ed => {
      rightParts.push(`<div class="education-item"><div class="education-school">${ed.school || ''}</div><div class="education-years">${ed.years || ''}</div></div>`);
    });
    rightParts.push('</section>');
  }

  if (Array.isArray(projects) && projects.length) {
    rightParts.push('<section><h2 class="resume-section-title">Selected Projects</h2><div class="resume-project-list">');
    projects.forEach(project => {
      const tech = Array.isArray(project.tech) && project.tech.length
        ? `<p class="resume-project-tech">${project.tech.join(' · ')}</p>`
        : '';
      rightParts.push(`
        <article class="resume-project-item">
          <h3 class="resume-project-name">${project.name}</h3>
          <p class="resume-project-description">${project.description || ''}</p>
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

// Print helper: try to scale resume to fit one printed A4 page
window.printOnePage = function printOnePage() {
  const element = document.querySelector('.resume');
  if (!element) return window.print();

  // Try to compute a scale so the resume fits one A4 page
  const a4Px = 11.693 * 96; // height in px
  const marginPx = 20; // smaller internal margin
  const available = a4Px - marginPx * 2;
  const height = element.getBoundingClientRect().height;
  let scale = 1;
  if (height > available) {
    scale = available / height;
    scale = Math.max(0.5, Math.min(1, scale));
  }

  // Temporarily apply CSS transform to scale content for capture
  const prevTransform = element.style.transform || '';
  const prevTransformOrigin = element.style.transformOrigin || '';
  element.style.transformOrigin = 'top left';
  element.style.transform = `scale(${scale})`;

  // In-place one-page print: scale element, hide UI, print, then restore
  try {
    const controls = document.querySelectorAll('.nav-back, header, .no-print');
    const prevStyles = [];
    controls.forEach(el => { prevStyles.push([el, el.style.display]); el.style.display = 'none'; });

    // give browser a tick to apply styles
    requestAnimationFrame(() => {
      try {
        window.print();
      } catch (err) {
        console.error('print failed', err);
      } finally {
        // restore transform and UI
        element.style.transform = prevTransform;
        element.style.transformOrigin = prevTransformOrigin;
        prevStyles.forEach(([el, val]) => { el.style.display = val || ''; });
      }
    });
  } catch (err) {
    console.error('one-page export failed', err);
    element.style.transform = prevTransform;
    element.style.transformOrigin = prevTransformOrigin;
    window.print();
  }
};

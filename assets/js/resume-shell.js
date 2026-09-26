'use strict';

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (error) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (error) { /* Preferences are optional. */ }
}
function translateResumeShell(lang) {
  const locale = lang === 'sv' ? 'sv' : 'en';
  document.querySelectorAll(`[data-resume-${locale}]`).forEach(element => {
    element.textContent = element.getAttribute(`data-resume-${locale}`);
  });
  document.querySelectorAll(`[data-resume-${locale}-label]`).forEach(element => {
    element.setAttribute('aria-label', element.getAttribute(`data-resume-${locale}-label`));
  });
  document.querySelector('.resume-menu')?.setAttribute('aria-label', locale === 'sv' ? 'Program' : 'Programs');
}

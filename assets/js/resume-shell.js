'use strict';

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (error) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (error) { /* Preferences are optional. */ }
}
function applyTheme(theme) {
  const dark = theme === 'dark';
  const swedish = document.documentElement.lang === 'sv';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const button = document.getElementById('themeToggle');
  button?.setAttribute('aria-pressed', String(dark));
  button?.setAttribute('aria-label', swedish
    ? (dark ? 'Ljus skrivbordsram' : 'Mörk skrivbordsram')
    : (dark ? 'Light desktop frame' : 'Dark desktop frame'));
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = dark ? '#182b41' : '#3a6ea5';
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
  applyTheme(document.documentElement.dataset.theme);
}
applyTheme(storageGet('theme'));
document.getElementById('themeToggle')?.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  storageSet('theme', theme);
});

'use strict';
function storageGet(key) {
  try { return localStorage.getItem(key); } catch (error) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (error) { /* Preference storage is optional. */ }
}
function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const button = document.getElementById('themeToggle');
  button.setAttribute('aria-pressed', String(dark));
  button.setAttribute('aria-label', dark ? 'Use light theme' : 'Use dark theme');
  document.getElementById('iconMoon').classList.toggle('hidden', dark);
  document.getElementById('iconSun').classList.toggle('hidden', !dark);
  document.querySelector('meta[name="theme-color"]').content = dark ? '#182b41' : '#3a6ea5';
}
applyTheme(storageGet('theme'));
document.getElementById('themeToggle').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  storageSet('theme', theme);
});

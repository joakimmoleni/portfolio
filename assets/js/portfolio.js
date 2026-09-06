'use strict';

const themeToggle = document.getElementById('themeToggle');
function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  themeToggle.textContent = dark ? 'Light' : 'Dark';
  themeToggle.setAttribute('aria-label', dark ? 'Use light theme' : 'Use dark theme');
  themeToggle.setAttribute('aria-pressed', String(dark));
  document.querySelector('meta[name="theme-color"]').content = dark ? '#131a20' : '#ffffff';
}
applyTheme(document.documentElement.dataset.theme);
themeToggle.hidden = false;
themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem('theme', theme); } catch (error) { /* Preference storage is optional. */ }
});
document.getElementById('copyrightYear').textContent = new Date().getFullYear();

'use strict';
/* ===== Mes cartes — app.js v3 ===== */

/* Mêmes clés qu'avant : tes cartes existantes sont conservées */
const CARDS_KEY = 'loyalty_cards_v1';
const THEME_KEY = 'loyalty_theme_v2';
const GUIDE_KEY = 'loyalty_hide_guide';
const SORT_KEY = 'loyalty_sort_v1';
const TAB_KEY = 'loyalty_tab_v1';
const VAULT_KEY = 'loyalty_vault_v1';
const APP_VERSION = '5.4';
const VIEW_KEY = 'loyalty_view_v1';
const BIO_KEY = 'loyalty_bio_v1';
const BACKUP_KEY = 'loyalty_last_backup';
const SNOOZE_KEY = 'loyalty_backup_snooze';

const CATEGORIES = [
  { id: 'courses', name: 'Courses', emoji: '🛒' },
  { id: 'essence', name: 'Essence', emoji: '⛽' },
  { id: 'pharmacie', name: 'Pharmacie', emoji: '💊' },
  { id: 'mode', name: 'Mode', emoji: '👗' },
  { id: 'beaute', name: 'Beauté', emoji: '💄' },
  { id: 'resto', name: 'Restauration', emoji: '🍔' },
  { id: 'maison', name: 'Maison & bricolage', emoji: '🛠️' },
  { id: 'loisirs', name: 'Loisirs & culture', emoji: '🎬' },
  { id: 'voyage', name: 'Voyage & transport', emoji: '✈️' },
  { id: 'autre', name: 'Autre', emoji: '💳' }
];
const catById = id => CATEGORIES.find(c => c.id === id);

const COLORS = ['#2264d1', '#8b5cf6', '#e05252', '#e88b27', '#168c65', '#008da8', '#d04d91', '#475569'];

/* Magasins courants : un clic préremplit le nom, la catégorie et la couleur */
const TEMPLATES = [
  ['Carrefour', 'courses', '#2264d1'], ['E.Leclerc', 'courses', '#e88b27'], ['Auchan', 'courses', '#e05252'],
  ['Intermarché', 'courses', '#e05252'], ['Lidl', 'courses', '#2264d1'], ['Monoprix', 'courses', '#d04d91'],
  ['Franprix', 'courses', '#168c65'], ['Picard', 'courses', '#008da8'], ['Casino', 'courses', '#168c65'],
  ['TotalEnergies', 'essence', '#e05252'], ['Shell', 'essence', '#e88b27'], ['Decathlon', 'loisirs', '#2264d1'],
  ['Fnac', 'loisirs', '#e88b27'], ['Cultura', 'loisirs', '#8b5cf6'], ['Leroy Merlin', 'maison', '#168c65'],
  ['Castorama', 'maison', '#008da8'], ['IKEA', 'maison', '#2264d1'], ['Sephora', 'beaute', '#475569'],
  ['Yves Rocher', 'beaute', '#168c65'], ['Kiabi', 'mode', '#2264d1'], ['Action', 'maison', '#e05252'],
  ['Amazon', 'autre', '#e88b27']
].map(([name, category, color]) => ({ name, category, color }));

const THEME2_KEY = 'loyalty_theme_v3';
const WP_KEY = 'loyalty_wallpaper_v1';
const BASES = { light: { bg: '#f3f6fc', surface: '#ffffff' }, dark: { bg: '#0b1220', surface: '#162036' } };
const DEFAULT_THEME = { mode: 'auto', accent: '#3b6ef0', accent2: null, bg: null, surface: null, text: null, halo: true, wpBlur: 0, wpVeil: 35 };
const ACCENTS = ['#3b6ef0', '#7c4dff', '#e0407f', '#ee5a3c', '#f59e0b', '#1f9254', '#0a8fa8', '#64748b'];
let theme = { ...DEFAULT_THEME };
let wallpaper = null;
let themeTab = 'colors';
let themeTarget = 'accent';
let themeAdv = false;
let themeSnap = null;
let flashT = null, persistT = null;
const COLORS_KEY = 'loyalty_colors_v1';
let savedColors = [];   // [{ hex, name }]
const TARGETS = [
  { key: 'accent', label: 'Principale', desc: 'Boutons, onglets, détails', adv: false },
  { key: 'bg', label: 'Fond', desc: "Arrière-plan de l'app", adv: false, auto: true },
  { key: 'accent2', label: 'Dégradé', desc: 'Seconde couleur des boutons', adv: true, auto: true },
  { key: 'surface', label: 'Surfaces', desc: 'Barre du bas, fenêtres, champs', adv: true, auto: true },
  { key: 'text', label: 'Texte', desc: 'Titres et textes', adv: true, auto: true }
];

const $ = id => document.getElementById(id);

/* ---------- Icônes (SVG, identiques sur tous les téléphones) ---------- */
const mk = p => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICONS = {
  search: mk('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  palette: mk('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><g fill="currentColor" stroke="none"><circle cx="7.6" cy="11.2" r="1.15"/><circle cx="10.2" cy="7.4" r="1.15"/><circle cx="14.8" cy="7.4" r="1.15"/></g>'),
  sliders: mk('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  plus: mk('<path d="M12 5v14M5 12h14"/>'),
  close: mk('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: mk('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  star: mk('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
  starFill: mk('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>').replace('fill="none"', 'fill="currentColor"'),
  more: mk('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
  edit: mk('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  trash: mk('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  camera: mk('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  image: mk('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.7"/><path d="M21 16l-5-5-8 9"/>'),
  eye: mk('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: mk('<path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  lock: mk('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  unlock: mk('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>'),
  card: mk('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h4"/>'),
  gift: mk('<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M12 9v11M3 13h18"/><path d="M12 9c-2.5 0-4-1-4-2.5S9 4 10.5 4C12 4 12 7 12 9zM12 9c2.5 0 4-1 4-2.5S15 4 13.5 4C12 4 12 7 12 9z"/>'),
  grid: mk('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
  list: mk('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  store: mk('<path d="M4 9l1-4h14l1 4M4 9v10h16V9M4 9h16M9 19v-5h6v5"/>'),
  bolt: mk('<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>'),
  upload: mk('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'),
  download: mk('<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>'),
  phone: mk('<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>'),
  refresh: mk('<path d="M20 11a8 8 0 0 0-14-4M4 5v4h4M4 13a8 8 0 0 0 14 4M20 19v-4h-4"/>')
};
const setIcon = (node, name) => { node.innerHTML = ICONS[name] || ''; };
const paintIcons = () => document.querySelectorAll('[data-icon]').forEach(n => setIcon(n, n.dataset.icon));

/* ---------- État ---------- */
let cards = [];
let editingId = null;
let openedId = null;
let selectedColor = COLORS[0];
let selectedLogo = null;
let filter = { kind: 'all', value: '' };   // all | fav | cat | tag
let reorderMode = false;
let tab = 'loyalty';        // onglet affiché : loyalty | gift
let formKind = 'loyalty';   // type de carte dans le formulaire
let removeCode = false;     // « Retirer le code enregistré » demandé dans le formulaire
let sortMode = 'recent';
let viewMode = 'grid';      // grid | list
let stream = null;
let scanTimer = null;
let wakeLock = null;
let installEvent = null;
let scannedFormat = null;   // format du dernier code scanné (EAN13, CODE128…)

/* ---------- Utilitaires ---------- */
const uid = () => `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const initials = n => n.trim().slice(0, 2).toUpperCase();
const typeLabel = t => (t === 'barcode' ? 'Code-barres' : t === 'qrcode' ? 'QR code' : 'Sans code');
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function darken(hex, amount = -30) {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = v => Math.max(0, Math.min(255, v + amount));
  return '#' + ((1 << 24) + (c(n >> 16) << 16) + (c((n >> 8) & 255) << 8) + c(n & 255)).toString(16).slice(1);
}
function lum(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}
/* Vrai si le texte sombre est plus lisible que le texte blanc sur cette couleur (contraste WCAG) */
function isLight(hex) {
  const L = lum(hex);
  return (L + 0.05) / 0.0587 > 1.3 * 1.05 / (L + 0.05);   // léger avantage au texte blanc, plus classique sur les cartes
}
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  });
  children.forEach(c => c && node.append(c));
  return node;
}
function logoNode(card) {
  if (card.logo) return el('img', { src: card.logo, alt: `Logo ${card.name}` });
  return document.createTextNode(initials(card.name));
}
/* Une carte est « cadeau » si elle a un solde ; les anciennes cartes sont classées automatiquement */
const kindOf = c => (c.kind === 'gift' || c.kind === 'loyalty') ? c.kind : (c.balance != null ? 'gift' : 'loyalty');
const opLabels = c => kindOf(c) === 'gift'
  ? { cap: 'Solde restant', spend: 'Dépense', topup: 'Recharge', spendBtn: '− Dépense', topupBtn: '+ Recharge' }
  : { cap: 'Cagnotte', spend: 'Cagnotte utilisée', topup: 'Cagnotte gagnée', spendBtn: '− Utilisée', topupBtn: '+ Gagnée' };
const round2 = n => Math.round(n * 100) / 100;
const fmtMoney = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const fmtDate = t => new Date(t).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
function parseAmount(str, allowZero = false) {
  const txt = String(str || '').replace(/[€\s]/g, '').replace(',', '.');
  if (!txt) return null;
  const n = Number(txt);
  if (!Number.isFinite(n) || n < 0 || n > 100000 || (!allowZero && n <= 0)) return null;
  return round2(n);
}
function vibrate(ms = 12) { try { navigator.vibrate && navigator.vibrate(ms); } catch {} }

/* ---------- Toasts (avec action facultative) ---------- */
function toast(message, action) {
  const box = el('div', { class: 'toast' }, el('span', { text: message }));
  let timer;
  const remove = () => { clearTimeout(timer); box.remove(); };
  if (action) {
    const b = el('button', { type: 'button', text: action.label });
    b.addEventListener('click', () => { action.run(); remove(); });
    box.append(b);
  }
  $('toasts').append(box);
  timer = setTimeout(remove, action ? 5500 : 2200);
}

/* ---------- Stockage ---------- */
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
    cards = Array.isArray(raw) ? raw.filter(c => c && c.id && c.name) : [];
  } catch { cards = []; }
  cards.forEach(c => { c.kind = kindOf(c); });
  tab = localStorage.getItem(TAB_KEY) === 'gift' ? 'gift' : 'loyalty';
  loadTheme();
  loadSavedColors();
  sortMode = localStorage.getItem(SORT_KEY) || 'recent';
  if (!['recent', 'used', 'az', 'manual'].includes(sortMode)) sortMode = 'recent';
  viewMode = localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  ensureOrder();
  $('sortSelect').value = sortMode;
  $('quickGuide').hidden = localStorage.getItem(GUIDE_KEY) === '1';
  applyTheme();
  // Demande au navigateur de ne pas effacer les cartes en cas de manque de place
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}
function save() {
  try { localStorage.setItem(CARDS_KEY, JSON.stringify(cards)); return true; }
  catch { return false; }
}

/* ---------- Thème personnalisé + fond d'écran ---------- */
const mixHex = (a, b, t) => {
  const p = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
const isHex = v => /^#[0-9a-f]{6}$/i.test(v || '');
function loadTheme() {
  try {
    const t = JSON.parse(localStorage.getItem(THEME2_KEY) || 'null');
    theme = { ...DEFAULT_THEME, ...(t && typeof t === 'object' ? t : {}) };
  } catch { theme = { ...DEFAULT_THEME }; }
  ['accent', 'accent2', 'bg', 'surface', 'text'].forEach(k => { if (!isHex(theme[k])) theme[k] = DEFAULT_THEME[k]; });
  if (!['auto', 'light', 'dark'].includes(theme.mode)) theme.mode = 'auto';
  theme.halo = theme.halo !== false;
  theme.wpBlur = Math.max(0, Math.min(24, Number(theme.wpBlur) || 0));
  theme.wpVeil = Math.max(0, Math.min(90, Number.isFinite(Number(theme.wpVeil)) ? Number(theme.wpVeil) : 35));
  try { wallpaper = localStorage.getItem(WP_KEY) || null; } catch { wallpaper = null; }
}
function persistTheme() { try { localStorage.setItem(THEME2_KEY, JSON.stringify(theme)); } catch {} }
/* Calcule les couleurs finales : ce que l'utilisateur a choisi, sinon des valeurs déduites */
function computeTheme() {
  const sysDark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  const wantDark = theme.mode === 'dark' || (theme.mode === 'auto' && sysDark);
  const base = BASES[wantDark ? 'dark' : 'light'];
  const bg = theme.bg || base.bg;
  const dark = theme.bg ? lum(bg) < 0.25 : wantDark;
  const surface = theme.surface || (theme.bg ? mixHex(bg, '#ffffff', dark ? 0.07 : 0.7) : base.surface);
  const text = theme.text || (dark ? '#f4f7ff' : '#162036');
  const accent = theme.accent;
  const accent2 = theme.accent2 || (lum(accent) > 0.35 ? darken(accent, -40) : mixHex(accent, '#ffffff', 0.28));
  return { bg, surface, text, accent, accent2, dark };
}
function applyTheme() {
  const c = computeTheme();
  const body = document.body, s = body.style;
  [['--bg', c.bg], ['--surface', c.surface], ['--text', c.text], ['--accent', c.accent], ['--accent-2', c.accent2], ['--accent-dark', c.accent2],
   ['--on-accent', isLight(c.accent) ? '#101114' : '#fff'], ['--wp-blur', theme.wpBlur + 'px'], ['--wp-veil', theme.wpVeil + '%']]
    .forEach(([k, v]) => s.setProperty(k, v));
  body.dataset.mode = c.dark ? 'dark' : 'light';
  body.dataset.halo = theme.halo ? 'on' : 'off';
  body.dataset.wp = wallpaper ? '1' : '0';
  $('wpImg').style.backgroundImage = wallpaper ? `url("${wallpaper}")` : '';
  $('wallpaper').hidden = !wallpaper;
  syncThemeColor();
}
function syncThemeColor(color) {
  const bg = color || getComputedStyle(document.body).getPropertyValue('--bg').trim();
  if (bg) $('themeColorMeta').content = bg;
}
function setThemeKey(patch, rerender = false) {
  Object.assign(theme, patch);
  persistTheme();
  applyTheme();
  if (rerender) renderThemes();
}
/* ----- Conversions de couleurs ----- */
const hexToRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
function hexToHsv(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return { h, s: mx ? d / mx : 0, v: mx };
}
function hsvToHex(h, s, v) {
  const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return rgbToHex(f(5) * 255, f(3) * 255, f(1) * 255);
}
const shadeList = base => [0.8, 0.6, 0.4, 0.2].map(t => mixHex(base, '#ffffff', t)).concat([base], [0.2, 0.4, 0.55, 0.7].map(t => mixHex(base, '#000000', t)));

/* ----- Mes couleurs (palette enregistrée, partagée avec les cartes) ----- */
function loadSavedColors() {
  try {
    const a = JSON.parse(localStorage.getItem(COLORS_KEY) || '[]');
    savedColors = Array.isArray(a) ? a.filter(c => c && isHex(c.hex)).map(c => ({ hex: c.hex.toLowerCase(), name: String(c.name || '').slice(0, 24) })).slice(0, 36) : [];
  } catch { savedColors = []; }
}
function persistSavedColors() { try { localStorage.setItem(COLORS_KEY, JSON.stringify(savedColors)); return true; } catch { return false; } }
function addSavedColor(hex) {
  hex = hex.toLowerCase();
  if (savedColors.some(c => c.hex === hex)) { toast('Cette couleur est déjà enregistrée.'); return false; }
  if (savedColors.length >= 36) { toast('36 couleurs enregistrées au maximum.'); return false; }
  const name = prompt('Nom de la couleur (facultatif)');
  if (name === null) return false;
  savedColors.push({ hex, name: name.trim().slice(0, 24) });
  persistSavedColors();
  toast('Couleur enregistrée ✓');
  return true;
}

/* ----- Sélecteur de couleur intégré (aucune fenêtre par-dessus l'app) ----- */
function buildPicker(value, onChange) {
  let { h, s, v } = hexToHsv(value);
  let curHex = value, anchor = value, dragging = false;
  const sv = el('div', { class: 'cp-sv', 'aria-label': 'Saturation et luminosité' });
  const thumb = el('div', { class: 'cp-thumb' });
  sv.append(thumb);
  const hue = el('input', { type: 'range', min: 0, max: 360, step: 1, value: Math.round(h), class: 'cp-hue', 'aria-label': 'Teinte' });
  const swatch = el('span', { class: 'cp-cur' });
  const hex = el('input', { class: 'form-input cp-hex', type: 'text', maxlength: 7, autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Code couleur' });
  const saveBtn = el('button', { type: 'button', class: 'chip small cp-save' });
  const shadeRow = el('div', { class: 'cp-shades', role: 'group', 'aria-label': 'Nuances' });
  const shadeBtns = Array.from({ length: 9 }, () => { const b = el('button', { type: 'button' }); shadeRow.append(b); return b; });
  const saved = el('div', { class: 'cp-saved-wrap' });

  function paintSaved() {
    const hit = savedColors.find(x => x.hex === curHex);
    const kids = [];
    if (hit) {
      const rn = el('button', { type: 'button', class: 'text-button', text: 'Renommer' });
      rn.addEventListener('click', () => {
        const n = prompt('Nom de la couleur', hit.name);
        if (n === null) return;
        hit.name = n.trim().slice(0, 24); persistSavedColors(); paintSaved();
      });
      const del = el('button', { type: 'button', class: 'text-button danger', text: 'Supprimer' });
      del.addEventListener('click', () => {
        if (!confirm('Supprimer cette couleur enregistrée ?')) return;
        savedColors = savedColors.filter(x => x !== hit); persistSavedColors(); paint();
      });
      kids.push(el('div', { class: 'cp-manage' }, el('span', { text: hit.name ? `★ « ${hit.name} »` : '★ Couleur enregistrée' }), rn, del));
    }
    if (savedColors.length) {
      const dots = el('div', { class: 'cp-saved', role: 'group', 'aria-label': 'Mes couleurs' });
      savedColors.forEach(x => {
        const d = el('button', { type: 'button', class: `color-dot${x.hex === curHex ? ' selected' : ''}`, 'aria-label': x.name || `Couleur ${x.hex}`, title: x.name || x.hex });
        d.style.background = x.hex;
        d.addEventListener('click', () => setHex(x.hex));
        dots.append(d);
      });
      kids.push(dots);
    }
    saved.replaceChildren(...kids);
  }
  function paint(o = {}) {
    const c = curHex;
    thumb.style.left = (s * 100) + '%';
    thumb.style.top = ((1 - v) * 100) + '%';
    sv.style.backgroundColor = hsvToHex(h, 1, 1);
    if (o.skip !== 'hue') hue.value = Math.round(h);
    swatch.style.background = c;
    if (o.skip !== 'hex') hex.value = c.toUpperCase();
    shadeList(anchor).forEach((x, i) => {
      shadeBtns[i].style.background = x; shadeBtns[i].dataset.hex = x;
      shadeBtns[i].classList.toggle('on', x === c);
      shadeBtns[i].setAttribute('aria-label', `Nuance ${x}`);
    });
    const hit = savedColors.some(x => x.hex === c);
    saveBtn.textContent = hit ? '★ Enregistrée' : '☆ Enregistrer';
    saveBtn.classList.toggle('active', hit);
    if (!o.drag) paintSaved();
  }
  function setHex(x, o = {}) {
    const n = hexToHsv(x);
    if (n.s > 0 && n.v > 0) h = n.h;
    s = n.s; v = n.v; curHex = x;
    if (!o.keepAnchor) anchor = x;
    paint(o.skip ? { skip: o.skip } : {});
    onChange(curHex);
  }
  const move = e => {
    const r = sv.getBoundingClientRect();
    s = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    v = 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    curHex = anchor = hsvToHex(h, s, v);
    paint({ drag: true });
    onChange(curHex);
  };
  sv.addEventListener('pointerdown', e => { dragging = true; try { sv.setPointerCapture(e.pointerId); } catch {} move(e); });
  sv.addEventListener('pointermove', e => { if (dragging) move(e); });
  const end = () => { if (dragging) { dragging = false; paintSaved(); } };
  sv.addEventListener('pointerup', end);
  sv.addEventListener('pointercancel', end);
  hue.addEventListener('input', () => {
    h = Number(hue.value);
    curHex = anchor = hsvToHex(h, s, v);
    paint({ skip: 'hue', drag: true });
    onChange(curHex);
  });
  hue.addEventListener('change', paintSaved);
  hex.addEventListener('input', () => {
    let t = hex.value.trim().toLowerCase();
    if (!t.startsWith('#')) t = '#' + t;
    if (/^#[0-9a-f]{3}$/.test(t)) t = '#' + [...t.slice(1)].map(c => c + c).join('');
    if (/^#[0-9a-f]{6}$/.test(t)) setHex(t, { skip: 'hex' });
  });
  shadeBtns.forEach(b => b.addEventListener('click', () => setHex(b.dataset.hex, { keepAnchor: true })));
  saveBtn.addEventListener('click', () => {
    if (savedColors.some(x => x.hex === curHex)) return toast('Cette couleur est déjà dans Mes couleurs.');
    if (addSavedColor(curHex)) paint();
  });
  const wrap = el('div', { class: 'cp' }, sv, hue, el('div', { class: 'cp-hexrow' }, swatch, hex, saveBtn), shadeRow, saved);
  paint();
  return wrap;
}

/* ----- Panneau de personnalisation ----- */
function commitTheme() {
  applyTheme();
  clearTimeout(persistT);
  persistT = setTimeout(persistTheme, 200);
}
function setThemeKey(patch, rerender = false) {
  Object.assign(theme, patch);
  commitTheme();
  if (rerender) renderThemes();
}
/* Fait clignoter la zone de l'app qui utilise la couleur choisie */
function flashZone(key) {
  const b = document.body;
  b.dataset.hl = '';
  void b.offsetWidth;
  b.dataset.hl = key;
  clearTimeout(flashT);
  flashT = setTimeout(() => { delete b.dataset.hl; }, 1300);
}
function rangeRow(label, key, min, max, step, unit) {
  const val = el('strong', { text: theme[key] + unit });
  const r = el('input', { type: 'range', min, max, step, value: theme[key], 'aria-label': label });
  r.addEventListener('input', () => { theme[key] = Number(r.value); val.textContent = r.value + unit; commitTheme(); });
  return el('div', { class: 'range-row' }, el('div', { class: 'range-top' }, el('span', { text: label }), val), r);
}
function colorsPanel() {
  const box = el('div', { class: 'theme-panel' });
  const tgt = TARGETS.find(t => t.key === themeTarget && (!t.adv || themeAdv)) || TARGETS[0];

  const mode = el('div', { class: 'segmented three', role: 'radiogroup', 'aria-label': 'Mode de base' });
  [['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre']].forEach(([v, l]) => {
    const b = el('button', { type: 'button', class: `seg${theme.mode === v ? ' active' : ''}`, text: l });
    b.addEventListener('click', () => setThemeKey({ mode: v }, true));
    mode.append(b);
  });

  const dots = {};
  const chips = el('div', { class: 'tchips', role: 'tablist', 'aria-label': 'Quoi colorer' });
  TARGETS.filter(t => !t.adv || themeAdv).forEach(t => {
    const i = el('i');
    dots[t.key] = i;
    const b = el('button', { type: 'button', class: `tchip${t.key === tgt.key ? ' active' : ''}` }, i, t.label);
    b.addEventListener('click', () => { themeTarget = t.key; flashZone(t.key); renderThemes(); });
    chips.append(b);
  });
  const more = el('button', { type: 'button', class: 'tchip more', text: themeAdv ? 'Moins ▴' : 'Avancé ▾' });
  more.addEventListener('click', () => {
    themeAdv = !themeAdv;
    if (!themeAdv && TARGETS.find(t => t.key === themeTarget).adv) themeTarget = 'accent';
    renderThemes();
  });
  chips.append(more);

  const desc = el('span');
  const resetBtn = el('button', { type: 'button', class: 'chip small' });
  const sync = () => {
    const c = computeTheme();
    TARGETS.forEach(t => { if (dots[t.key]) dots[t.key].style.setProperty('--c', c[t.key]); });
    const isAuto = tgt.auto && theme[tgt.key] === null;
    desc.textContent = tgt.desc + (isAuto ? ' · automatique' : '');
    resetBtn.textContent = tgt.auto ? 'Auto' : 'Réinitialiser';
    resetBtn.hidden = tgt.auto ? isAuto : theme.accent === DEFAULT_THEME.accent;
  };
  resetBtn.addEventListener('click', () => {
    theme[tgt.key] = tgt.auto ? null : DEFAULT_THEME[tgt.key];
    commitTheme();
    renderThemes();
  });
  const meta = el('div', { class: 't-meta' }, desc, resetBtn);

  const picker = buildPicker(computeTheme()[tgt.key], hexv => { theme[tgt.key] = hexv; commitTheme(); sync(); });
  sync();
  box.append(mode, chips, meta, picker);

  if (themeAdv) {
    const halo = el('label', { class: 'check-row' }, el('input', { type: 'checkbox' }), el('span', { text: 'Halo coloré en fond' }));
    halo.firstChild.checked = theme.halo;
    halo.firstChild.addEventListener('change', e => setThemeKey({ halo: e.target.checked }));
    const reset = el('button', { type: 'button', class: 'secondary-button', text: 'Tout réinitialiser' });
    reset.addEventListener('click', () => { setThemeKey({ ...DEFAULT_THEME, wpBlur: theme.wpBlur, wpVeil: theme.wpVeil }, true); toast('Couleurs réinitialisées'); });
    box.append(halo, reset);
  }
  return box;
}
function wallpaperPanel() {
  const box = el('div', { class: 'theme-panel' });
  box.append(el('p', { class: 'field-hint', text: wallpaper ? "Règle le flou et le voile en regardant ton app juste au-dessus." : "Choisis une image de ta galerie pour habiller l'app. Elle reste sur cet appareil." }));
  const row = el('div', { class: 'btn-row' });
  const pick = el('button', { type: 'button', class: 'primary-button', text: wallpaper ? "Changer l'image" : 'Choisir une image' });
  pick.addEventListener('click', () => $('wpInput').click());
  row.append(pick);
  if (wallpaper) {
    const rm = el('button', { type: 'button', class: 'secondary-button', text: 'Retirer' });
    rm.addEventListener('click', () => { try { localStorage.removeItem(WP_KEY); } catch {} wallpaper = null; applyTheme(); renderThemes(); toast('Fond d’écran retiré'); });
    row.append(rm);
  }
  box.append(row);
  if (wallpaper) box.append(rangeRow('Flou', 'wpBlur', 0, 24, 1, ' px'), rangeRow('Voile (couleur du fond)', 'wpVeil', 0, 90, 5, ' %'));
  return box;
}
function renderThemes() {
  const tabs = $('themeTabs');
  tabs.replaceChildren();
  [['colors', 'Couleurs'], ['wallpaper', "Fond d'écran"]].forEach(([id, label]) => {
    const b = el('button', { type: 'button', role: 'tab', class: `seg${themeTab === id ? ' active' : ''}`, text: label });
    b.addEventListener('click', () => { themeTab = id; renderThemes(); });
    tabs.append(b);
  });
  $('themeList').replaceChildren(themeTab === 'colors' ? colorsPanel() : wallpaperPanel());
}
function resizeWallpaper(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1280 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- Liste des cartes ---------- */
/* Chaque carte a un numéro d'ordre (mode « Mon ordre »). Celles qui n'en ont pas sont ajoutées à la fin. */
function ensureOrder() {
  let next = Math.max(-1, ...cards.map(c => (typeof c.order === 'number' ? c.order : -1))) + 1;
  cards.filter(c => typeof c.order !== 'number')
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .forEach(c => { c.order = next++; });
}
const tabCards = () => cards.filter(c => kindOf(c) === tab);
const isSpent = c => kindOf(c) === 'gift' && c.balance != null && c.balance <= 0.004;   // « épuisée » : cartes cadeaux seulement
/* Expiration (cartes cadeaux) : nombre de jours restants, 0 = aujourd'hui, négatif = expirée */
const dayDiff = c => {
  if (!c.expires || !/^\d{4}-\d{2}-\d{2}$/.test(c.expires)) return null;
  const [y, m, d] = c.expires.split('-').map(Number);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(y, m - 1, d) - t) / 864e5);
};
const isExpired = c => kindOf(c) === 'gift' && dayDiff(c) !== null && dayDiff(c) < 0;
const isSoon = c => kindOf(c) === 'gift' && !isSpent(c) && dayDiff(c) !== null && dayDiff(c) >= 0 && dayDiff(c) <= 30;
const isDead = c => isSpent(c) || isExpired(c);
const expiryText = c => { const n = dayDiff(c); return n === null ? '' : n < 0 ? 'Expirée' : n === 0 ? "Expire aujourd'hui" : `Expire dans ${n} j`; };
function matchesFilter(c) {
  if (filter.kind === 'fav') return !!c.fav;
  if (filter.kind === 'cat') return c.category === filter.value;
  if (filter.kind === 'tag') return (c.tags || []).some(t => norm(t) === filter.value);
  return true;
}
const searchMatch = (c, q) => norm(c.name).includes(q) || norm(c.notes).includes(q)
  || (c.tags || []).some(t => norm(t).includes(q)) || norm(catById(c.category)?.name).includes(q);
function sortedFiltered() {
  const q = norm($('searchInput').value.trim());
  const list = tabCards().filter(c => matchesFilter(c) && (!q || searchMatch(c, q)));
  const byMode = {
    recent: (a, b) => (b.lastUsed || b.createdAt || 0) - (a.lastUsed || a.createdAt || 0),
    used: (a, b) => (b.uses || 0) - (a.uses || 0),
    az: (a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }),
    manual: (a, b) => (a.order ?? 1e9) - (b.order ?? 1e9)
  };
  const cmp = byMode[sortMode] || byMode.recent;
  const auto = sortMode !== 'manual';
  const gift = auto && tab === 'gift';
  list.sort((a, b) =>
    (gift ? (isDead(a) ? 1 : 0) - (isDead(b) ? 1 : 0) : 0)   // épuisées / expirées en bas
    || (gift ? (isSoon(b) ? 1 : 0) - (isSoon(a) ? 1 : 0) || (isSoon(a) && isSoon(b) ? dayDiff(a) - dayDiff(b) : 0) : 0)   // bientôt expirées en haut
    || (auto ? (b.fav ? 1 : 0) - (a.fav ? 1 : 0) : 0)
    || cmp(a, b));
  return list;
}
function renderFilters(pool) {
  const row = $('filterRow');
  row.replaceChildren();
  const add = (kind, value, label) => {
    const on = filter.kind === kind && filter.value === value;
    const b = el('button', { type: 'button', class: `chip${on ? ' active' : ''}`, text: label });
    b.addEventListener('click', () => { filter = { kind, value }; render(); });
    row.append(b);
  };
  add('all', '', 'Toutes');
  if (pool.some(c => c.fav)) add('fav', '', '★ Favorites');
  CATEGORIES.filter(cat => pool.some(c => c.category === cat.id)).forEach(cat => add('cat', cat.id, `${cat.emoji} ${cat.name}`));
  const tags = new Map();
  pool.forEach(c => (c.tags || []).forEach(t => { const k = norm(t); if (!tags.has(k)) tags.set(k, t); }));
  [...tags].sort((a, b) => a[1].localeCompare(b[1], 'fr')).forEach(([k, t]) => add('tag', k, `#${t}`));
  row.hidden = row.children.length < 2;
}
function setTab(t) {
  if (tab === t) return;
  tab = t;
  localStorage.setItem(TAB_KEY, t);
  filter = { kind: 'all', value: '' };
  reorderMode = false;
  render();
  window.scrollTo({ top: 0 });
}
function render() {
  const grid = $('cardsGrid');
  grid.replaceChildren();
  $('lastBanner').hidden = true;
  updateBackupInfo();
  updateViewButton();
  const giftN = cards.filter(c => kindOf(c) === 'gift').length;
  $('countGift').textContent = giftN;
  $('countLoyalty').textContent = cards.length - giftN;
  ['Loyalty', 'Gift'].forEach(k => {
    const on = (k === 'Gift') === (tab === 'gift');
    $('tab' + k).classList.toggle('active', on);
    $('tab' + k).setAttribute('aria-selected', on ? 'true' : 'false');
  });
  $('cardCount').textContent = `${cards.length} carte${cards.length > 1 ? 's' : ''}`;
  $('addButton').setAttribute('aria-label', tab === 'gift' ? 'Ajouter une carte cadeau' : 'Ajouter une carte');

  const pool = tabCards();
  const none = pool.length === 0;
  $('emptyState').hidden = !none;
  $('toolbar').hidden = none;
  $('quickGuide').hidden = none || tab !== 'loyalty' ? true : localStorage.getItem(GUIDE_KEY) === '1';
  if (none) {
    $('emptyTitle').textContent = tab === 'gift' ? 'Aucune carte cadeau' : 'Aucune carte de fidélité';
    $('emptyText').textContent = tab === 'gift'
      ? "Ajoute une carte cadeau pour suivre ton solde et l'historique de tes dépenses."
      : 'Ajoute ta première carte de fidélité pour la retrouver en caisse, même sans réseau.';
    $('emptyAddButton').textContent = tab === 'gift' ? 'Ajouter une carte cadeau' : 'Ajouter une carte';
    reorderMode = false;
    $('reorderBar').hidden = true;
  }

  // Résultats de recherche dans l'autre onglet
  const hint = $('otherHint');
  hint.hidden = true;
  const q = norm($('searchInput').value.trim());
  if (q) {
    const other = tab === 'gift' ? 'loyalty' : 'gift';
    const n = cards.filter(c => kindOf(c) === other && searchMatch(c, q)).length;
    if (n) {
      hint.hidden = false;
      hint.textContent = `${n} résultat${n > 1 ? 's' : ''} dans ${other === 'gift' ? 'Cartes cadeaux' : 'Cartes de fidélité'} →`;
      hint.onclick = () => setTab(other);
    }
  }
  if (none) return;

  if (filter.kind !== 'all' && !pool.some(matchesFilter)) filter = { kind: 'all', value: '' };
  renderFilters(pool);
  $('reorderBar').hidden = !reorderMode;
  $('reorderButton').classList.toggle('active', reorderMode);
  grid.classList.toggle('reordering', reorderMode);
  grid.classList.toggle('list', viewMode === 'list');

  const lb = $('lastBanner');
  if (tab === 'loyalty' && !q && filter.kind === 'all' && !reorderMode && pool.length >= 4) {
    const last = pool.filter(c => c.lastUsed).sort((a, b) => b.lastUsed - a.lastUsed)[0];
    if (last) {
      const color = last.color || COLORS[0];
      lb.style.setProperty('--card-color', color);
      lb.style.setProperty('--card-color-dark', darken(color));
      lb.style.setProperty('--card-fg', isLight(color) ? '#14181f' : '#fff');
      const logo = el('div', { class: 'card-logo' }); logo.append(logoNode(last));
      lb.replaceChildren(logo, el('div', {}, el('small', { text: 'Dernière utilisée' }), el('strong', { text: last.name })));
      lb.onclick = () => openDetail(last.id);
      lb.hidden = false;
    }
  }

  const list = sortedFiltered();
  if (!list.length) {
    grid.append(el('p', { class: 'no-result', text: $('searchInput').value ? 'Aucune carte trouvée.' : 'Aucune carte dans ce filtre.' }));
    return;
  }
  list.forEach((c, i) => grid.append(buildCard(c, i)));
}

/* Une carte de la liste (ou son aperçu dans le formulaire) */
function buildCard(c, i = 0, preview = false) {
  const color = c.color || COLORS[0];
  const cat = catById(c.category);
  const spent = isSpent(c);
  const soon = isSoon(c);
  const b = el(preview ? 'div' : 'button', { class: `loyalty-card${isDead(c) ? ' empty' : ''}${preview ? ' preview' : ''}` });
  if (preview) b.setAttribute('aria-hidden', 'true');
  else {
    b.setAttribute('type', 'button');
    b.setAttribute('aria-label', `Ouvrir la carte ${c.name}`);
    b.dataset.id = c.id;
    b.style.animationDelay = `${Math.min(i, 10) * 35}ms`;
  }
  b.style.setProperty('--card-color', color);
  b.style.setProperty('--card-color-dark', darken(color));
  b.style.setProperty('--card-fg', isLight(color) ? '#14181f' : '#fff');
  const logo = el('div', { class: 'card-logo' }); logo.append(logoNode(c));
  const typeText = spent ? 'Épuisée' : isExpired(c) ? 'Expirée' : soon ? expiryText(c) : (cat ? `${cat.emoji} ${cat.name}` : typeLabel(c.codeType));
  b.append(
    el('div', { class: 'card-top' }, logo, (c.fav || c.balance != null) ? el('div', { class: 'card-badges' }, c.balance != null ? el('span', { class: 'card-balance', text: (kindOf(c) === 'loyalty' ? '💰 ' : '') + fmtMoney(c.balance) }) : null, c.fav ? el('span', { class: 'card-fav', text: '★' }) : null) : null),
    el('div', { class: 'card-text' }, el('p', { class: 'card-name', text: c.name }), el('p', { class: `card-type${soon ? ' warn' : ''}`, text: typeText }))
  );
  if (!preview) b.addEventListener('click', () => { if (!reorderMode) openDetail(c.id); });
  return b;
}
function updateViewButton() {
  $('viewButton').innerHTML = ICONS[viewMode === 'list' ? 'grid' : 'list'] + `<span>${viewMode === 'list' ? 'Grille' : 'Liste'}</span>`;
}

/* ---------- Réorganisation par glisser-déposer ---------- */
function setReorder(on) {
  reorderMode = on;
  if (on) {
    if (sortMode !== 'manual') { sortMode = 'manual'; localStorage.setItem(SORT_KEY, sortMode); $('sortSelect').value = 'manual'; }
    ensureOrder(); save();
  }
  render();
}
let drag = null;
function onGridPointerDown(e) {
  if (!reorderMode || (e.pointerType === 'mouse' && e.button !== 0)) return;
  const card = e.target.closest('.loyalty-card');
  if (!card) return;
  const r = card.getBoundingClientRect();
  drag = { card, pid: e.pointerId, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, x: e.clientX, y: e.clientY, active: false, timer: null };
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
  window.addEventListener('pointercancel', onDragEnd);
}
function onDragMove(e) {
  if (!drag || e.pointerId !== drag.pid) return;
  drag.x = e.clientX; drag.y = e.clientY;
  if (!drag.active) {
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
    drag.active = true;
    drag.card.classList.add('dragging');
    vibrate(15);
    drag.timer = setInterval(dragTick, 16);
  }
  e.preventDefault();
  dragUpdate();
}
function dragTick() {
  if (!drag) return;
  if (drag.y < 90) window.scrollBy(0, -14);
  else if (drag.y > innerHeight - 110) window.scrollBy(0, 14);
  dragUpdate();
}
function dragUpdate() {
  const card = drag.card;
  // La carte survolée prend la place de celle qu'on déplace
  const under = document.elementsFromPoint(drag.x, drag.y).find(n => n !== card && n.classList && n.classList.contains('loyalty-card'));
  if (under) {
    if (card.compareDocumentPosition(under) & Node.DOCUMENT_POSITION_FOLLOWING) under.after(card); else under.before(card);
  }
  // La carte suit le doigt
  card.style.transform = 'none';
  const r = card.getBoundingClientRect();
  card.style.transform = `translate(${drag.x - drag.ox - r.left}px, ${drag.y - drag.oy - r.top}px) scale(1.04)`;
}
function onDragEnd(e) {
  if (!drag || e.pointerId !== drag.pid) return;
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
  window.removeEventListener('pointercancel', onDragEnd);
  clearInterval(drag.timer);
  const { card, active } = drag;
  drag = null;
  card.classList.remove('dragging');
  card.style.transform = '';
  if (active) commitOrder();
}
function commitOrder() {
  const ids = [...$('cardsGrid').querySelectorAll('.loyalty-card')].map(n => n.dataset.id);
  const visible = new Set(ids);
  ensureOrder();
  const full = [...cards].sort((a, b) => a.order - b.order);
  const slots = [];
  full.forEach((c, i) => { if (visible.has(c.id)) slots.push(i); });
  ids.forEach((id, k) => { full[slots[k]] = cards.find(c => c.id === id); });
  full.forEach((c, i) => { c.order = i; });
  save();
  render();
}

/* ---------- Pile de fenêtres + bouton Retour du téléphone ---------- */
const LAYERS = {
  form: ['formSheet', 'formBackdrop'],
  theme: ['themeSheet', null],
  menu: ['menuSheet', 'menuBackdrop'],
  detail: ['detailPanel', 'detailBackdrop'],
  scanner: ['scanner', null]
};
const stack = [];
let pendingBack = 0;

function openLayer(name, { replace = false } = {}) {
  const [panel, backdrop] = LAYERS[name];
  $(panel).hidden = false;
  if (backdrop) $(backdrop).hidden = false;
  stack.push(name);
  if (replace) history.replaceState({ layer: name }, ''); else history.pushState({ layer: name }, '');
  document.body.classList.add(name === 'theme' ? 'dock-open' : 'no-scroll');
}
function hideLayer(name) {
  const [panel, backdrop] = LAYERS[name];
  $(panel).hidden = true;
  if (backdrop) $(backdrop).hidden = true;
  if (name === 'form') { editingId = null; $('cagnotteCodeInput').value = ''; }
  if (name === 'detail') cleanupDetail();
  if (name === 'scanner') stopScan();
  if (name === 'theme') { document.body.classList.remove('dock-open'); delete document.body.dataset.hl; persistTheme(); }
  if (!stack.length) document.body.classList.remove('no-scroll');
}
function closeLayer() {
  if (stack.length - pendingBack > 0) { pendingBack++; history.back(); }
}
window.addEventListener('popstate', () => {
  pendingBack = Math.max(0, pendingBack - 1);
  const name = stack.pop();
  if (name) hideLayer(name);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLayer(); });

/* ---------- Formulaire ---------- */
function showForm(id = null) {
  editingId = id;
  const c = id ? cards.find(x => x.id === id) : null;
  $('formTitle').textContent = c ? 'Modifier la carte' : 'Nouvelle carte';
  $('nameInput').value = c?.name || '';
  $('codeInput').value = c?.code || '';
  $('codeTypeInput').value = c?.codeType || 'barcode';
  $('notesInput').value = c?.notes || '';
  $('categoryInput').value = c?.category || '';
  $('expiryInput').value = c?.expires || '';
  $('pinInput').value = c?.pin || '';
  $('pinInput').classList.add('masked');
  $('balanceInput').value = c && c.balance != null ? String(c.balance).replace('.', ',') : '';
  $('cagnotteToggle').checked = !!c && kindOf(c) === 'loyalty' && c.balance != null;
  $('cagnotteCodeInput').value = '';
  $('cagnotteCodeInput').placeholder = c && c.cagnotteCode ? 'Code enregistré · laisse vide pour le garder' : 'Saisis le code';
  $('removeCagnotteCode').hidden = !(c && c.cagnotteCode);
  removeCode = false;
  setFormKind(c ? kindOf(c) : tab);
  selectedColor = c?.color || COLORS[0];
  selectedLogo = c?.logo || null;
  scannedFormat = c?.format || null;
  updateLogoPreview();
  renderColors();
  toggleCodeFields();
  $('templates').hidden = !!c;
  $('advanced').open = !!(c && (c.notes || c.pin || (c.codeType && c.codeType !== 'barcode')));
}
function updateBalanceFields() {
  const show = formKind === 'gift' || (formKind === 'loyalty' && $('cagnotteToggle').checked);
  $('giftFields').hidden = !show;
  $('cagnotteCodeWrap').hidden = formKind !== 'loyalty';
  $('balanceLabel').textContent = formKind === 'gift' ? 'Solde actuel (€)' : 'Cagnotte actuelle (€)';
  $('expiryWrap').hidden = formKind !== 'gift';
  updatePreview();
}
function setFormKind(k) {
  formKind = k;
  document.querySelectorAll('#kindSwitch .seg').forEach(b => b.classList.toggle('active', b.dataset.kind === k));
  $('cagnotteRow').hidden = k !== 'loyalty';
  updateBalanceFields();
  $('formTitle').textContent = editingId ? 'Modifier la carte' : (k === 'gift' ? 'Nouvelle carte cadeau' : 'Nouvelle carte');
}
/* Met à jour le solde d'une carte et l'historique (création, correction manuelle, ou désactivation) */
function applyBalance(card, next) {
  if (next === null) { delete card.balance; delete card.history; return; }
  if (card.kind === 'loyalty') { card.balance = next; delete card.history; return; }   // cagnotte : montant seul
  if (card.balance == null) {
    card.balance = next;
    card.history = [{ t: Date.now(), d: next, a: next, n: 'Solde initial' }];
    return;
  }
  if (Math.abs(card.balance - next) >= 0.005) {
    const d = round2(next - card.balance);
    card.balance = next;
    card.history = [...(card.history || []), { t: Date.now(), d, a: next, n: 'Correction du solde' }].slice(-100);
  }
}
/* Aperçu de la carte pendant la saisie */
function updatePreview() {
  const box = $('formPreview');
  if (!box) return;
  const bal = $('giftFields').hidden ? null : parseAmount($('balanceInput').value, true);
  const tmp = {
    name: $('nameInput').value.trim() || 'Nom du magasin', color: selectedColor, logo: selectedLogo,
    category: $('categoryInput').value, kind: formKind, codeType: $('codeTypeInput').value,
    balance: bal != null ? bal : undefined,
    expires: formKind === 'gift' ? ($('expiryInput').value || undefined) : undefined
  };
  box.replaceChildren(buildCard(tmp, 0, true));
}
function renderTemplates() {
  const box = $('templateList');
  box.replaceChildren();
  TEMPLATES.forEach(t => {
    const b = el('button', { type: 'button', class: 'chip small', text: t.name });
    b.addEventListener('click', () => {
      $('nameInput').value = t.name;
      $('categoryInput').value = t.category;
      selectedColor = t.color;
      renderColors();
    });
    box.append(b);
  });
}
/* Couleur dominante d'un logo (ignore le blanc, le noir et les gris) */
function dominantColor(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const s = 32, cv = document.createElement('canvas');
      cv.width = cv.height = s;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0, s, s);
      const d = ctx.getImageData(0, 0, s, s).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) < 40) continue;
        r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
      }
      if (n < 20) return resolve(null);
      const h = v => Math.round(v / n).toString(16).padStart(2, '0');
      resolve('#' + h(r) + h(g) + h(b));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
function toggleCodeFields() { $('codeFields').hidden = $('codeTypeInput').value === 'none'; }

function renderColors() {
  const row = $('colorRow');
  row.className = 'form-colors';
  const cur = isHex(selectedColor) ? selectedColor.toLowerCase() : COLORS[0];
  selectedColor = cur;
  const dots = el('div', { class: 'color-row', role: 'group', 'aria-label': 'Couleurs rapides' });
  const dotBtns = COLORS.map(c => {
    const d = el('button', { type: 'button', class: `color-dot${c === cur ? ' selected' : ''}`, 'aria-label': `Couleur ${c}` });
    d.style.background = c;
    d.dataset.hex = c;
    d.addEventListener('click', () => { selectedColor = c; renderColors(); });
    dots.append(d);
    return d;
  });
  const picker = buildPicker(cur, hex => {
    selectedColor = hex;
    dotBtns.forEach(d => d.classList.toggle('selected', d.dataset.hex === hex));
    updatePreview();
  });
  row.replaceChildren(dots, picker);
  updatePreview();
}
function updateLogoPreview() {
  const p = $('logoPreview');
  p.replaceChildren();
  if (selectedLogo) { p.append(el('img', { src: selectedLogo, alt: 'Logo sélectionné' })); $('removeLogo').hidden = false; }
  else { const s = el('span', { class: 'ph-icon' }); s.innerHTML = ICONS.store; p.append(s); $('removeLogo').hidden = true; }
  updatePreview();
}
function resizeLogo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const image = new Image();
      image.onload = () => {
        const s = 320, c = document.createElement('canvas');
        c.width = s; c.height = s;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, s, s);
        const k = Math.min(s / image.width, s / image.height), w = image.width * k, h = image.height * k;
        ctx.drawImage(image, (s - w) / 2, (s - h) / 2, w, h);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      image.onerror = reject;
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
function saveCard(e) {
  e.preventDefault();
  const name = $('nameInput').value.trim();
  if (!name) return toast('Ajoute le nom du magasin.');
  const codeType = $('codeTypeInput').value;
  const code = codeType === 'none' ? '' : $('codeInput').value.trim();
  if (codeType !== 'none' && !code) return toast('Ajoute le numéro, ou choisis « Aucun code ».');
  let giftBalance = null;
  if (formKind === 'gift' || (formKind === 'loyalty' && $('cagnotteToggle').checked)) {
    giftBalance = parseAmount($('balanceInput').value, true);
    if (giftBalance === null) return toast(formKind === 'gift' ? 'Indique le solde de la carte (ex. 25,00).' : 'Indique le montant de la cagnotte (ex. 3,20).');
  }
  if (editingId && giftBalance === null) {
    const old = cards.find(c => c.id === editingId);
    if (old && old.balance != null && (old.history || []).length > 1 && !confirm("Retirer le solde ou la cagnotte supprime aussi son historique. Continuer ?")) return;
  }
  // Code cagnotte (undefined = inchangé, null = supprimé)
  let newCode;
  const wantsCag = formKind === 'loyalty' && $('cagnotteToggle').checked;
  const typedCode = $('cagnotteCodeInput').value.trim();
  if (!wantsCag || removeCode) newCode = null;
  else if (typedCode) newCode = typedCode.slice(0, 60);
  const data = { name, code, codeType, color: selectedColor, logo: selectedLogo, notes: $('notesInput').value.trim(), kind: formKind, format: scannedFormat || null, category: $('categoryInput').value, expires: formKind === 'gift' ? ($('expiryInput').value || null) : null, pin: $('pinInput').value.trim().slice(0, 20) || null };
  const backup = JSON.stringify(cards);
  let target;
  if (editingId) { target = cards.find(c => c.id === editingId); Object.assign(target, data); }
  else { target = { id: uid(), ...data, createdAt: Date.now(), fav: false, uses: 0, order: Math.max(-1, ...cards.map(c => (typeof c.order === 'number' ? c.order : -1))) + 1 }; cards.push(target); }
  applyBalance(target, giftBalance);
  if (newCode === null) delete target.cagnotteCode; else if (newCode) target.cagnotteCode = newCode;
  if (formKind !== tab) { tab = formKind; localStorage.setItem(TAB_KEY, tab); filter = { kind: 'all', value: '' }; reorderMode = false; }
  if (!save()) { cards = JSON.parse(backup); return toast('Stockage plein : choisis un logo plus léger.'); }
  render();
  closeLayer();
  toast('Carte enregistrée ✓');
}

/* ---------- Fiche carte ---------- */
function guessFormat(code) {
  if (/^\d{13}$/.test(code)) return 'EAN13';
  if (/^\d{12}$/.test(code)) return 'UPC';
  if (/^\d{8}$/.test(code)) return 'EAN8';
  return 'CODE128';
}
function drawBarcode(code, format) {
  const svg = $('barcodeSvg');
  svg.replaceChildren();
  svg.removeAttribute('viewBox');
  const tryFormat = f => JsBarcode(svg, code, { format: f, displayValue: false, height: 90, width: 2, margin: 6, background: '#ffffff', lineColor: '#000000' });
  try { tryFormat(format || guessFormat(code)); }
  catch { tryFormat('CODE128'); }
  // Rend le SVG fluide : on remplace width/height par un viewBox
  const w = svg.getAttribute('width'), h = svg.getAttribute('height');
  if (w && h) { svg.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`); svg.removeAttribute('width'); svg.removeAttribute('height'); }
}
function openDetail(id) {
  const c = cards.find(x => x.id === id);
  if (!c) return;
  openedId = id;
  c.uses = (c.uses || 0) + 1;
  c.lastUsed = Date.now();
  save();

  $('detailName').textContent = c.name;
  const color = c.color || COLORS[0];
  const dp = $('detailPanel');
  dp.style.setProperty('--card-color', color);
  dp.style.setProperty('--card-color-dark', darken(color));
  dp.style.setProperty('--card-fg', isLight(color) ? '#14181f' : '#fff');
  syncThemeColor(color);
  $('detailMenu').hidden = true;
  refreshPinRow(c);
  $('detailType').textContent = typeLabel(c.codeType);
  $('detailLogo').replaceChildren(logoNode(c));
  $('detailCode').textContent = c.code || '';
  $('detailNotes').hidden = !c.notes;
  $('detailNotes').textContent = c.notes || '';
  $('copyCode').hidden = !c.code;
  syncFavButton(c);
  renderDetailMeta(c);
  renderBalance(c);

  const box = $('codeBox');
  const svg = $('barcodeSvg'), qr = $('qrHolder');
  svg.style.display = 'none'; qr.replaceChildren();
  let hasCode = false;
  if (c.code && c.codeType === 'barcode' && window.JsBarcode) {
    try { svg.style.display = 'block'; drawBarcode(c.code, c.format); hasCode = true; }
    catch { svg.style.display = 'none'; toast('Ce numéro ne peut pas être affiché en code-barres.'); }
  }
  if (c.code && c.codeType === 'qrcode' && window.QRCode) {
    new QRCode(qr, { text: c.code, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
    hasCode = true;
  }
  if (c.code && !hasCode && c.codeType !== 'none') hasCode = true; // au moins le numéro
  box.hidden = !hasCode;
  box.classList.remove('big');

  openLayer('detail');
  keepAwake();
}
function renderDetailMeta(c) {
  const box = $('detailMeta');
  box.replaceChildren();
  const cat = catById(c.category);
  if (cat) box.append(el('span', { class: 'tag cat', text: `${cat.emoji} ${cat.name}` }));
  const n = dayDiff(c);
  if (n !== null && kindOf(c) === 'gift') {
    const when = new Date(c.expires + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    box.append(el('span', { class: `tag${n <= 30 ? ' warn' : ''}`, text: n < 0 ? `Expirée le ${when}` : `Expire le ${when}` }));
  }
  (c.tags || []).forEach(t => box.append(el('span', { class: 'tag', text: `#${t}` })));
  box.hidden = !box.children.length;
}
function renderBalance(c) {
  const box = $('balanceBox');
  const isCag = c.balance != null && kindOf(c) === 'loyalty';
  $('cagnotteBox').hidden = !isCag;
  if (isCag) { $('cagnotteValue').textContent = fmtMoney(c.balance); closeCagnotteEditor(); refreshCodeRow(c); }
  box.hidden = c.balance == null || isCag;
  if (c.balance == null || isCag) return;
  const L = opLabels(c);
  $('balanceCaption').textContent = L.cap;
  $('spendButton').textContent = L.spendBtn;
  $('topupButton').textContent = L.topupBtn;
  $('balanceValue').textContent = fmtMoney(c.balance);
  const top = Math.max(c.balance, ...(c.history || []).map(h => h.a || 0));
  $('balanceBar').style.width = `${top > 0 ? Math.max(0, Math.min(100, c.balance / top * 100)) : 0}%`;
  $('amountInput').value = '';
  $('amountNote').value = '';
  $('historyList').hidden = true;
  const list = $('historyList');
  list.replaceChildren();
  const items = [...(c.history || [])].reverse();
  if (!items.length) list.append(el('li', { class: 'history-empty', text: 'Aucune opération.' }));
  items.forEach(h => list.append(el('li', {},
    el('span', {}, el('strong', { text: h.n || (h.d < 0 ? L.spend : L.topup) }), el('small', { text: fmtDate(h.t) })),
    el('span', { class: `h-amount ${h.d < 0 ? 'neg' : 'pos'}`, text: `${h.d < 0 ? '−' : '+'}${fmtMoney(Math.abs(h.d))}` }))));
  $('undoLast').hidden = (c.history || []).length < 2;
}
/* Cagnotte d'une carte de fidélité : on modifie simplement le montant */
function openCagnotteEditor() {
  const c = cards.find(x => x.id === openedId);
  if (!c || c.balance == null) return;
  $('cagnotteInput').value = String(c.balance).replace('.', ',');
  $('cagnotteView').hidden = true;
  $('cagnotteEditor').hidden = false;
  $('cagnotteInput').focus();
  $('cagnotteInput').select();
}
function closeCagnotteEditor() { $('cagnotteEditor').hidden = true; $('cagnotteView').hidden = false; }
function saveCagnotte() {
  const c = cards.find(x => x.id === openedId);
  if (!c || c.balance == null) return;
  const value = parseAmount($('cagnotteInput').value, true);
  if (value === null) return toast('Entre un montant valide (ex. 3,20).');
  const before = c.balance;
  c.balance = value;
  delete c.history;
  if (!save()) { c.balance = before; return toast("Stockage plein : impossible d'enregistrer."); }
  vibrate(20);
  $('cagnotteValue').textContent = fmtMoney(value);
  closeCagnotteEditor();
  toast('Cagnotte mise à jour ✓');
}
function balanceOp(sign) {
  const c = cards.find(x => x.id === openedId);
  if (!c || c.balance == null || kindOf(c) !== 'gift') return;
  const amount = parseAmount($('amountInput').value);
  if (amount === null) return toast('Entre un montant valide (ex. 12,50).');
  if (sign < 0 && amount > c.balance + 0.004) return toast('Le montant dépasse le solde restant.');
  const before = { balance: c.balance, history: c.history };
  const d = round2(sign * amount);
  c.balance = round2(c.balance + d);
  c.history = [...(c.history || []), { t: Date.now(), d, a: c.balance, n: $('amountNote').value.trim().slice(0, 40) || (sign < 0 ? opLabels(c).spend : opLabels(c).topup) }].slice(-100);
  if (!save()) { Object.assign(c, before); return toast('Stockage plein : impossible d\'enregistrer.'); }
  vibrate(20);
  renderBalance(c);
  $('historyList').hidden = false;
  toast(sign < 0 ? `${fmtMoney(amount)} déduits ✓` : `${fmtMoney(amount)} ajoutés ✓`);
}
function undoLastOp() {
  const c = cards.find(x => x.id === openedId);
  if (!c || c.balance == null || kindOf(c) !== 'gift' || (c.history || []).length < 2) return;
  const last = c.history[c.history.length - 1];
  c.history = c.history.slice(0, -1);
  c.balance = round2(c.balance - last.d);
  save();
  renderBalance(c);
  $('historyList').hidden = false;
  toast('Dernière opération annulée');
}
function cleanupDetail() {
  openedId = null;
  maskCode();
  maskPin();
  $('detailMenu').hidden = true;
  syncThemeColor();
  $('codeBox').classList.remove('big');
  $('detailPanel').classList.remove('code-big');
  releaseAwake();
  render(); // met à jour l'ordre (récentes / utilisées)
}
function syncFavButton(c) {
  setIcon($('favCard'), c.fav ? 'starFill' : 'star');
  $('favCard').setAttribute('aria-pressed', c.fav ? 'true' : 'false');
}
function toggleBig() {
  const box = $('codeBox');
  const big = box.classList.toggle('big');
  $('detailPanel').classList.toggle('code-big', big);
  $('codeHint').textContent = big ? 'Touche pour réduire' : 'Touche pour agrandir';
  box.setAttribute('aria-label', big ? 'Réduire le code' : 'Agrandir le code');
}

/* Garde l'écran allumé pendant que la carte est affichée en caisse */
async function keepAwake() {
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch {}
}
function releaseAwake() { try { wakeLock && wakeLock.release(); } catch {} wakeLock = null; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && openedId) keepAwake(); });

/* ---------- Scanner ---------- */
const FORMAT_MAP = { ean_13: 'EAN13', ean_8: 'EAN8', upc_a: 'UPC', upc_e: 'UPC', code_128: 'CODE128', code_39: 'CODE39' };
const ZX_FORMAT_MAP = { EAN_13: 'EAN13', EAN_8: 'EAN8', UPC_A: 'UPC', UPC_E: 'UPC', CODE_128: 'CODE128', CODE_39: 'CODE39' };
const ZX_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
const hasNativeDetector = 'BarcodeDetector' in window;
let zxReader = null;
/* Safari iOS et Firefox n'ont pas BarcodeDetector : on charge ZXing à la demande */
function loadZXing() {
  if (window.ZXing) return Promise.resolve(window.ZXing);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = ZX_URL;
    s.onload = () => (window.ZXing ? resolve(window.ZXing) : reject(new Error('zxing')));
    s.onerror = () => reject(new Error('zxing'));
    document.head.append(s);
  });
}
function zxResult(r, ZX) {
  const name = ZX.BarcodeFormat[r.getBarcodeFormat()];
  return { raw: r.getText(), isQr: name === 'QR_CODE', format: ZX_FORMAT_MAP[name] || null };
}
function applyScanned(raw, isQr, format) {
  $('codeInput').value = raw;
  $('codeTypeInput').value = isQr ? 'qrcode' : 'barcode';
  scannedFormat = isQr ? null : (format || null);
  toggleCodeFields();
  updatePreview();
  vibrate(30);
}
async function openScanner() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return toast('Scanner indisponible sur ce navigateur : saisis le numéro à la main.');
  }
  openLayer('scanner');
  try {
    if (hasNativeDetector) {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      $('scanVideo').srcObject = stream;
      const detector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39'] });
      scanTimer = setInterval(async () => {
        try {
          const result = await detector.detect($('scanVideo'));
          if (!result.length || !stack.includes('scanner')) return;
          applyScanned(result[0].rawValue, result[0].format === 'qr_code', FORMAT_MAP[result[0].format]);
          closeLayer();
          toast('Code trouvé ✓');
        } catch {}
      }, 300);
    } else {
      const ZX = await loadZXing();
      if (!stack.includes('scanner')) return;
      zxReader = new ZX.BrowserMultiFormatReader();
      await zxReader.decodeFromConstraints({ video: { facingMode: 'environment' } }, $('scanVideo'), result => {
        if (!result || !stack.includes('scanner')) return;
        const r = zxResult(result, ZX);
        applyScanned(r.raw, r.isQr, r.format);
        closeLayer();
        toast('Code trouvé ✓');
      });
    }
  } catch {
    if (stack.includes('scanner')) closeLayer();
    toast('Scanner indisponible : autorise la caméra ou saisis le numéro.');
  }
}
function stopScan() {
  if (scanTimer) clearInterval(scanTimer);
  scanTimer = null;
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  if (zxReader) { try { zxReader.reset(); } catch {} zxReader = null; }
}

/* ---------- Lecture d'un code depuis une image ---------- */
async function readCodeFromImage(file) {
  let found = null;
  if (hasNativeDetector) {
    let bitmap;
    try { bitmap = await createImageBitmap(file); } catch { return toast('Image impossible à lire.'); }
    toast("Lecture de l'image…");
    const detector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39'] });
    // On essaie la taille d'origine, puis des versions réduites / agrandies (les captures d'écran sont souvent très grandes)
    for (const scale of [1, 0.6, 0.35, 1.8]) {
      try {
        let src = bitmap;
        if (scale !== 1) {
          const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
          if (w < 150 || h < 150 || Math.max(w, h) > 3500) continue;
          const cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          const ctx = cv.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
          ctx.drawImage(bitmap, 0, 0, w, h);
          src = cv;
        }
        const res = await detector.detect(src);
        if (res.length) { found = { raw: res[0].rawValue, isQr: res[0].format === 'qr_code', format: FORMAT_MAP[res[0].format] }; break; }
      } catch {}
    }
    if (bitmap.close) bitmap.close();
  } else {
    toast("Lecture de l'image…");
    const url = URL.createObjectURL(file);
    try {
      const ZX = await loadZXing();
      found = zxResult(await new ZX.BrowserMultiFormatReader().decodeFromImageUrl(url), ZX);
    } catch {}
    URL.revokeObjectURL(url);
  }
  if (!found) return toast('Aucun code détecté. Essaie une image plus nette, recadrée sur le code.');
  applyScanned(found.raw, found.isQr, found.format);
  toast('Code trouvé ✓');
}

/* ---------- Forcer la mise à jour ---------- */
async function forceUpdate() {
  if (!confirm("Forcer la mise à jour ? L'app va se recharger. Tes cartes ne sont pas supprimées.")) return;
  toast('Mise à jour en cours…');
  const clearCaches = async () => {
    if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); }
  };
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    await clearCaches();
    // Recharge les fichiers depuis le serveur (en ignorant aussi le cache HTTP du navigateur)
    await Promise.all(['./', 'index.html', 'app.js', 'style.css', 'manifest.json', 'sw.js'].map(f => fetch(f, { cache: 'reload' }).catch(() => {})));
    await clearCaches();
  } catch {}
  location.replace(location.pathname + '?maj=' + Date.now());
}
function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) {
          toast('Nouvelle version prête', { label: 'Recharger', run: () => location.reload() });
        }
      });
    });
    // Quand tu reviens sur l'app, on vérifie s'il existe une version plus récente
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
}

/* ---------- Code cagnotte : afficher / masquer ---------- */
function maskCode() {
  $('cagnotteCodeText').textContent = '••••••';
  setIcon($('cagnotteCodeShow'), 'eye');
  $('cagnotteCodeShow').setAttribute('aria-label', 'Afficher le code');
  $('cagnotteCodeShow').dataset.shown = '';
}
/* ---------- Verrouillage biométrique du code cagnotte (réglage) ---------- */
const bioOn = () => !!localStorage.getItem(BIO_KEY);
const toB64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function updateBioButton() {
  $('bioState').textContent = bioOn() ? 'Activé : empreinte, visage ou code du téléphone demandé' : 'Désactivé';
  setIcon($('bioIcon'), bioOn() ? 'lock' : 'unlock');
}
async function bioEnable() {
  if (!window.PublicKeyCredential) return toast('Biométrie indisponible sur ce navigateur.');
  let ok = false;
  try { ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch {}
  if (!ok) return toast("Aucun verrouillage d'écran (empreinte, visage ou code) détecté sur ce téléphone.");
  try {
    const cred = await navigator.credentials.create({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'Mes cartes' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'mes-cartes', displayName: 'Mes cartes' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      timeout: 60000
    } });
    localStorage.setItem(BIO_KEY, toB64u(cred.rawId));
    toast('Verrouillage activé ✓');
  } catch { toast('Activation annulée.'); }
  updateBioButton();
}
/* Renvoie true si le code peut être affiché (réglage désactivé, ou déverrouillage réussi) */
async function bioUnlock() {
  if (!bioOn()) return true;
  try {
    await navigator.credentials.get({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: 'public-key', id: b64dec(localStorage.getItem(BIO_KEY)), transports: ['internal'] }],
      userVerification: 'required', timeout: 60000
    } });
    return true;
  } catch { toast('Déverrouillage annulé.'); return false; }
}
async function toggleBio() {
  if (bioOn()) {
    if (!(await bioUnlock())) return;
    localStorage.removeItem(BIO_KEY);
    toast('Verrouillage désactivé');
    updateBioButton();
  } else await bioEnable();
}

/* PIN de la carte : masqué par défaut */
function maskPin() {
  $('pinText').textContent = '••••';
  setIcon($('pinShow'), 'eye');
  $('pinShow').dataset.shown = '';
  $('pinShow').setAttribute('aria-label', 'Afficher le PIN');
}
function refreshPinRow(c) { maskPin(); $('pinRow').hidden = !c.pin; }
const isLegacyCode = c => !!c.cagnotteCode && typeof c.cagnotteCode === 'object';   // ancien format chiffré
function refreshCodeRow(c) {
  maskCode();
  $('cagnotteCodeRow').hidden = !c.cagnotteCode;
  if (isLegacyCode(c)) {
    $('cagnotteCodeText').textContent = 'Ancien code protégé';
    setIcon($('cagnotteCodeShow'), 'unlock');
    $('cagnotteCodeShow').setAttribute('aria-label', 'Convertir les anciens codes');
  }
}
async function toggleCode() {
  const c = cards.find(x => x.id === openedId);
  if (!c || !c.cagnotteCode) return;
  if (isLegacyCode(c)) return convertLegacyCodes();
  const btn = $('cagnotteCodeShow');
  if (btn.dataset.shown === '1') return maskCode();
  if (!(await bioUnlock())) return;
  $('cagnotteCodeText').textContent = c.cagnotteCode;
  setIcon(btn, 'eyeOff');
  btn.setAttribute('aria-label', 'Masquer le code');
  btn.dataset.shown = '1';
}

/* ---------- Anciens codes protégés : conversion unique ----------
   Les versions précédentes chiffraient les codes cagnotte (empreinte + code de secours).
   Ce bloc ne sert qu'à les convertir en texte simple, une seule fois, puis il n'est plus utilisé. */
const b64dec = str => { const s = str.replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(s + '='.repeat((4 - s.length % 4) % 4)), ch => ch.charCodeAt(0)); };
const decryptBlob = (key, w) => crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64dec(w.iv) }, key, b64dec(w.ct)).then(b => new Uint8Array(b));
const aesKey = (raw, usage = ['decrypt']) => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, usage);
function loadVault() { try { return JSON.parse(localStorage.getItem(VAULT_KEY) || 'null'); } catch { return null; } }
async function legacyMasterKey(vault) {
  if (vault.wrapPrf && vault.credId && window.PublicKeyCredential) {
    try {
      const a = await navigator.credentials.get({ publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: b64dec(vault.credId) }],
        userVerification: 'required', timeout: 60000,
        extensions: { prf: { eval: { first: b64dec(vault.prfSalt) } } }
      } });
      const out = a.getClientExtensionResults().prf?.results?.first;
      if (out) {
        const base = await crypto.subtle.importKey('raw', new Uint8Array(out), 'HKDF', false, ['deriveKey']);
        const k = await crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode('mes-cartes-wrap-v1') }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
        return await decryptBlob(k, vault.wrapPrf);
      }
    } catch {}
  }
  const code = prompt('Entre ton code de secours (XXXXX-XXXXX-XXXXX-XXXXX) pour convertir tes anciens codes :');
  if (!code) return null;
  try {
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(clean), 'PBKDF2', false, ['deriveKey']);
    const k = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b64dec(vault.recSalt), iterations: 250000 }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    return await decryptBlob(k, vault.wrapRec);
  } catch { toast('Code de secours incorrect.'); return null; }
}
async function convertLegacyCodes() {
  const vault = loadVault();
  // Ne jamais effacer des codes si la clé de déchiffrement est introuvable.
  if (!vault) return toast('Protection ancienne introuvable : les codes sont conservés. Restaure ta sauvegarde de protection.');
  const raw = await legacyMasterKey(vault);
  if (!raw) return;
  const key = await aesKey(raw);
  const updates = [];
  let failed = 0;
  try {
    for (const c of cards) {
      if (!isLegacyCode(c)) continue;
      try {
        const value = new TextDecoder().decode(await decryptBlob(key, c.cagnotteCode));
        updates.push({ id: c.id, value });
      } catch { failed++; }
    }
  } finally {
    raw.fill(0);
  }
  // Conversion atomique en mémoire : ne jamais supprimer les codes indéchiffrables.
  if (failed) return toast(`${failed} code(s) non déchiffré(s) : aucune conversion effectuée, tes codes sont conservés.`);
  const original = cards.map(c => ({ ...c }));
  for (const { id, value } of updates) {
    const c = cards.find(x => x.id === id);
    if (c) c.cagnotteCode = value;
  }
  if (!save()) {
    cards = original;
    return toast('Stockage plein : conversion annulée, anciens codes conservés.');
  }
  // Ne pas effacer le coffre historique : il peut encore servir à restaurer
  // une ancienne sauvegarde et sa suppression serait irréversible.
  render();
  const cur = cards.find(x => x.id === openedId);
  if (cur) refreshCodeRow(cur);
  toast(`${updates.length} code(s) converti(s) ✓ Conserve ta sauvegarde de secours.`);
}

/* ---------- Sauvegarde (export / import) ---------- */
/* Rappel de sauvegarde : jamais sauvegardé (cartes de plus de 7 jours) ou dernière sauvegarde de plus de 30 jours */
function updateBackupInfo() {
  const t = Number(localStorage.getItem(BACKUP_KEY)) || 0;
  const age = t ? Math.floor((Date.now() - t) / 864e5) : null;
  $('backupNote').textContent = age === null ? 'Aucune sauvegarde faite sur cet appareil.'
    : age === 0 ? "Dernière sauvegarde : aujourd'hui." : `Dernière sauvegarde : il y a ${age} jour${age > 1 ? 's' : ''}.`;
  let show = false;
  if (cards.length) {
    const oldest = Math.min(...cards.map(c => c.createdAt || 0));
    const cardAge = Math.floor((Date.now() - oldest) / 864e5);
    show = age === null ? cardAge >= 7 : age >= 30;
    if (Number(localStorage.getItem(SNOOZE_KEY)) > Date.now()) show = false;
  }
  $('backupBanner').hidden = !show;
  if (show) $('backupText').textContent = age === null ? "Tes cartes ne sont pas sauvegardées." : `Dernière sauvegarde il y a ${age} jours.`;
}
function exportCards() {
  if (!cards.length) return toast('Aucune carte à exporter.');
  const payload = { app: 'mes-cartes', version: 5, exportedAt: new Date().toISOString(), cards, colors: savedColors };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `mes-cartes-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  try { localStorage.setItem(BACKUP_KEY, String(Date.now())); localStorage.removeItem(SNOOZE_KEY); } catch {}
  updateBackupInfo();
  toast('Sauvegarde téléchargée ✓');
}
async function importCards(file) {
  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : data.cards;
    if (!Array.isArray(list)) throw new Error('format');
    if (Array.isArray(data.colors)) {
      data.colors.forEach(c => {
        if (c && isHex(c.hex) && savedColors.length < 36 && !savedColors.some(x => x.hex === c.hex.toLowerCase())) savedColors.push({ hex: c.hex.toLowerCase(), name: String(c.name || '').slice(0, 24) });
      });
      persistSavedColors();
    }
    const known = new Set(cards.map(c => c.id));
    const sig = c => `${norm(c.name)}|${c.code}`;
    const sigs = new Set(cards.filter(c => c.code).map(sig));
    const added = list.filter(c => {
      if (!c || typeof c.name !== 'string' || !c.name || known.has(c.id)) return false;
      if (c.code) { const k = sig(c); if (sigs.has(k)) return false; sigs.add(k); }   // même nom + même numéro = doublon
      return true;
    })
      .map(c => ({ ...c, order: undefined, id: c.id || uid(), color: /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : COLORS[0], category: catById(c.category) ? c.category : '', tags: Array.isArray(c.tags) ? c.tags.slice(0, 8).map(t => String(t).slice(0, 20)) : [], balance: Number.isFinite(c.balance) ? round2(c.balance) : undefined, history: Number.isFinite(c.balance) && c.kind !== 'loyalty' && Array.isArray(c.history) ? c.history.filter(h => h && Number.isFinite(h.d)).slice(-100).map(h => ({ t: +h.t || 0, d: round2(h.d), a: round2(+h.a || 0), n: String(h.n || '').slice(0, 40) })) : undefined, kind: (c.kind === 'gift' || c.kind === 'loyalty') ? c.kind : (Number.isFinite(c.balance) ? 'gift' : 'loyalty'), cagnotteCode: typeof c.cagnotteCode === 'string' ? c.cagnotteCode.slice(0, 60) : undefined, expires: /^\d{4}-\d{2}-\d{2}$/.test(c.expires || '') ? c.expires : undefined, pin: typeof c.pin === 'string' ? c.pin.slice(0, 20) : undefined }));
    const backup = JSON.stringify(cards);
    cards.push(...added);
    ensureOrder();
    if (!save()) { cards = JSON.parse(backup); return toast('Stockage plein : import impossible.'); }
    render();
    toast(added.length ? `${added.length} carte${added.length > 1 ? 's' : ''} importée${added.length > 1 ? 's' : ''} ✓` : 'Aucune nouvelle carte dans ce fichier.');
  } catch { toast('Fichier de sauvegarde invalide.'); }
}

/* ---------- Événements ---------- */
$('addButton').addEventListener('click', () => { showForm(); openLayer('form'); });
$('emptyAddButton').addEventListener('click', () => { showForm(); openLayer('form'); });
$('closeForm').addEventListener('click', closeLayer);
$('cancelForm').addEventListener('click', closeLayer);
$('formBackdrop').addEventListener('click', closeLayer);
$('cardForm').addEventListener('submit', saveCard);
$('codeTypeInput').addEventListener('change', toggleCodeFields);
$('codeInput').addEventListener('input', () => { scannedFormat = null; });

$('searchInput').addEventListener('input', render);
$('sortSelect').addEventListener('change', e => {
  sortMode = e.target.value;
  localStorage.setItem(SORT_KEY, sortMode);
  if (sortMode === 'manual') { ensureOrder(); save(); } else reorderMode = false;
  render();
});
$('reorderButton').addEventListener('click', () => setReorder(!reorderMode));
$('reorderDone').addEventListener('click', () => setReorder(false));
$('cardsGrid').addEventListener('pointerdown', onGridPointerDown);
$('cardsGrid').addEventListener('contextmenu', e => { if (reorderMode) e.preventDefault(); });
$('imageButton').addEventListener('click', () => $('imageInput').click());
$('imageInput').addEventListener('change', async e => { const f = e.target.files[0]; if (f) await readCodeFromImage(f); e.target.value = ''; });
$('forceUpdateButton').addEventListener('click', forceUpdate);
$('cagnotteCodeShow').addEventListener('click', toggleCode);
$('cagnotteCodeEye').addEventListener('click', () => $('cagnotteCodeInput').classList.toggle('masked'));
$('removeCagnotteCode').addEventListener('click', () => {
  removeCode = true;
  $('removeCagnotteCode').hidden = true;
  $('cagnotteCodeInput').value = '';
  $('cagnotteCodeInput').placeholder = "Le code sera retiré à l'enregistrement";
});

$('cagnotteToggle').addEventListener('change', updateBalanceFields);
$('cagnotteEdit').addEventListener('click', openCagnotteEditor);
$('cagnotteCancel').addEventListener('click', closeCagnotteEditor);
$('cagnotteSave').addEventListener('click', saveCagnotte);
$('cagnotteInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); saveCagnotte(); }
  else if (e.key === 'Escape') { e.stopPropagation(); closeCagnotteEditor(); }
});
$('kindSwitch').addEventListener('click', e => { const b = e.target.closest('.seg'); if (b) setFormKind(b.dataset.kind); });
$('tabLoyalty').addEventListener('click', () => setTab('loyalty'));
$('tabGift').addEventListener('click', () => setTab('gift'));
$('spendButton').addEventListener('click', () => balanceOp(-1));
$('topupButton').addEventListener('click', () => balanceOp(1));
$('toggleHistory').addEventListener('click', () => { $('historyList').hidden = !$('historyList').hidden; });
$('undoLast').addEventListener('click', undoLastOp);

$('hideGuide').addEventListener('click', () => { $('quickGuide').hidden = true; localStorage.setItem(GUIDE_KEY, '1'); });
$('showGuideButton').addEventListener('click', () => { localStorage.removeItem(GUIDE_KEY); render(); closeLayer(); });

$('chooseLogo').addEventListener('click', () => $('logoInput').click());
$('logoPreview').addEventListener('click', () => $('logoInput').click());
$('logoInput').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    selectedLogo = await resizeLogo(file);
    const col = selectedColor === COLORS[0] ? await dominantColor(selectedLogo) : null;
    if (col) { selectedColor = col; renderColors(); }
    updateLogoPreview();
    toast(col ? 'Logo ajouté, couleur reprise ✓' : 'Logo ajouté ✓');
  }
  catch { toast('Image impossible à utiliser.'); }
  e.target.value = '';
});
$('removeLogo').addEventListener('click', () => { selectedLogo = null; updateLogoPreview(); });

$('wpInput').addEventListener('change', async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const url = await resizeWallpaper(f);
    localStorage.setItem(WP_KEY, url);
    wallpaper = url;
    applyTheme(); renderThemes();
    toast('Fond d\u2019écran ajouté ✓');
  } catch { toast('Image illisible ou stockage plein.'); }
});
$('themeButton').addEventListener('click', () => {
  themeSnap = { theme: { ...theme }, wallpaper };
  themeTab = 'colors'; themeTarget = 'accent'; themeAdv = false;
  renderThemes();
  openLayer('theme');
});
$('themeDone').addEventListener('click', closeLayer);
$('themeCancel').addEventListener('click', () => {
  if (themeSnap) {
    theme = { ...themeSnap.theme };
    wallpaper = themeSnap.wallpaper;
    try { if (wallpaper) localStorage.setItem(WP_KEY, wallpaper); else localStorage.removeItem(WP_KEY); } catch {}
    persistTheme();
    applyTheme();
  }
  closeLayer();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (theme.mode === 'auto') applyTheme(); });

$('menuButton').addEventListener('click', () => openLayer('menu'));
$('closeMenu').addEventListener('click', closeLayer);
$('menuBackdrop').addEventListener('click', closeLayer);
$('exportButton').addEventListener('click', exportCards);
$('importButton').addEventListener('click', () => $('importInput').click());
$('importInput').addEventListener('change', async e => { const f = e.target.files[0]; if (f) await importCards(f); e.target.value = ''; });
$('installButton').addEventListener('click', async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice.catch(() => {});
  installEvent = null; $('installButton').hidden = true;
});
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e; $('installButton').hidden = false; });
window.addEventListener('appinstalled', () => { installEvent = null; $('installButton').hidden = true; });

$('closeDetail').addEventListener('click', closeLayer);
$('closeDetailButton').addEventListener('click', closeLayer);
$('detailBackdrop').addEventListener('click', closeLayer);
$('codeBox').addEventListener('click', toggleBig);
$('codeBox').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBig(); } });
$('favCard').addEventListener('click', () => {
  const c = cards.find(x => x.id === openedId);
  if (!c) return;
  c.fav = !c.fav; save(); syncFavButton(c); vibrate();
  toast(c.fav ? 'Ajoutée aux favoris ★' : 'Retirée des favoris');
});
$('copyCode').addEventListener('click', async () => {
  const c = cards.find(x => x.id === openedId);
  if (!c) return;
  try { await navigator.clipboard.writeText(c.code); toast('Numéro copié ✓'); }
  catch { toast('Copie impossible.'); }
});
$('editCard').addEventListener('click', () => {
  const id = openedId;
  // On remplace la fiche par le formulaire dans l'historique (pas de pile en plus)
  stack.pop(); hideLayer('detail');
  showForm(id);
  openLayer('form', { replace: true });
});
$('deleteCard').addEventListener('click', () => {
  const idx = cards.findIndex(c => c.id === openedId);
  if (idx < 0 || !confirm('Supprimer cette carte ?')) return;
  const [removed] = cards.splice(idx, 1);
  save();
  closeLayer();
  toast('Carte supprimée.', {
    label: 'Annuler',
    run: () => { cards.splice(Math.min(idx, cards.length), 0, removed); save(); render(); }
  });
});

$('scanButton').addEventListener('click', openScanner);
$('closeScanner').addEventListener('click', closeLayer);

/* ---------- v5 : recherche repliée, vue, rappel, PIN, menu ⋯, glisser pour fermer ---------- */
$('searchToggle').addEventListener('click', () => {
  const box = $('searchBox');
  if (box.hidden) { box.hidden = false; $('searchInput').focus(); }
  else { $('searchInput').value = ''; box.hidden = true; render(); }
});
$('bioButton').addEventListener('click', toggleBio);
$('viewButton').addEventListener('click', () => {
  viewMode = viewMode === 'list' ? 'grid' : 'list';
  localStorage.setItem(VIEW_KEY, viewMode);
  render();
});
$('backupNow').addEventListener('click', exportCards);
$('backupLater').addEventListener('click', () => {
  try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + 7 * 864e5)); } catch {}
  $('backupBanner').hidden = true;
});
['nameInput', 'categoryInput', 'balanceInput', 'expiryInput', 'codeTypeInput'].forEach(id => $(id).addEventListener('input', updatePreview));
$('pinEye').addEventListener('click', () => $('pinInput').classList.toggle('masked'));
$('pinShow').addEventListener('click', () => {
  const c = cards.find(x => x.id === openedId);
  if (!c || !c.pin) return;
  const b = $('pinShow');
  if (b.dataset.shown === '1') return maskPin();
  $('pinText').textContent = c.pin;
  setIcon(b, 'eyeOff');
  b.setAttribute('aria-label', 'Masquer le PIN');
  b.dataset.shown = '1';
});
$('moreCard').addEventListener('click', e => { e.stopPropagation(); $('detailMenu').hidden = !$('detailMenu').hidden; });
$('detailPanel').addEventListener('click', () => { $('detailMenu').hidden = true; });
/* Glisser la fiche vers le bas pour la fermer */
let swipe = null;
$('detailHero').addEventListener('touchstart', e => {
  if ($('detailPanel').scrollTop > 0 || e.touches.length !== 1) return;
  swipe = { y: e.touches[0].clientY, dy: 0 };
}, { passive: true });
$('detailHero').addEventListener('touchmove', e => {
  if (!swipe) return;
  swipe.dy = Math.max(0, e.touches[0].clientY - swipe.y);
  const p = $('detailPanel');
  p.style.transition = 'none';
  p.style.transform = `translateY(${swipe.dy}px)`;
}, { passive: true });
$('detailHero').addEventListener('touchend', () => {
  if (!swipe) return;
  const p = $('detailPanel'), far = swipe.dy > 110;
  swipe = null;
  p.style.transition = 'transform .2s ease';
  p.style.transform = '';
  if (far) closeLayer();
});

/* ---------- Raccourcis du manifest (appui long sur l'icône) ---------- */
function handleLaunchAction() {
  const action = new URLSearchParams(location.search).get('action');
  if (!action) return;
  history.replaceState(null, '', location.pathname); // nettoie l'URL
  if (action === 'add') {
    showForm(); openLayer('form');
  } else if (action === 'favorites') {
    filter = { kind: 'fav', value: '' };
    render();
  } else if (action === 'last') {
    const last = [...cards].filter(c => c.lastUsed).sort((a, b) => b.lastUsed - a.lastUsed)[0];
    if (last) openDetail(last.id); else toast("Aucune carte utilisée pour l'instant.");
  }
}

/* ---------- Démarrage ---------- */
$('categoryInput').replaceChildren(
  el('option', { value: '', text: 'Aucune catégorie' }),
  ...CATEGORIES.map(c => el('option', { value: c.id, text: `${c.emoji} ${c.name}` }))
);
$('versionNote').textContent = `Version ${APP_VERSION}`;
paintIcons();
renderTemplates();
updateBioButton();
load();
if (!cards.some(isLegacyCode)) localStorage.removeItem(VAULT_KEY);
render();
handleLaunchAction();
setupServiceWorker();

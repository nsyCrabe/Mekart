'use strict';
/* ===== Mes cartes — app.js v3 ===== */

/* Mêmes clés qu'avant : tes cartes existantes sont conservées */
const CARDS_KEY = 'loyalty_cards_v1';
const THEME_KEY = 'loyalty_theme_v2';
const GUIDE_KEY = 'loyalty_hide_guide';
const SORT_KEY = 'loyalty_sort_v1';
const TAB_KEY = 'loyalty_tab_v1';
const VAULT_KEY = 'loyalty_vault_v1';
const VIEW_KEY = 'loyalty_view_v1';
const LOCK_KEY = 'loyalty_lock_v1';
const APP_VERSION = '5.2';

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

const THEMES = [
  { id: 'light', name: 'Clair', category: 'light', description: 'Propre et lumineux', swatch: 'linear-gradient(135deg,#f4f7fb,#3268e8)' },
  { id: 'sunset', name: 'Coucher de soleil', category: 'light', description: 'Chaleureux et doux', swatch: 'linear-gradient(135deg,#fff5f1,#e2573f)' },
  { id: 'forest', name: 'Forêt', category: 'light', description: 'Nature et calme', swatch: 'linear-gradient(135deg,#eef8f2,#1f8a52)' },
  { id: 'ocean', name: 'Océan', category: 'light', description: 'Frais et moderne', swatch: 'linear-gradient(135deg,#edf9fc,#00849b)' },
  { id: 'candy', name: 'Bonbon', category: 'light', description: 'Rose et léger', swatch: 'linear-gradient(135deg,#fff3f8,#df4584)' },
  { id: 'midnight', name: 'Minuit', category: 'dark', description: 'Confortable le soir', swatch: 'linear-gradient(135deg,#0e1525,#5c8df6)' },
  { id: 'graphite', name: 'Graphite', category: 'dark', description: 'Gris profond', swatch: 'linear-gradient(135deg,#111318,#aeb8c7)' },
  { id: 'purple-night', name: 'Nuit violette', category: 'dark', description: 'Sombre et élégant', swatch: 'linear-gradient(135deg,#151022,#b889ff)' },
  { id: 'nord', name: 'Nord', category: 'dark', description: 'Bleu ardoise', swatch: 'linear-gradient(135deg,#202733,#88c0d0)' },
  { id: 'ember', name: 'Braise', category: 'dark', description: 'Sombre et chaleureux', swatch: 'linear-gradient(135deg,#211414,#ff9b68)' },
  { id: 'deep-ocean', name: 'Océan profond', category: 'dark', description: 'Sombre et cyan', swatch: 'linear-gradient(135deg,#071b27,#5ed6e6)' },
  { id: 'mono', name: 'Noir et blanc', category: 'dark', description: 'Minimaliste', swatch: 'linear-gradient(135deg,#101010,#fff)' }
];
const DARK_IDS = THEMES.filter(t => t.category === 'dark').map(t => t.id);

const $ = id => document.getElementById(id);

/* ---------- Icônes (SVG simples, héritent de la couleur du texte) ---------- */
const ICONS = {
  palette: '<circle cx="13.5" cy="6.5" r=".8"/><circle cx="17.5" cy="10.5" r=".8"/><circle cx="8.5" cy="7.5" r=".8"/><circle cx="6.5" cy="12.5" r=".8"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.700 6-6 0-4.900-4.500-8.800-10-8.800z"/>',
  sliders: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3"/><path d="M14 2v4M8 10v4M16 18v4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
  star: '<path d="m12 2.800 2.800 5.700 6.300.9-4.600 4.400 1.100 6.300L12 17.200l-5.600 2.900 1.100-6.300L2.900 9.400l6.300-.9z"/>',
  'star-fill': '<path fill="currentColor" d="m12 2.800 2.800 5.700 6.300.9-4.600 4.400 1.100 6.300L12 17.200l-5.600 2.900 1.100-6.300L2.900 9.400l6.300-.9z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.500 3.500a2.100 2.100 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.100-3.100a2 2 0 0 0-2.800 0L6 21"/>',
  eye: '<path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M9.900 4.200A10 10 0 0 1 12 4c6.400 0 10 8 10 8a17 17 0 0 1-3.200 4.200M6.600 6.600A17 17 0 0 0 2 12s3.600 7 10 7a9.700 9.700 0 0 0 5.400-1.600"/><path d="M14.100 14.100a3 3 0 1 1-4.200-4.200"/><path d="m2 2 20 20"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.500-2"/>',
  reorder: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.500"/><rect x="14" y="3" width="7" height="7" rx="1.500"/><rect x="3" y="14" width="7" height="7" rx="1.500"/><rect x="14" y="14" width="7" height="7" rx="1.500"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.500" cy="6" r=".8"/><circle cx="3.500" cy="12" r=".8"/><circle cx="3.500" cy="18" r=".8"/>',
  upload: '<path d="M12 15V3m0 0L8 7m4-4 4 4"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  download: '<path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 18h.01"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.700L21 8"/><path d="M21 3v5h-5"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.700c.6.500 1 1.300 1 2.300h6c0-1 .4-1.800 1-2.300A7 7 0 0 0 12 2z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  store: '<path d="m3 9 1.500-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/>'
};
const ic = name => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
const setIcon = (node, name) => { node.innerHTML = ic(name); };
function iconEl(name, cls) { const s = document.createElement('span'); if (cls) s.className = cls; s.innerHTML = ic(name); return s; }

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
let firstPaint = true;      // l'animation d'entrée des cartes ne joue qu'au démarrage
let themePref = 'auto';
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
function isLight(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 170;
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
function parseTags(str) {
  const seen = new Set();
  return (str || '').split(/[,;\n]/)
    .map(t => t.trim().replace(/^#/, '').slice(0, 20))
    .filter(t => { const k = norm(t); if (!t || seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 8);
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
  themePref = localStorage.getItem(THEME_KEY) || 'auto';
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

/* ---------- Thèmes ---------- */
function resolveTheme() {
  if (themePref !== 'auto') return themePref;
  return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'light';
}
function applyTheme() {
  const id = resolveTheme();
  document.body.dataset.theme = id;
  document.body.dataset.mode = DARK_IDS.includes(id) ? 'dark' : 'light';
  const bg = getComputedStyle(document.body).getPropertyValue('--bg').trim();
  if (bg) $('themeColorMeta').content = bg;
  renderThemes();
}
function setTheme(pref) {
  themePref = pref;
  localStorage.setItem(THEME_KEY, pref);
  applyTheme();
}
function renderThemes() {
  const section = (category, title, description) => {
    const list = el('div', { class: 'theme-category-list' });
    THEMES.filter(t => t.category === category).forEach(t => list.append(themeButton(t)));
    return el('div', { class: 'theme-category' },
      el('div', { class: 'theme-category-heading' }, el('h3', { text: title }), el('p', { text: description })), list);
  };
  const autoBtn = themeButton({
    id: 'auto', name: 'Automatique', description: 'Suit le mode clair ou sombre du téléphone',
    swatch: 'linear-gradient(135deg,#f4f7fb 50%,#0e1525 50%)'
  });
  const root = $('themeList');
  root.replaceChildren(autoBtn, section('light', 'Clair', 'Des couleurs lumineuses'), section('dark', 'Sombre', 'Confortable dans le noir'));
}
function themeButton(t) {
  const active = t.id === themePref;
  const b = el('button', { type: 'button', class: `theme-option${active ? ' active' : ''}` },
    el('span', { class: 'theme-swatch', style: `background:${t.swatch}` }),
    el('span', { class: 'theme-info' }, el('strong', { text: t.name }), el('small', { text: t.description })),
    el('span', { class: 'theme-check', text: active ? '✓' : '' }));
  b.addEventListener('click', () => setTheme(t.id));
  return b;
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
function matchesFilter(c) {
  if (filter.kind === 'fav') return !!c.fav;
  if (filter.kind === 'cagnotte') return c.balance != null;
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
  list.sort((a, b) =>
    (auto && tab === 'gift' ? (isSpent(a) ? 1 : 0) - (isSpent(b) ? 1 : 0) : 0)   // cartes épuisées en bas
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
  if (tab === 'loyalty' && pool.some(c => c.balance != null)) add('cagnotte', '', '💰 Avec cagnotte');
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
  const giftN = cards.filter(c => kindOf(c) === 'gift').length;
  $('countGift').textContent = giftN;
  $('countLoyalty').textContent = cards.length - giftN;
  ['Loyalty', 'Gift'].forEach(k => {
    const on = (k === 'Gift') === (tab === 'gift');
    $('tab' + k).classList.toggle('active', on);
    $('tab' + k).setAttribute('aria-selected', on ? 'true' : 'false');
  });
  $('cardCount').textContent = `${cards.length} carte${cards.length > 1 ? 's' : ''}`;
  $('addLabel').textContent = tab === 'gift' ? 'Ajouter une carte cadeau' : 'Ajouter une carte';

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
  setIcon($('viewButton'), viewMode === 'list' ? 'grid' : 'list');
  $('viewButton').setAttribute('aria-label', viewMode === 'list' ? 'Passer en affichage grille' : 'Passer en affichage liste');

  const list = sortedFiltered();
  if (!list.length) {
    grid.append(el('p', { class: 'no-result', text: $('searchInput').value ? 'Aucune carte trouvée.' : 'Aucune carte dans ce filtre.' }));
    return;
  }
  list.forEach((c, i) => {
    const color = c.color || COLORS[0];
    const cat = catById(c.category);
    const spent = isSpent(c);
    const b = el('button', { type: 'button', class: `loyalty-card${spent ? ' empty' : ''}`, 'aria-label': `Ouvrir la carte ${c.name}` });
    b.dataset.id = c.id;
    b.style.setProperty('--card-color', color);
    b.style.setProperty('--card-color-dark', darken(color));
    b.style.setProperty('--card-fg', isLight(color) ? '#14181f' : '#fff');
    if (firstPaint) { b.classList.add(viewMode === 'list' ? 'enter' : 'fan'); if (viewMode === 'list') b.style.animationDelay = `${Math.min(i, 10) * 35}ms`; }
    const logo = el('div', { class: 'card-logo' }); logo.append(logoNode(c));
    const typeText = spent ? 'Épuisée' : (cat ? `${cat.emoji} ${cat.name}` : typeLabel(c.codeType));
    b.append(
      el('div', { class: 'card-top' }, logo, (c.fav || c.balance != null) ? el('div', { class: 'card-badges' }, c.balance != null ? el('span', { class: 'card-balance', text: (kindOf(c) === 'loyalty' ? '💰 ' : '') + fmtMoney(c.balance) }) : null, c.fav ? iconEl('star-fill', 'card-fav') : null) : null),
      el('div', { class: 'card-text' }, el('p', { class: 'card-name', text: c.name }), el('p', { class: 'card-type', text: typeText }))
    );
    b.addEventListener('click', () => { if (!reorderMode) openDetail(c.id); });
    grid.append(b);
  });
  if (firstPaint && viewMode === 'grid') fanIn(grid);
  firstPaint = false;
}

/* ---------- Ouverture : les cartes se déploient en éventail (une seule fois par lancement) ---------- */
function fanIn(grid) {
  const nodes = [...grid.querySelectorAll('.loyalty-card.fan')];
  const g = grid.getBoundingClientRect();
  const ax = g.left + g.width / 2, ay = g.top + 40;
  const shown = nodes.filter(n => n.getBoundingClientRect().top < innerHeight).slice(0, 10);
  nodes.forEach(n => n.classList.remove('fan'));
  shown.forEach((n, i) => {
    const r = n.getBoundingClientRect();
    n.style.setProperty('--fx', `${Math.round(ax - (r.left + r.width / 2))}px`);
    n.style.setProperty('--fy', `${Math.round(ay - (r.top + r.height / 2))}px`);
    n.style.setProperty('--fr', `${((i - (shown.length - 1) / 2) * 5).toFixed(1)}deg`);
    n.style.animationDelay = `${60 + i * 55}ms`;
    n.classList.add('fan');
  });
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
  theme: ['themeSheet', 'themeBackdrop'],
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
  document.body.classList.add('no-scroll');
}
function hideLayer(name) {
  const [panel, backdrop] = LAYERS[name];
  $(panel).hidden = true;
  if (backdrop) $(backdrop).hidden = true;
  if (name === 'form') { editingId = null; $('cagnotteCodeInput').value = ''; }
  if (name === 'detail') cleanupDetail();
  if (name === 'scanner') stopScan();
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
}
function updateBalanceFields() {
  const show = formKind === 'gift' || (formKind === 'loyalty' && $('cagnotteToggle').checked);
  $('giftFields').hidden = !show;
  $('cagnotteCodeWrap').hidden = formKind !== 'loyalty';
  $('balanceLabel').textContent = formKind === 'gift' ? 'Solde actuel (€)' : 'Cagnotte actuelle (€)';
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
function toggleCodeFields() { $('codeFields').hidden = $('codeTypeInput').value === 'none'; }

function renderColors() {
  const row = $('colorRow');
  row.replaceChildren();
  COLORS.forEach(c => {
    const d = el('button', { type: 'button', class: `color-dot${c === selectedColor ? ' selected' : ''}`, 'aria-label': `Couleur ${c}` });
    d.style.background = c;
    d.addEventListener('click', () => { selectedColor = c; renderColors(); });
    row.append(d);
  });
  const custom = el('label', { class: `color-dot custom${COLORS.includes(selectedColor) ? '' : ' selected'}`, 'aria-label': 'Couleur personnalisée' });
  if (!COLORS.includes(selectedColor)) custom.style.background = selectedColor;
  const input = el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(selectedColor) ? selectedColor : '#2264d1' });
  input.addEventListener('input', () => { selectedColor = input.value; custom.style.background = input.value; custom.classList.add('selected'); row.querySelectorAll('.color-dot:not(.custom)').forEach(x => x.classList.remove('selected')); });
  custom.append(input);
  row.append(custom);
}
function updateLogoPreview() {
  const p = $('logoPreview');
  p.replaceChildren();
  if (selectedLogo) { p.append(el('img', { src: selectedLogo, alt: 'Logo sélectionné' })); $('removeLogo').hidden = false; }
  else { p.append(iconEl('store')); $('removeLogo').hidden = true; }
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
  const data = { name, code, codeType, color: selectedColor, logo: selectedLogo, notes: $('notesInput').value.trim(), kind: formKind, format: scannedFormat || null, category: $('categoryInput').value };
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

  const panel = $('detailPanel'), tone = c.color || COLORS[0];
  panel.style.setProperty('--card-color', tone);
  panel.style.setProperty('--card-color-dark', darken(tone));
  panel.style.setProperty('--card-fg', isLight(tone) ? '#14181f' : '#fff');
  panel.classList.remove('code-big');
  $('detailName').textContent = c.name;
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
  $('codeBox').classList.remove('big');
  $('detailPanel').classList.remove('code-big');
  releaseAwake();
  render(); // met à jour l'ordre (récentes / utilisées)
}
function syncFavButton(c) {
  setIcon($('favCard'), c.fav ? 'star-fill' : 'star');
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
async function openScanner() {
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
    return toast('Scanner indisponible sur ce navigateur : saisis le numéro à la main.');
  }
  openLayer('scanner');
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    $('scanVideo').srcObject = stream;
    const detector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39'] });
    scanTimer = setInterval(async () => {
      try {
        const result = await detector.detect($('scanVideo'));
        if (!result.length) return;
        $('codeInput').value = result[0].rawValue;
        const isQr = result[0].format === 'qr_code';
        $('codeTypeInput').value = isQr ? 'qrcode' : 'barcode';
        scannedFormat = isQr ? null : (FORMAT_MAP[result[0].format] || null);
        toggleCodeFields();
        vibrate(30);
        closeLayer();
        toast('Code trouvé ✓');
      } catch {}
    }, 300);
  } catch {
    closeLayer();
    toast('Autorise la caméra pour scanner.');
  }
}
function stopScan() {
  if (scanTimer) clearInterval(scanTimer);
  scanTimer = null;
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
}

/* ---------- Lecture d'un code depuis une image ---------- */
async function readCodeFromImage(file) {
  if (!('BarcodeDetector' in window)) return toast("Lecture d'image indisponible sur ce navigateur : saisis le numéro à la main.");
  let bitmap;
  try { bitmap = await createImageBitmap(file); } catch { return toast('Image impossible à lire.'); }
  toast("Lecture de l'image…");
  const detector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39'] });
  let found = null;
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
      if (res.length) { found = res[0]; break; }
    } catch {}
  }
  if (bitmap.close) bitmap.close();
  if (!found) return toast('Aucun code détecté. Essaie une image plus nette, recadrée sur le code.');
  const isQr = found.format === 'qr_code';
  $('codeInput').value = found.rawValue;
  $('codeTypeInput').value = isQr ? 'qrcode' : 'barcode';
  scannedFormat = isQr ? null : (FORMAT_MAP[found.format] || null);
  toggleCodeFields();
  vibrate(30);
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
  if (!(await lockAuth())) return;
  if (openedId !== c.id) return;   // la fiche a été fermée pendant la vérification
  $('cagnotteCodeText').textContent = c.cagnotteCode;
  setIcon(btn, 'eye-off');
  btn.setAttribute('aria-label', 'Masquer le code');
  btn.dataset.shown = '1';
}

/* ---------- Verrou biométrique (empreinte, visage ou verrouillage d'écran) ----------
   Une clé WebAuthn est créée sur l'appareil ; l'affichage d'un code cagnotte demande ensuite de la valider.
   Rien n'est envoyé sur Internet : c'est un verrou local, qui protège contre quelqu'un qui emprunte le téléphone déverrouillé. */
const b64enc = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const lockEnabled = () => !!localStorage.getItem(LOCK_KEY);
function refreshLockUi() {
  const on = lockEnabled();
  $('lockTitle').textContent = on ? 'Verrou biométrique activé' : 'Activer le verrou biométrique';
  $('lockHint').textContent = on ? 'Demandé avant d\'afficher un code cagnotte. Touche pour désactiver.' : 'Demande ton empreinte ou ton visage avant d\'afficher un code cagnotte.';
}
async function lockAuth() {
  const id = localStorage.getItem(LOCK_KEY);
  if (!id) return true;
  try {
    await navigator.credentials.get({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: 'public-key', id: b64dec(id), transports: ['internal'] }],
      userVerification: 'required', timeout: 60000
    } });
    return true;
  } catch { toast('Vérification annulée ou impossible.'); return false; }
}
async function enableLock() {
  if (!window.PublicKeyCredential || !navigator.credentials?.create) return toast('Verrou biométrique indisponible sur ce navigateur.');
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();
    if (!available) return toast("Configure d'abord une empreinte, un visage ou un verrouillage d'écran sur ton téléphone.");
    const cred = await navigator.credentials.create({ publicKey: {
      rp: { name: 'Mes cartes' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'mes-cartes', displayName: 'Mes cartes' },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      timeout: 60000
    } });
    localStorage.setItem(LOCK_KEY, b64enc(cred.rawId));
    toast('Verrou activé ✓');
  } catch { toast('Activation annulée.'); }
  refreshLockUi();
}
async function toggleLock() {
  if (!lockEnabled()) return enableLock();
  if (!(await lockAuth())) return;   // on doit valider pour désactiver
  localStorage.removeItem(LOCK_KEY);
  toast('Verrou désactivé');
  refreshLockUi();
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
  if (!vault) {
    cards.forEach(c => { if (isLegacyCode(c)) delete c.cagnotteCode; });
    save(); render();
    return toast('Protection introuvable : ressaisis tes codes cagnotte.');
  }
  const raw = await legacyMasterKey(vault);
  if (!raw) return;
  const key = await aesKey(raw);
  let ok = 0, lost = 0;
  for (const c of cards) {
    if (!isLegacyCode(c)) continue;
    try { c.cagnotteCode = new TextDecoder().decode(await decryptBlob(key, c.cagnotteCode)); ok++; }
    catch { delete c.cagnotteCode; lost++; }
  }
  raw.fill(0);
  localStorage.removeItem(VAULT_KEY);
  save(); render();
  const cur = cards.find(x => x.id === openedId);
  if (cur) refreshCodeRow(cur);
  toast(lost ? `${ok} code${ok > 1 ? 's' : ''} converti${ok > 1 ? 's' : ''}, ${lost} à ressaisir.` : `${ok} code${ok > 1 ? 's' : ''} converti${ok > 1 ? 's' : ''} ✓`);
}

/* ---------- Sauvegarde (export / import) ---------- */
function exportCards() {
  if (!cards.length) return toast('Aucune carte à exporter.');
  const payload = { app: 'mes-cartes', version: 4, exportedAt: new Date().toISOString(), cards };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `mes-cartes-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Sauvegarde téléchargée ✓');
}
async function importCards(file) {
  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : data.cards;
    if (!Array.isArray(list)) throw new Error('format');
    const known = new Set(cards.map(c => c.id));
    const added = list.filter(c => c && typeof c.name === 'string' && c.name && !known.has(c.id))
      .map(c => ({ ...c, order: undefined, id: c.id || uid(), color: /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : COLORS[0], category: catById(c.category) ? c.category : '', tags: Array.isArray(c.tags) ? c.tags.slice(0, 8).map(t => String(t).slice(0, 20)) : [], balance: Number.isFinite(c.balance) ? round2(c.balance) : undefined, history: Number.isFinite(c.balance) && c.kind !== 'loyalty' && Array.isArray(c.history) ? c.history.filter(h => h && Number.isFinite(h.d)).slice(-100).map(h => ({ t: +h.t || 0, d: round2(h.d), a: round2(+h.a || 0), n: String(h.n || '').slice(0, 40) })) : undefined, kind: (c.kind === 'gift' || c.kind === 'loyalty') ? c.kind : (Number.isFinite(c.balance) ? 'gift' : 'loyalty'), cagnotteCode: typeof c.cagnotteCode === 'string' ? c.cagnotteCode.slice(0, 60) : undefined }));
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
$('viewButton').addEventListener('click', () => {
  viewMode = viewMode === 'list' ? 'grid' : 'list';
  localStorage.setItem(VIEW_KEY, viewMode);
  render();
});
$('reorderDone').addEventListener('click', () => setReorder(false));
$('cardsGrid').addEventListener('pointerdown', onGridPointerDown);
$('cardsGrid').addEventListener('contextmenu', e => { if (reorderMode) e.preventDefault(); });
$('imageButton').addEventListener('click', () => $('imageInput').click());
$('imageInput').addEventListener('change', async e => { const f = e.target.files[0]; if (f) await readCodeFromImage(f); e.target.value = ''; });
$('forceUpdateButton').addEventListener('click', forceUpdate);
$('lockButton').addEventListener('click', toggleLock);
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
  try { selectedLogo = await resizeLogo(file); updateLogoPreview(); toast('Logo ajouté ✓'); }
  catch { toast('Image impossible à utiliser.'); }
  e.target.value = '';
});
$('removeLogo').addEventListener('click', () => { selectedLogo = null; updateLogoPreview(); });

$('themeButton').addEventListener('click', () => { renderThemes(); openLayer('theme'); });
$('closeTheme').addEventListener('click', closeLayer);
$('themeBackdrop').addEventListener('click', closeLayer);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (themePref === 'auto') applyTheme(); });

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
document.querySelectorAll('[data-icon]').forEach(n => n.insertAdjacentHTML('afterbegin', ic(n.dataset.icon)));
$('versionNote').textContent = `Version ${APP_VERSION}`;
refreshLockUi();
load();
if (!cards.some(isLegacyCode)) localStorage.removeItem(VAULT_KEY);
render();
handleLaunchAction();
setupServiceWorker();

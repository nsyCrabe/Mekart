'use strict';
/* ===== Mes cartes — app.js v3 ===== */

/* Mêmes clés qu'avant : tes cartes existantes sont conservées */
const CARDS_KEY = 'loyalty_cards_v1';
const THEME_KEY = 'loyalty_theme_v2';
const GUIDE_KEY = 'loyalty_hide_guide';
const SORT_KEY = 'loyalty_sort_v1';
const TAB_KEY = 'loyalty_tab_v1';
const APP_VERSION = '4.5';

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
let sortMode = 'recent';
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
  root.replaceChildren(autoBtn, section('light', '☀️ Clair', 'Des couleurs lumineuses'), section('dark', '🌙 Sombre', 'Confortable dans le noir'));
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
  $('addButton').textContent = tab === 'gift' ? '+ Ajouter une carte cadeau' : '+ Ajouter une carte';

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

  // Bandeau du haut : solde des cartes cadeaux, ou cagnottes des cartes de fidélité
  const gt = $('giftTotal');
  const withBalance = pool.filter(c => c.balance != null);
  gt.hidden = none || !withBalance.length;
  if (!gt.hidden) {
    const n = withBalance.length;
    if (tab === 'gift') {
      const active = withBalance.filter(c => !isSpent(c)).length;
      $('giftTotalLabel').textContent = `Total restant · ${active} carte${active > 1 ? 's' : ''} avec du solde`;
    } else {
      $('giftTotalLabel').textContent = `Cagnottes disponibles · ${n} carte${n > 1 ? 's' : ''}`;
    }
    $('giftTotalValue').textContent = fmtMoney(round2(withBalance.reduce((t, c) => t + c.balance, 0)));
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
    b.style.animationDelay = `${Math.min(i, 10) * 35}ms`;
    const logo = el('div', { class: 'card-logo' }); logo.append(logoNode(c));
    const typeText = spent ? 'Épuisée' : (cat ? `${cat.emoji} ${cat.name}` : typeLabel(c.codeType));
    b.append(
      el('div', { class: 'card-top' }, logo, (c.fav || c.balance != null) ? el('div', { class: 'card-badges' }, c.balance != null ? el('span', { class: 'card-balance', text: (kindOf(c) === 'loyalty' ? '💰 ' : '') + fmtMoney(c.balance) }) : null, c.fav ? el('span', { class: 'card-fav', text: '★' }) : null) : null),
      el('div', {}, el('p', { class: 'card-name', text: c.name }), el('p', { class: 'card-type', text: typeText }))
    );
    b.addEventListener('click', () => { if (!reorderMode) openDetail(c.id); });
    grid.append(b);
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
  if (name === 'form') editingId = null;
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
  else { p.append(el('span', { text: '🏪' })); $('removeLogo').hidden = true; }
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
  const data = { name, code, codeType, color: selectedColor, logo: selectedLogo, notes: $('notesInput').value.trim(), kind: formKind, format: scannedFormat || null, category: $('categoryInput').value };
  const backup = JSON.stringify(cards);
  let target;
  if (editingId) { target = cards.find(c => c.id === editingId); Object.assign(target, data); }
  else { target = { id: uid(), ...data, createdAt: Date.now(), fav: false, uses: 0, order: Math.max(-1, ...cards.map(c => (typeof c.order === 'number' ? c.order : -1))) + 1 }; cards.push(target); }
  applyBalance(target, giftBalance);
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
  if (isCag) { $('cagnotteValue').textContent = fmtMoney(c.balance); closeCagnotteEditor(); }
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
  $('codeBox').classList.remove('big');
  releaseAwake();
  render(); // met à jour l'ordre (récentes / utilisées)
}
function syncFavButton(c) {
  $('favCard').textContent = c.fav ? '★' : '☆';
  $('favCard').setAttribute('aria-pressed', c.fav ? 'true' : 'false');
}
function toggleBig() {
  const box = $('codeBox');
  const big = box.classList.toggle('big');
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

/* ---------- Sauvegarde (export / import) ---------- */
function exportCards() {
  if (!cards.length) return toast('Aucune carte à exporter.');
  const payload = { app: 'mes-cartes', version: 3, exportedAt: new Date().toISOString(), cards };
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
      .map(c => ({ ...c, order: undefined, id: c.id || uid(), color: /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : COLORS[0], category: catById(c.category) ? c.category : '', tags: Array.isArray(c.tags) ? c.tags.slice(0, 8).map(t => String(t).slice(0, 20)) : [], balance: Number.isFinite(c.balance) ? round2(c.balance) : undefined, history: Number.isFinite(c.balance) && c.kind !== 'loyalty' && Array.isArray(c.history) ? c.history.filter(h => h && Number.isFinite(h.d)).slice(-100).map(h => ({ t: +h.t || 0, d: round2(h.d), a: round2(+h.a || 0), n: String(h.n || '').slice(0, 40) })) : undefined, kind: (c.kind === 'gift' || c.kind === 'loyalty') ? c.kind : (Number.isFinite(c.balance) ? 'gift' : 'loyalty') }));
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
$('versionNote').textContent = `Version ${APP_VERSION}`;
load();
render();
handleLaunchAction();
setupServiceWorker();

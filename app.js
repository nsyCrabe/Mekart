'use strict';
/* ===== Mes cartes — app.js v3 ===== */

/* Mêmes clés qu'avant : tes cartes existantes sont conservées */
const CARDS_KEY = 'loyalty_cards_v1';
const THEME_KEY = 'loyalty_theme_v2';
const GUIDE_KEY = 'loyalty_hide_guide';
const SORT_KEY = 'loyalty_sort_v1';

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
let filterFav = false;
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
  themePref = localStorage.getItem(THEME_KEY) || 'auto';
  sortMode = localStorage.getItem(SORT_KEY) || 'recent';
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
function sortedFiltered() {
  const q = norm($('searchInput').value.trim());
  let list = cards.filter(c => (!filterFav || c.fav) && (!q || norm(c.name).includes(q) || norm(c.notes).includes(q)));
  const byMode = {
    recent: (a, b) => (b.lastUsed || b.createdAt || 0) - (a.lastUsed || a.createdAt || 0),
    used: (a, b) => (b.uses || 0) - (a.uses || 0),
    az: (a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
  };
  list.sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0) || byMode[sortMode](a, b));
  return list;
}
function render() {
  const grid = $('cardsGrid');
  grid.replaceChildren();
  $('cardCount').textContent = `${cards.length} carte${cards.length > 1 ? 's' : ''}`;
  const none = cards.length === 0;
  $('emptyState').hidden = !none;
  $('toolbar').hidden = none;
  $('quickGuide').hidden = none ? true : localStorage.getItem(GUIDE_KEY) === '1';
  if (none) return;

  const list = sortedFiltered();
  if (!list.length) {
    grid.append(el('p', { class: 'no-result', text: filterFav && !$('searchInput').value ? 'Aucune carte en favori.' : 'Aucune carte trouvée.' }));
    return;
  }
  list.forEach((c, i) => {
    const color = c.color || COLORS[0];
    const b = el('button', { type: 'button', class: 'loyalty-card', 'aria-label': `Ouvrir la carte ${c.name}` });
    b.style.setProperty('--card-color', color);
    b.style.setProperty('--card-color-dark', darken(color));
    b.style.setProperty('--card-fg', isLight(color) ? '#14181f' : '#fff');
    b.style.animationDelay = `${Math.min(i, 10) * 35}ms`;
    const logo = el('div', { class: 'card-logo' }); logo.append(logoNode(c));
    b.append(
      el('div', { class: 'card-top' }, logo, c.fav ? el('span', { class: 'card-fav', text: '★' }) : null),
      el('div', {}, el('p', { class: 'card-name', text: c.name }), el('p', { class: 'card-type', text: typeLabel(c.codeType) }))
    );
    b.addEventListener('click', () => openDetail(c.id));
    grid.append(b);
  });
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
  selectedColor = c?.color || COLORS[0];
  selectedLogo = c?.logo || null;
  scannedFormat = c?.format || null;
  updateLogoPreview();
  renderColors();
  toggleCodeFields();
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
  const data = { name, code, codeType, color: selectedColor, logo: selectedLogo, notes: $('notesInput').value.trim(), format: scannedFormat || null };
  const backup = JSON.stringify(cards);
  if (editingId) Object.assign(cards.find(c => c.id === editingId), data);
  else cards.push({ id: uid(), ...data, createdAt: Date.now(), fav: false, uses: 0 });
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
      .map(c => ({ ...c, id: c.id || uid(), color: /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : COLORS[0] }));
    const backup = JSON.stringify(cards);
    cards.push(...added);
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
$('filterAll').addEventListener('click', () => { filterFav = false; $('filterAll').classList.add('active'); $('filterFav').classList.remove('active'); render(); });
$('filterFav').addEventListener('click', () => { filterFav = true; $('filterFav').classList.add('active'); $('filterAll').classList.remove('active'); render(); });
$('sortSelect').addEventListener('change', e => { sortMode = e.target.value; localStorage.setItem(SORT_KEY, sortMode); render(); });

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

/* ---------- Démarrage ---------- */
load();
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

import PARTS_BASE from './data/parts.json';
import { startSync } from './sync.js';

const SYSTEMS = [
  { k: 'Motor', label: 'Motor' },
  { k: 'Combustible', label: 'Combustible' },
  { k: 'Refrigeración', label: 'Refrigeración' },
  { k: 'Frenos', label: 'Frenos' },
  { k: 'Suspensión', label: 'Suspensión y dirección' },
  { k: 'Transmisión', label: 'Transmisión' },
  { k: 'Eléctrico', label: 'Eléctrico' },
  { k: 'Escape', label: 'Escape' },
];
const VEH_LABEL = { auto: 'Auto', moto: 'Moto', ambos: 'Auto y moto' };
const CACHE_KEY = 'despiece_remote_v1';

/* ---------- Diagramas (cada zona es tocable) ---------- */
const CAR_SVG = `
<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Auto visto de costado">
  <path class="body" d="M12 100 V82 Q12 72 24 70 L64 64 L96 40 Q102 34 112 34 H186 Q196 34 204 42 L224 64 L266 70 Q290 74 290 90 V100 Z"/>
  <path class="glass" d="M102 42 H140 V63 H86 Z"/>
  <path class="glass" d="M146 42 H184 Q192 42 198 48 L212 63 H146 Z"/>
  <circle class="wheel" cx="70" cy="100" r="18"/>
  <circle class="wheel" cx="230" cy="100" r="18"/>

  <g class="zone" data-sys="Motor"><rect x="214" y="66" width="38" height="18" rx="3"/><text x="233" y="78">Motor</text></g>
  <g class="zone" data-sys="Refrigeración"><rect x="255" y="70" width="31" height="20" rx="3"/><text x="270.5" y="82">Refrig.</text></g>
  <g class="zone" data-sys="Eléctrico"><rect x="100" y="66" width="44" height="13" rx="3"/><text x="122" y="75.5">Eléctrico</text></g>
  <g class="zone" data-sys="Combustible"><rect x="16" y="72" width="36" height="22" rx="3"/><text x="34" y="85">Tanque</text></g>
  <g class="zone" data-sys="Transmisión"><rect x="100" y="81" width="100" height="12" rx="3"/><text x="150" y="90">Transmisión</text></g>
  <g class="zone" data-sys="Escape"><rect x="100" y="95" width="100" height="10" rx="3"/><text x="150" y="102.5">Escape</text></g>
  <g class="zone" data-sys="Frenos">
    <circle cx="70" cy="100" r="10"/><circle cx="230" cy="100" r="10"/>
    <text x="70" y="130">Frenos</text><text x="230" y="130">Frenos</text>
  </g>
  <g class="zone" data-sys="Suspensión">
    <circle class="ring" cx="70" cy="100" r="22"/><circle class="ring" cx="230" cy="100" r="22"/>
    <text x="70" y="141">Suspensión</text><text x="230" y="141">Suspensión</text>
  </g>
</svg>`;

const MOTO_SVG = `
<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Moto vista de costado">
  <circle class="wheel" cx="60" cy="102" r="26"/>
  <circle class="wheel" cx="240" cy="102" r="26"/>
  <path class="line" d="M60 102 L120 90"/>
  <path class="line" d="M120 90 L96 62 L74 54"/>
  <path class="line" d="M74 54 H128 Q134 54 136 58"/>
  <path class="line" d="M134 56 Q140 36 176 38 L196 44 L190 58 Z"/>
  <rect class="line" x="128" y="66" width="62" height="28" rx="4"/>
  <path class="line" d="M207 44 L240 102"/>
  <path class="line" d="M200 40 H214"/>
  <path class="line dash" d="M130 86 L62 96"/>

  <g class="zone" data-sys="Motor"><rect x="132" y="68" width="54" height="24" rx="3"/><text x="159" y="83">Motor</text></g>
  <g class="zone" data-sys="Combustible"><rect x="142" y="40" width="42" height="14" rx="3"/><text x="163" y="50">Tanque</text></g>
  <g class="zone" data-sys="Eléctrico"><rect x="78" y="42" width="50" height="11" rx="3"/><text x="103" y="50.5">Eléctrico</text></g>
  <g class="zone" data-sys="Transmisión"><rect x="88" y="82" width="40" height="10" rx="3"/><text x="108" y="89.5">Cadena</text></g>
  <g class="zone" data-sys="Refrigeración"><rect x="190" y="66" width="14" height="26" rx="3"/><text x="197" y="82">Rad</text></g>
  <g class="zone" data-sys="Escape"><rect x="94" y="98" width="38" height="10" rx="3"/><text x="113" y="105.5">Escape</text></g>
  <g class="zone" data-sys="Frenos">
    <circle cx="60" cy="102" r="11"/><circle cx="240" cy="102" r="11"/>
    <text x="60" y="140">Frenos</text><text x="240" y="140">Frenos</text>
  </g>
  <g class="zone" data-sys="Suspensión">
    <rect x="-6" y="-33" width="12" height="66" rx="5" transform="translate(225 71) rotate(-26)"/>
    <rect x="-5" y="-18" width="10" height="36" rx="4" transform="translate(94 76) rotate(12)"/>
    <text x="252" y="56">Susp.</text><text x="108" y="64">Susp.</text>
  </g>
</svg>`;

/* ---------- Utilidades ---------- */
const $ = (id) => document.getElementById(id);
const norm = (s) =>
  (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const sysIndex = (k) => {
  const i = SYSTEMS.findIndex((s) => s.k === k);
  return i < 0 ? 99 : i;
};
const sysLabel = (k) => {
  const s = SYSTEMS.find((x) => x.k === k);
  return s ? s.label : k;
};
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

const state = { vehicle: 'auto', sys: 'Todos', q: '', remote: [], net: 'local', sheetOpen: false };

/* ---------- Datos: incluidos + lo último sincronizado ---------- */
function loadRemoteCache() {
  try {
    const r = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    return Array.isArray(r) ? r : [];
  } catch (e) {
    return [];
  }
}
function saveRemoteCache(arr) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(arr));
  } catch (e) {
    /* sin almacenamiento: se sigue con los datos incluidos */
  }
}
function validPart(p) {
  return p && p.id && p.n && p.sys && ['auto', 'moto', 'ambos'].includes(p.v);
}
function allParts() {
  const map = new Map();
  PARTS_BASE.forEach((p) => map.set(p.id, p));
  state.remote.forEach((p) => {
    if (!p || !p.id) return;
    if (p.borrar === true) {
      map.delete(p.id);
      return;
    }
    map.set(p.id, { ...(map.get(p.id) || {}), ...p });
  });
  return [...map.values()].filter(validPart);
}
function visibleParts() {
  const q = norm(state.q.trim());
  return allParts()
    .filter((p) => {
      if (!(p.v === 'ambos' || p.v === state.vehicle)) return false;
      if (state.sys !== 'Todos' && p.sys !== state.sys) return false;
      if (q) {
        const hay = norm([p.n, p.fun, p.loc, (p.sint || []).join(' ')].join(' '));
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => sysIndex(a.sys) - sysIndex(b.sys) || a.n.localeCompare(b.n, 'es'));
}

/* ---------- Pintado ---------- */
function renderStatus() {
  const pill = $('status');
  let t = 'En línea';
  let c = 'ok';
  if (!navigator.onLine) {
    t = 'Sin conexión · funcionando offline';
    c = 'off';
  } else if (state.net === 'sync') {
    t = 'En línea · sincronizado';
  } else if (state.net === 'error') {
    t = 'En línea · sin sincronizar';
    c = 'warn';
  }
  pill.textContent = t;
  pill.className = 'status ' + c;
}

function renderDiagram() {
  const holder = $('diagram');
  holder.innerHTML = state.vehicle === 'auto' ? CAR_SVG : MOTO_SVG;
  holder.querySelectorAll('.zone').forEach((g) => {
    g.classList.toggle('on', g.dataset.sys === state.sys);
  });
}

function renderChips() {
  const box = $('chips');
  box.innerHTML = '';
  const base = allParts().filter((p) => p.v === 'ambos' || p.v === state.vehicle);
  const mk = (k, label, n) => {
    const b = el('button', 'chip' + (state.sys === k ? ' active' : ''), label + ' ' + n);
    b.type = 'button';
    b.addEventListener('click', () => setSys(k));
    box.appendChild(b);
  };
  mk('Todos', 'Todos', base.length);
  SYSTEMS.forEach((s) => mk(s.k, s.label, base.filter((p) => p.sys === s.k).length));
}

function renderList() {
  const list = $('list');
  list.innerHTML = '';
  const items = visibleParts();
  $('count').textContent =
    (state.sys === 'Todos' ? 'Todas las piezas' : sysLabel(state.sys)) +
    ' · ' +
    items.length +
    (items.length === 1 ? ' pieza' : ' piezas');
  if (!items.length) {
    list.appendChild(el('div', 'empty', 'No hay piezas con ese filtro. Probá con otra palabra o elegí otro sistema.'));
    return;
  }
  items.forEach((p) => {
    const row = el('button', 'item');
    row.type = 'button';
    const left = el('div');
    left.appendChild(el('div', 'item-name', p.n));
    left.appendChild(
      el('div', 'item-sub', sysLabel(p.sys) + (p.v === 'ambos' ? '' : ' · solo ' + VEH_LABEL[p.v].toLowerCase()))
    );
    row.appendChild(left);
    row.appendChild(el('div', 'item-arrow', '›'));
    row.addEventListener('click', () => openSheet(p));
    list.appendChild(row);
  });
}

function render() {
  renderStatus();
  renderDiagram();
  renderChips();
  renderList();
}

function setSys(k) {
  state.sys = state.sys === k ? 'Todos' : k;
  render();
}

/* ---------- Ficha de la pieza ---------- */
function fill(id, text) {
  $(id).textContent = text || 'Sin datos todavía.';
}
function openSheet(p) {
  $('shName').textContent = p.n;
  $('shSys').textContent = sysLabel(p.sys) + ' · ' + VEH_LABEL[p.v];
  fill('shLoc', p.loc);
  fill('shFun', p.fun);
  fill('shMant', p.mant);
  fill('shVida', p.vida);
  const ul = $('shSint');
  ul.innerHTML = '';
  (Array.isArray(p.sint) ? p.sint : []).forEach((s) => ul.appendChild(el('li', '', s)));
  const f = Array.isArray(p.fuente) && p.fuente.length ? p.fuente.join(', ') : 'Conocimiento general de mecánica';
  $('shSrc').textContent = 'Fuentes: ' + f;
  $('backdrop').classList.add('show');
  $('sheet').classList.add('show');
  $('sheet').scrollTop = 0;
  if (!state.sheetOpen) history.pushState({ sheet: 1 }, '');
  state.sheetOpen = true;
}
function hideSheet() {
  $('backdrop').classList.remove('show');
  $('sheet').classList.remove('show');
}
function closeSheet() {
  if (!state.sheetOpen) return;
  state.sheetOpen = false;
  hideSheet();
  if (history.state && history.state.sheet) history.back();
}

/* ---------- Arranque ---------- */
function init() {
  state.remote = loadRemoteCache();

  document.querySelectorAll('.vtab').forEach((t) => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.vtab').forEach((x) => x.classList.toggle('active', x === t));
      state.vehicle = t.dataset.v;
      state.sys = 'Todos';
      render();
    });
  });
  $('diagram').addEventListener('click', (e) => {
    const g = e.target.closest('.zone');
    if (g) setSys(g.dataset.sys);
  });
  $('search').addEventListener('input', (e) => {
    state.q = e.target.value;
    renderList();
  });
  $('backdrop').addEventListener('click', closeSheet);
  $('shClose').addEventListener('click', closeSheet);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSheet();
  });
  window.addEventListener('popstate', () => {
    if (state.sheetOpen) {
      state.sheetOpen = false;
      hideSheet();
    }
  });
  window.addEventListener('online', renderStatus);
  window.addEventListener('offline', renderStatus);

  render();

  startSync(
    (docs) => {
      state.remote = docs;
      saveRemoteCache(docs);
      render();
    },
    (net) => {
      state.net = net;
      renderStatus();
    }
  );

  // Service worker solo en la versión web (en el APK los archivos ya van dentro).
  const nativo = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  if (!nativo && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();

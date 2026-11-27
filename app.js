const API_URL = 'https://script.google.com/macros/s/AKfycbwpS5YJSoHiYLcHHVhdKXz1X17LBxG6n60Xk8x7TwX0D_wPeRtWdvnBN2JLTCLbGr_O/exec';
const DRAFT_KEY = 'esporaNuevoEstudioVisitDraftV1';
const QUEUE_KEY = 'esporaNuevoEstudioPendingV1';
const NEW_LOCAL_COUNTER_KEY = 'esporaNuevoEstudioLocalCounterV1';
const COLLECTOR_KEY = 'esporaNuevoEstudioCollectorV1';
const NEW_LOCAL_CODE_PATTERN = /^LM\d+N([A-Z]{2,3}|\d+)$/i;
const PRICE_UNITS = ['kg', '0,5 kg', 'Unidad', 'Otros'];
const LEGACY_PRICE_PRODUCTS = [];
const PRODUCTS = [];

const ORIGIN_CATEGORIES = [
  ['Productos hortícolas', ['Verduras y hortalizas frescas']],
  ['Frutas', ['Frutas frescas']],
  ['Productos pecuarios', ['Carne bovina', 'Carne ovina', 'Huevos']],
  ['Productos pesqueros', ['Pescados frescos', 'Mariscos frescos', 'Productos congelados del mar']],
  ['Productos procesados', ['Quesos', 'Conservas', 'Mermeladas', 'Miel', 'Otros productos procesados de origen regional']],
];
const AYSEN_COMMUNES = ['Coyhaique', 'Lago Verde', 'Aysén', 'Cisnes', 'Guaitecas', 'Río Ibáñez', 'Chile Chico', 'Cochrane', "O'Higgins", 'Tortel', 'Sin información de comuna'];
const ORIGIN_SOURCES = ['Etiqueta o envase', 'Cartel', 'Información del responsable del establecimiento', 'Información del productor o feriante', 'Otra'];
const RESPONSIBLE_FIELDS = { classification: '#classificationResponsible', availability: '#availabilityResponsible', origins: '#originsResponsible', prices: '#pricesResponsible' };
let priceProductPickerId = 0;
let originItemId = 0;

const AVAILABILITY = [
  ['Disponibilidad', 'Frutas', 'Fruta sin azúcar añadida o con edulcorante no calórico. Ejemplos: lavada, picada, enlatada, tetra pack o congelada.'], ['Disponibilidad', 'Frutas', 'Jugos 100% de fruta sin azúcar añadida o con edulcorante no calórico.'], ['Disponibilidad', 'Frutas', 'Frutas secas sin azúcar ni sal agregada. Ejemplos: huesillos, pasas, manzana o plátano deshidratado.'], ['Disponibilidad', 'Frutas', 'Frutos secos sin azúcar ni sal agregada. Ejemplos: maní, almendras.'],
  ['Disponibilidad', 'Verduras', 'Verduras frescas, enlatadas, tetra pack o congeladas. Incluye papa, choclo, zapallo, brócoli, entre otras.'],
  ['Disponibilidad', 'Lácteos', 'Leche baja en grasa (descremada o semidescremada), líquida y/o en polvo.'], ['Disponibilidad', 'Lácteos', 'Leche saborizada sin azúcar añadida o sin sellos Alto En.'], ['Disponibilidad', 'Lácteos', 'Leche cultivada sin azúcar añadida o sin sellos Alto En.'], ['Disponibilidad', 'Lácteos', 'Yogurt sin azúcar añadida o sin sellos Alto En.'], ['Disponibilidad', 'Lácteos', 'Queso fresco (queso fresco, chacra o quesillo).'], ['Disponibilidad', 'Lácteos', 'Queso amarillo sin sellos Alto En.'],
  ['Disponibilidad', 'Legumbres', 'Porotos, lentejas, garbanzos, arvejas u otras legumbres. Pueden ser secas, enlatadas, tetra pack o congeladas.'],
  ['Disponibilidad', 'Carnes y huevo', 'Carnes bajas en grasa, frescas o congeladas. Ejemplos: pollo, pavo y cortes magros de carnes rojas, como posta.'], ['Disponibilidad', 'Carnes y huevo', 'Pescados y/o mariscos frescos o congelados.'], ['Disponibilidad', 'Carnes y huevo', 'Pescados listos para consumo, enlatados y/o tetra pack, bajos en sodio y envasados en agua.'], ['Disponibilidad', 'Carnes y huevo', 'Huevos frescos o cocidos.'],
  ['Disponibilidad', 'Granos', 'Cereales para desayuno sin azúcar añadida o sin sellos Alto En.'], ['Disponibilidad', 'Granos', 'Cereales como quínoa, amaranto, arroz integral, trigo mote, avena u otros.'], ['Disponibilidad', 'Granos', 'Pan integral. Ejemplos: centeno, salvado, chía, avena u otro.'],
  ['Disponibilidad', 'Bebestibles', 'Agua envasada natural y/o con gas.'], ['Disponibilidad', 'Bebestibles', 'Agua saborizada sin azúcar añadida o sin sellos Alto En.'], ['Disponibilidad', 'Bebestibles', 'Jugos 100% de fruta sin azúcar añadida o sin sellos Alto En.'], ['Disponibilidad', 'Bebestibles', 'Néctar sin azúcar añadida o sin sellos Alto En.'], ['Disponibilidad', 'Bebestibles', 'Bebidas sin azúcar añadida o sin sellos Alto En.'],
  ['Disponibilidad', 'Otros', 'Aceite vegetal. Ejemplos: oliva, canola o maravilla.'], ['Disponibilidad', 'Otros', 'Helados sin azúcar agregada o sin sellos Alto En.'], ['Disponibilidad', 'Otros', 'Té, café e infusiones sin azúcar agregada o con edulcorante no calórico.'],
  ['Disponibilidad', 'Preparaciones saludables', 'Sopas o ensaladas de verduras listas para consumo, sin salsas ni frituras.'], ['Disponibilidad', 'Preparaciones saludables', 'Sándwich listo para consumo con pan integral, con verduras y/o lácteos, carnes bajas en grasa como pescado, pavo, pollo, carnes rojas bajas en grasa y/o huevo.'], ['Disponibilidad', 'Preparaciones saludables', 'Tortilla integral lista para consumo (tipo taco o burrito), con verduras y/o lácteos, carnes bajas en grasa como pescado, pavo, pollo, carnes rojas bajas en grasa y/o huevo.'], ['Disponibilidad', 'Preparaciones saludables', 'Plato de fondo saludable, basado en legumbres, verduras, pescado, mariscos y/o algas como cochayuyo.'], ['Disponibilidad', 'Preparaciones saludables', 'Postre saludable, preparado a base de frutas y/o lácteos bajos en grasa, sin azúcar añadida.'], ['Disponibilidad', 'Preparaciones saludables', 'Té, café e infusiones listos para consumo, sin azúcar añadida o con edulcorante no calórico.'],
  ['Disponibilidad', 'No saludables', 'Snacks salados con más de un sello Alto En. Ejemplos: papas fritas o ramitas.'], ['Disponibilidad', 'No saludables', 'Snacks dulces con más de un sello Alto En. Ejemplos: galletas o chocolates.'], ['Disponibilidad', 'No saludables', 'Embutidos y cecinas envasados con más de un sello Alto En. Ejemplos: vienesas o salame.'], ['Disponibilidad', 'No saludables', 'Salsas y aderezos con más de un sello Alto En.'], ['Disponibilidad', 'No saludables', 'Salsas dulces con más de un sello Alto En.'], ['Disponibilidad', 'No saludables', 'Helados con más de un sello Alto En.'], ['Disponibilidad', 'No saludables', 'Masas dulces horneadas o fritas con azúcares refinados.'], ['Disponibilidad', 'No saludables', 'Masas saladas fritas u horneadas.'], ['Disponibilidad', 'No saludables', 'Comida rápida.'], ['Disponibilidad', 'No saludables', 'Gaseosas, jugos y néctares procesados con azúcar añadida y sello Alto En.'], ['Disponibilidad', 'No saludables', 'Bebidas deportivas o energéticas.'], ['Disponibilidad', 'No saludables', 'Snacks dulces/salados no saludables vendidos a granel.'],
  ['Variedad', 'Variedad', 'Frutas: 3 o más.'], ['Variedad', 'Variedad', 'Verduras: 3 o más.'], ['Variedad', 'Variedad', 'Leche baja en grasa o yogurt: 3 o más opciones, sin azúcar añadida o sin sellos Alto En.'], ['Variedad', 'Variedad', 'Queso bajo en grasa y queso fresco: 2 o más opciones, sin sellos Alto En.'], ['Variedad', 'Variedad', 'Legumbres: 2 o más opciones. Pueden ser frescas, secas, congeladas, envasadas, enlatadas y/o tetra pack.'], ['Variedad', 'Variedad', 'Carnes bajas en grasa: 2 o más tipos.'], ['Variedad', 'Variedad', 'Cereales para desayuno: 3 o más opciones, sin azúcar añadida o sin sellos Alto En.'], ['Variedad', 'Variedad', 'Aguas: 3 o más opciones, naturales y/o con gas y saborizadas sin azúcar añadida o sin sellos Alto En.'], ['Variedad', 'Variedad', 'Más de una preparación lista para consumo en porción pequeña o infantil (menú, plato o sándwich).'],
].map(([section, category, label]) => ({ section, category, label }));
const AVAILABILITY_LEGACY_LABELS = new Map([
  ['Fruta sin azúcar añadida o con edulcorante no calórico.', 'Fruta sin azúcar añadida o con edulcorante no calórico. Ejemplos: lavada, picada, enlatada, tetra pack o congelada.'],
  ['Frutas secas sin azúcar ni sal agregada.', 'Frutas secas sin azúcar ni sal agregada. Ejemplos: huesillos, pasas, manzana o plátano deshidratado.'],
  ['Frutos secos sin azúcar ni sal agregada.', 'Frutos secos sin azúcar ni sal agregada. Ejemplos: maní, almendras.'],
  ['Verduras frescas, enlatadas, tetra pack o congeladas.', 'Verduras frescas, enlatadas, tetra pack o congeladas. Incluye papa, choclo, zapallo, brócoli, entre otras.'],
  ['Leche baja en grasa.', 'Leche baja en grasa (descremada o semidescremada), líquida y/o en polvo.'],
  ['Queso fresco, chacra o quesillo.', 'Queso fresco (queso fresco, chacra o quesillo).'],
  ['Porotos, lentejas, garbanzos, arvejas u otras.', 'Porotos, lentejas, garbanzos, arvejas u otras legumbres. Pueden ser secas, enlatadas, tetra pack o congeladas.'],
  ['Carnes bajas en grasa frescas o congeladas.', 'Carnes bajas en grasa, frescas o congeladas. Ejemplos: pollo, pavo y cortes magros de carnes rojas, como posta.'],
  ['Pescados listos para consumo bajos en sodio y en agua.', 'Pescados listos para consumo, enlatados y/o tetra pack, bajos en sodio y envasados en agua.'],
  ['Huevo fresco o cocido.', 'Huevos frescos o cocidos.'],
  ['Cereales para desayuno sin azúcar agregada o sin sellos Alto En.', 'Cereales para desayuno sin azúcar añadida o sin sellos Alto En.'],
  ['Cereales: quínoa, amaranto, arroz integral, trigo mote, avena u otros.', 'Cereales como quínoa, amaranto, arroz integral, trigo mote, avena u otros.'],
  ['Pan integral.', 'Pan integral. Ejemplos: centeno, salvado, chía, avena u otro.'],
  ['Sopas o ensaladas de verduras sin salsas ni frituras.', 'Sopas o ensaladas de verduras listas para consumo, sin salsas ni frituras.'],
  ['Sándwich listo para consumo con pan integral y opciones saludables.', 'Sándwich listo para consumo con pan integral, con verduras y/o lácteos, carnes bajas en grasa como pescado, pavo, pollo, carnes rojas bajas en grasa y/o huevo.'],
  ['Tortillas integrales listas para consumo con opciones saludables.', 'Tortilla integral lista para consumo (tipo taco o burrito), con verduras y/o lácteos, carnes bajas en grasa como pescado, pavo, pollo, carnes rojas bajas en grasa y/o huevo.'],
  ['Plato de fondo saludable.', 'Plato de fondo saludable, basado en legumbres, verduras, pescado, mariscos y/o algas como cochayuyo.'],
  ['Postre saludable con frutas o lácteos.', 'Postre saludable, preparado a base de frutas y/o lácteos bajos en grasa, sin azúcar añadida.'],
  ['Té, café e infusiones sin azúcar agregada o con edulcorante no calórico.', 'Té, café e infusiones listos para consumo, sin azúcar añadida o con edulcorante no calórico.'],
  ['Té, café e infusiones sin azúcar añadida o con edulcorante no calórico.', 'Té, café e infusiones listos para consumo, sin azúcar añadida o con edulcorante no calórico.'],
  ['Más de una opción de preparación en porción pequeña para niños.', 'Más de una preparación lista para consumo en porción pequeña o infantil (menú, plato o sándwich).'],
  ['Snacks salados con más de un sello Alto En.', 'Snacks salados con más de un sello Alto En. Ejemplos: papas fritas o ramitas.'],
  ['Snacks dulces con más de un sello Alto En.', 'Snacks dulces con más de un sello Alto En. Ejemplos: galletas o chocolates.'],
  ['Embutidos y cecinas envasados con más de un sello Alto En.', 'Embutidos y cecinas envasados con más de un sello Alto En. Ejemplos: vienesas o salame.'],
  ['Leche o yogurt: 3 o más opciones bajas en grasa y sin azúcar o sin sellos Alto En.', 'Leche baja en grasa o yogurt: 3 o más opciones, sin azúcar añadida o sin sellos Alto En.'],
  ['Quesos o quesillos: 2 o más bajos en grasa y sin sellos Alto En.', 'Queso bajo en grasa y queso fresco: 2 o más opciones, sin sellos Alto En.'],
  ['Legumbres: 2 o más opciones.', 'Legumbres: 2 o más opciones. Pueden ser frescas, secas, congeladas, envasadas, enlatadas y/o tetra pack.'],
  ['Carnes bajas en grasas: 2 o más tipos.', 'Carnes bajas en grasa: 2 o más tipos.'],
  ['Cereales para desayuno: 3 o más sin azúcar o sin sellos Alto En.', 'Cereales para desayuno: 3 o más opciones, sin azúcar añadida o sin sellos Alto En.'],
  ['Aguas: 3 o más opciones.', 'Aguas: 3 o más opciones, naturales y/o con gas y saborizadas sin azúcar añadida o sin sellos Alto En.'],
  ['Más de una preparación en porción pequeña para niños.', 'Más de una preparación lista para consumo en porción pequeña o infantil (menú, plato o sándwich).'],
  ['Leche baja en grasa, líquida y/o en polvo.', 'Leche baja en grasa (descremada o semidescremada), líquida y/o en polvo.'],
  ['Carnes bajas en grasa, frescas o congeladas. Ejemplos: pollo, pavo y cortes bajos en grasa de carnes rojas, como posta.', 'Carnes bajas en grasa, frescas o congeladas. Ejemplos: pollo, pavo y cortes magros de carnes rojas, como posta.'],
  ['Sopas de verduras o ensaladas de verduras sin salsas ni frituras.', 'Sopas o ensaladas de verduras listas para consumo, sin salsas ni frituras.'],
  ['Aceite vegetal.', 'Aceite vegetal. Ejemplos: oliva, canola o maravilla.'],
]);
const $ = (selector, root = document) => root.querySelector(selector);
let currentView = 'visitView';

function getDraft() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (_) { return null; } }
function setDraft(draft) { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); updateMenu(); }
function getQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (_) { return []; } }
function setQueue(queue) { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); }
function newId() { return 'VIS-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(); }
const NAME_PARTICLES = ['de', 'del', 'la', 'las', 'los', 'y', 'da', 'do', 'dos', 'van', 'von'];
function normalizeInitials_(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
}
function initialsFromName_(name) {
  const words = String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^A-Za-z]+/).filter((word) => word && !NAME_PARTICLES.includes(word.toLowerCase()));
  if (!words.length) return '';
  if (words.length === 1) return normalizeInitials_(words[0].slice(0, 2));
  return normalizeInitials_(words.slice(0, 3).map((word) => word[0]).join(''));
}
function getCollectorProfile() { try { return JSON.parse(localStorage.getItem(COLLECTOR_KEY) || 'null'); } catch (_) { return null; } }
function rememberCollector() {
  localStorage.setItem(COLLECTOR_KEY, JSON.stringify({ name: $('#collector').value.trim(), initials: currentInitials() }));
}
function currentInitials() { return initialsFromName_($('#collector').value); }
function updateCollectorHint() {
  const initials = currentInitials();
  $('#collectorCodeHint').textContent = initials.length >= 2
    ? `Iniciales para locales nuevos: ${initials} (se obtienen del nombre).`
    : 'Escriba nombre y apellidos. Sus iniciales se agregan solas al código de los locales nuevos.';
}
function newLocalCode(initials) {
  const stored = Number(localStorage.getItem(NEW_LOCAL_COUNTER_KEY) || '0');
  const highest = SAMPLE_LOCALS.reduce((max, local) => {
    const match = String(local.code).match(/^LM(\d+)/i);
    return Math.max(max, match ? Number(match[1]) : 0);
  }, 0);
  const next = Math.max(highest + 1, stored + 1);
  localStorage.setItem(NEW_LOCAL_COUNTER_KEY, String(next));
  return 'LM' + String(next).padStart(2, '0') + 'N' + normalizeInitials_(initials);
}
function setOptions(select, values, blank) { select.replaceChildren(...(blank ? [new Option(blank, '')] : []), ...values.map((value) => new Option(value, value))); }
function showMessage(text, type) { const el = $('#message'); el.textContent = text; el.className = type; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
const INSTRUMENT_VIEWS = {
  classification: ['classificationView'],
  availability: ['availabilityView'],
  origins: ['originsView'],
  prices: ['pricesView', 'pricesReviewView', 'priceEditorView'],
};
const MAX_APPLICATION_SECONDS = 12 * 60 * 60;
function instrumentForView_(viewId) {
  return Object.keys(INSTRUMENT_VIEWS).find((instrument) => INSTRUMENT_VIEWS[instrument].includes(viewId)) || '';
}
function pauseInstrumentTimer_(draft) {
  const timing = draft && draft.timing;
  if (!timing || !timing.active || !timing.active.startedAt) return false;
  const instrument = timing.active.instrument;
  const elapsed = Math.max(0, Date.now() - timing.active.startedAt);
  timing.pendingMs = timing.pendingMs || {};
  timing.pendingMs[instrument] = (Number(timing.pendingMs[instrument]) || 0) + elapsed;
  timing.active.startedAt = 0;
  return true;
}
function resumeInstrumentTimer_(draft, instrument) {
  const active = draft && draft.timing && draft.timing.active;
  if (!active || active.instrument !== instrument || active.startedAt || document.visibilityState === 'hidden') return false;
  active.startedAt = Date.now();
  return true;
}
function startInstrumentTimer_(instrument) {
  const draft = getDraft();
  if (!draft || !INSTRUMENT_VIEWS[instrument]) return;
  draft.timing = draft.timing || { pendingMs: {}, active: null };
  draft.timing.pendingMs = draft.timing.pendingMs || {};
  if (draft.timing.active && draft.timing.active.instrument !== instrument) pauseInstrumentTimer_(draft);
  if (!draft.timing.active || draft.timing.active.instrument !== instrument) {
    draft.timing.active = { instrument: instrument, startedAt: 0 };
  }
  resumeInstrumentTimer_(draft, instrument);
  setDraft(draft);
}
function applicationDurationSeconds_(draft, instrument) {
  const pendingMs = Number(draft.timing?.pendingMs?.[instrument]) || 0;
  const active = draft.timing?.active;
  const runningMs = active?.instrument === instrument && active.startedAt
    ? Math.max(0, Date.now() - active.startedAt) : 0;
  const seconds = Math.max(1, Math.round((pendingMs + runningMs) / 1000));
  return seconds > MAX_APPLICATION_SECONDS ? null : seconds;
}
function clearInstrumentTimer_(draft, instrument) {
  if (!draft.timing) return;
  if (draft.timing.pendingMs) delete draft.timing.pendingMs[instrument];
  if (draft.timing.active && draft.timing.active.instrument === instrument) draft.timing.active = null;
}
function showView(id) {
  const draft = getDraft();
  let timingChanged = false;
  const previousInstrument = instrumentForView_(currentView);
  const nextInstrument = instrumentForView_(id);
  if (draft && previousInstrument && previousInstrument !== nextInstrument) {
    timingChanged = pauseInstrumentTimer_(draft) || timingChanged;
  }
  document.querySelectorAll('.view').forEach((view) => { view.hidden = view.id !== id; });
  currentView = id;
  if (draft && nextInstrument) timingChanged = resumeInstrumentTimer_(draft, nextInstrument) || timingChanged;
  if (draft && timingChanged) setDraft(draft);
  window.scrollTo(0, 0);
}
function downloadBackup(format) {
  const draft = getDraft();
  if (!draft) return showMessage('No hay una visita activa para respaldar.', 'error');
  const backup = { exportedAt: new Date().toISOString(), application: 'ESPORA Coyhaique', visit: draft, pending: getQueue().filter((item) => item.visit?.id === draft.id) };
  const filename = 'espora-' + (draft.id || 'respaldo') + '-' + new Date().toISOString().slice(0, 10);
  const content = format === 'html'
    ? '<!doctype html><html lang="es"><meta charset="utf-8"><title>Respaldo ESPORA ' + escapeHtml_(draft.id) + '</title><body><h1>Respaldo ESPORA Coyhaique</h1><p>Exportado: ' + escapeHtml_(backup.exportedAt) + '</p><pre>' + escapeHtml_(JSON.stringify(backup, null, 2)) + '</pre></body></html>'
    : JSON.stringify(backup, null, 2);
  const blob = new Blob([content], { type: format === 'html' ? 'text/html;charset=utf-8' : 'application/json;charset=utf-8' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename + '.' + format; link.click(); URL.revokeObjectURL(link.href);
  showMessage('Respaldo descargado correctamente.', 'success');
}
function escapeHtml_(value) { return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }

async function api(payload, action = 'saveInstrument') {
  if (!API_URL) throw new Error('Falta configurar la URL de captura del nuevo estudio.');
  const requestPayload = { ...payload };
  if (payload.visit) {
    requestPayload.visit = {
      ...payload.visit,
      frontisPhoto: payload.visit.frontisPhoto?.url ? { url: payload.visit.frontisPhoto.url } : null,
      photos: payload.visit.photos ? {
        frontisUrl: payload.visit.photos.frontisUrl || '',
        additionalUrls: payload.visit.photos.additionalUrls || [],
        folderUrl: payload.visit.photos.folderUrl || '',
      } : null,
    };
  }
  if (action === 'saveInstrument' && payload.instrument === 'classification') {
    const { images, ...data } = payload.data;
    requestPayload.data = data;
  } else if (action === 'saveInstrument' && payload.instrument === 'prices') {
    const products = priceEntries_(payload.data);
    requestPayload.data = Array.isArray(payload.data)
      ? products
      : { ...payload.data, products };
  }
  let response;
  try {
    response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload: requestPayload }), redirect: 'follow' });
  } catch (networkError) {
    throw new Error('No fue posible conectar con el servicio. Verifique su conexión e intente nuevamente.');
  }
  if (!response.ok) throw new Error('El servicio respondió con un error (' + response.status + ').');
  let result;
  try {
    result = await response.json();
  } catch (parseError) {
    throw new Error('El servicio respondió en un formato inesperado. Puede que la implementación de Apps Script deba actualizarse.');
  }
  if (!result || !result.ok) throw new Error((result && result.error) || 'El servidor rechazó el registro.');
  return result.data;
}

function getLocal() {
  const codeEl = $('#localCode');
  if (!codeEl) return null;
  return SAMPLE_LOCALS.find((local) => local.code === codeEl.value.trim().toUpperCase());
}

function normalizeSearchText_(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function filterSampleLocals_(query) {
  const terms = normalizeSearchText_(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return SAMPLE_LOCALS;
  return SAMPLE_LOCALS.filter((local) => {
    const haystack = normalizeSearchText_(
      `${local.code} ${local.id || ''} ${local.name} ${local.address}`
    );
    return terms.every((term) => haystack.includes(term));
  });
}

function populateLocalCodeOptions(filterText) {
  const select = $('#localCode');
  if (!select) return;
  const searchInput = $('#localSearch');
  const query = String(filterText !== undefined ? filterText : (searchInput ? searchInput.value : '')).trim();
  const previous = select.value;
  const countEl = $('#localSearchCount');
  const clearBtn = $('#clearLocalSearch');
  const filtered = filterSampleLocals_(query);

  if (clearBtn) clearBtn.hidden = !query;

  if (countEl) {
    if (!query) {
      countEl.textContent = `${SAMPLE_LOCALS.length} locales disponibles en la muestra. Escriba para acotar.`;
    } else if (filtered.length === 1) {
      countEl.textContent = `1 local encontrado (${filtered[0].code} · ${filtered[0].name}).`;
    } else if (filtered.length > 1) {
      countEl.textContent = `${filtered.length} locales encontrados de ${SAMPLE_LOCALS.length}.`;
    } else {
      countEl.textContent = 'No se encontraron locales que coincidan con la búsqueda.';
    }
  }

  const defaultText = !query
    ? 'Seleccione un local…'
    : filtered.length > 0
    ? `Seleccione entre los ${filtered.length} locales encontrados…`
    : 'Sin coincidencias con la búsqueda';

  const options = filtered.map((local) => new Option(`${local.code} — ${local.name} — ${local.address}`, local.code));
  select.replaceChildren(new Option(defaultText, ''), ...options);

  if (previous && [...select.options].some((option) => option.value === previous)) {
    select.value = previous;
  } else if (query && filtered.length === 1) {
    select.value = filtered[0].code;
    updateLocal();
  } else if (previous && query) {
    updateLocal();
  }
}

function clearLocalSearch_() {
  const searchInput = $('#localSearch');
  if (searchInput) searchInput.value = '';
  populateLocalCodeOptions('');
  if (searchInput) searchInput.focus();
}
function updateLocal({ restore = false } = {}) {
  const isNew = $('#isNewLocal').checked;
  const local = getLocal();
  const code = $('#localCode');
  $('#sampleLocalFields').hidden = isNew;
  $('#newLocalFields').hidden = !isNew;
  $('#localCode').required = !isNew;
  ['newLocalName', 'newLocalAddress', 'newLocalType'].forEach((id) => { $('#' + id).required = isNew; });
  if (isNew) {
    code.setCustomValidity('');
    const initials = currentInitials();
    const codeField = $('#newLocalCode');
    if (initials.length < 2) {
      codeField.value = '';
      codeField.placeholder = 'Ingrese primero el nombre de la persona recolectora';
    } else if (!NEW_LOCAL_CODE_PATTERN.test(codeField.value)) {
      codeField.value = newLocalCode(initials);
    }
    return;
  }
  if (!local) {
    code.setCustomValidity(code.value ? 'Ingrese un código válido de la muestra.' : '');
    if (!restore) {
      $('#latitude').value = '';
      $('#longitude').value = '';
    }
    return;
  }
  code.setCustomValidity('');
  if (!restore) {
    $('#latitude').value = local.latitude || '';
    $('#longitude').value = local.longitude || '';
  }
}
function localFormIsValid() {
  if ($('#isNewLocal').checked) {
    return Boolean($('#newLocalName').value.trim() && $('#newLocalAddress').value.trim()
      && $('#newLocalType').value && NEW_LOCAL_CODE_PATTERN.test($('#newLocalCode').value));
  }
  return Boolean(getLocal());
}
function visitFromForm(existing) {
  const isNew = $('#isNewLocal').checked;
  const localCode = isNew ? $('#newLocalCode').value : $('#localCode').value;
  return {
    id: existing?.id || newId(),
    observationDate: $('#observationDate').value,
    collector: $('#collector').value,
    collectorInitials: currentInitials(),
    localCode,
    unitVecinal: existing?.localCode === localCode ? existing.unitVecinal || '' : '',
    frontisPhoto: existing?.localCode === localCode ? existing.frontisPhoto : null,
    photos: existing?.localCode === localCode ? existing.photos : null,
    interiorPhotoAuthorization: $('#interiorPhotoAuthorization').value || 'No consultada',
    latitude: $('#latitude').value,
    longitude: $('#longitude').value,
    isNewLocal: isNew,
    localName: isNew ? $('#newLocalName').value.trim() : '',
    localAddress: isNew ? $('#newLocalAddress').value.trim() : '',
    localType: isNew ? $('#newLocalType').value : '',
    instruments: existing?.instruments || {},
    instrumentDurations: existing?.instrumentDurations || {},
    totalVisitDurationSeconds: existing?.totalVisitDurationSeconds || 0,
    timing: existing?.timing || { pendingMs: {}, active: null },
    resumedFromSheets: Boolean(existing?.resumedFromSheets),
  };
}
function fillVisit(visit) {
  const sampleLocal = SAMPLE_LOCALS.find((local) => local.code === visit.localCode);
  const latitude = visit.latitude || sampleLocal?.latitude;
  const longitude = visit.longitude || sampleLocal?.longitude;
  Object.entries({ observationDate: visit.observationDate, collector: visit.collector, latitude, longitude }).forEach(([id, value]) => { $('#' + id).value = value || ''; });
  $('#interiorPhotoAuthorization').value = visit.interiorPhotoAuthorization || 'No consultada';
  updateCollectorHint();
  $('#isNewLocal').checked = Boolean(visit.isNewLocal);
  $('#isExistingLocal').checked = !visit.isNewLocal;
  const searchInput = $('#localSearch');
  if (searchInput) searchInput.value = '';
  populateLocalCodeOptions('');
  if (visit.isNewLocal) { $('#newLocalCode').value = visit.localCode || ''; $('#newLocalName').value = visit.localName || ''; $('#newLocalAddress').value = visit.localAddress || ''; $('#newLocalType').value = ['Almacén', 'Minimarket'].includes(visit.localType) ? 'Almacén o minimarket' : visit.localType || ''; } else { $('#localCode').value = visit.localCode || ''; }
  updateLocal({ restore: true });
  renderVisitFrontis_(visit);
  renderVisitPhotos_(visit);
}
function updateMenu() {
  const draft = getDraft(); if (!draft) return;
  const local = SAMPLE_LOCALS.find((item) => item.code === draft.localCode);
  $('#visitSummary').textContent = `${draft.id} · ${local?.name || draft.localName || draft.localCode} · ${draft.observationDate} · Identificó: ${draft.collector}`;
  $('#resumedVisitNotice').hidden = !draft.resumedFromSheets;
  ['classification', 'availability', 'prices', 'origins'].forEach((name) => {
    const instrument = draft.instruments[name];
    const queued = getQueue().some((item) => item.visit?.id === draft.id && item.instrument === name);
    const duration = instrument && instrument.durationSeconds ? ` · ${formatDuration_(instrument.durationSeconds)}` : '';
    $('#' + name + 'Status').textContent = instrument?.saved
      ? ` ✓ guardado${duration}`
      : queued ? ` · en cola${duration}` : instrument?.data ? ' · borrador' : ' · pendiente';
  });
  renderVisitPhotos_(draft);
  const unsaved = unsavedInstrumentNames_(draft);
  const queuedCount = getQueue().filter((item) => item.visit?.id === draft.id).length;
  const status = $('#visitSaveStatus');
  const message = unsaved.length
    ? `Pendiente de guardar en Sheets: ${unsaved.join(', ')}.${queuedCount ? ` ${queuedCount} envío(s) en cola de sincronización.` : ''} Descargue un respaldo offline antes de cerrar.`
    : queuedCount
      ? `${queuedCount} envío(s) pendiente(s) de sincronización. Mantenga la conexión hasta confirmar el guardado en Sheets.`
      : 'Los instrumentos con registros están guardados en Sheets.';
  const totalDuration = Number(draft.totalVisitDurationSeconds) || 0;
  status.textContent = `${message}${totalDuration ? ` Tiempo medido de las pautas guardadas: ${formatDuration_(totalDuration)}.` : ''}`;
}
function formatDuration_(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return minutes ? `${minutes} min ${String(remainder).padStart(2, '0')} s` : `${remainder} s`;
}
function unsavedInstrumentNames_(draft) {
  const labels = { classification: 'Clasificación', availability: 'Disponibilidad y variedad', origins: 'Origen', prices: 'Precios' };
  return Object.entries(labels)
    .filter(([name]) => draft.instruments[name]?.data && !draft.instruments[name]?.saved)
    .map(([, label]) => label);
}
function updateConnection() { const online = navigator.onLine; $('#connection').textContent = !API_URL ? 'Captura aún no configurada para este estudio.' : online ? 'Con conexión. Los instrumentos se guardan en la base de datos.' : 'Sin conexión. Los instrumentos se conservarán en este dispositivo hasta sincronizarlos.'; $('#connection').className = online && API_URL ? 'online' : 'offline'; }

function renderAvailability(data) {
  const root = $('#availabilityItems'); root.replaceChildren();
  const groups = new Map();
  AVAILABILITY.forEach((item) => { const key = item.section + ' — ' + item.category; groups.set(key, [...(groups.get(key) || []), item]); });
  groups.forEach((items, title) => {
    const fieldset = $('#availabilityTemplate').content.firstElementChild.cloneNode(true); $('legend', fieldset).textContent = title;
    items.forEach((item) => { const row = document.createElement('div'); row.className = 'choice-row'; const value = data?.find((entry) => entry.section === item.section && entry.category === item.category && (entry.label === item.label || AVAILABILITY_LEGACY_LABELS.get(entry.label) === item.label))?.value || ''; const radioName = cssId(item.section + '-' + item.category + '-' + item.label); row.innerHTML = `<span>${item.label}</span><label><input type="radio" name="${radioName}" value="Sí" ${value === 'Sí' ? 'checked' : ''} required> Sí</label><label><input type="radio" name="${radioName}" value="No" ${value === 'No' ? 'checked' : ''}> No</label>`; row.dataset.item = JSON.stringify(item); $('.availability-rows', fieldset).append(row); });
    root.append(fieldset);
  });
}
function cssId(text) { return 'item-' + text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\W/g, '-'); }
function availabilityData() { return [...document.querySelectorAll('.choice-row')].map((row) => ({ ...JSON.parse(row.dataset.item), value: $('input:checked', row)?.value || '' })); }

function addPriceProduct(entry) {
  const card = $('#priceProductTemplate').content.firstElementChild.cloneNode(true);
  const picker = $('.price-product-picker', card);
  const search = $('.price-product-search', picker);
  const categoryFilters = $('.price-product-categories', picker);
  const optionList = $('.price-product-options', picker);
  const empty = $('.price-product-empty', picker);
  const selected = $('.price-product-selected', picker);
  const products = [...PRODUCTS, ...LEGACY_PRICE_PRODUCTS.filter((legacy) => entry?.product === legacy.name)];
  const freeEntry = products.length === 0;
  let productName = canonicalPriceProduct_(entry?.product || '');
  card.dataset.productName = productName;
  if (freeEntry) {
    const freeFields = $('.price-free-fields', card);
    const nameInput = $('.price-product-name', freeFields);
    const groupInput = $('.price-product-group', freeFields);
    picker.hidden = true;
    freeFields.hidden = false;
    $('.price-category-label', card).hidden = true;
    nameInput.value = entry?.product || '';
    groupInput.value = entry?.category || '';
    const syncFreeEntry = () => {
      productName = nameInput.value.trim();
      card.dataset.productName = productName;
      updatePriceStatus_(card);
      card.querySelectorAll('.price-observation').forEach((row) => syncPriceNotes_(card, row));
    };
    nameInput.addEventListener('input', syncFreeEntry);
    groupInput.addEventListener('input', syncFreeEntry);
    syncFreeEntry();
  } else {
    const groups = [...new Set(products.map((product) => product.category))];
    const existingProducts = new Set(priceEntries_(getDraft()?.instruments.prices?.data).map((item) => item.product));
    const pickerId = ++priceProductPickerId;
    const radioName = `price-product-${pickerId}`;
    let selectedGroup = '';
    const categoryButtons = new Map();
    const renderOptions = () => {
      const query = search.value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
      const matches = products.filter((product) =>
        (!selectedGroup || product.category === selectedGroup) &&
        (!query || `${product.name} ${product.category}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().includes(query)));
      optionList.replaceChildren();
      empty.hidden = matches.length > 0;
      matches.forEach((product) => {
        const label = document.createElement('label');
        label.className = 'price-product-option';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = radioName;
        radio.value = product.name;
        radio.required = true;
        radio.checked = product.name === productName;
        radio.disabled = existingProducts.has(product.name) && product.name !== productName;
        label.classList.toggle('is-selected', radio.checked);
        const name = document.createElement('span');
        name.className = 'price-product-option-name';
        name.textContent = product.name;
        const detail = document.createElement('span');
        detail.className = 'price-product-option-detail';
        detail.textContent = existingProducts.has(product.name) && product.name !== productName
          ? 'Ya agregado'
          : product.category;
        label.append(radio, name, detail);
        optionList.append(label);
        radio.addEventListener('change', () => {
          if (productName && productName !== radio.value) {
            const hasPriceDetails = [...card.querySelectorAll('.brand, .price-value, .notes')]
              .some((field) => field.value.trim()) ||
              [...card.querySelectorAll('.unit')].some((field) => field.value !== PRICE_UNITS[0]) ||
              [...card.querySelectorAll('.promotion')].some((field) => field.value !== 'No');
            if (hasPriceDetails && !window.confirm('Al cambiar el alimento, también se borrarán los precios y observaciones ingresados. ¿Quieres continuar?')) {
              search.value = '';
              selectedGroup = '';
              categoryButtons.forEach((button, group) => button.setAttribute('aria-pressed', String(group === '')));
              renderOptions();
              return;
            }
            card.querySelectorAll('.brand, .price-value, .notes').forEach((field) => { field.value = ''; });
            card.querySelectorAll('.unit').forEach((field) => { field.value = PRICE_UNITS[0]; });
            card.querySelectorAll('.promotion').forEach((field) => { field.value = 'No'; });
            $('.price-maximum-entry', card).open = false;
            $('.price-status', card).value = 'precio_obtenido';
          }
          productName = radio.value;
          card.dataset.productName = productName;
          optionList.querySelectorAll('.price-product-option').forEach((option) => option.classList.remove('is-selected'));
          label.classList.add('is-selected');
          $('.price-category', card).value = product.category;
          $('.price-product-selected-name', selected).textContent = product.name;
          const guidance = $('.price-guidance', card);
          guidance.textContent = priceGuidance_(product);
          guidance.hidden = !guidance.textContent;
          selected.hidden = false;
          picker.classList.add('has-selection');
          search.value = '';
          selectedGroup = '';
          categoryButtons.forEach((button, group) => button.setAttribute('aria-pressed', String(group === '')));
          renderOptions();
          updatePriceStatus_(card);
          card.querySelectorAll('.price-observation').forEach((row) => {
            const notes = $('.notes', row);
            const filled = row.dataset.kind === 'min' || $('.price-value', row).value !== '';
            notes.required = filled &&
              ($('.unit', row).value === 'Otros' || productName === 'Arroz blanco grado 1');
            if (row.dataset.kind !== 'min') $('.brand', row).required = filled;
            syncPriceNotes_(card, row);
          });
        });
      });
    };
    const filterButton = (label, group) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'price-category-filter';
      button.textContent = label;
      button.setAttribute('aria-pressed', String(group === ''));
      button.addEventListener('click', () => {
        selectedGroup = group;
        categoryButtons.forEach((item, key) => item.setAttribute('aria-pressed', String(key === group)));
        renderOptions();
      });
      categoryButtons.set(group, button);
      categoryFilters.append(button);
    };
    filterButton('Todos', '');
    groups.forEach((group) => filterButton(group, group));
    search.addEventListener('input', renderOptions);
    $('.price-product-change', selected).addEventListener('click', () => {
      picker.classList.remove('has-selection');
      search.focus();
    });
    renderOptions();
  }
  const statusSelect = $('.price-status', card);
  statusSelect.value = entry?.status || 'precio_obtenido';
  statusSelect.addEventListener('change', () => updatePriceStatus_(card));
  $('.remove-product', card).addEventListener('click', () => { card.remove(); });
  $('#priceProducts').append(card);
  const prices = entry?.prices || [];
  addPriceRow(card, prices[0] || {}, 'min');
  const maximumEntry = document.createElement('details');
  maximumEntry.className = 'price-maximum-entry';
  maximumEntry.innerHTML = '<summary>Agregar el precio más alto (si encontraste otra opción)</summary>';
  $('.price-observations', card).append(maximumEntry);
  addPriceRow(card, prices[1] || {}, 'max', maximumEntry);
  if (prices[1] && (prices[1].brand || prices[1].value || prices[1].notes)) maximumEntry.open = true;
  if (productName) {
    const chosen = products.find((product) => product.name === productName);
    if (chosen) {
      $('.price-category', card).value = chosen.category;
      card.dataset.productName = chosen.name;
      $('.price-product-selected-name', selected).textContent = chosen.name;
      const guidance = $('.price-guidance', card);
      guidance.textContent = priceGuidance_(chosen);
      guidance.hidden = !guidance.textContent;
      selected.hidden = false;
      picker.classList.add('has-selection');
    }
  }
  updatePriceStatus_(card);
}
function priceGuidance_(product) {
  if (product.name === 'Manzana Fuji') return 'Si no encuentras Fuji, marca «Producto no disponible».';
  if (product.name === 'Arroz blanco grado 1') return 'Cuéntanos junto a la marca qué tipo de arroz encontraste.';
  if (product.category === 'Emblemáticos regionales') return 'Registra este alimento cuando ya confirmaste su origen en la pauta anterior.';
  return '';
}
function updatePriceStatus_(card) {
  const selectedProduct = Boolean(priceProduct_(card));
  $('.price-status', card).disabled = !selectedProduct;
  const available = selectedProduct && $('.price-status', card).value === 'precio_obtenido';
  const rows = $('.price-observations', card);
  rows.hidden = !available;
  rows.querySelectorAll('input, select, textarea').forEach((field) => { field.disabled = !available; });
}
function priceProduct_(card) { return card.dataset.productName || ''; }
function addPriceRow(card, data = {}, kind, container = $('.price-observations', card)) {
  const row = $('#priceObservationTemplate').content.firstElementChild.cloneNode(true);
  row.dataset.kind = kind;
  setOptions($('.unit', row), PRICE_UNITS); $('.unit', row).value = PRICE_UNITS.includes(data.unit) ? data.unit : PRICE_UNITS[0];
  $('.brand', row).value = data.brand || ''; $('.price-value', row).value = data.value || ''; $('.promotion', row).value = data.promotion || 'No'; $('.notes', row).value = data.notes || '';
  $('.price-range-label strong', row).textContent = kind === 'min' ? 'mínimo observado' : 'máximo observado (si hay más de una opción)';
  syncPriceNotes_(card, row);
  if (kind === 'min') { $('.brand-field', row).classList.add('required'); $('.price-field', row).classList.add('required'); $('.unit-field', row).classList.add('required'); $('.brand', row).required = true; $('.price-value', row).required = true; }
  const syncNotes = () => {
    const filled = kind === 'min' || $('.price-value', row).value !== '';
    const riceNeedsType = priceProduct_(card) === 'Arroz blanco grado 1';
    $('.notes', row).required = filled && ($('.unit', row).value === 'Otros' || riceNeedsType);
    syncPriceNotes_(card, row);
    if (kind !== 'min') $('.brand', row).required = filled;
  };
  $('.unit', row).addEventListener('change', syncNotes); $('.price-value', row).addEventListener('input', syncNotes);
  syncNotes();
  container.append(row);
}
function syncPriceNotes_(card, row) {
  const notes = $('.notes', row);
  notes.placeholder = priceProduct_(card) === 'Arroz blanco grado 1'
    ? 'Ej.: arroz grano largo'
    : $('.unit', row).value === 'Otros' ? 'Cuéntanos el formato (ej.: bolsa de 5 kg).' : 'Agrega un detalle si hace falta.';
}
function priceData() {
  const entries = [...document.querySelectorAll('.product-card')].map((card) => {
    const product = priceProduct_(card);
    if (!product) throw new Error('Elige un alimento antes de guardar sus precios.');
    const groupInput = $('.price-product-group', card);
    const category = (groupInput ? groupInput.value : $('.price-category', card)?.value || '').trim();
    if (groupInput && !category) throw new Error('Indica el grupo del producto antes de guardar sus precios.');
    const status = $('.price-status', card).value;
    return {
      product,
      category,
      status,
      prices: status !== 'precio_obtenido' ? [] : [...card.querySelectorAll('.price-observation')]
      .filter((row) => row.dataset.kind === 'min' || $('.price-value', row).value !== '')
      .map((row) => ({ type: row.dataset.kind === 'min' ? 'Mínimo' : 'Máximo', brand: $('.brand', row).value.trim(), value: $('.price-value', row).value, unit: $('.unit', row).value, promotion: $('.promotion', row).value, notes: $('.notes', row).value.trim() })),
    };
  });
  const seen = new Set();
  entries.forEach((entry) => {
    if (seen.has(entry.product)) throw new Error('Ya agregaste este alimento. Puedes volver a su registro para actualizarlo.');
    seen.add(entry.product);
  });
  return entries;
}
function renderPrices(data) { $('#priceProducts').replaceChildren(); (data || []).forEach(addPriceProduct); }
function canonicalPriceProduct_(name) {
  if (name === 'Lenteja 6 mm') return 'Lenteja';
  if (name === 'Merluza austral fresca' || name === 'Merluza austral congelada') return 'Merluza austral';
  return name;
}
function priceEntries_(data) {
  const entries = data && !Array.isArray(data) ? data.products || [] : data || [];
  const allowed = new Set([...PRODUCTS, ...LEGACY_PRICE_PRODUCTS].map((product) => product.name));
  const enforceCatalog = allowed.size > 0;
  const grouped = new Map();
  entries.filter((entry) => !enforceCatalog || allowed.has(canonicalPriceProduct_(entry.product)) ||
    ['Lenteja 6 mm', 'Merluza austral fresca', 'Merluza austral congelada'].includes(entry.product))
    .forEach((entry) => {
      const originalProduct = entry.product;
      const product = canonicalPriceProduct_(originalProduct);
      const oldType = originalProduct === 'Merluza austral fresca' ? 'Conservación registrada: fresca.' :
        originalProduct === 'Merluza austral congelada' ? 'Conservación registrada: congelada.' : '';
      const prices = (entry.prices || []).map((price) => ({
        ...price,
        notes: [oldType, price.notes].filter(Boolean).join(' '),
      }));
      const group = grouped.get(product) || { product, category: entry.category || '', status: entry.status || 'precio_obtenido', prices: [] };
      group.prices.push(...prices);
      group.legacyMerged = group.legacyMerged || originalProduct !== product;
      if (prices.length) group.status = 'precio_obtenido';
      else if (entry.status && group.status !== 'precio_obtenido') group.status = entry.status;
      grouped.set(product, group);
    });
  return [...grouped.values()].map((entry) => {
    const legacyMerged = entry.legacyMerged;
    delete entry.legacyMerged;
    if (!legacyMerged || entry.prices.length <= 1) return entry;
    const sorted = entry.prices.slice().sort((a, b) => Number(a.value) - Number(b.value));
    const lowest = { ...sorted[0], type: 'Mínimo' };
    const highest = { ...sorted[sorted.length - 1], type: 'Máximo' };
    return { ...entry, prices: Number(lowest.value) === Number(highest.value) ? [lowest] : [lowest, highest] };
  });
}
function renderPriceReview(data) {
  const entries = priceEntries_(data);
  $('#priceReviewItems').replaceChildren();
  $('#pricesNotes').value = data && !Array.isArray(data) ? data.notes || '' : '';
  if (!entries.length) {
    $('#priceReviewItems').innerHTML = '<p class="empty-state">Empieza con «Agregar producto» y registra cada alimento que encontraste.</p>';
    return;
  }
  const statusLabels = {
    producto_no_disponible: 'Producto no disponible',
    precio_no_obtenido: 'No fue posible obtener el precio',
  };
  entries.forEach((entry) => {
    const item = document.createElement('article');
    item.className = 'price-review-item';
    const priceText = (price) => price ? `$${escapeHtml_(price.value)} / ${escapeHtml_(price.unit)}${price.brand ? ' (' + escapeHtml_(price.brand) + ')' : ''}` : '—';
    const status = entry.status || 'precio_obtenido';
    const detail = status === 'precio_obtenido'
      ? `Mínimo: ${priceText(entry.prices[0])} · Máximo: ${priceText(entry.prices[1])}`
      : statusLabels[status] || 'Estado no reconocido';
    item.innerHTML = `<strong>${escapeHtml_(entry.product)}</strong><span>${escapeHtml_(detail)}</span>`;
    $('#priceReviewItems').append(item);
  });
}
function openPriceEditor() {
  $('#priceProducts').replaceChildren();
  addPriceProduct();
  showView('priceEditorView');
}
function savePriceDraftFromEditor() {
  const draft = getDraft();
  const newEntries = priceData();
  if (!newEntries.length) throw new Error('Agregue al menos un alimento.');
  const existingEntries = priceEntries_(draft.instruments.prices?.data);
  const entries = existingEntries.concat(newEntries);
  draft.instruments.prices = { data: entries, saved: false };
  setDraft(draft);
  renderPriceReview(draft.instruments.prices.data);
  showView('pricesReviewView');
}
function selectedProteins_() {
  return [...document.querySelectorAll('input[name="proteinCategory"]:checked')]
    .filter((input) => input.value === 'pescados_mariscos' || $('#rubroMeat').checked)
    .map((input) => input.value);
}
function classificationData() {
  const produce = $('#rubroProduce').checked;
  return {
    unitVecinal: getDraft()?.unitVecinal || '', estadoLocal: 'abierto',
    sistemaAtencion: $('#classificationService').value,
    rubroFrutasHortalizas: produce ? 'si' : 'no',
    rubroCarneFresca: $('#rubroMeat').checked ? 'si' : 'no',
    variedadesFrutasVerduras: produce ? $('#classificationProduceVarieties').value : '0',
    categoriasProteicas: selectedProteins_(),
    lacteosHabituales: $('#rubroDairy').checked ? 'si' : 'no',
    huevosHabituales: $('#rubroEggs').checked ? 'si' : 'no',
    personasAtendiendo: $('#classificationPeople').value,
    clasificacionOverride: $('#classificationOverride').value,
    justificacionOverride: $('#classificationJustification').value, observaciones: $('#classificationNotes').value,
    imageUrls: getDraft()?.instruments.classification?.data?.imageUrls || {},
  };
}
function renderVisitFrontis_(visit) {
  const photo = visit?.frontisPhoto;
  const statusEl = $('#visitFrontisStatus');
  if (statusEl) {
    statusEl.textContent = photo?.pending
      ? 'Foto pendiente en este dispositivo. Pulse Guardar foto del frontis para reintentar.'
      : (photo?.url || visit?.photos?.frontisUrl) ? 'Foto del frontis guardada.' : '';
  }
  const link = $('#visitFrontisLink');
  if (link) {
    const url = photo?.url || visit?.photos?.frontisUrl;
    link.hidden = !url;
    if (url) link.href = url;
    else link.removeAttribute('href');
  }
}

function renderVisitPhotos_(visit) {
  const frontisUrl = visit?.photos?.frontisUrl || visit?.frontisPhoto?.url || '';
  const folderUrl = visit?.photos?.folderUrl || '';
  const additionalUrls = visit?.photos?.additionalUrls || [];

  const folderLink = $('#localDriveFolderLink');
  if (folderLink) {
    if (folderUrl) {
      folderLink.href = folderUrl;
      folderLink.hidden = false;
    } else {
      folderLink.hidden = true;
      folderLink.removeAttribute('href');
    }
  }

  const frontisLink = $('#menuVisitFrontisLink');
  const frontisStatus = $('#menuVisitFrontisStatus');
  if (frontisLink) {
    frontisLink.hidden = !frontisUrl;
    if (frontisUrl) frontisLink.href = frontisUrl;
    else frontisLink.removeAttribute('href');
  }
  if (frontisStatus) {
    frontisStatus.textContent = visit?.frontisPhoto?.pending
      ? 'Foto de frontis pendiente en este dispositivo. Pulse Guardar foto frontis para sincronizar.'
      : frontisUrl ? '✓ Foto del frontis guardada en Drive.' : '';
  }

  const photosStatus = $('#menuVisitPhotosStatus');
  const gallery = $('#menuVisitPhotosGallery');
  if (photosStatus) {
    photosStatus.textContent = additionalUrls.length
      ? `✓ ${additionalUrls.length} fotografía(s) adicional(es) guardada(s) en Drive.`
      : '';
  }
  if (gallery) {
    if (additionalUrls.length) {
      gallery.hidden = false;
      gallery.replaceChildren(
        ...additionalUrls.map((url, idx) => {
          const a = document.createElement('a');
          a.className = 'photo-gallery-item';
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = `Foto ${idx + 1} ↗`;
          return a;
        })
      );
    } else {
      gallery.hidden = true;
      gallery.replaceChildren();
    }
  }
}

async function saveVisitFrontis_() {
  if (!$('#visitForm').reportValidity() || !localFormIsValid() || currentInitials().length < 2) {
    throw new Error('Complete la identificación del local, la persona recolectora y el GPS antes de guardar la foto.');
  }
  const button = $('#saveVisitFrontis');
  button.disabled = true;
  button.textContent = 'Guardando foto…';
  try {
    const visit = visitFromForm(getDraft());
    const file = $('#visitFrontis').files[0];
    if (file) visit.frontisPhoto = { ...visit.frontisPhoto, pending: await compressImage_(file) };
    if (!visit.frontisPhoto?.pending) throw new Error('Seleccione una foto del frontis para guardar.');
    setDraft(visit);
    renderVisitFrontis_(visit);
    renderVisitPhotos_(visit);
    if (!navigator.onLine) throw new Error('Sin conexión: la foto quedó pendiente en este dispositivo. Reintente su guardado cuando vuelva la conexión.');
    const result = await api({ visit, image: visit.frontisPhoto.pending, type: 'frontis' }, 'saveVisitPhoto');
    const latest = getDraft();
    if (latest?.id === visit.id) {
      latest.frontisPhoto = { url: result.frontisUrl || result.url };
      latest.photos = {
        ...(latest.photos || {}),
        frontisUrl: result.frontisUrl || result.url,
        folderUrl: result.folderUrl || latest.photos?.folderUrl || '',
      };
      setDraft(latest);
      renderVisitFrontis_(latest);
      renderVisitPhotos_(latest);
      $('#visitFrontis').value = '';
    }
    showMessage('Foto del frontis guardada en la carpeta del local. Las pautas se guardan por separado.', 'success');
  } catch (error) {
    $('#visitFrontisStatus').textContent = errorText_(error);
    throw error;
  } finally {
    button.disabled = false;
    button.textContent = 'Guardar foto del frontis';
  }
}

async function saveMenuVisitFrontis_() {
  const draft = getDraft();
  if (!draft) return;
  const button = $('#saveMenuVisitFrontis');
  const file = $('#menuVisitFrontis')?.files?.[0];
  if (file) {
    draft.frontisPhoto = { ...draft.frontisPhoto, pending: await compressImage_(file) };
  }
  if (!draft.frontisPhoto?.pending) {
    showMessage('Seleccione una foto del frontis para guardar.', 'error');
    return;
  }
  if (button) {
    button.disabled = true;
    button.textContent = 'Guardando frontis…';
  }
  try {
    setDraft(draft);
    renderVisitPhotos_(draft);
    renderVisitFrontis_(draft);
    if (!navigator.onLine) {
      throw new Error('Sin conexión: la foto quedó guardada en el dispositivo. Conecte a internet para subirla a Drive.');
    }
    const result = await api({ visit: draft, image: draft.frontisPhoto.pending, type: 'frontis' }, 'saveVisitPhoto');
    const latest = getDraft();
    if (latest?.id === draft.id) {
      latest.frontisPhoto = { url: result.frontisUrl || result.url };
      latest.photos = {
        ...(latest.photos || {}),
        frontisUrl: result.frontisUrl || result.url,
        folderUrl: result.folderUrl || latest.photos?.folderUrl || '',
      };
      delete latest.frontisPhoto.pending;
      setDraft(latest);
      renderVisitPhotos_(latest);
      renderVisitFrontis_(latest);
      const input = $('#menuVisitFrontis');
      if (input) input.value = '';
    }
    showMessage('Foto del frontis guardada en la carpeta del local en Drive.', 'success');
  } catch (error) {
    const status = $('#menuVisitFrontisStatus');
    if (status) status.textContent = errorText_(error);
    throw error;
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Guardar foto frontis';
    }
  }
}

async function saveMenuVisitPhotos_() {
  const draft = getDraft();
  if (!draft) return;
  const button = $('#saveMenuVisitPhotos');
  const input = $('#menuVisitPhotos');
  const files = input?.files ? Array.from(input.files) : [];
  if (!files.length) {
    showMessage('Seleccione al menos una fotografía para subir.', 'error');
    return;
  }
  if (button) {
    button.disabled = true;
    button.textContent = 'Procesando fotos…';
  }
  try {
    const compressedImages = [];
    for (let i = 0; i < files.length; i++) {
      if (button) button.textContent = `Comprimiendo foto ${i + 1} de ${files.length}…`;
      compressedImages.push(await compressImage_(files[i]));
    }
    if (!navigator.onLine) {
      throw new Error('Sin conexión: conecte el dispositivo a internet para subir las fotografías a Drive.');
    }
    if (button) button.textContent = 'Subiendo a Drive…';
    const result = await api({ visit: draft, images: compressedImages, type: 'additional' }, 'saveVisitPhoto');
    const latest = getDraft();
    if (latest?.id === draft.id) {
      latest.photos = {
        ...(latest.photos || {}),
        frontisUrl: result.frontisUrl || latest.photos?.frontisUrl || latest.frontisPhoto?.url || '',
        additionalUrls: result.additionalUrls || (latest.photos?.additionalUrls || []).concat(result.newUrls || []),
        folderUrl: result.folderUrl || latest.photos?.folderUrl || '',
      };
      setDraft(latest);
      renderVisitPhotos_(latest);
      if (input) input.value = '';
      const countEl = $('#menuVisitPhotosCount');
      if (countEl) countEl.textContent = '';
    }
    showMessage(`${compressedImages.length} fotografía(s) guardada(s) en la carpeta del local en Drive.`, 'success');
  } catch (error) {
    const status = $('#menuVisitPhotosStatus');
    if (status) status.textContent = errorText_(error);
    throw error;
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Subir fotografías';
    }
  }
}
function compressImage_(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No fue posible leer una imagen.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('El archivo seleccionado no es una imagen válida.'));
      image.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas'); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({ name: file.name, mimeType: 'image/jpeg', data: canvas.toDataURL('image/jpeg', 0.72).split(',')[1] });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function renderClassification(data = {}) {
  const draft = getDraft();
  const local = SAMPLE_LOCALS.find((item) => item.code === draft?.localCode);
  $('#classificationLinkedLocal').textContent = local
    ? `${local.code} · ${local.name} · ${local.address}`
    : draft?.isNewLocal ? `${draft.localCode} · ${draft.localName} · ${draft.localAddress} (local nuevo)` : 'Sin local identificado.';
  const proteins = data.categoriasProteicas || [];
  const fields = {
    classificationService: data.sistemaAtencion === 'acceso_libre' ? 'autoservicio' : data.sistemaAtencion,
    classificationPeople: data.personasAtendiendo,
    classificationProduceVarieties: data.variedadesFrutasVerduras,
    classificationOverride: data.clasificacionOverride,
    classificationJustification: data.justificacionOverride,
    classificationNotes: data.observaciones,
  };
  Object.entries(fields).forEach(([id, value]) => { if ($('#' + id)) $('#' + id).value = value || ''; });
  $('#rubroProduce').checked = data.rubroFrutasHortalizas ? data.rubroFrutasHortalizas === 'si' : Number(data.variedadesFrutasVerduras) > 0;
  $('#rubroMeat').checked = data.rubroCarneFresca ? data.rubroCarneFresca === 'si' : proteins.some((value) => value !== 'pescados_mariscos');
  $('#rubroDairy').checked = data.lacteosHabituales === 'si';
  $('#rubroEggs').checked = data.huevosHabituales === 'si';
  document.querySelectorAll('input[name="proteinCategory"]').forEach((input) => { input.checked = proteins.includes(input.value); });
  updateClassificationVisibility();
}
const PROTEIN_CATEGORIES = ['vacuno', 'cerdo', 'pollo', 'cordero', 'pescados_mariscos'];
const SELF_SERVICE_MODES = ['autoservicio', 'mixto'];
function classifyLocal_(sistemaAtencion, produceVarieties, proteinCategories, dairyRegular, eggsRegular) {
  const varieties = Number(produceVarieties);
  const proteins = Array.isArray(proteinCategories) ? [...new Set(proteinCategories)] : [];
  const fulfilledCriteria = [
    Number.isInteger(varieties) && varieties >= 10,
    proteins.filter((category) => PROTEIN_CATEGORIES.includes(category)).length >= 2,
    dairyRegular === 'si' && eggsRegular === 'si',
  ].filter(Boolean).length;
  return {
    classification: SELF_SERVICE_MODES.includes(sistemaAtencion) && fulfilledCriteria >= 2 ? 'minimarket' : 'almacen_barrio',
    fulfilledCriteria,
  };
}
function updateClassificationVisibility() {
  const produce = $('#rubroProduce').checked;
  $('#produceVarietiesField').hidden = !produce;
  $('#classificationProduceVarieties').required = produce;
  $('#meatTypesField').hidden = !$('#rubroMeat').checked;
  const manual = Boolean($('#classificationOverride').value);
  $('#classificationJustificationField').hidden = !manual; $('#classificationJustification').required = manual;
  const servicio = $('#classificationService').value;
  const variedades = produce ? $('#classificationProduceVarieties').value : '0';
  if (!servicio || variedades === '') {
    $('#classificationResult').textContent = produce
      ? 'Indique el sistema de atención y el número de variedades de frutas y hortalizas para calcular.'
      : 'Indique el sistema de atención para calcular.';
    return;
  }
  const result = classifyLocal_(servicio, variedades, selectedProteins_(), $('#rubroDairy').checked ? 'si' : 'no', $('#rubroEggs').checked ? 'si' : 'no');
  $('#classificationResult').textContent = !SELF_SERVICE_MODES.includes(servicio)
    ? 'Clasificación automática: ALMACÉN DE BARRIO — se requiere autoservicio o atención mixta. Criterios de surtido cumplidos: ' + result.fulfilledCriteria + ' de 3.'
    : 'Clasificación automática: ' + (result.classification === 'minimarket' ? 'MINIMARKET' : 'ALMACÉN DE BARRIO')
      + ' — criterios cumplidos: ' + result.fulfilledCriteria + ' de 3; se requieren al menos 2.';
}

function addOriginItem(data = {}) {
  const row = $('#originItemTemplate').content.firstElementChild.cloneNode(true);
  const itemId = ++originItemId;
  const categoryOptions = $('.origin-category-options', row);
  const sourceOptions = $('.origin-source-options', row);
  const choices = (container, name, values, current, grouped = false) => {
    const picker = container.closest('.origin-choice-picker');
    const summary = $('.origin-choice-summary', picker);
    const currentValue = $('.origin-choice-value', summary);
    const selectValue = (value) => {
      currentValue.textContent = value;
      summary.hidden = !value;
      picker.classList.toggle('has-selection', Boolean(value));
    };
    const groups = grouped ? values : [['', values]];
    groups.forEach(([group, groupValues]) => {
      if (group) {
        const heading = document.createElement('p');
        heading.className = 'origin-choice-group';
        heading.textContent = group;
        container.append(heading);
      }
      groupValues.forEach((value) => {
        const label = document.createElement('label');
        label.className = 'origin-choice';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `${name}-${itemId}`;
        input.value = value;
        input.required = true;
        input.checked = value === current;
        label.classList.toggle('is-selected', input.checked);
        if (input.checked) selectValue(value);
        const text = document.createElement('span');
        text.textContent = value;
        label.append(input, text);
        input.addEventListener('change', () => {
          container.querySelectorAll('.origin-choice').forEach((choice) => choice.classList.remove('is-selected'));
          label.classList.add('is-selected');
        });
        container.append(label);
      });
    });
    $('.origin-choice-change', summary).addEventListener('click', () => {
      picker.classList.remove('has-selection');
      $('.origin-choice-options input', picker).focus();
    });
    container.addEventListener('change', () => {
      selectValue(container.querySelector('input:checked')?.value || '');
    });
  };
  choices(categoryOptions, 'origin-category', ORIGIN_CATEGORIES, data.category || '', true);
  setOptions($('.origin-commune', row), ['Sin información de comuna', ...AYSEN_COMMUNES.filter((commune) => commune !== 'Sin información de comuna')], 'Seleccione');
  choices(sourceOptions, 'origin-source', ORIGIN_SOURCES, data.source || '');
  $('.origin-variety', row).value = data.variety || ''; $('.origin-commune', row).value = data.commune || '';
  $('.origin-sector', row).value = data.sector || ''; $('.origin-brand', row).value = data.brand || ''; $('.origin-notes', row).value = data.notes || '';
  const syncNotes = () => {
    const required = $('.origin-source-options input:checked', row)?.value === 'Otra' || $('.origin-commune', row).value === 'Sin información de comuna';
    $('.origin-notes', row).required = required;
  };
  sourceOptions.addEventListener('change', syncNotes);
  $('.origin-commune', row).addEventListener('change', syncNotes);
  syncNotes();
  $('.remove-origin', row).addEventListener('click', () => { row.remove(); updateOriginsNone(); });
  $('#originItems').append(row);
  updateOriginsNone();
}
function updateOriginsNone() {
  const none = $('#originsNone').checked;
  $('#originItems').hidden = none; $('#addOriginItem').hidden = none;
  document.querySelectorAll('#originItems input, #originItems select, #originItems textarea').forEach((field) => { field.disabled = none; });
}
function originData() {
  const none = $('#originsNone').checked;
  return {
    noneObserved: none,
    items: none ? [] : [...document.querySelectorAll('.origin-item')].map((row) => ({
      category: $('.origin-category-options input:checked', row)?.value || '', variety: $('.origin-variety', row).value.trim(), commune: $('.origin-commune', row).value,
      sector: $('.origin-sector', row).value.trim(), brand: $('.origin-brand', row).value.trim(), source: $('.origin-source-options input:checked', row)?.value || '', notes: $('.origin-notes', row).value.trim(),
    })),
  };
}
function renderOrigins(data) {
  $('#originItems').replaceChildren();
  const items = data && !Array.isArray(data) ? (data.items || []).filter((item) => item.category) : [];
  $('#originsNone').checked = Boolean(data && data.noneObserved);
  (items.length ? items : [{}]).forEach(addOriginItem);
  updateOriginsNone();
}
function fillResponsible(instrument) {
  const draft = getDraft();
  const field = $(RESPONSIBLE_FIELDS[instrument]);
  field.value = draft?.instruments[instrument]?.responsible || getCollectorProfile()?.name || draft?.collector || '';
}
function showResumeResults(visits) {
  const root = $('#resumeVisitResults');
  root.replaceChildren();
  if (!visits.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No encontramos visitas para ese código. Revise el código o inicie una visita nueva.';
    root.append(empty);
    return;
  }
  const labels = { availability: 'Disponibilidad', prices: 'Precios' };
  visits.forEach((visit) => {
    const item = document.createElement('article');
    item.className = 'resume-visit-result';
    const details = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = `${visit.observationDate} · ${visit.collector || 'Persona no indicada'}`;
    const status = document.createElement('p');
    status.className = 'field-help';
    status.textContent = Object.entries(labels).map(([key, label]) => `${label}: ${visit.instruments[key]?.saved ? 'guardada' : 'pendiente'}`).join(' · ');
    const id = document.createElement('p');
    id.className = 'field-help';
    id.textContent = `ID de visita: ${visit.id}`;
    details.append(title, status, id);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Retomar esta visita';
    button.addEventListener('click', () => resumeVisit_(visit));
    item.append(details, button);
    root.append(item);
  });
}
function resumeVisit_(visit) {
  const current = getDraft();
  if (current && current.id !== visit.id) {
    const unsaved = unsavedInstrumentNames_(current);
    const queued = getQueue().some((item) => item.visit?.id === current.id);
    if (unsaved.length || queued) {
      showMessage('La visita activa tiene pautas pendientes de sincronizar. Guárdelas o descargue un respaldo antes de cambiar a otra visita.', 'error');
      return;
    }
  }
  visit.resumedFromSheets = true;
  setDraft(visit);
  fillVisit(visit);
  showView('menuView');
  updateMenu();
  showMessage('Visita cargada en este dispositivo. Ya puede continuar con otra pauta.', 'success');
}
async function searchVisitsForLocal_(event) {
  event.preventDefault();
  const button = $('#resumeVisitButton');
  const code = $('#resumeLocalCode').value.trim().toUpperCase();
  const accessCode = $('#resumeAccessCode').value;
  $('#resumeVisitResults').replaceChildren();
  button.disabled = true;
  button.textContent = 'Buscando…';
  try {
    if (!navigator.onLine) throw new Error('Conéctese a internet para buscar y cargar una visita existente.');
    const visits = await api({ localCode: code, accessCode }, 'getVisitsForLocal');
    showResumeResults(visits);
  } catch (error) {
    showMessage(errorText_(error), 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Buscar visitas';
    $('#resumeAccessCode').value = '';
  }
}
function responsibleFor(instrument) {
  const value = $(RESPONSIBLE_FIELDS[instrument]).value.trim();
  if (!value) throw new Error('Indique la persona responsable de esta pauta.');
  return value;
}

async function saveInstrument(instrument, data, submitButton) {
  const responsible = responsibleFor(instrument);
  const draft = getDraft();
  draft.timing = draft.timing || { pendingMs: {}, active: null };
  draft.timing.pendingMs = draft.timing.pendingMs || {};
  pauseInstrumentTimer_(draft);
  const durationSeconds = applicationDurationSeconds_(draft, instrument);
  const payload = { visit: draft, instrument, data, responsible, durationSeconds };
  setDraft(draft);
  if (submitButton) { submitButton.disabled = true; submitButton.dataset.originalText = submitButton.textContent; submitButton.textContent = 'Guardando…'; }
  try {
    if (!navigator.onLine) {
      const queue = getQueue(); queue.push(payload); setQueue(queue);
      draft.instruments[instrument] = { data, responsible, saved: false, durationSeconds };
      clearInstrumentTimer_(draft, instrument);
      setDraft(draft);
      showMessage(durationSeconds == null
        ? 'Sin conexión: la pauta quedó pendiente; su tiempo superó el máximo de 12 horas y no se registrará.'
        : 'Sin conexión: la pauta y su tiempo quedaron pendientes de sincronización.', 'success');
      if (instrument !== 'prices') showView('menuView');
      return;
    }
    const result = await api(payload);
    applySavedInstrument_(payload, result);
    const savedDuration = Object.prototype.hasOwnProperty.call(result, 'durationSeconds')
      ? result.durationSeconds
      : durationSeconds;
    showMessage(durationSeconds == null
      ? `${result.savedRows} registro(s) guardado(s) para ${INSTRUMENT_LABELS[instrument]}. El tiempo superó el máximo de 12 horas y no se registró.`
      : `${result.savedRows} registro(s) guardado(s) para ${INSTRUMENT_LABELS[instrument]}. Tiempo medido: ${formatDuration_(savedDuration || durationSeconds)}.`, 'success');
    if (instrument !== 'prices') showView('menuView');
  } catch (error) {
    const latest = getDraft();
    resumeInstrumentTimer_(latest, instrument);
    if (latest) setDraft(latest);
    throw error;
  } finally {
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = submitButton.dataset.originalText; }
  }
}
const INSTRUMENT_LABELS = { classification: 'clasificación', availability: 'disponibilidad y variedad', origins: 'origen', prices: 'precios' };
function applySavedInstrument_(payload, result) {
  const draft = getDraft();
  if (!draft || draft.id !== payload.visit.id) return;
  draft.instruments[payload.instrument] = {
    data: payload.data,
    responsible: payload.responsible,
    saved: true,
    savedAt: new Date().toISOString(),
    durationSeconds: Object.prototype.hasOwnProperty.call(result, 'durationSeconds')
      ? result.durationSeconds
      : payload.durationSeconds || null,
  };
  draft.instrumentDurations = draft.instrumentDurations || {};
  if (Object.prototype.hasOwnProperty.call(result, 'durationSeconds')) {
    if (result.durationSeconds == null) delete draft.instrumentDurations[payload.instrument];
    else draft.instrumentDurations[payload.instrument] = result.durationSeconds;
  } else if (payload.durationSeconds) {
    draft.instrumentDurations[payload.instrument] = payload.durationSeconds;
  }
  if (result.totalVisitDurationSeconds != null) draft.totalVisitDurationSeconds = result.totalVisitDurationSeconds;
  clearInstrumentTimer_(draft, payload.instrument);
  setDraft(draft);
}
async function syncQueue() {
  if (!navigator.onLine) return;
  const queue = getQueue();
  while (queue.length) {
    const payload = queue[0];
    const result = await api(payload);
    queue.shift();
    setQueue(queue);
    applySavedInstrument_(payload, result);
  }
}

function openInstrument(instrument) {
  const data = getDraft().instruments[instrument]?.data;
  startInstrumentTimer_(instrument);
  fillResponsible(instrument);
  if (instrument === 'availability') { renderAvailability(data); showView('availabilityView'); }
  if (instrument === 'prices') { showView('pricesView'); }
  if (instrument === 'origins') { renderOrigins(data); showView('originsView'); }
  if (instrument === 'classification') { renderClassification(data); showView('classificationView'); }
}
function useCurrentLocation() { if (!navigator.geolocation) return showMessage('Este navegador no admite geolocalización.', 'error'); navigator.geolocation.getCurrentPosition((pos) => { $('#latitude').value = pos.coords.latitude.toFixed(6); $('#longitude').value = pos.coords.longitude.toFixed(6); showMessage('Ubicación actual cargada. Verifíquela en el mapa antes de continuar.', 'success'); }, () => showMessage('No fue posible obtener la ubicación.', 'error'), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }); }

function initialize() {
  populateLocalCodeOptions(); updateConnection();
  const draft = getDraft();
  if (draft?.timing?.active) draft.timing.active.startedAt = 0;
  $('#observationDate').value = new Date().toISOString().slice(0, 10);
  const profile = getCollectorProfile();
  if (profile) { $('#collector').value = profile.name || ''; }
  updateCollectorHint();
  if (draft) { fillVisit(draft); showView('menuView'); updateMenu(); }
  else updateLocal();
  const searchInput = $('#localSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      populateLocalCodeOptions(event.target.value);
    });
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        clearLocalSearch_();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const select = $('#localCode');
        if (select && select.options.length > 1 && !select.value) {
          select.selectedIndex = 1;
          updateLocal();
        }
        if (select) select.focus();
      }
    });
  }
  const clearBtn = $('#clearLocalSearch');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearLocalSearch_);
  }
  $('#resumeVisitForm').addEventListener('submit', searchVisitsForLocal_);
  $('#localCode').addEventListener('change', updateLocal);
  $('#collector').addEventListener('input', () => {
    rememberCollector();
    updateCollectorHint();
  });
  $('#collector').addEventListener('change', () => {
    const codeField = $('#newLocalCode');
    const suffix = (codeField.value.match(/N([A-Z]{2,3})$/i) || [])[1];
    if ($('#isNewLocal').checked && suffix && suffix.toUpperCase() !== currentInitials()) codeField.value = '';
    updateLocal();
  });
  $('#regenerateCodeButton').addEventListener('click', () => {
    const initials = currentInitials();
    if (initials.length < 2) return showMessage('Ingrese primero el nombre de la persona recolectora.', 'error');
    $('#newLocalCode').value = newLocalCode(initials);
    showMessage('Código nuevo asignado: ' + $('#newLocalCode').value, 'success');
  });
  function changeLocalMode() {
    if ($('#isNewLocal').checked) {
      $('#latitude').value = '';
      $('#longitude').value = '';
    }
    updateLocal();
  }
  $('#isNewLocal').addEventListener('change', changeLocalMode);
  $('#isExistingLocal').addEventListener('change', changeLocalMode);
  ['newLocalName', 'newLocalType'].forEach((id) => $('#' + id).addEventListener('input', updateLocal));
  $('#locationButton').addEventListener('click', useCurrentLocation);
  $('#saveVisitFrontis').addEventListener('click', () => saveVisitFrontis_().catch((error) => showMessage(errorText_(error), 'error')));
  const menuFrontisBtn = $('#saveMenuVisitFrontis');
  if (menuFrontisBtn) menuFrontisBtn.addEventListener('click', () => saveMenuVisitFrontis_().catch((error) => showMessage(errorText_(error), 'error')));
  const menuPhotosBtn = $('#saveMenuVisitPhotos');
  if (menuPhotosBtn) menuPhotosBtn.addEventListener('click', () => saveMenuVisitPhotos_().catch((error) => showMessage(errorText_(error), 'error')));
  const menuPhotosInput = $('#menuVisitPhotos');
  if (menuPhotosInput) {
    menuPhotosInput.addEventListener('change', () => {
      const countEl = $('#menuVisitPhotosCount');
      if (countEl) {
        const count = menuPhotosInput.files ? menuPhotosInput.files.length : 0;
        countEl.textContent = count ? `${count} seleccionada(s)` : '';
      }
    });
  }
  $('#visitForm').addEventListener('submit', (event) => { event.preventDefault(); const current = getDraft(); const visit = visitFromForm(current); if (currentInitials().length < 2) { showMessage('Escriba el nombre de la persona recolectora (nombre y apellido).', 'error'); return; } if (!localFormIsValid()) { showMessage('Complete los datos del local seleccionado o del local nuevo.', 'error'); return; } rememberCollector(); setDraft(visit); showView('menuView'); });
  document.querySelectorAll('.instrument').forEach((button) => button.addEventListener('click', () => openInstrument(button.dataset.instrument)));
  document.querySelectorAll('.return-menu').forEach((button) => button.addEventListener('click', () => { showView('menuView'); updateMenu(); }));
  $('#editVisitButton').addEventListener('click', () => showView('visitView'));
  $('#backupJsonButton').addEventListener('click', () => downloadBackup('json'));
  $('#backupHtmlButton').addEventListener('click', () => downloadBackup('html'));
  $('#closeVisitButton').addEventListener('click', () => {
    const draft = getDraft();
    if (!draft) return;
    const unsaved = unsavedInstrumentNames_(draft);
    const queuedCount = getQueue().filter((item) => item.visit?.id === draft.id).length;
    const photoWarning = draft.frontisPhoto?.pending ? 'La foto del frontis está pendiente y se perderá al cerrar. ' : '';
    const warning = photoWarning + (unsaved.length
      ? `Aún no están guardados en Sheets: ${unsaved.join(', ')}.${queuedCount ? ` Hay ${queuedCount} envío(s) en cola.` : ''} Si cierra ahora, se borrará el borrador local. Descargue un respaldo para conservar esos datos. ¿Cerrar de todas formas?`
      : queuedCount
        ? `Hay ${queuedCount} envío(s) pendientes de sincronización. Cerrar borrará el borrador local, pero los envíos seguirán en cola. ¿Cerrar la visita?`
        : 'Los instrumentos guardados en Sheets se conservarán. ¿Cerrar la visita y borrar el borrador de este dispositivo?');
    if (!confirm(warning)) return;
    localStorage.removeItem(DRAFT_KEY);
    $('#visitForm').reset();
    populateLocalCodeOptions('');
    updateCollectorHint();
    updateLocal();
    renderVisitFrontis_(null);
    renderVisitPhotos_(null);
    $('#observationDate').value = new Date().toISOString().slice(0, 10);
    showView('visitView');
  });
  $('#availabilityForm').addEventListener('submit', (event) => { event.preventDefault(); saveInstrument('availability', availabilityData(), event.submitter).catch((error) => showMessage(errorText_(error), 'error')); });
  $('#originsForm').addEventListener('submit', (event) => { event.preventDefault(); saveInstrument('origins', originData(), event.submitter).catch((error) => showMessage(errorText_(error), 'error')); });
  $('#openPricesReviewButton').addEventListener('click', () => { renderPriceReview(getDraft().instruments.prices?.data); showView('pricesReviewView'); });
  $('#startPriceProductButton').addEventListener('click', openPriceEditor);
  $('#addPriceProduct').addEventListener('click', openPriceEditor);
  $('#priceEditorForm').addEventListener('submit', (event) => { event.preventDefault(); try { savePriceDraftFromEditor(); } catch (error) { showMessage(errorText_(error), 'error'); } });
  $('#cancelPriceEditor').addEventListener('click', () => { renderPriceReview(getDraft().instruments.prices?.data); showView('pricesReviewView'); });
  $('#saveReviewedPrices').addEventListener('click', () => { const draft = getDraft(); const data = draft.instruments.prices?.data; if (!priceEntries_(data).length) return showMessage('Agregue al menos un alimento antes de guardar.', 'error'); saveInstrument('prices', { products: priceEntries_(data), notes: $('#pricesNotes').value }, $('#saveReviewedPrices')).catch((error) => showMessage(errorText_(error), 'error')); });
  $('#addOriginItem').addEventListener('click', () => addOriginItem());
  $('#classificationOverride').addEventListener('change', updateClassificationVisibility);
  ['classificationService', 'rubroProduce', 'rubroMeat', 'rubroDairy', 'rubroEggs']
    .forEach((id) => $('#' + id).addEventListener('change', updateClassificationVisibility));
  $('#originsNone').addEventListener('change', updateOriginsNone);
  $('#classificationProduceVarieties').addEventListener('input', updateClassificationVisibility);
  document.querySelectorAll('input[name="proteinCategory"]').forEach((input) => {
    input.addEventListener('change', updateClassificationVisibility);
  });
  $('#classificationForm').addEventListener('submit', (event) => { event.preventDefault(); saveInstrument('classification', classificationData(), event.submitter).catch((error) => showMessage(errorText_(error), 'error')); });
  document.addEventListener('visibilitychange', () => {
    const currentDraft = getDraft();
    if (!currentDraft) return;
    const active = currentDraft.timing?.active;
    const changed = document.visibilityState === 'hidden'
      ? pauseInstrumentTimer_(currentDraft)
      : active ? resumeInstrumentTimer_(currentDraft, instrumentForView_(currentView)) : false;
    if (changed) setDraft(currentDraft);
  });
  window.addEventListener('pagehide', () => {
    const currentDraft = getDraft();
    if (currentDraft && pauseInstrumentTimer_(currentDraft)) setDraft(currentDraft);
  });
  window.addEventListener('online', () => { updateConnection(); syncQueue().catch((error) => showMessage(errorText_(error), 'error')); }); window.addEventListener('offline', updateConnection);
  syncQueue().catch((error) => showMessage(errorText_(error), 'error'));
}
function errorText_(error) { return (error && error.message) ? error.message : 'Ocurrió un error inesperado. Intente nuevamente.'; }
window.addEventListener('unhandledrejection', (event) => { showMessage(errorText_(event.reason), 'error'); });
initialize();

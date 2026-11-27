const DATABASE_SPREADSHEET_ID = '1WpIv7POGkW9-11ge7acXhZtuFws95snHwN8k_tf8KsU';
const IMAGE_FOLDER_NAME = 'ESPORA - Imágenes nuevo estudio';
const DRIVE_WRITE_SCOPE = 'https://www.googleapis.com/auth/drive';
const INSTRUMENT_DURATION_HEADERS = {
  classification: 'Tiempo Clasificación (segundos)',
  availability: 'Tiempo Disponibilidad y variedad (segundos)',
  origins: 'Tiempo Origen (segundos)',
  prices: 'Tiempo Precios (segundos)',
};
const TOTAL_VISIT_DURATION_HEADER = 'Tiempo total de visita (segundos)';
const MAX_INSTRUMENT_DURATION_SECONDS = 43200;

const PHOTO_SHEET = {
  name: 'Fotos visitas',
  headers: ['ID de visita', 'Fecha de registro', 'Código de local', 'Foto frontis', 'Persona recolectora', 'Fotos adicionales', 'Carpeta del local'],
};
const SHEETS = {
  visits: {
    name: 'Visitas',
    headers: ['ID de visita', 'Fecha de registro', 'Fecha de observación', 'Persona recolectora', 'Código de local', 'ID de muestra', 'Local', 'Dirección', 'Tipo de local', 'Subtipo de local', 'Latitud levantada', 'Longitud levantada', 'Recategorización observada', 'Importador con venta al detalle/menor', 'Unidad vecinal',
      INSTRUMENT_DURATION_HEADERS.classification, INSTRUMENT_DURATION_HEADERS.availability,
      INSTRUMENT_DURATION_HEADERS.origins, INSTRUMENT_DURATION_HEADERS.prices, TOTAL_VISIT_DURATION_HEADER,
      'Autorización de fotografía interior'],
  },
  availability: {
    name: 'Disponibilidad',
    headers: ['ID de visita', 'Fecha de registro', 'Sección', 'Categoría', 'Ítem', 'Disponible (Sí/No)', 'Persona responsable'],
  },
  prices: {
    name: 'Precios',
    headers: ['ID de visita', 'Fecha de registro', 'Categoría', 'Producto', 'Número de observación', 'Marca o proveedor', 'Precio observado (CLP)', 'Unidad de medida', 'Tipo de conservación', 'Origen (Local/Externo)', 'Precio en oferta o promoción', 'Observaciones', 'Tipo de precio (mínimo/máximo)', 'Persona responsable', 'Estado del producto'],
  },
  origins: {
    name: 'Origen',
    headers: ['ID de visita', 'Fecha de registro', 'Producto', 'Origen declarado', 'Proveedor, procedencia o detalle', 'Observaciones', 'Categoría alimentaria', 'Variedad del producto', 'Comuna de origen declarada', 'Sector o localidad', 'Marca o productor regional', 'Fuente o evidencia de origen', 'Persona responsable'],
  },
  classification: {
    name: 'Clasificación',
    headers: ['ID de visita', 'Fecha de registro', 'Unidad vecinal', 'Estado del local', 'Superficie estimada', 'Sistema de atención', 'Personas atendiendo', 'Abarrotes básicos', 'Fruta y verdura', 'Carnes', 'Otros rubros', 'Es mixto', 'Rubro principal', 'Detalle mixto', 'Clasificación automática', 'Clasificación final', 'Modo de clasificación', 'Justificación de corrección', 'Observaciones', 'Código de local', 'ID de muestra', 'Local', 'Dirección', 'Tipo de local', 'Subtipo de local', 'Fotos frontis', 'Fotos interior autorizado', 'Fotos frutas y verduras', 'Fotos carnes', 'Fotos congelados', 'Variedades de frutas y verduras', 'Categorías proteicas', 'Oferta habitual de lácteos', 'Oferta habitual de huevos', 'Fotos pescados y mariscos', 'Persona responsable'],
  },
};

const PRICE_UNITS = ['kg', '0,5 kg', 'Unidad', 'Otros'];
const PRODUCTS = [];
const LEGACY_PRICE_PRODUCTS = [];

const ORIGIN_CATEGORIES = ['Verduras y hortalizas frescas', 'Frutas frescas', 'Carne bovina', 'Carne ovina', 'Huevos',
  'Pescados frescos', 'Mariscos frescos', 'Productos congelados del mar', 'Quesos', 'Conservas', 'Mermeladas', 'Miel',
  'Otros productos procesados de origen regional'];
const LEGACY_ORIGIN_CATEGORIES = ['Frutos Secos', 'Frutos rojos'];
const AYSEN_COMMUNES = ['Coyhaique', 'Lago Verde', 'Aysén', 'Cisnes', 'Guaitecas', 'Río Ibáñez', 'Chile Chico', 'Cochrane', "O'Higgins", 'Tortel', 'Sin información de comuna'];
const ORIGIN_SOURCES = ['Etiqueta o envase', 'Cartel', 'Información del responsable del establecimiento', 'Información del productor o feriante', 'Otra'];
const PRICE_STATUSES = ['precio_obtenido', 'producto_no_disponible', 'precio_no_obtenido'];
const PRICE_PRODUCT_ALIASES = {
  'Lenteja 6 mm': { product: 'Lenteja' },
  'Merluza austral fresca': { product: 'Merluza austral', note: 'Conservación registrada anteriormente: fresca.' },
  'Merluza austral congelada': { product: 'Merluza austral', note: 'Conservación registrada anteriormente: congelada.' },
};

function doGet(event) {
  if (event && event.parameter && event.parameter.diagnostic === 'drive') {
    return jsonResponse_(diagnoseCaptureDrive_());
  }
  if (event && event.parameter && event.parameter.diagnostic === 'storage') {
    return jsonResponse_(diagnoseCaptureStorage_());
  }
  return jsonResponse_({
    ok: true,
    service: 'ESPORA Coyhaique',
    message: 'API activa. Use POST /exec para guardar instrumentos.'
  });
}

function diagnoseCaptureStorage_() {
  const result = {
    ok: false,
    diagnostic: 'capture-storage-v1',
    sheets: {},
  };
  try {
    const spreadsheet = SpreadsheetApp.openById(DATABASE_SPREADSHEET_ID);
    Object.keys(SHEETS).forEach((key) => {
      const definition = SHEETS[key];
      const sheet = spreadsheet.getSheetByName(definition.name);
      if (!sheet) {
        result.sheets[definition.name] = { ok: false, error: 'Pestaña inexistente' };
        return;
      }
      const lastColumn = sheet.getLastColumn();
      const existing = lastColumn
        ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
        : [];
      const isPrefix = existing.every((value, index) => value === definition.headers[index]);
      const compatible = isPrefix && existing.length <= definition.headers.length;
      result.sheets[definition.name] = {
        ok: compatible,
        existingColumns: existing.length,
        expectedColumns: definition.headers.length,
        error: compatible ? '' : 'Los encabezados no coinciden con la estructura esperada',
      };
    });
    result.ok = Object.keys(result.sheets).every((name) => result.sheets[name].ok);
  } catch (error) {
    result.error = error.message;
  }
  return result;
}

function diagnoseCaptureDrive_() {
  const result = {
    ok: false,
    diagnostic: 'capture-drive-v2',
    driveAuthorized: false,
    driveWriteScopeGranted: driveWriteScopeGranted_(),
  };
  try {
    const folders = DriveApp.getFoldersByName(IMAGE_FOLDER_NAME);
    result.folderExists = folders.hasNext();
    result.driveAuthorized = true;
    result.ok = result.driveWriteScopeGranted !== false;
    if (!result.ok) result.error = 'Falta autorizar ' + DRIVE_WRITE_SCOPE + '. Ejecute autorizarDriveCaptura() en el editor.';
  } catch (error) {
    result.error = error.message;
  }
  return result;
}

function doPost(event) {
  try {
    const request = JSON.parse(event.postData.contents);
    if (request.action === 'getVisitsForLocal') {
      return jsonResponse_({ ok: true, data: getVisitsForLocal_(request.payload) });
    }
    if (request.action === 'saveVisitPhoto') {
      return jsonResponse_({ ok: true, data: saveVisitPhoto_(request.payload) });
    }
    if (request.action !== 'saveInstrument') {
      throw new Error('La acción solicitada no es válida.');
    }
    if (!request.payload || ['availability', 'prices'].indexOf(request.payload.instrument) < 0) {
      throw new Error('Este estudio solo admite Disponibilidad y Precios.');
    }
    return jsonResponse_({ ok: true, data: saveInstrument_(request.payload) });
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message });
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getVisitsForLocal_(payload) {
  const code = String(payload && payload.localCode || '').trim().toUpperCase();
  if (!code) {
    throw new Error('Indique el código del local.');
  }
  const expectedAccessCode = PropertiesService.getScriptProperties().getProperty('ESPORA_RESUME_ACCESS_CODE');
  if (!expectedAccessCode) {
    throw new Error('La retoma aún no está habilitada: el administrador debe configurar la clave de acceso en Apps Script.');
  }
  if (String(payload.accessCode || '') !== expectedAccessCode) {
    throw new Error('La clave de acceso no es válida.');
  }
  const database = SpreadsheetApp.openById(DATABASE_SPREADSHEET_ID);
  const visitsSheet = database.getSheetByName(SHEETS.visits.name);
  if (!visitsSheet || visitsSheet.getLastRow() < 2) {
    return [];
  }
  const visitRows = visitsSheet.getRange(2, 1, visitsSheet.getLastRow() - 1, SHEETS.visits.headers.length).getValues()
    .filter((row) => String(row[4] || '').trim().toUpperCase() === code);
  if (!visitRows.length) {
    return [];
  }
  const instrumentRows = {};
  const photoSheet = database.getSheetByName(PHOTO_SHEET.name);
  const photoRows = photoSheet && photoSheet.getLastRow() > 1
    ? photoSheet.getRange(2, 1, photoSheet.getLastRow() - 1, PHOTO_SHEET.headers.length).getValues()
    : [];
  ['classification', 'availability', 'origins', 'prices'].forEach((key) => {
    const sheet = database.getSheetByName(SHEETS[key].name);
    instrumentRows[key] = sheet && sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, SHEETS[key].headers.length).getValues()
      : [];
  });
  return visitRows.map((row) => {
    const visit = visitFromSheetRow_(row);
    const instruments = {};
    Object.keys(instrumentRows).forEach((key) => {
      const rows = instrumentRows[key].filter((instrumentRow) => String(instrumentRow[0]) === String(visit.id));
      if (rows.length) {
        instruments[key] = {
          saved: true,
          responsible: String(rows[rows.length - 1][SHEETS[key].headers.indexOf('Persona responsable')] || ''),
          data: instrumentDataFromRows_(key, rows),
          durationSeconds: visit.instrumentDurations[key] || null,
        };
      }
    });
    visit.instruments = instruments;
    const photo = photoRows.filter((photoRow) => String(photoRow[0]) === visit.id).pop();
    visit.frontisPhoto = photo ? { url: String(photo[3] || '') } : null;
    visit.photos = photo ? {
      frontisUrl: String(photo[3] || ''),
      additionalUrls: String(photo[5] || '').split('\n').filter(Boolean),
      folderUrl: String(photo[6] || ''),
    } : null;
    return visit;
  }).sort((a, b) => String(b.observationDate).localeCompare(String(a.observationDate)));
}

function visitFromSheetRow_(row) {
  const code = String(row[4] || '').trim().toUpperCase();
  const sample = SAMPLE_LOCALS.find((local) => local.code === code);
  const instrumentDurations = Object.fromEntries(Object.keys(INSTRUMENT_DURATION_HEADERS)
    .map((instrument, index) => [instrument, Number(row[15 + index]) || 0]));
  return {
    id: String(row[0]),
    observationDate: row[2] instanceof Date ? Utilities.formatDate(row[2], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(row[2] || ''),
    collector: String(row[3] || ''),
    collectorInitials: '',
    localCode: code,
    unitVecinal: String(row[14] || ''),
    interiorPhotoAuthorization: String(row[20] || ''),
    latitude: String(row[10] || ''),
    longitude: String(row[11] || ''),
    isNewLocal: !sample,
    localName: sample ? '' : String(row[6] || ''),
    localAddress: sample ? '' : String(row[7] || ''),
    localType: sample ? '' : String(row[8] || ''),
    instrumentDurations: instrumentDurations,
    totalVisitDurationSeconds: Number(row[19]) || 0,
    instruments: {},
  };
}

function instrumentDataFromRows_(instrument, rows) {
  if (instrument === 'availability') {
    return rows.map((row) => ({ section: row[2], category: row[3], label: row[4], value: row[5] }));
  }
  if (instrument === 'origins') {
    if (rows.some((row) => row[2] === 'Sin productos regionales observados')) {
      return { noneObserved: true, items: [] };
    }
    return {
      noneObserved: false,
      items: rows.map((row) => ({
        category: row[6], variety: row[7], commune: row[8], sector: row[9],
        brand: row[10], source: row[11], notes: row[5],
      })),
    };
  }
  if (instrument === 'prices') {
    const products = {};
    rows.forEach((row) => {
      const name = String(row[3] || '');
      if (!products[name]) products[name] = { product: name, category: String(row[2] || ''), status: row[14] || 'precio_obtenido', prices: [] };
      products[name].status = row[14] || 'precio_obtenido';
      if (row[6] !== '' && row[6] != null) {
        products[name].prices.push({
          type: row[12], brand: row[5], value: String(row[6]), unit: row[7],
          promotion: row[10], notes: row[11],
        });
      }
    });
    Object.keys(products).forEach((name) => {
      products[name].prices.sort((a, b) => (a.type === 'Mínimo' ? -1 : 1) - (b.type === 'Mínimo' ? -1 : 1));
    });
    return { products: Object.keys(products).map((name) => products[name]), notes: '' };
  }
  const row = rows[rows.length - 1];
  const imageUrls = {
    frontis: row[25], interior: row[26], frutasVerduras: row[27],
    carnes: row[28], congelados: row[29], pescadosMariscos: row[34],
  };
  return {
    unitVecinal: row[2], estadoLocal: row[3], superficie: row[4], sistemaAtencion: row[5],
    personasAtendiendo: row[6], rubroFrutasHortalizas: row[8], rubroCarneFresca: row[9],
    variedadesFrutasVerduras: String(row[30]), categoriasProteicas: String(row[31] || '').split(', ').filter(Boolean),
    lacteosHabituales: row[32], huevosHabituales: row[33],
    clasificacionOverride: row[16] === 'manual' ? row[15] : '',
    justificacionOverride: row[17], observaciones: row[18], imageUrls: imageUrls,
  };
}

function setupDatabase() {
  const database = getDatabase_();
  Logger.log('Base de datos: ' + database.getUrl());
  return database.getUrl();
}

function getDatabase_() {
  if (!DATABASE_SPREADSHEET_ID) throw new Error('Configura el ID de una planilla nueva de captura antes de continuar.');
  const database = SpreadsheetApp.openById(DATABASE_SPREADSHEET_ID);
  ['visits', 'availability', 'prices'].forEach((key) => ensureSheet_(database, SHEETS[key]));
  ensureDashboard_(database);
  return database;
}

function ensureSheet_(database, definition) {
  let sheet = database.getSheetByName(definition.name);
  if (!sheet) {
    sheet = database.insertSheet(definition.name);
    sheet.getRange(1, 1, 1, definition.headers.length).setValues([definition.headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, definition.headers.length)
      .setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
    sheet.autoResizeColumns(1, definition.headers.length);
    return sheet;
  }
  const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const isPrefix = existing.every((value, index) => value === definition.headers[index]);
  if (!isPrefix) {
    throw new Error('La estructura de la hoja ' + definition.name + ' no coincide con la versión esperada. No se modificaron datos.');
  }
  if (existing.length < definition.headers.length) {
    sheet.getRange(1, existing.length + 1, 1, definition.headers.length - existing.length)
      .setValues([definition.headers.slice(existing.length)]);
    sheet.autoResizeColumns(1, definition.headers.length);
  }
  return sheet;
}

function ensureDashboard_(database) {
  let sheet = database.getSheetByName('Panel ESPORA');
  if (sheet) {
    return sheet;
  }
  sheet = database.insertSheet('Panel ESPORA');
  sheet.getRange('A1:F1').merge().setValue('Panel de seguimiento - ESPORA Coyhaique')
    .setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold')
    .setFontSize(14).setHorizontalAlignment('center');
  sheet.getRange('A3:B6').setValues([
    ['Indicador', 'Valor'],
    ['Visitas registradas', '=COUNTA(Visitas!A2:A)'],
    ['Registros de disponibilidad', '=COUNTA(Disponibilidad!A2:A)'],
    ['Registros de pauta de precios', '=COUNTA(Precios!A2:A)'],
  ]);
  sheet.getRange('A3:B3').setFontWeight('bold').setBackground('#d2e3fc');
  sheet.getRange('D3').setFormula('=QUERY(Visitas!A2:E,"select E,count(A) where A is not null group by E label E \'Código de local\', count(A) \'Visitas\'",0)');
  sheet.getRange('A9').setFormula('=QUERY(Precios!C2:C,"select C,count(C) where C is not null group by C label C \'Categoría\', count(C) \'Registros de pauta\'",0)');
  sheet.setFrozenRows(3);
  sheet.autoResizeColumns(1, 8);
  return sheet;
}

function normalizeLocalName_(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim().toUpperCase();
}

function assertNewLocalCodeIsFree_(database, visit) {
  if (!visit.isNewLocal) {
    return;
  }
  const code = String(visit.localCode || '').trim().toUpperCase();
  const sheet = database.getSheetByName(SHEETS.visits.name);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return;
  }
  const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const conflict = values.filter(function (row) {
    return String(row[4] || '').trim().toUpperCase() === code &&
      String(row[0]) !== String(visit.id) &&
      normalizeLocalName_(row[6]) !== normalizeLocalName_(visit.localName);
  })[0];
  if (conflict) {
    throw new Error('El código ' + code + ' ya está asignado al local "' + conflict[6] +
      '". Use «Generar otro código» en la ficha del local nuevo y vuelva a enviar.');
  }
}

function saveInstrument_(payload) {
  validateVisit_(payload.visit);
  const instrument = payload.instrument;
  if (!['availability', 'prices'].includes(instrument)) {
    throw new Error('El instrumento no es válido.');
  }
  const hasDuration = Object.prototype.hasOwnProperty.call(payload, 'durationSeconds');
  const durationSeconds = hasDuration && payload.durationSeconds != null
    ? Number(payload.durationSeconds)
    : null;
  if (hasDuration && durationSeconds != null && (!Number.isInteger(durationSeconds) ||
      durationSeconds < 1 || durationSeconds > MAX_INSTRUMENT_DURATION_SECONDS)) {
    throw new Error('El tiempo de aplicación debe estar entre 1 segundo y 12 horas.');
  }
  if (instrument === 'classification') {
    classificationCriteria_(payload.data);
  }
  const database = getDatabase_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    assertNewLocalCodeIsFree_(database, payload.visit);
    let rows;
    if (instrument === 'classification') {
      payload.data.superficie = payload.data.superficie || existingClassificationSurface_(database, payload.visit.id);
      payload.data.imageUrls = existingClassificationImages_(database, payload.visit.id);
      rows = classificationRows_(payload.visit, payload.data);
    } else if (instrument === 'availability') {
      rows = availabilityRows_(payload.visit, payload.data);
    } else if (instrument === 'prices') {
      rows = priceRows_(payload.visit, payload.data);
    } else {
      rows = originRows_(payload.visit, payload.data);
    }
    const responsible = String(payload.responsible || payload.visit.collector || '').trim();
    rows = rows.map((row) => instrument === 'prices'
      ? row.slice(0, 13).concat([responsible, row[13]])
      : row.concat([responsible]));
    upsertVisit_(database, payload.visit);
    const sheet = database.getSheetByName(SHEETS[instrument].name);
    replaceRowsForVisit_(sheet, payload.visit.id, SHEETS[instrument].headers.length);
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, SHEETS[instrument].headers.length).setValues(rows);
    const timing = hasDuration
      ? saveInstrumentDuration_(database, payload.visit.id, instrument, durationSeconds)
      : readInstrumentDuration_(database, payload.visit.id, instrument);
    return {
      savedRows: rows.length,
      instrument: instrument,
      visitId: payload.visit.id,
      durationSeconds: timing.durationSeconds,
      totalVisitDurationSeconds: timing.totalVisitDurationSeconds,
    };
  } finally {
    lock.releaseLock();
  }
}

function existingClassificationImages_(database, visitId) {
  const sheet = database.getSheetByName(SHEETS.classification.name);
  if (sheet.getLastRow() < 2) return {};
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, SHEETS.classification.headers.length).getValues();
  const row = rows.find((entry) => String(entry[0]) === String(visitId));
  return row ? instrumentDataFromRows_('classification', [row]).imageUrls : {};
}

function existingClassificationSurface_(database, visitId) {
  const sheet = database.getSheetByName(SHEETS.classification.name);
  if (sheet.getLastRow() < 2) return '';
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, SHEETS.classification.headers.length).getValues();
  const row = rows.find((entry) => String(entry[0]) === String(visitId));
  return row ? row[4] || '' : '';
}

function sanitizeFolderName_(name) {
  return String(name || '').replace(/[/\\:*?"<>|]/g, '-').trim();
}

function getLocalFolder_(visit) {
  const root = getImageFolder_();
  if (!root || typeof root.getFoldersByName !== 'function') {
    return root;
  }
  const local = getVisitLocal_(visit);
  const folderName = sanitizeFolderName_(local.code + (local.name ? ' - ' + local.name : ''));
  try {
    const existing = root.getFoldersByName(folderName);
    if (existing && existing.hasNext()) {
      return existing.next();
    }
    const byCode = root.getFoldersByName(local.code);
    if (byCode && byCode.hasNext()) {
      return byCode.next();
    }
    if (typeof root.createFolder === 'function') {
      return root.createFolder(folderName);
    }
  } catch (error) {
    Logger.log('No fue posible gestionar subcarpeta por local: ' + error.message);
  }
  return root;
}

function saveVisitPhoto_(payload) {
  validateVisit_(payload && payload.visit);
  const visit = payload.visit;
  const localFolder = getLocalFolder_(visit);
  const folderUrl = (localFolder && typeof localFolder.getUrl === 'function') ? localFolder.getUrl() : '';
  const rawImages = Array.isArray(payload.images) ? payload.images : (payload.image ? [payload.image] : []);
  if (!rawImages.length) {
    throw new Error('Seleccione una foto JPEG válida de hasta 6 MB comprimida.');
  }
  const type = payload.type || (payload.image ? 'frontis' : 'additional');
  const urls = [];
  rawImages.forEach((image, index) => {
    if (!image || image.mimeType !== 'image/jpeg' || typeof image.data !== 'string' ||
        !image.data.length || image.data.length > 6000000) {
      throw new Error('Seleccione una foto JPEG válida de hasta 6 MB comprimida.');
    }
    const bytes = Utilities.base64Decode(image.data);
    const fileName = type === 'frontis'
      ? visit.id + '-frontis.jpg'
      : visit.id + '-adicional-' + (index + 1) + '-' + new Date().getTime() + '.jpg';
    const blob = Utilities.newBlob(bytes, 'image/jpeg', fileName);
    const file = localFolder.createFile(blob);
    urls.push(file.getUrl());
  });

  const database = getDatabase_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    assertNewLocalCodeIsFree_(database, visit);
    const sheet = ensureSheet_(database, PHOTO_SHEET);
    upsertVisit_(database, visit);
    const values = sheet.getDataRange().getValues();
    const rowIndex = values.findIndex((row, index) => index && String(row[0]) === String(visit.id));
    const previousRow = rowIndex > 0 ? values[rowIndex] : [];
    const previousFrontis = previousRow[3] || '';
    const previousAdditional = previousRow[5] || '';
    const frontisUrl = type === 'frontis' ? urls[0] : previousFrontis;
    let additionalUrlsList = (previousAdditional ? String(previousAdditional).split('\n') : []).filter(Boolean);
    if (type !== 'frontis') {
      additionalUrlsList = additionalUrlsList.concat(urls);
    }
    const row = [
      visit.id,
      new Date(),
      getVisitLocal_(visit).code,
      frontisUrl,
      visit.collector.trim(),
      additionalUrlsList.join('\n'),
      folderUrl,
    ];
    if (rowIndex > 0) sheet.getRange(rowIndex + 1, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);
    return {
      visitId: visit.id,
      url: frontisUrl || urls[0],
      frontisUrl: frontisUrl,
      additionalUrls: additionalUrlsList,
      folderUrl: folderUrl,
      newUrls: urls,
    };
  } finally {
    lock.releaseLock();
  }
}

function visitTimingRow_(database, visitId) {
  const sheet = database.getSheetByName(SHEETS.visits.name);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('No se encontró la visita para guardar sus tiempos.');
  const values = sheet.getRange(1, 1, lastRow, SHEETS.visits.headers.length).getValues();
  const rowIndex = values.findIndex((row, index) => index > 0 && String(row[0]) === String(visitId));
  if (rowIndex < 1) throw new Error('No se encontró la visita para guardar sus tiempos.');
  return { sheet: sheet, rowIndex: rowIndex + 1, row: values[rowIndex] };
}

function visitTimingColumn_(header) {
  return SHEETS.visits.headers.indexOf(header) + 1;
}

function readInstrumentDuration_(database, visitId, instrument) {
  const visit = visitTimingRow_(database, visitId);
  const durationIndex = visitTimingColumn_(INSTRUMENT_DURATION_HEADERS[instrument]) - 1;
  const totalIndex = visitTimingColumn_(TOTAL_VISIT_DURATION_HEADER) - 1;
  return {
    durationSeconds: Number(visit.row[durationIndex]) || null,
    totalVisitDurationSeconds: Number(visit.row[totalIndex]) || null,
  };
}

function saveInstrumentDuration_(database, visitId, instrument, durationSeconds) {
  const visit = visitTimingRow_(database, visitId);
  const durationColumn = visitTimingColumn_(INSTRUMENT_DURATION_HEADERS[instrument]);
  const totalColumn = visitTimingColumn_(TOTAL_VISIT_DURATION_HEADER);
  visit.sheet.getRange(visit.rowIndex, durationColumn).setValue(durationSeconds == null ? '' : durationSeconds);
  visit.row[durationColumn - 1] = durationSeconds;
  const total = Object.keys(INSTRUMENT_DURATION_HEADERS).reduce((sum, key) => {
    return sum + (Number(visit.row[visitTimingColumn_(INSTRUMENT_DURATION_HEADERS[key]) - 1]) || 0);
  }, 0);
  visit.sheet.getRange(visit.rowIndex, totalColumn).setValue(total);
  return { durationSeconds: durationSeconds, totalVisitDurationSeconds: total };
}

function replaceRowsForVisit_(sheet, visitId, columnCount) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return;
  }
  const rows = sheet.getRange(2, 1, lastRow - 1, columnCount).getValues()
    .filter((row) => row[0] !== visitId);
  sheet.getRange(2, 1, lastRow - 1, columnCount).clearContent();
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, columnCount).setValues(rows);
  }
}

function validateVisit_(visit) {
  if (!visit || !visit.id || !visit.observationDate || !String(visit.collector || '').trim()) {
    throw new Error('Los datos generales de la visita están incompletos.');
  }
  if (visit.isNewLocal && !/^LM\d+N([A-Z]{2,3}|\d+)$/i.test(String(visit.localCode || '').trim())) {
    throw new Error('El código del local nuevo no tiene un formato válido. Genere el código desde la ficha de identificación.');
  }
  if (visit.interiorPhotoAuthorization &&
      !['No consultada', 'Autorizada', 'No autorizada'].includes(visit.interiorPhotoAuthorization)) {
    throw new Error('Indique un estado válido para la autorización de fotografía interior.');
  }
  getVisitLocal_(visit);
  ['latitude', 'longitude'].forEach((key) => {
    if (!Number.isFinite(Number(visit[key]))) {
      throw new Error('La ' + (key === 'latitude' ? 'latitud' : 'longitud') + ' levantada es obligatoria.');
    }
  });
  if (Number(visit.latitude) < -90 || Number(visit.latitude) > 90 ||
      Number(visit.longitude) < -180 || Number(visit.longitude) > 180) {
    throw new Error('Las coordenadas levantadas no son válidas.');
  }
}

function upsertVisit_(database, visit) {
  const local = getVisitLocal_(visit);
  const sheet = database.getSheetByName(SHEETS.visits.name);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex((row, index) => index && row[0] === visit.id);
  const row = [
    visit.id, new Date(), new Date(visit.observationDate + 'T12:00:00'),
    visit.collector.trim(), local.code, local.id, local.name, local.address,
    local.criterion, local.criterion2 || '',
    Number(visit.latitude), Number(visit.longitude),
    visit.recategorization || '', visit.retailSale || '',
    String(visit.unitVecinal || '').trim(),
  ];
  let targetRow;
  if (rowIndex > 0) {
    sheet.getRange(rowIndex + 1, 1, 1, row.length).setValues([row]);
    targetRow = rowIndex + 1;
  } else {
    sheet.appendRow(row);
    targetRow = sheet.getLastRow();
  }
  sheet.getRange(targetRow, SHEETS.visits.headers.length).setValue(visit.interiorPhotoAuthorization || '');
}

function availabilityRows_(visit, data) {
  if (!Array.isArray(data) || !data.length || data.some((item) => !['Sí', 'No'].includes(item.value))) {
    throw new Error('Complete todas las respuestas de disponibilidad y variedad.');
  }
  return data.map((item) => [visit.id, new Date(), item.section, item.category, item.label, item.value]);
}

function priceRows_(visit, data) {
  const entries = Array.isArray(data) ? data : data && data.products;
  const generalNotes = Array.isArray(data) ? '' : String(data && data.notes || '').trim();
  if (!Array.isArray(entries) || !entries.length) {
    throw new Error('Agregue al menos un producto con su precio mínimo.');
  }
  const rows = [];
  const seenProducts = new Set();
  entries.forEach((entry) => {
    const alias = PRICE_PRODUCT_ALIASES[entry.product];
    const name = String(alias ? alias.product : entry.product || '').trim();
    if (!name) {
      throw new Error('Indique el nombre del producto de cada registro de precios.');
    }
    if (seenProducts.has(name)) {
      throw new Error('Registre cada producto una sola vez y anote sus precios mínimo y máximo en ese registro.');
    }
    seenProducts.add(name);
    const category = String(entry.category || '').trim();
    if (!category) {
      throw new Error('Indique la categoría de ' + name + '.');
    }
    const status = entry.status || 'precio_obtenido';
    if (!PRICE_STATUSES.includes(status)) {
      throw new Error('Seleccione un resultado válido para ' + name + '.');
    }
    if (status !== 'precio_obtenido') {
      rows.push([
        visit.id, new Date(), category, name, 1,
        '', '', '', '', '', '', generalNotes, '',
        status,
      ]);
      return;
    }
    if (!Array.isArray(entry.prices) || entry.prices.length < 1 || entry.prices.length > 2) {
      throw new Error('Registre el precio mínimo (y, si corresponde, el máximo) de ' + name + '.');
    }
    entry.prices.forEach((price, index) => {
      if (!String(price.brand || '').trim() || String(price.value).trim() === '' ||
          !Number.isFinite(Number(price.value)) || Number(price.value) < 0 ||
          PRICE_UNITS.indexOf(price.unit) < 0) {
        throw new Error('Complete marca, precio y unidad de ' + name + '.');
      }
      const notes = [alias && alias.note, String(price.notes || '').trim()].filter(Boolean).join(' ');
      if (price.unit === 'Otros' && !notes) {
        throw new Error('Indique en observaciones el formato de ' + name + ' (unidad «Otros»).');
      }
      if (name === 'Arroz blanco grado 1' && !notes) {
        throw new Error('Indique en observaciones el tipo de arroz grado 1 considerado para el precio.');
      }
      const type = price.type || (index === 0 ? 'Mínimo' : 'Máximo');
      rows.push([
        visit.id, new Date(), category, name, index + 1,
        String(price.brand).trim(), Number(price.value), price.unit,
        '', '', price.promotion === 'Sí' ? 'Sí' : 'No',
        [notes, generalNotes].filter(Boolean).join(' — '),
        type,
        status,
      ]);
    });
  });
  return rows;
}

function originRows_(visit, data) {
  if (Array.isArray(data)) {
    throw new Error('La pauta de origen cambió de formato. Recargue la página y vuelva a completarla.');
  }
  if (data && data.noneObserved) {
    return [[visit.id, new Date(), 'Sin productos regionales observados', '', '', '', '', '', '', '', '', '']];
  }
  const items = data && Array.isArray(data.items) ? data.items : [];
  if (!items.length) {
    throw new Error('Agregue al menos un producto regional o marque que no se observaron.');
  }
  return items.map((item) => {
    const variety = String(item.variety || '').trim();
    const sector = String(item.sector || '').trim();
    const brand = String(item.brand || '').trim();
    const notes = String(item.notes || '').trim();
    const category = item.category;
    if (!(ORIGIN_CATEGORIES.includes(category) || LEGACY_ORIGIN_CATEGORIES.includes(category)) || !variety ||
        !AYSEN_COMMUNES.includes(item.commune) || !ORIGIN_SOURCES.includes(item.source)) {
      throw new Error('Complete categoría, variedad, comuna y fuente en todos los productos regionales.');
    }
    if ((item.source === 'Otra' || item.commune === 'Sin información de comuna') && !notes) {
      throw new Error('Describa en observaciones la evidencia de origen para ' + variety + '.');
    }
    return [visit.id, new Date(), category + ': ' + variety, item.commune,
      [sector, brand].filter(Boolean).join(' · '), notes,
      category, variety, item.commune, sector, brand, item.source];
  });
}

const PROTEIN_CATEGORIES = ['vacuno', 'cerdo', 'pollo', 'cordero', 'pescados_mariscos'];
function classificationCriteria_(data) {
  const source = data || {};
  const keys = ['variedadesFrutasVerduras', 'categoriasProteicas', 'lacteosHabituales', 'huevosHabituales'];
  const present = keys.filter((key) => Object.prototype.hasOwnProperty.call(source, key));
  if (!present.length) {
    return { varieties: '', proteins: [], dairy: '', eggs: '', fulfilledCriteria: 0 };
  }
  if (present.length !== keys.length) {
    throw new Error('Complete los tres criterios de surtido antes de guardar la clasificación.');
  }
  if (String(source.variedadesFrutasVerduras).trim() === '') {
    throw new Error('Ingrese el número de variedades de frutas y verduras.');
  }
  const varieties = Number(source.variedadesFrutasVerduras);
  if (!Number.isInteger(varieties) || varieties < 0) {
    throw new Error('Ingrese un número entero igual o mayor que cero para las variedades de frutas y verduras.');
  }
  if (!Array.isArray(source.categoriasProteicas) ||
      source.categoriasProteicas.some((category) => !PROTEIN_CATEGORIES.includes(category))) {
    throw new Error('Seleccione solo categorías proteicas válidas: vacuno, cerdo, pollo, cordero o pescados y mariscos.');
  }
  if (!['si', 'no'].includes(source.lacteosHabituales) ||
      !['si', 'no'].includes(source.huevosHabituales)) {
    throw new Error('Indique si ofrece habitualmente lácteos y huevos.');
  }
  const proteins = [...new Set(source.categoriasProteicas)];
  const fulfilledCriteria = [
    varieties >= 10,
    proteins.length >= 2,
    source.lacteosHabituales === 'si' && source.huevosHabituales === 'si',
  ].filter(Boolean).length;
  return {
    varieties: varieties,
    proteins: proteins,
    dairy: source.lacteosHabituales,
    eggs: source.huevosHabituales,
    fulfilledCriteria: fulfilledCriteria,
  };
}
function classifyLocal_(sistemaAtencion, criteria) {
  const service = sistemaAtencion === 'acceso_libre' ? 'autoservicio' : sistemaAtencion;
  // Mixto se registra como categoría propia, pero pesa como autoservicio en el cálculo.
  return ['autoservicio', 'mixto'].includes(service) && criteria.fulfilledCriteria >= 2
    ? 'minimarket' : 'almacen_barrio';
}

function classificationRows_(visit, data) {
  if (!data || data.estadoLocal !== 'abierto') {
    throw new Error('Solo se registran locales abiertos.');
  }
  const local = getVisitLocal_(visit);
  if (!['autoservicio', 'transmeson', 'mixto', 'acceso_libre'].includes(data.sistemaAtencion)) {
    throw new Error('Indique el sistema de atención del local.');
  }
  if (Array.isArray(data.images && data.images.interior) && data.images.interior.length && !data.interiorAuthorized) {
    throw new Error('El interior solo puede registrarse con autorización.');
  }
  const criteria = classificationCriteria_(data);
  const automatic = classifyLocal_(data.sistemaAtencion, criteria);
  if (data.clasificacionOverride && !String(data.justificacionOverride || '').trim()) {
    throw new Error('Justifique la corrección manual de la clasificación.');
  }
  const finalClassification = data.clasificacionOverride || automatic;
  return [[
    visit.id, new Date(), String(visit.unitVecinal || '').trim(), 'abierto', data.superficie || '', data.sistemaAtencion || '',
    data.personasAtendiendo || '', '', data.rubroFrutasHortalizas || '', data.rubroCarneFresca || '',
    observedRubros_(data, criteria), '', '', '', automatic, finalClassification,
    data.clasificacionOverride ? 'manual' : 'automatica', String(data.justificacionOverride || '').trim(),
    String(data.observaciones || '').trim(), local.code, local.id, local.name, local.address,
    local.criterion, local.criterion2 || '', data.imageUrls.frontis || '', data.imageUrls.interior || '',
    data.imageUrls.frutasVerduras || '', data.imageUrls.carnes || '', data.imageUrls.congelados || '',
    criteria.varieties, criteria.proteins.join(', '), criteria.dairy, criteria.eggs,
    data.imageUrls.pescadosMariscos || '',
  ]];
}

function observedRubros_(data, criteria) {
  return [
    data.rubroFrutasHortalizas === 'si' ? 'Frutas y hortalizas frescas' : '',
    data.rubroCarneFresca === 'si' ? 'Carne fresca' : '',
    criteria.proteins.includes('pescados_mariscos') ? 'Pescados y mariscos congelados' : '',
    criteria.dairy === 'si' ? 'Lácteos' : '',
    criteria.eggs === 'si' ? 'Huevos' : '',
  ].filter(Boolean).join(', ');
}

function saveClassificationImages_(visit, data, previousImageUrls) {
  let folder;
  const urls = {};
  Object.keys(data.images || {}).forEach((group) => {
    const files = Array.isArray(data.images[group]) ? data.images[group] : [];
    urls[group] = files.length ? files.map((image, index) => {
      if (!image || !image.data || image.mimeType !== 'image/jpeg') {
        throw new Error('Una imagen del grupo ' + group + ' no tiene un formato válido.');
      }
      if (!folder) folder = getLocalFolder_(visit);
      const bytes = Utilities.base64Decode(image.data);
      const blob = Utilities.newBlob(bytes, image.mimeType, visit.id + '-' + group + '-' + (index + 1) + '.jpg');
      return folder.createFile(blob).getUrl();
    }).join('\n') : previousImageUrls[group] || '';
  });
  return urls;
}

function getImageFolder_() {
  const folders = DriveApp.getFoldersByName(IMAGE_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(IMAGE_FOLDER_NAME);
}

function driveWriteScopeGranted_() {
  if (typeof ScriptApp === 'undefined' || !ScriptApp.getAuthorizationInfo) return null;
  try {
    const info = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL, [DRIVE_WRITE_SCOPE]);
    return info.getAuthorizationStatus() === ScriptApp.AuthorizationStatus.NOT_REQUIRED;
  } catch (error) {
    return null;
  }
}

function autorizarDriveCaptura() {
  // Forces the consent screen when Drive was left unchecked in a granular authorization.
  if (typeof ScriptApp !== 'undefined' && ScriptApp.requireScopes) {
    ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, [DRIVE_WRITE_SCOPE]);
  }
  const folder = getImageFolder_();
  const probe = folder.createFile(Utilities.newBlob('Prueba de permiso ESPORA', 'text/plain',
    'prueba-permiso-escritura-espora.txt'));
  probe.setTrashed(true);
  Logger.log('Lectura y escritura en la carpeta de imágenes autorizadas: ' + folder.getUrl());
}

function getSampleLocal_(code) {
  const local = SAMPLE_LOCALS.find((entry) => entry.code === String(code || '').trim().toUpperCase());
  if (!local) {
    throw new Error('El código de local no pertenece a la muestra sugerida.');
  }
  return local;
}

function getVisitLocal_(visit) {
  const sample = SAMPLE_LOCALS.find((entry) => entry.code === String(visit.localCode || '').trim().toUpperCase());
  if (sample) {
    return sample;
  }
  if (visit.isNewLocal && String(visit.localName || '').trim() &&
      String(visit.localAddress || '').trim() && String(visit.localType || '').trim()) {
    return {
      code: String(visit.localCode).trim().toUpperCase(),
      id: '',
      name: String(visit.localName).trim(),
      address: String(visit.localAddress).trim(),
      criterion: String(visit.localType).trim(),
      criterion2: '',
    };
  }
  throw new Error('El código de local no pertenece a la muestra y faltan datos del local nuevo.');
}

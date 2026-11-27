const MANAGEMENT_SPREADSHEET_ID = '18-WVRoC8GDZ0J0QTQd_yc_HWmVXresq2qD0Qw2MxWyc';
const LOCAL_SOURCE_SHEET = 'Asignacion 107';
const ASSIGNMENTS_SHEET = 'Portal Asignaciones';
const PORTFOLIO_SHEET = 'Portal Cartera';
const ACCESS_SHEET = 'Portal Accesos';
const AUDIT_SHEET = 'Portal Bitacora';
const ADMIN_SECRET_PROPERTY = 'ESPORA_PORTAL_ADMIN_SECRET';
const COLLECTOR_PIN_PROPERTY = 'ESPORA_PORTAL_COLLECTOR_PIN';
const ACCOUNT_PROPERTY_PREFIX = 'ESPORA_ACCOUNT_';
const ADMIN_DIGEST_EMAIL_PROPERTY = 'ESPORA_PORTAL_ADMIN_EMAIL';
const PROPOSAL_DIGEST_HANDLER = 'sendDailyProposalDigest';
const EMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/script.send_mail';
const PASSWORD_KDF_ITERATIONS = 8000;
const LOGIN_FAILURE_LIMIT = 10;
const LOGIN_LOCKOUT_SECONDS = 15 * 60;
const RESET_REQUEST_LIMIT = 3;
const RESET_REQUEST_WINDOW_MILLISECONDS = 60 * 60 * 1000;
const RESET_CODE_FAILURE_LIMIT = 5;
const RESET_CODE_TTL_MILLISECONDS = 10 * 60 * 1000;
const PASSWORD_RESET_SUBJECT = 'ESPORA · Recuperación de acceso';
// Capture responses live in a separate spreadsheet; the portal only reads it.
const CAPTURE_SPREADSHEET_ID = '1WpIv7POGkW9-11ge7acXhZtuFws95snHwN8k_tf8KsU';
const CAPTURE_VISITS_SHEET = 'Visitas';
const CAPTURE_INSTRUMENT_SHEETS = {
  classification: 'Clasificación',
  availability: 'Disponibilidad',
  origins: 'Origen',
  prices: 'Precios',
};
const CAPTURE_DURATION_HEADERS = {
  classification: 'Tiempo Clasificación (segundos)',
  availability: 'Tiempo Disponibilidad y variedad (segundos)',
  origins: 'Tiempo Origen (segundos)',
  prices: 'Tiempo Precios (segundos)',
};
const CAPTURE_TOTAL_DURATION_HEADER = 'Tiempo total de visita (segundos)';
const CAPTURE_APP_URL = 'https://estebancofre-coy.github.io/observatorio-precios-nuevo-estudio/';
const STUDENT_INSTRUMENT_VALIDATED = false;
const STUDENT_INSTRUMENT_VERSION = 'borrador-1';
const RESEARCH_FOLDER_PROPERTY = 'ESPORA_RESEARCH_FOLDER_ID';
const RESEARCH_NOTES_HEADERS = ['Fecha de registro', 'Aplicador', 'Tipo', 'Observación'];
const STUDENT_SURVEY_HEADERS = ['Fecha de registro', 'Aplicador', 'Versión', 'Código participante', 'Fecha de aplicación', 'Año de ingreso', 'Carrera', 'Sexo', 'Presupuesto mensual CLP', 'Lugar habitual de compra', 'Interés alimentario', 'Barreras', 'Comentarios'];
const TRANSCRIPT_HEADERS = ['Fecha de registro', 'Aplicador', 'Versión', 'Código participante', 'Fecha de entrevista', 'Año de ingreso', 'Carrera', 'Sexo', 'Idioma', 'Tipo de entrevista', 'ID de archivo'];

const PORTAL_ACCOUNTS = [
  { slug: 'esteban', name: 'Esteban Cofré', email: 'esteban.cofre@uaysen.cl', role: 'admin' },
];

function portalAccounts_() {
  const stored = PropertiesService.getScriptProperties().getProperty('ESPORA_COLLECTOR_ACCOUNTS');
  return PORTAL_ACCOUNTS.concat(stored ? JSON.parse(stored) : []);
}

function collectors_() {
  return portalAccounts_().filter(function (account) { return account.role === 'collector'; })
    .map(function (account) { return account.name; });
}
const TEMP_PASSWORD_PROPERTY_PREFIX = 'ESPORA_INITIAL_PASSWORD_';
const INSTRUMENTS = [
  { id: 'availability', label: 'Disponibilidad y variedad' },
  { id: 'prices', label: 'Precios' },
];
const INSTRUMENT_STATES = ['Pendiente', 'En curso', 'Completo', 'No aplica', 'Bloqueado'];
const SCHEDULE_HEADERS = [
  'ID asignación', 'Fecha', 'Código local', 'Nombre local', 'Dirección', 'Categoría',
  'Unidad vecinal', 'Sector', 'Nota territorial', 'Aplicador/a', 'Instrumentos requeridos',
  'Estado: Clasificación', 'Estado: Disponibilidad', 'Estado: Origen', 'Estado: Precios',
  'Detalle de estado', 'Estado asignación', 'Motivo cancelación',
  'Creada por', 'Creada el', 'Actualizada el',
  'Estado de solicitud', 'Hora propuesta', 'Nota de solicitud', 'Motivo de respuesta',
  'Origen de solicitud',
];
const LEGACY_SCHEDULE_HEADERS = SCHEDULE_HEADERS.slice(0, 21);
const ACCESS_HEADERS = [
  'Tipo', 'ID', 'Hash', 'Nombre', 'Rol', 'Creada el', 'Expira el', 'Canjeada el', 'Revocada el',
  'Correo', 'Cambio de clave requerido',
];
const AUDIT_HEADERS = [
  'ID evento', 'Fecha y hora', 'Acción', 'Rol', 'Persona', 'ID asignación',
  'Instrumento', 'Estado anterior', 'Estado nuevo',
];
const LEGACY_PORTFOLIO_HEADERS = [
  'Código local', 'Nombre local', 'Dirección', 'Sector territorial',
  'Aplicador/a permanente', 'Estado de revisión', 'Actualizada el', 'Actualizada por',
];
const V2_PORTFOLIO_HEADERS = LEGACY_PORTFOLIO_HEADERS.concat(['Instrumentos requeridos']);
const PORTFOLIO_HEADERS = V2_PORTFOLIO_HEADERS.concat([
  'Estado de terreno', 'Observación de terreno', 'Fecha estado de terreno', 'Estado de terreno por',
]);
const PORTFOLIO_FIELD_STATES = ['Operativo', 'Cerrado', 'Rechazo'];
const DEFAULT_REQUIRED_INSTRUMENTS = INSTRUMENTS.map(function (instrument) { return instrument.id; });
const NON_AM_REQUIRED_INSTRUMENTS = ['availability', 'prices'];
const PORTFOLIO_MANUAL = 'Asignado manualmente';
const PORTFOLIO_UNASSIGNED = 'Sin asignar por administración';
const CONSOLIDATED_SYNC_PROPERTY = 'ESPORA_CONSOLIDATED_DECISIONS_2026_11_19';
const HOMOLOGATED_LOCAL_CODES = {};
const EXCLUDED_TEMPORARY_CODES = {};
const CONSOLIDATED_EXTRA_LOCALS = [];
const CONSOLIDATED_LOCAL_OVERRIDES = {};
const MANUAL_ANALYTICAL_CLASSIFICATIONS = {};

function doGet(event) {
  const isCollectorView = event && event.parameter && event.parameter.view === 'collector';
  const template = HtmlService.createTemplateFromFile(isCollectorView ? 'Collector' : 'Admin');
  template.collectorUrl = collectorPortalUrl_();
  return template
    .evaluate()
    .setTitle(isCollectorView ? 'ESPORA · Mis tareas' : 'ESPORA · Administración de terreno')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function setupManagementPortal() {
  return withScriptLock_(function () {
    const spreadsheet = managementSpreadsheet_();
    const source = ensureManagedSheet_(spreadsheet, LOCAL_SOURCE_SHEET,
      ['Código local', 'Nombre del establecimiento', 'Categoría criterion', 'Subcategoría criterion2', 'Dirección registrada']);
    sourceColumns_(source);
    ensureAssignmentSheet_(spreadsheet);
    ensurePortfolioSheet_(spreadsheet);
    ensureAccessSheet_(spreadsheet);
    ensureManagedSheet_(spreadsheet, AUDIT_SHEET, AUDIT_HEADERS);
    syncTerritorialPortfolio_(readLocals_());
    return 'Portal preparado. Las pestañas de origen no se modificaron; el registro de visitas se amplió sin borrar filas.';
  });
}

function researchSpreadsheet_() {
  if (!CAPTURE_SPREADSHEET_ID) throw new Error('Configura la planilla nueva de captura.');
  return SpreadsheetApp.openById(CAPTURE_SPREADSHEET_ID);
}

function researchText_(value, label, maxLength) {
  const text = String(value || '').trim();
  if (!text || text.length > maxLength) throw new Error('Revisa el campo ' + label + '.');
  return text;
}

function researchCell_(value) {
  const text = String(value || '');
  return /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
}

function researchMetadata_(payload) {
  const code = researchText_(payload.participantCode, 'código de participante', 40).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(code)) throw new Error('El código debe usar solo letras, números, guiones o guiones bajos.');
  const year = Number(payload.entryYear);
  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear()) throw new Error('Ingresa un año de ingreso válido.');
  const career = researchText_(payload.career, 'carrera', 150);
  const sex = String(payload.sex || '');
  if (['Femenino', 'Masculino', 'Otro', 'Prefiero no responder'].indexOf(sex) < 0) throw new Error('Selecciona una respuesta válida para sexo.');
  if (payload.consent !== true) throw new Error('Confirma que existe consentimiento para el uso de los datos.');
  return [code, validateDate_(payload.date), year, researchCell_(career), sex];
}

function requireValidatedStudentInstrument_() {
  if (!STUDENT_INSTRUMENT_VALIDATED) throw new Error('El instrumento está pendiente de validación. No se pueden guardar respuestas ni cargar transcripciones.');
}

function apiSaveResearchNote(token, payload) {
  const session = requireSession_(token, 'collector');
  const category = String(payload && payload.category || '');
  if (['Aplicación', 'Adecuación', 'Cuaderno de campo'].indexOf(category) < 0) throw new Error('Selecciona un tipo de observación.');
  const note = researchText_(payload && payload.note, 'observación', 3000);
  return withScriptLock_(function () {
    const sheet = ensureManagedSheet_(researchSpreadsheet_(), 'Observaciones estudio', RESEARCH_NOTES_HEADERS);
    sheet.appendRow([new Date(), researchCell_(session.name), category, researchCell_(note)]);
    return 'Observación guardada.';
  });
}

function apiStudentInstrumentStatus(token) {
  requireSession_(token);
  return { validated: STUDENT_INSTRUMENT_VALIDATED, version: STUDENT_INSTRUMENT_VERSION };
}

function setupResearchStorage() {
  return withScriptLock_(function () {
    const properties = PropertiesService.getScriptProperties();
    if (properties.getProperty(RESEARCH_FOLDER_PROPERTY)) throw new Error('La carpeta de investigación ya está configurada; no se modificó.');
    const spreadsheet = researchSpreadsheet_();
    ensureManagedSheet_(spreadsheet, 'Encuesta estudiantes', STUDENT_SURVEY_HEADERS);
    ensureManagedSheet_(spreadsheet, 'Transcripciones estudiantes', TRANSCRIPT_HEADERS);
    const folder = DriveApp.createFolder('ESPORA - Transcripciones nuevo estudio');
    folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    properties.setProperty(RESEARCH_FOLDER_PROPERTY, folder.getId());
    return 'Carpeta creada. Revisa sus permisos y los de la planilla de captura antes de usar datos reales: ' + folder.getUrl();
  });
}

function apiSaveStudentSurvey(token, payload) {
  const session = requireSession_(token, 'collector');
  requireValidatedStudentInstrument_();
  const metadata = researchMetadata_(payload || {});
  const budgetText = String(payload.budget === undefined || payload.budget === null ? '' : payload.budget).trim();
  const budget = budgetText === '' ? '' : Number(budgetText);
  if (budget !== '' && (!Number.isInteger(budget) || budget < 0 || budget > 100000000)) throw new Error('Ingresa un presupuesto mensual válido en pesos.');
  const purchase = String(payload.purchase || '');
  const interest = String(payload.interest || '');
  if (['Supermercado', 'Almacén', 'Feria o mercado', 'Otro', 'Prefiero no responder'].indexOf(purchase) < 0) throw new Error('Selecciona un lugar de compra.');
  if (['Precio', 'Calidad', 'Salud', 'Origen', 'Otro', 'Prefiero no responder'].indexOf(interest) < 0) throw new Error('Selecciona un interés alimentario.');
  const barriers = String(payload.barriers || '').trim();
  const comments = String(payload.comments || '').trim();
  if (barriers.length > 3000 || comments.length > 3000) throw new Error('Las respuestas abiertas no pueden superar 3000 caracteres.');
  return withScriptLock_(function () {
    const sheet = ensureManagedSheet_(researchSpreadsheet_(), 'Encuesta estudiantes', STUDENT_SURVEY_HEADERS);
    sheet.appendRow([new Date(), researchCell_(session.name), STUDENT_INSTRUMENT_VERSION].concat(metadata, [budget, purchase, interest, researchCell_(barriers), researchCell_(comments)]));
    return 'Encuesta guardada.';
  });
}

function apiUploadStudentTranscript(token, payload) {
  const session = requireSession_(token, 'collector');
  requireValidatedStudentInstrument_();
  const metadata = researchMetadata_(payload || {});
  if (payload.anonymized !== true) throw new Error('Confirma que la transcripción está desidentificada.');
  const language = researchText_(payload.language, 'idioma', 80);
  const interviewType = String(payload.interviewType || '');
  if (['Individual', 'Grupal'].indexOf(interviewType) < 0) throw new Error('Selecciona el tipo de entrevista.');
  const formats = { txt: 'text/plain', pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  const extension = String(payload.extension || '').toLowerCase();
  if (!formats[extension]) throw new Error('Solo se aceptan archivos TXT, PDF o DOCX.');
  const encoded = String(payload.base64 || '');
  if (!encoded || encoded.length > 4194304 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error('Archivo inválido o mayor a 3 MB.');
  const bytes = Utilities.base64Decode(encoded);
  if (!bytes.length || bytes.length > 3145728) throw new Error('El archivo debe tener entre 1 byte y 3 MB.');
  if (extension === 'pdf' && String.fromCharCode.apply(null, bytes.slice(0, 5)) !== '%PDF-') throw new Error('El contenido no corresponde a un PDF.');
  if (extension === 'docx' && (bytes[0] !== 80 || bytes[1] !== 75)) throw new Error('El contenido no corresponde a un DOCX.');
  const folderId = PropertiesService.getScriptProperties().getProperty(RESEARCH_FOLDER_PROPERTY);
  if (!folderId) throw new Error('Falta preparar la carpeta de investigación. Contacta a administración.');
  return withScriptLock_(function () {
    const sheet = ensureManagedSheet_(researchSpreadsheet_(), 'Transcripciones estudiantes', TRANSCRIPT_HEADERS);
    const folder = DriveApp.getFolderById(folderId);
    if (folder.getSharingAccess() !== DriveApp.Access.PRIVATE) throw new Error('La carpeta no es privada. Contacta a administración.');
    const file = folder.createFile(Utilities.newBlob(bytes, formats[extension], metadata[0] + '-' + Utilities.getUuid() + '.' + extension));
    try {
      sheet.appendRow([new Date(), researchCell_(session.name), STUDENT_INSTRUMENT_VERSION].concat(metadata, [researchCell_(language), interviewType, file.getId()]));
    } catch (error) {
      file.setTrashed(true);
      throw new Error('No se pudo registrar la transcripción; se envió el archivo a la papelera: ' + error.message);
    }

    return 'Transcripción cargada.';
  });
}

function apiListResearchRecords(token) {
  requireSession_(token, 'admin');
  const spreadsheet = researchSpreadsheet_();
  function rows(name, headers) {
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) return [];
    assertHeaders_(sheet, headers);
    const count = sheet.getLastRow() - 1;
    return count > 0 ? sheet.getRange(2, 1, count, headers.length).getDisplayValues().reverse() : [];
  }
  return {
    notes: rows('Observaciones estudio', RESEARCH_NOTES_HEADERS),
    transcripts: rows('Transcripciones estudiantes', TRANSCRIPT_HEADERS),
  };
}

function apiLogin(role, email, password) {
  const normalizedEmail = normalizeAccountEmail_(email);
  const account = accountByEmail_(normalizedEmail);
  const failureKey = 'esporaLogin:' + hashSecret_(normalizedEmail).slice(0, 32);
  if (role !== 'admin' && role !== 'collector') throw new Error('Selecciona un tipo de acceso válido.');
  if (account) assertAccountNotLockedOut_(account);
  else assertNotLockedOut_(failureKey, LOGIN_FAILURE_LIMIT);
  const properties = PropertiesService.getScriptProperties();
  const isConfigured = account && account.role === role;
  const salt = isConfigured
    ? properties.getProperty(accountProperty_(account, 'SALT'))
    : '';
  const storedHash = isConfigured
    ? properties.getProperty(accountProperty_(account, 'HASH'))
    : '';
  const temporarySalt = isConfigured
    ? properties.getProperty(accountProperty_(account, 'TEMP_SALT'))
    : '';
  const temporaryHash = isConfigured
    ? properties.getProperty(accountProperty_(account, 'TEMP_HASH'))
    : '';
  const submittedPassword = String(password || '');
  const matchesPermanent = Boolean(salt && storedHash
    && constantTimeEquals_(passwordHash_(submittedPassword, salt), storedHash));
  const matchesTemporary = Boolean(temporarySalt && temporaryHash
    && constantTimeEquals_(passwordHash_(submittedPassword, temporarySalt), temporaryHash));
  const mustChangeProperty = isConfigured
    ? properties.getProperty(accountProperty_(account, 'MUST_CHANGE'))
    : '';

  if (!isConfigured || (!matchesPermanent && !matchesTemporary)) {
    if (account) registerAccountLoginFailure_(account);
    else registerFailure_(failureKey);
    throw new Error('El correo o la clave no son válidos. Comprueba los datos e intenta nuevamente.');
  }

  const session = withScriptLock_(function () {
    assertAccountNotLockedOut_(account);
    if (properties.getProperty(accountProperty_(account, 'SALT')) !== salt
      || properties.getProperty(accountProperty_(account, 'HASH')) !== storedHash
      || properties.getProperty(accountProperty_(account, 'TEMP_SALT')) !== temporarySalt
      || properties.getProperty(accountProperty_(account, 'TEMP_HASH')) !== temporaryHash
      || properties.getProperty(accountProperty_(account, 'MUST_CHANGE')) !== mustChangeProperty) {
      throw new Error('La clave cambió durante el ingreso. Intenta nuevamente con la clave vigente.');
    }
    const requiresPasswordChange = mustChangeProperty === 'true' || matchesTemporary;
    const result = createSession_(account.role, account.name, account.email, requiresPasswordChange);
    properties.deleteProperty(accountProperty_(account, 'LOGIN_FAILURE_COUNT'));
    properties.deleteProperty(accountProperty_(account, 'LOGIN_LOCKED_UNTIL'));
    return result;
  });
  audit_('Inicio de sesión', account.role, account.name);
  return session;
}

function setupIndividualPortalAccess() {
  const properties = PropertiesService.getScriptProperties();
  const credentials = portalAccounts_().map(function (account) {
    const property = TEMP_PASSWORD_PROPERTY_PREFIX + account.slug.toUpperCase();
    const temporaryPassword = String(properties.getProperty(property) || '');
    const isAlreadyConfigured = Boolean(
      properties.getProperty(accountProperty_(account, 'TEMP_HASH'))
      || properties.getProperty(accountProperty_(account, 'HASH'))
    );
    if (!temporaryPassword && !isAlreadyConfigured) {
      throw new Error('Falta definir la propiedad temporal ' + property + '. No se modificó ninguna cuenta.');
    }
    return {
      account: account,
      property: property,
      temporaryPassword: temporaryPassword,
      isAlreadyConfigured: isAlreadyConfigured,
    };
  });
  const prepared = credentials.filter(function (credential) {
    return !credential.isAlreadyConfigured;
  }).map(function (credential) {
    const salt = randomSecret_();
    return {
      account: credential.account,
      property: credential.property,
      salt: salt,
      hash: passwordHash_(credential.temporaryPassword, salt),
    };
  });
  if (!prepared.length) {
    throw new Error('Las cuentas ya están configuradas; no se reemplazaron sus claves.');
  }
  ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, [EMAIL_SEND_SCOPE]);
  withScriptLock_(function () {
    ensureAccessSheet_(managementSpreadsheet_());
    const changedDuringSetup = prepared.some(function (credential) {
      return properties.getProperty(accountProperty_(credential.account, 'TEMP_HASH'))
        || properties.getProperty(accountProperty_(credential.account, 'HASH'));
    });
    if (changedDuringSetup) {
      throw new Error('Una cuenta cambió durante la preparación. No se sobrescribieron accesos existentes.');
    }
    prepared.forEach(function (credential) {
      properties.setProperty(accountProperty_(credential.account, 'TEMP_SALT'), credential.salt);
      properties.setProperty(accountProperty_(credential.account, 'TEMP_HASH'), credential.hash);
      properties.setProperty(accountProperty_(credential.account, 'MUST_CHANGE'), 'true');
      properties.deleteProperty(credential.property);
    });
    credentials.filter(function (credential) { return credential.isAlreadyConfigured; })
      .forEach(function (credential) { properties.deleteProperty(credential.property); });
    properties.deleteProperty(ADMIN_SECRET_PROPERTY);
    properties.deleteProperty(COLLECTOR_PIN_PROPERTY);
    revokeAllPortalSessions_();
  });
  return 'Accesos individuales preparados. Las claves temporales se consumieron y cada persona deberá crear una clave propia al ingresar.';
}

function apiChangePassword(token, password, confirmation) {
  const session = requireSession_(token, null, true);
  if (!session.mustChange) throw new Error('La cuenta no requiere un cambio inicial de clave.');
  const account = accountByEmail_(session.email);
  if (!account) throw new Error('La cuenta no está habilitada. Contacta a administración.');
  const value = validatePersonalPassword_(password, confirmation);
  withScriptLock_(function () {
    const activeSession = requireSession_(token, null, true);
    if (!activeSession.mustChange || activeSession.email !== account.email) {
      throw new Error('La sesión ya no está autorizada para cambiar esta clave.');
    }
    const properties = PropertiesService.getScriptProperties();
    const temporarySalt = properties.getProperty(accountProperty_(account, 'TEMP_SALT'));
    const temporaryHash = properties.getProperty(accountProperty_(account, 'TEMP_HASH'));
    if (temporarySalt && temporaryHash
      && constantTimeEquals_(passwordHash_(value, temporarySalt), temporaryHash)) {
      throw new Error('La clave personal debe ser distinta de la clave temporal.');
    }
    setAccountPassword_(account, value, token);
  });
  audit_('Cambio de clave inicial', account.role, account.name);
  return { mustChange: false };
}

function apiRequestPasswordReset(email) {
  const normalizedEmail = normalizeAccountEmail_(email);
  const genericMessage = 'Si el correo está habilitado, recibirás instrucciones de recuperación. Si no llegan en 10 minutos, revisa correo no deseado y contacta a administración.';
  return withScriptLock_(function () {
    const account = accountByEmail_(normalizedEmail);
    if (!account) return { message: genericMessage };

    const properties = PropertiesService.getScriptProperties();
    const requestedAtKey = accountProperty_(account, 'RESET_REQUESTED_AT');
    const requestCountKey = accountProperty_(account, 'RESET_REQUEST_COUNT');
    const now = Date.now();
    let windowStartedAt = Number(properties.getProperty(requestedAtKey) || 0);
    let requestCount = Number(properties.getProperty(requestCountKey) || 0);
    if (!windowStartedAt || now - windowStartedAt >= RESET_REQUEST_WINDOW_MILLISECONDS) {
      windowStartedAt = now;
      requestCount = 0;
    }
    if (requestCount >= RESET_REQUEST_LIMIT) return { message: genericMessage };
    properties.setProperty(requestedAtKey, String(windowStartedAt));
    properties.setProperty(requestCountKey, String(requestCount + 1));

    const code = randomSecret_().slice(0, 12).toUpperCase();
    properties.setProperty(accountProperty_(account, 'RESET_HASH'), hashSecret_(normalizedEmail + ':' + code));
    properties.setProperty(accountProperty_(account, 'RESET_EXPIRES_AT'),
      String(Date.now() + RESET_CODE_TTL_MILLISECONDS));
    properties.setProperty(accountProperty_(account, 'RESET_FAILURES'), '0');
    try {
      MailApp.sendEmail({
        to: account.email,
        subject: PASSWORD_RESET_SUBJECT,
        body: 'Hola ' + account.name + ':\n\n'
          + 'Tu código de recuperación ESPORA es: ' + code + '\n'
          + 'Vence en 10 minutos y solo puede usarse una vez. Si no solicitaste este cambio, ignora este mensaje.\n\n'
          + 'Por seguridad, no compartas este código.',
      });
    } catch (error) {
      Logger.log('No se pudo enviar el código de recuperación ESPORA: ' + error.message);
    }
    return { message: genericMessage };
  });
}

function apiCompletePasswordReset(email, code, password, confirmation) {
  const normalizedEmail = normalizeAccountEmail_(email);
  const account = accountByEmail_(normalizedEmail);
  if (!account) throw new Error('No pudimos validar el código. Solicita otro e inténtalo nuevamente.');
  const value = validatePersonalPassword_(password, confirmation);
  return withScriptLock_(function () {
    const properties = PropertiesService.getScriptProperties();
    const failuresKey = accountProperty_(account, 'RESET_FAILURES');
    const failures = Number(properties.getProperty(failuresKey) || 0);
    if (failures >= RESET_CODE_FAILURE_LIMIT) {
      throw new Error('No pudimos validar el código. Si agotaste los intentos, espera antes de solicitar uno nuevo.');
    }
    const storedHash = properties.getProperty(accountProperty_(account, 'RESET_HASH')) || '';
    const expiresAt = Number(properties.getProperty(accountProperty_(account, 'RESET_EXPIRES_AT')) || 0);
    const submittedHash = hashSecret_(normalizedEmail + ':' + String(code || '').trim().toUpperCase());
    if (!storedHash || Date.now() > expiresAt || !constantTimeEquals_(submittedHash, storedHash)) {
      properties.setProperty(failuresKey, String(failures + 1));
      throw new Error('No pudimos validar el código. Solicita otro e inténtalo nuevamente.');
    }
    setAccountPassword_(account, value, '');
    properties.deleteProperty(accountProperty_(account, 'RESET_HASH'));
    properties.deleteProperty(accountProperty_(account, 'RESET_EXPIRES_AT'));
    properties.deleteProperty(failuresKey);
    audit_('Recuperación de clave', account.role, account.name);
    return { message: 'Clave actualizada. Ingresa con tu nueva clave personal.' };
  });
}

function assertNotLockedOut_(cacheKey, limit) {
  const failures = Number(CacheService.getScriptCache().get(cacheKey) || 0);
  if (failures >= limit) {
    throw new Error('Hubo demasiados intentos fallidos. Espera 15 minutos antes de volver a intentar.');
  }
}

function registerFailure_(cacheKey) {
  const cache = CacheService.getScriptCache();
  cache.put(cacheKey, String(Number(cache.get(cacheKey) || 0) + 1), LOGIN_LOCKOUT_SECONDS);
}

function assertAccountNotLockedOut_(account) {
  const properties = PropertiesService.getScriptProperties();
  const lockUntilKey = accountProperty_(account, 'LOGIN_LOCKED_UNTIL');
  const lockUntil = Number(properties.getProperty(lockUntilKey) || 0);
  if (lockUntil > Date.now()) {
    throw new Error('Hubo demasiados intentos fallidos. Espera 15 minutos antes de volver a intentar.');
  }
  if (lockUntil) {
    properties.deleteProperty(lockUntilKey);
    properties.deleteProperty(accountProperty_(account, 'LOGIN_FAILURE_COUNT'));
  }
}

function registerAccountLoginFailure_(account) {
  withScriptLock_(function () {
    const properties = PropertiesService.getScriptProperties();
    const countKey = accountProperty_(account, 'LOGIN_FAILURE_COUNT');
    const count = Number(properties.getProperty(countKey) || 0) + 1;
    properties.setProperty(countKey, String(count));
    if (count >= LOGIN_FAILURE_LIMIT) {
      properties.setProperty(accountProperty_(account, 'LOGIN_LOCKED_UNTIL'),
        String(Date.now() + LOGIN_LOCKOUT_SECONDS * 1000));
    }
  });
}
function apiGetCollectorProfiles(token) {
  return [requireSession_(token, 'collector').name];
}

function apiCreateCollector(token, payload) {
  const name = String(payload && payload.name || '').trim().replace(/\s+/g, ' ');
  const email = normalizeAccountEmail_(payload && payload.email);
  if (name.length < 3 || name.length > 100) throw new Error('Ingresa un nombre de 3 a 100 caracteres.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Ingresa un correo válido.');
  }
  return withScriptLock_(function () {
    const session = requireSession_(token, 'admin');
    const accounts = portalAccounts_();
    if (accounts.some(function (account) { return account.email === email; })) {
      throw new Error('Ya existe una cuenta con ese correo.');
    }
    if (accounts.some(function (account) { return normalizeHeader_(account.name) === normalizeHeader_(name); })) {
      throw new Error('Ya existe una cuenta con ese nombre. Usa nombres que permitan distinguir a cada persona.');
    }
    const url = collectorPortalUrl_();
    if (!url || url.indexOf('https://') !== 0) throw new Error('Publica primero el portal para enviar su enlace.');
    const properties = PropertiesService.getScriptProperties();
    const registryKey = 'ESPORA_COLLECTOR_ACCOUNTS';
    const previous = properties.getProperty(registryKey);
    const account = { slug: randomSecret_().slice(0, 24), name: name, email: email, role: 'collector' };
    const password = randomSecret_();
    const salt = randomSecret_();
    const hash = passwordHash_(password, salt);
    const temporarySaltKey = accountProperty_(account, 'TEMP_SALT');
    const temporaryHashKey = accountProperty_(account, 'TEMP_HASH');
    const mustChangeKey = accountProperty_(account, 'MUST_CHANGE');
    properties.setProperties({
      [temporarySaltKey]: salt,
      [temporaryHashKey]: hash,
      [mustChangeKey]: 'true',
      [registryKey]: JSON.stringify(accounts.filter(function (item) { return item.role === 'collector'; }).concat([account])),
    });
    try {
      MailApp.sendEmail({
        to: email,
        subject: 'Acceso al portal de aplicadores',
        body: 'Hola ' + name + ':\n\nTu acceso al portal de aplicadores está listo.\n'
          + 'Portal: ' + url + '\nCorreo: ' + email + '\nClave temporal: ' + password
          + '\n\nAl ingresar deberás crear una clave personal. No compartas esta clave.',
      });
    } catch (error) {
      properties.deleteProperty(temporarySaltKey);
      properties.deleteProperty(temporaryHashKey);
      properties.deleteProperty(mustChangeKey);
      if (previous === null) properties.deleteProperty(registryKey);
      else properties.setProperty(registryKey, previous);
      throw new Error('No se pudo enviar el correo; no se creó la cuenta. Comprueba los permisos y vuelve a intentar: ' + error.message);
    }
    audit_('Creación de aplicador', 'admin', session.name, '', '', '', email);
    return { name: name, email: email };
  });
}

function apiRevokeCollectorAccess(token) {
  return withScriptLock_(function () {
    const session = requireSession_(token, 'admin');
    const sheet = managedSheet_(ACCESS_SHEET, ACCESS_HEADERS);
    const values = sheet.getDataRange().getValues();
    const headers = headerMap_(values[0]);
    const revokedColumn = values.map(function (row) { return [row[headers['Revocada el']]]; });
    let revoked = 0;
    const now = new Date();
    for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      const row = values[rowIndex];
      if (row[headers.Rol] !== 'collector' || row[headers['Revocada el']]) continue;
      const expiresAt = row[headers['Expira el']];
      if (expiresAt instanceof Date && expiresAt.getTime() > now.getTime()) revoked += 1;
      revokedColumn[rowIndex] = [now];
    }
    if (values.length > 1) {
      sheet.getRange(2, headers['Revocada el'] + 1, values.length - 1, 1).setValues(revokedColumn.slice(1));
    }
    audit_('Cierre de sesiones del equipo', 'admin', session.name);
    return { revoked: revoked };
  });
}

function apiGetAdminData(token, date) {
  const selectedDate = validateDate_(date);
  requireSession_(token, 'admin');
  const loaded = loadPortfolio_();
  const evidence = readCaptureEvidence_(loaded.locals);
  const localByCode = {};
  loaded.locals.forEach(function (local) { localByCode[local.code] = local; });
  const portfolioByCode = {};
  const portfolio = loaded.portfolio.map(function (item) {
    const source = localByCode[item.code] || {};
    const enriched = Object.assign(withEvidence_(item, evidence), {
      category: source.category || '',
      subcategory: source.subcategory || '',
    });
    portfolioByCode[item.code] = enriched;
    return enriched;
  });
  return {
    collectors: collectors_(),
    instruments: INSTRUMENTS,
    locals: loaded.locals.map(function (local) {
      const assignment = portfolioByCode[local.code];
      return Object.assign({}, local, {
        suggestedCollector: assignment ? assignment.collector : '',
        territorialSector: '',
        portfolioStatus: assignment ? assignment.status : PORTFOLIO_UNASSIGNED,
        fieldStatus: assignment ? assignment.fieldStatus : 'Operativo',
        fieldNote: assignment ? assignment.fieldNote : '',
        fieldUpdatedAt: assignment ? assignment.fieldUpdatedAt : '',
        fieldUpdatedBy: assignment ? assignment.fieldUpdatedBy : '',
        requiredInstruments: assignment ? assignment.requiredInstruments : DEFAULT_REQUIRED_INSTRUMENTS.slice(),
        capture: assignment ? assignment.capture : null,
      });
    }),
    portfolio: portfolio,
    assignments: readAssignments_(selectedDate).filter(function (assignment) {
      return assignment.requestStatus !== 'Pendiente';
    }),
    proposals: readVisitProposals_(),
    date: selectedDate,
    capture: { available: evidence.available, message: evidence.message, timing: evidence.timing, statistics: evidence.statistics },
    operations: {
      overdueAssignments: readOverdueAssignments_(),
      consolidatedDecisionsSynced: isConsolidatedDecisionsSynced_(),
    },
    access: {
      accountsConfigured: portalAccounts_().filter(function (account) {
        return Boolean(PropertiesService.getScriptProperties().getProperty(accountProperty_(account, 'TEMP_HASH'))
          || PropertiesService.getScriptProperties().getProperty(accountProperty_(account, 'HASH')));
      }).length,
      accountCount: portalAccounts_().length,
      collectorUrl: collectorPortalUrl_(),
      digestEmail: String(PropertiesService.getScriptProperties().getProperty(ADMIN_DIGEST_EMAIL_PROPERTY) || '').trim(),
      digestTriggerInstalled: isProposalDigestTriggerInstalled_(),
    },
  };
}

function apiGetCollectorWorkspace(token, collector, date) {
  const session = requireCollectorSession_(token, collector);
  const name = session.name;
  const selectedDate = validateDate_(date);
  const evidence = readCaptureEvidence_();
  const portfolio = loadPortfolio_().portfolio
    .filter(function (item) { return item.collector === name; })
    .map(function (item) { return withEvidence_(item, evidence); });
  return {
    collector: name,
    instruments: INSTRUMENTS,
    portfolio: portfolio,
    assignments: readAssignments_(selectedDate).filter(function (assignment) {
      return assignment.collector === name && assignment.assignmentStatus === 'Activa'
        && assignment.requestStatus === 'Aprobada';
    }),
    proposals: readAssignments_('').filter(function (assignment) {
      return assignment.collector === name && assignment.requestOrigin === 'Propuesta del equipo';
    }).sort(function (a, b) { return b.createdAt - a.createdAt; }).slice(0, 30),
    date: selectedDate,
    capture: { available: evidence.available, message: evidence.message, url: CAPTURE_APP_URL },
  };
}

function apiGetCollectorPortfolio(token, collector) {
  return apiGetCollectorWorkspace(token, collector, todayKey_()).portfolio;
}

function apiMovePortfolioLocals(token, payload) {
  const request = payload || {};
  const codes = normalizeLocalCodes_(request.localCodes);
  const collector = String(request.collector || '').trim();
  if (collector && collectors_().indexOf(collector) < 0) {
    throw new Error('Selecciona un aplicador activo o deja los locales sin asignar.');
  }
  return withScriptLock_(function () {
    const session = requireSession_(token, 'admin');
    const status = collector ? PORTFOLIO_MANUAL : PORTFOLIO_UNASSIGNED;
    const moved = updatePortfolioRows_(codes, function (row, headers) {
      const previous = String(row[headers['Aplicador/a permanente']] || '');
      row[headers['Aplicador/a permanente']] = collector;
      row[headers['Estado de revisión']] = status;
      return previous;
    }, session.name);
    audit_(
      'Cartera: ' + codes.length + ' local(es) -> ' + (collector || 'Sin asignar') + ' (' + codes.join(', ') + ')',
      'admin',
      session.name
    );
    return { codes: codes, collector: collector, status: status, previous: moved };
  });
}

function apiUpdatePortfolioInstruments(token, payload) {
  const request = payload || {};
  const codes = normalizeLocalCodes_(request.localCodes);
  const selected = Array.isArray(request.instruments) ? request.instruments : [];
  const instruments = DEFAULT_REQUIRED_INSTRUMENTS.filter(function (id) { return selected.indexOf(id) >= 0; });
  if (!instruments.length) throw new Error('Cada local debe conservar al menos una pauta requerida.');
  return withScriptLock_(function () {
    const session = requireSession_(token, 'admin');
    updatePortfolioRows_(codes, function (row, headers) {
      row[headers['Instrumentos requeridos']] = JSON.stringify(instruments);
    }, session.name);
    audit_('Pautas de cartera: ' + codes.join(', ') + ' -> ' + instruments.join(', '), 'admin', session.name);
    return { codes: codes, instruments: instruments };
  });
}

function apiUpdatePortfolioFieldStatus(token, payload) {
  const request = payload || {};
  const rawCodes = Array.isArray(request.localCodes)
    ? request.localCodes
    : (request.localCode ? [request.localCode] : []);
  const codes = normalizeLocalCodes_(rawCodes);
  const fieldStatus = String(request.fieldStatus || '').trim();
  if (PORTFOLIO_FIELD_STATES.indexOf(fieldStatus) < 0) {
    throw new Error('Selecciona una condición en terreno válida (Operativo, Cerrado o Rechazo).');
  }
  const rawNote = String(request.fieldNote != null ? request.fieldNote : (request.note || '')).trim();
  if (rawNote.length > 300) {
    throw new Error('La observación de terreno debe tener 300 caracteres o menos.');
  }
  const fieldNote = fieldStatus === 'Operativo' && !rawNote ? '' : rawNote;
  return withScriptLock_(function () {
    const session = requireSession_(token);
    if (session.role !== 'admin' && session.role !== 'collector') {
      throw new Error('La sesión expiró o fue revocada. Ingresa nuevamente.');
    }
    if (session.role === 'collector') {
      const currentPortfolio = readTerritorialPortfolio_();
      const allowedByCode = {};
      currentPortfolio.forEach(function (item) {
        if (item.collector === session.name) allowedByCode[item.code] = true;
      });
      const unauthorized = codes.filter(function (code) { return !allowedByCode[code]; });
      if (unauthorized.length) {
        throw new Error('Solo puedes actualizar la condición en terreno de locales de tu propia cartera.');
      }
    }
    const updatedDate = todayKey_();
    const previousByCode = updatePortfolioRows_(codes, function (row, headers) {
      const previous = normalizePortfolioFieldStatus_(row[headers['Estado de terreno']]);
      row[headers['Estado de terreno']] = fieldStatus;
      row[headers['Observación de terreno']] = fieldNote;
      row[headers['Fecha estado de terreno']] = updatedDate;
      row[headers['Estado de terreno por']] = session.name;
      return previous;
    }, session.name);
    const previousList = codes.map(function (code) { return previousByCode[code] || 'Operativo'; });
    audit_(
      'Condición en terreno: ' + codes.join(', ') + ' -> ' + fieldStatus + (fieldNote ? ' (' + fieldNote + ')' : ''),
      session.role,
      session.name,
      codes.join(', '),
      'Estado de terreno',
      previousList.join(', '),
      fieldStatus
    );
    return {
      codes: codes,
      fieldStatus: fieldStatus,
      fieldNote: fieldNote,
      fieldUpdatedAt: updatedDate,
      fieldUpdatedBy: session.name,
      previous: previousByCode,
    };
  });
}

function apiSyncConsolidatedDecisions(token) {
  return withScriptLock_(function () {
    const session = requireSession_(token, 'admin');
    return applyConsolidatedFieldDecisions_(session.name);
  });
}

function syncConsolidatedFieldDecisions() {
  return withScriptLock_(function () {
    return applyConsolidatedFieldDecisions_('Coordinación');
  });
}

function apiUpdateTerritorialOwner(token, payload) {
  const request = payload || {};
  const result = apiMovePortfolioLocals(token, {
    localCodes: [request.localCode],
    collector: request.collector,
  });
  return { code: result.codes[0], collector: result.collector, status: result.status };
}

function apiCreateAssignment(token, payload) {
  const request = payload || {};
  const date = validateDate_(request.date);
  const localCode = String(request.localCode || '').trim().toUpperCase();
  const collector = String(request.collector || '').trim();
  const requestedInstruments = Array.isArray(request.instruments) ? request.instruments : [];
  const validInstrumentIds = INSTRUMENTS.map(function (item) { return item.id; });
  const instruments = validInstrumentIds.filter(function (id) { return requestedInstruments.indexOf(id) >= 0; });
  if (!localCode) throw new Error('Selecciona un local.');
  if (collectors_().indexOf(collector) < 0) throw new Error('Selecciona un aplicador válido.');
  if (!instruments.length) throw new Error('Selecciona al menos una pauta requerida para esta tarea.');

  return withScriptLock_(function () {
    const session = requireSession_(token, 'admin');
    const local = loadPortfolio_().locals.filter(function (item) { return item.code === localCode; })[0];
    if (!local) throw new Error('El local no aparece en la pestaña "Asignacion 107".');
    if (local.alert && request.confirmedLocation !== true) {
      throw new Error('Revisa y confirma la alerta territorial del local antes de asignarlo.');
    }
    const sheet = managedSheet_(ASSIGNMENTS_SHEET, SCHEDULE_HEADERS);
    const values = sheet.getDataRange().getValues();
    const headers = headerMap_(values[0]);
    const timezone = managementSpreadsheet_().getSpreadsheetTimeZone();
    for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      const row = values[rowIndex];
      if (spreadsheetDateKey_(row[headers.Fecha], timezone) === date
        && String(row[headers['Código local']]).toUpperCase() === localCode
        && String(row[headers['Estado asignación']] || 'Activa') !== 'Cancelada') {
        throw new Error('Este local ya tiene una asignación para esa fecha. Abre la tarea existente o elige otra fecha.');
      }
    }
    const now = new Date();
    const required = {};
    INSTRUMENTS.forEach(function (item) {
      required[item.id] = instruments.indexOf(item.id) >= 0;
    });
    const assignmentId = randomId_();
    sheet.appendRow([
      assignmentId, date, local.code, local.name, local.address, local.category,
      local.uv, local.sector, local.alert, collector, JSON.stringify(instruments),
      required.classification ? 'Pendiente' : 'No requerido',
      required.availability ? 'Pendiente' : 'No requerido',
      required.origins ? 'Pendiente' : 'No requerido',
      required.prices ? 'Pendiente' : 'No requerido',
      '{}', 'Activa', '', session.name, now, now,
      'Aprobada', '', '', '', 'Programada por administración',
    ]);
    audit_('Creación de asignación', 'admin', session.name, assignmentId);
    return { id: assignmentId, localName: local.name, collector: collector };
  });
}

function apiCreateVisitProposal(token, collector, payload) {
  const session = requireCollectorSession_(token, collector);
  const name = session.name;
  const request = payload || {};
  const date = validateFutureDate_(request.date);
  const time = validateProposedTime_(request.time);
  const localCode = String(request.localCode || '').trim().toUpperCase();
  const note = String(request.note || '').trim();
  if (!localCode) throw new Error('Selecciona un local de tu cartera.');
  if (note.length > 300) throw new Error('La nota debe tener 300 caracteres o menos.');
  const portfolioItem = loadPortfolio_().portfolio.filter(function (item) {
    return item.code === localCode && item.collector === name;
  })[0];
  if (!portfolioItem) throw new Error('Solo puedes proponer visitas para locales de tu cartera.');

  return withScriptLock_(function () {
    requireCollectorSession_(token, name);
    const local = readTerritorialPortfolio_().filter(function (item) {
      return item.code === localCode && item.collector === name;
    })[0];
    if (!local) throw new Error('Solo puedes proponer visitas para locales de tu cartera.');
    const sheet = managedSheet_(ASSIGNMENTS_SHEET, SCHEDULE_HEADERS);
    const values = sheet.getDataRange().getValues();
    const headers = headerMap_(SCHEDULE_HEADERS);
    const timezone = managementSpreadsheet_().getSpreadsheetTimeZone();
    for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      const row = values[rowIndex];
      if (spreadsheetDateKey_(row[headers.Fecha], timezone) === date
        && String(row[headers['Código local']]).toUpperCase() === localCode
        && String(row[headers['Estado asignación']] || 'Activa') !== 'Cancelada') {
        throw new Error('Este local ya tiene una visita propuesta o programada para esa fecha.');
      }
    }
    const now = new Date();
    const required = local.requiredInstruments;
    const statusByInstrument = {};
    INSTRUMENTS.forEach(function (instrument) {
      statusByInstrument[instrument.id] = required.indexOf(instrument.id) >= 0 ? 'Pendiente' : 'No requerido';
    });
    const id = randomId_();
    sheet.appendRow([
      id, date, local.code, local.name, local.address, '', '', '', '', name,
      JSON.stringify(required),
      statusByInstrument.classification, statusByInstrument.availability,
      statusByInstrument.origins, statusByInstrument.prices, '{}', 'Activa', '',
      name, now, now, 'Pendiente', time, note, '', 'Propuesta del equipo',
    ]);
    audit_('Propuesta de visita', 'collector', name, id);
    return { id: id, date: date, time: time, localCode: local.code, localName: local.name };
  });
}

function apiRespondToVisitProposal(token, payload) {
  const request = payload || {};
  const id = String(request.assignmentId || '').trim();
  const decision = String(request.decision || '').trim();
  const reason = String(request.reason || '').trim();
  if (!id) throw new Error('No se identificó la propuesta.');
  if (['approve', 'reschedule', 'reject'].indexOf(decision) < 0) throw new Error('Selecciona una respuesta válida.');
  if (decision === 'reject' && !reason) throw new Error('Indica el motivo del rechazo.');
  if (reason.length > 300) throw new Error('El motivo debe tener 300 caracteres o menos.');
  const date = decision === 'reschedule' ? validateFutureDate_(request.date) : '';
  const time = decision === 'reschedule' ? validateProposedTime_(request.time) : '';

  return withScriptLock_(function () {
    const session = requireSession_(token, 'admin');
    const sheet = managedSheet_(ASSIGNMENTS_SHEET, SCHEDULE_HEADERS);
    const values = sheet.getDataRange().getValues();
    const headers = headerMap_(SCHEDULE_HEADERS);
    const rowIndex = values.findIndex(function (row, index) {
      return index > 0 && String(row[headers['ID asignación']]) === id;
    });
    if (rowIndex < 1) throw new Error('La propuesta ya no existe. Actualiza la lista.');
    const row = values[rowIndex];
    if (String(row[headers['Estado de solicitud']]) !== 'Pendiente') {
      throw new Error('La propuesta ya fue respondida. Actualiza la lista.');
    }
    if (String(row[headers['Estado asignación']] || 'Activa') !== 'Activa') {
      throw new Error('La propuesta fue cancelada y ya no se puede responder.');
    }
    if (decision !== 'reject') {
      const portfolioItem = readTerritorialPortfolio_().filter(function (item) {
        return item.code === String(row[headers['Código local']]).toUpperCase();
      })[0];
      if (!portfolioItem || portfolioItem.collector !== String(row[headers['Aplicador/a']])) {
        throw new Error('El responsable de este local cambió desde que se envió la propuesta. Revisa la cartera antes de aprobar.');
      }
    }
    const timezone = managementSpreadsheet_().getSpreadsheetTimeZone();
    const targetDate = decision === 'reject'
      ? ''
      : validateFutureDate_(date || spreadsheetDateKey_(row[headers.Fecha], timezone));
    const targetCode = String(row[headers['Código local']]).toUpperCase();
    if (decision !== 'reject') {
      for (let otherIndex = 1; otherIndex < values.length; otherIndex += 1) {
        if (otherIndex === rowIndex) continue;
        const other = values[otherIndex];
        if (spreadsheetDateKey_(other[headers.Fecha], timezone) === targetDate
          && String(other[headers['Código local']]).toUpperCase() === targetCode
          && String(other[headers['Estado asignación']] || 'Activa') !== 'Cancelada') {
          throw new Error('Ese local ya tiene otra visita propuesta o programada para la fecha elegida.');
        }
      }
      sheet.getRange(rowIndex + 1, headers.Fecha + 1).setValue(targetDate);
      if (decision === 'reschedule') {
        sheet.getRange(rowIndex + 1, headers['Hora propuesta'] + 1).setValue(time);
      }
      sheet.getRange(rowIndex + 1, headers['Estado de solicitud'] + 1).setValue('Aprobada');
      sheet.getRange(rowIndex + 1, headers['Motivo de respuesta'] + 1)
        .setValue(decision === 'reschedule' ? (reason || 'Reprogramada por administración') : '');
      sheet.getRange(rowIndex + 1, headers['Actualizada el'] + 1).setValue(new Date());
      audit_(decision === 'reschedule' ? 'Propuesta reprogramada y aprobada' : 'Propuesta aprobada',
        'admin', session.name, id);
      return { id: id, decision: decision, date: targetDate };
    }
    sheet.getRange(rowIndex + 1, headers['Estado de solicitud'] + 1).setValue('Rechazada');
    sheet.getRange(rowIndex + 1, headers['Estado asignación'] + 1).setValue('Cancelada');
    sheet.getRange(rowIndex + 1, headers['Motivo cancelación'] + 1).setValue(reason);
    sheet.getRange(rowIndex + 1, headers['Motivo de respuesta'] + 1).setValue(reason);
    sheet.getRange(rowIndex + 1, headers['Actualizada el'] + 1).setValue(new Date());
    audit_('Propuesta rechazada', 'admin', session.name, id);
    return { id: id, decision: decision };
  });
}

function apiSaveAdminDigestEmail(token, email) {
  requireSession_(token, 'admin');
  const value = String(email || '').trim();
  if (value && (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
    throw new Error('Escribe un correo electrónico válido o deja el campo vacío para desactivarlo.');
  }
  PropertiesService.getScriptProperties().setProperty(ADMIN_DIGEST_EMAIL_PROPERTY, value);
  if (!value) removeProposalDigestTriggers_();
  audit_('Correo de resumen diario actualizado', 'admin', 'Administración');
  return { email: value, enabled: Boolean(value), triggerInstalled: isProposalDigestTriggerInstalled_() };
}

function setupDailyProposalDigest() {
  const email = String(PropertiesService.getScriptProperties().getProperty(ADMIN_DIGEST_EMAIL_PROPERTY) || '').trim();
  if (!email) throw new Error('Primero configura el correo de resumen en el portal de administración.');
  if (ScriptApp.requireScopes) ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, [EMAIL_SEND_SCOPE]);
  MailApp.getRemainingDailyQuota();
  const timezone = managementSpreadsheet_().getSpreadsheetTimeZone() || 'America/Santiago';
  removeProposalDigestTriggers_();
  ScriptApp.newTrigger(PROPOSAL_DIGEST_HANDLER).timeBased().everyDays(1).atHour(8).inTimezone(timezone).create();
  Logger.log('Resumen diario de ESPORA configurado para las 08:00 (' + timezone + ') y ' + email + '.');
}

function removeProposalDigestTriggers_() {
  if (typeof ScriptApp === 'undefined' || !ScriptApp.getProjectTriggers) return;
  ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === PROPOSAL_DIGEST_HANDLER;
  }).forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });
}

function isProposalDigestTriggerInstalled_() {
  if (typeof ScriptApp === 'undefined' || !ScriptApp.getProjectTriggers) return false;
  return ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === PROPOSAL_DIGEST_HANDLER;
  });
}

function sendDailyProposalDigest() {
  const email = String(PropertiesService.getScriptProperties().getProperty(ADMIN_DIGEST_EMAIL_PROPERTY) || '').trim();
  if (!email) {
    Logger.log('Resumen diario omitido: falta configurar ' + ADMIN_DIGEST_EMAIL_PROPERTY + '.');
    return;
  }
  const spreadsheet = managementSpreadsheet_();
  const timezone = spreadsheet.getSpreadsheetTimeZone() || 'America/Santiago';
  const today = Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd');
  const proposals = readVisitProposals_();
  const todayAssignments = readAssignments_(today).filter(function (item) {
    return item.assignmentStatus === 'Activa' && item.requestStatus === 'Aprobada';
  });
  if (!proposals.length && !todayAssignments.length) {
    Logger.log('Resumen diario omitido: no hay propuestas pendientes ni visitas programadas para hoy.');
    return;
  }
  const lines = ['ESPORA · Resumen diario de terreno', 'Fecha: ' + today, ''];
  if (proposals.length) {
    lines.push('PROPUESTAS PENDIENTES (' + proposals.length + ')');
    proposals.forEach(function (item) {
      lines.push('- ' + item.date + (item.proposedTime ? ' ' + item.proposedTime : '')
        + ' · ' + item.localCode + ' · ' + item.localName + ' · ' + item.collector
        + (item.requestNote ? ' · Nota: ' + item.requestNote : ''));
    });
    lines.push('');
  }
  if (todayAssignments.length) {
    lines.push('VISITAS DE HOY (' + todayAssignments.length + ')');
    todayAssignments.forEach(function (item) {
      lines.push('- ' + item.localCode + ' · ' + item.localName + ' · ' + item.collector
        + (item.proposedTime ? ' · ' + item.proposedTime : ''));
    });
  }
  MailApp.sendEmail({
    to: email,
    subject: 'ESPORA · Terreno ' + today + (proposals.length ? ' · ' + proposals.length + ' propuesta(s)' : ''),
    body: lines.join('\n'),
  });
}

function apiUpdateAssignment(token, payload) {
  const request = payload || {};
  const assignmentId = String(request.assignmentId || '').trim();
  const date = validateDate_(request.date);
  const collector = String(request.collector || '').trim();
  const selected = Array.isArray(request.instruments) ? request.instruments : [];
  const instruments = INSTRUMENTS.map(function (instrument) { return instrument.id; })
    .filter(function (id) { return selected.indexOf(id) >= 0; });
  if (!assignmentId) throw new Error('No se identificó la asignación.');
  if (collectors_().indexOf(collector) < 0) throw new Error('Selecciona un aplicador válido.');
  if (!instruments.length) throw new Error('La asignación debe conservar al menos una pauta requerida.');

  return withScriptLock_(function () {
    const session = requireSession_(token, 'admin');
    const sheet = managedSheet_(ASSIGNMENTS_SHEET, SCHEDULE_HEADERS);
    const values = sheet.getDataRange().getValues();
    const headers = headerMap_(values[0]);
    const timezone = managementSpreadsheet_().getSpreadsheetTimeZone();
    const targetIndex = values.findIndex(function (row, index) {
      return index > 0 && String(row[headers['ID asignación']]) === assignmentId;
    });
    if (targetIndex < 1) throw new Error('La asignación no existe. Actualiza la lista.');
    const row = values[targetIndex];
    if (String(row[headers['Estado de solicitud']] || 'Aprobada') === 'Pendiente') {
      throw new Error('Responde la propuesta desde "Propuestas por revisar".');
    }
    if (String(row[headers['Estado asignación']] || 'Activa') === 'Cancelada') {
      throw new Error('La asignación está cancelada y no se puede editar.');
    }
    for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      if (rowIndex === targetIndex) continue;
      const other = values[rowIndex];
      if (spreadsheetDateKey_(other[headers.Fecha], timezone) === date
        && String(other[headers['Código local']]).toUpperCase() === String(row[headers['Código local']]).toUpperCase()
        && String(other[headers['Estado asignación']] || 'Activa') !== 'Cancelada') {
        throw new Error('Ese local ya tiene otra asignación activa para la fecha elegida.');
      }
    }

    const oldCollector = String(row[headers['Aplicador/a']]);
    const oldDate = spreadsheetDateKey_(row[headers.Fecha], timezone);
    const previousRequired = parseJsonArray_(row[headers['Instrumentos requeridos']]);
    const details = parseJsonObject_(row[headers['Detalle de estado']]);
    const statusHeaders = {
      classification: 'Estado: Clasificación',
      availability: 'Estado: Disponibilidad',
      origins: 'Estado: Origen',
      prices: 'Estado: Precios',
    };
    INSTRUMENTS.forEach(function (instrument) {
      const wasRequired = previousRequired.indexOf(instrument.id) >= 0;
      const isRequired = instruments.indexOf(instrument.id) >= 0;
      if (wasRequired && !isRequired) {
        sheet.getRange(targetIndex + 1, headers[statusHeaders[instrument.id]] + 1).setValue('No requerido');
        delete details[instrument.id];
      } else if (!wasRequired && isRequired) {
        sheet.getRange(targetIndex + 1, headers[statusHeaders[instrument.id]] + 1).setValue('Pendiente');
      }
    });
    sheet.getRange(targetIndex + 1, headers.Fecha + 1).setValue(date);
    sheet.getRange(targetIndex + 1, headers['Aplicador/a'] + 1).setValue(collector);
    sheet.getRange(targetIndex + 1, headers['Instrumentos requeridos'] + 1).setValue(JSON.stringify(instruments));
    sheet.getRange(targetIndex + 1, headers['Detalle de estado'] + 1).setValue(JSON.stringify(details));
    sheet.getRange(targetIndex + 1, headers['Actualizada el'] + 1).setValue(new Date());
    audit_('Edición de asignación', 'admin', session.name, assignmentId);
    if (oldCollector !== collector || oldDate !== date) {
      audit_('Cambio de responsable o fecha', 'admin', session.name, assignmentId);
    }
    return { id: assignmentId, collector: collector, date: date };
  });
}

function apiCancelAssignment(token, payload) {
  const request = payload || {};
  const assignmentId = String(request.assignmentId || '').trim();
  const reason = String(request.reason || '').trim();
  if (!assignmentId) throw new Error('No se identificó la asignación.');
  if (!reason) throw new Error('Escribe el motivo de la cancelación.');
  if (reason.length > 300) throw new Error('El motivo debe tener 300 caracteres o menos.');
  return withScriptLock_(function () {
    const session = requireSession_(token, 'admin');
    const sheet = managedSheet_(ASSIGNMENTS_SHEET, SCHEDULE_HEADERS);
    const values = sheet.getDataRange().getValues();
    const headers = headerMap_(values[0]);
    const rowIndex = values.findIndex(function (row, index) {
      return index > 0 && String(row[headers['ID asignación']]) === assignmentId;
    });
    if (rowIndex < 1) throw new Error('La asignación no existe. Actualiza la lista.');
    if (String(values[rowIndex][headers['Estado asignación']] || 'Activa') === 'Cancelada') {
      throw new Error('La asignación ya está cancelada.');
    }
    if (String(values[rowIndex][headers['Estado de solicitud']] || 'Aprobada') === 'Pendiente') {
      throw new Error('Responde la propuesta desde "Propuestas por revisar".');
    }
    sheet.getRange(rowIndex + 1, headers['Estado asignación'] + 1).setValue('Cancelada');
    sheet.getRange(rowIndex + 1, headers['Motivo cancelación'] + 1).setValue(reason);
    sheet.getRange(rowIndex + 1, headers['Actualizada el'] + 1).setValue(new Date());
    audit_('Cancelación de asignación', 'admin', session.name, assignmentId);
    return { id: assignmentId };
  });
}

function apiGetCollectorAssignments(token, collector, date) {
  const session = requireCollectorSession_(token, collector);
  const name = session.name;
  const selectedDate = validateDate_(date);
  return {
    date: selectedDate,
    assignments: readAssignments_(selectedDate).filter(function (assignment) {
      return assignment.collector === name && assignment.assignmentStatus === 'Activa'
        && assignment.requestStatus === 'Aprobada';
    }),
  };
}

function apiUpdateInstrumentStatus(token, payload) {
  const request = payload || {};
  const session = requireCollectorSession_(token, request.collector);
  const collector = session.name;
  const assignmentId = String(request.assignmentId || '').trim();
  const instrumentId = String(request.instrumentId || '').trim();
  const status = String(request.status || '').trim();
  const reason = String(request.reason || '').trim();
  if (!assignmentId) throw new Error('No se identificó la tarea.');
  if (!INSTRUMENTS.some(function (instrument) { return instrument.id === instrumentId; })) {
    throw new Error('La pauta indicada no es válida.');
  }
  if (INSTRUMENT_STATES.indexOf(status) < 0) throw new Error('Selecciona un estado válido.');
  if ((status === 'Bloqueado' || status === 'No aplica') && !reason) {
    throw new Error('Indica el motivo para este estado.');
  }
  if (reason.length > 300) throw new Error('El motivo debe tener 300 caracteres o menos.');

  return withScriptLock_(function () {
    requireCollectorSession_(token, collector);
    const sheet = managedSheet_(ASSIGNMENTS_SHEET, SCHEDULE_HEADERS);
    const values = sheet.getDataRange().getValues();
    const headers = headerMap_(values[0]);
    const statusHeader = {
      classification: 'Estado: Clasificación',
      availability: 'Estado: Disponibilidad',
      origins: 'Estado: Origen',
      prices: 'Estado: Precios',
    }[instrumentId];
    for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      const row = values[rowIndex];
      if (String(row[headers['ID asignación']]) !== assignmentId) continue;
      if (String(row[headers['Aplicador/a']]) !== collector) {
        throw new Error('Esta tarea está asignada a otra persona. Revisa el perfil seleccionado.');
      }
      if (String(row[headers['Estado asignación']] || 'Activa') !== 'Activa') {
        throw new Error('La asignación está cancelada y ya no admite cambios.');
      }
      if (String(row[headers['Estado de solicitud']] || 'Aprobada') !== 'Aprobada') {
        throw new Error('La propuesta debe ser aprobada antes de actualizar sus pautas.');
      }
      const required = parseJsonArray_(row[headers['Instrumentos requeridos']]);
      if (required.indexOf(instrumentId) < 0) throw new Error('Esta pauta no forma parte de la asignación.');
      const previousStatus = String(row[headers[statusHeader]] || 'Pendiente');
      const details = parseJsonObject_(row[headers['Detalle de estado']]);
      if (reason) details[instrumentId] = reason;
      else delete details[instrumentId];
      const sheetRow = rowIndex + 1;
      sheet.getRange(sheetRow, headers[statusHeader] + 1).setValue(status);
      sheet.getRange(sheetRow, headers['Detalle de estado'] + 1).setValue(JSON.stringify(details));
      sheet.getRange(sheetRow, headers['Actualizada el'] + 1).setValue(new Date());
      audit_('Cambio de estado', 'collector', collector, assignmentId, instrumentId, previousStatus, status);
      return { status: status, reason: reason };
    }
    throw new Error('La asignación ya no existe. Actualiza la lista o contacta a administración.');
  });
}

function apiLogout(token) {
  const session = findSession_(token);
  if (!session) return true;
  return withScriptLock_(function () {
    const sheet = managedSheet_(ACCESS_SHEET, ACCESS_HEADERS);
    const values = sheet.getDataRange().getValues();
    const headers = headerMap_(values[0]);
    const targetHash = hashSecret_(String(token || ''));
    for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      const row = values[rowIndex];
      if (row[headers.Tipo] === 'SESSION' && row[headers.Hash] === targetHash && !row[headers['Revocada el']]) {
        sheet.getRange(rowIndex + 1, headers['Revocada el'] + 1).setValue(new Date());
        audit_('Cierre de sesión', session.role, session.name);
        break;
      }
    }
    return true;
  });
}

function managementSpreadsheet_() {
  if (!MANAGEMENT_SPREADSHEET_ID) throw new Error('Configura el ID de una planilla nueva de gestión antes de continuar.');
  return SpreadsheetApp.openById(MANAGEMENT_SPREADSHEET_ID);
}

function ensureManagedSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  const firstRow = sheet.getLastColumn()
    ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getDisplayValues()[0]
    : [];
  if (!firstRow.some(function (cell) { return String(cell).trim(); }) && sheet.getLastRow() <= 1) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  assertHeaders_(sheet, headers);
  return sheet;
}

function ensureAccessSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(ACCESS_SHEET);
  if (!sheet) return ensureManagedSheet_(spreadsheet, ACCESS_SHEET, ACCESS_HEADERS);
  const actual = sheet.getLastColumn()
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
    : [];
  if (!actual.some(function (header) { return String(header).trim(); }) && sheet.getLastRow() <= 1) {
    sheet.getRange(1, 1, 1, ACCESS_HEADERS.length).setValues([ACCESS_HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  if (actual.length > ACCESS_HEADERS.length
    || actual.some(function (header, index) { return header !== ACCESS_HEADERS[index]; })
    || ACCESS_HEADERS.slice(0, 9).some(function (header, index) { return actual[index] !== header; })) {
    throw new Error('La estructura de la pestaña "' + ACCESS_SHEET + '" no coincide con el portal. No se hicieron cambios.');
  }
  if (actual.length < ACCESS_HEADERS.length) {
    sheet.getRange(1, actual.length + 1, 1, ACCESS_HEADERS.length - actual.length)
      .setValues([ACCESS_HEADERS.slice(actual.length)]);
  }
  return sheet;
}

function ensureAssignmentSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(ASSIGNMENTS_SHEET);
  if (!sheet) return ensureManagedSheet_(spreadsheet, ASSIGNMENTS_SHEET, SCHEDULE_HEADERS);
  const lastColumn = sheet.getLastColumn();
  const actual = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0] : [];
  if (actual.length === SCHEDULE_HEADERS.length &&
      SCHEDULE_HEADERS.every(function (header, index) { return actual[index] === header; })) return sheet;
  if (actual.length !== LEGACY_SCHEDULE_HEADERS.length ||
      LEGACY_SCHEDULE_HEADERS.some(function (header, index) { return actual[index] !== header; })) {
    throw new Error('La estructura de "Portal Asignaciones" no coincide con el formato anterior esperado. No se hicieron cambios.');
  }
  sheet.getRange(1, LEGACY_SCHEDULE_HEADERS.length + 1, 1,
    SCHEDULE_HEADERS.length - LEGACY_SCHEDULE_HEADERS.length)
    .setValues([SCHEDULE_HEADERS.slice(LEGACY_SCHEDULE_HEADERS.length)]);
  const rowCount = Math.max(0, sheet.getLastRow() - 1);
  if (rowCount) {
    const defaults = Array.from({ length: rowCount }, function () {
      return ['Aprobada', '', '', '', 'Programada por administración'];
    });
    sheet.getRange(2, LEGACY_SCHEDULE_HEADERS.length + 1, rowCount,
      SCHEDULE_HEADERS.length - LEGACY_SCHEDULE_HEADERS.length).setValues(defaults);
  }
  sheet.setFrozenRows(1);
  return sheet;
}

function managedSheet_(name, headers) {
  const spreadsheet = managementSpreadsheet_();
  let sheet = name === ACCESS_SHEET
    ? ensureAccessSheet_(spreadsheet)
    : spreadsheet.getSheetByName(name);
  if (sheet && name === PORTFOLIO_SHEET && sheet.getLastColumn() < PORTFOLIO_HEADERS.length) {
    sheet = ensurePortfolioSheet_(spreadsheet);
  }
  if (!sheet) throw new Error('Falta la pestaña "' + name + '". Ejecuta setupManagementPortal() en el editor de Apps Script.');
  assertHeaders_(sheet, headers);
  return sheet;
}

function assertHeaders_(sheet, expectedHeaders) {
  if (sheet.getLastColumn() !== expectedHeaders.length) {
    throw new Error('La pestaña "' + sheet.getName() + '" tiene un número de columnas distinto al esperado. No se hicieron cambios.');
  }
  const actual = sheet.getRange(1, 1, 1, expectedHeaders.length).getDisplayValues()[0];
  if (expectedHeaders.some(function (header, index) { return actual[index] !== header; })) {
    throw new Error('La estructura de la pestaña "' + sheet.getName() + '" no coincide con el portal. No se hicieron cambios.');
  }
}

function sourceColumns_(sheet) {
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const normalized = headerRow.map(normalizeHeader_);
  const required = {
    code: ['codigo local'],
    name: ['nombre del establecimiento'],
    category: ['categoria criterion'],
    subcategory: ['subcategoria criterion2'],
    address: ['direccion registrada'],
  };
  const indices = {};
  Object.keys(required).forEach(function (key) {
    const index = normalized.indexOf(required[key][0]);
    if (index < 0) throw new Error('La pestaña "' + LOCAL_SOURCE_SHEET + '" no tiene el encabezado requerido: ' + required[key][0] + '.');
    indices[key] = index;
  });
  return { headers: headerRow, indices: indices };
}

function isConsolidatedDecisionsSynced_() {
  if (typeof PropertiesService === 'undefined' || !PropertiesService.getScriptProperties) return false;
  return PropertiesService.getScriptProperties().getProperty(CONSOLIDATED_SYNC_PROPERTY) === 'true';
}

function canonicalLocalCode_(value) {
  const code = String(value || '').trim().toUpperCase();
  return HOMOLOGATED_LOCAL_CODES[code] || code;
}

function extraLocalMetadataByCode_() {
  const map = {};
  CONSOLIDATED_EXTRA_LOCALS.forEach(function (item) {
    map[item.code] = item;
  });
  return map;
}

function defaultInstrumentsForCategory_(category, code) {
  const override = CONSOLIDATED_LOCAL_OVERRIDES[code];
  if (override && Array.isArray(override.requiredInstruments)) {
    return override.requiredInstruments.slice();
  }
  const extra = extraLocalMetadataByCode_()[code];
  if (extra && Array.isArray(extra.requiredInstruments)) {
    return extra.requiredInstruments.slice();
  }
  const normalized = normalizeHeader_(category);
  if (!normalized || /almacen|minimarket|local de barrio/.test(normalized)) {
    return DEFAULT_REQUIRED_INSTRUMENTS.slice();
  }
  return NON_AM_REQUIRED_INSTRUMENTS.slice();
}

function readLocals_() {
  const sheet = managementSpreadsheet_().getSheetByName(LOCAL_SOURCE_SHEET);
  if (!sheet) throw new Error('Falta la pestaña del padrón. Ejecuta setupManagementPortal().');
  if (sheet.getLastRow() < 2) return [];
  const source = sourceColumns_(sheet);
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getDisplayValues();
  const useConsolidated = isConsolidatedDecisionsSynced_();
  return values.map(function (row) {
    const code = String(row[source.indices.code] || '').trim().toUpperCase();
    const override = useConsolidated ? CONSOLIDATED_LOCAL_OVERRIDES[code] : null;
    return {
      code: code,
      name: String((override && override.name) || row[source.indices.name] || '').trim(),
      category: String((override && override.category) || row[source.indices.category] || '').trim(),
      subcategory: String(
        override && override.subcategory !== undefined ? override.subcategory : (row[source.indices.subcategory] || '')
      ).trim(),
      address: String((override && override.address) || row[source.indices.address] || '').trim(),
      uv: '',
      sector: '',
      alert: '',
    };
  }).filter(function (local) { return local.code && local.name; });
}

function loadPortfolio_() {
  const baseLocals = readLocals_();
  let portfolio = tryReadPortfolio_();
  if (!portfolio || portfolioNeedsSync_(portfolio, baseLocals)) {
    withScriptLock_(function () {
      ensurePortfolioSheet_(managementSpreadsheet_());
      syncTerritorialPortfolio_(baseLocals);
    });
    portfolio = readTerritorialPortfolio_();
  }
  const baseCodes = {};
  baseLocals.forEach(function (local) { baseCodes[local.code] = true; });
  const activeByCode = {};
  portfolio.forEach(function (item) { activeByCode[item.code] = item; });
  const locals = baseLocals.slice();
  const activePortfolio = baseLocals.map(function (local) { return activeByCode[local.code]; }).filter(Boolean);
  if (isConsolidatedDecisionsSynced_()) {
    const extraMeta = extraLocalMetadataByCode_();
    portfolio.forEach(function (item) {
      if (baseCodes[item.code]) return;
      const meta = extraMeta[item.code];
      locals.push({
        code: item.code,
        name: item.name,
        category: (meta && meta.category) || 'Local incorporado en terreno',
        subcategory: (meta && meta.subcategory) || '',
        address: item.address,
        uv: '',
        sector: '',
        alert: '',
      });
      activePortfolio.push(item);
    });
  }
  return {
    locals: locals,
    portfolio: activePortfolio,
  };
}

function tryReadPortfolio_() {
  const sheet = managementSpreadsheet_().getSheetByName(PORTFOLIO_SHEET);
  if (!sheet || sheet.getLastColumn() !== PORTFOLIO_HEADERS.length) return null;
  const actual = sheet.getRange(1, 1, 1, PORTFOLIO_HEADERS.length).getDisplayValues()[0];
  if (PORTFOLIO_HEADERS.some(function (header, index) { return actual[index] !== header; })) return null;
  return readTerritorialPortfolio_();
}

function portfolioNeedsSync_(portfolio, locals) {
  const byCode = {};
  portfolio.forEach(function (item) { byCode[item.code] = item; });
  return locals.some(function (local) {
    const item = byCode[local.code];
    return !item || item.name !== local.name || item.address !== local.address
      || item.sector !== '';
  });
}

// Adds newer portfolio columns to existing 8-column or 9-column sheets without touching existing row data.
function ensurePortfolioSheet_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(PORTFOLIO_SHEET);
  if (sheet && sheet.getLastColumn() === LEGACY_PORTFOLIO_HEADERS.length) {
    const actual = sheet.getRange(1, 1, 1, LEGACY_PORTFOLIO_HEADERS.length).getDisplayValues()[0];
    if (LEGACY_PORTFOLIO_HEADERS.every(function (header, index) { return actual[index] === header; })) {
      const column = V2_PORTFOLIO_HEADERS.length;
      sheet.getRange(1, column).setValue(V2_PORTFOLIO_HEADERS[column - 1]);
      if (sheet.getLastRow() > 1) {
        const defaults = [];
        for (let row = 2; row <= sheet.getLastRow(); row += 1) defaults.push([JSON.stringify(DEFAULT_REQUIRED_INSTRUMENTS)]);
        sheet.getRange(2, column, defaults.length, 1).setValues(defaults);
      }
    }
  }
  if (sheet && sheet.getLastColumn() === V2_PORTFOLIO_HEADERS.length) {
    const actual = sheet.getRange(1, 1, 1, V2_PORTFOLIO_HEADERS.length).getDisplayValues()[0];
    if (V2_PORTFOLIO_HEADERS.every(function (header, index) { return actual[index] === header; })) {
      const extraHeaders = PORTFOLIO_HEADERS.slice(V2_PORTFOLIO_HEADERS.length);
      sheet.getRange(1, V2_PORTFOLIO_HEADERS.length + 1, 1, extraHeaders.length).setValues([extraHeaders]);
      if (sheet.getLastRow() > 1) {
        const defaults = [];
        for (let row = 2; row <= sheet.getLastRow(); row += 1) defaults.push(['Operativo', '', '', '']);
        sheet.getRange(2, V2_PORTFOLIO_HEADERS.length + 1, defaults.length, extraHeaders.length).setValues(defaults);
      }
    }
  }
  return ensureManagedSheet_(spreadsheet, PORTFOLIO_SHEET, PORTFOLIO_HEADERS);
}

function syncTerritorialPortfolio_(locals) {
  const sheet = managedSheet_(PORTFOLIO_SHEET, PORTFOLIO_HEADERS);
  const headers = headerMap_(PORTFOLIO_HEADERS);
  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  const rows = rowCount ? sheet.getRange(2, 1, rowCount, PORTFOLIO_HEADERS.length).getValues() : [];
  const indexByCode = {};
  rows.forEach(function (row, index) {
    const code = String(row[headers['Código local']] || '').trim().toUpperCase();
    if (code) indexByCode[code] = index;
  });
  let changed = false;
  const appended = [];
  (locals || readLocals_()).forEach(function (local) {
    const index = indexByCode[local.code];
    if (index === undefined) {
      appended.push([
        local.code, local.name, local.address, '',
        '', PORTFOLIO_UNASSIGNED, new Date(), 'Sistema', JSON.stringify(DEFAULT_REQUIRED_INSTRUMENTS),
        'Operativo', '', '', '',
      ]);
      return;
    }
    const row = rows[index];
    [['Nombre local', local.name], ['Dirección', local.address], ['Sector territorial', '']]
      .forEach(function (pair) {
        if (String(row[headers[pair[0]]] || '').trim() !== pair[1]) {
          row[headers[pair[0]]] = pair[1];
          changed = true;
        }
      });
    if (!String(row[headers['Instrumentos requeridos']] || '').trim()) {
      row[headers['Instrumentos requeridos']] = JSON.stringify(DEFAULT_REQUIRED_INSTRUMENTS);
      changed = true;
    }
    const currentFieldStatus = String(row[headers['Estado de terreno']] || '').trim();
    const normalizedFieldStatus = normalizePortfolioFieldStatus_(currentFieldStatus);
    if (currentFieldStatus !== normalizedFieldStatus) {
      row[headers['Estado de terreno']] = normalizedFieldStatus;
      changed = true;
    }
  });
  if (changed) sheet.getRange(2, 1, rows.length, PORTFOLIO_HEADERS.length).setValues(rows);
  if (appended.length) {
    sheet.getRange(rows.length + 2, 1, appended.length, PORTFOLIO_HEADERS.length).setValues(appended);
  }
}

function normalizePortfolioFieldStatus_(value) {
  const text = String(value || '').trim();
  return PORTFOLIO_FIELD_STATES.indexOf(text) >= 0 ? text : 'Operativo';
}

function readTerritorialPortfolio_() {
  const sheet = managedSheet_(PORTFOLIO_SHEET, PORTFOLIO_HEADERS);
  if (sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, PORTFOLIO_HEADERS.length).getDisplayValues();
  const headers = headerMap_(PORTFOLIO_HEADERS);
  return values.map(function (row) {
    const rawUpdatedAt = String(row[headers['Fecha estado de terreno']] || '').trim();
    return {
      code: String(row[headers['Código local']] || '').trim().toUpperCase(),
      name: String(row[headers['Nombre local']] || '').trim(),
      address: String(row[headers.Dirección] || '').trim(),
      sector: String(row[headers['Sector territorial']] || '').trim(),
      collector: String(row[headers['Aplicador/a permanente']] || '').trim(),
      status: String(row[headers['Estado de revisión']] || '').trim(),
      requiredInstruments: parseRequiredInstruments_(row[headers['Instrumentos requeridos']]),
      fieldStatus: normalizePortfolioFieldStatus_(row[headers['Estado de terreno']]),
      fieldNote: String(row[headers['Observación de terreno']] || '').trim(),
      fieldUpdatedAt: /^\d{4}-\d{2}-\d{2}/.test(rawUpdatedAt) ? rawUpdatedAt.slice(0, 10) : rawUpdatedAt,
      fieldUpdatedBy: String(row[headers['Estado de terreno por']] || '').trim(),
    };
  }).filter(function (item) { return item.code && item.name; });
}

function parseRequiredInstruments_(value) {
  const text = String(value || '').trim();
  if (!text) return DEFAULT_REQUIRED_INSTRUMENTS.slice();
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return DEFAULT_REQUIRED_INSTRUMENTS.filter(function (id) { return parsed.indexOf(id) >= 0; });
    }
  } catch (error) {
    // Invalid manual edits fall back to an explicit empty list so the UI asks administration to review them.
  }
  return [];
}

function updatePortfolioRows_(codes, mutate, person) {
  const sheet = managedSheet_(PORTFOLIO_SHEET, PORTFOLIO_HEADERS);
  if (sheet.getLastRow() < 2) throw new Error('La cartera territorial está vacía. Ejecuta setupManagementPortal() en Apps Script.');
  const headers = headerMap_(PORTFOLIO_HEADERS);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, PORTFOLIO_HEADERS.length).getValues();
  const pending = {};
  codes.forEach(function (code) { pending[code] = true; });
  const results = {};
  const now = new Date();
  rows.forEach(function (row) {
    const code = String(row[headers['Código local']] || '').trim().toUpperCase();
    if (!pending[code]) return;
    results[code] = mutate(row, headers);
    row[headers['Actualizada el']] = now;
    row[headers['Actualizada por']] = person;
    delete pending[code];
  });
  const missing = Object.keys(pending);
  if (missing.length) {
    throw new Error('Estos locales no están en la cartera territorial: ' + missing.join(', ') + '. Actualiza el panel e intenta otra vez.');
  }
  sheet.getRange(2, 1, rows.length, PORTFOLIO_HEADERS.length).setValues(rows);
  return results;
}

function normalizeLocalCodes_(value) {
  const list = Array.isArray(value) ? value : [];
  const codes = [];
  list.forEach(function (item) {
    const code = String(item || '').trim().toUpperCase();
    if (code && codes.indexOf(code) < 0) codes.push(code);
  });
  if (!codes.length) throw new Error('Selecciona al menos un local.');
  if (codes.length > 200) throw new Error('Mueve como máximo 200 locales a la vez.');
  return codes;
}

function discoverCaptureVisitLocals_() {
  const result = { collectorByCode: {}, discoveredByCode: {} };
  let database;
  try {
    database = SpreadsheetApp.openById(CAPTURE_SPREADSHEET_ID);
  } catch (error) {
    return result;
  }
  const visits = database && database.getSheetByName(CAPTURE_VISITS_SHEET);
  if (!visits || visits.getLastRow() < 2) return result;
  const lastColumn = Math.max(9, visits.getLastColumn());
  const rows = visits.getRange(2, 1, visits.getLastRow() - 1, lastColumn).getValues();
  rows.forEach(function (row) {
    const rawCode = String(row[4] || '').trim().toUpperCase();
    if (!rawCode || EXCLUDED_TEMPORARY_CODES[rawCode]) return;
    const code = canonicalLocalCode_(rawCode);
    const collector = String(row[3] || '').trim();
    if (collectors_().indexOf(collector) >= 0) {
      result.collectorByCode[code] = collector;
    }
    const name = String(row[6] || '').trim();
    const address = String(row[7] || '').trim();
    const category = String(row[8] || '').trim();
    if (name) {
      result.discoveredByCode[code] = {
        code: code,
        name: name,
        address: address,
        category: category || 'Local incorporado en terreno',
        collector: collectors_().indexOf(collector) >= 0 ? collector : '',
      };
    }
  });
  return result;
}

function applyConsolidatedFieldDecisions_(person) {
  PropertiesService.getScriptProperties().setProperty(CONSOLIDATED_SYNC_PROPERTY, 'true');
  const spreadsheet = managementSpreadsheet_();
  ensurePortfolioSheet_(spreadsheet);
  const baseLocals = readLocals_();
  syncTerritorialPortfolio_(baseLocals);

  const sheet = managedSheet_(PORTFOLIO_SHEET, PORTFOLIO_HEADERS);
  const headers = headerMap_(PORTFOLIO_HEADERS);
  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  const rows = rowCount ? sheet.getRange(2, 1, rowCount, PORTFOLIO_HEADERS.length).getValues() : [];
  const indexByCode = {};
  rows.forEach(function (row, index) {
    const code = String(row[headers['Código local']] || '').trim().toUpperCase();
    if (code) indexByCode[code] = index;
  });

  const baseByCode = {};
  baseLocals.forEach(function (local) { baseByCode[local.code] = local; });
  const captureDiscovery = discoverCaptureVisitLocals_();
  const collectorByCode = captureDiscovery.collectorByCode;
  const now = new Date();
  const today = todayKey_();
  let addedLocals = 0;
  let closedLocals = 0;
  let rejectedLocals = 0;
  let updatedNotes = 0;
  let adjustedInstruments = 0;
  let autoAssignedCollectors = 0;

  // 1. Apply consolidated overrides, closures, rejections, notes, and instrument scopes to base locals.
  baseLocals.forEach(function (local) {
    const index = indexByCode[local.code];
    if (index === undefined) return;
    const row = rows[index];
    const override = CONSOLIDATED_LOCAL_OVERRIDES[local.code] || null;
    const targetInstruments = defaultInstrumentsForCategory_(local.category, local.code);
    const currentInstrumentsJson = String(row[headers['Instrumentos requeridos']] || '').trim();
    const defaultInstrumentsJson = JSON.stringify(DEFAULT_REQUIRED_INSTRUMENTS);
    const targetInstrumentsJson = JSON.stringify(targetInstruments);
    if (targetInstrumentsJson !== currentInstrumentsJson &&
        (currentInstrumentsJson === defaultInstrumentsJson || (override && override.requiredInstruments))) {
      row[headers['Instrumentos requeridos']] = targetInstrumentsJson;
      adjustedInstruments += 1;
    }
    if (!String(row[headers['Aplicador/a permanente']] || '').trim() && collectorByCode[local.code]) {
      row[headers['Aplicador/a permanente']] = collectorByCode[local.code];
      row[headers['Estado de revisión']] = PORTFOLIO_MANUAL;
      autoAssignedCollectors += 1;
    }
    if (!override) return;
    if (override.name) row[headers['Nombre local']] = override.name;
    if (override.address) row[headers.Dirección] = override.address;
    if (override.fieldStatus) {
      row[headers['Estado de terreno']] = override.fieldStatus;
      row[headers['Observación de terreno']] = override.fieldNote || '';
      row[headers['Fecha estado de terreno']] = today;
      row[headers['Estado de terreno por']] = person;
      row[headers['Actualizada el']] = now;
      row[headers['Actualizada por']] = person;
      if (override.fieldStatus === 'Cerrado') closedLocals += 1;
      else if (override.fieldStatus === 'Rechazo') rejectedLocals += 1;
      else if (override.fieldNote) updatedNotes += 1;
    } else if (override.fieldNote) {
      row[headers['Observación de terreno']] = override.fieldNote;
      row[headers['Fecha estado de terreno']] = today;
      row[headers['Estado de terreno por']] = person;
      row[headers['Actualizada el']] = now;
      row[headers['Actualizada por']] = person;
      updatedNotes += 1;
    }
  });

  // 2. Upsert extra capture visit locals.
  const extrasToUpsert = CONSOLIDATED_EXTRA_LOCALS.slice();
  const extraCodesSeen = {};
  extrasToUpsert.forEach(function (item) { extraCodesSeen[item.code] = true; });
  Object.keys(captureDiscovery.discoveredByCode).forEach(function (code) {
    if (baseByCode[code] || extraCodesSeen[code]) return;
    const discovered = captureDiscovery.discoveredByCode[code];
    extrasToUpsert.push({
      code: discovered.code,
      name: discovered.name,
      category: discovered.category,
      subcategory: '',
      address: discovered.address,
      collector: discovered.collector,
      requiredInstruments: defaultInstrumentsForCategory_(discovered.category, discovered.code),
      fieldStatus: 'Operativo',
      fieldNote: 'Local nuevo detectado automáticamente desde la hoja Visitas de captura.',
    });
    extraCodesSeen[code] = true;
  });

  const appended = [];
  extrasToUpsert.forEach(function (extra) {
    const existingIndex = indexByCode[extra.code];
    const resolvedCollector = collectorByCode[extra.code] ||
      (collectors_().indexOf(extra.collector) >= 0 ? extra.collector : '');
    const instrumentsJson = JSON.stringify(extra.requiredInstruments || defaultInstrumentsForCategory_(extra.category, extra.code));
    if (existingIndex === undefined) {
      appended.push([
        extra.code,
        extra.name,
        extra.address || '',
        '',
        resolvedCollector,
        resolvedCollector ? PORTFOLIO_MANUAL : 'Incorporado en consolidación',
        now,
        person,
        instrumentsJson,
        extra.fieldStatus || 'Operativo',
        extra.fieldNote || '',
        today,
        person,
      ]);
      addedLocals += 1;
      if (resolvedCollector) autoAssignedCollectors += 1;
      return;
    }
    const row = rows[existingIndex];
    row[headers['Nombre local']] = extra.name;
    if (extra.address) row[headers.Dirección] = extra.address;
    row[headers['Sector territorial']] = '';
    if (!String(row[headers['Aplicador/a permanente']] || '').trim() && resolvedCollector) {
      row[headers['Aplicador/a permanente']] = resolvedCollector;
      row[headers['Estado de revisión']] = PORTFOLIO_MANUAL;
      autoAssignedCollectors += 1;
    } else if (!baseByCode[extra.code] && !String(row[headers['Aplicador/a permanente']] || '').trim()) {
      row[headers['Estado de revisión']] = 'Incorporado en consolidación';
    }
    row[headers['Instrumentos requeridos']] = instrumentsJson;
    row[headers['Estado de terreno']] = extra.fieldStatus || 'Operativo';
    if (extra.fieldNote) row[headers['Observación de terreno']] = extra.fieldNote;
    row[headers['Fecha estado de terreno']] = today;
    row[headers['Estado de terreno por']] = person;
    row[headers['Actualizada el']] = now;
    row[headers['Actualizada por']] = person;
  });

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, PORTFOLIO_HEADERS.length).setValues(rows);
  }
  if (appended.length) {
    sheet.getRange(rows.length + 2, 1, appended.length, PORTFOLIO_HEADERS.length).setValues(appended);
  }

  audit_(
    'Consolidación 19/11 integrada: +' + addedLocals + ' locales nuevos, ' + closedLocals + ' cerrados, ' + rejectedLocals + ' rechazo, ' + adjustedInstruments + ' alcances de pautas ajustados',
    'admin',
    person
  );
  return {
    synced: true,
    addedLocals: addedLocals,
    closedLocals: closedLocals,
    rejectedLocals: rejectedLocals,
    updatedNotes: updatedNotes,
    adjustedInstruments: adjustedInstruments,
    autoAssignedCollectors: autoAssignedCollectors,
    totalPortfolio: rows.length + appended.length,
  };
}

// Read-only summary of what each local already has in the capture spreadsheet.
function readCaptureEvidence_(statisticsLocals) {
  const empty = { available: false, message: '', byCode: {}, timing: null };
  let database;
  try {
    database = SpreadsheetApp.openById(CAPTURE_SPREADSHEET_ID);
  } catch (error) {
    empty.message = 'No se pudo leer la planilla de captura: ' + error.message;
    return empty;
  }
  const visits = database.getSheetByName(CAPTURE_VISITS_SHEET);
  if (!visits) {
    empty.message = 'La planilla de captura no tiene la pestaña "Visitas".';
    return empty;
  }
  const timezone = typeof database.getSpreadsheetTimeZone === 'function'
    ? database.getSpreadsheetTimeZone()
    : 'America/Santiago';
  const byCode = {};
  const codeByVisit = {};
  const visitLastColumn = visits.getLastColumn();
  const headers = visitLastColumn
    ? visits.getRange(1, 1, 1, visitLastColumn).getValues()[0]
    : [];
  const durationIndexes = {};
  Object.keys(CAPTURE_DURATION_HEADERS).forEach(function (instrumentId) {
    durationIndexes[instrumentId] = headers.indexOf(CAPTURE_DURATION_HEADERS[instrumentId]);
  });
  const timingAvailable = headers.indexOf(CAPTURE_TOTAL_DURATION_HEADER) >= 0 &&
    Object.keys(durationIndexes).every(function (instrumentId) {
      return durationIndexes[instrumentId] >= 0;
    });
  const durationTotals = {};
  const durationCounts = {};
  const visitDurations = [];
  Object.keys(CAPTURE_DURATION_HEADERS).forEach(function (instrumentId) {
    durationTotals[instrumentId] = 0;
    durationCounts[instrumentId] = 0;
  });
  const timingVisitsSeen = {};
  const visitRows = visits.getLastRow() > 1
    ? visits.getRange(2, 1, visits.getLastRow() - 1, Math.max(5, visitLastColumn)).getValues()
    : [];
  visitRows.forEach(function (row) {
    const visitId = String(row[0] || '').trim();
    const rawCode = String(row[4] || '').trim().toUpperCase();
    if (!visitId || !rawCode || EXCLUDED_TEMPORARY_CODES[rawCode]) return;
    const code = canonicalLocalCode_(rawCode);
    codeByVisit[visitId] = code;
    const entry = byCode[code] || (byCode[code] = { visits: 0, lastVisitDate: '', lastCollector: '', instruments: {} });
    entry.visits += 1;
    const observed = spreadsheetDateKey_(row[2], timezone);
    if (observed && observed >= entry.lastVisitDate) {
      entry.lastVisitDate = observed;
      entry.lastCollector = String(row[3] || '').trim();
    }
    if (!timingAvailable || timingVisitsSeen[visitId]) return;
    timingVisitsSeen[visitId] = true;
    const durations = {};
    let totalDurationSeconds = 0;
    Object.keys(CAPTURE_DURATION_HEADERS).forEach(function (instrumentId) {
      const value = Number(row[durationIndexes[instrumentId]]);
      if (!Number.isInteger(value) || value < 1 || value > 43200) return;
      durations[instrumentId] = value;
      totalDurationSeconds += value;
      durationTotals[instrumentId] += value;
      durationCounts[instrumentId] += 1;
    });
    if (!totalDurationSeconds) return;
    visitDurations.push({
      visitId: visitId,
      observationDate: observed,
      localCode: code,
      localName: String(row[6] || '').trim(),
      collector: String(row[3] || '').trim(),
      durations: durations,
      totalDurationSeconds: totalDurationSeconds,
    });
  });
  const researchTables = {};
  Object.keys(CAPTURE_INSTRUMENT_SHEETS).forEach(function (instrumentId) {
    const sheet = database.getSheetByName(CAPTURE_INSTRUMENT_SHEETS[instrumentId]);
    if (statisticsLocals && sheet) researchTables[instrumentId] = sheet.getDataRange().getValues();
    if (!sheet || sheet.getLastRow() < 2) return;
    const seen = {};
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().forEach(function (row) {
      const visitId = String(row[0] || '').trim();
      const code = codeByVisit[visitId];
      if (!code) return;
      const instruments = byCode[code].instruments;
      const item = instruments[instrumentId] || (instruments[instrumentId] = { rows: 0, visits: 0 });
      item.rows += 1;
      if (!seen[visitId]) {
        seen[visitId] = true;
        item.visits += 1;
      }
    });
  });
  visitDurations.sort(function (a, b) {
    return b.observationDate.localeCompare(a.observationDate) || b.visitId.localeCompare(a.visitId);
  });
  const timing = {
    available: timingAvailable,
    instrumentAverages: {},
    visitAverageSeconds: null,
    visitSamples: visitDurations.length,
    recentVisits: visitDurations.slice(0, 10),
  };
  Object.keys(CAPTURE_DURATION_HEADERS).forEach(function (instrumentId) {
    timing.instrumentAverages[instrumentId] = {
      averageSeconds: durationCounts[instrumentId]
        ? Math.round(durationTotals[instrumentId] / durationCounts[instrumentId])
        : null,
      samples: durationCounts[instrumentId],
    };
  });
  if (visitDurations.length) {
    timing.visitAverageSeconds = Math.round(visitDurations.reduce(function (sum, visit) {
      return sum + visit.totalDurationSeconds;
    }, 0) / visitDurations.length);
  }
  return {
    available: true, message: '', byCode: byCode, timing: timing,
    statistics: statisticsLocals ? buildResearchStatistics_(visitRows, researchTables, statisticsLocals) : null,
  };
}

function buildResearchStatistics_(visitRows, tables, locals) {
  const warnings = [];
  const visits = new Map();
  const localTypes = new Map();
  const historicalTypes = new Map();
  const useConsolidated = isConsolidatedDecisionsSynced_();
  const extraByCode = extraLocalMetadataByCode_();
  locals.forEach(function (local) {
    const override = useConsolidated ? CONSOLIDATED_LOCAL_OVERRIDES[local.code] : null;
    localTypes.set(local.code, (override && override.category) || local.category || 'Sin tipo reportado');
  });
  visitRows.forEach(function (row) {
    const id = String(row[0] || '').trim();
    const rawCode = String(row[4] || '').trim().toUpperCase();
    if (!id || !rawCode || EXCLUDED_TEMPORARY_CODES[rawCode]) return;
    const code = canonicalLocalCode_(rawCode);
    const override = useConsolidated ? (CONSOLIDATED_LOCAL_OVERRIDES[code] || extraByCode[code]) : null;
    const visitType = (override && override.category) || String(row[8] || '').trim();
    visits.set(id, { code: code, date: researchDate_(row[2]), type: visitType });
    const previous = historicalTypes.get(code);
    if (!localTypes.has(code) && (!previous || researchDate_(row[2]) >= previous.date)) {
      historicalTypes.set(code, { date: researchDate_(row[2]), type: visitType || 'Sin tipo reportado' });
    }
  });
  historicalTypes.forEach(function (entry, code) { localTypes.set(code, entry.type); });
  const required = {
    classification: ['Clasificación final'],
    availability: ['Sección', 'Categoría', 'Ítem', 'Disponible (Sí/No)'],
    prices: ['Producto', 'Precio observado (CLP)', 'Unidad de medida'],
    origins: ['Producto', 'Categoría alimentaria', 'Comuna de origen declarada', 'Fuente o evidencia de origen'],
  };
  const snapshots = {};
  const available = {};
  let orphanRows = 0;
  Object.keys(required).forEach(function (instrument) {
    const table = tables[instrument] || [];
    const headers = headerMap_(table[0] || []);
    available[instrument] = required[instrument].every(function (name) { return headers[name] !== undefined; });
    snapshots[instrument] = new Map();
    if (!available[instrument]) {
      if (instrument === 'availability' || instrument === 'prices') {
        warnings.push('Sin estructura compatible para ' + CAPTURE_INSTRUMENT_SHEETS[instrument] + '; sus resultados no están disponibles.');
      }
      return;
    }
    const batches = new Map();
    table.slice(1).forEach(function (row) {
      const id = String(row[0] || '').trim();
      if (!id && row.every(function (cell) { return cell === '' || cell == null; })) return;
      const visit = visits.get(id);
      if (!visit) { orphanRows += 1; return; }
      const batch = batches.get(id) || { id: id, code: visit.code, date: visit.date, recorded: 0, rows: [] };
      batch.recorded = Math.max(batch.recorded, researchDate_(row[1]));
      const record = {};
      Object.keys(headers).forEach(function (name) { record[name] = row[headers[name]]; });
      batch.rows.push(record);
      batches.set(id, batch);
    });
    batches.forEach(function (batch) {
      const previous = snapshots[instrument].get(batch.code);
      // Registration time reflects a saved correction; observation date breaks ties.
      if (!previous || batch.recorded > previous.recorded ||
          (batch.recorded === previous.recorded && (batch.date > previous.date ||
          (batch.date === previous.date && batch.id.localeCompare(previous.id) > 0)))) {
        snapshots[instrument].set(batch.code, batch);
      }
    });
  });
  if (orphanRows) warnings.push(orphanRows + ' filas sin visita/local vinculable fueron excluidas.');
  const classification = new Map();
  snapshots.classification.forEach(function (batch, code) {
    const value = normalizeHeader_(batch.rows[batch.rows.length - 1]['Clasificación final']);
    if (value === 'minimarket') classification.set(code, 'Minimarket');
    else if (value === 'almacen barrio' || value === 'almacen de barrio' || value === 'almacen') classification.set(code, 'Almacén');
    else warnings.push('Clasificación final no reconocida para ' + code + '; no se infiere su resultado.');
  });
  if (useConsolidated) {
    Object.keys(MANUAL_ANALYTICAL_CLASSIFICATIONS).forEach(function (code) {
      if (!classification.has(code)) {
        classification.set(code, MANUAL_ANALYTICAL_CLASSIFICATIONS[code]);
      }
    });
  }
  const codes = new Set();
  visits.forEach(function (visit) { codes.add(visit.code); });
  function typeFor(code) {
    return localTypes.get(code) || 'Sin tipo reportado';
  }
  const counts = { Almacén: 0, Minimarket: 0, 'Sin clasificación final': 0 };
  codes.forEach(function (code) {
    if (/almacen|minimarket/.test(normalizeHeader_(localTypes.get(code)))) {
      counts[classification.get(code) || 'Sin clasificación final'] += 1;
    }
  });
  const classificationTotal = Object.keys(counts).reduce(function (sum, key) { return sum + counts[key]; }, 0);
  const groups = new Map();
  function group(label) {
    if (!groups.has(label)) groups.set(label, {
      label: label, locals: new Set(), availabilityLocals: new Set(),
      healthy: { yes: 0, valid: 0 }, unhealthy: { yes: 0, valid: 0 },
      prices: new Map(), originLocals: new Set(), regionalLocals: new Set(), noneLocals: new Set(),
      origins: new Map(), originItems: 0,
    });
    return groups.get(label);
  }
  codes.forEach(function (code) {
    [group('Todos los locales'), group(typeFor(code))].forEach(function (entry) { entry.locals.add(code); });
  });
  let invalidAvailability = 0;
  let excludedPrices = 0;
  let conflictingOrigins = 0;
  let invalidOrigins = 0;
  snapshots.availability.forEach(function (batch, code) {
    const entries = [group('Todos los locales'), group(typeFor(code))];
    entries.forEach(function (entry) { entry.availabilityLocals.add(code); });
    const items = new Map();
    batch.rows.forEach(function (row) {
      if (normalizeHeader_(row['Sección']) !== 'disponibilidad') return;
      items.set(String(row['Categoría']) + '\u0000' + String(row['Ítem']), row);
    });
    const healthyCategories = ['frutas', 'verduras', 'lacteos', 'legumbres', 'carnes y huevo', 'granos', 'bebestibles', 'otros', 'preparaciones saludables'];
    items.forEach(function (row) {
      const category = normalizeHeader_(row['Categoría']);
      const answer = normalizeHeader_(row['Disponible (Sí/No)']);
      if (!String(row['Ítem'] || '').trim() || ['si', 'no'].indexOf(answer) < 0 ||
          (category !== 'no saludables' && healthyCategories.indexOf(category) < 0)) {
        invalidAvailability += 1;
        return;
      }
      entries.forEach(function (entry) {
        const stats = entry[category === 'no saludables' ? 'unhealthy' : 'healthy'];
        stats.valid += 1;
        if (answer === 'si') stats.yes += 1;
      });
    });
  });
  snapshots.prices.forEach(function (batch, code) {
    batch.rows.forEach(function (row) {
      const status = String(row['Estado del producto'] || '').trim();
      if (status && status !== 'precio_obtenido') { excludedPrices += 1; return; }
      const raw = row['Precio observado (CLP)'];
      const value = Number(raw);
      const product = String(row.Producto || '').trim();
      const sourceUnit = String(row['Unidad de medida'] || '').trim();
      const notes = String(row.Observaciones || '');
      const unit = product === 'Leche entera pasteurizada de vaca' && sourceUnit === 'Unidad' &&
        /precio estandarizado a clp\/l/i.test(notes) ? 'L' : sourceUnit;
      if (raw === '' || raw == null || !Number.isFinite(value) || value < 0 ||
          !product || ['kg', '0,5 kg', 'Unidad', 'L'].indexOf(unit) < 0) { excludedPrices += 1; return; }
      [group('Todos los locales'), group(typeFor(code))].forEach(function (entry) {
        const key = JSON.stringify([product, unit]);
        const item = entry.prices.get(key) || { product: product, unit: unit, values: [], locals: new Set() };
        item.values.push(value);
        item.locals.add(code);
        entry.prices.set(key, item);
      });
    });
  });
  snapshots.origins.forEach(function (batch, code) {
    const none = batch.rows.some(function (row) { return row.Producto === 'Sin productos regionales observados'; });
    const products = batch.rows.filter(function (row) {
      return row.Producto !== 'Sin productos regionales observados' && String(row['Categoría alimentaria'] || '').trim();
    });
    invalidOrigins += batch.rows.length - products.length -
      batch.rows.filter(function (row) { return row.Producto === 'Sin productos regionales observados'; }).length;
    if (none && products.length) { conflictingOrigins += 1; return; }
    if (!none && !products.length) return;
    [group('Todos los locales'), group(typeFor(code))].forEach(function (entry) {
      entry.originLocals.add(code);
      if (none) entry.noneLocals.add(code);
      if (products.length) entry.regionalLocals.add(code);
      products.forEach(function (row) {
        const category = String(row['Categoría alimentaria']).trim();
        const commune = String(row['Comuna de origen declarada'] || '').trim() || 'Sin información de comuna';
        const source = String(row['Fuente o evidencia de origen'] || '').trim() || 'Sin fuente reportada';
        const key = JSON.stringify([category, commune, source]);
        const item = entry.origins.get(key) || { category: category, commune: commune, source: source, count: 0, locals: new Set() };
        item.count += 1;
        item.locals.add(code);
        entry.origins.set(key, item);
        entry.originItems += 1;
      });
    });
  });
  if (invalidAvailability) warnings.push(invalidAvailability + ' respuestas de disponibilidad sin categoría o respuesta válida fueron excluidas.');
  if (excludedPrices) warnings.push(excludedPrices + ' filas de precios excluidas: sin precio válido, producto no disponible/precio no obtenido o unidad Otros/no comparable.');
  if (conflictingOrigins) warnings.push(conflictingOrigins + ' locales con respuestas contradictorias de origen fueron excluidos.');
  if (invalidOrigins) warnings.push(invalidOrigins + ' filas de origen sin categoría regional fueron excluidas; no se interpretan como productos externos.');
  return {
    available: available, warnings: warnings,
    classification: { total: classificationTotal, counts: counts },
    groups: Array.from(groups.values()).map(function (entry) {
      return {
        label: entry.label, locals: entry.locals.size, availabilityLocals: entry.availabilityLocals.size,
        healthy: entry.healthy, unhealthy: entry.unhealthy,
        prices: Array.from(entry.prices.values()).map(function (item) {
          const values = item.values.sort(function (a, b) { return a - b; });
          const middle = Math.floor(values.length / 2);
          return {
            product: item.product, unit: item.unit, samples: values.length, locals: item.locals.size,
            min: values[0], max: values[values.length - 1],
            mean: values.reduce(function (sum, value) { return sum + value; }, 0) / values.length,
            median: values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2,
          };
        }).sort(function (a, b) { return a.product.localeCompare(b.product) || a.unit.localeCompare(b.unit); }),
        originLocals: entry.originLocals.size, regionalLocals: entry.regionalLocals.size,
        noneLocals: entry.noneLocals.size, originItems: entry.originItems,
        origins: Array.from(entry.origins.values()).map(function (item) {
          return { category: item.category, commune: item.commune, source: item.source, count: item.count, locals: item.locals.size };
        }).sort(function (a, b) { return a.category.localeCompare(b.category) || a.commune.localeCompare(b.commune); }),
      };
    }).sort(function (a, b) {
      if (a.label === 'Todos los locales') return -1;
      if (b.label === 'Todos los locales') return 1;
      return a.label.localeCompare(b.label);
    }),
  };
}

function researchDate_(value) {
  if (value === '' || value == null) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function withEvidence_(item, evidence) {
  const capture = evidence.byCode[item.code] || { visits: 0, lastVisitDate: '', lastCollector: '', instruments: {} };
  const instruments = {};
  INSTRUMENTS.forEach(function (instrument) {
    const recorded = capture.instruments[instrument.id] || { rows: 0, visits: 0 };
    const required = item.requiredInstruments.indexOf(instrument.id) >= 0;
    instruments[instrument.id] = {
      required: required,
      rows: recorded.rows,
      visits: recorded.visits,
      state: !evidence.available
        ? 'Sin lectura de captura'
        : recorded.rows > 0
          ? 'Con registro en captura'
          : required ? 'Pendiente de captura' : 'No requerido',
    };
  });
  const requiredCount = item.requiredInstruments.length;
  const recordedCount = item.requiredInstruments.filter(function (id) { return instruments[id].rows > 0; }).length;
  const pendingInstruments = INSTRUMENTS
    .filter(function (instrument) {
      return item.requiredInstruments.indexOf(instrument.id) >= 0 && !(instruments[instrument.id].rows > 0);
    })
    .map(function (instrument) { return instrument.id; });
  const pendingCount = Math.max(0, requiredCount - recordedCount);
  const progressState = !evidence.available
    ? 'unknown'
    : !requiredCount
      ? 'none_required'
      : recordedCount === 0
        ? 'no_applied'
        : recordedCount < requiredCount
          ? 'pending_partial'
          : 'complete';
  return Object.assign({}, item, {
    capture: {
      visits: capture.visits,
      lastVisitDate: capture.lastVisitDate,
      lastCollector: capture.lastCollector,
      instruments: instruments,
      requiredCount: requiredCount,
      recordedCount: recordedCount,
      pendingCount: pendingCount,
      pendingInstruments: pendingInstruments,
      progressState: progressState,
    },
  });
}

function requireCollectorName_(value) {
  const name = String(value || '').trim();
  if (collectors_().indexOf(name) < 0) throw new Error('Selecciona tu nombre en la lista del equipo.');
  return name;
}

function collectorPortalUrl_() {
  try {
    return typeof ScriptApp !== 'undefined' ? ScriptApp.getService().getUrl() + '?view=collector' : '';
  } catch (error) {
    return '';
  }
}

function todayKey_() {
  return Utilities.formatDate(new Date(), 'America/Santiago', 'yyyy-MM-dd');
}

function readAssignments_(date) {
  const sheet = managedSheet_(ASSIGNMENTS_SHEET, SCHEDULE_HEADERS);
  if (sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, SCHEDULE_HEADERS.length).getValues();
  const headers = headerMap_(SCHEDULE_HEADERS);
  const timezone = managementSpreadsheet_().getSpreadsheetTimeZone();
  return values.filter(function (row) { return !date || spreadsheetDateKey_(row[headers.Fecha], timezone) === date; })
    .map(function (row) {
      const required = parseJsonArray_(row[headers['Instrumentos requeridos']]);
      const details = parseJsonObject_(row[headers['Detalle de estado']]);
      const statuses = {};
      INSTRUMENTS.forEach(function (instrument) {
        const column = {
          classification: 'Estado: Clasificación',
          availability: 'Estado: Disponibilidad',
          origins: 'Estado: Origen',
          prices: 'Estado: Precios',
        }[instrument.id];
        statuses[instrument.id] = {
          required: required.indexOf(instrument.id) >= 0,
          status: String(row[headers[column]] || 'Pendiente'),
          reason: String(details[instrument.id] || ''),
        };
      });
      return {
        id: String(row[headers['ID asignación']]),
        date: spreadsheetDateKey_(row[headers.Fecha], timezone),
        localCode: String(row[headers['Código local']]),
        localName: String(row[headers['Nombre local']]),
        address: String(row[headers.Dirección]),
        category: String(row[headers['Categoría']]),
        uv: String(row[headers['Unidad vecinal']]),
        sector: String(row[headers.Sector]),
        locationAlert: String(row[headers['Nota territorial']] || ''),
        collector: String(row[headers['Aplicador/a']]),
        assignmentStatus: String(row[headers['Estado asignación']] || 'Activa'),
        requestStatus: String(row[headers['Estado de solicitud']] || 'Aprobada'),
        proposedTime: String(row[headers['Hora propuesta']] || ''),
        requestNote: String(row[headers['Nota de solicitud']] || ''),
        responseReason: String(row[headers['Motivo de respuesta']] || ''),
        requestOrigin: String(row[headers['Origen de solicitud']] || 'Programada por administración'),
        createdAt: row[headers['Creada el']] instanceof Date ? row[headers['Creada el']].getTime() : 0,
        cancellationReason: String(row[headers['Motivo cancelación']] || ''),
        statuses: statuses,
        createdBy: String(row[headers['Creada por']]),
      };
    });
}

function readVisitProposals_() {
  return readAssignments_('').filter(function (item) {
    return item.requestOrigin === 'Propuesta del equipo' && item.requestStatus === 'Pendiente'
      && item.assignmentStatus === 'Activa';
  }).sort(function (a, b) {
    return a.date.localeCompare(b.date) || a.localCode.localeCompare(b.localCode);
  });
}

function readOverdueAssignments_() {
  const spreadsheet = managementSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(ASSIGNMENTS_SHEET);
  const timezone = spreadsheet.getSpreadsheetTimeZone();
  const asOf = Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd');
  if (!sheet || sheet.getLastRow() < 2) return { asOf: asOf, count: 0, items: [] };

  const headers = headerMap_(SCHEDULE_HEADERS);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, SCHEDULE_HEADERS.length).getValues();
  const items = [];
  rows.forEach(function (row) {
    const date = spreadsheetDateKey_(row[headers.Fecha], timezone);
    if (!date || date >= asOf || String(row[headers['Estado asignación']] || 'Activa') !== 'Activa'
      || String(row[headers['Estado de solicitud']] || 'Aprobada') !== 'Aprobada') return;

    const required = parseJsonArray_(row[headers['Instrumentos requeridos']]);
    const pending = INSTRUMENTS.filter(function (instrument) {
      if (required.indexOf(instrument.id) < 0) return false;
      const statusHeader = {
        classification: 'Estado: Clasificación',
        availability: 'Estado: Disponibilidad',
        origins: 'Estado: Origen',
        prices: 'Estado: Precios',
      }[instrument.id];
      const status = String(row[headers[statusHeader]] || 'Pendiente');
      return status !== 'Completo' && status !== 'No aplica';
    }).map(function (instrument) { return instrument.label; });

    if (pending.length) {
      items.push({
        date: date,
        localCode: String(row[headers['Código local']] || ''),
        localName: String(row[headers['Nombre local']] || ''),
        collector: String(row[headers['Aplicador/a']] || ''),
        pendingInstruments: pending,
      });
    }
  });
  items.sort(function (a, b) { return a.date.localeCompare(b.date) || a.localCode.localeCompare(b.localCode); });
  return { asOf: asOf, count: items.length, items: items.slice(0, 10) };
}

function spreadsheetDateKey_(value, timezone) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, timezone, 'yyyy-MM-dd');
  }
  const text = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function normalizeAccountEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function accountByEmail_(email) {
  return portalAccounts_().filter(function (account) {
    return account.email === email;
  })[0] || null;
}

function accountProperty_(account, suffix) {
  return ACCOUNT_PROPERTY_PREFIX + account.slug.toUpperCase() + '_' + suffix;
}

function validatePersonalPassword_(password, confirmation) {
  const value = String(password || '');
  if (Array.from(value).length < 12
    || !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(value)
    || !/\d/.test(value)
    || !/[^A-Za-zÀ-ÖØ-öø-ÿ0-9\s]/.test(value)) {
    throw new Error('La clave debe tener al menos 12 caracteres, con letras, números y un carácter especial.');
  }
  if (value !== String(confirmation || '')) throw new Error('Las claves no coinciden. Vuelve a escribirlas.');
  return value;
}

function passwordHash_(password, salt) {
  const saltValue = String(salt || '');
  if (!/^[a-f0-9]{64}$/i.test(saltValue)) {
    throw new Error('La configuración de claves ESPORA está incompleta. Pide a administración preparar nuevamente los accesos.');
  }
  const saltBytes = saltValue.match(/.{2}/g).map(function (pair) { return parseInt(pair, 16); });
  const block = saltBytes.concat([0, 0, 0, 1]).map(function (byte) { return byte > 127 ? byte - 256 : byte; });
  const passwordBytes = Utilities.newBlob(String(password)).getBytes();
  let u = Utilities.computeHmacSha256Signature(block, passwordBytes);
  const result = u.map(function (byte) { return (byte + 256) % 256; });
  for (let iteration = 1; iteration < PASSWORD_KDF_ITERATIONS; iteration += 1) {
    u = Utilities.computeHmacSha256Signature(u, passwordBytes);
    for (let index = 0; index < result.length; index += 1) {
      result[index] ^= (u[index] + 256) % 256;
    }
  }
  return result.map(function (byte) { return ('0' + byte.toString(16)).slice(-2); }).join('');
}

function setAccountPassword_(account, password, currentToken) {
  const properties = PropertiesService.getScriptProperties();
  const salt = randomSecret_();
  properties.setProperty(accountProperty_(account, 'SALT'), salt);
  properties.setProperty(accountProperty_(account, 'HASH'), passwordHash_(password, salt));
  properties.setProperty(accountProperty_(account, 'MUST_CHANGE'), 'false');
  properties.deleteProperty(accountProperty_(account, 'TEMP_SALT'));
  properties.deleteProperty(accountProperty_(account, 'TEMP_HASH'));
  properties.deleteProperty(accountProperty_(account, 'RESET_HASH'));
  properties.deleteProperty(accountProperty_(account, 'RESET_EXPIRES_AT'));
  properties.deleteProperty(accountProperty_(account, 'RESET_FAILURES'));
  properties.deleteProperty(accountProperty_(account, 'LOGIN_FAILURE_COUNT'));
  properties.deleteProperty(accountProperty_(account, 'LOGIN_LOCKED_UNTIL'));
  CacheService.getScriptCache().remove('esporaLogin:' + hashSecret_(account.email).slice(0, 32));
  revokeAccountSessions_(account.email, currentToken);
  if (currentToken) {
    const session = findSession_(currentToken);
    if (session) {
      const sheet = managedSheet_(ACCESS_SHEET, ACCESS_HEADERS);
      const headers = headerMap_(ACCESS_HEADERS);
      sheet.getRange(session.rowNumber, headers['Cambio de clave requerido'] + 1).setValue(false);
    }
  }
}

function revokeAllPortalSessions_() {
  const sheet = managedSheet_(ACCESS_SHEET, ACCESS_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = headerMap_(ACCESS_HEADERS);
  const now = new Date();
  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (values[rowIndex][headers.Tipo] === 'SESSION' && !values[rowIndex][headers['Revocada el']]) {
      sheet.getRange(rowIndex + 1, headers['Revocada el'] + 1).setValue(now);
    }
  }
}

function revokeAccountSessions_(email, exceptToken) {
  const sheet = managedSheet_(ACCESS_SHEET, ACCESS_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = headerMap_(ACCESS_HEADERS);
  const exceptHash = exceptToken ? hashSecret_(exceptToken) : '';
  const now = new Date();
  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const row = values[rowIndex];
    if (row[headers.Tipo] === 'SESSION'
      && String(row[headers.Correo] || '').toLowerCase() === email
      && row[headers.Hash] !== exceptHash
      && !row[headers['Revocada el']]) {
      sheet.getRange(rowIndex + 1, headers['Revocada el'] + 1).setValue(now);
    }
  }
}

function createSession_(role, name, email, mustChange) {
  const token = randomSecret_();
  const now = new Date();
  const lifetime = mustChange ? 15 : 12;
  const expiresAt = new Date(now.getTime() + lifetime * 60 * 60 * 1000);
  const sheet = managedSheet_(ACCESS_SHEET, ACCESS_HEADERS);
  sheet.appendRow([
    'SESSION', randomId_(), hashSecret_(token), name, role, now, expiresAt, '', '',
    email, Boolean(mustChange),
  ]);
  return { token: token, role: role, name: name, email: email, mustChange: Boolean(mustChange), expiresAt: expiresAt.toISOString() };
}

function requireSession_(token, expectedRole, allowPasswordChange) {
  const session = findSession_(token);
  if (!session || (expectedRole && session.role !== expectedRole)) {
    throw new Error('La sesión expiró o fue revocada. Ingresa nuevamente.');
  }
  const account = accountByEmail_(session.email);
  if (!account || account.name !== session.name || account.role !== session.role) {
    const headers = headerMap_(ACCESS_HEADERS);
    managedSheet_(ACCESS_SHEET, ACCESS_HEADERS)
      .getRange(session.rowNumber, headers['Revocada el'] + 1)
      .setValue(new Date());
    throw new Error('La sesión expiró o fue revocada. Ingresa nuevamente.');
  }
  if (session.mustChange && !allowPasswordChange) {
    throw new Error('Crea tu clave personal antes de acceder a los datos del portal.');
  }
  return session;
}

function requireCollectorSession_(token, requestedCollector) {
  const session = requireSession_(token, 'collector');
  if (String(requestedCollector || '').trim() !== session.name) {
    throw new Error('Tu cuenta solo puede consultar y actualizar su propia cartera.');
  }
  return session;
}

function findSession_(token) {
  const rawToken = String(token || '').trim();
  if (!rawToken) return null;
  const sheet = managedSheet_(ACCESS_SHEET, ACCESS_HEADERS);
  if (sheet.getLastRow() < 2) return null;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, ACCESS_HEADERS.length).getValues();
  const headers = headerMap_(ACCESS_HEADERS);
  const targetHash = hashSecret_(rawToken);
  const now = Date.now();
  for (let index = 0; index < values.length; index += 1) {
    const row = values[index];
    if (row[headers.Tipo] !== 'SESSION' || row[headers.Hash] !== targetHash || row[headers['Revocada el']]) continue;
    const expiry = row[headers['Expira el']];
    if (!(expiry instanceof Date) || expiry.getTime() <= now) return null;
    return {
      role: String(row[headers.Rol]),
      name: String(row[headers.Nombre]),
      email: String(row[headers.Correo] || ''),
      mustChange: String(row[headers['Cambio de clave requerido']]) === 'true',
      rowNumber: index + 2,
    };
  }
  return null;
}

function audit_(action, role, person, assignmentId, instrument, oldStatus, newStatus) {
  const sheet = managedSheet_(AUDIT_SHEET, AUDIT_HEADERS);
  sheet.appendRow([
    randomId_(), new Date(), action, role, person, assignmentId || '',
    instrument || '', oldStatus || '', newStatus || '',
  ]);
}

function headerMap_(headers) {
  const map = {};
  headers.forEach(function (header, index) { map[String(header)] = index; });
  return map;
}

function normalizeHeader_(header) {
  return String(header || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function normalizeAlert_(value) {
  const note = String(value || '').trim();
  return ['sin observaciones', 'sin observacion', 'sin notas', 's/o'].indexOf(note.toLowerCase()) >= 0 ? '' : note;
}

function randomSecret_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}

function randomId_() {
  return Utilities.getUuid();
}

function hashSecret_(secret) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(secret),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function (byte) {
    const value = (byte + 256) % 256;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function constantTimeEquals_(actual, expected) {
  const left = String(actual);
  const right = String(expected);
  let mismatch = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

function validateDate_(date) {
  const value = String(date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Selecciona una fecha válida.');
  const parsed = new Date(value + 'T12:00:00Z');
  if (isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error('La fecha seleccionada no es válida.');
  }
  return value;
}

function validateFutureDate_(date) {
  const value = validateDate_(date);
  if (value < todayKey_()) throw new Error('La fecha propuesta no puede ser anterior a hoy.');
  return value;
}

function validateProposedTime_(time) {
  const value = String(time || '').trim();
  if (value && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error('Indica una hora válida o deja el campo vacío.');
  }
  return value;
}

function parseJsonArray_(value) {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    if (!Array.isArray(parsed)) throw new Error('El contenido no es una lista.');
    return parsed;
  } catch (error) {
    throw new Error('No se pudo leer la lista de pautas guardada. Revisa la pestaña de asignaciones antes de continuar.');
  }
}

function parseJsonObject_(value) {
  try {
    const parsed = JSON.parse(String(value || '{}'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('El contenido no es un objeto.');
    return parsed;
  } catch (error) {
    throw new Error('No se pudo leer el detalle de estados guardado. Revisa la pestaña de asignaciones antes de continuar.');
  }
}

function withScriptLock_(callback) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    throw new Error('El portal está guardando otro cambio. Espera unos segundos e intenta otra vez.');
  }
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

/**
 * CoHive Activity Logger
 *
 * Writes events to knowledge_base.{schema}.activity_log in Databricks.
 * All calls are fire-and-forget — logging never blocks or breaks the critical path.
 *
 * Usage:
 *   import { logEvent, logError, logAssessment } from '../../utils/logger.js';
 *
 *   logEvent({ eventType: 'file_upload', userEmail, brand, message: 'File uploaded' });
 *   logError({ userEmail, hexId, error, context: { fileId } });
 *   logAssessment({ userEmail, brand, hexId, rounds, durationMs });
 *
 * Location: api/utils/logger.js
 */

import { getDatabricksConfig } from './validateEnv.js';

// ── Core log writer ────────────────────────────────────────────────────────────

/**
 * Write a single event to activity_log.
 * Always fire-and-forget — never await this in the critical path.
 *
 * @param {object} params
 * @param {string} params.eventType     - e.g. 'assessment_complete', 'file_upload', 'error'
 * @param {string} [params.severity]    - 'info' | 'warn' | 'error' (default: 'info')
 * @param {string} [params.userEmail]   - user who triggered the event
 * @param {string} [params.brand]       - brand context
 * @param {string} [params.projectType] - project type context
 * @param {string} [params.hexId]       - which hex was active
 * @param {string} params.message       - short human-readable description
 * @param {object} [params.details]     - any extra context as a plain object
 * @param {number} [params.durationMs]  - how long the operation took
 */
export function logEvent({
  eventType,
  severity = 'info',
  userEmail = 'unknown',
  brand = '',
  projectType = '',
  hexId = '',
  message,
  details = {},
  durationMs = null,
}) {
  // Validate minimum required fields
  if (!eventType || !message) {
    console.warn('[Logger] logEvent called without eventType or message — skipping');
    return;
  }

  // Generate log ID
  const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Escape strings for SQL
  const esc = (s) => String(s || '').replace(/'/g, "''").substring(0, 2000);
  const detailsJson = esc(JSON.stringify(details));

  // Get config — if env vars aren't set, fall back to console only
  let config;
  try {
    config = getDatabricksConfig();
  } catch (e) {
    console.warn('[Logger] Cannot write to Databricks — env vars not set. Falling back to console.');
    console.log(`[LOG:${severity.toUpperCase()}] ${eventType} | ${userEmail} | ${message}`);
    return;
  }

  const { workspaceHost, accessToken, warehouseId, schema } = config;

  const sql = `
    INSERT INTO knowledge_base.${schema}.activity_log (
      log_id, event_type, severity, user_email, brand, project_type,
      hex_id, message, details, duration_ms, created_at
    ) VALUES (
      '${logId}',
      '${esc(eventType)}',
      '${esc(severity)}',
      '${esc(userEmail)}',
      '${esc(brand)}',
      '${esc(projectType)}',
      '${esc(hexId)}',
      '${esc(message)}',
      '${detailsJson}',
      ${durationMs !== null ? parseInt(durationMs) : 'NULL'},
      CURRENT_TIMESTAMP()
    )
  `;

  // Fire and forget — intentionally no await
  fetch(`https://${workspaceHost}/api/2.0/sql/statements`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      warehouse_id: warehouseId,
      statement: sql,
      wait_timeout: '10s',
    }),
  })
    .then(async (resp) => {
      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        console.warn(`[Logger] Write failed (${resp.status}): ${body.substring(0, 200)}`);
      }
    })
    .catch((e) => {
      // Never let logging errors bubble up
      console.warn('[Logger] Write error (non-fatal):', e.message);
    });

  // Also always log to console so Vercel logs capture everything
  console.log(`[LOG:${severity.toUpperCase()}] ${eventType} | ${userEmail} | ${brand || '-'} | ${hexId || '-'} | ${message}`);
}

// ── Convenience wrappers ───────────────────────────────────────────────────────

/**
 * Log an error with full context. Extracts message and stack from Error objects.
 */
export function logError({ userEmail, brand, projectType, hexId, error, context = {} }) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : '';

  logEvent({
    eventType: 'error',
    severity: 'error',
    userEmail,
    brand,
    projectType,
    hexId,
    message: message.substring(0, 500),
    details: { stack: stack.substring(0, 1000), ...context },
  });
}

/**
 * Log a completed assessment with key metrics.
 */
export function logAssessment({
  userEmail,
  brand,
  projectType,
  hexId,
  rounds,
  citedFiles,
  personaCount,
  conversationMode,
  modelEndpoint,
  customPrompt = null,
  durationMs,
  success = true,
  errorMessage = null,
}) {
  logEvent({
    eventType: success ? 'assessment_complete' : 'assessment_failed',
    severity: success ? 'info' : 'error',
    userEmail,
    brand,
    projectType,
    hexId,
    message: success
      ? `Assessment completed: ${rounds} round(s), ${citedFiles} citation(s)`
      : `Assessment failed: ${errorMessage}`,
    details: {
      rounds,
      citedFiles,
      personaCount,
      conversationMode,
      modelEndpoint,
      customPromptUsed: customPrompt ? true : false,
      customPrompt: customPrompt ? customPrompt.substring(0, 500) : null,
    },
    durationMs,
  });
}

/**
 * Log a file operation (upload, approve, delete).
 */
export function logFileEvent({ eventType, userEmail, brand, fileName, fileId, details = {} }) {
  logEvent({
    eventType,
    severity: 'info',
    userEmail,
    brand,
    message: `${eventType}: ${fileName}`,
    details: { fileId, ...details },
  });
}

/**
 * Log a gem save.
 */
export function logGem({ userEmail, brand, hexId, fileName, gemId }) {
  logEvent({
    eventType: 'gem_saved',
    severity: 'info',
    userEmail,
    brand,
    hexId,
    message: `Gem saved from ${fileName || 'unknown source'}`,
    details: { gemId, fileName },
  });
}

/**
 * Log a user login.
 */
export function logLogin({ userEmail, workspaceHost }) {
  logEvent({
    eventType: 'login',
    severity: 'info',
    userEmail,
    message: `User logged in`,
    details: { workspaceHost },
  });
}
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  Comet BPO — Hikvision Biometric Sync Agent             ║
 * ║                                                          ║
 * ║  Run this on ANY PC connected to the same local network  ║
 * ║  as your Hikvision biometric device.                     ║
 * ║                                                          ║
 * ║  Usage:                                                  ║
 * ║    node hikvision-sync.js                                ║
 * ║                                                          ║
 * ║  Requirements:                                           ║
 * ║    npm install node-fetch                                ║
 * ║    (Node 18+ has built-in fetch, no install needed)      ║
 * ╚══════════════════════════════════════════════════════════╝
 */

// ─── CONFIGURATION ───────────────────────────────────────────
const CONFIG = {
  // Hikvision Device (Local Network)
  HIKVISION_IP: process.env.HIKVISION_IP || '192.168.1.100',
  HIKVISION_PORT: process.env.HIKVISION_PORT || '80',
  HIKVISION_USER: process.env.HIKVISION_USER || 'admin',
  HIKVISION_PASS: process.env.HIKVISION_PASS || 'your-password-here',

  // Comet CRM (Cloud)
  CRM_WEBHOOK_URL: process.env.CRM_WEBHOOK_URL || 'https://cometbpo.org/api/attendance/webhook',

  // Sync Settings
  POLL_INTERVAL_MS: 30000, // Poll every 30 seconds
  LOOKBACK_MINUTES: 5,     // Look back 5 minutes each poll
};

// ─── STATE ───────────────────────────────────────────────────
const sentEvents = new Set(); // Track sent event IDs to avoid duplicates
let isRunning = false;

// ─── HIKVISION ISAPI ─────────────────────────────────────────

function getBasicAuth() {
  return 'Basic ' + Buffer.from(`${CONFIG.HIKVISION_USER}:${CONFIG.HIKVISION_PASS}`).toString('base64');
}

function getDigestAuth(realm, nonce, uri, method = 'POST') {
  const crypto = require('crypto');
  const ha1 = crypto.createHash('md5').update(`${CONFIG.HIKVISION_USER}:${realm}:${CONFIG.HIKVISION_PASS}`).digest('hex');
  const ha2 = crypto.createHash('md5').update(`${method}:${uri}`).digest('hex');
  const nc = '00000001';
  const cnonce = crypto.randomBytes(8).toString('hex');
  const response = crypto.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:auth:${ha2}`).digest('hex');

  return `Digest username="${CONFIG.HIKVISION_USER}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}", qop=auth, nc=${nc}, cnonce="${cnonce}"`;
}

/**
 * Fetch access control events from Hikvision ISAPI
 */
async function fetchHikvisionEvents() {
  const baseUrl = `http://${CONFIG.HIKVISION_IP}:${CONFIG.HIKVISION_PORT}`;
  const uri = '/ISAPI/AccessControl/AcsEvent';
  const url = baseUrl + uri;

  const now = new Date();
  const lookback = new Date(now.getTime() - CONFIG.LOOKBACK_MINUTES * 60000);

  const searchBody = `<?xml version="1.0" encoding="UTF-8"?>
<AcsEventCond>
  <searchID>comet-sync-${Date.now()}</searchID>
  <searchResultPosition>0</searchResultPosition>
  <maxResults>50</maxResults>
  <major>0</major>
  <minor>0</minor>
  <startTime>${lookback.toISOString()}</startTime>
  <endTime>${now.toISOString()}</endTime>
</AcsEventCond>`;

  try {
    // Try Basic Auth first
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': getBasicAuth(),
      },
      body: searchBody,
    });

    // If 401, try Digest Auth
    if (response.status === 401) {
      const wwwAuth = response.headers.get('www-authenticate') || '';
      const realmMatch = wwwAuth.match(/realm="([^"]+)"/);
      const nonceMatch = wwwAuth.match(/nonce="([^"]+)"/);

      if (realmMatch && nonceMatch) {
        const digestHeader = getDigestAuth(realmMatch[1], nonceMatch[1], uri);
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/xml',
            'Authorization': digestHeader,
          },
          body: searchBody,
        });
      }
    }

    if (!response.ok) {
      console.error(`[${timestamp()}] ❌ Hikvision returned HTTP ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    return parseEvents(xmlText);

  } catch (error) {
    console.error(`[${timestamp()}] ❌ Cannot reach Hikvision at ${baseUrl}:`, error.message);
    return [];
  }
}

/**
 * Also try the newer JSON-based event search (some newer Hikvision models)
 */
async function fetchHikvisionEventsJSON() {
  const baseUrl = `http://${CONFIG.HIKVISION_IP}:${CONFIG.HIKVISION_PORT}`;
  const url = baseUrl + '/ISAPI/AccessControl/AcsEvent';

  const now = new Date();
  const lookback = new Date(now.getTime() - CONFIG.LOOKBACK_MINUTES * 60000);

  const searchBody = JSON.stringify({
    AcsEventCond: {
      searchID: `comet-sync-${Date.now()}`,
      searchResultPosition: 0,
      maxResults: 50,
      major: 0,
      minor: 0,
      startTime: lookback.toISOString(),
      endTime: now.toISOString(),
    }
  });

  try {
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getBasicAuth(),
      },
      body: searchBody,
    });

    if (response.status === 401) {
      const wwwAuth = response.headers.get('www-authenticate') || '';
      const realmMatch = wwwAuth.match(/realm="([^"]+)"/);
      const nonceMatch = wwwAuth.match(/nonce="([^"]+)"/);
      if (realmMatch && nonceMatch) {
        const digestHeader = getDigestAuth(realmMatch[1], nonceMatch[1], '/ISAPI/AccessControl/AcsEvent');
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': digestHeader,
          },
          body: searchBody,
        });
      }
    }

    if (!response.ok) return [];

    const data = await response.json();
    const events = data?.AcsEvent?.InfoList || [];
    return events.map(evt => ({
      employeeNo: evt.employeeNoString || evt.employeeNo || '',
      dateTime: evt.time || evt.dateTime || new Date().toISOString(),
      eventId: `${evt.employeeNoString || evt.employeeNo}-${evt.time || evt.dateTime}`,
    })).filter(e => e.employeeNo);

  } catch {
    return [];
  }
}

/**
 * Parse XML response from Hikvision
 */
function parseEvents(xml) {
  const events = [];
  const eventBlocks = xml.split(/<AcsEvent>|<\/AcsEvent>/g);

  for (const block of eventBlocks) {
    const empMatch = block.match(/<employeeNoString>(.*?)<\/employeeNoString>/);
    const timeMatch = block.match(/<time>(.*?)<\/time>|<dateTime>(.*?)<\/dateTime>/);

    if (empMatch && empMatch[1]) {
      const employeeNo = empMatch[1].trim();
      const dateTime = (timeMatch && (timeMatch[1] || timeMatch[2])) || new Date().toISOString();
      const eventId = `${employeeNo}-${dateTime}`;
      events.push({ employeeNo, dateTime, eventId });
    }
  }

  return events;
}

/**
 * Send event to CRM webhook
 */
async function sendToCRM(event) {
  try {
    const response = await fetch(CONFIG.CRM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        AccessControllerEvent: {
          employeeNoString: event.employeeNo,
        },
        dateTime: event.dateTime,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`[${timestamp()}] ✅ Synced: Employee ${event.employeeNo} at ${event.dateTime}`);
    } else {
      console.warn(`[${timestamp()}] ⚠️  CRM rejected: ${result.error || response.status}`);
    }

    return response.ok;
  } catch (error) {
    console.error(`[${timestamp()}] ❌ CRM unreachable:`, error.message);
    return false;
  }
}

/**
 * Main sync loop
 */
async function sync() {
  if (isRunning) return;
  isRunning = true;

  try {
    // Try XML first, then JSON
    let events = await fetchHikvisionEvents();
    if (events.length === 0) {
      events = await fetchHikvisionEventsJSON();
    }

    const newEvents = events.filter(e => !sentEvents.has(e.eventId));

    if (newEvents.length > 0) {
      console.log(`[${timestamp()}] 📡 Found ${newEvents.length} new event(s)`);
    }

    for (const event of newEvents) {
      const success = await sendToCRM(event);
      if (success) {
        sentEvents.add(event.eventId);
      }
    }

    // Cleanup old event IDs (keep last 1000)
    if (sentEvents.size > 1000) {
      const arr = [...sentEvents];
      arr.splice(0, arr.length - 500);
      sentEvents.clear();
      arr.forEach(id => sentEvents.add(id));
    }

  } catch (error) {
    console.error(`[${timestamp()}] ❌ Sync error:`, error.message);
  } finally {
    isRunning = false;
  }
}

function timestamp() {
  return new Date().toLocaleTimeString();
}

// ─── START ───────────────────────────────────────────────────

console.log('');
console.log('╔══════════════════════════════════════════════╗');
console.log('║  🔗 Comet BPO — Hikvision Sync Agent        ║');
console.log('╠══════════════════════════════════════════════╣');
console.log(`║  Device:   ${CONFIG.HIKVISION_IP}:${CONFIG.HIKVISION_PORT}`.padEnd(47) + '║');
console.log(`║  CRM:      ${CONFIG.CRM_WEBHOOK_URL.substring(0, 34)}`.padEnd(47) + '║');
console.log(`║  Interval: ${CONFIG.POLL_INTERVAL_MS / 1000}s`.padEnd(47) + '║');
console.log('╚══════════════════════════════════════════════╝');
console.log('');
console.log(`[${timestamp()}] 🚀 Starting sync loop...`);
console.log('');

// Initial sync
sync();

// Recurring sync
setInterval(sync, CONFIG.POLL_INTERVAL_MS);

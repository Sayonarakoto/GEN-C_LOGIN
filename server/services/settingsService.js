const Settings = require('../models/Settings');
const logger = require('../utils/logger');

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Env defaults are read once at module load. Values in the DB override them at runtime.
const ENV_DEFAULTS = Object.freeze({
    collegeHoursStart: normalizeTime(process.env.COLLEGE_HOURS_START, '09:30'),
    collegeHoursEnd: normalizeTime(process.env.COLLEGE_HOURS_END, '16:00'),
    lateEntryCutoff: normalizeTime(process.env.LATE_ENTRY_CUTOFF, '09:30'),
    gatePassExtraMinutes: normalizeMinutes(process.env.GATE_PASS_EXTRA_MINUTES, 10),
    bypassTimeChecks: false,
});

const FALLBACK = Object.freeze({
    ...ENV_DEFAULTS,
    source: 'env',
    updatedBy: null,
    updatedAt: null,
});

let cache = null;
let loading = null;

function normalizeTime(value, fallback) {
    const candidate = typeof value === 'string' ? value.trim() : '';
    return TIME_REGEX.test(candidate) ? candidate : fallback;
}

function normalizeMinutes(value, fallback) {
    const parsed = typeof value === 'number' ? value : parseInt(String(value).trim(), 10);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 180 ? parsed : fallback;
}

function normalizeBool(value, fallback) {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    return fallback;
}

function toMinutes(hhmm) {
    const normalized = normalizeTime(hhmm, '00:00');
    const [hours, minutes] = normalized.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTime12h(hhmm) {
    const normalized = normalizeTime(hhmm, '00:00');
    const [rawHours, minutes] = normalized.split(':').map(Number);
    const suffix = rawHours >= 12 ? 'PM' : 'AM';
    const hours = rawHours % 12 === 0 ? 12 : rawHours % 12;
    return `${hours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function formatRange(start, end) {
    return `${formatTime12h(start)} - ${formatTime12h(end)}`;
}

function matchesEnvDefaults(doc) {
    return (
        doc.collegeHoursStart === ENV_DEFAULTS.collegeHoursStart &&
        doc.collegeHoursEnd === ENV_DEFAULTS.collegeHoursEnd &&
        doc.lateEntryCutoff === ENV_DEFAULTS.lateEntryCutoff &&
        Number(doc.gatePassExtraMinutes) === ENV_DEFAULTS.gatePassExtraMinutes &&
        normalizeBool(doc.bypassTimeChecks, false) === ENV_DEFAULTS.bypassTimeChecks
    );
}

function toPublicSettings(doc) {
    if (!doc) {
        return { ...FALLBACK };
    }
    return {
        collegeHoursStart: doc.collegeHoursStart,
        collegeHoursEnd: doc.collegeHoursEnd,
        lateEntryCutoff: doc.lateEntryCutoff,
        gatePassExtraMinutes: normalizeMinutes(doc.gatePassExtraMinutes, ENV_DEFAULTS.gatePassExtraMinutes),
        bypassTimeChecks: normalizeBool(doc.bypassTimeChecks, false),
        source: matchesEnvDefaults(doc) ? 'env' : 'db',
        updatedBy: doc.updatedBy || null,
        updatedAt: doc.updatedAt || null,
    };
}

// Boot load: fetch (or create) the singleton document and cache it.
async function load() {
    if (loading) return loading;

    loading = (async () => {
        try {
            let doc = await Settings.findOne({ key: 'app' });
            if (!doc) {
                doc = await Settings.create({ key: 'app', ...ENV_DEFAULTS });
            }
            cache = toPublicSettings(doc);
            logger.info(
                `Settings loaded (source=db): ${cache.collegeHoursStart} - ${cache.collegeHoursEnd}`
            );
            return cache;
        } catch (error) {
            cache = null;
            logger.error('Failed to load settings from DB, using env defaults:', error.message);
            return { ...FALLBACK };
        } finally {
            loading = null;
        }
    })();

    return loading;
}

// Synchronous accessor for controllers. Never touches the DB mid-request.
function getSettings() {
    if (cache) return { ...cache };

    // Cache not ready yet (e.g. first request before boot load finished):
    // kick off a background load so the next call is warm, but answer with env defaults now.
    if (!loading) {
        load().catch(() => {});
    }
    return { ...FALLBACK };
}

async function updateSettings({ collegeHoursStart, collegeHoursEnd, lateEntryCutoff, gatePassExtraMinutes, bypassTimeChecks }, actorId) {
    const next = {
        collegeHoursStart: normalizeTime(collegeHoursStart, null),
        collegeHoursEnd: normalizeTime(collegeHoursEnd, null),
        lateEntryCutoff: normalizeTime(lateEntryCutoff, null),
    };

    if (!next.collegeHoursStart || !next.collegeHoursEnd || !next.lateEntryCutoff) {
        const error = new Error('Times must be in HH:MM (24-hour) format.');
        error.statusCode = 400;
        throw error;
    }

    if (toMinutes(next.collegeHoursStart) >= toMinutes(next.collegeHoursEnd)) {
        const error = new Error('College hours start time must be before the end time.');
        error.statusCode = 400;
        throw error;
    }

    if (gatePassExtraMinutes !== undefined && gatePassExtraMinutes !== null && gatePassExtraMinutes !== '') {
        const minutes = Number(gatePassExtraMinutes);
        if (!Number.isInteger(minutes) || minutes < 0 || minutes > 180) {
            const error = new Error('Gate pass extra minutes must be a whole number between 0 and 180.');
            error.statusCode = 400;
            throw error;
        }
        next.gatePassExtraMinutes = minutes;
    }

    if (bypassTimeChecks !== undefined && bypassTimeChecks !== null && bypassTimeChecks !== '') {
        const parsed = normalizeBool(bypassTimeChecks, null);
        if (parsed === null) {
            const error = new Error('bypassTimeChecks must be a boolean.');
            error.statusCode = 400;
            throw error;
        }
        next.bypassTimeChecks = parsed;
    }

    const doc = await Settings.findOneAndUpdate(
        { key: 'app' },
        { $set: { ...next, updatedBy: actorId || null } },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    cache = toPublicSettings(doc);
    return { ...cache };
}

async function resetSettings() {
    await Settings.deleteOne({ key: 'app' });
    cache = { ...FALLBACK };
    return { ...cache };
}

// TESTING ONLY: true when college-hours request validation should be skipped.
function isTimeBypassed() {
    return getSettings().bypassTimeChecks === true;
}

module.exports = {
    ENV_DEFAULTS,
    load,
    getSettings,
    updateSettings,
    resetSettings,
    isTimeBypassed,
    toMinutes,
    formatTime12h,
    formatRange,
    TIME_REGEX,
};

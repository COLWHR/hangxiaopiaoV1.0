const { defaultDraft } = require('../mock/publisher-data');
const { getStorage, setStorage, removeStorage } = require('../utils/storage');
const { ACTIVITY_STATUS } = require('../constants/activity');
const { toSafeNumber } = require('../utils/format');
const { getApiUrl, requestJson } = require('../utils/api');

const DRAFT_KEY_PREFIX = 'publisher_activity_draft';
const PREVIEW_KEY_PREFIX = 'publisher_activity_preview';

function buildQuery(params = {}) {
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && `${params[key]}`.trim() !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  return query ? `?${query}` : '';
}

function getSessionSuffix(adminSession = {}) {
  const adminAccountId = String(adminSession.adminAccountId || '').trim();
  const adminUserId = String(adminSession.adminUserId || '').trim();
  if (!adminAccountId || !adminUserId) {
    return '';
  }

  return `${adminAccountId}:${adminUserId}`;
}

function getDraftStorageKey(adminSession = {}) {
  const suffix = getSessionSuffix(adminSession);
  return suffix ? `${DRAFT_KEY_PREFIX}:${suffix}` : DRAFT_KEY_PREFIX;
}

function getPreviewStorageKey(adminSession = {}) {
  const suffix = getSessionSuffix(adminSession);
  return suffix ? `${PREVIEW_KEY_PREFIX}:${suffix}` : PREVIEW_KEY_PREFIX;
}

function getDraftTimestamp(draft) {
  const timestamp = new Date(draft && draft.updatedAt ? draft.updatedAt : draft && draft.createdAt ? draft.createdAt : 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isSessionReady(adminSession = {}) {
  return Boolean(getSessionSuffix(adminSession));
}

function readStoredDraft(adminSession = {}) {
  return getStorage(getDraftStorageKey(adminSession), null);
}

function writeStoredDraft(adminSession = {}, draft) {
  setStorage(getDraftStorageKey(adminSession), draft);
  return draft;
}

function removeStoredDraft(adminSession = {}) {
  removeStorage(getDraftStorageKey(adminSession));
}

function readStoredPreview(adminSession = {}) {
  return getStorage(getPreviewStorageKey(adminSession), null);
}

function writeStoredPreview(adminSession = {}, preview) {
  setStorage(getPreviewStorageKey(adminSession), preview);
  return preview;
}

function removeStoredPreview(adminSession = {}) {
  removeStorage(getPreviewStorageKey(adminSession));
}

function parseBackendDraft(response) {
  const payload = response && response.data ? response.data : null;
  if (!payload) {
    return null;
  }

  const draft = payload.data !== undefined ? payload.data : payload;
  return draft && typeof draft === 'object' ? draft : null;
}

function getCurrentLocalDraft(adminSession = {}) {
  return readStoredDraft(adminSession) || null;
}

function syncDraftToBackend(adminSession = {}, draft) {
  if (!isSessionReady(adminSession) || !draft) {
    return Promise.resolve(null);
  }

  return requestJson({
    url: getApiUrl('/admin/draft'),
    method: 'PUT',
    data: {
      adminAccountId: adminSession.adminAccountId,
      adminUserId: adminSession.adminUserId,
      draftData: draft,
    },
  })
    .then((response) => {
      const remoteDraft = parseBackendDraft(response);
      if (response.statusCode === 200 && remoteDraft) {
        writeStoredDraft(adminSession, normalizeDraft(remoteDraft, { touchUpdatedAt: false }));
        return remoteDraft;
      }

      return null;
    })
    .catch(() => null);
}

function removeDraftFromBackend(adminSession = {}) {
  if (!isSessionReady(adminSession)) {
    return Promise.resolve(null);
  }

  return requestJson({
    url: getApiUrl(
      `/admin/draft${buildQuery({
        adminAccountId: adminSession.adminAccountId,
        adminUserId: adminSession.adminUserId,
      })}`,
    ),
    method: 'DELETE',
  })
    .then(() => null)
    .catch(() => null);
}

function createEmptyDraft(adminSession) {
  const now = new Date().toISOString();
  return {
    ...JSON.parse(JSON.stringify(defaultDraft)),
    id: '',
    adminAccountId: adminSession ? adminSession.adminAccountId : '',
    adminUserId: adminSession ? adminSession.adminUserId : '',
    originTotalTickets: 0,
    originAvailableTickets: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function createDraftFromActivity(activity, adminSession) {
  const now = new Date().toISOString();
  return normalizeDraft({
    ...JSON.parse(JSON.stringify(defaultDraft)),
    ...activity,
    id: activity.id || '',
    adminAccountId: activity.adminAccountId || (adminSession ? adminSession.adminAccountId : ''),
    adminUserId: activity.adminUserId || (adminSession ? adminSession.adminUserId : ''),
    originTotalTickets: toSafeNumber(activity.totalTickets),
    originAvailableTickets: toSafeNumber(activity.availableTickets),
    createdAt: activity.createdAt || now,
    updatedAt: activity.updatedAt || now,
  });
}

async function getDraft(adminSession) {
  const localDraft = getCurrentLocalDraft(adminSession);
  const remoteResponse = isSessionReady(adminSession)
    ? await requestJson({
        url: getApiUrl(
          `/admin/draft${buildQuery({
            adminAccountId: adminSession.adminAccountId,
            adminUserId: adminSession.adminUserId,
          })}`,
        ),
        method: 'GET',
      }).catch(() => null)
    : null;
  const remoteDraft = parseBackendDraft(remoteResponse);

  if (localDraft && remoteDraft) {
    const normalizedLocal = normalizeDraft(localDraft, { touchUpdatedAt: false });
    const normalizedRemote = normalizeDraft(remoteDraft, { touchUpdatedAt: false });
    if (getDraftTimestamp(normalizedRemote) >= getDraftTimestamp(normalizedLocal)) {
      writeStoredDraft(adminSession, normalizedRemote);
      return normalizedRemote;
    }

    void syncDraftToBackend(adminSession, normalizedLocal);
    return normalizedLocal;
  }

  if (remoteDraft) {
    const normalizedRemote = normalizeDraft(remoteDraft, { touchUpdatedAt: false });
    writeStoredDraft(adminSession, normalizedRemote);
    return normalizedRemote;
  }

  if (localDraft) {
    const normalizedLocal = normalizeDraft(localDraft, { touchUpdatedAt: false });
    void syncDraftToBackend(adminSession, normalizedLocal);
    return normalizedLocal;
  }

  return createEmptyDraft(adminSession);
}

function saveDraft(draft) {
  const normalized = normalizeDraft(draft);
  const session = {
    adminAccountId: normalized.adminAccountId,
    adminUserId: normalized.adminUserId,
  };
  writeStoredDraft(session, normalized);
  void syncDraftToBackend(session, normalized);
  return normalized;
}

function setDraftFromActivity(activity, adminSession) {
  const draft = createDraftFromActivity(activity, adminSession);
  writeStoredDraft(adminSession, draft);
  void syncDraftToBackend(adminSession, draft);
  return draft;
}

function clearDraft(adminSession = {}) {
  removeStoredDraft(adminSession);
}

function deleteDraft(adminSession) {
  removeStoredDraft(adminSession);
  void removeDraftFromBackend(adminSession);
}

function savePreview(draft, adminSession) {
  const preview = {
    ...normalizeDraft(draft),
    status: ACTIVITY_STATUS.PREVIEW,
  };
  writeStoredPreview(adminSession, preview);
  return preview;
}

function setPreviewSnapshot(activity, adminSession) {
  const snapshot = {
    ...activity,
    status: activity.status || ACTIVITY_STATUS.PUBLISHED,
    updatedAt: activity.updatedAt || new Date().toISOString(),
  };
  writeStoredPreview(adminSession, snapshot);
  return snapshot;
}

function getPreview(adminSession) {
  return readStoredPreview(adminSession);
}

function clearPreview(adminSession) {
  removeStoredPreview(adminSession);
}

function normalizeDraft(draft, options = {}) {
  const shouldTouchUpdatedAt = options.touchUpdatedAt !== false;
  const totalTickets = toSafeNumber(draft.totalTickets);
  const originTotalTickets = toSafeNumber(draft.originTotalTickets);
  const originAvailableTickets = toSafeNumber(draft.originAvailableTickets);
  const soldTickets = Math.max(originTotalTickets - originAvailableTickets, 0);
  const availableTickets = draft.id ? Math.max(totalTickets - soldTickets, 0) : totalTickets;
  return {
    ...draft,
    totalTickets,
    availableTickets,
    originTotalTickets: draft.id ? originTotalTickets || totalTickets : totalTickets,
    originAvailableTickets: draft.id ? originAvailableTickets || availableTickets : totalTickets,
    status: draft.status || ACTIVITY_STATUS.DRAFT,
    updatedAt: shouldTouchUpdatedAt ? new Date().toISOString() : draft.updatedAt || new Date().toISOString(),
  };
}

function calculateAvailableTickets(draft, nextTotalTickets) {
  const totalTickets = toSafeNumber(nextTotalTickets);
  if (!draft || !draft.id) {
    return totalTickets;
  }

  const originTotalTickets = toSafeNumber(draft.originTotalTickets);
  const originAvailableTickets = toSafeNumber(draft.originAvailableTickets);
  const soldTickets = Math.max(originTotalTickets - originAvailableTickets, 0);
  return Math.max(totalTickets - soldTickets, 0);
}

function validateDraft(draft) {
  if (!draft.title || draft.title.trim().length < 4) {
    return '活动标题至少填写 4 个字。';
  }
  if (!draft.summary || draft.summary.trim().length < 12) {
    return '活动简介至少填写 12 个字。';
  }
  if (!draft.location || !draft.location.trim()) {
    return '请填写活动地点。';
  }
  if (!draft.startTime || !draft.endTime) {
    return '请选择完整的活动时间。';
  }
  if (new Date(draft.startTime.replace(/-/g, '/')) >= new Date(draft.endTime.replace(/-/g, '/'))) {
    return '活动结束时间必须晚于开始时间。';
  }
  if (toSafeNumber(draft.totalTickets) <= 0) {
    return '总票数必须是大于 0 的整数。';
  }
  if (!draft.coverImage) {
    return '请上传活动封面。';
  }
  if (!draft.ticketStubImage) {
    return '请配置票根图片。';
  }
  if (!draft.ticketStubSlogan || draft.ticketStubSlogan.trim().length < 4) {
    return '请填写票根标语，建议不少于 4 个字。';
  }
  if (!draft.ticketNumberPrefix || draft.ticketNumberPrefix.trim().length < 2) {
    return '请填写票根编号前缀。';
  }
  if (!draft.seatRule || !draft.seatRule.trim()) {
    return '请填写座位号展示规则。';
  }
  const enabledFields = (draft.registrationFields || []).filter((field) => field.enabled);
  if (!enabledFields.length) {
    return '至少保留一个报名收集字段。';
  }
  return '';
}

module.exports = {
  getDraft,
  saveDraft,
  setDraftFromActivity,
  clearDraft,
  deleteDraft,
  savePreview,
  setPreviewSnapshot,
  getPreview,
  clearPreview,
  validateDraft,
  createEmptyDraft,
  calculateAvailableTickets,
};

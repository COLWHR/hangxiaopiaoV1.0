const { getStorage, setStorage } = require('../utils/storage');
const { ACTIVITY_STATUS } = require('../constants/activity');
const { getApiUrl, requestJson } = require('../utils/api');

const ACTIVITIES_KEY = 'publisher_activity_records';

function loadActivities() {
  const saved = getStorage(ACTIVITIES_KEY, null);
  if (saved && Array.isArray(saved)) {
    return saved;
  }
  return [];
}

function sortByUpdatedAt(a, b) {
  return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
}

function normalizeFields(fields) {
  return Array.isArray(fields) ? fields : [];
}

function buildQuery(params = {}) {
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && `${params[key]}`.trim() !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  return query ? `?${query}` : '';
}

function mapBackendActivity(activity = {}) {
  const totalTickets = Number(activity.totalTickets ?? 0);
  const availableTickets = Number(activity.availableTickets ?? totalTickets);

  return {
    id: activity.id,
    adminAccountId: activity.adminAccountId || '',
    adminUserId: activity.adminUserId || '',
    title: activity.title || '',
    summary: activity.description || '',
    startTime: activity.startTime || '',
    endTime: activity.endTime || '',
    location: activity.location || '',
    totalTickets: Number.isFinite(totalTickets) ? totalTickets : 0,
    availableTickets: Number.isFinite(availableTickets) ? availableTickets : 0,
    coverImage: activity.coverImageUrl || activity.coverImage || '',
    galleryImage: activity.galleryImageUrl || activity.galleryImage || '',
    registrationFields: normalizeFields(activity.registrationFields),
    ticketStubImage: activity.ticketStubImageUrl || activity.ticketStubImage || '',
    ticketStubSlogan: activity.ticketStubSlogan || '',
    ticketNumberPrefix: activity.ticketNumberPrefix || 'HXP',
    seatRule: activity.seatRule || '',
    status: activity.status || ACTIVITY_STATUS.PUBLISHED,
    createdAt: activity.createdAt || '',
    updatedAt: activity.updatedAt || '',
  };
}

function toBackendPayload(previewDraft) {
  return {
    title: previewDraft.title || '',
    description: previewDraft.summary || '',
    location: previewDraft.location || '',
    coverImageUrl: previewDraft.coverImage || '',
    galleryImageUrl: previewDraft.galleryImage || '',
    ticketStubImageUrl: previewDraft.ticketStubImage || '',
    ticketStubSlogan: previewDraft.ticketStubSlogan || '',
    ticketNumberPrefix: previewDraft.ticketNumberPrefix || '',
    seatRule: previewDraft.seatRule || '',
    registrationFields: normalizeFields(previewDraft.registrationFields),
    totalTickets: Number(previewDraft.totalTickets || 0),
    availableTickets: Number(
      previewDraft.availableTickets === undefined || previewDraft.availableTickets === null
        ? previewDraft.totalTickets || 0
        : previewDraft.availableTickets,
    ),
    startTime: previewDraft.startTime || '',
    endTime: previewDraft.endTime || '',
    status: ACTIVITY_STATUS.PUBLISHED,
    adminAccountId: previewDraft.adminAccountId || '',
    adminUserId: previewDraft.adminUserId || '',
  };
}

function persistLocalActivity(activity) {
  const current = loadActivities();
  const next = [activity, ...current.filter((item) => item.id !== activity.id)].sort(sortByUpdatedAt);
  setStorage(ACTIVITIES_KEY, next);
  return activity;
}

function fallbackGetActivities() {
  return Promise.resolve(loadActivities().slice().sort(sortByUpdatedAt));
}

function getActivities(adminSession = {}) {
  return requestJson({
    url: getApiUrl(`/activities${buildQuery({
      adminAccountId: adminSession.adminAccountId,
      adminUserId: adminSession.adminUserId,
    })}`),
    method: 'GET',
  })
    .then((response) => {
      if (response.statusCode === 200 && Array.isArray(response.data)) {
        const activities = response.data.map(mapBackendActivity).sort(sortByUpdatedAt);
        setStorage(ACTIVITIES_KEY, activities);
        return activities;
      }

      return fallbackGetActivities();
    })
    .catch(() => fallbackGetActivities());
}

function publishActivity(previewDraft) {
  const payload = toBackendPayload(previewDraft);
  const hasActivityId = previewDraft.id !== undefined && previewDraft.id !== null && `${previewDraft.id}`.trim() !== '';
  const request = {
    url: hasActivityId ? getApiUrl(`/activities/${previewDraft.id}`) : getApiUrl('/activities'),
    method: hasActivityId ? 'PATCH' : 'POST',
    data: payload,
  };

  return requestJson(request)
    .then((response) => {
      if (response.statusCode === 200 || response.statusCode === 201) {
        const published = mapBackendActivity(response.data);
        persistLocalActivity(published);
        return published;
      }

      throw new Error((response.data && response.data.message) || '发布失败');
    })
    .catch((error) => {
      throw new Error(error.message || '无法连接后端，发布失败');
    });
}

function revokeActivity(id) {
  return requestJson({
    url: getApiUrl(`/activities/${id}`),
    method: 'PATCH',
    data: {
      status: ACTIVITY_STATUS.REVOKED,
    },
  })
    .then((response) => {
      if (response.statusCode === 200 || response.statusCode === 201) {
        const revoked = mapBackendActivity(response.data);
        persistLocalActivity(revoked);
        return revoked;
      }

      throw new Error((response.data && response.data.message) || '撤回失败');
    })
    .catch((error) => {
      throw new Error(error.message || '无法连接后端，撤回失败');
    });
}

function getActivityById(id) {
  return requestJson({
    url: getApiUrl(`/activities/${id}`),
    method: 'GET',
  })
    .then((response) => {
      if (response.statusCode === 200 && response.data) {
        return mapBackendActivity(response.data);
      }

      return Promise.resolve(loadActivities().find((item) => item.id === id) || null);
    })
    .catch(() => Promise.resolve(loadActivities().find((item) => item.id === id) || null));
}

module.exports = {
  getActivities,
  publishActivity,
  revokeActivity,
  getActivityById,
};

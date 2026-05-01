const DEFAULT_ACTIVITY_COVER_URL =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=campus%20event%20banner%20sports%20festival%20concert%20lecture%20bright%20professional&image_size=landscape_16_9';
const DEFAULT_ACTIVITY_LOCATION = '待补充地点';
const DEFAULT_TICKET_LOCATION = '活动地点';
const BOOKABLE_ACTIVITY_STATUSES = new Set(['active', 'published']);

function formatDateTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(String(value).replace(/-/g, '/'));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function isBookableActivityStatus(status) {
  return BOOKABLE_ACTIVITY_STATUSES.has(String(status || '').trim());
}

function getActivityStatusInfo(activity = {}) {
  const status = String(activity.status || '').trim();
  const now = Date.now();
  const startTime = new Date(String(activity.rawStartTime || activity.startTime || '').replace(/-/g, '/')).getTime();
  const endTime = new Date(String(activity.rawEndTime || activity.endTime || '').replace(/-/g, '/')).getTime();
  const availableTickets = Number(activity.availableTickets ?? 0);

  if (status === 'revoked') {
    return {
      statusLabel: '已撤回',
      statusClass: 'revoked',
      bookable: false,
    };
  }

  if (Number.isFinite(startTime) && now < startTime) {
    return {
      statusLabel: '待开始',
      statusClass: 'pending',
      bookable: false,
    };
  }

  if (Number.isFinite(endTime) && now > endTime) {
    return {
      statusLabel: '已结束',
      statusClass: 'ended',
      bookable: false,
    };
  }

  if (availableTickets <= 0) {
    return {
      statusLabel: '已售罄',
      statusClass: 'sold-out',
      bookable: false,
    };
  }

  if (isBookableActivityStatus(status)) {
    return {
      statusLabel: '抢票中',
      statusClass: 'active',
      bookable: true,
    };
  }

  return {
    statusLabel: '待开始',
    statusClass: 'pending',
    bookable: false,
  };
}

function normalizeActivity(activity = {}) {
  const statusInfo = getActivityStatusInfo(activity);

  return {
    id: activity.id,
    title: activity.title || '',
    description: activity.description || activity.summary || '',
    location: activity.location || DEFAULT_ACTIVITY_LOCATION,
    coverImageUrl: activity.coverImageUrl || DEFAULT_ACTIVITY_COVER_URL,
    galleryImageUrl: activity.galleryImageUrl || activity.galleryImage || '',
    ticketStubImageUrl: activity.ticketStubImageUrl || activity.ticketStubImage || '',
    ticketStubSlogan: activity.ticketStubSlogan || '',
    ticketNumberPrefix: activity.ticketNumberPrefix || '',
    seatRule: activity.seatRule || '',
    registrationFields: Array.isArray(activity.registrationFields) ? activity.registrationFields : [],
    totalTickets: Number(activity.totalTickets ?? 0),
    availableTickets: Number(activity.availableTickets ?? 0),
    startTime: formatDateTime(activity.startTime),
    endTime: formatDateTime(activity.endTime),
    rawStartTime: activity.startTime || '',
    rawEndTime: activity.endTime || '',
    status: activity.status || 'pending',
    qrCodeUrl: activity.qrCodeUrl || '',
    createdAt: activity.createdAt || '',
    statusLabel: statusInfo.statusLabel,
    statusClass: statusInfo.statusClass,
    bookable: statusInfo.bookable,
  };
}

function normalizeTicket(ticket = {}) {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber || '',
    seatNumber: ticket.seatNumber || '',
    status: ticket.status || 'valid',
    activity: normalizeActivity(ticket.activity || {}),
    ticketStub: ticket.ticketStub || {},
  };
}

function buildAnnouncements(activities = []) {
  return activities.slice(0, 3).map((activity) => {
    const normalized = normalizeActivity(activity);
    const sourceDate = normalized.createdAt || normalized.rawStartTime || normalized.startTime;

    return {
      id: normalized.id,
      title: normalized.title,
      date: sourceDate ? formatDateTime(sourceDate).slice(0, 10) : '',
    };
  });
}

module.exports = {
  DEFAULT_ACTIVITY_COVER_URL,
  DEFAULT_ACTIVITY_LOCATION,
  DEFAULT_TICKET_LOCATION,
  buildAnnouncements,
  formatDateTime,
  getActivityStatusInfo,
  isBookableActivityStatus,
  normalizeActivity,
  normalizeTicket,
};

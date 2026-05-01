const { ACTIVITY_STATUS, REGISTRATION_FIELD_OPTIONS } = require('../constants/activity');
const { nowPlusDays } = require('../utils/format');

const defaultDraft = {
  id: '',
  adminAccountId: '',
  adminUserId: '',
  title: '',
  summary: '',
  startTime: nowPlusDays(2),
  endTime: nowPlusDays(4),
  location: '',
  totalTickets: '',
  availableTickets: 0,
  coverImage:
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=university%20event%20poster%20blue%20gradient%20modern%20campus%20activity%20cover&image_size=landscape_16_9',
  galleryImage:
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=campus%20event%20stage%20auditorium%20lighting%20student%20activity%20preview&image_size=landscape_16_9',
  registrationFields: REGISTRATION_FIELD_OPTIONS.map((field) => ({
    ...field,
    enabled: true,
  })),
  ticketStubImage:
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ticket%20stub%20design%20blue%20white%20campus%20event%20clean%20layout&image_size=landscape_4_3',
  ticketStubSlogan: '持票赴约，奔向每一场热爱',
  ticketNumberPrefix: 'HXP',
  seatRule: '按报名顺序自动分配座位号',
  status: ACTIVITY_STATUS.DRAFT,
  createdAt: '',
  updatedAt: '',
};

module.exports = {
  defaultDraft,
};

const ACTIVITY_STATUS = {
  DRAFT: 'draft',
  PREVIEW: 'preview',
  PUBLISHED: 'published',
  REVOKED: 'revoked',
};

const STATUS_META = {
  [ACTIVITY_STATUS.DRAFT]: {
    label: '编辑中',
    className: 'pill-draft',
  },
  [ACTIVITY_STATUS.PREVIEW]: {
    label: '预览中',
    className: 'pill-preview',
  },
  [ACTIVITY_STATUS.PUBLISHED]: {
    label: '已发布',
    className: 'pill-published',
  },
  [ACTIVITY_STATUS.REVOKED]: {
    label: '已撤回',
    className: 'pill-revoked',
  },
};

const REGISTRATION_FIELD_OPTIONS = [
  { key: 'name', label: '姓名', required: true, locked: true, description: '用于实名签到和票根校验' },
  { key: 'studentId', label: '学号', required: true, locked: true, description: '与用户端注册主键对齐' },
  { key: 'college', label: '学院', required: true, locked: false, description: '用于学院活动筛选与统计' },
  { key: 'className', label: '班级', required: true, locked: false, description: '用于班级维度筛选与导出' },
  { key: 'phone', label: '手机号', required: true, locked: false, description: '用于通知与临时联系' },
];

module.exports = {
  ACTIVITY_STATUS,
  STATUS_META,
  REGISTRATION_FIELD_OPTIONS,
};

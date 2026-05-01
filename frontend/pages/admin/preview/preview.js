const activityDraftService = require('../../../services/activityDraftService');
const publishService = require('../../../services/publishService');
const authService = require('../../../services/authService');
const { STATUS_META } = require('../../../constants/activity');
const { formatDateTime } = require('../../../utils/format');

Page({
  data: {
    adminSession: null,
    preview: null,
    statusMeta: STATUS_META.preview,
    registrationFieldLabels: '',
    canPublish: false,
    confirmButtonText: '确认发布',
  },

  onLoad() {
    const adminSession = authService.getSession();
    const preview = activityDraftService.getPreview(adminSession);
    this.setData({
      adminSession,
    });
    if (!preview) {
      wx.redirectTo({
        url: '/pages/admin/publish/publish',
      });
      return;
    }
    this.applyPreview(preview);
  },

  applyPreview(preview) {
    this.setData({
      preview,
      statusMeta: STATUS_META[preview.status] || STATUS_META.preview,
      canPublish: preview.status === 'preview',
      confirmButtonText: preview.id ? '确认更新' : '确认发布',
      registrationFieldLabels: (preview.registrationFields || [])
        .filter((field) => field.enabled)
        .map((field) => field.label)
        .join(' / '),
      formattedStartTime: formatDateTime(preview.startTime),
      formattedEndTime: formatDateTime(preview.endTime),
    });
  },

  handleBackToEdit() {
    if (this.data.canPublish) {
      wx.navigateBack();
      return;
    }
    activityDraftService.clearPreview(this.data.adminSession);
    wx.navigateBack();
  },

  handlePublish() {
    publishService
      .publishActivity(this.data.preview)
      .then((result) => {
        activityDraftService.clearPreview(this.data.adminSession);
        activityDraftService.deleteDraft(this.data.adminSession);
        wx.showToast({
          title: '发布成功',
          icon: 'success',
        });
        wx.redirectTo({
          url: `/pages/admin/activities/activities?highlightId=${result.id}`,
        });
      })
      .catch((error) => {
        wx.showToast({
          title: error.message || '发布失败',
          icon: 'none',
        });
      });
  },
});

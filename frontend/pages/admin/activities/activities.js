const publishService = require('../../../services/publishService');
const activityDraftService = require('../../../services/activityDraftService');
const authService = require('../../../services/authService');
const { STATUS_META } = require('../../../constants/activity');
const { formatDateTime } = require('../../../utils/format');
const { clearCurrentRole } = require('../../../utils/role');

Page({
  data: {
    adminSession: null,
    activities: [],
    highlightId: '',
  },

  onLoad(options) {
    const adminSession = authService.getSession();
    if (!adminSession) {
      wx.redirectTo({
        url: '/pages/admin/login/login',
      });
      return;
    }

    this.setData({
      adminSession,
      highlightId: options.highlightId || '',
    });
  },

  onShow() {
    if (!this.data.adminSession) {
      return;
    }
    this.loadActivities();
  },

  loadActivities() {
    publishService.getActivities(this.data.adminSession).then((activities) => {
      this.setData({
        activities: activities.map((item) => ({
          ...item,
          statusMeta: STATUS_META[item.status] || STATUS_META.published,
          displayTime: `${formatDateTime(item.startTime)} - ${formatDateTime(item.endTime)}`,
          activeFields: (item.registrationFields || [])
            .filter((field) => field.enabled)
            .map((field) => field.label)
            .join(' / '),
        })),
      });
    });
  },

  openPublishPage() {
    wx.navigateTo({
      url: '/pages/admin/publish/publish',
    });
  },

  handleCreateNew() {
    activityDraftService.deleteDraft(this.data.adminSession);
    activityDraftService.clearPreview(this.data.adminSession);
    this.openPublishPage();
  },

  handleEdit(event) {
    const activityId = event.currentTarget.dataset.id;
    publishService.getActivityById(activityId).then((activity) => {
      if (!activity) {
        wx.showToast({
          title: '未找到活动',
          icon: 'none',
        });
        return;
      }

      activityDraftService.clearPreview(this.data.adminSession);
      activityDraftService.setDraftFromActivity(activity, this.data.adminSession);
      this.openPublishPage();
    });
  },

  handleViewPreview(event) {
    const activityId = event.currentTarget.dataset.id;
    publishService.getActivityById(activityId).then((activity) => {
      if (!activity) {
        wx.showToast({
          title: '未找到活动',
          icon: 'none',
        });
        return;
      }

      activityDraftService.setPreviewSnapshot(activity, this.data.adminSession);
      wx.navigateTo({
        url: '/pages/admin/preview/preview',
      });
    });
  },

  handleRevoke(event) {
    const activityId = event.currentTarget.dataset.id;
    wx.showModal({
      title: '撤回活动',
      content: '撤回后活动会变成“已撤回”，用户端将无法继续抢票。确定继续吗？',
      success: (res) => {
        if (!res.confirm) {
          return;
        }

        publishService
          .revokeActivity(activityId)
          .then(() => {
            wx.showToast({
              title: '已撤回',
              icon: 'success',
            });
            this.loadActivities();
          })
          .catch((error) => {
            wx.showToast({
              title: error.message || '撤回失败',
              icon: 'none',
            });
          });
      },
    });
  },

  handleBackToSelect() {
    wx.reLaunch({
      url: '/pages/launch/launch',
    });
  },

  handleLogout() {
    authService.signOut();
    activityDraftService.clearDraft(this.data.adminSession);
    activityDraftService.clearPreview(this.data.adminSession);
    clearCurrentRole();
    wx.reLaunch({
      url: '/pages/launch/launch',
    });
  },
});

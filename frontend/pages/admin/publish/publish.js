const authService = require('../../../services/authService');
const activityDraftService = require('../../../services/activityDraftService');
const { STATUS_META } = require('../../../constants/activity');
const { buildDateRange, selectorToDateTime, dateTimeToSelector } = require('../../../utils/format');

Page({
  data: {
    adminSession: null,
    draft: null,
    statusMeta: STATUS_META.draft,
    dateRange: [],
    startSelector: [0, 0, 0, 9, 0],
    endSelector: [0, 0, 0, 18, 0],
    errorMessage: '',
    publishButtonText: '提交预览',
  },

  async onLoad() {
    const adminSession = authService.getSession();
    if (!adminSession) {
      wx.redirectTo({
        url: '/pages/admin/login/login',
      });
      return;
    }

    const dateRange = buildDateRange();
    const draft = await activityDraftService.getDraft(adminSession);
    this.setData({
      adminSession,
      dateRange,
    });
    this.applyDraft(draft, dateRange);
  },

  onShow() {
    const preview = activityDraftService.getPreview(this.data.adminSession);
    if (preview) {
      this.applyDraft(preview, this.data.dateRange);
    }
  },

  applyDraft(draft, dateRange = this.data.dateRange) {
    this.setData({
      draft,
      statusMeta: STATUS_META[draft.status] || STATUS_META.draft,
      startSelector: dateTimeToSelector(dateRange, draft.startTime, this.data.startSelector),
      endSelector: dateTimeToSelector(dateRange, draft.endTime, this.data.endSelector),
      publishButtonText: draft.id
        ? draft.status === 'revoked'
          ? '重新发布'
          : '保存并更新'
        : '提交预览',
      errorMessage: '',
    });
  },

  updateDraftField(field, value) {
    const nextDraft = {
      ...this.data.draft,
      [field]: value,
    };

    if (field === 'totalTickets') {
      nextDraft.availableTickets = activityDraftService.calculateAvailableTickets(nextDraft, value);
    }

    this.applyDraft(activityDraftService.saveDraft(nextDraft), this.data.dateRange);
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.updateDraftField(field, event.detail.value);
  },

  onDateChange(event) {
    const field = event.currentTarget.dataset.field;
    const selector = event.detail.value;
    const dateValue = selectorToDateTime(this.data.dateRange, selector);
    this.updateDraftField(field, dateValue);
    if (field === 'startTime') {
      this.setData({ startSelector: selector });
    } else {
      this.setData({ endSelector: selector });
    }
  },

  onFieldToggle(event) {
    const key = event.currentTarget.dataset.key;
    const nextFields = this.data.draft.registrationFields.map((item) => {
      if (item.key !== key || item.locked) {
        return item;
      }
      return {
        ...item,
        enabled: !item.enabled,
      };
    });
    this.updateDraftField('registrationFields', nextFields);
  },

  onChooseImage(event) {
    const field = event.currentTarget.dataset.field;
    const presets = {
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=campus%20event%20cover%20poster%20clean%20blue%20theme&image_size=landscape_16_9',
      galleryImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=event%20demo%20image%20students%20campus%20activity%20blue%20tone&image_size=landscape_16_9',
      ticketStubImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ticket%20stub%20design%20college%20event%20clean%20blue&image_size=landscape_4_3',
    };
    this.updateDraftField(field, presets[field]);
    wx.showToast({
      title: '已填入示意图',
      icon: 'none',
    });
  },

  handleSaveDraft() {
    const saved = activityDraftService.saveDraft({
      ...this.data.draft,
      status: 'draft',
    });
    this.applyDraft(saved, this.data.dateRange);
    wx.showToast({
      title: '草稿已保存',
      icon: 'success',
    });
  },

  handlePreview() {
    const errorMessage = activityDraftService.validateDraft(this.data.draft);
    if (errorMessage) {
      this.setData({ errorMessage });
      return;
    }

    const preview = activityDraftService.savePreview(this.data.draft, this.data.adminSession);
    this.applyDraft(preview, this.data.dateRange);
    wx.navigateTo({
      url: '/pages/admin/preview/preview',
    });
  },

  goToActivities() {
    wx.navigateTo({
      url: '/pages/admin/activities/activities',
    });
  },

  goBackToSelect() {
    wx.reLaunch({
      url: '/pages/launch/launch',
    });
  },

  handleLogout() {
    authService.signOut();
    activityDraftService.clearDraft(this.data.adminSession);
    activityDraftService.clearPreview(this.data.adminSession);
    wx.reLaunch({
      url: '/pages/launch/launch',
    });
  },
});

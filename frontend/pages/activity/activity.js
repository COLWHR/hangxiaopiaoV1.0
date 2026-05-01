const { getApiUrl } = require('../../utils/api');
const { getCurrentUser } = require('../../utils/user');
const { requestJson } = require('../../utils/request');
const { formatDateTime, normalizeActivity } = require('../../utils/activity');

Page({
  data: {
    activity: {
      rules: [],
    },
    canBook: false,
    bookButtonText: '立即抢票',
    countdown: {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      hoursFormatted: '00',
      minutesFormatted: '00',
      secondsFormatted: '00',
    },
    isCounting: false,
    countdownTitle: '',
    hasAvailableTickets: false,
    isLoading: false,
  },

  onLoad(options) {
    this.activityId = options.id;
    this.loadActivityDetail(this.activityId);
  },

  onUnload() {
    this.clearCountdown();
  },

  clearCountdown() {
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
  },

  async loadActivityDetail(activityId) {
    if (!activityId) {
      wx.showToast({
        title: '活动不存在',
        icon: 'none',
      });
      return;
    }

    this.clearCountdown();
    this.setData({
      isLoading: true,
    });

    wx.showLoading({
      title: '加载活动详情...',
    });

    try {
      const response = await requestJson({
        url: getApiUrl(`/activities/${activityId}`),
        method: 'GET',
      });

      if (response.statusCode === 200 && response.data) {
        const activity = this.decorateActivity(normalizeActivity(response.data));
        this.setData({
          activity,
          canBook: this.checkCanBook(activity),
          bookButtonText: this.getBookButtonText(activity),
          hasAvailableTickets: activity.availableTickets > 0,
        });
        this.startCountdown();
        return;
      }

      throw new Error('活动不存在');
    } catch (error) {
      wx.showToast({
        title: '活动加载失败',
        icon: 'none',
      });
      setTimeout(() => {
        wx.navigateBack({
          delta: 1,
        });
      }, 800);
    } finally {
      wx.hideLoading();
      this.setData({
        isLoading: false,
      });
    }
  },

  decorateActivity(activity) {
    return {
      ...activity,
      location: activity.location || '待补充地点',
      rules: [
        '每位用户限抢 1 张票',
        '抢票成功后请按时到场核验',
        '门票不得转让或倒卖',
        '如遇特殊情况无法参加，请提前取消',
      ],
      displayStartTime: activity.startTime || formatDateTime(activity.rawStartTime),
      displayEndTime: activity.endTime || formatDateTime(activity.rawEndTime),
    };
  },

  checkCanBook(activity) {
    return Boolean(activity.bookable);
  },

  getBookButtonText(activity) {
    const now = Date.now();
    const startTime = new Date(activity.rawStartTime || activity.startTime).getTime();
    const endTime = new Date(activity.rawEndTime || activity.endTime).getTime();

    if (activity.status === 'revoked') {
      return '活动已撤回';
    }

    if (activity.bookable) {
      return '立即抢票';
    }

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      return '活动未开始';
    }

    if (now < startTime) {
      return '未到抢票时间';
    }

    if (activity.availableTickets <= 0) {
      return '已售罄';
    }

    if (now > endTime) {
      return '抢票已结束';
    }

    return activity.statusLabel || '待开始';
  },

  startCountdown() {
    const activity = this.data.activity;
    const now = Date.now();
    const startTime = new Date(activity.rawStartTime || activity.startTime).getTime();
    const endTime = new Date(activity.rawEndTime || activity.endTime).getTime();

    if (Number.isFinite(startTime) && now < startTime) {
      this.updateCountdown(startTime, '距离抢票开始还有');
      return;
    }

    if (Number.isFinite(endTime) && now <= endTime) {
      this.updateCountdown(endTime, '距离抢票结束还有');
      return;
    }

    this.setData({
      countdown: {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        hoursFormatted: '00',
        minutesFormatted: '00',
        secondsFormatted: '00',
      },
      isCounting: false,
      countdownTitle: '',
    });
  },

  updateCountdown(targetTime, title) {
    this.setData({
      isCounting: true,
      countdownTitle: title,
    });

    const tick = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        this.setData({
          countdown: {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            hoursFormatted: '00',
            minutesFormatted: '00',
            secondsFormatted: '00',
          },
          isCounting: false,
        });

        this.setData({
          canBook: this.checkCanBook(this.data.activity),
          bookButtonText: this.getBookButtonText(this.data.activity),
          hasAvailableTickets: this.data.activity.availableTickets > 0,
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      this.setData({
        countdown: {
          days,
          hours,
          minutes,
          seconds,
          hoursFormatted: String(hours).padStart(2, '0'),
          minutesFormatted: String(minutes).padStart(2, '0'),
          secondsFormatted: String(seconds).padStart(2, '0'),
        },
      });

      this.countdownTimer = setTimeout(tick, 1000);
    };

    tick();
  },

  redirectToLogin() {
    wx.reLaunch({
      url: '/pages/login/login',
    });
  },

  redirectToProfile() {
    wx.reLaunch({
      url: '/pages/register/register?mode=complete',
    });
  },

  async bookTicket() {
    if (!this.data.canBook) {
      wx.showToast({
        title: this.data.bookButtonText,
        icon: 'none',
      });
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      this.redirectToLogin();
      return;
    }

    if (!currentUser.profileCompleted) {
      this.redirectToProfile();
      return;
    }

    wx.showLoading({
      title: '正在抢票...',
    });

    try {
      const response = await requestJson({
        url: getApiUrl('/tickets/book'),
        method: 'POST',
        data: {
          activityId: this.data.activity.id,
          userId: currentUser.id,
        },
      });

      if (response.statusCode === 200 || response.statusCode === 201) {
        wx.showToast({
          title: '抢票成功',
          icon: 'success',
        });

        wx.navigateTo({
          url: `/pages/ticket/ticket?ticketNumber=${response.data.ticketNumber}`,
        });
        return;
      }

      throw new Error((response.data && response.data.message) || '抢票失败');
    } catch (error) {
      wx.showToast({
        title: error.message || '抢票失败，请稍后再试',
        icon: 'none',
      });
    } finally {
      wx.hideLoading();
    }
  },
});

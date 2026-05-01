const { getApiUrl } = require('../../utils/api');
const { getCurrentUser, normalizeUser, setCurrentUser } = require('../../utils/user');
const { requestJson } = require('../../utils/request');
const { DEFAULT_TICKET_LOCATION, formatDateTime, normalizeTicket } = require('../../utils/activity');
const { clearCurrentRole } = require('../../utils/role');

Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickname: '',
      name: '',
      studentId: '',
      college: '',
      className: '',
      phone: '',
    },
    tickets: [],
    isLoadingUser: false,
  },

  onLoad() {
    this.loadPage();
  },

  onShow() {
    this.loadPage();
  },

  redirectToLogin() {
    wx.reLaunch({
      url: '/pages/login/login',
    });
  },

  redirectToSelect() {
    wx.reLaunch({
      url: '/pages/launch/launch',
    });
  },

  redirectToProfile() {
    wx.reLaunch({
      url: '/pages/register/register?mode=complete',
    });
  },

  async loadPage() {
    if (this.loadingPage) {
      return;
    }

    this.loadingPage = true;
    const currentUser = getCurrentUser();

    if (!currentUser) {
      this.redirectToLogin();
      this.loadingPage = false;
      return;
    }

    const normalizedUser = setCurrentUser(normalizeUser(currentUser));
    if (!normalizedUser.profileCompleted) {
      this.redirectToProfile();
      this.loadingPage = false;
      return;
    }

    this.setData({
      userInfo: normalizedUser,
      isLoadingUser: true,
    });

    try {
      const profileResponse = await requestJson({
        url: getApiUrl(`/users/profile/${normalizedUser.id}`),
        method: 'GET',
      });

      if (profileResponse.statusCode === 200 && profileResponse.data) {
        const user = setCurrentUser(normalizeUser(profileResponse.data));
        this.setData({
          userInfo: user,
        });

        if (!user.profileCompleted) {
          this.redirectToProfile();
          return;
        }
      }
    } catch (error) {
      this.setData({
        userInfo: normalizedUser,
      });
    } finally {
      this.setData({
        isLoadingUser: false,
      });
      this.loadingPage = false;
    }

    await this.loadTickets();
  },

  async loadTickets() {
    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser.id || !currentUser.profileCompleted) {
      this.setData({ tickets: [] });
      return;
    }

    try {
      const response = await requestJson({
        url: getApiUrl(`/tickets/user/${currentUser.id}`),
        method: 'GET',
      });

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        this.setData({
          tickets: response.data.map((ticket) => this.formatTicket(normalizeTicket(ticket))),
        });
        return;
      }

      this.setData({ tickets: [] });
    } catch (error) {
      this.setData({ tickets: [] });
    }
  },

  formatTicket(ticket) {
    return {
      id: ticket.id,
      activityTitle: ticket.activity.title || '活动',
      time: ticket.activity.startTime || '',
      location: ticket.activity.location || DEFAULT_TICKET_LOCATION,
      seatNumber: ticket.seatNumber,
      ticketNumber: ticket.ticketNumber,
      qrCode: ticket.ticketStub.qrCodeUrl || '',
      status: ticket.status,
      coverImageUrl: ticket.activity.coverImageUrl || '',
      endTime: formatDateTime(ticket.activity.rawEndTime || ticket.activity.endTime || ''),
    };
  },

  onEditProfile() {
    wx.navigateTo({
      url: '/pages/register/register?mode=edit',
    });
  },

  onViewAllTickets() {
    wx.showToast({
      title: '当前仅展示该用户的票根',
      icon: 'none',
    });
  },

  onGoToAdmin() {
    this.redirectToSelect();
  },

  onLogout() {
    clearCurrentRole();
    wx.removeStorageSync('current_user');
    const app = typeof getApp === 'function' ? getApp() : null;
    if (app && app.globalData) {
      app.globalData.currentUser = null;
      app.globalData.currentRole = '';
    }
    this.redirectToSelect();
  },

  onTicketTap(e) {
    const ticketNumber = e.currentTarget.dataset.ticketNumber;
    wx.navigateTo({
      url: `/pages/ticket/ticket?ticketNumber=${ticketNumber}`,
    });
  },
});

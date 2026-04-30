const { getApiUrl, getCurrentUser, normalizeUser, setCurrentUser } = require('../../utils/user');

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
    useMockData: false,
  },

  onLoad() {
    this.refreshUserProfile();
    this.getTickets();
  },

  onShow() {
    this.refreshUserProfile();
    this.getTickets();
  },

  refreshUserProfile() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      wx.redirectTo({
        url: '/pages/register/register',
      });
      return;
    }

    this.setData({
      userInfo: normalizeUser(currentUser),
      isLoadingUser: true,
    });

    wx.request({
      url: getApiUrl(`/users/profile/${currentUser.id}`),
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const user = setCurrentUser(res.data);
          this.setData({
            userInfo: user,
          });
        }
      },
      fail: () => {
        this.setData({
          userInfo: normalizeUser(currentUser),
        });
      },
      complete: () => {
        this.setData({
          isLoadingUser: false,
        });
      },
    });
  },

  getTickets() {
    const currentUser = getCurrentUser();

    if (!currentUser?.id) {
      this.setData({ tickets: [] });
      return;
    }

    wx.request({
      url: getApiUrl(`/tickets/user/${currentUser.id}`),
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          this.setData({
            tickets: this.formatTickets(res.data),
            useMockData: false,
          });
          return;
        }

        this.useMockTickets();
      },
      fail: () => {
        this.useMockTickets();
      },
    });
  },

  formatTickets(tickets) {
    return tickets.map((ticket) => ({
      id: ticket.id,
      activityTitle: ticket.activity ? ticket.activity.title : '活动',
      time: this.formatDate(ticket.activity ? ticket.activity.startTime : ''),
      location: '体育馆',
      seatNumber: ticket.seatNumber,
      ticketNumber: ticket.ticketNumber,
      qrCode: ticket.ticketStub ? ticket.ticketStub.qrCodeUrl : '',
      status: ticket.status,
    }));
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr.replace(/-/g, '/'));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  useMockTickets() {
    const mockTickets = [
      {
        id: 1,
        activityTitle: '2026春季运动会',
        time: '2026-04-20 09:00',
        location: '体育馆',
        seatNumber: 'A区12排4座',
        ticketNumber: 'T20260420001',
        qrCode: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=QR%20code%20ticket%20validation%20scan%20black%20and%20white%20high%20contrast%20square%20pattern&image_size=square',
        status: 'valid',
      },
    ];

    this.setData({
      tickets: mockTickets,
      useMockData: true,
    });
  },

  onEditProfile() {
    wx.navigateTo({
      url: '/pages/register/register?mode=edit',
    });
  },

  onViewAllTickets() {
    wx.showToast({
      title: '已展示当前登录用户的票根',
      icon: 'none',
    });
  },

  onGoToAdmin() {
    wx.showToast({
      title: '暂未开放管理员入口',
      icon: 'none',
    });
  },

  onTicketTap(e) {
    const ticketNumber = e.currentTarget.dataset.ticketNumber;
    wx.navigateTo({
      url: `/pages/ticket/ticket?ticketNumber=${ticketNumber}`,
    });
  },
});

const { getCurrentUser } = require('../../utils/user');
const { getCurrentRole, setCurrentRole } = require('../../utils/role');
const authService = require('../../services/authService');

Page({
  data: {
    currentRole: '',
    hasUserSession: false,
    hasAdminSession: false,
  },

  onLoad() {
    const hasUserSession = Boolean(getCurrentUser());
    const hasAdminSession = Boolean(authService.getSession());
    this.setData({
      currentRole: getCurrentRole(),
      hasUserSession,
      hasAdminSession,
    });
  },

  chooseUser() {
    setCurrentRole('user');
    wx.navigateTo({
      url: '/pages/login/login',
    });
  },

  choosePublisher() {
    setCurrentRole('admin');
    wx.navigateTo({
      url: '/pages/admin/login/login',
    });
  },
});

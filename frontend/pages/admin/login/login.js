const authService = require('../../../services/authService');
const { setCurrentRole } = require('../../../utils/role');

Page({
  data: {
    account: 'ADMIN2024',
    password: '',
    loading: false,
    errorMessage: '',
  },

  onLoad() {
    const session = authService.getSession();
    if (session) {
      setCurrentRole('admin');
      wx.redirectTo({
        url: '/pages/admin/activities/activities',
      });
    }
  },

  onAccountInput(event) {
    this.setData({
      account: event.detail.value,
      errorMessage: '',
    });
  },

  onPasswordInput(event) {
    this.setData({
      password: event.detail.value,
      errorMessage: '',
    });
  },

  goBackToSelect() {
    wx.reLaunch({
      url: '/pages/launch/launch',
    });
  },

  handleSubmit() {
    if (!this.data.account.trim() || !this.data.password.trim()) {
      this.setData({
        errorMessage: '请输入管理员账号和密码。',
      });
      return;
    }

    this.setData({ loading: true, errorMessage: '' });
    authService
      .signIn(this.data.account.trim(), this.data.password.trim())
      .then(() => {
        setCurrentRole('admin');
        wx.showToast({
          title: '登录成功',
          icon: 'success',
        });
        wx.redirectTo({
          url: '/pages/admin/activities/activities',
        });
      })
      .catch((error) => {
        this.setData({
          errorMessage: error.message || '登录失败，请稍后重试。',
        });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },
});

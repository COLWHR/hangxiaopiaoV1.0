const { getApiUrl } = require('../../utils/api');
const { getCurrentUser, normalizeUser, setCurrentUser } = require('../../utils/user');
const { requestJson } = require('../../utils/request');
const { setCurrentRole } = require('../../utils/role');

Page({
  data: {
    formData: {
      phone: '',
      password: '',
    },
    formError: '',
    isSubmitting: false,
  },

  onLoad() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return;
    }

    setCurrentRole('user');
    const normalizedUser = setCurrentUser(normalizeUser(currentUser));
    if (!normalizedUser.profileCompleted) {
      wx.reLaunch({
        url: '/pages/register/register?mode=complete',
      });
      return;
    }

    wx.switchTab({
      url: '/pages/mine/mine',
    });
  },

  goBackToSelect() {
    wx.reLaunch({
      url: '/pages/launch/launch',
    });
  },

  onPhoneInput(e) {
    this.setData({
      'formData.phone': e.detail.value,
      formError: '',
    });
  },

  onPasswordInput(e) {
    this.setData({
      'formData.password': e.detail.value,
      formError: '',
    });
  },

  validateForm() {
    const { phone, password } = this.data.formData;

    if (!phone || !/^1\d{10}$/.test(phone.trim())) {
      return '请输入有效的 11 位手机号';
    }

    if (!password || password.trim().length < 6) {
      return '密码至少 6 位';
    }

    return '';
  },

  async onLogin() {
    const error = this.validateForm();
    if (error) {
      this.setData({ formError: error });
      return;
    }

    this.setData({
      isSubmitting: true,
      formError: '',
    });

    wx.showLoading({
      title: '登录中...',
    });

    try {
      const response = await requestJson({
        url: getApiUrl('/users/login'),
        method: 'POST',
        data: {
          phone: this.data.formData.phone.trim(),
          password: this.data.formData.password,
        },
      });

      const payload = response.data && response.data.data;
      if ((response.statusCode === 200 || response.statusCode === 201) && payload) {
        const user = setCurrentUser(normalizeUser(payload));
        setCurrentRole('user');

        if (response.data.needProfile || !user.profileCompleted) {
          wx.reLaunch({
            url: '/pages/register/register?mode=complete',
          });
          return;
        }

        wx.showToast({
          title: '登录成功',
          icon: 'success',
        });

        wx.switchTab({
          url: '/pages/mine/mine',
        });
        return;
      }

      this.setData({
        formError: (response.data && response.data.message) || '登录失败，请稍后再试',
      });
    } catch (error) {
      this.setData({
        formError: '网络请求失败，请检查后端服务是否已启动',
      });
    } finally {
      wx.hideLoading();
      this.setData({
        isSubmitting: false,
      });
    }
  },
});

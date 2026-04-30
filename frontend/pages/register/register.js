const { getApiUrl, getCurrentUser, normalizeUser, setCurrentUser } = require('../../utils/user');

Page({
  data: {
    collegeOptions: [
      '航空工程学院',
      '机电工程学院',
      '信息与通信工程学院',
      '电子信息工程学院',
      '计算机学院',
      '材料工程学院',
      '经济管理学院',
      '航空发动机学院',
      '航空自动化学院',
      '外国语学院',
      '马克思主义学院',
      '理学院',
      '体育学院',
      '艺术学院',
    ],
    collegeIndex: 0,
    formData: {
      name: '',
      studentId: '',
      college: '',
      className: '',
      phone: '',
    },
    formError: '',
    isSubmitting: false,
    isEditing: false,
  },

  onLoad(options = {}) {
    this.mode = options.mode || '';
    const currentUser = getCurrentUser();

    if (currentUser && this.mode !== 'edit') {
      wx.switchTab({
        url: '/pages/mine/mine',
      });
      return;
    }

    if (currentUser) {
      this.loadProfileFromServer(currentUser.id);
    }
  },

  loadProfileFromServer(userId) {
    wx.request({
      url: getApiUrl(`/users/profile/${userId}`),
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.applyProfile(res.data);
          return;
        }

        const currentUser = getCurrentUser();
        if (currentUser) {
          this.applyProfile(currentUser);
        }
      },
      fail: () => {
        const currentUser = getCurrentUser();
        if (currentUser) {
          this.applyProfile(currentUser);
        }
      },
    });
  },

  applyProfile(user) {
    const normalizedUser = normalizeUser(user);
    const collegeIndex = Math.max(this.data.collegeOptions.indexOf(normalizedUser.college), 0);

    this.setData({
      collegeIndex,
      formData: {
        name: normalizedUser.name || '',
        studentId: normalizedUser.studentId || '',
        college: normalizedUser.college || '',
        className: normalizedUser.className || '',
        phone: normalizedUser.phone || '',
      },
      isEditing: true,
      formError: '',
    });
  },

  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value,
      formError: '',
    });
  },

  onStudentIdInput(e) {
    this.setData({
      'formData.studentId': e.detail.value,
      formError: '',
    });
  },

  onCollegeChange(e) {
    const index = Number(e.detail.value);
    this.setData({
      collegeIndex: index,
      'formData.college': this.data.collegeOptions[index],
      formError: '',
    });
  },

  onClassNameInput(e) {
    this.setData({
      'formData.className': e.detail.value,
      formError: '',
    });
  },

  onPhoneInput(e) {
    this.setData({
      'formData.phone': e.detail.value,
      formError: '',
    });
  },

  validateForm() {
    const { name, studentId, college, className, phone } = this.data.formData;

    if (!name || name.trim().length < 2) {
      return '请输入有效的姓名，至少 2 个字';
    }

    if (!studentId || !/^\d{8,12}$/.test(studentId)) {
      return '请输入有效的学号，8-12 位数字';
    }

    if (!college) {
      return '请选择学院';
    }

    if (!className || className.trim().length < 2) {
      return '请输入有效的班级信息';
    }

    if (!phone || !/^1\d{10}$/.test(phone)) {
      return '请输入有效的手机号';
    }

    return '';
  },

  onRegister() {
    const error = this.validateForm();
    if (error) {
      this.setData({ formError: error });
      return;
    }

    this.setData({
      isSubmitting: true,
      formError: '',
    });

    const currentUser = getCurrentUser();
    const payload = {
      ...this.data.formData,
    };

    if (currentUser?.id) {
      payload.id = currentUser.id;
    }

    wx.request({
      url: getApiUrl('/users/profile'),
      method: 'POST',
      data: payload,
      timeout: 8000,
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const user = normalizeUser(res.data?.data || payload);
          setCurrentUser(user);

          wx.showToast({
            title: '保存成功',
            icon: 'success',
          });

          setTimeout(() => {
            wx.switchTab({
              url: '/pages/mine/mine',
            });
          }, 500);
          return;
        }

        this.setData({
          formError: res.data?.message || '保存失败，请稍后再试',
          isSubmitting: false,
        });
      },
      fail: () => {
        this.setData({
          formError: '网络请求失败，请检查后端服务是否启动',
          isSubmitting: false,
        });
      },
      complete: () => {
        this.setData({ isSubmitting: false });
      },
    });
  },
});

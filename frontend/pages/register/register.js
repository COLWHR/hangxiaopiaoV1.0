const { getApiUrl } = require('../../utils/api');
const { getCurrentUser, normalizeUser, setCurrentUser } = require('../../utils/user');
const { requestJson } = require('../../utils/request');
const { setCurrentRole } = require('../../utils/role');

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
    phoneLocked: true,
    pageTitle: '完善个人信息',
    pageSubtitle: '补全资料后，个人信息会同步到数据库和“我的”页面。',
  },

  onLoad(options = {}) {
    this.mode = options.mode || '';
    const currentUser = getCurrentUser();

    if (!currentUser) {
      wx.reLaunch({
        url: '/pages/login/login',
      });
      return;
    }

    setCurrentRole('user');
    const normalizedUser = setCurrentUser(normalizeUser(currentUser));
    if (normalizedUser.profileCompleted && this.mode !== 'edit') {
      wx.switchTab({
        url: '/pages/mine/mine',
      });
      return;
    }

    this.applyProfile(normalizedUser);
  },

  applyProfile(user) {
    const collegeIndex = Math.max(this.data.collegeOptions.indexOf(user.college), 0);

    this.setData({
      collegeIndex,
      formData: {
        name: user.name || '',
        studentId: user.studentId || '',
        college: user.college || '',
        className: user.className || '',
        phone: user.phone || '',
      },
      isEditing: true,
      phoneLocked: true,
      pageTitle: this.mode === 'edit' ? '编辑个人信息' : '完善个人信息',
      pageSubtitle:
        this.mode === 'edit'
          ? '修改后的信息会立即同步到数据库和“我的”页面。'
          : '首次登录后请补全资料，完成后即可进入“我的”。',
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

  validateForm() {
    const { name, studentId, college, className, phone } = this.data.formData;

    if (!name || name.trim().length < 2) {
      return '请输入真实姓名，至少 2 个字';
    }

    if (!studentId || !/^\d{8,12}$/.test(studentId.trim())) {
      return '请输入有效的学号，8-12 位数字';
    }

    if (!college) {
      return '请选择学院';
    }

    if (!className || className.trim().length < 2) {
      return '请输入有效的班级信息';
    }

    if (!phone || !/^1\d{10}$/.test(phone.trim())) {
      return '手机号格式不正确';
    }

    return '';
  },

  async onRegister() {
    const error = this.validateForm();
    if (error) {
      this.setData({ formError: error });
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      wx.reLaunch({
        url: '/pages/login/login',
      });
      return;
    }

    this.setData({
      isSubmitting: true,
      formError: '',
    });

    const payload = {
      ...this.data.formData,
      id: currentUser.id,
    };

    wx.showLoading({
      title: '保存中...',
    });

    try {
      const response = await requestJson({
        url: getApiUrl('/users/profile'),
        method: 'POST',
        data: payload,
      });

      if (response.statusCode === 200 || response.statusCode === 201) {
        const user = setCurrentUser(normalizeUser((response.data && response.data.data) || payload));
        setCurrentRole('user');

        wx.showToast({
          title: '保存成功',
          icon: 'success',
        });

        if (user.profileCompleted) {
          wx.switchTab({
            url: '/pages/mine/mine',
          });
        } else {
          this.setData({
            formError: '资料未完整，请继续补全',
          });
        }
        return;
      }

      this.setData({
        formError: (response.data && response.data.message) || '保存失败，请稍后再试',
      });
    } catch (error) {
      this.setData({
        formError: '网络请求失败，请检查后端服务是否启动',
      });
    } finally {
      wx.hideLoading();
      this.setData({ isSubmitting: false });
    }
  },
});

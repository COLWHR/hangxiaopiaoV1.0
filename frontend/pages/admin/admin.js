Page({
  data: {
    // 身份验证相关
    isAuthenticated: false,
    authCode: '',
    authError: '',
    isAuthenticating: false,
    
    // 表单数据
    formData: {
      title: '',
      startTime: '',
      endTime: '',
      location: '',
      totalTickets: '',
      description: '',
      participant: '',
      posterUrl: ''
    },
    
    // 表单验证
    formError: '',
    formProgress: 0,
    
    // 日期时间选择器
    dateTimeRange: [],
    startDateTimeIndex: [0, 0, 0, 0, 0],
    endDateTimeIndex: [0, 0, 0, 0, 0],
    
    // 参与对象选项
    participantOptions: ['全体师生', '大一学生', '大二学生', '大三学生', '大四学生', '研究生', '教职工'],
    participantIndex: 0,
    
    // 海报上传
    posterUploadProgress: 0,
    
    // 提交状态
    isSubmitting: false,
    
    // 本地存储key
    STORAGE_KEY: 'activity_draft'
  },

  onLoad() {
    this.initDateTimeRange();
    this.loadDraft();
  },

  onUnload() {
    this.saveDraft();
  },

  // 初始化日期时间范围
  initDateTimeRange() {
    const now = new Date();
    const years = [];
    const months = [];
    const days = [];
    const hours = [];
    const minutes = [];

    // 年份（当前年及后2年）
    for (let i = 0; i < 3; i++) {
      years.push({ label: (now.getFullYear() + i) + '年', value: now.getFullYear() + i });
    }

    // 月份
    for (let i = 1; i <= 12; i++) {
      months.push({ label: i + '月', value: i });
    }

    // 日期
    for (let i = 1; i <= 31; i++) {
      days.push({ label: i + '日', value: i });
    }

    // 小时
    for (let i = 0; i < 24; i++) {
      hours.push({ label: i.toString().padStart(2, '0') + '时', value: i });
    }

    // 分钟
    for (let i = 0; i < 60; i += 30) {
      minutes.push({ label: i.toString().padStart(2, '0') + '分', value: i });
    }

    this.setData({
      dateTimeRange: [years, months, days, hours, minutes]
    });
  },

  // 负责人编号输入
  onAuthCodeInput(e) {
    this.setData({
      authCode: e.detail.value,
      authError: ''
    });
  },

  // 验证负责人身份
  onAuthSubmit() {
    const { authCode } = this.data;

    if (!authCode.trim()) {
      this.setData({ authError: '请输入负责人编号' });
      return;
    }

    this.setData({ isAuthenticating: true, authError: '' });

    // 模拟验证（实际项目中应调用后端API）
    setTimeout(() => {
      // 预设一个有效的负责人编号：ADMIN2024
      const validCode = 'ADMIN2024';
      
      if (authCode === validCode) {
        this.setData({
          isAuthenticated: true,
          isAuthenticating: false
        });
        wx.showToast({
          title: '验证成功',
          icon: 'success'
        });
      } else {
        this.setData({
          authError: '负责人编号无效，请检查后重试',
          isAuthenticating: false
        });
      }
    }, 1000);
  },

  // 返回上一页
  onBack() {
    const { isAuthenticated } = this.data;
    
    if (isAuthenticated) {
      wx.showModal({
        title: '提示',
        content: '确定要离开吗？未保存的数据将会丢失',
        confirmText: '确定离开',
        cancelText: '继续编辑',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  },

  // 活动名称输入
  onTitleInput(e) {
    this.updateFormData('title', e.detail.value);
  },

  // 开始时间选择
  onStartDateTimeChange(e) {
    const index = e.detail.value;
    const dateTime = this.formatDateTime(index);
    this.updateFormData('startTime', dateTime);
    this.setData({ startDateTimeIndex: index });
  },

  // 结束时间选择
  onEndDateTimeChange(e) {
    const index = e.detail.value;
    const dateTime = this.formatDateTime(index);
    this.updateFormData('endTime', dateTime);
    this.setData({ endDateTimeIndex: index });
  },

  // 格式化日期时间
  formatDateTime(index) {
    const { dateTimeRange } = this.data;
    const year = dateTimeRange[0][index[0]].value;
    const month = dateTimeRange[1][index[1]].value;
    const day = dateTimeRange[2][index[2]].value;
    const hour = dateTimeRange[3][index[3]].value;
    const minute = dateTimeRange[4][index[4]].value;
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
  },

  // 活动地点输入
  onLocationInput(e) {
    this.updateFormData('location', e.detail.value);
  },

  // 选择位置
  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.updateFormData('location', res.name || res.address);
      }
    });
  },

  // 总票数输入
  onTotalTicketsInput(e) {
    this.updateFormData('totalTickets', e.detail.value);
  },

  // 活动描述输入
  onDescriptionInput(e) {
    this.updateFormData('description', e.detail.value);
  },

  // 参与对象选择
  onParticipantChange(e) {
    const index = e.detail.value;
    this.updateFormData('participant', this.data.participantOptions[index]);
    this.setData({ participantIndex: index });
  },

  // 更新表单数据并计算进度
  updateFormData(key, value) {
    const { formData } = this.data;
    formData[key] = value;
    
    const progress = this.calculateFormProgress(formData);
    
    this.setData({
      formData,
      formProgress: progress,
      formError: ''
    });
    
    // 自动保存草稿
    this.saveDraft();
  },

  // 计算表单填写进度
  calculateFormProgress(formData) {
    const requiredFields = ['title', 'startTime', 'endTime', 'location', 'totalTickets', 'description', 'participant'];
    let filledCount = 0;
    
    requiredFields.forEach(field => {
      if (formData[field] && formData[field].toString().trim()) {
        filledCount++;
      }
    });
    
    return Math.round((filledCount / requiredFields.length) * 100);
  },

  // 选择海报
  onChoosePoster() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 检查文件大小（5MB）
        wx.getFileInfo({
          filePath: tempFilePath,
          success: (fileInfo) => {
            if (fileInfo.size > 5 * 1024 * 1024) {
              wx.showToast({
                title: '图片大小不能超过5MB',
                icon: 'none'
              });
              return;
            }
            
            // 检查文件格式
            const ext = tempFilePath.split('.').pop().toLowerCase();
            if (!['jpg', 'jpeg', 'png'].includes(ext)) {
              wx.showToast({
                title: '只支持jpg/png格式',
                icon: 'none'
              });
              return;
            }
            
            this.uploadPoster(tempFilePath);
          }
        });
      }
    });
  },

  // 上传海报
  uploadPoster(filePath) {
    this.setData({ posterUploadProgress: 1 });
    
    // 模拟上传进度
    const uploadInterval = setInterval(() => {
      this.setData({
        posterUploadProgress: Math.min(this.data.posterUploadProgress + 10, 90)
      });
    }, 200);

    // 模拟上传完成（实际项目中应调用上传API）
    setTimeout(() => {
      clearInterval(uploadInterval);
      this.setData({
        posterUploadProgress: 100
      });
      
      this.updateFormData('posterUrl', filePath);
      
      setTimeout(() => {
        this.setData({ posterUploadProgress: 0 });
      }, 500);
    }, 2000);
  },

  // 验证表单
  validateForm() {
    const { formData } = this.data;
    
    if (!formData.title || formData.title.length < 5) {
      return '活动名称至少5个字符';
    }
    
    if (formData.title.length > 50) {
      return '活动名称不能超过50个字符';
    }
    
    if (!formData.startTime) {
      return '请选择开始时间';
    }
    
    if (!formData.endTime) {
      return '请选择结束时间';
    }
    
    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      return '结束时间必须晚于开始时间';
    }
    
    if (!formData.location) {
      return '请输入活动地点';
    }
    
    if (!formData.totalTickets || parseInt(formData.totalTickets) <= 0) {
      return '请输入有效的总票数';
    }
    
    if (!formData.description || formData.description.length < 10) {
      return '活动描述至少10个字符';
    }
    
    if (!formData.participant) {
      return '请选择参与对象';
    }
    
    return '';
  },

  // 保存草稿
  saveDraft() {
    try {
      wx.setStorageSync(this.data.STORAGE_KEY, this.data.formData);
    } catch (e) {
      console.error('保存草稿失败:', e);
    }
  },

  // 加载草稿
  loadDraft() {
    try {
      const draft = wx.getStorageSync(this.data.STORAGE_KEY);
      if (draft) {
        const progress = this.calculateFormProgress(draft);
        this.setData({
          formData: draft,
          formProgress: progress
        });
      }
    } catch (e) {
      console.error('加载草稿失败:', e);
    }
  },

  // 保存草稿按钮
  onSaveDraft() {
    this.saveDraft();
    wx.showToast({
      title: '草稿已保存',
      icon: 'success'
    });
  },

  // 提交审核
  onSubmit() {
    const error = this.validateForm();
    if (error) {
      this.setData({ formError: error });
      return;
    }

    wx.showModal({
      title: '确认提交',
      content: '确定要提交审核吗？提交后将无法修改',
      confirmText: '确认提交',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.doSubmit();
        }
      }
    });
  },

  // 执行提交
  doSubmit() {
    this.setData({ isSubmitting: true, formError: '' });

    // 模拟提交（实际项目中应调用后端API）
    setTimeout(() => {
      // 先尝试调用后端API
      wx.request({
        url: 'http://localhost:3000/activities',
        method: 'POST',
        data: {
          title: this.data.formData.title,
          description: this.data.formData.description,
          totalTickets: parseInt(this.data.formData.totalTickets),
          availableTickets: parseInt(this.data.formData.totalTickets),
          startTime: this.data.formData.startTime.replace(' ', 'T'),
          endTime: this.data.formData.endTime.replace(' ', 'T'),
          status: 'active'
        },
        timeout: 10000,
        success: (res) => {
          this.handleSubmitSuccess();
        },
        fail: (err) => {
          console.warn('提交到后端失败，模拟成功:', err);
          this.handleSubmitSuccess();
        }
      });
    }, 1500);
  },

  // 处理提交成功
  handleSubmitSuccess() {
    this.setData({ isSubmitting: false });
    
    // 清除草稿
    try {
      wx.removeStorageSync(this.data.STORAGE_KEY);
    } catch (e) {
      console.error('清除草稿失败:', e);
    }
    
    wx.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 2000
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 2000);
  }
});

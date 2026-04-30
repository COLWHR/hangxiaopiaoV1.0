Page({
  data: {
    activity: {},
    canBook: false,
    bookButtonText: '抢票',
    countdown: {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      hoursFormatted: '00',
      minutesFormatted: '00',
      secondsFormatted: '00'
    },
    isCounting: false,
    countdownTitle: '',
    hasAvailableTickets: false,
    useMockData: false
  },

  onLoad(options) {
    const activityId = options.id;
    this.getActivityDetail(activityId);
  },

  getActivityDetail(activityId) {
    wx.showLoading({
      title: '加载活动详情...',
    });

    // 先尝试从后端获取
    wx.request({
      url: `http://localhost:3000/activities/${activityId}`,
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data) {
          const activity = this.formatActivity(res.data);
          this.setData({
            activity: activity,
            canBook: this.checkCanBook(activity),
            bookButtonText: this.getBookButtonText(activity),
            hasAvailableTickets: activity.availableTickets > 0,
            useMockData: false
          });
          this.startCountdown();
        } else {
          this.useMockActivityData(activityId);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.warn('获取活动详情失败，使用模拟数据:', err);
        this.useMockActivityData(activityId);
      }
    });
  },

  // 格式化活动数据
  formatActivity(activity) {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      image: activity.qrCodeUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=track%20and%20field%20athletes%20running%20race%20competition%20stadium%20sports%20event%20dynamic%20action%20high%20quality%20wide%20angle&image_size=landscape_16_9',
      totalTickets: activity.totalTickets,
      availableTickets: activity.availableTickets,
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: '体育馆',
      status: activity.status,
      rules: [
        '每个学生限抢1张票',
        '抢票成功后请在活动当天凭票入场',
        '门票不得转让或倒卖',
        '如有特殊情况无法参加，请提前24小时取消'
      ]
    };
  },

  // 使用模拟数据
  useMockActivityData(activityId) {
    const mockActivity = {
      id: activityId,
      title: '2026春季运动会',
      description: '沈阳航空航天大学2026年春季运动会，包含田径、球类等多个项目，欢迎全校师生积极参与！',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=track%20and%20field%20athletes%20running%20race%20competition%20stadium%20sports%20event%20dynamic%20action%20high%20quality%20wide%20angle&image_size=landscape_16_9',
      totalTickets: 500,
      availableTickets: 120,
      startTime: '2026-04-20 09:00:00',
      endTime: '2026-04-30 23:59:59',
      location: '体育馆',
      status: 'active',
      rules: [
        '每个学生限抢1张票',
        '抢票成功后请在活动当天凭票入场',
        '门票不得转让或倒卖',
        '如有特殊情况无法参加，请提前24小时取消'
      ]
    };

    this.setData({
      activity: mockActivity,
      canBook: this.checkCanBook(mockActivity),
      bookButtonText: this.getBookButtonText(mockActivity),
      hasAvailableTickets: mockActivity.availableTickets > 0,
      useMockData: true
    });

    this.startCountdown();
    
    wx.showToast({
      title: '使用模拟数据展示',
      icon: 'none',
      duration: 2000
    });
  },

  checkCanBook(activity) {
    const now = new Date();
    // 修复iOS日期格式问题：将"-"替换为"/"
    const startTimeStr = activity.startTime.replace(/-/g, '/');
    const endTimeStr = activity.endTime.replace(/-/g, '/');
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);
    return activity.status === 'active' && 
           activity.availableTickets > 0 && 
           now >= startTime && 
           now <= endTime;
  },

  getBookButtonText(activity) {
    if (activity.status !== 'active') {
      return '活动未开始';
    } else if (activity.availableTickets <= 0) {
      return '已售罄';
    } else {
      return '立即抢票';
    }
  },

  startCountdown() {
    const now = new Date();
    // 修复iOS日期格式问题：将"-"替换为"/"
    const endTimeStr = this.data.activity.endTime.replace(/-/g, '/');
    const startTimeStr = this.data.activity.startTime.replace(/-/g, '/');
    const endTime = new Date(endTimeStr);
    const startTime = new Date(startTimeStr);

    if (now < startTime) {
      // 抢票尚未开始，倒计时到开始时间
      this.updateCountdown(startTime);
    } else if (now < endTime) {
      // 抢票进行中，倒计时到结束时间
      this.updateCountdown(endTime);
    } else {
      // 抢票已结束
      this.setData({
        countdown: {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          hoursFormatted: '00',
          minutesFormatted: '00',
          secondsFormatted: '00'
        },
        isCounting: false
      });
    }
  },

  updateCountdown(targetTime) {
    const now = new Date();
    // 修复iOS日期格式问题：将"-"替换为"/"
    const startTimeStr = this.data.activity.startTime.replace(/-/g, '/');
    const startTime = new Date(startTimeStr);
    
    // 设置倒计时标题
    let title = '';
    if (now < startTime) {
      title = '距离抢票开始还有';
    } else {
      title = '距离抢票结束还有';
    }
    
    this.setData({ 
      isCounting: true,
      countdownTitle: title
    });

    const update = () => {
      const now = new Date();
      const diff = targetTime - now;

      if (diff <= 0) {
        this.setData({
          countdown: {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            hoursFormatted: '00',
            minutesFormatted: '00',
            secondsFormatted: '00'
          },
          isCounting: false
        });
        // 重新检查是否可以抢票
        this.setData({
          canBook: this.checkCanBook(this.data.activity),
          bookButtonText: this.getBookButtonText(this.data.activity),
          hasAvailableTickets: this.data.activity.availableTickets > 0
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // 格式化数字，补零
      const hoursFormatted = hours < 10 ? '0' + hours : hours.toString();
      const minutesFormatted = minutes < 10 ? '0' + minutes : minutes.toString();
      const secondsFormatted = seconds < 10 ? '0' + seconds : seconds.toString();

      this.setData({
        countdown: {
          days,
          hours,
          minutes,
          seconds,
          hoursFormatted,
          minutesFormatted,
          secondsFormatted
        }
      });

      setTimeout(update, 1000);
    };

    update();
  },

  bookTicket() {
    if (!this.data.canBook) return;

    const activityId = this.data.activity.id;
    const userId = 1;

    wx.showLoading({
      title: '正在抢票...',
    });

    // 先尝试调用后端API
    wx.request({
      url: 'http://localhost:3000/tickets/book',
      method: 'POST',
      data: {
        activityId: activityId,
        userId: userId
      },
      timeout: 10000,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 || res.statusCode === 201) {
          wx.showToast({
            title: '抢票成功',
            icon: 'success'
          });
          // 跳转到票根页面
          wx.navigateTo({
            url: `/pages/ticket/ticket?ticketNumber=${res.data.ticketNumber}`
          });
        } else {
          this.handleBookError(res);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.warn('抢票API调用失败:', err);
        this.handleBookError(err);
      }
    });
  },

  // 处理抢票错误或降级方案
  handleBookError(error) {
    const errorMsg = error.message || '抢票失败，请稍后重试';
    
    wx.showModal({
      title: '提示',
      content: `${errorMsg}\n\n是否使用模拟抢票？`,
      confirmText: '模拟抢票',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.mockBookTicket();
        }
      }
    });
  },

  // 模拟抢票
  mockBookTicket() {
    wx.showLoading({
      title: '正在模拟抢票...',
    });

    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '模拟抢票成功',
        icon: 'success'
      });
      // 跳转到票根页面
      wx.navigateTo({
        url: `/pages/ticket/ticket?ticketNumber=T${Date.now()}`
      });
    }, 1000);
  }
});
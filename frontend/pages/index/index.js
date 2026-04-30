Page({
  data: {
    banners: [
      {
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=university%20sports%20meeting%20opening%20ceremony%20grand%20stadium%20athletes%20marching%20colorful%20flags%20professional%20photography%20high%20quality&image_size=landscape_16_9',
        title: '沈阳航空航天大学2026年春季运动会'
      },
      {
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=campus%20music%20festival%20concert%20stage%20lights%20crowd%20energy%20vibrant%20colorful%20night%20event&image_size=landscape_16_9',
        title: '校园文化艺术节'
      },
      {
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=aerospace%20science%20exhibition%20aircraft%20models%20space%20technology%20museum%20modern%20interior%20professional%20display&image_size=landscape_16_9',
        title: '航空航天学术论坛'
      }
    ],
    hotActivities: [],
    announcements: [
      {
        id: 1,
        title: '关于2026春季运动会抢票的通知',
        date: '2026-04-10'
      },
      {
        id: 2,
        title: '校园歌手大赛报名开始',
        date: '2026-04-08'
      },
      {
        id: 3,
        title: '航空航天科普展延期公告',
        date: '2026-04-05'
      }
    ],
    useMockData: false
  },

  onLoad() {
    this.getActivities();
  },

  getActivities() {
    console.log('获取活动列表');
    
    // 先尝试从后端获取
    wx.request({
      url: 'http://localhost:3000/activities',
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.length > 0) {
          this.setData({
            hotActivities: this.formatActivities(res.data),
            useMockData: false
          });
        } else {
          this.useMockActivities();
        }
      },
      fail: (err) => {
        console.warn('获取活动列表失败，使用模拟数据:', err);
        this.useMockActivities();
      }
    });
  },

  // 格式化活动数据
  formatActivities(activities) {
    return activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=event%20concert%20performance%20stage%20audience%20professional%20photography&image_size=landscape_4_3',
      startTime: this.formatDate(activity.startTime),
      location: '体育馆',
      availableTickets: activity.availableTickets,
      status: activity.status
    }));
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr.replace(/-/g, '/'));
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  // 使用模拟数据
  useMockActivities() {
    const mockActivities = [
      {
        id: 1,
        title: '2026春季运动会',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=track%20and%20field%20athletes%20running%20race%20competition%20stadium%20sports%20event%20dynamic%20action%20high%20quality&image_size=landscape_4_3',
        startTime: '2026-04-20 09:00',
        location: '体育馆',
        availableTickets: 120,
        status: 'active'
      },
      {
        id: 2,
        title: '校园歌手大赛',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=singer%20performing%20on%20stage%20microphone%20spotlights%20concert%20live%20performance%20music%20festival&image_size=landscape_4_3',
        startTime: '2026-04-25 19:00',
        location: '大礼堂',
        availableTickets: 85,
        status: 'active'
      },
      {
        id: 3,
        title: '航空航天科普展',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=airplane%20model%20exhibition%20space%20shuttle%20sci%20tech%20museum%20exhibit%20modern%20display&image_size=landscape_4_3',
        startTime: '2026-04-15 10:00',
        location: '科技楼',
        availableTickets: 0,
        status: 'ended'
      }
    ];

    this.setData({
      hotActivities: mockActivities,
      useMockData: true
    });
  },

  goToActivity(e) {
    const activityId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/activity/activity?id=${activityId}`
    });
  },

  goToMoreActivities() {
    wx.switchTab({
      url: '/pages/booking/booking'
    });
  },

  onAnnouncementTap(e) {
    const announcementId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '查看公告详情',
      icon: 'none'
    });
  }
});
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
    hotActivities: [
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
    ],
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
    ]
  },

  onLoad() {
    // 模拟获取活动数据
    this.getActivities();
  },

  getActivities() {
    // 实际项目中这里会调用后端API
    // 由于后端服务可能未启动，使用模拟数据
    console.log('获取活动列表');
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
    // 模拟公告详情查看
    wx.showToast({
      title: '查看公告详情',
      icon: 'none'
    });
  }
});
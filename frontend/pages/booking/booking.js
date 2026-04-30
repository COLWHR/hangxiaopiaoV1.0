Page({
  data: {
    activities: [],
    activeFilter: '全部',
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
            activities: this.formatActivities(res.data),
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
      },
      {
        id: 4,
        title: '学术讲座：人工智能与未来',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=academic%20lecture%20conference%20hall%20speaker%20audience%20university%20seminar%20professional%20presentation&image_size=landscape_4_3',
        startTime: '2026-04-18 14:00',
        location: '图书馆报告厅',
        availableTickets: 50,
        status: 'active'
      },
      {
        id: 5,
        title: '社团招新大会',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=university%20club%20fair%20student%20organization%20recruitment%20colorful%20booths%20campus%20life&image_size=landscape_4_3',
        startTime: '2026-04-12 10:00',
        location: '大学生活动中心',
        availableTickets: 0,
        status: 'ended'
      }
    ];

    this.setData({
      activities: mockActivities,
      useMockData: true
    });
  },

  goToActivity(e) {
    const activityId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/activity/activity?id=${activityId}`
    });
  },

  onFilterTap(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      activeFilter: filter
    });
    wx.showToast({
      title: `筛选 ${filter} 活动`,
      icon: 'none'
    });
  }
});
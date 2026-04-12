Page({
  data: {
    activities: [
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
    ],
    activeFilter: '全部'
  },

  onLoad() {
    // 模拟获取活动数据
    this.getActivities();
  },

  getActivities() {
    // 实际项目中这里会调用后端API
    console.log('获取活动列表');
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
    // 模拟筛选效果
    wx.showToast({
      title: `筛选 ${filter} 活动`,
      icon: 'none'
    });
    // 这里可以根据筛选条件过滤活动列表
  }
});
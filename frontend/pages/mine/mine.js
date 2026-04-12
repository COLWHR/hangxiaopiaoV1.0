Page({
  data: {
    userInfo: {
      avatarUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20male%20student%20portrait%20friendly%20smile%20natural%20lighting%20professional%20headshot&image_size=square',
      nickname: '张三',
      studentId: '20230101'
    },
    tickets: [
      {
        id: 1,
        activityTitle: '2026春季运动会',
        time: '2026-04-20 09:00',
        location: '体育馆',
        seatNumber: 'A区12排34座',
        ticketNumber: 'T20260420001',
        qrCode: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=QR%20code%20ticket%20validation%20scan%20black%20and%20white%20high%20contrast%20square%20pattern&image_size=square',
        status: 'valid'
      },
      {
        id: 2,
        activityTitle: '校园歌手大赛',
        time: '2026-04-25 19:00',
        location: '大礼堂',
        seatNumber: 'B区5排12座',
        ticketNumber: 'T20260425001',
        qrCode: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=QR%20code%20ticket%20validation%20scan%20black%20and%20white%20high%20contrast%20square%20pattern&image_size=square',
        status: 'valid'
      },
      {
        id: 3,
        activityTitle: '航空航天科普展',
        time: '2026-04-15 10:00',
        location: '科技楼',
        seatNumber: 'C区3排8座',
        ticketNumber: 'T20260415001',
        qrCode: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=QR%20code%20ticket%20validation%20scan%20black%20and%20white%20high%20contrast%20square%20pattern&image_size=square',
        status: 'used'
      }
    ]
  },

  onLoad() {
    // 模拟获取用户信息和票根数据
    this.getUserInfo();
    this.getTickets();
  },

  getUserInfo() {
    // 实际项目中这里会调用微信登录API获取用户信息
    console.log('获取用户信息');
  },

  getTickets() {
    // 实际项目中这里会调用后端API获取用户的票根
    console.log('获取票根列表');
  },

  onMenuTap(e) {
    const menu = e.currentTarget.dataset.menu;
    // 处理菜单点击事件
    console.log('点击菜单:', menu);
  },

  onEditProfile() {
    // 编辑资料
    console.log('编辑资料');
  },

  onViewAllTickets() {
    // 查看全部票根
    console.log('查看全部票根');
  }
});
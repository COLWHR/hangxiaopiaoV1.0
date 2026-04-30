Page({
  data: {
    userInfo: {
      avatarUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20male%20student%20portrait%20friendly%20smile%20natural%20lighting%20professional%20headshot&image_size=square',
      nickname: '张三',
      studentId: '20230101'
    },
    tickets: [],
    useMockData: false
  },

  onLoad() {
    this.getUserInfo();
    this.getTickets();
  },

  onShow() {
    // 每次显示页面时重新获取票根列表
    this.getTickets();
  },

  getUserInfo() {
    console.log('获取用户信息');
  },

  getTickets() {
    console.log('获取票根列表');
    const userId = 1;

    // 先尝试从后端获取
    wx.request({
      url: `http://localhost:3000/tickets/user/${userId}`,
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            tickets: this.formatTickets(res.data),
            useMockData: false
          });
        } else {
          this.useMockTickets();
        }
      },
      fail: (err) => {
        console.warn('获取票根列表失败，使用模拟数据:', err);
        this.useMockTickets();
      }
    });
  },

  // 格式化票根数据
  formatTickets(tickets) {
    return tickets.map(ticket => ({
      id: ticket.id,
      activityTitle: ticket.activity ? ticket.activity.title : '活动',
      time: this.formatDate(ticket.activity ? ticket.activity.startTime : ''),
      location: '体育馆',
      seatNumber: ticket.seatNumber,
      ticketNumber: ticket.ticketNumber,
      qrCode: ticket.ticketStub ? ticket.ticketStub.qrCodeUrl : '',
      status: ticket.status
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
  useMockTickets() {
    const mockTickets = [
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
    ];

    this.setData({
      tickets: mockTickets,
      useMockData: true
    });
  },

  onMenuTap(e) {
    const menu = e.currentTarget.dataset.menu;
    console.log('点击菜单:', menu);
  },

  onEditProfile() {
    console.log('编辑资料');
  },

  onViewAllTickets() {
    console.log('查看全部票根');
  },

  // 跳转到活动发布页面
  onGoToAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin'
    });
  },

  // 点击票根跳转到详情页
  onTicketTap(e) {
    const ticketNumber = e.currentTarget.dataset.ticketNumber;
    wx.navigateTo({
      url: `/pages/ticket/ticket?ticketNumber=${ticketNumber}`
    });
  }
});
Page({
  data: {
    ticket: {},
    useMockData: false
  },

  onLoad(options) {
    const ticketNumber = options.ticketNumber;
    this.getTicketDetail(ticketNumber);
  },

  getTicketDetail(ticketNumber) {
    wx.showLoading({
      title: '加载票根信息...',
    });

    // 先尝试从后端获取，如果失败则使用模拟数据
    wx.request({
      url: `http://localhost:3000/tickets/by-number/${ticketNumber}`,
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data) {
          this.setData({
            ticket: res.data,
            useMockData: false
          });
        } else {
          this.useMockTicketMockData(ticketNumber);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.warn('API请求失败，使用模拟数据:', err);
        this.useMockTicketMockData(ticketNumber);
      }
    });
  },

  // 使用模拟数据作为降级方案
  useMockTicketMockData(ticketNumber) {
    const mockTicket = {
      id: 1,
      ticketNumber: ticketNumber || 'T20260412001',
      seatNumber: 'A区12排34座',
      status: 'valid',
      activity: {
        id: 1,
        title: '2026春季运动会',
        description: '沈阳航空航天大学2026年春季运动会',
        startTime: '2026-04-20T09:00:00',
        location: '体育馆'
      },
      ticketStub: {
        qrCodeUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=QR%20code%20ticket%20validation%20scan%20black%20and%20white%20high%20contrast%20square%20pattern&image_size=square'
      }
    };

    this.setData({
      ticket: mockTicket,
      useMockData: true
    });

    wx.showToast({
      title: '使用模拟数据展示',
      icon: 'none',
      duration: 2000
    });
  }
});
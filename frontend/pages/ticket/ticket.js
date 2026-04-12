Page({
  data: {
    ticket: {}
  },

  onLoad(options) {
    const ticketNumber = options.ticketNumber;
    this.getTicketDetail(ticketNumber);
  },

  getTicketDetail(ticketNumber) {
    wx.showLoading({
      title: '加载票根信息...',
    });

    wx.request({
      url: `http://localhost:3000/tickets/by-number/${ticketNumber}`,
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          this.setData({
            ticket: res.data
          });
        } else {
          wx.showToast({
            title: '获取票根信息失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取票根信息失败:', err);
        wx.showToast({
          title: '获取票根信息失败',
          icon: 'none'
        });
      }
    });
  }
});
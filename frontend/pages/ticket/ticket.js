const { getApiUrl } = require('../../utils/api');
const { requestJson } = require('../../utils/request');
const { normalizeTicket } = require('../../utils/activity');

Page({
  data: {
    ticket: {
      activity: {},
      ticketStub: {},
    },
    isLoading: false,
  },

  onLoad(options) {
    this.ticketNumber = options.ticketNumber;
    this.loadTicketDetail(this.ticketNumber);
  },

  async loadTicketDetail(ticketNumber) {
    if (!ticketNumber) {
      wx.showToast({
        title: '票号不能为空',
        icon: 'none',
      });
      setTimeout(() => {
        wx.navigateBack({
          delta: 1,
        });
      }, 800);
      return;
    }

    this.setData({
      isLoading: true,
    });

    wx.showLoading({
      title: '加载票根信息...',
    });

    try {
      const response = await requestJson({
        url: getApiUrl(`/tickets/by-number/${ticketNumber}`),
        method: 'GET',
      });

      if (response.statusCode === 200 && response.data) {
        this.setData({
          ticket: normalizeTicket(response.data),
        });
        return;
      }

      throw new Error('票根不存在');
    } catch (error) {
      wx.showToast({
        title: error.message || '票根加载失败',
        icon: 'none',
      });
      setTimeout(() => {
        wx.navigateBack({
          delta: 1,
        });
      }, 800);
    } finally {
      wx.hideLoading();
      this.setData({
        isLoading: false,
      });
    }
  },
});

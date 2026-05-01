const { getApiUrl } = require('../../utils/api');
const { requestJson } = require('../../utils/request');
const { buildAnnouncements, normalizeActivity } = require('../../utils/activity');

Page({
  data: {
    banners: [],
    hotActivities: [],
    announcements: [],
    isLoading: false,
    hasLoaded: false,
  },

  onLoad() {
    this.loadActivities();
  },

  onShow() {
    this.loadActivities();
  },

  async loadActivities() {
    if (this.loadingActivities) {
      return;
    }

    this.loadingActivities = true;
    this.setData({
      isLoading: true,
    });

    try {
      const response = await requestJson({
        url: getApiUrl('/activities'),
        method: 'GET',
      });

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        const activities = response.data
          .map((activity) => normalizeActivity(activity))
          .sort((left, right) => {
            const leftTime = new Date(left.rawStartTime || left.startTime).getTime();
            const rightTime = new Date(right.rawStartTime || right.startTime).getTime();
            return (Number.isFinite(leftTime) ? leftTime : 0) - (Number.isFinite(rightTime) ? rightTime : 0);
          });
        const bookableActivities = activities.filter((activity) => activity.bookable);
        const visibleActivities = activities.filter((activity) => activity.status !== 'revoked');
        const bannerSource = visibleActivities.slice(0, 3);
        const hotSource = (bookableActivities.length > 0 ? bookableActivities : visibleActivities).slice(0, 4);

        this.setData({
          banners: bannerSource.map((activity) => ({
            id: activity.id,
            image: activity.coverImageUrl,
            title: activity.title,
            subtitle: activity.location,
          })),
          hotActivities: hotSource,
          announcements: buildAnnouncements(visibleActivities),
          hasLoaded: true,
        });
        return;
      }

      this.setData({
        banners: [],
        hotActivities: [],
        announcements: [],
        hasLoaded: true,
      });
    } catch (error) {
      this.setData({
        banners: [],
        hotActivities: [],
        announcements: [],
        hasLoaded: true,
      });
    } finally {
      this.setData({
        isLoading: false,
      });
      this.loadingActivities = false;
    }
  },

  goToActivity(e) {
    const activityId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/activity/activity?id=${activityId}`,
    });
  },

  goToMoreActivities() {
    wx.switchTab({
      url: '/pages/booking/booking',
    });
  },

  onAnnouncementTap(e) {
    const announcementId = e.currentTarget.dataset.id;
    const announcement = this.data.announcements.find((item) => item.id === announcementId);

    wx.showToast({
      title: announcement ? announcement.title : '查看公告详情',
      icon: 'none',
      duration: 1800,
    });
  },
});

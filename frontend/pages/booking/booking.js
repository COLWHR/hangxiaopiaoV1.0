const { getApiUrl } = require('../../utils/api');
const { requestJson } = require('../../utils/request');
const { normalizeActivity } = require('../../utils/activity');

Page({
  data: {
    activities: [],
    allActivities: [],
    activeFilter: 'all',
    isLoading: false,
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
        const filteredActivities = this.getFilteredActivities(activities, this.data.activeFilter);

        this.setData({
          allActivities: activities,
          activities: filteredActivities,
        });
        return;
      }

      this.setData({
        activities: [],
        allActivities: [],
      });
    } catch (error) {
      this.setData({
        activities: [],
        allActivities: [],
      });
    } finally {
      this.setData({
        isLoading: false,
      });
      this.loadingActivities = false;
    }
  },

  getFilteredActivities(allActivities, activeFilter) {
    const now = Date.now();

    let activities = allActivities.filter((activity) => activity.status !== 'revoked');
    if (activeFilter === 'active') {
      activities = activities.filter((activity) => activity.bookable);
    } else if (activeFilter === 'ended') {
      activities = activities.filter((activity) => {
        const endTime = new Date(activity.rawEndTime || activity.endTime).getTime();
        return activity.status === 'ended' || (Number.isFinite(endTime) && endTime < now);
      });
    }

    return activities;
  },

  applyFilter() {
    const { allActivities, activeFilter } = this.data;
    this.setData({
      activities: this.getFilteredActivities(allActivities, activeFilter),
    });
  },

  goToActivity(e) {
    const activityId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/activity/activity?id=${activityId}`,
    });
  },

  onFilterTap(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      activeFilter: filter,
    });
    this.applyFilter();
  },
});

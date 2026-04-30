const { getCurrentUser, normalizeUser } = require('./utils/user');

App({
  globalData: {
    currentUser: null,
  },

  onLaunch() {
    this.globalData.currentUser = getCurrentUser();
  },

  setCurrentUser(user) {
    this.globalData.currentUser = normalizeUser(user);
  },

  clearCurrentUser() {
    this.globalData.currentUser = null;
  },
});

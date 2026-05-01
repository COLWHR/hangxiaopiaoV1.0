const { getCurrentUser, normalizeUser } = require('./utils/user');
const { getCurrentRole } = require('./utils/role');

App({
  globalData: {
    currentUser: null,
    currentRole: '',
  },

  onLaunch() {
    this.globalData.currentUser = getCurrentUser();
    this.globalData.currentRole = getCurrentRole();
  },

  setCurrentUser(user) {
    this.globalData.currentUser = normalizeUser(user);
  },

  setCurrentRole(role) {
    this.globalData.currentRole = String(role || '').trim();
  },

  clearCurrentUser() {
    this.globalData.currentUser = null;
  },
});

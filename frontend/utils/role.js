const STORAGE_KEY = 'current_role';

function getCurrentRole() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || '';
  } catch (error) {
    return '';
  }
}

function setCurrentRole(role) {
  const normalized = String(role || '').trim();
  wx.setStorageSync(STORAGE_KEY, normalized);
  return normalized;
}

function clearCurrentRole() {
  wx.removeStorageSync(STORAGE_KEY);
}

module.exports = {
  STORAGE_KEY,
  clearCurrentRole,
  getCurrentRole,
  setCurrentRole,
};

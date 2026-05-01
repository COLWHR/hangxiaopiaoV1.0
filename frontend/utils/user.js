const { getApiUrl } = require('./api');
const STORAGE_KEY = 'current_user';
const DEFAULT_AVATAR_URL =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=campus%20student%20portrait%20friendly%20smile%20clean%20blue%20background%20professional%20avatar&image_size=square';

function normalizeUser(user = {}) {
  const { passwordHash, ...safeUser } = user;
  const name = (safeUser.name || '').trim();
  const studentId = (safeUser.studentId || '').trim();
  const nickname = (safeUser.nickname || '').trim() || name || studentId || '航小票用户';
  const college = (safeUser.college || '').trim();
  const className = (safeUser.className || '').trim();
  const phone = (safeUser.phone || '').trim();

  return {
    ...safeUser,
    name,
    studentId,
    nickname,
    college,
    className,
    phone,
    avatarUrl: (safeUser.avatarUrl || '').trim() || DEFAULT_AVATAR_URL,
    profileCompleted: Boolean(name && studentId && college && className && phone),
  };
}

function getCurrentUser() {
  try {
    const app = typeof getApp === 'function' ? getApp() : null;
    const globalUser = app && app.globalData ? app.globalData.currentUser : null;
    if (globalUser) {
      return normalizeUser(globalUser);
    }

    const storedUser = wx.getStorageSync(STORAGE_KEY);
    return storedUser ? normalizeUser(storedUser) : null;
  } catch (error) {
    return null;
  }
}

function setCurrentUser(user) {
  const normalized = normalizeUser(user);
  wx.setStorageSync(STORAGE_KEY, normalized);

  if (typeof getApp === 'function') {
    const app = getApp();
    app.globalData.currentUser = normalized;
  }

  return normalized;
}

function clearCurrentUser() {
  wx.removeStorageSync(STORAGE_KEY);

  if (typeof getApp === 'function') {
    const app = getApp();
    app.globalData.currentUser = null;
  }
}

module.exports = {
  DEFAULT_AVATAR_URL,
  STORAGE_KEY,
  clearCurrentUser,
  getApiUrl,
  getCurrentUser,
  normalizeUser,
  setCurrentUser,
};

const STORAGE_KEY = 'current_user';
const API_BASE_URL = 'http://localhost:3000';
const DEFAULT_AVATAR_URL =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=campus%20student%20portrait%20friendly%20smile%20clean%20blue%20background%20professional%20avatar&image_size=square';

function normalizeUser(user = {}) {
  const name = (user.name || '').trim();
  const studentId = (user.studentId || '').trim();
  const nickname = (user.nickname || '').trim() || name || studentId || '航小票用户';
  const college = (user.college || '').trim();
  const className = (user.className || '').trim();
  const phone = (user.phone || '').trim();

  return {
    ...user,
    name,
    studentId,
    nickname,
    college,
    className,
    phone,
    avatarUrl: (user.avatarUrl || '').trim() || DEFAULT_AVATAR_URL,
    profileCompleted: Boolean(name && studentId && college && className && phone),
  };
}

function getCurrentUser() {
  try {
    const app = typeof getApp === 'function' ? getApp() : null;
    const globalUser = app?.globalData?.currentUser;
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

function getApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

module.exports = {
  API_BASE_URL,
  DEFAULT_AVATAR_URL,
  STORAGE_KEY,
  clearCurrentUser,
  getApiUrl,
  getCurrentUser,
  normalizeUser,
  setCurrentUser,
};

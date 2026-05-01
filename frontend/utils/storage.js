function getStorage(key, fallbackValue = null) {
  try {
    const value = wx.getStorageSync(key);
    return value === '' || value === undefined ? fallbackValue : value;
  } catch (error) {
    return fallbackValue;
  }
}

function setStorage(key, value) {
  wx.setStorageSync(key, value);
  return value;
}

function removeStorage(key) {
  wx.removeStorageSync(key);
}

module.exports = {
  getStorage,
  removeStorage,
  setStorage,
};

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const API_BASE_URL_STORAGE_KEY = 'publisher_api_base_url';

function normalizeApiBaseUrl(url) {
  return String(url || '')
    .trim()
    .replace(/\/+$/, '');
}

function getStoredApiBaseUrl() {
  try {
    return normalizeApiBaseUrl(wx.getStorageSync(API_BASE_URL_STORAGE_KEY));
  } catch (error) {
    return '';
  }
}

function setApiBaseUrl(url) {
  const normalized = normalizeApiBaseUrl(url);
  if (!normalized) {
    return getApiBaseUrl();
  }

  wx.setStorageSync(API_BASE_URL_STORAGE_KEY, normalized);
  return normalized;
}

function clearApiBaseUrl() {
  wx.removeStorageSync(API_BASE_URL_STORAGE_KEY);
}

function getApiBaseUrl() {
  return getStoredApiBaseUrl() || DEFAULT_API_BASE_URL;
}

function getApiUrl(path) {
  const normalizedPath = String(path || '').startsWith('/') ? String(path) : `/${String(path || '')}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

function requestJson(options = {}) {
  return new Promise((resolve, reject) => {
    const method = String(options.method || 'GET').toUpperCase();
    const header = {
      ...(method === 'GET' ? {} : { 'content-type': 'application/json' }),
      ...(options.header || {}),
    };

    wx.request({
      ...options,
      method,
      header,
      timeout: options.timeout ?? 8000,
      success: resolve,
      fail: reject,
    });
  });
}

module.exports = {
  API_BASE_URL: DEFAULT_API_BASE_URL,
  API_BASE_URL_STORAGE_KEY,
  clearApiBaseUrl,
  getApiBaseUrl,
  getApiUrl,
  requestJson,
  setApiBaseUrl,
};

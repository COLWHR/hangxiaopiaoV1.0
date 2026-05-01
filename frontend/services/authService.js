const { setStorage, getStorage, removeStorage } = require('../utils/storage');
const { getApiUrl, requestJson } = require('../utils/api');

const SESSION_KEY = 'publisher_admin_session';

function signIn(account, password) {
  return requestJson({
    url: getApiUrl('/admin/login'),
    method: 'POST',
    data: {
      account,
      password,
    },
  })
    .then((response) => {
      if (response.statusCode === 200 && response.data && response.data.data) {
        const session = response.data.data;
        setStorage(SESSION_KEY, session);
        return session;
      }

      throw new Error((response.data && response.data.message) || '登录失败');
    })
    .catch((error) => {
      throw new Error(error.message || '无法连接后端，登录失败');
    });
}

function getSession() {
  return getStorage(SESSION_KEY, null);
}

function signOut() {
  removeStorage(SESSION_KEY);
}

module.exports = {
  signIn,
  getSession,
  signOut,
};

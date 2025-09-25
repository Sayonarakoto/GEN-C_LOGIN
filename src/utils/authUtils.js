let _authLogoutCallback = null;

export const setAuthLogoutCallback = (callback) => {
  _authLogoutCallback = callback;
};

export const getAuthLogoutCallback = () => {
  return _authLogoutCallback;
};
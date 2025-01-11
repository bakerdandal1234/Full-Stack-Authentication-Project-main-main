import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = null;
const observers = [];

export const addTokenObserver = (observer) => {
  observers.push(observer);
};

export const removeTokenObserver = (observer) => {
  const index = observers.indexOf(observer);
  if (index > -1) {
    observers.splice(index, 1);
  }
};

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token;
  observers.forEach((observer) => observer(token));
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (accessToken && config.url !== '/refresh') {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const response = await api.post('/refresh');
        const { token } = response.data;

        if (token) {
          setAccessToken(token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } else {
          setAccessToken(null);
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;


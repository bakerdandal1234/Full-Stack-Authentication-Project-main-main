
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

let accessToken = null
const observers = []

export const addTokenObserver = (observer) => {
  observers.push(observer)
}

export const removeTokenObserver = (observer) => {
  const index = observers.indexOf(observer)
  if (index > -1) {
    observers.splice(index, 1)
  }
}

export const getAccessToken = () => accessToken

export const setAccessToken = (token) => {
  accessToken = token
  observers.forEach((observer) => observer(token))
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // إضافة توكن CSRF من الكوكي
    const cookies = document.cookie.split(';')
    const xsrfToken = cookies
      .find(cookie => cookie.trim().startsWith('XSRF-TOKEN='))
      ?.split('=')[1]

    if (xsrfToken) {
      config.headers['x-csrf-token'] = xsrfToken
    }

    // إضافة توكن المصادقة
    if (accessToken && config.url !== '/refresh') {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    console.log('Request headers:', config.headers)
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request was for refresh token, reject immediately
    if (
      !error.response || 
      error.response.status !== 401 || 
      originalRequest.url === '/refresh' ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // If refresh is in progress, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await api.post('/refresh');
      const newToken = refreshResponse.data.accessToken;
      
      setAccessToken(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      
      processQueue(null, newToken);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      setAccessToken(null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api

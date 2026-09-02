import axios from 'axios';

// Determine API base URL:
// 1. Runtime override via window.__AMBROSIA_API_URL__ (if injected)
// 2. Build-time override via VITE_API_URL
// 3. Fallback to '/api/v1' relative path.
// When deployed on Docker/production, Nginx proxies /api/ to backend:8000.
// In Vite dev, Vite dev server proxies /api to localhost:8000.
// This guarantees that regardless of deployment domain, IP, or port,
// requests NEVER mistakenly target the user's client localhost!
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.__AMBROSIA_API_URL__) {
    return window.__AMBROSIA_API_URL__.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '') {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  return '/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to dynamically attach stored JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ambrosia_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for centralized error management
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (localStorage.getItem('ambrosia_token')) {
        localStorage.removeItem('ambrosia_token');
        localStorage.removeItem('ambrosia_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  merchantLogin: (credentials) => apiClient.post('/merchants/login', credentials),
  getMe: () => apiClient.get('/users/me'),
  updateLocation: (locData) => apiClient.patch('/users/me/location', locData),
};

// Geospatial & Merchant Services
export const merchantService = {
  getNearby: (lat, lng, radius = 10.0) =>
    apiClient.get('/merchants/nearby', { params: { lat, lng, radius } }),
  getAll: (params = {}) => apiClient.get('/merchants', { params }),
  getById: (id, lat, lng) => apiClient.get(`/merchants/${id}`, { params: { lat, lng } }),
  onboard: (merchantData) => apiClient.post('/merchants/onboard', merchantData),
  updateCoordinates: (id, coords) =>
    apiClient.patch(`/merchants/${id}/coordinates`, coords),
};

// Product & Catalog Services
export const productService = {
  getProducts: (params = {}) => apiClient.get('/products', { params }),
  getProductById: (id, params = {}) => apiClient.get(`/products/${id}`, { params }),
  getMerchantProducts: (merchantId, age) =>
    apiClient.get(`/merchants/${merchantId}/products`, { params: { user_age: age } }),
  updateStock: (merchantId, productId, inStock) =>
    apiClient.patch(`/merchants/${merchantId}/products/${productId}/stock`, { in_stock: inStock }),
};

// Order & Fulfillment Services
export const orderService = {
  createOrder: (orderData) => apiClient.post('/orders', orderData),
  getMyOrders: () => apiClient.get('/orders/my-orders'),
  getOrderById: (orderId) => apiClient.get(`/orders/${orderId}`),
  updateStatus: (orderId, status) =>
    apiClient.patch(`/orders/${orderId}/status`, { status }),
  getMerchantOrders: (merchantId) =>
    apiClient.get(`/orders/merchant/${merchantId}`),
};

// System & Geolocation Services
export const systemService = {
  getDistricts: () => apiClient.get('/districts'),
  getHealth: () => apiClient.get('/health'),
  autoDetectGps: (districtHint) =>
    apiClient.get('/geo/auto-detect', { params: districtHint ? { district_hint: districtHint } : {} }),
  getClosestDistrict: (lat, lng) =>
    apiClient.get('/geo/closest-district', { params: { lat, lng } }),
};

export default apiClient;

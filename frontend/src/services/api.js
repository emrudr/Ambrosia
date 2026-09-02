import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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

// System Services
export const systemService = {
  getDistricts: () => apiClient.get('/districts'),
  getHealth: () => apiClient.get('/health'),
};

export default apiClient;

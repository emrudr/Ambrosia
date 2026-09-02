const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = {
  // Auth
  async registerUser(userData) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async loginUser(credentials) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async registerMerchant(merchantData) {
    const res = await fetch(`${API_BASE_URL}/auth/merchant/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merchantData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Merchant onboarding failed');
    }
    return res.json();
  },

  async loginMerchant(credentials) {
    const res = await fetch(`${API_BASE_URL}/auth/merchant/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Merchant login failed');
    }
    return res.json();
  },

  // Districts
  async getDistricts() {
    const res = await fetch(`${API_BASE_URL}/districts`);
    if (!res.ok) throw new Error('Failed to fetch districts');
    return res.json();
  },

  // Merchants
  async getMerchants({ lat, lng, city, district, onlyWithinRadius = false } = {}) {
    const params = new URLSearchParams();
    if (lat !== undefined && lat !== null) params.append('lat', lat);
    if (lng !== undefined && lng !== null) params.append('lng', lng);
    if (city) params.append('city', city);
    if (district) params.append('district', district);
    if (onlyWithinRadius) params.append('only_within_radius', 'true');

    const res = await fetch(`${API_BASE_URL}/merchants?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch merchants');
    return res.json();
  },

  async getMerchantOrders(merchantId, token) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/merchants/${merchantId}/orders`, { headers });
    if (!res.ok) throw new Error('Failed to fetch merchant orders');
    return res.json();
  },

  async updateOrderStatus(orderId, status, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/merchants/orders/${orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update order status');
    }
    return res.json();
  },

  async addMerchantProduct(merchantId, productData, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/merchants/${merchantId}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to add product');
    }
    return res.json();
  },

  async toggleProductStock(merchantId, productId, inStock, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/merchants/${merchantId}/products/${productId}/stock`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ in_stock: inStock }),
    });
    if (!res.ok) throw new Error('Failed to update stock status');
    return res.json();
  },

  // Products
  async getProducts({ lat, lng, category, subCategory, merchantId, userAge, search, onlyWithinRadius = false, token } = {}) {
    const params = new URLSearchParams();
    if (lat !== undefined && lat !== null) params.append('lat', lat);
    if (lng !== undefined && lng !== null) params.append('lng', lng);
    if (category) params.append('category', category);
    if (subCategory) params.append('sub_category', subCategory);
    if (merchantId) params.append('merchant_id', merchantId);
    if (userAge !== undefined && userAge !== null) params.append('user_age', userAge);
    if (search) params.append('search', search);
    if (onlyWithinRadius) params.append('only_within_radius', 'true');

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/products?${params.toString()}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  // Orders
  async checkout(orderData, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/orders/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Checkout failed');
    }
    return res.json();
  },

  async getActiveOrders(token) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/orders/user/active`, { headers });
    if (!res.ok) throw new Error('Failed to fetch active orders');
    return res.json();
  },

  async getOrder(orderId) {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    if (!res.ok) throw new Error('Failed to fetch order');
    return res.json();
  },

  // Assets
  async getAssets() {
    const res = await fetch(`${API_BASE_URL}/assets`);
    if (!res.ok) throw new Error('Failed to fetch assets');
    return res.json();
  },
};

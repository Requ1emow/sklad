const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getProducts: (query = '') => request(`/products${query}`),
  createProduct: (payload) => request('/products', { method: 'POST', body: JSON.stringify(payload) }),
  getStock: () => request('/inventory/stock'),
  getMovements: () => request('/inventory/movements'),
  createMovement: (payload) => request('/inventory/movements', { method: 'POST', body: JSON.stringify(payload) }),
  getSalesOverTime: () => request('/reports/sales-over-time?period=monthly'),
  getTopProducts: () => request('/reports/top-products')
};

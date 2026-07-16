import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const siteApi = {
    fullCrawl: (siteId) => api.post(`/sites/${siteId}/crawl`),
    getSitePages: (siteId, page = 1) => api.get(`/sites/${siteId}/pages?page=${page}`),
};

export const adminApi = {
    dashboard: () => api.get('/admin/dashboard'),
    users: (params) => api.get('/admin/users', { params }),
    showUser: (id) => api.get(`/admin/users/${id}`),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    sites: (params) => api.get('/admin/sites', { params }),
    showSite: (id) => api.get(`/admin/sites/${id}`),
    deleteSite: (id) => api.delete(`/admin/sites/${id}`),
    audits: (params) => api.get('/admin/audits', { params }),
    showAudit: (id) => api.get(`/admin/audits/${id}`),
    deleteAudit: (id) => api.delete(`/admin/audits/${id}`),
    settings: () => api.get('/admin/settings'),
    updateSettings: (data) => api.put('/admin/settings', data),
    testDataForSEO: () => api.post('/admin/settings/test-dataforseo'),
};

export default api;

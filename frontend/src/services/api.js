// FILE: src/services/api.js
// SPEC REFERENCE: Section 13 - API Integration, Authentication
// Axios instance with interceptors for token handling

import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
    withCredentials: true, // Send cookies (refresh token)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Access Token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiry & Refresh
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Spec §17: Refresh Token Rotation
        // If 401 Unauthorized and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Call refresh endpoint (Cookie is sent automatically via withCredentials)
                const { data } = await axios.post(
                    '/api/auth/refresh-token',
                    {},
                    { withCredentials: true }
                );

                // Update local storage with new access token
                localStorage.setItem('accessToken', data.data.accessToken);

                // Update authorization header and retry original request
                originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
                return API(originalRequest);
            } catch (refreshError) {
                // Refresh failed (token exp or invalid) -> Logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default API;

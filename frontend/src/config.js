const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_BASE_URL = import.meta.env.VITE_API_URL || (IS_LOCAL ? 'http://localhost:5002' : window.location.origin);
export const BACKEND_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;

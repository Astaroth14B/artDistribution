// API Configuration
const API_URL = (import.meta.env.VITE_API_URL || 'https://astaroth-backend-production.up.railway.app').replace(/\/$/, '');

export default API_URL;

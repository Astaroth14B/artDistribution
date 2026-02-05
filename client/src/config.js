// API Configuration
let apiUrl = import.meta.env.VITE_API_URL || 'https://astaroth-backend-production.up.railway.app';
if (!apiUrl.startsWith('http')) {
    apiUrl = `https://${apiUrl}`;
}
const API_URL = apiUrl.replace(/\/$/, '');

export default API_URL;

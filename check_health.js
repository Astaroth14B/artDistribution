const axios = require('axios');

async function check() {
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const res = await axios.get(`${baseUrl}/api/v1/health`);
        console.log('HEALTH_CHECK_RESULT:', JSON.stringify(res.data));
    } catch (err) {
        console.log('HEALTH_CHECK_ERROR:', err.message);
    }
}

check();

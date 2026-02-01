const axios = require('axios');
const sequelize = require('./config/database');

async function diag() {
    console.log('--- SERVER HEALTH CHECK ---');
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const HealthRes = await axios.get(`${baseUrl}/api/v1/health`);
        console.log('Health response:', HealthRes.data);
    } catch (err) {
        console.log('Health check failed:', err.message);
        if (err.response) console.log('Status:', err.response.status);
    }

    console.log('\n--- DATABASE SCHEMA CHECK ---');
    try {
        const [reviewCols] = await sequelize.query('DESCRIBE Reviews');
        console.log('Reviews table columns:', reviewCols.map(c => c.Field));

        const [artCols] = await sequelize.query('DESCRIBE Arts');
        console.log('Arts table columns:', artCols.map(c => c.Field));
    } catch (err) {
        console.log('DB Check failed:', err.message);
    }

    process.exit();
}

diag();

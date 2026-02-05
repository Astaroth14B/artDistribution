const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Allow configuring allowed origins via environment variable (comma-separated), fallback to wildcard
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

app.use(cors({
    origin: function (origin, callback) {
        // allow non-browser tools (no origin)
        if (!origin) return callback(null, true);

        // Allow localhost (dev)
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);

        // Allow Vercel & Railway subdomains (dynamic previews/production)
        if (origin.endsWith('.vercel.app') || origin.endsWith('.railway.app')) return callback(null, true);

        // Allow explicit specific domains
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // Optional: Block others but log for debugging
        console.log('Blocked by CORS:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Fallback to ensure CORS headers are always present (useful if some upstream proxy strips them)
// Manual CORS headers removed to prevent conflict with 'cors' package.
// The 'cors' middleware above handles this correctly with credentials.

app.use(express.json());
app.use(express.static(path.join(__dirname, 'client', 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection (MySQL / Sequelize)
const sequelize = require('./config/database');

// Routes
const artRoutes = require('./routes/artRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

app.use('/api/v1/art', artRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));

app.get('/api/v1/health', (req, res) => res.json({ status: 'active', version: 'paginated-masonry-v1' }));

// Serve React build for non-API routes (single-page app)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Ensure even 404 responses include CORS headers for browser clients
// Ensure even 404 responses include CORS headers for browser clients
app.use((req, res) => {
    res.status(404).json({ msg: 'Not Found' });
});

// Sync Database & Start Server
sequelize.sync()
    .then(() => {
        console.log('MySQL Database Connected & Synced');
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => console.log('Error connecting to MySQL:', err));

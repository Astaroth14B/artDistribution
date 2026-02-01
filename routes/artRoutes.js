const express = require('express');
const router = express.Router();
const Art = require('../models/Art');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// GET all art (Paginated)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        const { count, rows: art } = await Art.findAndCountAll({
            include: [{
                model: User,
                as: 'uploader',
                attributes: ['username', 'profilePic', 'serialNumber']
            }],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const artWithUrls = art.map(item => {
            const val = item.get({ plain: true });
            if (val.imageUrl && !val.imageUrl.startsWith('http')) {
                const imgPath = val.imageUrl.startsWith('/') ? val.imageUrl : `/uploads/${val.imageUrl}`;
                val.imageUrl = `${baseUrl}${imgPath}`;
            }
            if (val.uploader && val.uploader.profilePic && !val.uploader.profilePic.startsWith('http')) {
                const picPath = val.uploader.profilePic.startsWith('/') ? val.uploader.profilePic : `/${val.uploader.profilePic}`;
                val.uploader.profilePic = `${baseUrl}${picPath}`;
            }
            return val;
        });

        res.json({
            artworks: artWithUrls,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            hasMore: page * limit < count
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new art with Image Upload (PROTECTED)
router.post('/upload', auth, upload.single('image'), async (req, res) => {
    try {
        const { title, description } = req.body;

        // Fetch user to get their serial number and check ban status
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (user.bannedState && (!user.banUntil || new Date(user.banUntil) > new Date())) {
            return res.status(403).json({ msg: `Access Denied: You are in timeout until ${user.banUntil ? user.banUntil.toLocaleString() : 'indefinite'}. Reason: ${user.bannedReason || 'None'}` });
        }

        const imageUrl = req.file ? req.file.filename : '';

        const newArt = await Art.create({
            title,
            description,
            imageUrl,
            userSerial: user.serialNumber
        });
        res.status(201).json(newArt);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET user-specific art
router.get('/my-uploads', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const art = await Art.findAll({
            where: { userSerial: user.serialNumber }
        });

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const artWithUrls = art.map(item => {
            const val = item.get({ plain: true });
            if (val.imageUrl && !val.imageUrl.startsWith('http')) {
                const imgPath = val.imageUrl.startsWith('/') ? val.imageUrl : `/uploads/${val.imageUrl}`;
                val.imageUrl = `${baseUrl}${imgPath}`;
            }
            return val;
        });

        res.json(artWithUrls);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all art by a specific user (Public)
router.get('/user/:serialNumber', async (req, res) => {
    try {
        const art = await Art.findAll({
            where: { userSerial: req.params.serialNumber },
            include: [{
                model: User,
                as: 'uploader',
                attributes: ['username', 'profilePic', 'serialNumber']
            }],
            order: [['createdAt', 'DESC']]
        });

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const artWithUrls = art.map(item => {
            const val = item.get({ plain: true });
            if (val.imageUrl && !val.imageUrl.startsWith('http')) {
                const imgPath = val.imageUrl.startsWith('/') ? val.imageUrl : `/uploads/${val.imageUrl}`;
                val.imageUrl = `${baseUrl}${imgPath}`;
            }
            if (val.uploader && val.uploader.profilePic && !val.uploader.profilePic.startsWith('http')) {
                const picPath = val.uploader.profilePic.startsWith('/') ? val.uploader.profilePic : `/${val.uploader.profilePic}`;
                val.uploader.profilePic = `${baseUrl}${picPath}`;
            }
            return val;
        });

        res.json(artWithUrls);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;


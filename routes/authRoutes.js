const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const { encrypt, decrypt, generateHash } = require('../utils/cryptoUtils');
const { sendVerificationEmail } = require('../utils/mailUtils');

// Configure Multer for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// @route   POST api/v1/auth/register
// @desc    Register user
// @access  Public
router.post('/register', upload.single('profilePic'), async (req, res) => {
    const { username, password, email } = req.body;
    console.log('Registration Attempt:', { username, email, hasPassword: !!password });
    const profilePic = req.file ? `/uploads/${req.file.filename}` : '';

    if (!email || !username || !password) {
        const missing = [];
        if (!email) missing.push('email');
        if (!username) missing.push('username');
        if (!password) missing.push('password');
        console.log('Registration Blocked: Missing fields', missing);
        return res.status(400).json({ msg: `Incomplete inscription. Missing: ${missing.join(', ')}` });
    }

    try {
        const emailHash = generateHash(email);
        let user = await User.findOne({ where: { emailHash } });
        if (user) {
            console.log('Registration Blocked: Email exists', email);
            return res.status(400).json({ msg: 'This soul is already bound to the library (Email exists)' });
        }

        user = await User.findOne({ where: { username } });
        if (user) {
            console.log('Registration Blocked: Username taken', username);
            return res.status(400).json({ msg: 'That name is already etched in the scrolls (Username taken)' });
        }

        const { encryptedData, iv } = encrypt(email);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        user = await User.build({
            username,
            email: encryptedData,
            emailHash,
            emailIv: iv,
            password,
            profilePic,
            verificationCode,
            isVerified: false
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Send Email
        const emailSent = await sendVerificationEmail(email, verificationCode);

        if (!emailSent) {
            // WARN: Email failed (likely blocked) but account IS created.
            // Return 200 so they can at least know they registered.
            // Admin must manually tell them the code.
            return res.status(200).json({
                msg: 'Account created! However, the verification owl got lost (Email failed). Please contact the High Architect (Admin) for your code.'
            });
        }

        res.json({ msg: 'Verification code sent to email. Please verify to activate account.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/v1/auth/verify-email
// @desc    Verify email with code
// @access  Public
router.post('/verify-email', async (req, res) => {
    const { username, code } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (user.isVerified) return res.status(400).json({ msg: 'Account already verified' });
        if (user.verificationCode !== code) return res.status(400).json({ msg: 'Invalid verification code' });

        user.isVerified = true;
        user.verificationCode = null;
        await user.save();

        res.json({ msg: 'Account activated! You may now login.' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   POST api/v1/auth/resend-code
// @desc    Resend verification code
// @access  Public
router.post('/resend-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Please provide email' });

    try {
        const emailHash = generateHash(email);
        const user = await User.findOne({ where: { emailHash } });

        if (!user) return res.status(404).json({ msg: 'No such initiate found.' });
        if (user.isVerified) return res.status(400).json({ msg: 'Seal already confirmed.' });

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        await user.save();

        const emailSent = await sendVerificationEmail(email, verificationCode);
        if (!emailSent) {
            return res.status(500).json({ msg: 'The messenger failed to deliver the seal. Please try again later.' });
        }
        res.json({ msg: 'A new seal has been cast and sent to your mail.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   POST api/v1/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password, masterKey } = req.body;

    try {
        let user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // --- LEGACY USER MIGRATION ---
        if (!user.emailHash && !user.isVerified) {
            console.log(`Migrating legacy user: ${user.username}`);
            if (user.email) {
                const { encryptedData, iv } = encrypt(user.email);
                user.email = encryptedData;
                user.emailIv = iv;
                user.emailHash = generateHash(decrypt(user.email, user.emailIv));
                user.isVerified = true;
                await user.save();
            }
        }
        // -----------------------------

        if (!user.isVerified && !user.isAdmin) {
            return res.status(403).json({ msg: 'Account not verified. Please check your email.', needsVerification: true });
        }

        // Admin Security Check
        if (user.isAdmin) {
            const ADMIN_PASSCODE = 'GRANDMASTER'; // In prod: process.env.ADMIN_PASSCODE
            if (masterKey !== ADMIN_PASSCODE) {
                return res.status(401).json({ msg: 'MASTER SEAL REQUIRED', isAdmin: true });
            }
        }

        // Decrypt email for response
        let decryptedEmail = '';
        if (user.email && user.emailIv) {
            try {
                decryptedEmail = decrypt(user.email, user.emailIv);
            } catch (err) {
                console.error('Decryption failed for user:', user.username);
            }
        }

        // Return JWT
        const payload = {
            user: {
                id: user.id,
                serialNumber: user.serialNumber,
                username: user.username
            }
        };

        jwt.sign(
            payload,
            'secretOrPrivateKey',
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token, user: {
                        id: user.id,
                        username: user.username,
                        email: decryptedEmail,
                        profilePic: user.profilePic,
                        isAdmin: user.isAdmin,
                        serialNumber: user.serialNumber,
                        bannedState: user.bannedState,
                        bannedReason: user.bannedReason,
                        banUntil: user.banUntil
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Auth middleware import for standard export
const auth = require('../middleware/authMiddleware');
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        const val = user.get({ plain: true });
        if (val.email && val.emailIv) {
            try {
                val.email = decrypt(val.email, val.emailIv);
            } catch (err) {
                console.error('Decryption failed for session user');
            }
        }

        res.json(val);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.put('/profile', auth, async (req, res) => {
    const { username, email, password } = req.body;
    try {
        let user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (username) user.username = username;
        if (email) {
            const { encryptedData, iv } = encrypt(email);
            user.email = encryptedData;
            user.emailIv = iv;
            user.emailHash = generateHash(email);
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        await user.save();

        // Prepare response with decrypted email
        const updatedUser = user.get({ plain: true });
        delete updatedUser.password;
        if (updatedUser.email && updatedUser.emailIv) {
            updatedUser.email = decrypt(updatedUser.email, updatedUser.emailIv);
        }

        res.json({ msg: 'Profile updated', user: updatedUser });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

const Art = require('../models/Art');
const Review = require('../models/Review');
const sequelize = require('../config/database');

router.get('/user/:serialNumber', async (req, res) => {
    try {
        const user = await User.findOne({
            where: { serialNumber: req.params.serialNumber },
            attributes: ['id', 'username', 'profilePic', 'serialNumber', 'email', 'emailIv']
        });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const artworks = await Art.findAll({
            where: { userSerial: req.params.serialNumber },
            attributes: ['id']
        });
        const artIds = artworks.map(a => a.id);

        let avgRating = 0;
        let reviewCount = 0;

        if (artIds.length > 0) {
            const stats = await Review.findOne({
                where: { artId: artIds },
                attributes: [
                    [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount']
                ],
                raw: true
            });
            avgRating = parseFloat(stats.avgRating || 0).toFixed(1);
            reviewCount = parseInt(stats.reviewCount || 0);
        }

        const val = user.get({ plain: true });
        val.avgRating = avgRating;
        val.reviewCount = reviewCount;
        val.totalArt = artworks.length;

        // Decrypt email for public profile if it's the owner or if desired
        // The user specifically asked to see the normal email in the artist profile.
        if (val.email && val.emailIv) {
            try {
                val.email = decrypt(val.email, val.emailIv);
            } catch (err) {
                console.error('Decryption failed for artist profile');
            }
        }

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        if (val.profilePic && !val.profilePic.startsWith('http')) {
            const picPath = val.profilePic.startsWith('/') ? val.profilePic : `/${val.profilePic}`;
            val.profilePic = `${baseUrl}${picPath}`;
        }

        res.json(val);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

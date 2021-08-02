const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route   GET api/albums/billboard-hot-100
// @desc    Get current user's album for Billboard Hot 100
// @access  Private
router.get('/billboard-hot-100', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.billboardHot100.length === 0) {
            return res.status(400).json({ errors: [{ msg: 'Album does not exist' }] });
        }
        res.json(user.billboardHot100);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/albums/billboard-hot-100
// @desc    Create/edit current user's album for Billboard Hot 100
// @access  Private
router.post('/billboard-hot-100',
    auth,
    //songs array must be 9 elements long
    body('songs').isArray({ min: 9, max: 9 }).withMessage('9 songs required'),
    async (req, res) => {
        //validation error handling
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { songs } = req.body;

        try {
            let user = await User.findById(req.user.id);
            if (user.coins < 50) {
                return res.status(400).json({ errors: [{ msg: 'Not enough coins' }] });
            }
            user.billboardHot100 = songs;
            user.coins -= 50;
            await user.save();
            res.json(user.billboardHot100);
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }
    });

// @route   GET api/albums/spotify-top-200-global
// @desc    Get current user's album for Spotify Top 200 Global
// @access  Private
router.get('/spotify-top-200-global', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.spotifyTop200Global.length === 0) {
            return res.status(400).json({ errors: [{ msg: 'Album does not exist' }] });
        }
        res.json(user.spotifyTop200Global);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/albums/spotify-top-200-global
// @desc    Create/edit current user's album for Spotify Top 200 Global
// @access  Private
router.post('/spotify-top-200-global',
    auth,
    //songs array must be 9 elements long
    body('songs').isArray({ min: 9, max: 9 }).withMessage('9 songs required'),
    async (req, res) => {
        //validation error handling
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { songs } = req.body;

        try {
            let user = await User.findById(req.user.id);
            if (user.coins < 25) {
                return res.status(400).json({ errors: [{ msg: 'Not enough coins' }] });
            }
            user.spotifyTop200Global = songs;
            user.coins -= 25;
            await user.save();
            res.json(user.spotifyTop200Global);
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }
    });

module.exports = router;
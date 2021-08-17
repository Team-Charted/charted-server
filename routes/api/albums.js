const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const auth = require('../../middleware/auth');
const Album = require('../../models/Album');
const Chart = require('../../models/Chart');
const User = require('../../models/User');

// @route   GET api/albums/:chart_id
// @desc    Get current user's album by chart ID
// @access  Private
router.get('/:chart_id', auth, async (req, res) => {
    try {
        const album = await Album.findOne({user: req.user.id, chart: req.params.chart_id});
        if (!album) {
            return res.json([]);
        }
        res.json(album);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
})

// @route   POST api/albums/:chart_id
// @desc    Create/edit current user's album by chart ID
// @access  Private
router.post('/:chart_id',
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
            const chart = await Chart.findById(req.params.chart_id);
            let album = await Album.findOne({ chart: req.params.chart_id, user: req.user.id });
            if(album) {
                album.songs = songs;
                album.save();
                return res.json(album);
            }
            if (user.coins < chart.cost) {
                return res.status(400).json({ errors: [{ msg: 'Not enough coins' }] });
            }
            user.coins -= chart.cost;
            await user.save();

            album = new Album({
                chart: req.params.chart_id,
                user: user.id,
                songs: songs
            });

            album.save();

            res.json(album);
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }
    });

module.exports = router;
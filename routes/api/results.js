const express = require('express');

const router = express.Router();

const auth = require('../../middleware/auth');
const Result = require('../../models/Result');
const Chart = require('../../models/Chart');
const Album = require('../../models/Album');
const User = require('../../models/User');

// @route   GET api/results
// @desc    Get all results
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        //get all results sorted from latest to oldest
        const results = await Result.find().select('-leaderboard').populate('chart').sort({ calculatedAt: -1 });
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/results/:result_id
// @desc    Get result by result ID
// @access  Private
router.get('/:result_id', auth, async (req, res) => {
    try {
        const result = await Result.findById(req.params.result_id).select('-leaderboard.songsWithPoints').populate('chart');
        if (!result) {
            return res.status(400).json({ errors: [{ msg: 'Result does not exist' }] });
        }
        res.json(result)
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ errors: [{ msg: 'Result does not exist' }] });
        }
        res.status(500).send("Server error");
    }
});

// @route   GET api/results/:result_id/album
// @desc    Get current user's album for particular result by result ID
// @access  Private
router.get('/:result_id/album', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);

        const result = await Result.findById(req.params.result_id);
        if (!result) {
            return res.status(400).json({ errors: [{ msg: 'Result does not exist' }] });
        }

        const leaderboard = result.leaderboard;
        leaderboard.forEach(entry => {
            if (entry.username == user.username) {
                return res.json(entry.songsWithPoints);
            }
        });

        return res.status(400).json({ errors: [{ msg: 'Album not found' }] });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ errors: [{ msg: 'Result does not exist' }] });
        }
        res.status(500).send("Server error");
    }
});

module.exports = router;
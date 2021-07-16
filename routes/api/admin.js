const express = require('express');
const axios = require('axios')
const { getChart } = require('billboard-top-100')
const config = require('config');

const router = express.Router();

const auth = require('../../middleware/auth');
const Result = require('../../models/Result');

// @route   GET api/admin/billboard-hot-100/result/calculate
// @desc    Calculate results for Billboard Hot 100 chart
// @access  Admin
router.get('/billboard-hot-100/result/calculate', auth, async (req, res) => {
    try {
        //check if request was sent by an admin
        const user = await User.findById(req.user.id);
        if (config.get('adminEmails').includes(user.email)) {

            //get latest Billboard Hot 100 chart
            getChart('hot-100', async (err, chart) => {
                if (err) reject(err);

                //check if result has already been calculated
                const result = await Result.findOne({ date: chart.week, chart: "Billboard Hot 100" });
                if (result)
                    return res.status(400).json({ errors: [{ message: 'Leaderboard already updated' }] });

                const newResult = new Result({
                    chart: "Billboard Hot 100",
                    type: "Weekly",
                    date: chart.week,
                    leaderboard: []
                });

                //format chart songs into unique strings
                let chartSongs = [];
                chartSongs = chart.songs.map(song => {
                    return (song.artist.split(" ")[0] + '-' + song.title).trim().toLowerCase().replace(/[^a-z]/g, "") // <ARTISTNAME>-<SONGNAME>
                });

                //iterate through all users having an album for Billboard Hot 100
                User.
                    find({ "billboardHot100.0": { "$exists": true } }).
                    cursor().
                    on('data', async function (user) {

                        let points = 0.0;

                        //iterate through user's album array
                        user.billboardHot100.map(song => {
                            //format each song into unique string
                            const formattedSong = (song.artist.split(" ")[0] + '-' + song.title).trim().toLowerCase().replace(/[^a-z]/g, "");
                            //find this song's index in Billboard Hot 100 by comparing unique strings
                            const index = chartSongs.findIndex(song => song === formattedSong);
                            if (index !== -1) {
                                //add points for each song
                                //TODO: IMPLEMENT POINT SYSTEM
                                points = points + (100 - index);
                            }
                        })

                        //delete album array for Billboard Hot 100 from user object
                        user.billboardHot100 = undefined;

                        //update leaderboard field on newResult object
                        newResult.leaderboard.push({
                            user: user._id,
                            username: user.username,
                            points: points
                        });

                        //save user to database
                        await user.save();
                    }).
                    on('end', async () => {
                        //save result to database
                        await newResult.save();
                        res.json("Successfully updated leaderboard");
                    });
            });
        } else {
            return res.status(403).json({ errors: [{ message: 'Forbidden' }] });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
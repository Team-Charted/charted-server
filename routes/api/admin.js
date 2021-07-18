const express = require('express');
const { getChart } = require('billboard-top-100')
const { body, validationResult } = require('express-validator');
const config = require('config');
const csv = require("fast-csv");

const router = express.Router();

const auth = require('../../middleware/auth');
const Result = require('../../models/Result');

// @route   POST api/admin/billboard-hot-100/result/calculate
// @desc    Calculate results for Billboard Hot 100 chart
// @access  Admin
router.post('/billboard-hot-100/result/calculate', auth, async (req, res) => {
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

// @route   POST api/admin/spotify-top-200-global/result/calculate
// @desc    Calculate results for Spotify Top 200 Global chart
// @access  Admin
router.post('/spotify-top-200-global/result/calculate',
    auth,
    body('date').notEmpty().withMessage('Chart date is required'),
    async (req, res) => {
        //validation error handling
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            //check if request was sent by an admin
            const user = await User.findById(req.user.id);
            if (config.get('adminEmails').includes(user.email)) {
                if (!req.files) return res.status(403).json({ errors: [{ message: 'Need a .csv chart file' }] });

                //get the Spotify charts CSV file from the request
                const myCSV = req.files.chart;
                //get the Spotify chart's date from the request body
                const { date } = req.body;

                let chart = {
                    count: 0,
                    list: [],

                };

                csv.parseString(myCSV.data, {
                    skipRows: 2,
                })
                    .on("error", (error) => console.log(error))
                    .on("data", (row) => chart.list.push(row))
                    .on("end", (rowCount) => {
                        chart.count = rowCount;
                        chart.list = chart.list.map((i) => {
                            return {
                                place: parseInt(i[0]),
                                title: i[1],
                                artist: i[2],
                                streams: parseInt(i[3]),
                                url: i[4],
                            };
                        });
                    });

                //check if result has already been calculated
                const result = await Result.findOne({ date: date, chart: "Spotify Top 200 Global" });
                if (result)
                    return res.status(400).json({ errors: [{ message: 'Leaderboard already updated' }] });

                const newResult = new Result({
                    chart: "Spotify Top 200 Global",
                    type: "Daily",
                    date: date,
                    leaderboard: []
                });

                //format chart songs into unique strings
                let chartSongs = [];
                chartSongs = chart.list.map(song => {
                    return (song.artist.split(" ")[0] + '-' + song.title.split("(")[0]).trim().toLowerCase().replace(/[^a-z]/g, "") // <ARTISTNAME>-<SONGNAME>
                });

                //iterate through all users having an album for Billboard Hot 100
                User.
                    find({ "spotifyTop200Global.0": { "$exists": true } }).
                    cursor().
                    on('data', async function (user) {

                        let points = 0.0;

                        //iterate through user's album array
                        user.spotifyTop200Global.map(song => {
                            //format each song into unique string
                            const formattedSong = (song.artist.split(" ")[0] + '-' + song.title.split("(")[0]).trim().toLowerCase().replace(/[^a-z]/g, "");
                            //find this song's index in Billboard Hot 100 by comparing unique strings
                            const index = chartSongs.findIndex(song => song === formattedSong);
                            if (index !== -1) {
                                //add points for each song
                                //TODO: IMPLEMENT POINT SYSTEM
                                points = points + (200 - index);
                            }
                        })

                        //delete album array for Billboard Hot 100 from user object
                        user.spotifyTop200Global = undefined;

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
            } else {
                return res.status(403).json({ errors: [{ message: 'Forbidden' }] });
            }
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }
    });

module.exports = router;
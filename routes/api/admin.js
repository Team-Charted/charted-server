const express = require('express');
const { getChart } = require('billboard-top-100')
const { body, validationResult } = require('express-validator');
const config = require('config');
const csv = require("fast-csv");

const router = express.Router();

const auth = require('../../middleware/auth');
const Result = require('../../models/Result');
const Chart = require('../../models/Chart');
const Album = require('../../models/Album');
const User = require('../../models/User');

// @route   POST api/admin/billboard-hot-100/result/calculate
// @desc    Calculate results for Billboard Hot 100 chart
// @access  Admin
router.post('/billboard-hot-100/result/calculate', auth, async (req, res) => {
    try {
        //check if request was sent by an admin
        const user = await User.findById(req.user.id);
        if (config.get('adminEmails').includes(user.email)) {

            //get the Chart object
            let chartObject = await Chart.findOne({ name: "Billboard Hot 100" });

            //get latest Billboard Hot 100 chart
            getChart('hot-100', async (err, chart) => {
                if (err) reject(err);

                // check if result has already been calculated
                const result = await Result.findOne({ date: chart.week, chart: chartObject.id });
                if (result)
                    return res.status(400).json({ errors: [{ msg: 'Leaderboard already updated' }] });

                let newResult = new Result({
                    chart: chartObject.id,
                    date: chart.week,
                    leaderboard: []
                });

                //format chart songs into unique strings
                let chartSongs = [];
                chartSongs = chart.songs.map(song => {
                    return (song.artist.split(" ")[0] + '-' + song.title).trim().toLowerCase().replace(/[^a-z]/g, "") // <ARTISTNAME>-<SONGNAME>
                });

                //iterate through all users having an album for Billboard Hot 100
                const albums = await Album.
                    find({ chart: chartObject.id });

                albums.forEach(async (album) => {

                    let totalPoints = 0.0;
                    let songsWithPoints = [];

                    //iterate through user's album array
                    album.songs.map(song => {
                        //format each song into unique string
                        const formattedSong = (song.artist.split(" ")[0] + '-' + song.title).trim().toLowerCase().replace(/[^a-z]/g, "");
                        //find this song's index in Billboard Hot 100 by comparing unique strings
                        const index = chartSongs.findIndex(song => song === formattedSong);

                        let pointsForCurrentSong = 0.0;

                        if (index !== -1) {

                            let theSong = chart.songs[index];

                            //calculate points
                            let currentPosition = theSong.rank;
                            let lastWeekPosition = isNaN(theSong.position.positionLastWeek) ? 0 : parseInt(theSong.position.positionLastWeek);
                            let peakPosition = isNaN(theSong.position.peakPosition) ? 0 : parseInt(theSong.position.peakPosition);
                            let weeksOnChart = isNaN(theSong.position.weeksOnChart) ? 0 : parseInt(theSong.position.weeksOnChart);

                            pointsForCurrentSong = (2 * lastWeekPosition + peakPosition) / (weeksOnChart + 3 * currentPosition);

                            //double the points if it was the lead single
                            if (song.leadSingle) {
                                pointsForCurrentSong *= 2;
                            }

                            //add these points to the total points
                            totalPoints = totalPoints + pointsForCurrentSong;
                        }
                        // console.log(pointsForCurrentSong);
                        songsWithPoints.push({
                            points: pointsForCurrentSong,
                            title: song.title,
                            artist: song.artist,
                            imageURL: song.imageURL,
                            leadSingle: song.leadSingle
                        });
                    });

                    const user = await User.findById(album.user);

                    //update leaderboard field on newResult object
                    const leaderboardEntry = {
                        username: user.username,
                        points: totalPoints,
                        songsWithPoints: songsWithPoints
                    };
                    newResult.leaderboard.push(leaderboardEntry);

                    //save newResult to database
                    await newResult.save();
                    //delete album
                    await album.remove();
                });

                chartObject.endTime = (Number(chartObject.endTime) + 604800000).toString();

                function nextDay(x) {
                    var now = new Date();
                    now.setDate(now.getDate() + (x + (7 - now.getDay())) % 7);
                    return now;
                }

                chartObject.date = nextDay(6).toLocaleString().split(',')[0];

                await chartObject.save();

                res.json("Successfully updated leaderboard");
            });
        } else {
            return res.status(403).json({ errors: [{ msg: 'Forbidden' }] });
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
                if (!req.files) return res.status(403).json({ errors: [{ msg: 'Need .csv chart files' }] });

                //get the current Spotify charts CSV file from the request
                const currentChartCSV = req.files.currentChart;
                //get the previous Spotify charts CSV file from the request
                const previousChartCSV = req.files.previousChart;
                //get the Spotify chart's date from the request body
                const { date } = req.body;

                let currentChart = {
                    count: 0,
                    list: [],
                };

                csv.parseString(currentChartCSV.data, {
                    skipRows: 2,
                })
                    .on("error", (error) => console.log(error))
                    .on("data", (row) => currentChart.list.push(row))
                    .on("end", (rowCount) => {
                        currentChart.count = rowCount;
                        currentChart.list = currentChart.list.map((i) => {
                            return {
                                place: parseInt(i[0]),
                                title: i[1],
                                artist: i[2],
                                streams: parseInt(i[3]),
                                url: i[4],
                            };
                        });
                    });

                let previousChart = {
                    count: 0,
                    list: [],
                };

                csv.parseString(previousChartCSV.data, {
                    skipRows: 2,
                })
                    .on("error", (error) => console.log(error))
                    .on("data", (row) => previousChart.list.push(row))
                    .on("end", (rowCount) => {
                        previousChart.count = rowCount;
                        previousChart.list = previousChart.list.map((i) => {
                            return {
                                place: parseInt(i[0]),
                                title: i[1],
                                artist: i[2],
                                streams: parseInt(i[3]),
                                url: i[4],
                            };
                        });
                    });

                //get the Chart object
                let chartObject = await Chart.findOne({ name: "Spotify Top 200: Global" });

                //check if result has already been calculated
                const result = await Result.findOne({ date: date, chart: chartObject.id });
                if (result)
                    return res.status(400).json({ errors: [{ msg: 'Leaderboard already updated' }] });

                const newResult = new Result({
                    chart: chartObject.id,
                    date: date,
                    leaderboard: []
                });

                //format chart songs into unique strings
                let currentChartSongs = [];
                currentChartSongs = currentChart.list.map(song => {
                    return (song.artist.split(" ")[0] + '-' + song.title.split("(")[0]).trim().toLowerCase().replace(/[^a-z]/g, "") // <ARTISTNAME>-<SONGNAME>
                });
                let previousChartSongs = [];
                previousChartSongs = previousChart.list.map(song => {
                    return (song.artist.split(" ")[0] + '-' + song.title.split("(")[0]).trim().toLowerCase().replace(/[^a-z]/g, "") // <ARTISTNAME>-<SONGNAME>
                });

                //iterate through all users having an album for Spotify Top 200 Global
                const albums = await Album.
                    find({ chart: chartObject.id });

                albums.forEach(async (album) => {

                    let totalPoints = 0.0;
                    let songsWithPoints = [];

                    //iterate through user's album array
                    album.songs.map(song => {
                        //format each song into unique string
                        const formattedSong = (song.artist.split(" ")[0] + '-' + song.title.split("(")[0]).trim().toLowerCase().replace(/[^a-z]/g, "");
                        //find this song's index in Spotify Top 200 Global by comparing unique strings
                        const currentIndex = currentChartSongs.findIndex(song => song === formattedSong);

                        let pointsForCurrentSong = 0.0;

                        if (currentIndex !== -1) {
                            const previousIndex = previousChartSongs.findIndex(song => song === formattedSong);
                            //if song charted previously
                            if (previousIndex !== -1) {
                                //calculate points
                                let previousPosition = previousChart.list[previousIndex].place;
                                let previousStreams = previousChart.list[previousIndex].streams;
                                let currentPosition = currentChart.list[currentIndex].place;
                                let currentStreams = currentChart.list[currentIndex].streams;

                                pointsForCurrentSong = (previousPosition + 2 * currentStreams) / (previousStreams + 2 * currentPosition);
                            } else {
                                let currentPosition = currentChart.list[currentIndex].place;
                                let currentStreams = currentChart.list[currentIndex].streams;

                                pointsForCurrentSong = 2 * (currentStreams) / (currentPosition);
                            }
                            totalPoints = totalPoints + pointsForCurrentSong;
                        }

                        songsWithPoints.push({
                            points: pointsForCurrentSong,
                            title: song.title,
                            artist: song.artist,
                            leadSingle: song.leadSingle
                        });
                    });

                    const user = await User.findById(album.user);

                    //update leaderboard field on newResult object
                    const leaderboardEntry = {
                        username: user.username,
                        points: totalPoints,
                        songsWithPoints: songsWithPoints
                    };
                    newResult.leaderboard.push(leaderboardEntry);

                    //save newResult to database
                    await newResult.save();
                    //delete album
                    await album.remove();

                });

                chartObject.endTime = (Number(chartObject.endTime) + 86400000).toString();

                chartObject.date = (new Date(Date.now() + 24 * 60 * 60 * 1000)).toLocaleString().split(',')[0];

                await chartObject.save();

                res.json("Successfully updated leaderboard");

            } else {
                return res.status(403).json({ errors: [{ msg: 'Forbidden' }] });
            }
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }
    });

module.exports = router;
const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios')
const { getChart } = require('billboard-top-100')
const config = require('config');

const router = express.Router();

const auth = require('../../middleware/auth');

// @route   GET api/searches
// @desc    Get songs search results
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let searchResults = [];

        //make Genius API call
        const encodedURI = encodeURI(`https://api.genius.com/search?q=${req.body.queryString}`);
        const reqConfig = {
            headers: {
                'Authorization': `Bearer ${config.get('geniusAccessToken')}`
            }
        };
        const response = await axios.get(encodedURI, reqConfig);

        searchResults = response.data.response.hits.map(hit => {
            return {
                title: hit.result.title,
                artist: hit.result.primary_artist.name,
                imageURL: hit.result.song_art_image_url,
                credits: 0.0
            }
        });

        //modify credits for each song based on its artist's position on Billboard Artist 100 chart
        getChart('artist-100', (err, chart) => {
            if (err) reject(err)

            let modifiedChart = chart.songs.map(song => song.title.trim().toLowerCase().replace(/[^a-z]/g, ""));

            searchResults.forEach(res => {
                const index = modifiedChart.indexOf(res.artist.trim().toLowerCase().replace(/[^a-z]/g, ""));
                //CREDIT SYSTEM FOR EACH SONG
                if (index !== -1) {
                    if (index >= 0 && index <= 4)
                        res.credits = 10.0;
                    else if (index >= 5 && index <= 9)
                        res.credits = 9.5;
                    else if (index >= 10 && index <= 14)
                        res.credits = 9.0;
                    else if (index >= 15 && index <= 19)
                        res.credits = 8.5;
                    else if (index >= 20 && index <= 29)
                        res.credits = 8.0;
                    else if (index >= 30 && index <= 39)
                        res.credits = 7.5;
                    else if (index >= 40 && index <= 49)
                        res.credits = 7.0;
                    else if (index >= 50 && index <= 54)
                        res.credits = 6.5;
                    else if (index >= 55 && index <= 59)
                        res.credits = 6.0;
                    else if (index >= 60 && index <= 64)
                        res.credits = 5.5;
                    else if (index >= 65 && index <= 69)
                        res.credits = 5.0;
                    else if (index >= 70 && index <= 74)
                        res.credits = 4.5;
                    else if (index >= 75 && index <= 79)
                        res.credits = 4.0;
                    else if (index >= 80 && index <= 84)
                        res.credits = 3.5;
                    else if (index >= 85 && index <= 89)
                        res.credits = 3.0;
                    else if (index >= 90 && index <= 94)
                        res.credits = 2.5;
                    else if (index >= 95 && index <= 99)
                        res.credits = 2.0;
                }
                else
                    res.credits = 1.5;
            });

            res.json(searchResults);
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
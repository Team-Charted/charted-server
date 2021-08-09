const express = require('express');
const { body, validationResult } = require('express-validator');
const config = require('config');

const router = express.Router();

const auth = require('../../middleware/auth');
const Chart = require('../../models/Chart');
const User = require('../../models/User');

// @route   GET api/charts
// @desc    Get charts
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let charts = [];
        Chart.
            find().
            cursor().
            on('data', async function (doc) {
                charts.push(doc)
            }).
            on('end', async () => {
                res.json(charts);
            });

    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/charts
// @desc    Add chart
// @access  Admin
router.post('/',
    auth,
    //name must be present
    body('name').notEmpty().withMessage('Chart name is required'),
    //prizePool must be present
    body('prizePool').notEmpty().withMessage('Chart prize pool is required'),
    //cost must be present
    body('cost').notEmpty().withMessage('Chart cost is required'),
    //type must be present
    body('type').notEmpty().withMessage('Chart type is required'),
    //nextDate must be present
    body('nextDate').notEmpty().withMessage('Next chart date is required'),
    async (req, res) => {
        //validation error handling
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, prizePool, cost, type, nextDate } = req.body;

        try {
            //check if request was sent by an admin
            const user = await User.findById(req.user.id);
            if (config.get('adminEmails').includes(user.email)) {
                //check if user already exists
                let chart = await Chart.findOne({ name: name });
                if (chart) {
                    return res.status(400).json({ errors: [{ msg: 'Chart already exists' }] });
                }

                //create new Chart object
                chart = new Chart({
                    name: name,
                    prizePool: prizePool,
                    cost: cost,
                    type: type,
                    nextDate: nextDate
                });

                await chart.save();

                res.json(chart);
            } else {
                return res.status(403).json({ errors: [{ msg: 'Forbidden' }] });
            }
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }
    });

module.exports = router;
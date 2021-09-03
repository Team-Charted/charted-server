const express = require('express');
const { body, validationResult } = require('express-validator');
const config = require('config');

const router = express.Router();

const auth = require('../../middleware/auth');
const admin = require('../../middleware/admin');
const Chart = require('../../models/Chart');
const User = require('../../models/User');

// @route   GET api/charts
// @desc    Get charts
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const charts = await Chart.find();
        res.json(charts);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/charts
// @desc    Add chart
// @access  Admin
// router.post('/',
//     admin,
//     //name must be present
//     body('name').notEmpty().withMessage('Chart name is required'),
//     //prizePool must be present
//     body('prizePool').notEmpty().withMessage('Chart prize pool is required'),
//     //cost must be present
//     body('cost').notEmpty().withMessage('Chart cost is required'),
//     //type must be present
//     body('type').notEmpty().withMessage('Chart type is required'),
//     //date must be present
//     body('date').notEmpty().withMessage('Next chart date is required'),
//     //endTime must be present
//     body('endTime').notEmpty().withMessage('endTime Unix time is required'),
//     async (req, res) => {
//         //validation error handling
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }

//         const { name, prizePool, cost, type, date, endTime } = req.body;

//         try {
//             //check if user already exists
//             let chart = await Chart.findOne({ name: name });
//             if (chart) {
//                 return res.status(400).json({ errors: [{ msg: 'Chart already exists' }] });
//             }

//             //create new Chart object
//             chart = new Chart({
//                 name: name,
//                 prizePool: prizePool,
//                 cost: cost,
//                 type: type,
//                 date: date,
//                 endTime: endTime
//             });

//             await chart.save();

//             res.json(chart);

//         } catch (err) {
//             console.log(err.message);
//             res.status(500).send('Server error');
//         }
//     });

module.exports = router;
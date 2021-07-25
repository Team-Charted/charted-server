const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const axios = require('axios');

const router = express.Router();

const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route   POST api/transactions/account/create-bank-account
// @desc    Create fund account for user on Razorpay
// @access  Private
router.post('/account/create-bank-account',
    auth,
    //IFSC code must be present
    body('ifsc').notEmpty().withMessage('IFSC code is required'),
    //account number must be 14 characters long
    body('accountNumber').isLength({ min: 14, max: 14 }).withMessage('Account number must be 14 characters long'),
    async (req, res) => {
        //validation error handling
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { accountNumber, ifsc } = req.body;

        try {
            const user = await User.findById(req.user.id);

            const body = {
                contact_id: user.contactID,
                account_type: "bank_account",
                bank_account: {
                    name: user.name,
                    ifsc: ifsc,
                    account_number: accountNumber
                }
            };

            const reqConfig = {
                headers: {
                    'Content-Type': 'application/json'
                },
                auth: {
                    username: config.get('razorpayKeyID'),
                    password: config.get('razorpayKeySecret')
                }
            }

            //send request to Razorpay
            const response = await axios.post('https://api.razorpay.com/v1/fund_accounts', JSON.stringify(body), reqConfig);

            //save Razorpay fund account ID to user in databse
            user.fundAccountID = response.data.id;
            await user.save();

            res.json(user);
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }
    });

module.exports = router;
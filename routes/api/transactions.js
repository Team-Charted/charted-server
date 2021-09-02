const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route   POST api/transactions/link-bank-account
// @desc    Create fund account for user on Razorpay using bank account
// @access  Private
router.post('/link-bank-account',
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

            if (user.fundAccountID) {
                return res.status(400).json({ errors: [{ msg: 'Account already linked' }] });
            }

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

            res.json("Successfully linked user bank account");
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }
    });

// @route   POST api/transactions/withdraw
// @desc    Withdraw money to bank account
// @access  Private
router.post('/withdraw',
    auth,
    //amount must be present
    body('amount').notEmpty().withMessage('Amount is required'),
    async (req, res) => {
        //validation error handling
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { amount } = req.body;

        try {
            const user = await User.findById(req.user.id);

            if (!user.fundAccountID) {
                return res.status(400).json({ errors: [{ msg: 'No bank account linked' }] });
            }

            const body = {
                account_number: config.get('accountNumber'),
                fund_account_id: user.fundAccountID,
                amount: amount * 100,
                currency: "INR",
                mode: "NEFT",
                purpose: "payout"
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

            // send request to Razorpay
            const response = await axios.post('https://api.razorpay.com/v1/payouts', JSON.stringify(body), reqConfig);

            // TODO: save transaction to user in databse
            // update user's coins
            user.coins -= amount;
            await user.save();

            const data = {
                amountWithdrawn: amount,
                balance: user.coins
            }

            res.json(data);
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }
    });


// @route   POST api/transactions/add
// @desc    Add money to charted wallet
// @access  Private
router.post('/add',
    auth,
    //amount must be present
    body('amount').notEmpty().withMessage('Amount is required'),
    async (req, res) => {
        //validation error handling
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { amount } = req.body;

        try {
            const user = await User.findById(req.user.id);

            if (!user.fundAccountID) {
                return res.status(400).json({ errors: [{ msg: 'No bank account linked' }] });
            }

            const body = {
                amount: amount * 100,
                currency: "INR"
            };

            const reqConfig = {
                headers: {
                    'Content-Type': 'application/json'
                },
                auth: {
                    username: config.get('razorpayKeyID'),
                    password: config.get('razorpayKeySecret')
                }
            };

            //send request to Razorpay
            const response = await axios.post('https://api.razorpay.com/v1/orders', JSON.stringify(body), reqConfig);

            const order = response.data;

            res.json(order);
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }
    });

router.post("/add/success",
    auth,
    async (req, res) => {
        try {
            const user = await User.findById(req.user.id);

            // getting the details back from our font-end
            const {
                amount,
                orderCreationId,
                razorpayPaymentId,
                razorpayOrderId,
                razorpaySignature,
            } = req.body;

            // Creating our own digest
            // The format should be like this:
            // digest = hmac_sha256(orderCreationId + "|" + razorpayPaymentId, secret);
            const shasum = crypto.createHmac("sha256", config.get('razorpayKeySecret'));

            shasum.update(`${orderCreationId}|${razorpayPaymentId}`);

            const digest = shasum.digest("hex");

            // comaparing our digest with the actual signature
            if (digest !== razorpaySignature)
                return res.status(400).json({ errors: [{ msg: 'Transaction not legit!' }] });

            // THE PAYMENT IS LEGIT & VERIFIED
            // YOU CAN SAVE THE DETAILS IN YOUR DATABASE IF YOU WANT

            //TODO: save transaction to user in databse
            //update user's coins
            user.coins += amount / 100;
            await user.save();

            res.json({
                msg: "success",
                orderId: razorpayOrderId,
                paymentId: razorpayPaymentId,
            });
        } catch (error) {
            res.status(500).send('Server error');
        }
    });

module.exports = router;
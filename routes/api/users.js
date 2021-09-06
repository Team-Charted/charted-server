const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const axios = require('axios');

const router = express.Router();

const User = require('../../models/User');

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post('/',
    //name must be present
    body('name').notEmpty().withMessage('Name is required'),
    //username must be present
    body('username').notEmpty().withMessage('Username is required'),
    //phoneNumber must be present
    body('phoneNumber').notEmpty().withMessage('Phone number is required'),
    //email must be valid
    body('email').isEmail().withMessage('Please enter a valid email'),
    //password must be at least 6 characters long
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    async (req, res) => {
        //validation error handling
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, phoneNumber, username, password } = req.body;

        try {
            //check if user already exists
            let user = await User.findOne({ email: email });
            if (user) {
                return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
            }

            //check if username is taken
            let userByUsername = await User.findOne({ username: username });
            if (userByUsername) {
                return res.status(400).json({ errors: [{ msg: 'Username is taken' }] });
            }

            //create new User object
            user = new User({
                name: name,
                email: email,
                phoneNumber: phoneNumber,
                username: username,
                password: password,
                contactID: "000"
            });

            //encrypt password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            //create user contact on Razorpay and save returned contactID
            const body = {
                name: name,
                email: email,
                contact: phoneNumber,
                type: "customer",
            };

            const reqConfig = {
                headers: {
                    'Content-Type': 'application/json'
                },
                auth: {
                    username: process.env.razorpayKeyID,
                    password: process.env.razorpayKeySecret
                }
            }

            //send request to Razorpay
            const response = await axios.post('https://api.razorpay.com/v1/contacts', JSON.stringify(body), reqConfig);

            const contactID = response.data.id;
            user.contactID = contactID;

            //save user to database
            await user.save();

            //generate jwt
            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(payload, process.env.jwtSecret, { expiresIn: '30d' }, (err, token) => {
                if (err) throw err;

                //send success response with token
                res.json({
                    token: token
                });
            });
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }
    });

module.exports = router;
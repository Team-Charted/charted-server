const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

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

        const { name, email, username, password } = req.body;

        try {
            //check if user already exists
            let user = await User.findOne({ email: email });
            if(user) {
                return res.status(400).json({ errors: [ { message: 'User already exists'} ]});
            }

            //check if username is taken
            let userByUsername = await User.findOne({ username: username });
            if(userByUsername) {
                return res.status(400).json({ errors: [ { message: 'Username is taken'} ]});
            }

            //create new User object
            user = new User({
                name: name,
                email: email,
                username: username,
                password: password
            });

            //encrypt password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            //save user to database
            await user.save();

            //generate jwt
            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 3600 }, (err, token) => {
                if(err) throw err;

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
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const router = express.Router();

const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route   GET api/auth
// @desc    Get authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -contactID -fundAccountID -billboardHot100 -spotifyTop200Global');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   POST api/auth
// @desc    Login user
// @access  Public
router.post('/',
    //email must be valid
    body('email').isEmail().withMessage('Please enter a valid email'),
    //password must be at least 6 characters long
    body('password').exists().withMessage('Password is required'),
    async (req, res) => {
        //validation error handling
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, username, password } = req.body;

        try {
            //check if user already exists
            let user = await User.findOne({ email: email });
            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'User does not exist' }] });
            }

            //match password
            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                return res.status(400).json({ errors: [{ msg: "Wrong password" }] })
            }

            //generate jwt
            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 3600 }, (err, token) => {
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
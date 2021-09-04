const express = require('express');
const connectDB = require('./config/db');
const fileUpload = require('express-fileupload');
const cors = require('cors');

const app = express();

//connect MongoDB Atlas database
connectDB();

//init middleware
app.use(cors());
app.use(express.json({ extended: false }));
app.use(fileUpload());

//define routes
app.use('/api/results', require('./routes/api/results'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/charts', require('./routes/api/charts'));
app.use('/api/albums', require('./routes/api/albums'));
app.use('/api/searches', require('./routes/api/searches'));
app.use('/api/transactions', require('./routes/api/transactions'));
app.use('/api/admin', require('./routes/api/admin'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server runnning on port ${PORT}`));
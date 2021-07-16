const express = require('express');
const connectDB = require('./config/db');

const app = express();

//connect MongoDB Atlas database
connectDB();

//init middleware
app.use(express.json({ extended: false }));

//define routes
app.use('/api/admin', require('./routes/api/admin'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/albums', require('./routes/api/albums'));
app.use('/api/searches', require('./routes/api/searches'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server runnning on port ${PORT}`));
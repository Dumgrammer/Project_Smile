require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');

// Debug environment variables
console.log('Environment variables loaded:');
console.log('JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET ? 'DEFINED' : 'UNDEFINED');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'DEFINED' : 'UNDEFINED');
console.log('MONGODB_CONN:', process.env.MONGODB_CONN ? 'DEFINED' : 'UNDEFINED');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'DEFINED' : 'UNDEFINED');

app.use(morgan('dev'));
app.use(express.json());


app.use((req, res, next) => {
    // Set specific origin instead of wildcard for credential requests
    res.header("Access-Control-Allow-Origin", "*");
    // Enable credentials
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        if (req.method === 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');
            return res.status(200).json({});
        }
        next();
});

// Use either MONGODB_CONN or MONGO_URI environment variable
const mongoUri = process.env.MONGODB_CONN;
mongoose.connect(mongoUri)
.then(()=> {
    console.log("Database connected")
})
.catch((err) => {
    console.error("Database connection error:", err);
});
mongoose.Promise = global.Promise;

const adminRoutes = require('./routes/Admin');

app.use('/api/v1/admin', adminRoutes);


app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});


//Error handler for functions
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    })
});

module.exports = app; 
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db/connectDB.js';
import cookieParser from 'cookie-parser';
import userRoute from './routes/user.route.js';

dotenv.config();

connectDB();

const app = express();

const port = process.env.PORT || 5000;

app.use(express.json()); // To parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); // To parse form data in the req.body
app.use(cookieParser());

// Routes
app.use('/api/users', userRoute);

app.listen(port, () => {
    console.log(`Server is running at ${port}`);
})

app.use( (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error!!!';
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message
    })
})
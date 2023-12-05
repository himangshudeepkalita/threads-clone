import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db/connectDB.js';
import cookieParser from 'cookie-parser';
import userRoute from './routes/user.route.js';
import postRoute from './routes/post.route.js';
import {v2 as cloudinary} from "cloudinary";

dotenv.config();

connectDB();

const app = express();

const port = process.env.PORT || 5000;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Middlewares
app.use(express.json()); // To parse JSON data in the req.body
app.use(express.urlencoded({ extended: true })); // To parse form data in the req.body
app.use(cookieParser());

// Routes
app.use('/api/users', userRoute);
app.use('/api/posts', postRoute);

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
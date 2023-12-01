import { User } from "../models/user.model.js";
import jwt from 'jsonwebtoken';

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.access_token;

        if (!token) return res.status(401).json({ message: 'Unauthorized!' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        req.user = user;

        next();
    } catch (error) {
        next(error);
    }
}
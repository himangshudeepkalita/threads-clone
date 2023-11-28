import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { errorHandler } from '../utils/error.js'

export const signup = async (req, res, next) => {
  try {
    const { name, email, username, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      return res.status(400).json({ message: "User already exists!!!" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = newUser._doc;
    res
     .cookie('access_token', token, { httpOnly: true })
     .status(201)
     .json("User created successfully!!!");
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const validUser = await User.findOne({ username });
        if(!validUser) return next(errorHandler(404, 'User not found!!!'));

        const validPassword = bcrypt.compareSync(password, validUser.password);
        if(!validPassword) return next(errorHandler(401, 'Wrong credentials!!'));

        const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
        const { password: pass, ...rest } = validUser._doc;
        res
         .cookie('access_token', token, { httpOnly: true })
         .status(200)
         .json(rest);
    } catch (error) {
        next(error);
    }
}

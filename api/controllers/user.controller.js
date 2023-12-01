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

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('access_token')
    res.status(200).json('User logged out successfully!!!!')
  } catch (error) {
    next(error);
  }
}

export const followUnfollowUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user.id);

    // console.log('ID:', id);
    // console.log('User to Modify:', userToModify);
    // console.log('Current User:', currentUser);

    if (id === req.user.id.toString()) return res.status(400).json({ message: 'You cannot follow/unfollow yourself!!!!'});

    if (!userToModify || !currentUser) return res.status(400).json({ message: 'User not found!!!'});

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // Unfollow user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user.id } });
      await User.findByIdAndUpdate(req.user.id, { $pull: { following: id } });
      res.status(200).json({ message: 'User unfollowed successfully!!!' });
    } else {
      // Follow user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user.id } });
      await User.findByIdAndUpdate(req.user.id, { $push: { following: id } });
      res.status(200).json({ message: 'User followed successfully!!!' });
    }
  } catch (error) {
    next(error);
  }
}

export const updateUser = async (req, res, next) => {
  const { name, email, username, password, profilePic, bio } = req.body;
  const userId = req.user.id;
  try {
    let user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: 'User not found!!!' });

    if(req.params.id !== userId.toString()) return res.status(400).json({ message: "You cannot update other user's profile" });

    if(password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      user.password = hashedPassword;
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.username = username || user.username;
    user.profilePic = profilePic || user.profilePic;
    user.bio = bio || user.bio;

    user = await user.save();

    res.status(200).json({ message: 'Profile updated successfully!!!', user });
  } catch (error) {
    next(error);
  }
}
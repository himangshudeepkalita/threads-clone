import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { errorHandler } from '../utils/error.js'
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { Post } from "../models/post.model.js";

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
     .json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
      bio: newUser.bio,
      profilePic: newUser.profilePic
     });
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
         .json({
          _id: validUser._id,
          name: validUser.name,
          email: validUser.email,
          username: validUser.username,
          bio: validUser.bio,
          profilePic: validUser.profilePic
         });
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
  const { name, email, username, password, bio } = req.body;
  let { profilePic } = req.body;

  const userId = req.user.id;
  try {
    let user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: 'User not found!!!' });

    if(req.params.id !== userId.toString()) return res.status(400).json({ message: "You cannot update other user's profile" });

    if(password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      user.password = hashedPassword;
    }

    if(profilePic) {
      if(user.profilePic) {
        await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
      }

      const uploadedResponse = await cloudinary.uploader.upload(profilePic);
      profilePic = uploadedResponse.secure_url;
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.username = username || user.username;
    user.profilePic = profilePic || user.profilePic;
    user.bio = bio || user.bio;

    user = await user.save();

    // Find all posts that this user replied and update username and userProfilePic fields
    await Post.updateMany(
      {"replies.userId": userId},
      {
        $set:{
          "replies.$[reply].username": user.username,
          "replies.$[reply].userProfilePic": user.profilePic
        }
      },
      {arrayFilters:[{"reply.userId": userId}]}
    )

    // password should be null in response
    user.password = null;

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export const getUserProfile = async (req, res, next) => {
  // We will fetch user profile either with username or userId
  // query is either username or userId
  const { query } = req.params;

  try {
    // const user = await User.findOne({ username }).select("-password").select("-updatedAt");

    let user;

    // query is userId
    if(mongoose.Types.ObjectId.isValid(query)) {
      user = await User.findOne({ _id: query }).select("-password").select("-updatedAt");
    } else {
      // query is username
      user = await User.findOne({ username: query }).select("-password").select("-updatedAt");
    }
    
    if (!user) return res.status(400).json({ message: 'User not found!!!' });

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export const getSuggestedUsers = async (req, res, next) => {
  try {
		// exclude the current user from suggested users array and exclude users that current user is already following
		const userId = req.user.id;

		const usersFollowedByYou = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{
				$sample: { size: 10 },
			},
		]);
		const filteredUsers = users.filter((user) => !usersFollowedByYou.following.includes(user.id));
		const suggestedUsers = filteredUsers.slice(0, 4);

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		next(error);
	}
}

export const freezeAccount = async (req, res, next) => {
  try {
		const user = await User.findById(req.user.id);
		if (!user) {
			return res.status(400).json({ error: "User not found" });
		}

		user.isFrozen = true;
		await user.save();

		res.status(200).json({ success: true });
	} catch (error) {
		next(error);
	}
}
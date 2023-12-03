import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { errorHandler } from "../utils/error.js";

export const createPost = async (req, res, next) => {
    try {
        const { postedBy, text, img } = req.body;

        if (!postedBy || !text) {
            return next(errorHandler(400, 'PostedBy and text fields are required!!!'));
        }

        const user = await User.findById(postedBy);
        if (!user) {
            return next(errorHandler(404, 'User not found!!!'));
        }

        if(user.id.toString() !== req.user.id.toString()) {
            return next(errorHandler(401, 'Unauthorized to create post!!!!'));
        }

        const maxLength = 500;
        if (text.length > maxLength) {
            return next(errorHandler(400, `Text must be less than ${maxLength} characters!!!`));
        }

        const newPost = new Post({ postedBy, text, img });
        await newPost.save();

        res.status(201).json({ message: 'Post created successfully!!!', newPost });
    } catch (error) {
        next(error);
    }
}

export const getPost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post) {
            return next(errorHandler(404, 'Post not found!!!'));
        }

        res.status(200).json({ post });
    } catch (error) {
        next(error);
    }
}

export const deletePost = async (req, res, next) => {
    try {
       const post = await Post.findById(req.params.id);
       if(!post) {
        return next(errorHandler(404, 'Post not found!!!'));
       } 

       if (post.postedBy.toString() !== req.user.id.toString()) {
        return next(errorHandler(401, 'Unauthorized to delete post!!!!'));
       }

       await Post.findByIdAndDelete(req.params.id);

       res.status(200).json({ message: 'Post deleted successfully!!!' });
    } catch (error) {
        next(error);
    }
}

export const likeUnlikePost = async (req, res, next) => {
    try {
       const { id: postId } = req.params;
       const userId = req.user.id;
       
       const post = await Post.findById(postId);

       if(!post) {
        return next(errorHandler(404, 'Post not found!!!'));
       }

       const userLikedPost = post.likes.includes(userId);

       if(userLikedPost) {
        // Unlike post
        await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
        res.status(200).json({ message: 'Post unliked successfully!!!' });
       } else {
        // Like post
        post.likes.push(userId);
        await post.save();
        res.status(200).json({ message: 'Post liked successfully!!!' });
       }
    } catch (error) {
        next(error);
    }
}

export const replyToPost = async (req, res, next) => {
    try {
       const { text } = req.body;
       const postId = req.params.id;
       const userId = req.user.id;
       const userProfilePic = req.user.profilePic;
       const username = req.user.username;
       
       if(!text) {
        return next(errorHandler(400, 'Text field is required!!!'));
       }

       const post = await Post.findById(postId);
       if(!post) {
        return next(errorHandler(404, 'Post not found!!!'));
       }

       const reply = { userId, text, userProfilePic, username };

       post.replies.push(reply);
       await post.save();

       res.status(200).json({ message: 'Reply added successfully!!!', post });
    } catch (error) {
        next(error);
    }
}

export const getFeedPosts = async (req, res, next) => {
    try {
       const userId = req.user.id;
    //    console.log("UserID:", userId);

       const user = await User.findById(userId);
       if(!user) {
        return next(errorHandler(404, 'User not found!!!'));
       } 

       const following = user.following;
    //    console.log("Following:", following);

       const feedPosts = await Post.find({postedBy:{$in:following}}).sort({createdAt: -1});
    //    console.log("Feed Posts:", feedPosts);

       res.status(200).json({feedPosts});
    } catch (error) {
        next(error);
    }
}
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
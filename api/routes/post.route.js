import express from 'express';
import { createPost, deletePost, getFeedPosts, getPost, getUserPosts, likeUnlikePost, replyToPost } from '../controllers/post.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/feed', verifyToken, getFeedPosts);
router.get('/:id', getPost);
router.get('/user/:username', getUserPosts);
router.post('/create',verifyToken, createPost);
router.delete('/:id', verifyToken, deletePost);
router.put('/like/:id', verifyToken, likeUnlikePost);
router.put('/reply/:id', verifyToken, replyToPost);

export default router;
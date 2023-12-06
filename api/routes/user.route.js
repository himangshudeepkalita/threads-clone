import express from 'express';
import { followUnfollowUser, getUserProfile, login, logout, signup, updateUser } from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';


const router = express.Router();

router.get('/profile/:query', getUserProfile);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/follow/:id', verifyToken, followUnfollowUser); // Toggle state (follow/unfollow)
router.put('/update/:id', verifyToken, updateUser);

export default router;
import express from 'express';
import { followUnfollowUser, login, logout, signup, updateUser } from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';


const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/follow/:id', verifyToken, followUnfollowUser);
router.post('/update/:id', verifyToken, updateUser);

export default router;
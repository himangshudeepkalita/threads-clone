import { User } from '../models/user.model.js';
import bcrypt from 'bcrypt';

export const signup = async (req, res, next) => {
    try {
        const { name, email, username, password } = req.body;
        const user = await User.findOne({$or:[{email}, {username}]});

        if(user) {
            return res.status(400).json({message: "User already exists!!!"});
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        
        const newUser = new User({ name, email, username, password: hashedPassword });
        await newUser.save();
        res.status(201).json('User created successfully!!!');
    } catch (error) {
        next(error);
    }
    
}
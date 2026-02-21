import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

//extend the standard Express request so ts knows about our custom user property
export interface AuthRequest extends Request {
    user?: { userId: string };
}  

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try{
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({ error: 'Authentication required. No token provided.' });
          return; // Stop here, do not let them in
        }

    //extract the token
    const token = authHeader.split(' ')[1];

    //verify the token
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    
    //Attach the decoded user id to the request object 
    req.user = { userId: decoded.userId };

    //proceed to the controller
    next();
    } catch (error) {
        res.status(401).json({error: 'Invalid or expired token.'});
    }
};

    
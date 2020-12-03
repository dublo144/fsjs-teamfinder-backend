import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split('Bearer ')[1];
    jwt.verify(token, process.env.TOKEN_SECRET!, (err: any, decodedToken: any) => {
      req.user = decodedToken;
    });
  }
  next();
};

export default authenticateToken;

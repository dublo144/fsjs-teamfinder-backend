const auth = require('basic-auth');
import { Response } from 'express';
import UserFacade from '../facades/userFacadeWithDB';

// Create server
const authMiddleware = async function (req: any, res: Response, next: Function) {
  const credentials = auth(req);
  try {
    if (credentials && (await UserFacade.checkUser(credentials.name, credentials.pass))) {
      const user = await UserFacade.getUser(credentials.name);
      req.userName = user.userName;
      req.role = user.role;
      return next();
    }
  } catch (err) {
    console.log('UPS');
  }
  res.statusCode = 401;
  res.setHeader('WWW-Authenticate', 'Basic realm="example"');
  res.end('Access denied');
};
export default authMiddleware;

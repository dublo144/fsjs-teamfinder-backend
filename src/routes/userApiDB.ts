import express from 'express';
import { UserFacade } from '../facades/userFacade';
import { ApiError } from '../errors/apiError';
import authMiddleware from '../middlewares/basic-auth';
import { getConnectedClient } from '../config/setupDB';
const debug = require('debug')('user-endpoint');

export const router = express.Router();

// const USE_AUTHENTICATION = !process.env.SKIP_AUTHENTICATION;
const USE_AUTHENTICATION = process.env.SKIP_AUTHENTICATION === 'false';

router.get('/', async (req, res, next) => {
  res.json(await UserFacade.getUsers());
});

router.post('/', async function (req, res, next) {
  try {
    let newUser = req.body;
    newUser.role = 'user'; //Even if a hacker tried to "sneak" in his own role, this is what you get
    const status = await UserFacade.addUser(newUser);
    res.json({ status });
  } catch (err) {
    JSON.stringify(err);
    next(new ApiError(err.message, 400));
  }
});

router.get('/:userName', async function (req: any, res, next) {
  try {
    if (USE_AUTHENTICATION) {
      const role = req.role;
      if (role != 'admin') {
        throw new ApiError('Not Authorized', 403);
      }
    }
    const user_Name = req.params.userName;
    const user = await UserFacade.getUser(user_Name);
    if (user == null) {
      throw new ApiError('User not found', 404);
    }
    const { name, userName } = user;
    const userDTO = { name, userName };
    res.json(userDTO);
  } catch (err) {
    next(err);
  }
});

if (USE_AUTHENTICATION) {
  router.use(authMiddleware);
}

if (USE_AUTHENTICATION) {
  router.get('/user/me', async function (req: any, res, next) {
    try {
      const user_Name = req.userName;
      const user = await UserFacade.getUser(user_Name);
      const { name, userName } = user;
      const userDTO = { name, userName };
      res.json(userDTO);
    } catch (err) {
      next(err);
    }
  });
}

router.get('/', async function (req: any, res, next) {
  try {
    if (USE_AUTHENTICATION) {
      const role = req.role;
      if (role != 'admin') {
        throw new ApiError('You are not Authorized with your given Role', 403);
      }
    }
    const users = await UserFacade.getUsers();
    const usersDTO = users.map((user) => {
      const { name, userName } = user;
      return { name, userName };
    });
    return res.json(usersDTO);
  } catch (err) {
    next(err);
  }
});

router.delete('/:userName', async function (req: any, res, next) {
  try {
    if (USE_AUTHENTICATION) {
      const role = req.role;
      if (role != 'admin') {
        throw new ApiError('Not Authorized', 403);
      }
    }
    const user_name = req.params.userName;
    const deletedUser = await UserFacade.deleteUser(user_name);
    res.json(deletedUser);
  } catch (err) {
    next(err);
  }
});

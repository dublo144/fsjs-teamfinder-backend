import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import { ApiError } from './errors/apiError';
import { userAPIRouter, gameAPIRouter, geoApiRouter } from './routes';

const app = express();

app.use(express.static(path.join(process.cwd(), 'public')));

// Add if needed
// app.use(requestLogger)
// app.use(errorLogger)

app.use(express.json());

app.get('/api/dummy', (req, res) => {
  res.json({ msg: 'Hello' });
});

app.use('/api/users', userAPIRouter);
app.use('/gameapi', gameAPIRouter);
app.use('/geoapi', geoApiRouter);

app.use(function (err: any, req: any, res: any, next: Function) {
  if (err instanceof ApiError) {
    const e = <ApiError>err;
    return res.status(e.errorCode).send({ code: e.errorCode, message: e.message });
  }
  next(err);
});

const port = process.env.PORT || 3333;

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@cluster0-wabpp.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
  )
  .then(() =>
    app.listen({ port }, () => {
      console.log(`🚀 Server ready at http://localhost:${port}`);
    })
  )
  .catch((e) => console.log(e));

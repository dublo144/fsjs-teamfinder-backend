import express from 'express';
import path from 'path';
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

const PORT = process.env.PORT || 3333;
const server = app.listen(PORT);

console.log(`Server started, listening on port: ${PORT}`);
module.exports.server = server;

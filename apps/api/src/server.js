import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

import v1routes from './v1/auth.routes.js';

import v3routes from './v3/auth.routes.js';
import v4routes from './v4/auth.routes.js';

import { connectDb } from './config/db.js';
import errorHandler from './middlewares/error.middleware.js';

const server = express();

server.use(cors());
server.use(express.json({ limit: '2kb' }));
server.use(cookieParser());
server.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

server.get('/', (_, res) => {
  res.json({ message: 'Server is running' });
});

server.use('/v1/auth', v1routes);
server.use('/v3/auth', v3routes);
server.use('/v4/auth', v4routes);
server.use(errorHandler);

await connectDb();
server.listen(3000, (err) => {
  if (err) console.log('Failed to start server', err.message);
  console.log('Server is running on Port: 3000');
});

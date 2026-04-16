import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

import v1routes from './v3/auth.routes.js';
import { connectDb } from './config/db.js';

const server = express();

server.use(cors());
server.use(express.json({ limit: '2kb' }));
server.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

server.get('/', (_, res) => {
  res.json({ message: 'Server is running' });
});

server.use('/v3/auth', v1routes);

await connectDb();
server.listen(3000, (err) => {
  if (err) console.log('Failed to start server', err.message);
  console.log('Server is running on Port: 3000');
});

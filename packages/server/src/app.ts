import type { Request, Response } from 'express';

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { graphqlHTTP } from 'express-graphql';
import path from 'path';
import passport from 'passport';
import build from './schema';
import connect from './db/config';
import configure from './config/passport';
import routers from './routers';
import 'dotenv/config';

const main = async (): Promise<void> => {
  const schema = await build();

  const app = express();

  // allow cross origin reqs from client in development
  if (process.env.NODE_ENV !== 'production') {
    app.use(
      cors({
        origin: 'http://localhost:3000',
      }),
    );
  }

  // create graphql endpoint
  app.use(
    '/graphql',
    graphqlHTTP({
      schema,
      graphiql: true,
    }),
  );

  // configure passport
  app.use(passport.initialize());
  app.use(passport.session());
  configure(passport);

  app.use('/api', routers);

  console.log('Connecting to Mongo DB');
  await connect(() => console.log('Connected!'));

  // set client directory
  const CLIENT_DIR = path.join(__dirname, '..', '..', 'client', 'build');

  // Serve static files from the React app
  app.use(express.static(CLIENT_DIR));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(CLIENT_DIR, 'index.html'));
  });

  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Running server http://localhost:${PORT}`);
  });
};

main();

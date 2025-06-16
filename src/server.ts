import { checkConfig } from './config';
checkConfig();

import express from 'express';
import { Request, Response } from 'express';
import api from './api';
import {influxInterval} from "./connection";
const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api', api);

app.get('*', (_req: Request, res: Response) => {
  res.redirect('https://lanis-mobile.github.io');
});

const server = app.listen(3000, () => {
  console.log('Application started on port 3000!');
}, );


process.on('SIGINT', () => {
  console.log("got SIGINT, exiting server...")
  server.close()
  server.closeAllConnections()
  clearInterval(influxInterval)
})
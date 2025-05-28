import { checkConfig } from './config';
checkConfig();

import express from 'express';
import { Request, Response } from 'express';
import api from './api';
const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api', api);

app.get('*', (_req: Request, res: Response) => {
  res.redirect('https://lanis-mobile.github.io');
});

app.listen(3000, () => {
  console.log('Application started on port 3000!');
}, );

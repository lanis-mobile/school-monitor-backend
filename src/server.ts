import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import api from './api';
import { applyConfigFromEnv } from './config';
const app = express();

applyConfigFromEnv();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use('/api', api);

app.get('*', (req: Request, res: Response) => {
  res.redirect('https://lanis-mobile.github.io');
});

app.listen(3000, () => {
  console.log('Application started on port 3000!');
}, );

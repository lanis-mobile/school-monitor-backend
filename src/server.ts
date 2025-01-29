import express from 'express';
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
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

app.use((err: ErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
  res.status(500);
  res.end();
});

app.listen(3000, () => {
  console.log('Application started on port 3000!');
});

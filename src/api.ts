import {ErrorRequestHandler, Router} from "express";
import type { Request, Response, NextFunction } from "express";
import { query } from 'express-validator';
import * as OTPAuth from "otpauth";
import jwt from "jsonwebtoken";
import sql from "./database/connection";
import {IJwt} from "./interfaces/IJwt";
import {IAccount} from "./interfaces/IAccount";

const api = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};


async function authenticated(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.headers.authorization?.startsWith('Bearer ')) {
    res.status(401).end();
    return;
  }
  const token = req.headers.authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'secret');
    if (decoded) {
      const token = decoded as IJwt;
      if (new Date(token.expires_at) < new Date()) {
        res.status(401).end();
        return;
      }
      req.user = token;
      next();
      return;
    }
  } catch (e) {
    res.status(401).end();
    return;
  }
  next();
}

api.post('/log-login', query(['schoolid', 'versioncode', 'date']), asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore
  await sql`
    insert into sph_logins (school_id, app_version_code, time)
    values (${req.query.schoolid}, ${req.query.versioncode}, ${req.query.date})
  `;
  res.status(200).end();
}));

api.post('/login', query(['username', 'totp']), asyncHandler(async (req: Request, res: Response) => {
  if (!req.query.username || !req.query.totp) {
    res.sendStatus(400);
    return;
  }
  const users = await sql`
    select * from accounts where github_username = ${req.query.username as string}
  `;
  if (users.count === 0) {
    res.status(401).end();
  }
  const user: IAccount = users[0] as IAccount;
  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromUTF8(user.totp_secret)
  });
  if (totp.generate() !== req.query.totp) {
    res.status(401).end();
    return;
  }
  const data = {
    account_id: user.id,
    admin: user.admin,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours
  };
  const token = jwt.sign(data, 'secret');
  res.json({token, user: data});
  res.end();
}));

api.post('/auth-test', authenticated, asyncHandler(async (req: Request, res: Response) => {
  res.send(req.user);
}));

api.post('/user', authenticated, query('username'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.admin) {
    res.status(401).end();
    return;
  }

  if (!req.query.username) {
    res.status(400).end();
    return;
  }

  let secret = new OTPAuth.Secret({ size: 20 });

  const users = await sql`
    insert into accounts (github_username, totp_secret) values (${req.query.username as string}, ${secret.utf8})
  `;
  if (users.count === 0) {
    res.status(500).end();
    return;
  }

  const url = `otpauth://totp/Lanis-Mobile-Monitor:${req.query.username}?issuer=Lanis-Mobile-Monitor&secret=${secret}&algorithm=SHA1&digits=6&period=30`

  res.send(url);
}));

api.delete('/user', authenticated, query('username'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.admin) {
    res.status(401).end();
    return;
  }

  if (!req.query.username) {
    res.status(400).end();
    return;
  }

  const users = await sql`
    delete from accounts where github_username = ${req.query.username as string}
  `;
  if (users.count === 0) {
    res.status(500).end();
    return;
  }

  res.status(200).end();
}));

api.get('/users', authenticated, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.admin) {
    res.status(401).end();
    return;
  }

  const users = await sql`
    select (id, github_username, admin, created_at, last_login) from accounts
  `;
  res.json(users);
}));

api.get('/data', authenticated, query(['startTime', 'endTime']), asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore
  const data = await sql`
      SELECT
          school_id,
          DATE(time) AS day,
          COUNT(*) AS entry_count
      FROM
          sph_logins
      WHERE
          time BETWEEN ${req.query.startTime ?? '1970-01-01'} AND ${req.query.endTime ?? '9999-12-31'}
      GROUP BY
          school_id,
          day
      ORDER BY
          school_id,
          day;`

  const groupedData = data.reduce((acc: any, row: any) => {
    if (!acc[row.school_id]) {
      acc[row.school_id] = [];
    }
    acc[row.school_id].push({
      day: row.day.toISOString().slice(0, 10),
      entry_count: Number(row.entry_count)
    });
    return acc;
  }, {});

  res.json({
    data: groupedData,
    uniqueDaysInOrder: [...new Set(data.map((row: any) => row.day.toISOString().slice(0, 10)))]
  });
}));

let schoolList: any[] = [];
api.get('/lanis-school-list', asyncHandler(async (_req: Request, res: Response) => {
  if (schoolList.length === 0) {
   let response = await fetch('https://startcache.schulportal.hessen.de/exporteur.php?a=schoollist');
    schoolList = await response.json();
  }
  res.json(schoolList);
}))

api.get('/testerror', asyncHandler(async (_req: Request, _res: Response) => {
    throw Error('testerror');
}));

api.get('/ping', asyncHandler(async (_req: Request, res: Response) => {
  res.send('pong');
}));

api.use((err: ErrorRequestHandler, req: Request, res: Response, _next: NextFunction) => {
  res.status(500);
  res.end();
});


export default api;
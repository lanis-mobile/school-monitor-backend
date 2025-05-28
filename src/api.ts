import {ErrorRequestHandler, Router} from "express";
import type { Request, Response, NextFunction } from "express";
import { query } from 'express-validator';
import {Point} from "@influxdata/influxdb-client";
import influxWrite from "./database/connection";

const api = Router();

const r = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};


type School = {
  id: string,
  name: string,
  city: string,
  bezirk: string,
  bezirk_id: string,
}

let schoolList: {
  schools: School[],
  timestamp?: Date
} = {
  schools: []
};
async function getSchool(schoolID: string) {
  if (schoolList.schools.length === 0 || !schoolList.timestamp || new Date().getTime() - schoolList.timestamp.getTime() > 2 * 60 * 60 * 1000) {
    let response = await fetch('https://startcache.schulportal.hessen.de/exporteur.php?a=schoollist');
    let responseJson = await response.json();
    let converted = responseJson.map((bezirk: any) => {
      return bezirk.Schulen.map((schoolData: any): School => {
        return {
          id: schoolData.Id,
          name: schoolData.Name,
          city: schoolData.Ort,
          bezirk: bezirk.Name,
          bezirk_id: bezirk.Id
        }
      })
    });
    schoolList.schools = converted.flat();
  }
  let result = schoolList.schools.find(school => school.id === schoolID);
  return result || null;
}


api.post('/log-login', query(['schoolid', 'versioncode', 'platform']), r(async (req: Request, res: Response) => {
  console.log(req.query);
  let schoolID = req.query.schoolid as string;
  let versionCode = req.query.versioncode as string;
  let platform = req.query.platform as string || 'unknown';
  if (req.headers['user-agent'] !== 'Lanis-Mobile' || !schoolID || !versionCode) {
    res.status(200).end('Wrote nothing...');
  }
  let school = await getSchool(schoolID);
  let dataPoint = new Point('clientloginmesurement')
  dataPoint.tag('school_id', schoolID || 'unknown')
  dataPoint.tag('school_bezirk_id', school?.bezirk_id || 'unknown')
  dataPoint.tag('version_code', versionCode || 'unknown')
  dataPoint.tag('platform', platform || 'unknown')
  dataPoint.stringField('school_name', school?.name || 'unknown')
  dataPoint.stringField('school_city', school?.city || 'unknown')
  dataPoint.stringField('school_bezirk', school?.bezirk || 'unknown')

  influxWrite.writePoint(dataPoint)

  res.status(200).end();
}));

api.get('/ping', r(async (_req: Request, res: Response) => {
  res.send('pong');
}));

api.use((err: ErrorRequestHandler, req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500);
  res.end();
});


export default api;
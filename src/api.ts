import { ErrorRequestHandler, Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { query } from "express-validator";
import { Point } from "@influxdata/influxdb-client";
import influxWrite from "./influx";
import { getSchool } from "./handlers/schoollist";
import { getLatestVersions } from "./handlers/latestVersion";

const api = Router();

const r = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

api.post(
  "/log-login",
  query(["schoolid", "versioncode", "platform"]),
  r(async (req: Request, res: Response) => {
    const schoolID = req.query.schoolid as string;
    const versionCode = req.query.versioncode as string;
    const platform = (req.query.platform as string) || "unknown";
    if (
      req.headers["user-agent"] !== "Lanis-Mobile" ||
      !schoolID ||
      !versionCode
    ) {
      res.status(200).json(await getLatestVersions());
    }
    const school = await getSchool(schoolID);
    const dataPoint = new Point("clientloginmesurement");
    dataPoint.tag(
      "school",
      `${schoolID} ${school?.name ?? ""}`.trimEnd() || "unknown",
    );
    dataPoint.tag("school_id", schoolID || "unknown");
    dataPoint.tag("school_bezirk_id", school?.bezirk_id || "unknown");
    dataPoint.tag("version_code", versionCode || "unknown");
    dataPoint.tag("platform", platform || "unknown");
    dataPoint.stringField("school_name", school?.name || "unknown");
    dataPoint.stringField("school_city", school?.city || "unknown");
    dataPoint.stringField("school_bezirk", school?.bezirk || "unknown");

    influxWrite.writePoint(dataPoint);

    res.status(201).json(await getLatestVersions());
  }),
);

api.get(
  "/versions",
  r(async (req, res) => {
    const data = await getLatestVersions();
    return res.json(data);
  }),
);

api.get(
  "/ping",
  r(async (_req: Request, res: Response) => {
    res.send("pong");
  }),
);

api.use(
  (
    err: ErrorRequestHandler,
    req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    console.error(err);
    res.status(500);
    res.end();
  },
);

export default api;

import { IJwt } from "./interfaces/IJwt";

declare global {
  namespace Express {
    interface Request {
      user?: IJwt;
    }
  }
}
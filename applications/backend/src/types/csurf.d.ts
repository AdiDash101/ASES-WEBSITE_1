declare module "csurf" {
  import type { RequestHandler } from "express";

  const csurf: (options?: any) => RequestHandler;
  export default csurf;
}

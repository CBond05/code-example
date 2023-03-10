import * as Koa from "koa";
import * as jwt from "jsonwebtoken";

import { PERMISSION_DENIED } from "../shared/constants";
import config from "../config";

export default async (ctx: Koa.Context, next: () => Promise<any>) => {
  if (ctx.request.headers.authorization) {
    const [, token] = ctx.request.headers.authorization.split(" ");
    if (token) {
      try {
        const decodedToken: any = jwt.verify(token, config.jwt_secret);
        const isTokenExpired = decodedToken.exp < new Date().getTime();
        if (isTokenExpired || !decodedToken.data || !decodedToken.data.user) {
          throw PERMISSION_DENIED;
        }
        ctx.user = decodedToken.data.user;
      } catch (ex) {
        throw PERMISSION_DENIED;
      }
    } else {
      throw PERMISSION_DENIED;
    }
  }

  await next();
};

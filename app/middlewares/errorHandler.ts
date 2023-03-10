import * as Koa from "koa";
import * as HttpStatus from "http-status-codes";
import { IErrorInterface } from "../shared/interfaces";

const handleJoiErrors = (details: any[]): IErrorInterface => {
  if (!details.length) {
    return {
      status: HttpStatus.BAD_REQUEST,
      message: "Bad Request",
    };
  }

  return {
    status: HttpStatus.BAD_REQUEST,
    message: details.map(detail => detail.message).join(),
  };
};

export default async (ctx: Koa.Context, next: () => Promise<any>) => {
  try {
    await next();
  } catch (e) {
    ctx.status = e.status || e.httpStatus || HttpStatus.INTERNAL_SERVER_ERROR;
    e.status = ctx.status;

    if (e.isJoi) {
      const { status, message } = handleJoiErrors(e.details);
      ctx.status = status;
      e.status = status;
      e.message = message;
    }

    ctx.body = {
      code: ctx.status,
      message: e.message,
    };

    ctx.app.emit("error", e, ctx);
  }
};

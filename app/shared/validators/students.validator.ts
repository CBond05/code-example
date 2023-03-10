import { Joi } from "koa-joi-router";
import { classCommonResponse } from "./";

export const studentCommonResponse = {
  id: Joi.number().required(),
  student_name: Joi.string().required(),
  cms_team_member_id: Joi.string().optional(),
  created_at: Joi.date().optional(),
  created_by: Joi.string().optional(),
  updated_at: Joi.date().optional().allow(null),
  updated_by: Joi.string().optional().allow(null),
};

export const studentResponse = Joi.object({
  ...studentCommonResponse,
  classes: Joi.array().items(Joi.object(classCommonResponse)).optional(),
});

export const studentRequestParams = Joi.object({
  id: Joi.number().required(),
});

export const studentRequestBody = Joi.object({
  student_name: Joi.string().required(),
  classes: Joi.array().items(Joi.object({ id: Joi.number().required() })),
});

export const studentMassImportRequest = Joi.array().items(
  Joi.object({
    student_name: Joi.string().required(),
    class_name: Joi.string().required(),
  }),
);

export const studentMassImportResponse = Joi.array().items(
  Joi.object({
    student_name: Joi.string().required(),
    class_name: Joi.string().required(),
    error: Joi.string().required(),
  }),
);

export const studentDeleteResponse = Joi.alternatives().try(studentResponse, Joi.number());

export const studentsResponse = Joi.array().items(studentResponse);

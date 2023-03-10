import { ParameterizedContext } from "koa";
import {
  fetchAllStudents,
  fetchStudentById,
  createOneStudent,
  updateStudentById,
  removeStudentById,
  createManyStudents,
} from "../services";

export const fetchAllStudentsCtrl = async (ctx: ParameterizedContext) => {
  const students = await fetchAllStudents(ctx);
  ctx.ok(students);
};

export const fetchStudentByIdCtrl = async (ctx: ParameterizedContext) => {
  const {
    params: { id },
  } = ctx;
  const student = await fetchStudentById(ctx, id);
  ctx.ok(student);
};

export const createOneStudentCtrl = async (ctx: ParameterizedContext) => {
  const { body } = ctx.request;
  const createdStudent = await createOneStudent(ctx, body);
  ctx.ok(createdStudent);
};

export const updateStudentByIdCtrl = async (ctx: ParameterizedContext) => {
  const {
    params: { id },
  } = ctx;
  const { body } = ctx.request;
  const updatedStudent = await updateStudentById(id, body, ctx);
  ctx.ok(updatedStudent);
};

export const removeStudentByIdCtrl = async (ctx: ParameterizedContext) => {
  const {
    params: { id },
    query: { soft = true },
  } = ctx;
  const removedStudent = await removeStudentById(id, JSON.parse(soft as string), ctx);
  ctx.ok(removedStudent);
};

export const createManyStudentsCtrl = async (ctx: ParameterizedContext) => {
  const { body } = ctx.request;
  const importedStudents = await createManyStudents(ctx, body);
  ctx.ok(importedStudents);
};

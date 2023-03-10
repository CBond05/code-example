import * as Router from "koa-joi-router";
import {
  fetchAllStudentsCtrl,
  fetchStudentByIdCtrl,
  createOneStudentCtrl,
  updateStudentByIdCtrl,
  removeStudentByIdCtrl,
  createManyStudentsCtrl,
} from "../../controllers";
import {
  errorValidators,
  studentsResponse,
  studentResponse,
  studentRequestParams,
  studentRequestBody,
  studentDeleteResponse,
  studentMassImportRequest,
  studentMassImportResponse,
} from "../../shared/validators";

const students = Router();
students.prefix("/students");

students.route({
  method: "get",
  path: "/",
  meta: {
    swagger: {
      summary: "Get all students",
      description: `Get all students`,
      tags: ["STUDENTS"],
    },
  },
  validate: {
    output: {
      200: {
        body: studentsResponse,
      },
      500: {
        body: errorValidators,
      },
    },
  },
  handler: fetchAllStudentsCtrl,
});

students.route({
  method: "get",
  path: "/:id",
  meta: {
    swagger: {
      summary: "Get student by id",
      description: `Get student by id`,
      tags: ["STUDENTS"],
    },
  },
  validate: {
    params: studentRequestParams,
    output: {
      200: {
        body: studentResponse,
      },
      500: {
        body: errorValidators,
      },
    },
  },
  handler: fetchStudentByIdCtrl,
});

students.route({
  method: "post",
  path: "/",
  meta: {
    swagger: {
      summary: "Create student",
      description: `Create student`,
      tags: ["STUDENTS"],
    },
  },
  validate: {
    type: "json",
    body: studentRequestBody,
    output: {
      200: {
        body: studentResponse,
      },
      500: {
        body: errorValidators,
      },
    },
  },
  handler: createOneStudentCtrl,
});

students.route({
  method: "post",
  path: "/upload",
  meta: {
    swagger: {
      summary: "Create students from file",
      description: `Create students from file`,
      tags: ["STUDENTS"],
    },
  },
  validate: {
    type: "json",
    body: studentMassImportRequest,
    output: {
      200: {
        body: studentMassImportResponse,
      },
      500: {
        body: errorValidators,
      },
    },
  },
  handler: createManyStudentsCtrl,
});

students.route({
  method: "put",
  path: "/:id",
  meta: {
    swagger: {
      summary: "Update student by id",
      description: `Update student by id`,
      tags: ["STUDENTS"],
    },
  },
  validate: {
    type: "json",
    body: studentRequestBody,
    params: studentRequestParams,
    output: {
      200: {
        body: studentResponse,
      },
      500: {
        body: errorValidators,
      },
    },
  },
  handler: updateStudentByIdCtrl,
});

students.route({
  method: "delete",
  path: "/:id",
  meta: {
    swagger: {
      summary: "Delete student by id",
      description: `Delete student by id`,
      tags: ["STUDENTS"],
    },
  },
  validate: {
    params: studentRequestParams,
    output: {
      200: {
        body: studentDeleteResponse,
      },
      500: {
        body: errorValidators,
      },
    },
  },
  handler: removeStudentByIdCtrl,
});

export default () => students;

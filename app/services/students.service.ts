import { StudentsModel, Students, ClassesModel, StudentsClassesModel, Classes } from "./../models";
import { ParameterizedContext } from "koa";
import { OrderByDirection, QueryBuilder, Transaction } from "objection";
import { assignStudentToClass } from "./";
import { CREATE_STUDENT_FAILURE } from "../shared/constants";
import { errorAssessor } from "../shared/utils/common";
import { IClass } from "../shared/interfaces";
import { studentsPickSelects } from "../models";
import { fetchAllClasses } from "./classes.service";
import { postOneStudentToCmsTeamMembers } from "../shared/utils/cms";

const fetchStudentsWithClass = (classes: boolean, queryBuilder: QueryBuilder<Students, Students[]>) => {
  if (classes) {
    return queryBuilder
      .modifiers({
        onlyActiveClasses(builder) {
          builder.where({ is_active: true }).modify("defaultSelects").orderBy("created_at", "desc");
        },
      })
      .withGraphFetched("classes(onlyActiveClasses)");
  }

  return queryBuilder;
};

const fetchStudentsQuery = (
  ctx: ParameterizedContext,
  sortBy: string,
  order: OrderByDirection,
  classes: string,
  needAll: boolean,
) => {
  if (needAll) {
    const studentQuery = StudentsModel.query()
      .modify("defaultSelects")
      .where({ is_active: true })
      .orderBy(sortBy, order);
    return fetchStudentsWithClass(JSON.parse(classes as string), studentQuery);
  } else {
    const studentQuery = StudentsModel.query()
      .modify("defaultSelects")
      .where({ is_active: true, cms_user_id: ctx.user.sub })
      .orderBy(sortBy, order);
    return fetchStudentsWithClass(JSON.parse(classes as string), studentQuery);
  }
};

const classesToPushStudentInto = (allClasses: any, classNames: any) => {
  const result: any = [];
  classNames.forEach((name: any) => {
    const cls = allClasses.find((item: any) => name === item.name);
    if (cls) {
      result.push(cls.id);
    } else {
      result.push(0);
    }
  });
  return result;
};

const processStudentsFromFileImportData = (data: any, allClasses: Classes[], classesToUpdateId: any) => {
  const studentsToAdd: any = [];

  data.forEach((studentFromRequest: any, index: number) => {
    if (allClasses.map((cls: any) => cls.name).includes(studentFromRequest.class_name)) {
      allClasses.forEach((cls: any) => {
        const isClassNameCorrect = cls.name === studentFromRequest.class_name;

        const doesStudentAlreadyExistInClass = cls.students
          .map((cl: any) => cl.student_name)
          .includes(studentFromRequest.student_name);

        const isStudentDuplicateInToAddArray = studentsToAdd.some((e: any) =>
          e.studentInfo.student_name === studentFromRequest.student_name &&
          e.classesToUpdateId === classesToUpdateId[index]
            ? true
            : false,
        );

        if (isClassNameCorrect && !doesStudentAlreadyExistInClass && !isStudentDuplicateInToAddArray) {
          studentsToAdd.push({ studentInfo: studentFromRequest, classesToUpdateId: classesToUpdateId[index] });
          studentFromRequest["error"] = "Correct";
          return;
        }
        if (isClassNameCorrect && doesStudentAlreadyExistInClass) {
          studentFromRequest["error"] = "Duplicate student";
        }
        if (isClassNameCorrect && !doesStudentAlreadyExistInClass && isStudentDuplicateInToAddArray) {
          studentFromRequest["error"] = "Duplicate student";
        }
      });
    } else {
      studentFromRequest["error"] = "Wrong class name";
    }
  });
  return studentsToAdd;
};

export const fetchAllStudents = (ctx: ParameterizedContext) => {
  const {
    query: { order = "desc", sortBy = "created_at", classes = true },
  } = ctx;

  return fetchStudentsQuery(ctx, sortBy as string, order as OrderByDirection, classes as string, false);
};

export const fetchStudentById = (ctx: ParameterizedContext, id: number) => {
  const {
    query: { classes = true },
  } = ctx;
  const studentQuery = StudentsModel.query().modify("defaultSelects").where({ id, is_active: true });

  return fetchStudentsWithClass(JSON.parse(classes as string), studentQuery).first();
};

export const createOneStudent = async (ctx: ParameterizedContext, data: Partial<Students>) => {
  const { classes, ...rest } = data;

  const allClasses = (await fetchAllClasses(ctx)) as Classes[];

  const classesWithTheSameStudent = allClasses.filter(cls =>
    cls.students.map(c => c.student_name).includes(data.student_name),
  );
  const notDuplicateClasses = classes.filter(cls => !classesWithTheSameStudent.map(c => c.id).includes(cls.id));

  if (notDuplicateClasses.length) {
    const createdStudentId = await StudentsModel.transaction(async (t: Transaction) => {
      const { id } = await StudentsModel.query(t).context(ctx).insert(rest);

      const resultofAssign = await Promise.allSettled(
        notDuplicateClasses.map(async (cls: IClass) => {
          return await assignStudentToClass(ctx, cls.id, id, t);
        }),
      );

      const teamMembers: any = await Promise.all(
        notDuplicateClasses.map(async cls => await postOneStudentToCmsTeamMembers(ctx, data.student_name, cls.id)),
      );
      await Promise.all(
        teamMembers.map(
          async (member: any) =>
            await StudentsModel.query(t).update({ cms_team_member_id: member.teamMemberId }).where({ id }),
        ),
      );

      // @ts-ignore
      const error: PromiseRejectedResult = resultofAssign.find(r => r.status === "rejected");
      if (!error) {
        return id;
      } else {
        const { message, status } = errorAssessor(CREATE_STUDENT_FAILURE, error.reason.nativeError.detail);
        ctx.throw(message, status);
      }
    });

    return fetchStudentById(ctx, createdStudentId);
  } else {
    ctx.throw("Duplicate student", 400);
  }
};

export const createManyStudents = async (ctx: ParameterizedContext, data: any) => {
  const allClasses = (await fetchAllClasses(ctx)) as Classes[];

  const classesToUpdateId: any = classesToPushStudentInto(
    allClasses,
    data.map((item: any) => item.class_name),
  );

  const studentsToAdd = await processStudentsFromFileImportData(data, allClasses, classesToUpdateId);

  const studentsToInsert: Students[] = [];
  studentsToAdd.map((stdnt: any) => {
    studentsToInsert.push({
      student_name: stdnt.studentInfo.student_name,
    } as Students);
  });

  await StudentsModel.transaction(async (t: Transaction) => {
    if (studentsToAdd.length) {
      const insertedStudents = await StudentsModel.query(t).context(ctx).insertAndFetch(studentsToInsert);
      await Promise.all(
        insertedStudents.map(async (student, index) => {
          await StudentsClassesModel.query(t)
            .context(ctx)
            .insert({ class_id: studentsToAdd[index].classesToUpdateId, student_id: student.id });
        }),
      );

      const teamMembers: any = await Promise.all(
        insertedStudents.map(
          async (student, index) =>
            await postOneStudentToCmsTeamMembers(ctx, student.student_name, studentsToAdd[index].classesToUpdateId),
        ),
      );
      await Promise.all(
        teamMembers.map(
          async (member: any, index: number) =>
            await StudentsModel.query(t)
              .update({ cms_team_member_id: member.teamMemberId })
              .where({ id: insertedStudents[index].id }),
        ),
      );
    }
  });

  return data;
};

export const updateStudentById = async (id: number, studentToUpdate: Partial<Students>, ctx: ParameterizedContext) => {
  return StudentsModel.query().context(ctx).updateAndFetchById(id, studentToUpdate).pick(studentsPickSelects);
};

export const removeStudentById = async (id: number, soft: boolean, ctx: ParameterizedContext) => {
  return soft
    ? StudentsModel.query().context(ctx).updateAndFetchById(id, { is_active: false }).pick(studentsPickSelects)
    : StudentsModel.query().deleteById(id);
};

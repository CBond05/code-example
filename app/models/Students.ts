import { Model, QueryBuilder, QueryContext, ModelOptions } from "objection";
import { CommonModel } from "./common";
import Classes from "./Classes";
import knex from "../knex";
import { join } from "path";
import User from "./User";

export default class Students extends CommonModel {
  static get tableName() {
    return "students";
  }
  student_name: string;

  user_id: number;
  user: User;
  cms_user_id: string;
  cms_team_member_id: string;

  classes?: Classes[];

  $beforeInsert(context: QueryContext) {
    if (context.user) {
      const { user } = context;
      this.created_by = `${user.given_name} ${user.family_name}`;
      this.cms_user_id = String(user.sub);
    } else {
      this.created_by = "system";
    }

    this.created_at = new Date();
  }

  $beforeUpdate(opt: ModelOptions, context: QueryContext) {
    if (context.user) {
      const { user } = context;
      this.updated_by = `${user.given_name} ${user.family_name}`;
    } else {
      this.updated_by = "system";
    }
    this.updated_at = new Date();
  }

  static relationMappings = {
    classes: {
      relation: Model.ManyToManyRelation,
      modelClass: join(__dirname, "Classes"),
      join: {
        from: "students.id",
        through: {
          from: "students_classes.student_id",
          to: "students_classes.class_id",
        },
        to: "classes.id",
      },
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: join(__dirname, "User"),
      join: {
        from: "students.user_id",
        to: "user.id",
      },
    },
  };

  static modifiers = {
    defaultSelects(builder: QueryBuilder<Students>) {
      builder.select(studentsDefaultSelects);
    },
  };
}

export const studentsDefaultSelects = ["students.id", "cms_team_member_id", "student_name", "created_at"];
export const studentsPickSelects = ["id", "cms_team_member_id", "student_name", "created_at"];

export const StudentsModel = Students.bindKnex(knex);
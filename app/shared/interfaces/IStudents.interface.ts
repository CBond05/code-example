import { ICommonFields, IClass, TClass } from "./";

export interface IStudent extends ICommonFields {
  id: number;
  student_name: string;
  classes?: TClass[];
}

export type TStudent = Omit<IStudent, "classes">;

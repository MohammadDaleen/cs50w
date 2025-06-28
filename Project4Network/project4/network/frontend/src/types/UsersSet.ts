import { User } from "./User";

export type UsersSet = {
  count: number;
  next?: string;
  previous?: string;
  users: User[];
};

import { observer } from "mobx-react";
import { UserItem } from "./User";
import { User } from "../types";

export const Users = observer(({ users }: { users: User[] }) => {
  return (
    <>
      {users.map((user) => (
        <UserItem key={user.id} user={user} />
      ))}
    </>
  );
});

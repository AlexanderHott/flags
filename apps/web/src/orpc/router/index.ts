import { logIn, signUp, verifySession } from "./auth";
import { addTodo, listTodos, select1 } from "./todos";

export default {
  listTodos,
  addTodo,
  select1,
  auth: {
    signUp,
    logIn,
    verifySession,
  },
};

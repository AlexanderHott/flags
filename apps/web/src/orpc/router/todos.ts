import { os } from "@orpc/server";
import * as z from "zod";
import { db } from "#/db/index";
import { sql } from "drizzle-orm";

const todos = [
  { id: 1, name: "Get groceries" },
  { id: 2, name: "Buy a new phone" },
  { id: 3, name: "Finish the project" },
];

export const listTodos = os.input(z.object({})).handler(() => {
  return todos;
});

export const addTodo = os.input(z.object({ name: z.string() })).handler(({ input }) => {
  const newTodo = { id: todos.length + 1, name: input.name };
  todos.push(newTodo);
  return newTodo;
});

export const select1 = os.handler(async () => {
  try {
    const one = await db.execute(sql`SELECT 1`);
    return { one };
  } catch (e) {
    console.log("error querying database", e);
    throw e;
  }
});

import { boolean, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { v7 as uuidV7 } from "uuid";

const commonFields = {
  createdAt: timestamp("created_at").defaultNow(),
};

export const users = pgTable(
  "users",
  {
    id: text("id").$defaultFn(() => uuidV7()),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    ...commonFields,
  },
  (table) => [index("username_idx").on(table.username)],
);
export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

export const projects = pgTable(
  "projects",
  {
    id: text("id").$defaultFn(() => uuidV7()),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    userId: text("user_id").references(() => users.id),
    ...commonFields,
  },
  (table) => [index("slug_idx").on(table.slug), index("userId_idx").on(table.userId)],
);
export type Project = typeof projects.$inferSelect;
export type ProjectInsert = typeof projects.$inferInsert;

export const flags = pgTable(
  "flags",
  {
    id: text("id").$defaultFn(() => uuidV7()),
    name: text("name").notNull(),
    enabled: boolean("enabled").notNull().default(false),
    projectId: text("project_id").references(() => projects.id),
    ...commonFields,
  },
  (table) => [unique().on(table.name, table.projectId)],
);
export type Flag = typeof flags.$inferSelect;
export type FlagInsert = typeof flags.$inferInsert;

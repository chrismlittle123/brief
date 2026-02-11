import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const sessionStatusEnum = pgEnum("session_status", [
  "created",
  "in_progress",
  "completed",
  "abandoned",
]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  livekitRoom: text("livekit_room").notNull(),
  status: sessionStatusEnum("status").default("created").notNull(),
  weekOf: text("week_of"),
  transcript: text("transcript"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const updates = pgTable("updates", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => sessions.id),
  userId: text("user_id").notNull(),
  weekOf: text("week_of").notNull(),
  report: jsonb("report").notNull(),
  notionPageId: text("notion_page_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

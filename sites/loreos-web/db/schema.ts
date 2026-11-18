import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";

export const loreWorkspaces = sqliteTable("lore_workspaces", {
 ownerId: text("owner_id").primaryKey(),
 revision: integer("revision").notNull().default(0),
 leaseToken: text("lease_token"),
 leaseUntil: integer("lease_until").notNull().default(0),
 commitToken: text("commit_token"),
});

export const loreRecords = sqliteTable("lore_records", {
 ownerId: text("owner_id").notNull().references(()=>loreWorkspaces.ownerId),
 tableName: text("table_name").notNull(),
 id: text("id").notNull(),
 projectId: text("project_id"),
 recordJson: text("record_json").notNull(),
}, table=>[
 primaryKey({columns:[table.ownerId,table.tableName,table.id]}),
 index("lore_records_owner_project_idx").on(table.ownerId,table.projectId),
]);

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { seedData } from "./seed";
import type { Project } from "./types";
export type Table = "projects" | "entities" | "relations" | "sources" | "proposals" | "history" | "jobs";
const tables: Table[] = ["projects","entities","relations","sources","proposals","history","jobs"];
export class Store {
  readonly db: DatabaseSync;
  constructor(path: string, seed = true) {
    if(path !== ":memory:") mkdirSync(dirname(resolve(path)),{recursive:true});
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
    this.db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);");
    this.db.exec("CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)));");
    for(const table of tables.filter(t=>t!=="projects")) this.db.exec(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, project_id TEXT REFERENCES projects(id), data TEXT NOT NULL CHECK(json_valid(data))); CREATE INDEX IF NOT EXISTS idx_${table}_project ON ${table}(project_id);`);
    this.db.prepare("INSERT OR IGNORE INTO schema_migrations VALUES(1, ?)").run(new Date().toISOString());
    if(seed && !this.all("projects").length) this.transaction(()=>{
      const data=seedData();
      this.put("projects",data.project);
      data.entities.forEach(e=>this.put("entities",e));
      data.relations.forEach(r=>this.put("relations",r));
      data.sources.forEach(s=>this.put("sources",s));
      data.proposals.forEach(p=>this.put("proposals",p));
    });
  }
  get<T>(table:Table,id:string):T | undefined {
    const row=this.db.prepare(`SELECT data FROM ${table} WHERE id=?`).get(id) as {data:string}|undefined;
    return row ? JSON.parse(row.data) as T : undefined;
  }
  all<T>(table:Table,projectId?:string|null):T[] {
    const rows=projectId===undefined ? this.db.prepare(`SELECT data FROM ${table}`).all() : projectId===null ? this.db.prepare(`SELECT data FROM ${table} WHERE project_id IS NULL`).all() : this.db.prepare(`SELECT data FROM ${table} WHERE project_id=?`).all(projectId);
    return rows.map(row=>JSON.parse(row.data as string) as T);
  }
  put<T extends {id:string;projectId?:string|null}>(table:Table,value:T) {
    if(table==="projects") this.db.prepare("INSERT INTO projects(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data").run(value.id,JSON.stringify(value));
    else this.db.prepare(`INSERT INTO ${table}(id,project_id,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET project_id=excluded.project_id,data=excluded.data`).run(value.id,value.projectId??null,JSON.stringify(value));
  }
  remove(table:Table,id:string) { this.db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id); }
  transaction<T>(fn:()=>T):T {
    this.db.exec("BEGIN IMMEDIATE");
    try { const value=fn(); this.db.exec("COMMIT"); return value; }
    catch(error) { this.db.exec("ROLLBACK"); throw error; }
  }
  bump(projectId:string) {
    const p=this.get<Project>("projects",projectId);
    if(!p) throw new Error("세계관을 찾을 수 없습니다.");
    p.revision++; this.put("projects",p);
  }
}
const globalDb = globalThis as unknown as { loreosStore?:Store };
export function getStore() {
  globalDb.loreosStore ??= new Store(resolve(/* turbopackIgnore: true */ process.env.LOREOS_DB_PATH || "./data/loreos.sqlite"));
  return globalDb.loreosStore;
}

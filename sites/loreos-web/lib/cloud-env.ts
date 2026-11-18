import { env } from "cloudflare:workers";
import { AppError } from "./domain";
export function cloudDatabase():D1Database {
 const db=(env as unknown as {DB?:D1Database}).DB;
 if(!db)throw new AppError("클라우드 저장소가 연결되지 않았습니다.",503);
 return db;
}

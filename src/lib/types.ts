export const kinds = ["character", "faction", "location", "item", "event", "lore"] as const;
export type Kind = typeof kinds[number];
export const kindLabels: Record<Kind, string> = { character: "캐릭터", faction: "조직", location: "장소", item: "아이템·무기", event: "사건", lore: "세계관 문서" };
export const fieldLabels: Record<string, string> = {
  name: "이름", summary: "요약", body: "본문", alias: "이명·칭호", species: "종족", age: "나이·생년",
  appearance: "외형", personality: "성격", history: "과거", ability: "능력", weakness: "약점과 제약",
  equipment: "무기·장비", affiliation: "소속", relations: "인물 관계", rules: "세계관 규칙"
};
export const detailFields = ["alias", "species", "age", "appearance", "personality", "history", "ability", "weakness", "equipment", "affiliation", "relations", "rules"] as const;
export const editableFields = ["name", "summary", "body", ...detailFields] as const;
export type Field = typeof editableFields[number];
export type Provenance = "direct" | "inferred" | "created";
export const provenanceLabels = { direct: "원문 근거", inferred: "추론", created: "창작" };
export interface Project { id: string; name: string; description: string; genre: string; demo: boolean; revision: number; createdAt: string; }
export interface Evidence { sourceId: string; quote: string; }
export interface Entity {
  id: string; projectId: string | null; kind: Kind; name: string; summary: string; body: string; tags: string[];
  details: Record<string, string>; protectedFields: Field[]; status: "draft" | "canon"; originId: string | null;
  imageUrl: string; version: number; position: { x: number; y: number }; demo: boolean;
  provenance: Provenance; evidence: Evidence[]; createdAt: string; updatedAt: string;
}
export interface Relation { id: string; projectId: string; source: string; target: string; label: string; }
export interface Source { id: string; projectId: string; title: string; body: string; url: string; description: string; rights: string; demo: boolean; createdAt: string; }
export interface Patch { field: Field; before: string; after: string; reason: string; provenance: Provenance; evidence: Evidence[]; }
export interface EntityDraft { kind: Kind; name: string; summary: string; body: string; details: Record<string, string>; tags: string[]; provenance: Provenance; evidence: Evidence[]; }
export interface Proposal {
  id: string; projectId: string; targetId: string | null; originId: string | null; operation: "edit" | "create" | "variant" | "extract";
  selection?: { text: string; start: number; end: number }; baseVersion: number | null; originVersion: number | null; projectRevision: number; instruction: string; allowedFields: Field[];
  patches: Patch[]; draft: EntityDraft | null; warnings: string[]; sourceIds: string[];
  status: "pending" | "approved" | "rejected"; mode: "demo" | "openai"; createdAt: string; resultId: string | null;
}
export interface History { id: string; entityId: string; projectId: string | null; version: number; snapshot: Entity; reason: string; createdAt: string; }
export interface Job { id: string; projectId: string; status: "running" | "completed" | "failed"; mode: string; instruction: string; error: string | null; createdAt: string; }
export interface Workspace { projects: Project[]; project: Project; entities: Entity[]; originals: Entity[]; relations: Relation[]; sources: Source[]; proposals: Proposal[]; history: History[]; jobs: Job[]; mode: "demo" | "openai"; configured: boolean; }
export function fieldValue(entity: Entity | EntityDraft, field: Field): string {
  return field === "name" || field === "summary" || field === "body" ? entity[field] : entity.details[field] || "";
}
export function setField(entity: Entity | EntityDraft, field: Field, value: string) {
  if (field === "name" || field === "summary" || field === "body") entity[field] = value;
  else entity.details[field] = value;
}

import { defaultEmbeddingModel, indexScenarioDocuments, type AiBinding, type ScenarioVectorDocument, type VectorizeBinding } from "../lib/scenario-vectorize";

interface Env {
  AI?: AiBinding;
  SCENARIO_VECTORIZE?: VectorizeBinding;
  SCENARIO_EMBEDDING_MODEL?: string;
  SCENARIO_INDEX_TOKEN?: string;
}

const maxDocumentsPerRequest = 1000;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.SCENARIO_INDEX_TOKEN) {
    return json({ error: "Scenario indexing is not configured." }, 503);
  }
  if (!authorized(request, env.SCENARIO_INDEX_TOKEN)) {
    return json({ error: "Unauthorized." }, 401);
  }
  if (!env.AI || !env.SCENARIO_VECTORIZE) {
    return json({ error: "AI or Vectorize binding is unavailable." }, 503);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Send a JSON body with scenario documents." }, 400);
  }

  const documents = parseDocuments(payload);
  if (documents.length === 0) return json({ error: "No valid scenario documents supplied." }, 400);
  if (documents.length > maxDocumentsPerRequest) return json({ error: `Send at most ${maxDocumentsPerRequest} scenario documents per request.` }, 400);

  const result = await indexScenarioDocuments({
    ai: env.AI,
    vectorize: env.SCENARIO_VECTORIZE,
    embeddingModel: env.SCENARIO_EMBEDDING_MODEL ?? defaultEmbeddingModel,
    documents
  });

  return json(result);
};

function authorized(request: Request, token: string) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const header = request.headers.get("x-scenario-index-token")?.trim();
  return bearer === token || header === token;
}

function parseDocuments(payload: unknown): ScenarioVectorDocument[] {
  if (!payload || typeof payload !== "object") return [];
  const documents = (payload as Record<string, unknown>).documents;
  if (!Array.isArray(documents)) return [];

  return documents.flatMap((document): ScenarioVectorDocument[] => {
    if (!document || typeof document !== "object") return [];
    const record = document as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.title !== "string" || typeof record.text !== "string") return [];
    const metadata = record.metadata && typeof record.metadata === "object" ? record.metadata as Record<string, string | number | boolean | null | undefined> : {};
    if (typeof metadata.snapshotId !== "string" || typeof metadata.kind !== "string") return [];
    return [{
      id: record.id,
      title: record.title,
      text: record.text,
      metadata
    }];
  });
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store"
    }
  });
}

export interface ScenarioVectorDocument {
  id: string;
  title: string;
  text: string;
  metadata: Record<string, string | number | boolean | null | undefined>;
}

export interface ScenarioVectorMatch {
  id: string;
  score?: number;
  title: string;
  text: string;
  metadata: Record<string, unknown>;
}

export interface AiBinding {
  run(model: string, input: unknown, options?: unknown): Promise<unknown>;
}

export interface VectorizeBinding {
  upsert(vectors: VectorizeVectorInput[]): Promise<unknown>;
  query(vector: number[], options: VectorizeQueryOptions): Promise<VectorizeQueryResult>;
}

interface VectorizeVectorInput {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

interface VectorizeQueryOptions {
  topK: number;
  filter?: Record<string, unknown>;
  returnMetadata?: "all" | boolean;
  returnValues?: boolean;
}

interface VectorizeQueryResult {
  matches?: VectorizeMatch[];
}

interface VectorizeMatch {
  id: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export const defaultEmbeddingModel = "@cf/baai/bge-base-en-v1.5";

const maxMetadataTextLength = 1800;
const maxRetrievedDocuments = 8;
const maxRetrievedTextLength = 9000;

export async function indexScenarioDocuments(input: {
  ai?: AiBinding;
  vectorize?: VectorizeBinding;
  embeddingModel?: string;
  documents: ScenarioVectorDocument[];
  batchSize?: number;
}) {
  if (!input.ai || !input.vectorize) {
    return { indexed: 0, skipped: input.documents.length, reason: "AI or Vectorize binding unavailable" };
  }

  const documents = input.documents.filter((document) => document.text.trim());
  const batchSize = input.batchSize ?? 25;
  let indexed = 0;

  for (let offset = 0; offset < documents.length; offset += batchSize) {
    const batch = documents.slice(offset, offset + batchSize);
    const embeddings = await embedTexts(input.ai, batch.map((document) => `${document.title}\n${document.text}`), input.embeddingModel);
    const vectors = batch.map((document, index) => ({
      id: document.id,
      values: embeddings[index],
      metadata: metadataForVector(document)
    }));
    await input.vectorize.upsert(vectors);
    indexed += vectors.length;
  }

  return { indexed, skipped: input.documents.length - documents.length };
}

export async function retrieveScenarioDocuments(input: {
  ai?: AiBinding;
  vectorize?: VectorizeBinding;
  embeddingModel?: string;
  question: string;
  teamId?: string;
  snapshotId?: string;
}) {
  if (!input.ai || !input.vectorize || !input.question.trim()) return [];

  try {
    const [embedding] = await embedTexts(input.ai, [input.question], input.embeddingModel);
    const queries = [
      input.snapshotId && input.teamId ? { snapshotId: input.snapshotId, teamId: input.teamId } : undefined,
      input.snapshotId ? { snapshotId: input.snapshotId } : undefined,
      undefined
    ].filter((filter, index, array) => filter !== undefined || index === array.length - 1);

    const matches: ScenarioVectorMatch[] = [];
    const seen = new Set<string>();
    for (const filter of queries) {
      const result = await queryVectorize(input.vectorize, embedding, filter);
      for (const match of result) {
        if (seen.has(match.id)) continue;
        if (input.snapshotId && match.metadata.snapshotId !== input.snapshotId) continue;
        seen.add(match.id);
        matches.push(match);
      }
      if (matches.length >= maxRetrievedDocuments) break;
    }

    return trimRetrievedDocuments(matches);
  } catch {
    return [];
  }
}

async function queryVectorize(vectorize: VectorizeBinding, embedding: number[], filter?: Record<string, unknown>) {
  try {
    return matchesFromResult(await vectorize.query(embedding, {
      topK: maxRetrievedDocuments,
      ...(filter ? { filter } : {}),
      returnMetadata: "all"
    }));
  } catch (error) {
    if (!filter) throw error;
    return matchesFromResult(await vectorize.query(embedding, {
      topK: maxRetrievedDocuments,
      returnMetadata: "all"
    }));
  }
}

async function embedTexts(ai: AiBinding, texts: string[], model = defaultEmbeddingModel) {
  const result = await ai.run(model, { text: texts.length === 1 ? texts[0] : texts });
  const embeddings = extractEmbeddings(result);
  if (embeddings.length !== texts.length) {
    throw new Error(`Embedding model returned ${embeddings.length} vectors for ${texts.length} texts.`);
  }
  return embeddings;
}

function extractEmbeddings(result: unknown): number[][] {
  if (!result || typeof result !== "object") return [];
  const record = result as Record<string, unknown>;
  const data = record.data;
  if (Array.isArray(data)) {
    if (isNumberArray(data)) return [data];
    return data.flatMap((item) => {
      if (isNumberArray(item)) return [item];
      if (item && typeof item === "object" && isNumberArray((item as Record<string, unknown>).embedding)) {
        return [(item as Record<string, number[]>).embedding];
      }
      return [];
    });
  }

  const embeddings = record.embeddings;
  if (Array.isArray(embeddings)) {
    return embeddings.flatMap((item) => isNumberArray(item) ? [item] : []);
  }

  return [];
}

function matchesFromResult(result: VectorizeQueryResult): ScenarioVectorMatch[] {
  return (result.matches ?? []).flatMap((match) => {
    const metadata = match.metadata ?? {};
    const text = typeof metadata.text === "string" ? metadata.text : "";
    if (!text.trim()) return [];
    return [{
      id: match.id,
      score: match.score,
      title: typeof metadata.title === "string" ? metadata.title : match.id,
      text,
      metadata
    }];
  });
}

function trimRetrievedDocuments(matches: ScenarioVectorMatch[]) {
  const kept: ScenarioVectorMatch[] = [];
  let total = 0;
  for (const match of matches.slice(0, maxRetrievedDocuments)) {
    const length = match.text.length + match.title.length;
    if (kept.length > 0 && total + length > maxRetrievedTextLength) break;
    kept.push(match);
    total += length;
  }
  return kept;
}

function metadataForVector(document: ScenarioVectorDocument) {
  return {
    ...Object.fromEntries(Object.entries(document.metadata).filter(([, value]) => value !== undefined)),
    title: document.title.slice(0, 180),
    text: document.text.slice(0, maxMetadataTextLength)
  };
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

export interface Column {
  key: string;
  label: string;
}

export interface AskResponse {
  success: boolean;
  question: string;
  generatedSql: string;
  columns: Column[];
  rows: Record<string, any>[];
  title: string;
  summary: string;
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

export interface SetupResponse {
  success: boolean;
  message: string;
  documentsIndexed: number;
  error?: string;
}

export interface QueryMemoryMetadata {
  createdAt: string;
  lastUsedAt: string;
  usageCount: number;
  success: boolean;
  executionTimeMs?: number;
}

export interface QueryMemoryEntry {
  id: number;
  questionOriginal: string;
  questionNormalized: string;
  generatedSql: string;
  embedding: number[];
  metadata: QueryMemoryMetadata;
}

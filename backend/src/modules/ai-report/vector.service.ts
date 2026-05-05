import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    tableName?: string;
    type: 'table' | 'column' | 'relationship' | 'rule';
  };
}

@Injectable()
export class VectorService {
  private openai: OpenAI;
  private documents: VectorDocument[] = [];

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    });

    return response.data[0].embedding;
  }

  async addDocuments(items: { content: string; metadata: VectorDocument['metadata'] }[]): Promise<void> {
    const docs: VectorDocument[] = [];
    
    for (const item of items) {
      const embedding = await this.generateEmbedding(item.content);
      docs.push({
        id: `${item.metadata.type}_${item.metadata.tableName || ''}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: item.content,
        embedding,
        metadata: item.metadata,
      });
    }

    this.documents.push(...docs);
  }

  async search(query: string, topK: number = 5): Promise<{ content: string; metadata: VectorDocument['metadata']; score: number }[]> {
    if (this.documents.length === 0) {
      return [];
    }

    const queryEmbedding = await this.generateEmbedding(query);
    
    // Calculate cosine similarity with all documents
    const scored = this.documents.map(doc => ({
      content: doc.content,
      metadata: doc.metadata,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    // Sort by score descending and take top K
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  clear(): void {
    this.documents = [];
  }

  getDocumentCount(): number {
    return this.documents.length;
  }
}

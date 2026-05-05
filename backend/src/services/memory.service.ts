import { Injectable } from '@nestjs/common';
import { JsonStorageService } from './json-storage.service';
import { QueryMemory, QueryMemoryEntry, QueryMemoryStats } from './types';

@Injectable()
export class MemoryService {
  private readonly MEMORY_FILENAME = 'query-memory.json';

  constructor(private jsonStorage: JsonStorageService) {}

  async getMemory(): Promise<QueryMemory> {
    const memory = await this.jsonStorage.readJson<QueryMemory>(this.MEMORY_FILENAME);
    
    if (!memory) {
      // Return empty memory if file doesn't exist
      return {
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        queries: [],
        stats: { totalQueries: 0 },
      };
    }
    
    return memory;
  }

  async findSimilarQuery(normalizedQuestion: string, embedding: number[], threshold: number = 0.92): Promise<QueryMemoryEntry | null> {
    const memory = await this.getMemory();
    
    if (memory.queries.length === 0) {
      return null;
    }

    let bestMatch: QueryMemoryEntry | null = null;
    let bestScore = 0;

    for (const query of memory.queries) {
      // First check exact match on normalized question
      if (query.questionNormalized === normalizedQuestion) {
        return query;
      }

      // Then check semantic similarity using cosine similarity
      const score = this.cosineSimilarity(embedding, query.embedding);
      
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = query;
      }
    }

    return bestMatch;
  }

  async saveQuery(
    questionOriginal: string,
    questionNormalized: string,
    generatedSql: string,
    embedding: number[],
  ): Promise<number> {
    const memory = await this.getMemory();
    
    // Generate new ID
    const newId = memory.queries.length > 0 
      ? Math.max(...memory.queries.map(q => q.id)) + 1 
      : 1;

    const newEntry: QueryMemoryEntry = {
      id: newId,
      questionOriginal,
      questionNormalized,
      generatedSql,
      embedding,
      metadata: {
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        usageCount: 1,
        success: true,
      },
    };

    memory.queries.push(newEntry);
    memory.updatedAt = new Date().toISOString();
    memory.stats = this.calculateStats(memory.queries);

    await this.jsonStorage.writeJson(this.MEMORY_FILENAME, memory);
    
    return newId;
  }

  async updateQueryUsage(id: number): Promise<void> {
    const memory = await this.getMemory();
    
    const query = memory.queries.find(q => q.id === id);
    if (!query) {
      return;
    }

    query.metadata.usageCount += 1;
    query.metadata.lastUsedAt = new Date().toISOString();
    memory.updatedAt = new Date().toISOString();
    memory.stats = this.calculateStats(memory.queries);

    await this.jsonStorage.writeJson(this.MEMORY_FILENAME, memory);
  }

  async deleteQuery(id: number): Promise<boolean> {
    const memory = await this.getMemory();
    
    const index = memory.queries.findIndex(q => q.id === id);
    if (index === -1) {
      return false;
    }

    memory.queries.splice(index, 1);
    memory.updatedAt = new Date().toISOString();
    memory.stats = this.calculateStats(memory.queries);

    await this.jsonStorage.writeJson(this.MEMORY_FILENAME, memory);
    
    return true;
  }

  async cleanupOldQueries(days: number = 90, minUsageCount: number = 2): Promise<number> {
    const memory = await this.getMemory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const originalCount = memory.queries.length;
    
    memory.queries = memory.queries.filter(q => {
      const lastUsed = new Date(q.metadata.lastUsedAt);
      const isOld = lastUsed < cutoffDate;
      const isRarelyUsed = q.metadata.usageCount < minUsageCount;
      
      // Keep if: not old OR used frequently
      return !isOld || !isRarelyUsed;
    });

    const deletedCount = originalCount - memory.queries.length;
    
    if (deletedCount > 0) {
      memory.updatedAt = new Date().toISOString();
      memory.stats = this.calculateStats(memory.queries);
      await this.jsonStorage.writeJson(this.MEMORY_FILENAME, memory);
    }

    return deletedCount;
  }

  async getStats(): Promise<QueryMemoryStats> {
    const memory = await this.getMemory();
    return memory.stats;
  }

  async getAllQueries(): Promise<QueryMemoryEntry[]> {
    const memory = await this.getMemory();
    // Sort by usage count descending, then by last used descending
    return memory.queries.sort((a, b) => {
      if (b.metadata.usageCount !== a.metadata.usageCount) {
        return b.metadata.usageCount - a.metadata.usageCount;
      }
      return new Date(b.metadata.lastUsedAt).getTime() - new Date(a.metadata.lastUsedAt).getTime();
    });
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

  private calculateStats(queries: QueryMemoryEntry[]): QueryMemoryStats {
    if (queries.length === 0) {
      return { totalQueries: 0 };
    }

    const mostUsed = queries.reduce((max, q) => 
      q.metadata.usageCount > max.metadata.usageCount ? q : max
    );

    const totalExecutionTime = queries
      .filter(q => q.metadata.executionTimeMs)
      .reduce((sum, q) => sum + (q.metadata.executionTimeMs || 0), 0);
    
    const countWithTime = queries.filter(q => q.metadata.executionTimeMs).length;

    return {
      totalQueries: queries.length,
      mostUsedQueryId: mostUsed.id,
      averageExecutionTimeMs: countWithTime > 0 ? totalExecutionTime / countWithTime : undefined,
    };
  }
}

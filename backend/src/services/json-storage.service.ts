import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JsonStorageService {
  private readonly dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log(`Created data directory at ${this.dataDir}`);
    }
  }

  getDataDir(): string {
    return this.dataDir;
  }

  async readJson<T>(filename: string): Promise<T | null> {
    const filepath = path.join(this.dataDir, filename);
    
    try {
      if (!fs.existsSync(filepath)) {
        return null;
      }
      
      const content = await fs.promises.readFile(filepath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      console.error(`Error reading ${filename}:`, error.message);
      return null;
    }
  }

  async writeJson<T>(filename: string, data: T): Promise<void> {
    const filepath = path.join(this.dataDir, filename);
    
    try {
      const content = JSON.stringify(data, null, 2);
      await fs.promises.writeFile(filepath, content, 'utf-8');
    } catch (error) {
      console.error(`Error writing ${filename}:`, error.message);
      throw error;
    }
  }

  async readText(filename: string): Promise<string | null> {
    const filepath = path.join(this.dataDir, filename);
    
    try {
      if (!fs.existsSync(filepath)) {
        return null;
      }
      
      return await fs.promises.readFile(filepath, 'utf-8');
    } catch (error) {
      console.error(`Error reading ${filename}:`, error.message);
      return null;
    }
  }

  async writeText(filename: string, content: string): Promise<void> {
    const filepath = path.join(this.dataDir, filename);
    
    try {
      await fs.promises.writeFile(filepath, content, 'utf-8');
    } catch (error) {
      console.error(`Error writing ${filename}:`, error.message);
      throw error;
    }
  }

  fileExists(filename: string): boolean {
    const filepath = path.join(this.dataDir, filename);
    return fs.existsSync(filepath);
  }

  async deleteFile(filename: string): Promise<boolean> {
    const filepath = path.join(this.dataDir, filename);
    
    try {
      if (!fs.existsSync(filepath)) {
        return false;
      }
      
      await fs.promises.unlink(filepath);
      return true;
    } catch (error) {
      console.error(`Error deleting ${filename}:`, error.message);
      return false;
    }
  }
}

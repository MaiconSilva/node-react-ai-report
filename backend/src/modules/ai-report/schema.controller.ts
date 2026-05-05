import { Controller, Get, Post, Body } from '@nestjs/common';
import { SchemaService } from '../../services/schema.service';
import { DatabaseSchema } from '../../services/types';

interface ExtractSchemaDto {
  force?: boolean;
}

@Controller('schema')
export class SchemaController {
  constructor(private readonly schemaService: SchemaService) {}

  @Get()
  async getSchema(): Promise<DatabaseSchema | { error: string }> {
    const schema = await this.schemaService.getSchema();
    
    if (!schema) {
      return { error: 'Schema not found. Run POST /schema/extract first.' };
    }
    
    return schema;
  }

  @Post('extract')
  async extractSchema(@Body() dto: ExtractSchemaDto): Promise<{ success: boolean; message: string; schema?: DatabaseSchema }> {
    try {
      // Check if schema already exists
      const exists = await this.schemaService.schemaExists();
      
      if (exists && !dto.force) {
        return {
          success: false,
          message: 'Schema already exists. Use force: true to overwrite.',
        };
      }

      const schema = await this.schemaService.extractFromDatabase();
      
      return {
        success: true,
        message: `Schema extracted successfully: ${schema.tables.length} tables`,
        schema,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to extract schema: ${error.message}`,
      };
    }
  }

  @Post('validate')
  async validateSchema(): Promise<{ valid: boolean; errors: string[] }> {
    return this.schemaService.validateSchema();
  }

  @Get('exists')
  async checkSchema(): Promise<{ exists: boolean }> {
    const exists = await this.schemaService.schemaExists();
    return { exists };
  }
}

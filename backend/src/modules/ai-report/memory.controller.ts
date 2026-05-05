import { Controller, Get, Delete, Param, Post, Body } from '@nestjs/common';
import { MemoryService } from '../../services/memory.service';
import { QueryMemoryEntry, QueryMemoryStats } from '../../services/types';

interface CleanupDto {
  days?: number;
  minUsageCount?: number;
}

@Controller('memory')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Get()
  async getAllQueries(): Promise<{ queries: QueryMemoryEntry[]; count: number }> {
    const queries = await this.memoryService.getAllQueries();
    return { queries, count: queries.length };
  }

  @Get('stats')
  async getStats(): Promise<QueryMemoryStats> {
    return this.memoryService.getStats();
  }

  @Delete(':id')
  async deleteQuery(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.memoryService.deleteQuery(parseInt(id, 10));
    
    if (deleted) {
      return {
        success: true,
        message: `Query ${id} deleted successfully`,
      };
    } else {
      return {
        success: false,
        message: `Query ${id} not found`,
      };
    }
  }

  @Post('cleanup')
  async cleanupOldQueries(@Body() dto: CleanupDto): Promise<{ deleted: number; message: string }> {
    const days = dto.days || 90;
    const minUsageCount = dto.minUsageCount || 2;
    
    const deleted = await this.memoryService.cleanupOldQueries(days, minUsageCount);
    
    return {
      deleted,
      message: `${deleted} old queries removed (older than ${days} days with < ${minUsageCount} uses)`,
    };
  }
}

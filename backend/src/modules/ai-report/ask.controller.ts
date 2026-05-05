import { Controller, Post, Body, Get } from '@nestjs/common';
import { AskService } from './ask.service';

interface AskDto {
  question: string;
}

@Controller()
export class AskController {
  constructor(private readonly askService: AskService) {}

  @Post('initialize')
  async initialize() {
    await this.askService.initialize();
    return {
      success: true,
      message: 'System initialized with default rules',
    };
  }

  @Post('reload-context')
  async reloadContext() {
    await this.askService.loadContextToVectorStore();
    return {
      success: true,
      message: 'Context reloaded to vector store',
    };
  }

  @Post('ask')
  async ask(@Body() dto: AskDto) {
    if (!dto.question || dto.question.trim().length === 0) {
      return {
        success: false,
        error: 'Question is required',
      };
    }

    return this.askService.ask({ question: dto.question.trim() });
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

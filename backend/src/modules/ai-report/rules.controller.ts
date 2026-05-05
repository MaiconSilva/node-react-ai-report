import { Controller, Get, Post, Body } from '@nestjs/common';
import { RulesService } from '../../services/rules.service';

interface UpdateRulesDto {
  content: string;
}

@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  async getRules(): Promise<{ content: string }> {
    const content = await this.rulesService.getRules();
    return { content };
  }

  @Post()
  async updateRules(@Body() dto: UpdateRulesDto): Promise<{ success: boolean; message: string }> {
    try {
      await this.rulesService.saveRules(dto.content);
      return {
        success: true,
        message: 'Business rules updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update rules: ${error.message}`,
      };
    }
  }

  @Get('exists')
  async checkRules(): Promise<{ exists: boolean }> {
    const exists = await this.rulesService.rulesExist();
    return { exists };
  }

  @Post('initialize')
  async initializeDefault(): Promise<{ success: boolean; message: string }> {
    try {
      await this.rulesService.initializeDefaultRules();
      return {
        success: true,
        message: 'Default business rules initialized',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize rules: ${error.message}`,
      };
    }
  }
}

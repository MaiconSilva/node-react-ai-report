import { Module } from '@nestjs/common';
import { AskController } from './ask.controller';
import { AskService } from './ask.service';
import { DbService } from './db.service';
import { VectorService } from './vector.service';
import { SqlGeneratorService } from './sql-generator.service';
import { SqlValidatorService } from './sql-validator.service';
import { SqlAstValidatorService } from './sql-ast-validator.service';
import { SchemaController } from './schema.controller';
import { RulesController } from './rules.controller';
import { MemoryController } from './memory.controller';
import { JsonStorageService } from '../../services/json-storage.service';
import { SchemaService } from '../../services/schema.service';
import { RulesService } from '../../services/rules.service';
import { MemoryService } from '../../services/memory.service';

@Module({
  controllers: [
    AskController,
    SchemaController,
    RulesController,
    MemoryController,
  ],
  providers: [
    AskService,
    DbService,
    VectorService,
    SqlGeneratorService,
    SqlValidatorService,
    SqlAstValidatorService,
    JsonStorageService,
    SchemaService,
    RulesService,
    MemoryService,
  ],
})
export class AiReportModule {}

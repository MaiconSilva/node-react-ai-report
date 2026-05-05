import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiReportModule } from './modules/ai-report/ai-report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AiReportModule,
  ],
})
export class AppModule {}

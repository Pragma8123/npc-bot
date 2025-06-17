import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>('OPENWEBUI_API_URL'),
        headers: {
          Authorization: `Bearer ${configService.get<string>('OPENWEBUI_API_KEY')}`,
        },
      }),
    }),
  ],
  exports: [AiService],
  providers: [AiService],
})
export class AiModule {}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntentsBitField } from 'discord.js';
import { NecordModule } from 'necord';
import { CommandsService } from './commands.service';
import { EventsService } from './events.service';
import { AiModule } from 'src/ai/ai.module';

@Module({
  imports: [
    NecordModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        token: configService.get<string>('DISCORD_TOKEN'),
        intents: [
          IntentsBitField.Flags.Guilds,
          IntentsBitField.Flags.GuildMessages,
          IntentsBitField.Flags.MessageContent,
        ],
        development: [configService.get<string>('DISCORD_DEV_ID')],
      }),
    }),
    AiModule,
  ],
  providers: [CommandsService, EventsService],
})
export class BotModule { }

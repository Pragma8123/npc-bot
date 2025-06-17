import { Injectable, Logger } from '@nestjs/common';
import {
  Context,
  MessageCommand,
  MessageCommandContext,
  Options,
  SlashCommand,
  SlashCommandContext,
  TargetMessage,
} from 'necord';
import { AiService } from 'src/ai/ai.service';
import { CompletionPromptDto } from './completion-prompt.dto';
import { AttachmentBuilder, Message } from 'discord.js';
import { ImagePromptDto } from './image-prompt.dto';

const EDIT_INTERVAL = 500; // ms

@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);

  constructor(private readonly aiService: AiService) { }

  @SlashCommand({
    name: 'completion',
    description: 'Generate AI completion from a prompt.',
  })
  async onCompletion(
    @Context() [interaction]: SlashCommandContext,
    @Options() { prompt }: CompletionPromptDto,
  ) {
    await interaction.deferReply();

    this.aiService.throttledCompletion(prompt, EDIT_INTERVAL).subscribe({
      next: async (content) => {
        try {
          await interaction.editReply({ content });
        } catch (error) {
          this.logger.error(`editReply error: ${error}`);
        }
      },
      error: async (error) => {
        this.logger.error(error);
        try {
          await interaction.editReply({ content: 'There was an error :(' });
        } catch (error) {
          this.logger.error(`editReply error: ${error}`);
        }
      },
    });
  }

  @SlashCommand({
    name: 'image',
    description: 'Generate an image using FLUX.1-schnell',
  })
  async onImage(
    @Context() [interaction]: SlashCommandContext,
    @Options() { prompt }: ImagePromptDto,
  ) {
    await interaction.deferReply();

    try {
      const imageBuffer = await this.aiService.image(prompt);
      const image = new AttachmentBuilder(imageBuffer, { name: 'image.png' });
      image.setSpoiler(true);
      await interaction.editReply({
        content: `\`${prompt}\``,
        files: [image],
        embeds: [
          {
            image: {
              url: `attachment://${image.name}`,
            },
          },
        ],
      });
    } catch (error) {
      this.logger.error(`Error generating image: ${error}`);
      await interaction.editReply({
        content: 'There was an error generating your image :(',
      });
    }
  }

  @MessageCommand({ name: 'Explain' })
  async explainMessage(
    @Context() [interaction]: MessageCommandContext,
    @TargetMessage() message: Message,
  ) {
    await interaction.deferReply();

    const prompt = `Explain this Discord message: ${message.content}`;

    this.aiService.throttledCompletion(prompt, EDIT_INTERVAL).subscribe({
      next: async (content) => {
        try {
          await interaction.editReply({ content });
        } catch (error) {
          this.logger.error(`editReply error: ${error}`);
        }
      },
      error: async (error) => {
        try {
          this.logger.error(error);
          await interaction.editReply({ content: `There was an error :(` });
        } catch (error) {
          this.logger.error(`editReply error: ${error}`);
        }
      },
    });
  }
}

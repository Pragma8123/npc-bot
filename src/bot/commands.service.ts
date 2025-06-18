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
import { AttachmentBuilder, Message, MessageFlags } from 'discord.js';
import { ImagePromptDto } from './image-prompt.dto';
import packageInfo from 'src/package-info';
import { HttpService } from '@nestjs/axios';

const EDIT_INTERVAL = 500; // ms

@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly httpService: HttpService,
  ) { }

  @SlashCommand({
    name: 'completion',
    description: 'Generate AI completion from a prompt.',
  })
  async onCompletion(
    @Context() [interaction]: SlashCommandContext,
    @Options() { prompt }: CompletionPromptDto,
  ) {
    await interaction.deferReply();

    this.aiService.throttledCompletion(prompt, null, EDIT_INTERVAL).subscribe({
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

  @SlashCommand({
    name: 'version',
    description: "NPC's version.",
  })
  async version(@Context() [interaction]: SlashCommandContext) {
    try {
      await interaction.reply({
        content: `Version: ${packageInfo.version}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      this.logger.error(`reply error: ${error}`);
    }
  }

  @MessageCommand({ name: 'Explain' })
  async explainMessage(
    @Context() [interaction]: MessageCommandContext,
    @TargetMessage() message: Message,
  ) {
    await interaction.deferReply();

    let images = [];
    try {
      images = await this.getAttachedImagesBase64(message);
    } catch (error) {
      this.logger.error(`Error fetching images: ${error}`);
    }

    const prompt = `Explain this discord message and the attached messages if present: ${message.content}`;

    this.aiService
      .throttledCompletion(prompt, images, EDIT_INTERVAL)
      .subscribe({
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

  private async getAttachedImagesBase64(message: Message): Promise<string[]> {
    const images: string[] = [];

    await Promise.all(
      message.attachments.map(async ({ contentType, url }) => {
        if (contentType && contentType.startsWith('image')) {
          const { data } = await this.httpService.axiosRef.get(url, {
            responseType: 'arraybuffer',
          });
          images.push(Buffer.from(data).toString('base64'));
        }
      }),
    );

    return images;
  }
}

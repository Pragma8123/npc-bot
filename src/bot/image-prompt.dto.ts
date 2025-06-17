import { StringOption } from 'necord';

export class ImagePromptDto {
  @StringOption({
    name: 'prompt',
    description: 'Image prompt.',
    required: true,
  })
  prompt: string;
}

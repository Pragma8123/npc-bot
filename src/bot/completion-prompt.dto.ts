import { StringOption } from 'necord';

export class CompletionPromptDto {
  @StringOption({
    name: 'prompt',
    description: 'Prompt to generate from.',
    required: true,
  })
  prompt: string;
}

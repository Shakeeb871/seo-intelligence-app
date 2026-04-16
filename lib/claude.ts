import Anthropic from '@anthropic-ai/sdk';

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return new Anthropic({ apiKey });
}

export async function callClaude(prompt: string, maxTokens: number = 8000): Promise<string> {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlocks = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as any).text);
  return textBlocks.join('\n\n');
}

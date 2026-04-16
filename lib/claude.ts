import Anthropic from '@anthropic-ai/sdk';

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return new Anthropic({ apiKey });
}

export async function callClaude(prompt: string, maxTokens: number = 4000): Promise<string> {
  const client = getAnthropicClient();

  let truncatedPrompt = prompt;
  if (prompt.length > 80000) {
    truncatedPrompt = prompt.slice(0, 80000) + '\n\n[Content truncated for processing speed]';
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: truncatedPrompt }],
  });

  const textBlocks = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as any).text);
  return textBlocks.join('\n\n');
}

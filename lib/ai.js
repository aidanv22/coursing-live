import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Asks Claude for JSON-only output describing an email + SMS pair for a
// given company update (new product, or a monthly promotion).
export async function generateCampaignCopy({ company, type, item }) {
  const isWeekly = type === 'weekly';

  const systemPrompt = `You write marketing copy for hardscaping companies (patios, retaining walls, walkways, outdoor kitchens, fire pits, pavers, etc). You write ONLY valid JSON, with no preamble, no markdown fences, and no commentary — just the JSON object described below.`;

  const context = `
Company name: ${company.name}
Service area: ${company.service_area || 'not specified'}
Brand voice / tone notes: ${company.brand_voice || 'friendly, professional, no hard sell'}

${isWeekly ? 'New product/service to feature this week:' : 'This month\'s promotion:'}
Name/title: ${item.name || item.title}
Description: ${item.description || 'none provided'}
${isWeekly ? (item.price ? `Price: ${item.price}` : '') : `Discount: ${item.discount || 'not specified'}\nValid: ${item.starts_at || '?'} to ${item.ends_at || '?'}`}
`.trim();

  const instruction = isWeekly
    ? `Write a short, warm weekly update email announcing this new product/service to the company's existing customers, plus a much shorter SMS version.`
    : `Write a short, compelling monthly promotional email about this sale/discount, plus a much shorter SMS version with a clear call to action.`;

  const responseFormat = `Return a JSON object with exactly these keys:
{
  "subject": "email subject line, under 60 characters",
  "email_body": "the full email body as plain text with line breaks, 100-180 words, signed off with the company name",
  "sms_body": "an SMS message under 280 characters (leaving room for a mandatory opt-out line that gets appended separately), no emoji spam, one clear call to action, starting with the company name so recipients know who it's from"
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      { role: 'user', content: `${context}\n\n${instruction}\n\n${responseFormat}` },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock) throw new Error('No text content returned from Claude.');

  const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

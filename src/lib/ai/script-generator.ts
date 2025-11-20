import { openai } from '@/lib/openai';

export interface Scene {
  id: number;
  text: string;
  visual_prompt: string;
  duration_estimate: number;
}

export interface Script {
  title: string;
  scenes: Scene[];
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  it: 'Italian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
  hi: 'Hindi',
  ru: 'Russian',
};

export async function generateScript(topic: string, style: string, language: string = 'en'): Promise<Script> {
  const languageName = LANGUAGE_NAMES[language] || 'English';
  const prompt = `
  Create a viral short video script about "${topic}".
  Style: ${style}.
  Language: ${languageName} (write the voiceover text in ${languageName}).
  Target duration: 60-90 seconds.
  Structure:
  - Hook (0-5s)
  - Build up (storytelling)
  - Climax/Twist
  - Conclusion/CTA

  IMPORTANT: The "text" field must be written in ${languageName}.
  The "visual_prompt" should always be in English (for image generation).

  Output JSON format:
  {
    "title": "Video Title",
    "scenes": [
      {
        "id": 1,
        "text": "Voiceover text in ${languageName}...",
        "visual_prompt": "Detailed English image generation prompt, style: ${style}",
        "duration_estimate": 5
      }
    ]
  }
`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No content generated');

  return JSON.parse(content) as Script;
}

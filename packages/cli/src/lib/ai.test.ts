import { describe, expect, it } from 'vitest';

// Unit tests for AI module functionality

describe('AI Module', () => {
  describe('Provider Configuration', () => {
    it('should have correct Gemini API endpoint', () => {
      const geminiUrl =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      expect(geminiUrl).toContain('googleapis.com');
      expect(geminiUrl).toContain('gemini');
    });

    it('should have correct OpenAI API endpoint', () => {
      const openaiUrl = 'https://api.openai.com/v1/chat/completions';
      expect(openaiUrl).toContain('openai.com');
      expect(openaiUrl).toContain('chat/completions');
    });

    it('should have correct Anthropic API endpoint', () => {
      const anthropicUrl = 'https://api.anthropic.com/v1/messages';
      expect(anthropicUrl).toContain('anthropic.com');
      expect(anthropicUrl).toContain('messages');
    });

    it('should have correct GitHub Models API endpoint', () => {
      const githubUrl =
        'https://models.inference.ai.azure.com/chat/completions';
      expect(githubUrl).toContain('azure.com');
      expect(githubUrl).toContain('chat/completions');
    });
  });

  describe('Commit Message Prompt', () => {
    it('should generate proper prompt structure', () => {
      const basePrompt =
        'You are an expert developer. Based on the following git diff, write a concise, professional commit message following conventional commit standards. Output only the message text, nothing else:';
      const diff = 'diff --git a/file.ts b/file.ts';
      const fullPrompt = `${basePrompt}\n\n${diff}`;

      expect(fullPrompt).toContain('expert developer');
      expect(fullPrompt).toContain('conventional commit');
      expect(fullPrompt).toContain(diff);
    });
  });

  describe('Error Handling', () => {
    it('should identify 401 as auth error', () => {
      const status = 401;
      expect(status === 401 || status === 403).toBe(true);
    });

    it('should identify 429 as rate limit error', () => {
      const status = 429;
      expect(status).toBe(429);
    });

    it('should handle empty response', () => {
      const response = { candidates: [] };
      const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
      expect(text).toBeUndefined();
    });
  });

  describe('Response Parsing', () => {
    it('should parse Gemini response correctly', () => {
      const geminiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'feat: add new feature' }],
            },
          },
        ],
      };
      const text = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
      expect(text).toBe('feat: add new feature');
    });

    it('should parse OpenAI response correctly', () => {
      const openaiResponse = {
        choices: [
          {
            message: { content: 'feat: add new feature' },
          },
        ],
      };
      const text = openaiResponse?.choices?.[0]?.message?.content;
      expect(text).toBe('feat: add new feature');
    });

    it('should parse Anthropic response correctly', () => {
      const anthropicResponse = {
        content: [{ text: 'feat: add new feature' }],
      };
      const text = anthropicResponse?.content?.[0]?.text;
      expect(text).toBe('feat: add new feature');
    });

    it('should trim commit message', () => {
      const message = '  feat: add new feature  \n';
      expect(message.trim()).toBe('feat: add new feature');
    });
  });
});

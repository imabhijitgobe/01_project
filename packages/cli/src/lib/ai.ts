import axios from 'axios';
import chalk from 'chalk';
import type { AiProvider } from './config.js';

const COMMIT_PROMPT = `You are an expert developer. Based on the following git diff, write a concise, professional commit message following conventional commit standards. Output only the message text, nothing else:`;

/**
 * Generate a commit message using the configured AI provider
 */
export async function generateCommitMessage(
  diff: string,
  provider: AiProvider,
  apiKey: string,
): Promise<string> {
  console.log(chalk.yellow('Generating commit message with AI...'));

  switch (provider) {
    case 'gemini':
      return generateWithGemini(diff, apiKey);
    case 'openai':
      return generateWithOpenAI(diff, apiKey);
    case 'anthropic':
      return generateWithAnthropic(diff, apiKey);
    case 'github':
      return generateWithGitHub(diff, apiKey);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Generate commit message using Google Gemini
 */
async function generateWithGemini(
  diff: string,
  apiKey: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: `${COMMIT_PROMPT}\n\n${diff}` }],
          },
        ],
      },
      { timeout: 60000 },
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return text.trim();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Invalid Gemini API key. Please run setup again.');
      }
      if (error.response?.status === 429) {
        throw new Error(
          'Gemini API rate limit exceeded. Please wait a moment and try again.',
        );
      }
      throw new Error(
        `Gemini API error: ${error.response?.status || error.message}`,
      );
    }
    throw error;
  }
}

/**
 * Generate commit message using OpenAI
 */
async function generateWithOpenAI(
  diff: string,
  apiKey: string,
): Promise<string> {
  const url = 'https://api.openai.com/v1/chat/completions';

  try {
    const response = await axios.post(
      url,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `${COMMIT_PROMPT}\n\n${diff}`,
          },
        ],
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      },
    );

    const text = response.data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Empty response from OpenAI');
    }

    return text.trim();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid OpenAI API key. Please run setup again.');
      }
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generate commit message using Anthropic Claude
 */
async function generateWithAnthropic(
  diff: string,
  apiKey: string,
): Promise<string> {
  const url = 'https://api.anthropic.com/v1/messages';

  try {
    const response = await axios.post(
      url,
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `${COMMIT_PROMPT}\n\n${diff}`,
          },
        ],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      },
    );

    const text = response.data?.content?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Anthropic');
    }

    return text.trim();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Anthropic API key. Please run setup again.');
      }
      throw new Error(`Anthropic API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generate commit message using GitHub (Models API)
 */
async function generateWithGitHub(
  diff: string,
  token: string,
): Promise<string> {
  const url = 'https://models.inference.ai.azure.com/chat/completions';

  try {
    const response = await axios.post(
      url,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `${COMMIT_PROMPT}\n\n${diff}`,
          },
        ],
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      },
    );

    const text = response.data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Empty response from GitHub Models');
    }

    return text.trim();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid GitHub PAT. Please run setup again.');
      }
      throw new Error(`GitHub Models API error: ${error.message}`);
    }
    throw error;
  }
}

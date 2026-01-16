import { password, select } from '@inquirer/prompts';
import chalk from 'chalk';
import type { AiProvider } from './config.js';

/**
 * Prompt user to select an AI provider
 */
export async function selectAiProvider(): Promise<AiProvider> {
  console.log(
    chalk.blue('\nSelect an AI provider for generating commit messages:\n'),
  );

  const provider = await select({
    message: 'Choose your AI provider:',
    choices: [
      {
        name: 'Gemini (Google)',
        value: 'gemini' as AiProvider,
        description: 'Use Google Gemini API',
      },
      {
        name: 'OpenAI (GPT)',
        value: 'openai' as AiProvider,
        description: 'Use OpenAI GPT API',
      },
      {
        name: 'Anthropic (Claude)',
        value: 'anthropic' as AiProvider,
        description: 'Use Anthropic Claude API',
      },
      {
        name: 'GitHub PAT',
        value: 'github' as AiProvider,
        description: 'Use GitHub Personal Access Token',
      },
    ],
  });

  return provider;
}

/**
 * Prompt user to enter their API key
 */
export async function inputApiKey(provider: AiProvider): Promise<string> {
  const providerNames: Record<AiProvider, string> = {
    gemini: 'Gemini',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    github: 'GitHub',
  };

  const providerUrls: Record<AiProvider, string> = {
    gemini: 'https://aistudio.google.com/app/apikey',
    openai: 'https://platform.openai.com/api-keys',
    anthropic: 'https://console.anthropic.com/settings/keys',
    github: 'https://github.com/settings/tokens',
  };

  console.log(
    chalk.yellow(
      `\nGet your ${providerNames[provider]} API key from: ${providerUrls[provider]}\n`,
    ),
  );

  const apiKey = await password({
    message: `Enter your ${providerNames[provider]} API key:`,
    mask: '*',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return 'API key cannot be empty';
      }
      return true;
    },
  });

  return apiKey.trim();
}

/**
 * Confirm action
 */
export async function confirm(message: string): Promise<boolean> {
  const answer = await select({
    message,
    choices: [
      { name: 'Yes', value: true },
      { name: 'No', value: false },
    ],
  });
  return answer;
}

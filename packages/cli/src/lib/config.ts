import fs from 'fs';
import os from 'os';
import path from 'path';

const CONFIG_DIR = path.join(os.homedir(), '.my-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'github';

export interface Config {
  aiProvider?: AiProvider;
  apiKey?: string;
  setupComplete?: boolean;
}

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Get the current configuration
 */
export function getConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // Return empty config if file doesn't exist or is invalid
  }
  return {};
}

/**
 * Save configuration to file
 */
export function saveConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Get the stored API key
 */
export function getApiKey(): string | undefined {
  return getConfig().apiKey;
}

/**
 * Get the stored AI provider
 */
export function getAiProvider(): AiProvider | undefined {
  return getConfig().aiProvider;
}

/**
 * Set the API key and provider
 */
export function setApiKey(provider: AiProvider, apiKey: string): void {
  const config = getConfig();
  config.aiProvider = provider;
  config.apiKey = apiKey;
  config.setupComplete = true;
  saveConfig(config);
}

/**
 * Check if setup is complete
 */
export function isSetupComplete(): boolean {
  const config = getConfig();
  return (
    config.setupComplete === true && !!config.apiKey && !!config.aiProvider
  );
}

/**
 * Get the config file path (for display purposes)
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * Clear all configuration (delete config file)
 */
export function clearConfig(): boolean {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

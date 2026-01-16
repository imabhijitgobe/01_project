import chalk from 'chalk';
import { execa } from 'execa';
import path from 'path';

/**
 * Check if GitHub CLI (gh) is installed
 */
export async function isGhInstalled(): Promise<boolean> {
  try {
    await execa('gh', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if user is authenticated with GitHub CLI
 */
export async function isGhAuthenticated(): Promise<boolean> {
  try {
    await execa('gh', ['auth', 'status']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Trigger GitHub CLI login
 */
export async function loginGh(): Promise<void> {
  console.log(chalk.yellow('Starting GitHub authentication...'));
  await execa('gh', ['auth', 'login'], { stdio: 'inherit' });
}

/**
 * Check if current directory is a git repository
 */
export async function isGitRepo(): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--is-inside-work-tree']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize a git repository
 */
export async function initGitRepo(): Promise<void> {
  console.log(chalk.yellow('Initializing git repository...'));
  await execa('git', ['init']);
  console.log(chalk.green('Git repository initialized.'));
}

/**
 * Check if a remote named 'origin' exists
 */
export async function hasRemote(): Promise<boolean> {
  try {
    const { stdout } = await execa('git', ['remote']);
    return stdout.includes('origin');
  } catch {
    return false;
  }
}

/**
 * Create a GitHub repository using gh CLI
 */
export async function createGitHubRepo(): Promise<void> {
  const folderName = path.basename(process.cwd());
  console.log(chalk.yellow(`Creating GitHub repository: ${folderName}...`));
  await execa('gh', [
    'repo',
    'create',
    folderName,
    '--public',
    '--source=.',
    '--remote=origin',
  ]);
  console.log(chalk.green(`GitHub repository "${folderName}" created.`));
}

/**
 * Stage all changes
 */
export async function stageAll(): Promise<void> {
  await execa('git', ['add', '.']);
  console.log(chalk.green('All changes staged.'));
}

/**
 * Get the staged diff
 */
export async function getStagedDiff(): Promise<string> {
  const { stdout } = await execa('git', ['diff', '--cached']);
  return stdout;
}

/**
 * Commit with a message
 */
export async function commit(message: string): Promise<void> {
  await execa('git', ['commit', '-m', message]);
  console.log(chalk.green('Changes committed.'));
}

/**
 * Get the current branch name
 */
export async function getCurrentBranch(): Promise<string> {
  const { stdout } = await execa('git', ['branch', '--show-current']);
  return stdout.trim() || 'main';
}

/**
 * Push to origin
 */
export async function push(): Promise<void> {
  const branch = await getCurrentBranch();
  console.log(chalk.yellow(`Pushing to origin/${branch}...`));
  await execa('git', ['push', '-u', 'origin', branch]);
  console.log(chalk.green('Pushed successfully.'));
}

/**
 * Check if there are staged changes
 */
export async function hasStagedChanges(): Promise<boolean> {
  const { stdout } = await execa('git', ['diff', '--cached', '--name-only']);
  return stdout.trim().length > 0;
}

/**
 * Check if there are any changes (staged or unstaged)
 */
export async function hasChanges(): Promise<boolean> {
  const { stdout } = await execa('git', ['status', '--porcelain']);
  return stdout.trim().length > 0;
}

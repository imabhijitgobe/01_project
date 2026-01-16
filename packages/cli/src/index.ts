#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { generateCommitMessage } from './lib/ai.js';
import {
  getAiProvider,
  getApiKey,
  getConfigPath,
  isSetupComplete,
  setApiKey,
} from './lib/config.js';
import {
  commit,
  createGitHubRepo,
  getStagedDiff,
  hasChanges,
  hasRemote,
  initGitRepo,
  isGhAuthenticated,
  isGhInstalled,
  isGitRepo,
  loginGh,
  push,
  stageAll,
} from './lib/git.js';
import { inputApiKey, selectAiProvider } from './lib/prompt.js';

const program = new Command();

program
  .version('0.1.0')
  .description('Git automation CLI with AI-powered commit messages');

// Setup command
program
  .command('setup')
  .description(
    'First-time setup: GitHub CLI check, login, and API key configuration',
  )
  .action(async () => {
    try {
      console.log(chalk.blue.bold('\n🚀 Welcome to my-cli setup!\n'));

      // Step 1: Check GitHub CLI
      console.log(chalk.blue('Step 1: Checking GitHub CLI installation...'));
      if (!(await isGhInstalled())) {
        console.log(chalk.red('\n❌ GitHub CLI (gh) is not installed.'));
        console.log(chalk.yellow('\nPlease install it from:'));
        console.log(chalk.cyan('  https://cli.github.com/\n'));
        console.log(chalk.yellow('Installation commands:'));
        console.log(
          chalk.gray('  Windows (winget): winget install GitHub.cli'),
        );
        console.log(chalk.gray('  macOS (brew):     brew install gh'));
        console.log(chalk.gray('  Linux (apt):      sudo apt install gh\n'));
        process.exit(1);
      }
      console.log(chalk.green('✓ GitHub CLI is installed.\n'));

      // Step 2: Check GitHub authentication
      console.log(chalk.blue('Step 2: Checking GitHub authentication...'));
      if (!(await isGhAuthenticated())) {
        console.log(
          chalk.yellow('Not authenticated with GitHub. Starting login...\n'),
        );
        await loginGh();
      }
      console.log(chalk.green('✓ Authenticated with GitHub.\n'));

      // Step 3: Select AI provider
      console.log(
        chalk.blue('Step 3: Configure AI provider for commit messages...'),
      );
      const provider = await selectAiProvider();
      console.log(chalk.green(`\n✓ Selected: ${provider}\n`));

      // Step 4: Enter API key
      console.log(chalk.blue('Step 4: Enter your API key...'));
      const apiKey = await inputApiKey(provider);

      // Save configuration
      setApiKey(provider, apiKey);

      console.log(chalk.green.bold('\n✅ Setup complete!\n'));
      console.log(chalk.gray(`Configuration saved to: ${getConfigPath()}\n`));
      console.log(chalk.cyan('You can now use:'));
      console.log(
        chalk.white(
          '  my-cli push    - Stage, commit with AI, and push to GitHub\n',
        ),
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });

// Config command - change AI provider/key
program
  .command('config')
  .description('Change AI provider or API key')
  .action(async () => {
    try {
      const currentProvider = getAiProvider();
      if (currentProvider) {
        console.log(
          chalk.blue(`\nCurrent AI provider: ${chalk.cyan(currentProvider)}\n`),
        );
      }

      // Select new provider
      const provider = await selectAiProvider();
      console.log(chalk.green(`\n✓ Selected: ${provider}\n`));

      // Enter new API key
      const apiKey = await inputApiKey(provider);

      // Save configuration
      setApiKey(provider, apiKey);

      console.log(chalk.green.bold('\n✅ Configuration updated!\n'));
      console.log(chalk.gray(`Saved to: ${getConfigPath()}\n`));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });

// Push command
program
  .command('push')
  .description(
    'Stage all changes, generate AI commit message, and push to GitHub',
  )
  .option(
    '-m, --message <message>',
    'Use a custom commit message instead of AI',
  )
  .action(async (options) => {
    try {
      // Check if setup is complete
      if (!isSetupComplete() && !options.message) {
        console.log(chalk.yellow('\n⚠️  Setup not complete.'));
        console.log(chalk.cyan('Please run: my-cli setup\n'));
        process.exit(1);
      }

      console.log(chalk.blue.bold('\n🚀 Starting push...\n'));

      // Step 1: Check git repository
      console.log(chalk.blue('Checking git repository...'));
      if (!(await isGitRepo())) {
        console.log(chalk.yellow('Not a git repository. Initializing...'));
        await initGitRepo();
      }
      console.log(chalk.green('✓ Git repository exists.\n'));

      // Step 2: Check remote
      console.log(chalk.blue('Checking GitHub remote...'));
      if (!(await hasRemote())) {
        console.log(
          chalk.yellow('No remote found. Creating GitHub repository...'),
        );
        await createGitHubRepo();
      }
      console.log(chalk.green('✓ GitHub remote exists.\n'));

      // Step 3: Check for changes
      console.log(chalk.blue('Checking for changes...'));
      if (!(await hasChanges())) {
        console.log(chalk.yellow('\nNo changes to commit.\n'));
        process.exit(0);
      }
      console.log(chalk.green('✓ Changes detected.\n'));

      // Step 4: Stage all changes
      console.log(chalk.blue('Staging changes...'));
      await stageAll();

      // Step 5: Get commit message
      let commitMessage: string;

      if (options.message) {
        commitMessage = options.message;
        console.log(chalk.green('Using provided commit message.\n'));
      } else {
        const provider = getAiProvider();
        const apiKey = getApiKey();

        if (!provider || !apiKey) {
          console.error(
            chalk.red('Configuration missing. Please run: my-cli setup'),
          );
          process.exit(1);
        }

        // Get diff and generate message
        const diff = await getStagedDiff();
        if (!diff) {
          console.log(chalk.yellow('\nNo staged changes to commit.\n'));
          process.exit(0);
        }

        commitMessage = await generateCommitMessage(diff, provider, apiKey);
        console.log(
          chalk.cyan(`\n📝 Commit message:\n${chalk.white(commitMessage)}\n`),
        );
      }

      // Step 6: Commit
      console.log(chalk.blue('Committing...'));
      await commit(commitMessage);

      // Step 7: Push
      console.log(chalk.blue('Pushing...'));
      await push();

      console.log(chalk.green.bold('\n✅ Push complete!\n'));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });

// Hello command (keep for testing)
program
  .command('hello')
  .description('Say hello')
  .action(() => {
    console.log(chalk.green('Hello from my-cli!'));
  });

program.parse(process.argv);

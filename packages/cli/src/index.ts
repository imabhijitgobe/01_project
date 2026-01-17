#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { generateCommitMessage } from './lib/ai.js';
import {
  clearConfig,
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
  installGhCli,
  isGhAuthenticated,
  isGhInstalled,
  isGitRepo,
  loginGh,
  logoutGh,
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
        console.log(
          chalk.cyan('You can install it using: winget install GitHub.cli\n'),
        );

        const { confirm } = await import('./lib/prompt.js');
        const shouldInstall = await confirm(
          'Would you like to install GitHub CLI now?',
        );

        if (shouldInstall) {
          await installGhCli();
          process.exit(0); // Need to restart terminal after install
        } else {
          console.log(
            chalk.gray('\nPlease install GitHub CLI and run setup again.\n'),
          );
          process.exit(1);
        }
      }
      console.log(chalk.green('✓ GitHub CLI is installed.\n'));

      // Step 2: Check GitHub authentication
      console.log(chalk.blue('Step 2: Checking GitHub authentication...'));
      if (await isGhAuthenticated()) {
        console.log(chalk.green('✓ Already authenticated with GitHub.\n'));
      } else {
        console.log(
          chalk.yellow('Not authenticated with GitHub. Starting login...\n'),
        );
        await loginGh();
        console.log(chalk.green('✓ Authenticated with GitHub.\n'));
      }

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

      // Step 1: Check GitHub CLI
      console.log(chalk.blue('Checking GitHub CLI...'));
      if (!(await isGhInstalled())) {
        console.log(chalk.red('\n❌ GitHub CLI (gh) is not installed.'));
        console.log(
          chalk.cyan('You can install it using: winget install GitHub.cli\n'),
        );

        const { confirm } = await import('./lib/prompt.js');
        const shouldInstall = await confirm(
          'Would you like to install GitHub CLI now?',
        );

        if (shouldInstall) {
          await installGhCli();
          process.exit(0); // Need to restart terminal after install
        } else {
          console.log(
            chalk.gray('\nPlease install GitHub CLI and try again.\n'),
          );
          process.exit(1);
        }
      }
      console.log(chalk.green('✓ GitHub CLI installed.\n'));

      // Step 2: Check GitHub authentication
      console.log(chalk.blue('Checking GitHub authentication...'));
      let needsApiReconfigure = false;
      if (!(await isGhAuthenticated())) {
        console.log(chalk.yellow('Not authenticated with GitHub.'));
        await loginGh();
        needsApiReconfigure = true; // Force API reconfiguration after fresh GitHub auth
      }
      console.log(chalk.green('✓ Authenticated with GitHub.\n'));

      // Step 3: Check AI provider configuration (only if not using -m flag)
      if (!options.message) {
        console.log(chalk.blue('Checking AI configuration...'));
        if (!isSetupComplete() || needsApiReconfigure) {
          if (needsApiReconfigure && isSetupComplete()) {
            console.log(
              chalk.yellow(
                "Fresh GitHub login detected. Let's verify your AI configuration.",
              ),
            );
          } else {
            console.log(chalk.yellow('AI provider not configured.'));
          }
          console.log(chalk.cyan('Select your AI provider:\n'));

          const provider = await selectAiProvider();
          const apiKey = await inputApiKey(provider);
          setApiKey(provider, apiKey);
          console.log(chalk.green('\n✓ AI configuration saved.\n'));
        } else {
          console.log(chalk.green('✓ AI provider configured.\n'));
        }
      }

      // Step 4: Check git repository
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
        let provider = getAiProvider();
        let apiKey = getApiKey();

        if (!provider || !apiKey) {
          console.log(chalk.yellow('\n⚠️  AI provider not configured.'));
          console.log(chalk.cyan("Let's set it up now:\n"));

          provider = await selectAiProvider();
          apiKey = await inputApiKey(provider);
          setApiKey(provider, apiKey);
          console.log(chalk.green('\n✓ Configuration saved.\n'));
        }

        // Get diff and generate message
        const diff = await getStagedDiff();
        if (!diff) {
          console.log(chalk.yellow('\nNo staged changes to commit.\n'));
          process.exit(0);
        }

        try {
          commitMessage = await generateCommitMessage(diff, provider, apiKey);
          console.log(
            chalk.cyan(`\n📝 Commit message:\n${chalk.white(commitMessage)}\n`),
          );
        } catch (aiError) {
          console.log(
            chalk.red(
              `\n❌ AI Error: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`,
            ),
          );
          console.log(
            chalk.yellow('\nWould you like to reconfigure your AI provider?\n'),
          );

          const { confirm } = await import('./lib/prompt.js');
          const shouldReconfigure = await confirm('Reconfigure AI provider?');

          if (shouldReconfigure) {
            provider = await selectAiProvider();
            apiKey = await inputApiKey(provider);
            setApiKey(provider, apiKey);
            console.log(chalk.green('\n✓ Configuration saved. Retrying...\n'));

            commitMessage = await generateCommitMessage(diff, provider, apiKey);
            console.log(
              chalk.cyan(
                `\n📝 Commit message:\n${chalk.white(commitMessage)}\n`,
              ),
            );
          } else {
            console.log(chalk.gray('\nPlease run: git-ai config\n'));
            process.exit(1);
          }
        }
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

// Repos command - list and manage GitHub repositories
program
  .command('repos')
  .description('List your GitHub repositories')
  .option('-n, --limit <number>', 'Number of repos to show', '10')
  .option('-d, --delete <name>', 'Delete a repository by name')
  .action(async (options) => {
    try {
      const { execa } = await import('execa');

      // Check GitHub CLI
      if (!(await isGhInstalled())) {
        console.log(chalk.red('❌ GitHub CLI (gh) is not installed.'));
        process.exit(1);
      }

      // Check authentication
      if (!(await isGhAuthenticated())) {
        console.log(chalk.yellow('Not authenticated with GitHub.'));
        await loginGh();
      }

      // If delete option provided
      if (options.delete) {
        let repoName = options.delete;

        // Auto-prepend username if not included
        if (!repoName.includes('/')) {
          const { stdout: username } = await execa('gh', [
            'api',
            'user',
            '--jq',
            '.login',
          ]);
          repoName = `${username.trim()}/${repoName}`;
        }

        console.log(chalk.blue.bold('\n🗑️  Delete Repository\n'));
        console.log(chalk.yellow(`Repository: ${chalk.cyan(repoName)}\n`));

        const { confirm } = await import('./lib/prompt.js');
        const confirmed = await confirm(
          chalk.red(
            `⚠️  Are you sure you want to DELETE ${repoName}? This cannot be undone!`,
          ),
        );

        if (!confirmed) {
          console.log(chalk.gray('\nDeletion cancelled.\n'));
          process.exit(0);
        }

        console.log(chalk.yellow('\nDeleting repository...'));

        try {
          await execa('gh', ['repo', 'delete', repoName, '--yes']);
        } catch (deleteError) {
          if (
            deleteError instanceof Error &&
            deleteError.message.includes('delete_repo')
          ) {
            console.log(
              chalk.yellow('\n⚠️  Requesting delete_repo permission...'),
            );
            await execa(
              'gh',
              ['auth', 'refresh', '-h', 'github.com', '-s', 'delete_repo'],
              {
                stdio: 'inherit',
              },
            );
            console.log(chalk.yellow('\nRetrying deletion...'));
            await execa('gh', ['repo', 'delete', repoName, '--yes']);
          } else {
            throw deleteError;
          }
        }

        console.log(
          chalk.green.bold('\n✅ Repository deleted successfully!\n'),
        );
        return;
      }

      // List repositories
      const limit = parseInt(options.limit) || 10;
      console.log(
        chalk.blue.bold(`\n📂 Your GitHub Repositories (showing ${limit}):\n`),
      );

      const { stdout } = await execa('gh', [
        'repo',
        'list',
        '--limit',
        limit.toString(),
        '--json',
        'name,visibility,updatedAt,url',
      ]);

      const repos = JSON.parse(stdout);

      if (repos.length === 0) {
        console.log(chalk.yellow('No repositories found.\n'));
        return;
      }

      repos.forEach(
        (
          repo: {
            name: string;
            visibility: string;
            updatedAt: string;
            url: string;
          },
          index: number,
        ) => {
          const visibility =
            repo.visibility === 'PUBLIC'
              ? chalk.green('public')
              : chalk.yellow('private');
          const date = new Date(repo.updatedAt).toLocaleDateString();
          console.log(
            `${chalk.gray(`${index + 1}.`)} ${chalk.cyan(repo.name)} ${chalk.gray(`[${visibility}]`)} ${chalk.gray(`- Updated: ${date}`)}`,
          );
        },
      );

      console.log(
        chalk.gray(
          `\nTo delete a repo: pnpm run cli repos --delete <owner/repo-name>\n`,
        ),
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });

// Delete command - delete GitHub repository
program
  .command('delete')
  .description('Delete the GitHub repository for this project')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n🗑️  Delete Repository\n'));

      // Check GitHub CLI
      if (!(await isGhInstalled())) {
        console.log(chalk.red('❌ GitHub CLI (gh) is not installed.'));
        process.exit(1);
      }

      // Check authentication
      if (!(await isGhAuthenticated())) {
        console.log(chalk.yellow('Not authenticated with GitHub.'));
        await loginGh();
      }

      // Check if remote exists
      if (!(await hasRemote())) {
        console.log(
          chalk.yellow('No GitHub remote found for this repository.\n'),
        );
        process.exit(1);
      }

      // Get repo name from remote
      const { execa } = await import('execa');
      const { stdout: remoteUrl } = await execa('git', [
        'remote',
        'get-url',
        'origin',
      ]);
      const repoMatch = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);

      if (!repoMatch) {
        console.log(
          chalk.red('Could not determine repository name from remote URL.\n'),
        );
        process.exit(1);
      }

      const repoName = repoMatch[1].replace('.git', '');
      console.log(chalk.yellow(`Repository: ${chalk.cyan(repoName)}\n`));

      if (!options.yes) {
        const { confirm } = await import('./lib/prompt.js');
        const confirmed = await confirm(
          chalk.red(
            `⚠️  Are you sure you want to DELETE ${repoName}? This cannot be undone!`,
          ),
        );

        if (!confirmed) {
          console.log(chalk.gray('\nDeletion cancelled.\n'));
          process.exit(0);
        }
      }

      console.log(chalk.yellow('\nDeleting repository...'));

      try {
        await execa('gh', ['repo', 'delete', repoName, '--yes']);
      } catch (deleteError) {
        // Check if it's a permission error
        if (
          deleteError instanceof Error &&
          deleteError.message.includes('delete_repo')
        ) {
          console.log(
            chalk.yellow(
              '\n⚠️  GitHub CLI needs additional permissions to delete repositories.',
            ),
          );
          console.log(chalk.cyan('Requesting delete_repo scope...\n'));

          // Request delete_repo scope
          await execa(
            'gh',
            ['auth', 'refresh', '-h', 'github.com', '-s', 'delete_repo'],
            {
              stdio: 'inherit',
            },
          );

          // Retry deletion
          console.log(chalk.yellow('\nRetrying deletion...'));
          await execa('gh', ['repo', 'delete', repoName, '--yes']);
        } else {
          throw deleteError;
        }
      }

      // Remove the remote
      await execa('git', ['remote', 'remove', 'origin']);

      console.log(chalk.green.bold('\n✅ Repository deleted successfully!\n'));
      console.log(
        chalk.gray(
          'The local git repository still exists. Remote "origin" has been removed.\n',
        ),
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
      process.exit(1);
    }
  });

// Logout command - clear config and optionally logout from GitHub
program
  .command('logout')
  .description('Clear stored API key and optionally logout from GitHub')
  .option('-a, --all', 'Also logout from GitHub CLI')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n👋 Logout\n'));

      // Clear local config (API key)
      const configCleared = clearConfig();
      if (configCleared) {
        console.log(chalk.green('✓ API key and configuration cleared.'));
      } else {
        console.log(chalk.yellow('No configuration found to clear.'));
      }

      // Optionally logout from GitHub CLI
      if (options.all) {
        const { confirm } = await import('./lib/prompt.js');
        const shouldLogoutGh = await confirm(
          'Do you also want to logout from GitHub CLI?',
        );

        if (shouldLogoutGh) {
          try {
            await logoutGh();
            console.log(chalk.green('✓ Logged out from GitHub CLI.'));
          } catch {
            console.log(
              chalk.yellow(
                'Could not logout from GitHub CLI (may not be logged in).',
              ),
            );
          }
        }
      }

      console.log(chalk.green.bold('\n✅ Logout complete!\n'));
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

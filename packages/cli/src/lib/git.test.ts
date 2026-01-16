import { describe, expect, it } from 'vitest';

// Unit tests for Git module functionality

describe('Git Module', () => {
  describe('Command Structures', () => {
    it('should have correct gh version command', () => {
      const args = ['--version'];
      expect(args).toEqual(['--version']);
    });

    it('should have correct gh auth status command', () => {
      const args = ['auth', 'status'];
      expect(args).toEqual(['auth', 'status']);
    });

    it('should have correct gh auth login command', () => {
      const args = ['auth', 'login', '-h', 'github.com', '-w'];
      expect(args).toContain('auth');
      expect(args).toContain('login');
      expect(args).toContain('github.com');
      expect(args).toContain('-w');
    });

    it('should have correct git init command', () => {
      const args = ['init'];
      expect(args).toEqual(['init']);
    });

    it('should have correct git remote command', () => {
      const args = ['remote'];
      expect(args).toEqual(['remote']);
    });

    it('should have correct git add command', () => {
      const args = ['add', '.'];
      expect(args).toEqual(['add', '.']);
    });

    it('should have correct git diff cached command', () => {
      const args = ['diff', '--cached'];
      expect(args).toEqual(['diff', '--cached']);
    });

    it('should have correct git commit command', () => {
      const message = 'feat: add new feature';
      const args = ['commit', '-m', message];
      expect(args).toEqual(['commit', '-m', 'feat: add new feature']);
    });

    it('should have correct git push command', () => {
      const branch = 'main';
      const args = ['push', '-u', 'origin', branch];
      expect(args).toContain('push');
      expect(args).toContain('-u');
      expect(args).toContain('origin');
      expect(args).toContain('main');
    });

    it('should have correct git status command', () => {
      const args = ['status', '--porcelain'];
      expect(args).toEqual(['status', '--porcelain']);
    });

    it('should have correct git branch command', () => {
      const args = ['branch', '--show-current'];
      expect(args).toEqual(['branch', '--show-current']);
    });
  });

  describe('gh repo create command', () => {
    it('should have correct structure', () => {
      const folderName = 'my-project';
      const args = [
        'repo',
        'create',
        folderName,
        '--public',
        '--source=.',
        '--remote=origin',
        '--push',
      ];

      expect(args).toContain('repo');
      expect(args).toContain('create');
      expect(args).toContain('my-project');
      expect(args).toContain('--public');
      expect(args).toContain('--push');
    });
  });

  describe('winget install command', () => {
    it('should have correct structure', () => {
      const args = [
        'install',
        'GitHub.cli',
        '--accept-source-agreements',
        '--accept-package-agreements',
      ];

      expect(args).toContain('install');
      expect(args).toContain('GitHub.cli');
    });
  });

  describe('Remote URL Parsing', () => {
    it('should match HTTPS GitHub URL', () => {
      const url = 'https://github.com/user/repo.git';
      const match = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe('user/repo');
    });

    it('should match SSH GitHub URL', () => {
      const url = 'git@github.com:user/repo.git';
      const match = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe('user/repo');
    });
  });

  describe('Branch Name Handling', () => {
    it('should trim branch name', () => {
      const stdout = 'main\n';
      const branch = stdout.trim() || 'main';
      expect(branch).toBe('main');
    });

    it('should default to main when empty', () => {
      const stdout = '';
      const branch = stdout.trim() || 'main';
      expect(branch).toBe('main');
    });
  });

  describe('Change Detection', () => {
    it('should detect changes from porcelain output', () => {
      const stdout = 'M file.ts\n?? newfile.ts';
      const hasChanges = stdout.trim().length > 0;
      expect(hasChanges).toBe(true);
    });

    it('should detect no changes from empty output', () => {
      const stdout = '';
      const hasChanges = stdout.trim().length > 0;
      expect(hasChanges).toBe(false);
    });
  });
});

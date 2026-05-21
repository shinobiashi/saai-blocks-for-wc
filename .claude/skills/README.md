# WordPress / WooCommerce Claude Code Skills

A collection of Claude Code skills for WordPress and WooCommerce plugin development, focused on the full lifecycle from development to WordPress.org publication.

## Skills

| Skill | Version | Purpose |
|-------|---------|---------|
| [`wp-i18n`](wp-i18n/SKILL.md) | 1.0.0 | Internationalization: text domain, POT/JSON generation, translate.wordpress.org |
| [`wp-org-release`](wp-org-release/SKILL.md) | 1.0.0 | WordPress.org publication: SVN workflow, readme.txt, banners/icons |
| [`wp-phpcs`](wp-phpcs/SKILL.md) | 1.0.0 | PHP_CodeSniffer setup, WordPress Coding Standards, PHPCBF auto-fix |
| [`wp-phpunit`](wp-phpunit/SKILL.md) | 1.0.0 | PHPUnit setup, WP_UnitTestCase, WC_Unit_Test_Case, HTTP mocking |
| [`wp-github-actions`](wp-github-actions/SKILL.md) | 1.0.0 | CI/CD workflows: lint, test, ZIP release, WordPress.org deploy |
| [`wp-e2e-playwright`](wp-e2e-playwright/SKILL.md) | 1.0.0 | Playwright E2E: WooCommerce checkout/payment flows, block editor testing |

## Installation

Copy the skills to your Claude Code global skills directory:

```bash
bash .claude/skills/install.sh
```

Or install a specific skill:

```bash
cp -r .claude/skills/wp-i18n ~/.claude/skills/
```

## Requirements

- [Claude Code](https://claude.ai/code) with skills support
- Global skills directory: `~/.claude/skills/`

## Compatibility

- WordPress 6.6+
- WooCommerce 9.0+
- PHP 7.4+
- Node.js 20+ / @wordpress/scripts 32+

## Development workflow using these skills

```
Plugin development
  ↓ wp-phpcs          Enforce WordPress Coding Standards
  ↓ wp-phpstan        Static analysis (works with wp-phpstan skill)
  ↓ wp-phpunit        Unit & integration tests
  ↓ wp-e2e-playwright Checkout / payment / block E2E tests
  ↓ wp-i18n           Generate POT file, block JSON translations
  ↓ wp-github-actions Set up CI + automated release on tag
  ↓ wp-org-release    Publish to WordPress.org via SVN
```

## Contributing

1. Edit the relevant `SKILL.md` or reference file.
2. Bump the `version` field in `SKILL.md` (semver).
3. Add an entry to `CHANGELOG.md`.
4. Submit a pull request.

## License

[GPL-3.0-or-later](https://www.gnu.org/licenses/gpl-3.0.html)

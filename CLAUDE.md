# Saai Blocks for WooCommerce — Claude Code Instructions

## Project Overview

A WooCommerce-focused Gutenberg block plugin supporting both frontend and admin screens.
Intended for release on WordPress.org.

- **Plugin slug**: `saai-blocks-for-wc`
- **Text domain**: `saai-blocks-for-wc`
- **PHP namespace**: `SaaiBlocksForWc`
- **Requires**: WordPress 6.6+, WooCommerce 9.0+, PHP 7.4+

## Tech Stack

| Layer | Technology |
| --- | --- |
| PHP | WordPress Coding Standards, PHPStan lv8 |
| JS/CSS | `@wordpress/scripts` (webpack), React |
| Blocks | `block.json` + `register_block_type` |
| Admin UI | Shared SAAI menu + `@woocommerce/components` |
| Tests | PHPUnit (WP_UnitTestCase / WC_Unit_Test_Case) |
| CI | GitHub Actions (PHPCS, PHPStan, PHPUnit, JS lint) |

## Directory Structure

```text
saai-blocks-for-wc/
├── saai-blocks-for-wc.php        # Plugin entry point
├── includes/                     # PHP classes (PSR-4 autoload)
│   ├── Admin/                    # Admin pages and menu registration
│   ├── Blocks/                   # Block registration
│   └── ProductVideo/             # Product video feature (Feature 1)
│       ├── Meta.php              # Post meta registration and helpers
│       ├── AdminPanel.php        # Product edit screen panel
│       ├── ClassicTheme.php      # Classic theme front-end integration
│       └── REST.php              # REST API endpoints
├── src/                          # JS/CSS source (edit here)
│   ├── saai/admin/               # Admin React pages (same layout as saai-blocks)
│   │   ├── overview/             # Shared SAAI overview page
│   │   └── video-settings/       # WC video global settings page
│   └── blocks/                   # Block source files
│       └── product-video/        # Product video block
├── assets/
│   └── images/                   # Plugin images (saai_icon.svg, etc.)
├── build/                        # Webpack output (committed)
│   └── saai/admin/
│       ├── overview.js / overview.css
│       └── video-settings.js / video-settings.css
├── docs/                         # Design docs and roadmap
└── tests/                        # PHPUnit tests
```

## Development Commands

```bash
# JS build (watch)
npm start

# JS build (production)
npm run build

# PHP code sniffer
vendor/bin/phpcs

# PHP auto-fixer
vendor/bin/phpcbf

# PHPStan static analysis
vendor/bin/phpstan analyse --memory-limit=512M

# Tests
vendor/bin/phpunit

# wp-env start / stop
npx wp-env start
npx wp-env stop
```

## Architecture

### Admin Menu

JS source lives under `src/saai/admin/` — the same layout as the `saai-blocks` plugin.

**Menu structure** (shared with saai-blocks):

| Slug | Type | Notes |
| --- | --- | --- |
| `saai-overview` | Top-level menu | Registered by this plugin only when saai-blocks is not active |
| `saai-blocks-for-wc-settings` | Submenu | Always registered by this plugin |

**Conflict avoidance when both plugins are active**:

- `register_pages()` checks `global $admin_page_hooks` before calling `add_menu_page()` — skips if `saai-overview` is already registered.
- Overview scripts are enqueued only when `class_exists('SAAI_Blocks')` is `false`.
- No `saai_framework` class is used; all logic is self-contained in `includes/Admin/Setup.php`.

### Data Layer

- Product meta is registered via `register_post_meta` and exposed through the REST API.
- Private meta keys use the `_saai_` prefix (hidden from custom fields UI).
- Plugin-wide options use the `saai_blocks_for_wc_` prefix with `update_option`.

### Blocks

- All subdirectories under `build/blocks/` are auto-registered via `register_block_type`.
- Blocks use `block.json` + a PHP render callback (dynamic blocks by default).
- WooCommerce block integration uses Slot/Fill or `woocommerce/product-details` block extensions.

### Front-End Integration

- **Classic themes**: inject videos via the `woocommerce_product_thumbnails` hook.
- **Block themes**: extend `woocommerce/product-image-gallery` with Inner Blocks or filters.

## Coding Standards

- Follow WordPress Coding Standards (enforced by PHPCS).
- Security: sanitize on input (`sanitize_*`), escape on output (`esc_*`), always verify nonces.
- Add comments only when the WHY is non-obvious — never describe what the code does.
- New PHP classes go under `includes/` and must use the `SaaiBlocksForWc\` namespace.

## Available Skills

| Task | Skill |
| --- | --- |
| Block development | `wp-block-development`, `wc-block-development` |
| WooCommerce blocks | `wc-block-development` |
| PHPUnit tests | `wp-phpunit` |
| PHPCS setup / fixes | `wp-phpcs` |
| PHPStan setup | `wp-phpstan` |
| GitHub Actions CI | `wp-github-actions` |
| WordPress.org release | `wp-org-release` |
| WP-CLI operations | `wp-wpcli-and-ops` |
| REST API extensions | `wp-rest-api` |
| Internationalization | `wp-i18n` |
| E2E tests | `wp-e2e-playwright` |
| Security audit | `wp-security-check` |

## References

- [WooCommerce Blocks Handbook](https://developer.woocommerce.com/docs/category/woocommerce-blocks/)
- [Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [WC Admin Components](https://woocommerce.github.io/woocommerce-admin/)

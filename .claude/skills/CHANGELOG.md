# Changelog

All notable changes to these Claude Code skills are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Skills use [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

- **MAJOR**: breaking change to the skill's interface or procedure
- **MINOR**: new references, new procedure steps, expanded coverage
- **PATCH**: typo fixes, clarifications, example corrections

---

## [Unreleased]

---

## wp-i18n — 1.0.0 — 2026-05-22

### Added
- Initial release
- `SKILL.md`: 8-step procedure from text domain audit to translate.wordpress.org submission
- `references/pot-generation.md`: WP-CLI `make-pot` options, npm scripts integration, common issues
- `references/block-json-translations.md`: `make-json`, `wp_set_script_translations`, block.json `textdomain` field
- `references/text-domain-rules.md`: WordPress.org requirements (slug match, hyphens, PHP/JS consistency)
- `references/wp-org-translations.md`: GlotPress workflow, PTE requests, language pack generation

---

## wp-org-release — 1.0.0 — 2026-05-22

### Added
- Initial release
- `SKILL.md`: 7-step procedure from pre-publish checklist to SVN tag creation
- `references/readme-txt-format.md`: Complete readme.txt template with all required/optional headers
- `references/svn-workflow.md`: SVN commands (checkout, add, commit, copy for tags)
- `references/plugin-assets.md`: Banner, icon, screenshot size specifications and SVN asset workflow
- `references/review-checklist.md`: Common WordPress.org review rejection reasons and fixes

---

## wp-phpcs — 1.0.0 — 2026-05-22

### Added
- Initial release
- `SKILL.md`: 5-step procedure (discover → install → configure → scripts → fix)
- `references/configuration.md`: Annotated `.phpcs.xml.dist` template for WooCommerce plugins
- `references/common-violations.md`: Top 15 WordPress PHPCS violations with before/after examples
- `references/woocommerce-sniffs.md`: WooCommerce-specific sniff configuration

---

## wp-phpunit — 1.0.0 — 2026-05-22

### Added
- Initial release
- `SKILL.md`: 6-step procedure (discover → install → WP test suite → phpunit.xml → bootstrap → scripts)
- `references/setup.md`: Full phpunit.xml.dist, bootstrap.php for plain WP and WooCommerce
- `references/wp-testcase-patterns.md`: Factory methods, hook testing, HTTP mocking, REST API patterns
- `references/wc-testing.md`: WC_Unit_Test_Case, WC helper factories, gateway and hook testing

---

## wp-github-actions — 1.0.0 — 2026-05-22

### Added
- Initial release
- `SKILL.md`: 5-step procedure (audit → PHP CI → JS CI → release → secrets)
- `references/workflow-templates.md`: Complete copy-paste YAML for ci-php.yml, ci-js.yml, release.yml
- `references/release-workflow.md`: .distignore, plugin-zip, GitHub Release, WordPress.org SVN deploy
- `references/composer-caching.md`: Composer and npm caching patterns for fast CI

---

## wp-e2e-playwright — 1.0.0 — 2026-05-22

### Added
- Initial release
- `SKILL.md`: 6-step procedure (audit → install → playwright.config.js → auth fixture → tests → CI)
- `references/setup.md`: playwright.config.ts/js, wp-env integration, admin login fixture, RequestUtils
- `references/wc-checkout-patterns.md`: Classic and Blocks checkout flows, payment gateway iframe testing, order status
- `references/block-editor-patterns.md`: Block insertion, Inspector Controls, frontend rendering, deprecation tests

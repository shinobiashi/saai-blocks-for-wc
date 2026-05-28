# Saai Blocks for WooCommerce — Claude Code Instructions

## プロジェクト概要

WooCommerce に特化した Gutenberg ブロックプラグイン。フロントエンド・管理画面の両対応。
WordPress.org への公開を予定。

- **Plugin slug**: `saai-blocks-for-wc`
- **Text domain**: `saai-blocks-for-wc`
- **PHP namespace**: `SaaiBlocksForWc`
- **Requires**: WordPress 6.6+, WooCommerce 9.0+, PHP 7.4+

## 技術スタック

| レイヤー | 技術 |
| --- | --- |
| PHP | WordPress Coding Standards, PHPStan lv8 |
| JS/CSS | `@wordpress/scripts` (webpack), React |
| ブロック | `block.json` + `register_block_type` |
| 管理画面 | WooCommerce Admin (`wc_admin_register_page`) + `@woocommerce/components` |
| テスト | PHPUnit (WP_UnitTestCase / WC_Unit_Test_Case) |
| CI | GitHub Actions (PHPCS, PHPStan, PHPUnit, JS lint) |

## ディレクトリ構造

```
saai-blocks-for-wc/
├── saai-blocks-for-wc.php   # プラグインエントリーポイント
├── includes/                # PHP クラス (PSR-4 オートロード)
│   ├── Admin/               # 管理画面 (WC Admin ページ等)
│   ├── Blocks/              # ブロック登録
│   └── ProductVideo/        # 商品動画機能 (Feature 1)
│       ├── Meta.php         # メタデータ登録・操作
│       ├── AdminPanel.php   # 商品編集画面パネル
│       ├── ClassicTheme.php # クラシックテーマ フロント統合
│       └── REST.php         # REST API エンドポイント
├── src/                     # JS/CSS ソース
│   ├── saai/admin/          # WC Admin ページ (React SPA, saai-blocks と同構成)
│   │   ├── overview/        # 概要ページ
│   │   └── video-settings/  # 動画グローバル設定ページ
│   └── blocks/              # ブロックソース
│       └── product-video/   # 商品動画ブロック
├── build/                   # ビルド成果物 (コミット対象)
│   ├── admin.js / admin.css
│   └── blocks/
│       └── product-video/
├── docs/                    # 設計・ロードマップドキュメント
└── tests/                   # PHPUnit テスト
```

## 開発コマンド

```bash
# JS ビルド (watch)
npm start

# JS ビルド (本番)
npm run build

# PHP コードスニファー
vendor/bin/phpcs

# PHP 自動修正
vendor/bin/phpcbf

# PHPStan 静的解析
vendor/bin/phpstan analyse --memory-limit=512M

# テスト
vendor/bin/phpunit

# wp-env 起動 / 停止
npx wp-env start
npx wp-env stop
```

## アーキテクチャ方針

### 管理画面

- JS ソースは `src/saai/admin/` 以下に配置（`saai-blocks` プラグインと同構成）
- React + `@woocommerce/components` を使用し、既存の WC Admin UI と統一
- 商品個別設定は商品編集画面のカスタムパネルとして実装

**メニュー構成** (saai-blocks と共有):

| スラッグ | 種別 | 説明 |
| --- | --- | --- |
| `saai-overview` | トップメニュー | saai-blocks 未導入時のみ本プラグインが登録 |
| `saai-blocks-for-wc-settings` | サブメニュー | 本プラグインが常に登録 |

**saai-blocks 共存時の競合回避**:
- `register_pages()` 内で `global $admin_page_hooks` を参照し、`saai-overview` が未登録の場合のみ `add_menu_page()` を呼ぶ
- overview スクリプトは `class_exists('SAAI_Blocks')` が false の場合のみエンキュー
- `saai_framework/` クラスは使用しない（`Setup.php` で完結）

### データ設計

- 商品メタは `register_post_meta` で登録し REST API 経由でも操作可能
- ポスト固有メタは `_saai_` プレフィックス（アンダースコアで非表示）
- プラグイン設定は `saai_blocks_for_wc_` プレフィックスで `update_option`

### ブロック

- `build/blocks/` 以下の全サブディレクトリを `register_block_type` で自動登録
- ブロックは `block.json` + PHP render callback (dynamic blocks) を基本とする
- WooCommerce ブロックとの統合は Slot/Fill または `woocommerce/product-details` ブロックへの拡張で対応

### フロント統合

- **クラシックテーマ**: `woocommerce_product_thumbnails` フックで動画を注入
- **ブロックテーマ**: `woocommerce/product-image-gallery` ブロックへの Inner Blocks 拡張 or フィルター

## コーディング規約

- WordPress Coding Standards 準拠（PHPCS で自動チェック）
- セキュリティ: input は `sanitize_*`、output は `esc_*`、nonce 必須
- コメントは理由が自明でない場合のみ（WHY を書く、WHAT は書かない）
- 新規 PHP クラスは `includes/` 以下に配置し `SaaiBlocksForWc\` 名前空間を使用

## 使用スキル一覧

| タスク | スキル |
| --- | --- |
| ブロック開発 | `wp-block-development`, `wc-block-development` |
| WooCommerce ブロック | `wc-block-development` |
| PHPUnit テスト | `wp-phpunit` |
| PHPCS 設定・修正 | `wp-phpcs` |
| PHPStan 設定 | `wp-phpstan` |
| GitHub Actions CI | `wp-github-actions` |
| WordPress.org リリース | `wp-org-release` |
| WP-CLI 操作 | `wp-wpcli-and-ops` |
| REST API 拡張 | `wp-rest-api` |
| i18n | `wp-i18n` |
| E2E テスト | `wp-e2e-playwright` |
| セキュリティ監査 | `wp-security-check` |

## 参考リンク

- [WooCommerce Blocks Handbook](https://developer.woocommerce.com/docs/category/woocommerce-blocks/)
- [Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [WC Admin Components](https://woocommerce.github.io/woocommerce-admin/)

# 開発ロードマップ

## 概要

各フェーズは独立した機能単位で管理する。実装順は変動することがある。

---

## Feature 1: 商品動画ギャラリー

**目的**: WooCommerce 商品ページに動画を表示する機能。商品メタとして動画情報を管理し、ギャラリーへの組み込みと表示順の制御を提供する。

### 進捗サマリー

| フェーズ | 状態 | 備考 |
| --- | --- | --- |
| 1.1 メタデータ基盤 | ✅ 完了 | |
| 1.2 商品編集画面パネル | 🔶 一部完了 | クラシックエディタのみ。ブロックエディタは未対応 |
| 1.3 グローバル設定ページ | 🔲 未着手 | プレースホルダーのみ実装済み |
| 1.4 クラシックテーマ フロント統合 | 🔲 未着手 | |
| 1.5 ブロックテーマ（FSE）統合 | 🔲 未着手 | |
| 1.6 テスト・品質保証 | 🔲 未着手 | |
| 1.7 i18n | 🔲 未着手 | |

### 仕様サマリー

| 項目 | 内容 |
| --- | --- |
| 動画ソース | YouTube / Vimeo / WordPress メディア |
| 最大動画数 | 1商品あたり3本 |
| テーマ対応 | クラシックテーマ + ブロックテーマ（FSE）両対応 |
| 表示スタイル | ギャラリー内インライン / ライトボックス / 独立セクション（商品ごとに選択可、デフォルトはグローバル設定） |

### データ設計

**商品メタ** (`_saai_product_videos`):

```json
[
  {
    "id": "video_uuid",
    "type": "youtube",
    "url": "https://www.youtube.com/watch?v=XXXXXXX",
    "video_id": "XXXXXXX",
    "attachment_id": 0,
    "thumbnail_url": "https://img.youtube.com/vi/XXXXXXX/maxresdefault.jpg",
    "title": "商品紹介動画",
    "gallery_order": 1
  }
]
```

- `type`: `"youtube"` | `"vimeo"` | `"wp_media"`
- `gallery_order`: ギャラリー内での表示位置（1 = 先頭）
- `attachment_id`: `wp_media` の場合のみ使用

**商品個別設定** (`_saai_product_video_display_style`):

- 値: `"inline"` | `"lightbox"` | `"standalone"` | `""` (空 = グローバル設定を使用)

**グローバル設定** (`saai_blocks_for_wc_video_display_style`):

- デフォルト: `"inline"`

---

### Phase 1.1: メタデータ基盤 ✅

**ファイル**: `includes/ProductVideo/Meta.php`

**内容**:

- [x] `register_post_meta` で `_saai_product_videos` を登録（REST API 公開）
- [x] `register_post_meta` で `_saai_product_video_display_style` を登録
- [x] メタ値のサニタイズ・バリデーション実装（`sanitize_videos` / `sanitize_display_style` — static）
- [x] メインプラグインクラスから `new Meta()` で初期化
- [x] `get_videos()` / `get_display_style()` ヘルパー追加（後フェーズ向け）

---

### Phase 1.2: 商品編集画面パネル 🔶

**ファイル**:

- `includes/ProductVideo/AdminPanel.php`
- `src/saai/admin/product-video-panel/index.js`
- `src/saai/admin/product-video-panel/index.scss`

**内容**:

- [x] 商品編集画面（クラシック）の「商品データ」タブに "Videos" パネルを追加
- [ ] ブロックエディタ（商品ブロックエディタ）への対応 — WC 9.x block template API は複雑なため別フェーズに分離予定
- [x] React UI:
  - [x] 動画タイプ選択（YouTube / Vimeo / WordPress メディア）
  - [x] URL 入力（YouTube/Vimeo）または `wp.media` によるメディアライブラリ選択
  - [x] YouTube サムネイル自動取得・プレビュー表示
  - [x] 最大3本まで追加・削除
  - [x] HTML5 ドラッグ＆ドロップで表示順変更（`gallery_order` 自動更新）
  - [x] 商品ごとの表示スタイル選択（空 = グローバル設定を使用）
- [x] hidden input 経由で `woocommerce_process_product_meta` フックでメタ保存（nonce 検証付き）

---

### Phase 1.3: グローバル設定ページ 🔲

**ファイル**:

- `includes/Admin/Setup.php` (設定ページのスクリプト登録を拡張)
- `src/saai/admin/video-settings/index.js` (設定 React ページ — プレースホルダー実装済み)

**管理画面構成** (saai-blocks と同一構成):

| スラッグ | 種別 | 説明 |
| --- | --- | --- |
| `saai-overview` | トップメニュー | saai-blocks 未導入時のみ本プラグインが登録 |
| `saai-blocks-for-wc-settings` | サブメニュー | 本プラグインが常に登録 |

**saai-blocks 共存**: `$admin_page_hooks` チェックで `saai-overview` の重複登録を回避。overview スクリプトは `class_exists('SAAI_Blocks')` が false のときのみエンキュー。

**内容**:

- [ ] `src/saai/admin/video-settings/index.js` に動画デフォルト表示スタイルのセレクターを実装
- [ ] `saai_blocks_for_wc_video_display_style` オプションの REST API 登録 (`register_setting`)
- [ ] `@wordpress/api-fetch` で設定値の保存・取得
- [ ] 保存成功/失敗の Notice 表示

---

### Phase 1.4: クラシックテーマ フロント統合 🔲

**ファイル**:

- `includes/ProductVideo/ClassicTheme.php`
- `src/frontend/product-video/` (フロントエンド JS)

**内容**:

- [ ] `woocommerce_product_thumbnails` フックで動画サムネイルを指定位置に挿入
- [ ] `gallery_order` に基づいて画像ギャラリーと動画の表示順を制御
- [ ] フロントエンド JS:
  - **inline**: サムネイルクリックでメインエリアに動画プレーヤーを展開（`<iframe>` or `<video>`）
  - **lightbox**: サムネイルクリックでモーダル表示、フルサイズ再生
  - **standalone**: ギャラリー下部または独立した `[saai_product_videos]` ショートコードエリアに表示
- [ ] YouTube / Vimeo の oEmbed サムネイル自動取得
- [ ] WordPress メディア動画の `<video>` タグレンダリング
- [ ] `wp_enqueue_scripts` でフロントスクリプト・スタイル登録（商品ページのみ）

---

### Phase 1.5: ブロックテーマ（FSE）統合 🔲

**ファイル**: `src/blocks/product-video/` (Gutenberg ブロック)

**内容**:

- [ ] `block.json` 定義（カテゴリ: `woocommerce`）
- [ ] PHP render callback (`render.php`)
- [ ] WooCommerce `woocommerce/product-image-gallery` ブロックとの統合
  - Inner Block または Slot/Fill で動画をギャラリーに追加
  - 表示スタイルに応じたレンダリング切り替え
- [ ] エディタプレビュー（商品 ID から動画メタを取得して表示）
- [ ] ブロック属性: `displayStyle` (`"inline"` | `"lightbox"` | `"standalone"` | `"global"`)
- [ ] WC block product editor（新エディタ）対応 — Phase 1.2 未対応分の継続

---

### Phase 1.6: テスト・品質保証 🔲

**内容**:

- [ ] PHPUnit: メタ登録・サニタイズ・取得のユニットテスト
- [ ] PHPUnit: REST API エンドポイントのテスト
- [ ] E2E (Playwright): 商品編集画面で動画を追加して保存するフロー
- [ ] E2E: フロントエンドで動画が正しく表示されるフロー（3スタイル）
- [ ] PHPCS / PHPStan パス確認

---

### Phase 1.7: i18n 🔲

**内容**:

- [ ] すべての文字列を `__()` / `_e()` でラップ
- [ ] JS 文字列を `@wordpress/i18n` でラップ（Phase 1.1〜1.2 は実装済み）
- [ ] POT ファイル生成 (`npm run makepot`)
- [ ] `wp_set_script_translations` の設定

---

## Feature 2 以降 (TBD)

以下は検討中の将来機能。優先度は未定。

| # | 機能 | 概要 |
| --- | --- | --- |
| 2 | 商品比較ブロック | 複数商品を並べてスペック比較するブロック |
| 3 | 在庫アラート | 在庫わずか/入荷通知ブロック |
| 4 | タブ型商品説明 | 商品説明をタブ分割して表示するブロック |
| 5 | カスタムバッジ | SALE/NEW/LIMITED 等のバッジブロック |

> 新機能を追加する際は、このファイルに新しい Feature セクションを追加してから実装を開始する。

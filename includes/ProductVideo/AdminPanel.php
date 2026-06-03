<?php
// phpcs:disable WordPress.Files.FileName
/**
 * Product video admin panel for the classic product editor.
 *
 * @package SaaiBlocksForWc
 */

namespace SaaiBlocksForWc\ProductVideo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Adds a "Videos" tab to the WooCommerce product data metabox and manages
 * saving the video meta values on the classic product editor screen.
 */
class AdminPanel {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_filter( 'woocommerce_product_data_tabs', array( $this, 'add_tab' ) );
		add_action( 'woocommerce_product_data_panels', array( $this, 'render_panel' ) );
		add_action( 'woocommerce_process_product_meta', array( $this, 'save' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Register the "Videos" tab in the product data metabox.
	 *
	 * @param array $tabs Existing product data tabs.
	 * @return array
	 */
	public function add_tab( $tabs ) {
		$tabs['saai_product_video'] = array(
			'label'    => __( 'Videos', 'saai-blocks-for-wc' ),
			'target'   => 'saai_product_video_panel',
			'class'    => array(),
			'priority' => 70,
		);
		return $tabs;
	}

	/**
	 * Render the panel container inside the product data metabox.
	 *
	 * The hidden inputs are read by PHP on save; the React component writes
	 * the current state into them whenever the values change.
	 */
	public function render_panel() {
		wp_nonce_field( 'saai_product_video_save', 'saai_product_video_nonce' );
		?>
		<div id="saai_product_video_panel" class="panel woocommerce_options_panel">
			<div id="saai-product-video-root"></div>
			<input type="hidden" id="saai-videos-data" name="_saai_videos_json" value="">
			<input type="hidden" id="saai-display-style-data" name="_saai_display_style" value="">
		</div>
		<?php
	}

	/**
	 * Save video meta when the classic product editor is submitted.
	 *
	 * @param int $product_id Product post ID.
	 */
	public function save( $product_id ) {
		$nonce = isset( $_POST['saai_product_video_nonce'] )
			? sanitize_key( wp_unslash( $_POST['saai_product_video_nonce'] ) )
			: '';

		if ( ! wp_verify_nonce( $nonce, 'saai_product_video_save' ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $product_id ) ) {
			return;
		}

		// Videos.
		$videos_json = isset( $_POST['_saai_videos_json'] )
			? wp_unslash( $_POST['_saai_videos_json'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			: '';

		$videos_raw = json_decode( $videos_json, true );
		if ( is_array( $videos_raw ) ) {
			update_post_meta( $product_id, Meta::META_VIDEOS, Meta::sanitize_videos( $videos_raw ) );
		}

		// Per-product display style override.
		$style_raw = isset( $_POST['_saai_display_style'] )
			? wp_unslash( $_POST['_saai_display_style'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			: '';

		update_post_meta( $product_id, Meta::META_DISPLAY_STYLE, Meta::sanitize_display_style( $style_raw ) );
	}

	/**
	 * Enqueue the React panel script on the classic product edit screen.
	 *
	 * @param string $hook_suffix Current admin page hook suffix.
	 */
	public function enqueue_scripts( $hook_suffix ) {
		if ( 'post.php' !== $hook_suffix && 'post-new.php' !== $hook_suffix ) {
			return;
		}

		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}

		$post = get_post();
		if ( ! $post || 'product' !== $post->post_type ) {
			return;
		}

		$script_rel  = 'build/saai/admin/product-video-panel.js';
		$script_abs  = SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . $script_rel;
		$asset_path  = SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'build/saai/admin/product-video-panel.asset.php';

		if ( ! file_exists( $script_abs ) ) {
			return;
		}

		$asset = file_exists( $asset_path )
			? require $asset_path
			: array(
				'dependencies' => array(),
				'version'      => SAAI_BLOCKS_FOR_WC_VERSION,
			);

		// Ensure the WP media library is available for the media picker.
		$asset['dependencies'][] = 'media-editor';
		wp_enqueue_media();

		wp_enqueue_script(
			'saai-product-video-panel',
			SAAI_BLOCKS_FOR_WC_PLUGIN_URL . $script_rel,
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations(
			'saai-product-video-panel',
			'saai-blocks-for-wc',
			SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'languages'
		);

		wp_localize_script(
			'saai-product-video-panel',
			'saaiProductVideoData',
			array(
				'productId'    => $post->ID,
				'videos'       => Meta::get_videos( $post->ID ),
				'displayStyle' => (string) get_post_meta( $post->ID, Meta::META_DISPLAY_STYLE, true ),
				'maxVideos'    => Meta::MAX_VIDEOS,
				'restUrl'      => esc_url_raw( rest_url( 'wp/v2/media' ) ),
				'restNonce'    => wp_create_nonce( 'wp_rest' ),
			)
		);

		$css_abs = SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'build/saai/admin/product-video-panel.css';
		if ( file_exists( $css_abs ) ) {
			wp_enqueue_style(
				'saai-product-video-panel',
				SAAI_BLOCKS_FOR_WC_PLUGIN_URL . 'build/saai/admin/product-video-panel.css',
				array( 'wp-components' ),
				filemtime( $css_abs )
			);
		}
	}
}

<?php

namespace SaaiBlocksForWc\Admin;

/**
 * SaaiBlocksForWc Setup Class
 */
class Setup {
	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'register_scripts' ) );
		add_action( 'admin_menu', array( $this, 'register_page' ) );
	}

	/**
	 * Load all necessary dependencies.
	 *
	 * @since 1.0.0
	 */
	public function register_scripts() {
		if ( ! \Automattic\WooCommerce\Admin\PageController::is_admin_or_embed_page() ) {
			return;
		}

		$script_path       = 'build/admin.js';
		$script_asset_path = SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'build/admin.asset.php';
		$script_asset      = file_exists( $script_asset_path )
			? require $script_asset_path
			: array(
				'dependencies' => array(),
				'version'      => filemtime( SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . $script_path ),
			);

		wp_register_script(
			'saai-blocks-for-wc-admin',
			SAAI_BLOCKS_FOR_WC_PLUGIN_URL . $script_path,
			$script_asset['dependencies'],
			$script_asset['version'],
			true
		);

		$style_path = 'build/admin.css';
		wp_register_style(
			'saai-blocks-for-wc-admin',
			SAAI_BLOCKS_FOR_WC_PLUGIN_URL . $style_path,
			array(),
			file_exists( SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . $style_path )
				? filemtime( SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . $style_path )
				: SAAI_BLOCKS_FOR_WC_VERSION
		);

		wp_enqueue_script( 'saai-blocks-for-wc-admin' );
		wp_enqueue_style( 'saai-blocks-for-wc-admin' );
	}

	/**
	 * Register page in wc-admin.
	 *
	 * @since 1.0.0
	 */
	public function register_page() {

		if ( ! function_exists( 'wc_admin_register_page' ) ) {
			return;
		}

		wc_admin_register_page(
			array(
				'id'     => 'saai_blocks_for_wc-example-page',
				'title'  => __( 'Saai Blocks for WooCommerce', 'saai-blocks-for-wc' ),
				'parent' => 'woocommerce',
				'path'   => '/saai-blocks-for-wc',
			)
		);
	}
}

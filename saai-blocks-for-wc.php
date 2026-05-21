<?php
/**
 * Plugin Name: Saai Blocks For Wc
 * Version: 0.1.0
 * Author: The WordPress Contributors
 * Author URI: https://woocommerce.com
 * Text Domain: saai-blocks-for-wc
 * Domain Path: /languages
 *
 * License: GNU General Public License v3.0
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 *
 * @package extension
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'SAAI_BLOCKS_FOR_WC_MAIN_PLUGIN_FILE' ) ) {
	define( 'SAAI_BLOCKS_FOR_WC_MAIN_PLUGIN_FILE', __FILE__ );
}

require_once plugin_dir_path( __FILE__ ) . '/vendor/autoload_packages.php';

use SaaiBlocksForWc\Admin\Setup;

// phpcs:disable WordPress.Files.FileName

/**
 * WooCommerce fallback notice.
 *
 * @since 0.1.0
 */
function saai_blocks_for_wc_missing_wc_notice() {
	/* translators: %s WC download URL link. */
	echo '<div class="error"><p><strong>' . sprintf( esc_html__( 'Saai Blocks For Wc requires WooCommerce to be installed and active. You can download %s here.', 'saai_blocks_for_wc' ), '<a href="https://woocommerce.com/" target="_blank">WooCommerce</a>' ) . '</strong></p></div>';
}

register_activation_hook( __FILE__, 'saai_blocks_for_wc_activate' );

/**
 * Activation hook.
 *
 * @since 0.1.0
 */
function saai_blocks_for_wc_activate() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', 'saai_blocks_for_wc_missing_wc_notice' );
		return;
	}
}

if ( ! class_exists( 'SaaiBlocksForWc' ) ) :
	/**
	 * The SaaiBlocksForWc class.
	 */
	class SaaiBlocksForWc {
		/**
		 * This class instance.
		 *
		 * @var \SaaiBlocksForWc single instance of this class.
		 */
		private static $instance;

		/**
		 * Constructor.
		 */
		public function __construct() {
			if ( is_admin() ) {
				new Setup();
			}
		}

		/**
		 * Cloning is forbidden.
		 */
		public function __clone() {
			wc_doing_it_wrong( __FUNCTION__, __( 'Cloning is forbidden.', 'saai_blocks_for_wc' ), $this->version );
		}

		/**
		 * Unserializing instances of this class is forbidden.
		 */
		public function __wakeup() {
			wc_doing_it_wrong( __FUNCTION__, __( 'Unserializing instances of this class is forbidden.', 'saai_blocks_for_wc' ), $this->version );
		}

		/**
		 * Gets the main instance.
		 *
		 * Ensures only one instance can be loaded.
		 *
		 * @return \saai_blocks_for_wc
		 */
		public static function instance() {

			if ( null === self::$instance ) {
				self::$instance = new self();
			}

			return self::$instance;
		}
	}
endif;

add_action( 'plugins_loaded', 'saai_blocks_for_wc_init', 10 );

/**
 * Initialize the plugin.
 *
 * @since 0.1.0
 */
function saai_blocks_for_wc_init() {
	load_plugin_textdomain( 'saai_blocks_for_wc', false, plugin_basename( dirname( __FILE__ ) ) . '/languages' );

	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', 'saai_blocks_for_wc_missing_wc_notice' );
		return;
	}

	SaaiBlocksForWc::instance();
}

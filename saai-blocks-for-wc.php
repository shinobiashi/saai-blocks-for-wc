<?php
/**
 * Plugin Name: Saai Blocks for WooCommerce
 * Plugin URI: https://wordpress.org/plugins/saai-blocks-for-wc/
 * Description: WooCommerce-focused Gutenberg blocks for the frontend and admin.
 * Version: 0.1.0
 * Author: Shohei Tanaka
 * Author URI: https://artws.info/
 * Text Domain: saai-blocks-for-wc
 * Domain Path: /languages
 * Requires at least: 6.6
 * Requires PHP: 7.4
 * Requires Plugins: woocommerce
 * WC requires at least: 9.0
 * WC tested up to: 9.8
 *
 * License: GNU General Public License v3.0
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 *
 * @package SaaiBlocksForWc
 */

defined( 'ABSPATH' ) || exit;

define( 'SAAI_BLOCKS_FOR_WC_VERSION', '0.1.0' );
define( 'SAAI_BLOCKS_FOR_WC_MAIN_PLUGIN_FILE', __FILE__ );
define( 'SAAI_BLOCKS_FOR_WC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SAAI_BLOCKS_FOR_WC_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'vendor/autoload_packages.php';

use SaaiBlocksForWc\Admin\Setup;
use SaaiBlocksForWc\Blocks\Register;
use SaaiBlocksForWc\ProductVideo\AdminPanel;
use SaaiBlocksForWc\ProductVideo\ClassicTheme;
use SaaiBlocksForWc\ProductVideo\Meta;

// phpcs:disable WordPress.Files.FileName

if ( ! class_exists( 'SaaiBlocksForWc' ) ) :
	/**
	 * Main plugin class.
	 */
	class SaaiBlocksForWc {

		/**
		 * Single instance.
		 *
		 * @var \SaaiBlocksForWc
		 */
		private static $instance;

		/**
		 * Constructor.
		 */
		public function __construct() {
			new Register();
			new Meta();

			if ( is_admin() ) {
				new Setup();
				new AdminPanel();
			} else {
				new ClassicTheme();
			}
		}

		/**
		 * Cloning is forbidden.
		 */
		public function __clone() {
			wc_doing_it_wrong( __FUNCTION__, __( 'Cloning is forbidden.', 'saai-blocks-for-wc' ), SAAI_BLOCKS_FOR_WC_VERSION );
		}

		/**
		 * Unserializing is forbidden.
		 */
		public function __wakeup() {
			wc_doing_it_wrong( __FUNCTION__, __( 'Unserializing instances of this class is forbidden.', 'saai-blocks-for-wc' ), SAAI_BLOCKS_FOR_WC_VERSION );
		}

		/**
		 * Gets the main instance.
		 *
		 * @return \SaaiBlocksForWc
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
	load_plugin_textdomain( 'saai-blocks-for-wc', false, plugin_basename( __DIR__ ) . '/languages' );

	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action(
			'admin_notices',
			static function () {
				echo '<div class="error"><p><strong>' .
					wp_kses(
						sprintf(
							/* translators: %s: WooCommerce download URL. */
							__( 'Saai Blocks for WooCommerce requires WooCommerce to be installed and active. You can download %s here.', 'saai-blocks-for-wc' ),
							'<a href="https://woocommerce.com/" target="_blank">WooCommerce</a>'
						),
						array( 'a' => array( 'href' => array(), 'target' => array() ) )
					) .
					'</strong></p></div>';
			}
		);
		return;
	}

	SaaiBlocksForWc::instance();
}

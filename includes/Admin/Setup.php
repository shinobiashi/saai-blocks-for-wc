<?php
/**
 * Admin setup class.
 *
 * @package SaaiBlocksForWc
 */

namespace SaaiBlocksForWc\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the shared SAAI admin menu and plugin-specific submenus.
 *
 * When saai-blocks is also active it already registers the top-level
 * "SAAI" menu (slug: saai-overview).  We detect this via $admin_page_hooks
 * and skip the duplicate add_menu_page() call to avoid a double entry in the
 * sidebar.  The overview scripts are likewise skipped when saai-blocks owns
 * the page.
 */
class Setup {

	/**
	 * Shared top-level menu slug (same across all SAAI plugins).
	 *
	 * @var string
	 */
	private $menu_slug = 'saai-overview';

	/**
	 * Hook suffix returned by add_submenu_page() for the settings page.
	 *
	 * @var string|false
	 */
	private $settings_page_hook = false;

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_menu', array( $this, 'register_pages' ) );
		add_filter( 'admin_body_class', array( $this, 'add_admin_body_class' ) );
	}

	/**
	 * Register admin pages.
	 *
	 * Registers the shared SAAI top-level menu only when it has not already
	 * been registered by another SAAI plugin (e.g. saai-blocks).
	 */
	public function register_pages() {
		global $admin_page_hooks;

		if ( ! isset( $admin_page_hooks[ $this->menu_slug ] ) ) {
			add_menu_page(
				__( 'SAAI Overview', 'saai-blocks-for-wc' ),
				__( 'SAAI', 'saai-blocks-for-wc' ),
				'manage_options',
				$this->menu_slug,
				array( $this, 'overview_page_callback' ),
				SAAI_BLOCKS_FOR_WC_PLUGIN_URL . 'assets/images/saai_icon.svg',
				56
			);
		}

		$this->settings_page_hook = add_submenu_page(
			$this->menu_slug,
			__( 'WC Blocks Settings', 'saai-blocks-for-wc' ),
			__( 'WC Blocks', 'saai-blocks-for-wc' ),
			'manage_options',
			'saai-blocks-for-wc-settings',
			array( $this, 'settings_page_callback' )
		);
	}

	/**
	 * Render the overview page.
	 *
	 * Called only when saai-blocks is not active (otherwise saai-blocks owns
	 * the callback for this menu entry).
	 */
	public function overview_page_callback() {
		echo '<div class="wrap"><div id="root"></div></div>';
	}

	/**
	 * Render the WC Blocks settings page.
	 */
	public function settings_page_callback() {
		echo '<div class="wrap"><div id="root-saai-blocks-for-wc-settings"></div></div>';
	}

	/**
	 * Enqueue scripts and styles for admin pages.
	 *
	 * @param string $hook_suffix Current admin page hook suffix.
	 */
	public function enqueue_scripts( $hook_suffix ) {
		// Overview scripts: only when we own the page (saai-blocks not active).
		if (
			'toplevel_page_' . $this->menu_slug === $hook_suffix &&
			! class_exists( 'SAAI_Blocks' )
		) {
			$this->enqueue_overview_scripts();
		}

		// WC Blocks settings scripts.
		if ( $this->settings_page_hook && $hook_suffix === $this->settings_page_hook ) {
			$this->enqueue_settings_scripts();
		}
	}

	/**
	 * Enqueue overview page assets.
	 */
	private function enqueue_overview_scripts() {
		$script_path = 'build/saai/admin/overview.js';
		$asset_path  = SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'build/saai/admin/overview.asset.php';
		$asset       = file_exists( $asset_path )
			? require $asset_path
			: array(
				'dependencies' => array(),
				'version'      => SAAI_BLOCKS_FOR_WC_VERSION,
			);

		wp_enqueue_script(
			'saai-blocks-for-wc-overview',
			SAAI_BLOCKS_FOR_WC_PLUGIN_URL . $script_path,
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations(
			'saai-blocks-for-wc-overview',
			'saai-blocks-for-wc',
			SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'languages'
		);

		wp_localize_script(
			'saai-blocks-for-wc-overview',
			'saaiBlocksData',
			array(
				'wooPartnerLogoUrl' => SAAI_BLOCKS_FOR_WC_PLUGIN_URL . 'assets/images/woo_partner_logo.png',
			)
		);

		$css_path = SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'build/saai/admin/overview.css';
		if ( file_exists( $css_path ) ) {
			wp_enqueue_style(
				'saai-blocks-for-wc-overview',
				SAAI_BLOCKS_FOR_WC_PLUGIN_URL . 'build/saai/admin/overview.css',
				array(),
				filemtime( $css_path )
			);
		}
	}

	/**
	 * Enqueue WC Blocks settings page assets.
	 */
	private function enqueue_settings_scripts() {
		$script_path = 'build/saai/admin/video-settings.js';
		$asset_path  = SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'build/saai/admin/video-settings.asset.php';
		$asset       = file_exists( $asset_path )
			? require $asset_path
			: array(
				'dependencies' => array(),
				'version'      => SAAI_BLOCKS_FOR_WC_VERSION,
			);

		wp_enqueue_script(
			'saai-blocks-for-wc-settings',
			SAAI_BLOCKS_FOR_WC_PLUGIN_URL . $script_path,
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations(
			'saai-blocks-for-wc-settings',
			'saai-blocks-for-wc',
			SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'languages'
		);

		$css_path = SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'build/saai/admin/video-settings.css';
		if ( file_exists( $css_path ) ) {
			wp_enqueue_style(
				'saai-blocks-for-wc-settings',
				SAAI_BLOCKS_FOR_WC_PLUGIN_URL . 'build/saai/admin/video-settings.css',
				array( 'wp-components' ),
				filemtime( $css_path )
			);
		}
	}

	/**
	 * Add saai-admin-page body class on SAAI admin pages.
	 *
	 * @param string $classes Existing body classes.
	 * @return string Modified body classes.
	 */
	public function add_admin_body_class( $classes ) {
		$screen = get_current_screen();
		if ( ! $screen ) {
			return $classes;
		}

		$saai_pages = array_filter(
			array(
				'toplevel_page_' . $this->menu_slug,
				$this->settings_page_hook,
			)
		);

		if ( in_array( $screen->id, $saai_pages, true ) ) {
			$classes .= ' saai-admin-page';
		}

		return $classes;
	}
}

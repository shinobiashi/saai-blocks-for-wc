<?php
/**
 * PHPUnit bootstrap for Saai Blocks for WooCommerce.
 *
 * Run via wp-env:
 *   npx wp-env run tests-cli "cd /var/www/html/wp-content/plugins/saai-blocks-for-wc && vendor/bin/phpunit"
 *
 * @package SaaiBlocksForWc
 */

$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	$_tests_dir = '/tmp/wordpress-tests-lib';
}

if ( ! file_exists( "$_tests_dir/includes/functions.php" ) ) {
	echo 'Could not find the WP test suite at "' . $_tests_dir . '".' . PHP_EOL;
	echo 'Set the WP_TESTS_DIR environment variable to the WordPress test library path.' . PHP_EOL;
	exit( 1 );
}

require_once "$_tests_dir/includes/functions.php";

/**
 * Load WooCommerce and the plugin before WordPress initializes.
 */
function _saai_tests_load_plugins() {
	$wc_plugin = WP_CONTENT_DIR . '/plugins/woocommerce/woocommerce.php';
	if ( file_exists( $wc_plugin ) ) {
		require_once $wc_plugin;
	}

	require dirname( __DIR__ ) . '/saai-blocks-for-wc.php';
}

tests_add_filter( 'muplugins_loaded', '_saai_tests_load_plugins' );

require "$_tests_dir/includes/bootstrap.php";

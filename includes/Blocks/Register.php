<?php

namespace SaaiBlocksForWc\Blocks;

/**
 * Handles block registration for all blocks in this plugin.
 *
 * @package SaaiBlocksForWc
 */
class Register {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_blocks' ) );
	}

	/**
	 * Register all blocks defined in build/blocks/.
	 *
	 * Each subdirectory must contain a block.json produced by @wordpress/scripts build.
	 */
	public function register_blocks() {
		$blocks_dir = SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'build/blocks/';

		if ( ! is_dir( $blocks_dir ) ) {
			return;
		}

		$block_dirs = glob( $blocks_dir . '*', GLOB_ONLYDIR );

		if ( ! $block_dirs ) {
			return;
		}

		foreach ( $block_dirs as $block_dir ) {
			register_block_type( $block_dir );
		}
	}
}

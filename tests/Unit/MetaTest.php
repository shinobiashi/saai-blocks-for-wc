<?php
/**
 * Tests for SaaiBlocksForWc\ProductVideo\Meta
 *
 * @package SaaiBlocksForWc
 */

use SaaiBlocksForWc\ProductVideo\Meta;

/**
 * Unit tests for the Meta class: sanitization, helpers, and meta registration.
 */
class MetaTest extends WP_UnitTestCase {

	// -------------------------------------------------------------------------
	// sanitize_videos()
	// -------------------------------------------------------------------------

	/**
	 * @dataProvider non_array_inputs
	 */
	public function test_sanitize_videos_rejects_non_array( $input ) {
		$this->assertSame( array(), Meta::sanitize_videos( $input ) );
	}

	public function non_array_inputs() {
		return array(
			array( null ),
			array( '' ),
			array( 'string' ),
			array( 42 ),
			array( true ),
		);
	}

	public function test_sanitize_videos_rejects_invalid_type() {
		$videos = array(
			array(
				'id'   => 'abc',
				'type' => 'invalid_type',
				'url'  => 'https://example.com/video',
			),
		);
		$this->assertSame( array(), Meta::sanitize_videos( $videos ) );
	}

	public function test_sanitize_videos_rejects_missing_url() {
		$videos = array(
			array(
				'id'   => 'abc',
				'type' => 'youtube',
				'url'  => '',
			),
		);
		$this->assertSame( array(), Meta::sanitize_videos( $videos ) );
	}

	public function test_sanitize_videos_accepts_valid_youtube() {
		$videos = array(
			array(
				'id'            => 'uuid-1',
				'type'          => 'youtube',
				'url'           => 'https://www.youtube.com/watch?v=XXXXXXX',
				'video_id'      => 'XXXXXXX',
				'title'         => 'My Video',
				'gallery_order' => 1,
			),
		);
		$result = Meta::sanitize_videos( $videos );
		$this->assertCount( 1, $result );
		$this->assertSame( 'youtube', $result[0]['type'] );
		$this->assertSame( 'XXXXXXX', $result[0]['video_id'] );
		$this->assertSame( 'My Video', $result[0]['title'] );
	}

	public function test_sanitize_videos_accepts_all_types() {
		foreach ( array( 'youtube', 'vimeo', 'wp_media' ) as $type ) {
			$videos = array(
				array(
					'id'   => 'uuid',
					'type' => $type,
					'url'  => 'https://example.com/video',
				),
			);
			$result = Meta::sanitize_videos( $videos );
			$this->assertCount( 1, $result, "Type '$type' should be accepted" );
		}
	}

	public function test_sanitize_videos_enforces_max_limit() {
		$videos = array_fill(
			0,
			Meta::MAX_VIDEOS + 2,
			array(
				'id'   => 'uuid',
				'type' => 'youtube',
				'url'  => 'https://www.youtube.com/watch?v=XYZ',
			)
		);
		$result = Meta::sanitize_videos( $videos );
		$this->assertCount( Meta::MAX_VIDEOS, $result );
	}

	public function test_sanitize_videos_gallery_order_minimum_is_one() {
		$videos = array(
			array(
				'id'            => 'uuid',
				'type'          => 'youtube',
				'url'           => 'https://www.youtube.com/watch?v=XYZ',
				'gallery_order' => 0,
			),
		);
		$result = Meta::sanitize_videos( $videos );
		$this->assertSame( 1, $result[0]['gallery_order'] );
	}

	public function test_sanitize_videos_sanitizes_title_field() {
		$videos = array(
			array(
				'id'    => 'uuid',
				'type'  => 'youtube',
				'url'   => 'https://www.youtube.com/watch?v=XYZ',
				'title' => '<script>alert(1)</script>My Title',
			),
		);
		$result = Meta::sanitize_videos( $videos );
		$this->assertStringNotContainsString( '<script>', $result[0]['title'] );
	}

	public function test_sanitize_videos_skips_non_array_items() {
		$videos = array( 'not-an-array', array( 'type' => 'youtube', 'url' => 'https://youtube.com', 'id' => 'x' ) );
		$result = Meta::sanitize_videos( $videos );
		$this->assertCount( 1, $result );
	}

	// -------------------------------------------------------------------------
	// sanitize_display_style()
	// -------------------------------------------------------------------------

	/**
	 * @dataProvider valid_display_styles
	 */
	public function test_sanitize_display_style_accepts_valid_values( $value ) {
		$this->assertSame( $value, Meta::sanitize_display_style( $value ) );
	}

	public function valid_display_styles() {
		return array(
			array( '' ),
			array( 'inline' ),
			array( 'lightbox' ),
			array( 'standalone' ),
		);
	}

	/**
	 * @dataProvider invalid_display_styles
	 */
	public function test_sanitize_display_style_rejects_invalid_values( $value ) {
		$this->assertSame( '', Meta::sanitize_display_style( $value ) );
	}

	public function invalid_display_styles() {
		return array(
			array( 'invalid' ),
			array( 'INLINE' ),
			array( '<script>xss</script>' ),
			array( 'global' ),
		);
	}

	// -------------------------------------------------------------------------
	// sanitize_global_display_style()
	// -------------------------------------------------------------------------

	/**
	 * @dataProvider valid_global_styles
	 */
	public function test_sanitize_global_display_style_accepts_valid_values( $value ) {
		$this->assertSame( $value, Meta::sanitize_global_display_style( $value ) );
	}

	public function valid_global_styles() {
		return array(
			array( 'inline' ),
			array( 'lightbox' ),
			array( 'standalone' ),
		);
	}

	/**
	 * @dataProvider invalid_global_styles
	 */
	public function test_sanitize_global_display_style_falls_back_to_inline( $value ) {
		$this->assertSame( 'inline', Meta::sanitize_global_display_style( $value ) );
	}

	public function invalid_global_styles() {
		return array(
			array( '' ),
			array( 'invalid' ),
			array( 'global' ),
			array( '<script>xss</script>' ),
		);
	}

	// -------------------------------------------------------------------------
	// get_videos()
	// -------------------------------------------------------------------------

	public function test_get_videos_returns_empty_for_new_post() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'product' ) );
		$this->assertSame( array(), Meta::get_videos( $post_id ) );
	}

	public function test_get_videos_returns_saved_data() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'product' ) );
		$videos  = array(
			array(
				'id'            => 'uuid-1',
				'type'          => 'youtube',
				'url'           => 'https://www.youtube.com/watch?v=XYZ',
				'video_id'      => 'XYZ',
				'title'         => 'Test',
				'gallery_order' => 1,
			),
		);
		update_post_meta( $post_id, Meta::META_VIDEOS, $videos );
		$result = Meta::get_videos( $post_id );
		$this->assertCount( 1, $result );
		$this->assertSame( 'uuid-1', $result[0]['id'] );
	}

	// -------------------------------------------------------------------------
	// get_display_style()
	// -------------------------------------------------------------------------

	public function test_get_display_style_falls_back_to_global_option() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'product' ) );

		update_option( 'saai_blocks_for_wc_video_display_style', 'lightbox' );
		$this->assertSame( 'lightbox', Meta::get_display_style( $post_id ) );

		update_option( 'saai_blocks_for_wc_video_display_style', 'standalone' );
		$this->assertSame( 'standalone', Meta::get_display_style( $post_id ) );
	}

	public function test_get_display_style_per_product_overrides_global() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'product' ) );
		update_option( 'saai_blocks_for_wc_video_display_style', 'inline' );
		update_post_meta( $post_id, Meta::META_DISPLAY_STYLE, 'lightbox' );

		$this->assertSame( 'lightbox', Meta::get_display_style( $post_id ) );
	}

	public function test_get_display_style_empty_per_product_uses_global() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'product' ) );
		update_option( 'saai_blocks_for_wc_video_display_style', 'standalone' );
		update_post_meta( $post_id, Meta::META_DISPLAY_STYLE, '' );

		$this->assertSame( 'standalone', Meta::get_display_style( $post_id ) );
	}

	public function test_get_display_style_invalid_global_returns_inline() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'product' ) );
		update_option( 'saai_blocks_for_wc_video_display_style', 'invalid' );

		$this->assertSame( 'inline', Meta::get_display_style( $post_id ) );
	}

	// -------------------------------------------------------------------------
	// Meta registration
	// -------------------------------------------------------------------------

	public function test_product_videos_meta_is_registered() {
		$registered = get_registered_meta_keys( 'post', 'product' );
		$this->assertArrayHasKey( Meta::META_VIDEOS, $registered );
	}

	public function test_display_style_meta_is_registered() {
		$registered = get_registered_meta_keys( 'post', 'product' );
		$this->assertArrayHasKey( Meta::META_DISPLAY_STYLE, $registered );
	}
}

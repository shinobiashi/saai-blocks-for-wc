<?php
/**
 * REST API integration tests for product video meta.
 *
 * @package SaaiBlocksForWc
 */

use SaaiBlocksForWc\ProductVideo\Meta;

/**
 * Tests that product video meta is accessible and sanitized via the REST API.
 */
class MetaRestApiTest extends WP_UnitTestCase {

	/**
	 * REST server instance.
	 *
	 * @var WP_REST_Server
	 */
	protected $server;

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	protected $editor_id;

	/**
	 * Product post ID.
	 *
	 * @var int
	 */
	protected $product_id;

	/**
	 * Set up before each test.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$this->server = $wp_rest_server = new WP_REST_Server();
		do_action( 'rest_api_init' );

		$this->editor_id  = $this->factory->user->create( array( 'role' => 'editor' ) );
		$this->product_id = $this->factory->post->create( array( 'post_type' => 'product' ) );
	}

	/**
	 * Tear down after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();
		global $wp_rest_server;
		$wp_rest_server = null;
	}

	// -------------------------------------------------------------------------
	// GET /wp/v2/product/<id>?context=edit
	// -------------------------------------------------------------------------

	public function test_video_meta_exposed_in_rest_response() {
		wp_set_current_user( $this->editor_id );

		$videos = array(
			array(
				'id'            => 'uuid-1',
				'type'          => 'youtube',
				'url'           => 'https://www.youtube.com/watch?v=TESTID',
				'video_id'      => 'TESTID',
				'title'         => 'Test Video',
				'gallery_order' => 1,
			),
		);
		update_post_meta( $this->product_id, Meta::META_VIDEOS, $videos );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/product/' . $this->product_id );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'meta', $data );
		$this->assertArrayHasKey( Meta::META_VIDEOS, $data['meta'] );
		$this->assertCount( 1, $data['meta'][ Meta::META_VIDEOS ] );
	}

	// -------------------------------------------------------------------------
	// POST /wp/v2/product/<id> (update meta)
	// -------------------------------------------------------------------------

	public function test_saving_videos_via_rest_sanitizes_input() {
		wp_set_current_user( $this->editor_id );

		$videos = array(
			array(
				'id'            => 'uuid-1',
				'type'          => 'vimeo',
				'url'           => 'https://vimeo.com/123456',
				'video_id'      => '123456',
				'title'         => '<b>Bold</b> Title',
				'gallery_order' => 2,
			),
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/product/' . $this->product_id );
		$request->set_param( 'meta', array( Meta::META_VIDEOS => $videos ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$saved = Meta::get_videos( $this->product_id );
		$this->assertCount( 1, $saved );
		$this->assertStringNotContainsString( '<b>', $saved[0]['title'] );
	}

	public function test_saving_invalid_video_type_is_rejected() {
		wp_set_current_user( $this->editor_id );

		$videos = array(
			array(
				'id'   => 'uuid-1',
				'type' => 'not_a_real_type',
				'url'  => 'https://example.com/video',
			),
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/product/' . $this->product_id );
		$request->set_param( 'meta', array( Meta::META_VIDEOS => $videos ) );
		$this->server->dispatch( $request );

		$this->assertSame( array(), Meta::get_videos( $this->product_id ) );
	}

	public function test_max_videos_limit_enforced_via_rest() {
		wp_set_current_user( $this->editor_id );

		$videos = array_fill(
			0,
			Meta::MAX_VIDEOS + 2,
			array(
				'id'   => 'uuid',
				'type' => 'youtube',
				'url'  => 'https://www.youtube.com/watch?v=XYZ',
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/product/' . $this->product_id );
		$request->set_param( 'meta', array( Meta::META_VIDEOS => $videos ) );
		$this->server->dispatch( $request );

		$this->assertCount( Meta::MAX_VIDEOS, Meta::get_videos( $this->product_id ) );
	}

	public function test_display_style_saved_and_sanitized_via_rest() {
		wp_set_current_user( $this->editor_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/product/' . $this->product_id );
		$request->set_param( 'meta', array( Meta::META_DISPLAY_STYLE => 'lightbox' ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'lightbox', get_post_meta( $this->product_id, Meta::META_DISPLAY_STYLE, true ) );
	}

	public function test_invalid_display_style_falls_back_to_empty() {
		wp_set_current_user( $this->editor_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/product/' . $this->product_id );
		$request->set_param( 'meta', array( Meta::META_DISPLAY_STYLE => 'not_valid' ) );
		$this->server->dispatch( $request );

		$this->assertSame( '', get_post_meta( $this->product_id, Meta::META_DISPLAY_STYLE, true ) );
	}

	// -------------------------------------------------------------------------
	// Auth
	// -------------------------------------------------------------------------

	public function test_unauthenticated_user_cannot_update_meta() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'POST', '/wp/v2/product/' . $this->product_id );
		$request->set_param(
			'meta',
			array( Meta::META_DISPLAY_STYLE => 'inline' )
		);
		$response = $this->server->dispatch( $request );

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}

	public function test_subscriber_cannot_update_meta() {
		$subscriber_id = $this->factory->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/product/' . $this->product_id );
		$request->set_param(
			'meta',
			array( Meta::META_DISPLAY_STYLE => 'inline' )
		);
		$response = $this->server->dispatch( $request );

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}
}

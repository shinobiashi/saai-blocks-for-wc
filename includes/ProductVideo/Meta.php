<?php
/**
 * Product video meta registration.
 *
 * @package SaaiBlocksForWc
 */

namespace SaaiBlocksForWc\ProductVideo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers and manages post meta for product videos.
 */
class Meta {

	/**
	 * Maximum number of videos per product.
	 */
	const MAX_VIDEOS = 3;

	/**
	 * Meta key for the video list.
	 */
	const META_VIDEOS = '_saai_product_videos';

	/**
	 * Meta key for the per-product display style override.
	 */
	const META_DISPLAY_STYLE = '_saai_product_video_display_style';

	/**
	 * Allowed video source types.
	 *
	 * @var string[]
	 */
	private static $allowed_types = array( 'youtube', 'vimeo', 'wp_media' );

	/**
	 * Allowed display style values. Empty string means "use global setting".
	 *
	 * @var string[]
	 */
	private static $allowed_styles = array( '', 'inline', 'lightbox', 'standalone' );

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register' ) );
	}

	/**
	 * Register post meta for the product post type.
	 */
	public function register() {
		register_post_meta(
			'product',
			self::META_VIDEOS,
			array(
				'type'              => 'array',
				'single'            => true,
				'default'           => array(),
				'show_in_rest'      => array(
					'schema' => array(
						'type'     => 'array',
						'maxItems' => self::MAX_VIDEOS,
						'items'    => array(
							'type'       => 'object',
							'required'   => array( 'id', 'type', 'url' ),
							'properties' => array(
								'id'            => array( 'type' => 'string' ),
								'type'          => array(
									'type' => 'string',
									'enum' => self::$allowed_types,
								),
								'url'           => array(
									'type'   => 'string',
									'format' => 'uri',
								),
								'video_id'      => array( 'type' => 'string' ),
								'attachment_id' => array( 'type' => 'integer' ),
								'thumbnail_url' => array(
									'type'   => 'string',
									'format' => 'uri',
								),
								'title'         => array( 'type' => 'string' ),
								'gallery_order' => array(
									'type'    => 'integer',
									'minimum' => 1,
								),
							),
						),
					),
				),
				'sanitize_callback' => array( $this, 'sanitize_videos' ),
				'auth_callback'     => array( $this, 'auth_callback' ),
			)
		);

		register_post_meta(
			'product',
			self::META_DISPLAY_STYLE,
			array(
				'type'              => 'string',
				'single'            => true,
				'default'           => '',
				'show_in_rest'      => true,
				'sanitize_callback' => array( $this, 'sanitize_display_style' ),
				'auth_callback'     => array( $this, 'auth_callback' ),
			)
		);
	}

	/**
	 * Sanitize the video list meta value.
	 *
	 * Enforces the maximum video count, validates required fields, and
	 * sanitizes every property individually.
	 *
	 * @param mixed $videos Raw input value.
	 * @return array Sanitized array of video objects.
	 */
	public function sanitize_videos( $videos ) {
		if ( ! is_array( $videos ) ) {
			return array();
		}

		$sanitized = array();

		foreach ( array_slice( $videos, 0, self::MAX_VIDEOS ) as $video ) {
			if ( ! is_array( $video ) ) {
				continue;
			}

			$type = sanitize_key( $video['type'] ?? '' );
			if ( ! in_array( $type, self::$allowed_types, true ) ) {
				continue;
			}

			$url = esc_url_raw( $video['url'] ?? '' );
			if ( empty( $url ) ) {
				continue;
			}

			$sanitized[] = array(
				'id'            => sanitize_text_field( $video['id'] ?? wp_generate_uuid4() ),
				'type'          => $type,
				'url'           => $url,
				'video_id'      => sanitize_text_field( $video['video_id'] ?? '' ),
				'attachment_id' => absint( $video['attachment_id'] ?? 0 ),
				'thumbnail_url' => esc_url_raw( $video['thumbnail_url'] ?? '' ),
				'title'         => sanitize_text_field( $video['title'] ?? '' ),
				'gallery_order' => max( 1, absint( $video['gallery_order'] ?? 1 ) ),
			);
		}

		return $sanitized;
	}

	/**
	 * Sanitize the display style meta value.
	 *
	 * @param mixed $value Raw input value.
	 * @return string One of '', 'inline', 'lightbox', 'standalone'.
	 */
	public function sanitize_display_style( $value ) {
		$value = sanitize_key( (string) $value );
		return in_array( $value, self::$allowed_styles, true ) ? $value : '';
	}

	/**
	 * Auth callback: allow users who can edit the product.
	 *
	 * @param bool   $allowed  Whether the current user is allowed.
	 * @param string $meta_key Meta key being checked.
	 * @param int    $post_id  Post ID.
	 * @return bool
	 */
	public function auth_callback( $allowed, $meta_key, $post_id ) {
		return current_user_can( 'edit_post', $post_id );
	}

	// -------------------------------------------------------------------------
	// Public helpers (used by later phases)
	// -------------------------------------------------------------------------

	/**
	 * Get the video list for a product.
	 *
	 * @param int $product_id Product post ID.
	 * @return array Sanitized video array, empty array when none set.
	 */
	public static function get_videos( $product_id ) {
		$videos = get_post_meta( $product_id, self::META_VIDEOS, true );
		return is_array( $videos ) ? $videos : array();
	}

	/**
	 * Get the effective display style for a product.
	 *
	 * Falls back to the plugin-wide option when the per-product value is empty.
	 *
	 * @param int $product_id Product post ID.
	 * @return string 'inline', 'lightbox', or 'standalone'.
	 */
	public static function get_display_style( $product_id ) {
		$style = get_post_meta( $product_id, self::META_DISPLAY_STYLE, true );
		if ( '' !== $style && in_array( $style, array( 'inline', 'lightbox', 'standalone' ), true ) ) {
			return $style;
		}

		$global = get_option( 'saai_blocks_for_wc_video_display_style', 'inline' );
		return in_array( $global, array( 'inline', 'lightbox', 'standalone' ), true ) ? $global : 'inline';
	}
}

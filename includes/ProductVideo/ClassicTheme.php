<?php
/**
 * Classic theme front-end integration for product videos.
 *
 * @package SaaiBlocksForWc
 */

// phpcs:disable WordPress.Files.FileName

namespace SaaiBlocksForWc\ProductVideo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Integrates product videos into WooCommerce classic theme galleries.
 */
class ClassicTheme {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'woocommerce_product_thumbnails', array( $this, 'render_video_thumbnails' ), 25 );
		add_action( 'woocommerce_after_single_product_summary', array( $this, 'render_standalone_section' ), 8 );
		add_shortcode( 'saai_product_videos', array( $this, 'shortcode_handler' ) );
	}

	/**
	 * Enqueue frontend scripts and styles on product pages only.
	 */
	public function enqueue_scripts() {
		if ( ! is_product() ) {
			return;
		}

		$asset_file = SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'build/frontend/product-video.asset.php';
		$asset      = file_exists( $asset_file )
			? require $asset_file
			: array(
				'dependencies' => array( 'jquery' ),
				'version'      => SAAI_BLOCKS_FOR_WC_VERSION,
			);

		if ( ! in_array( 'jquery', $asset['dependencies'], true ) ) {
			$asset['dependencies'][] = 'jquery';
		}

		wp_enqueue_script(
			'saai-product-video',
			SAAI_BLOCKS_FOR_WC_PLUGIN_URL . 'build/frontend/product-video.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations(
			'saai-product-video',
			'saai-blocks-for-wc',
			SAAI_BLOCKS_FOR_WC_PLUGIN_DIR . 'languages'
		);

		wp_enqueue_style(
			'saai-product-video',
			SAAI_BLOCKS_FOR_WC_PLUGIN_URL . 'build/frontend/product-video.css',
			array(),
			$asset['version']
		);
	}

	/**
	 * Render video thumbnails inside the WooCommerce product gallery wrapper.
	 *
	 * Standalone display style is handled separately via render_standalone_section().
	 */
	public function render_video_thumbnails() {
		global $product;

		if ( ! $product instanceof \WC_Product ) {
			return;
		}

		$videos = Meta::get_videos( $product->get_id() );
		$style  = Meta::get_display_style( $product->get_id() );

		if ( empty( $videos ) || 'standalone' === $style ) {
			return;
		}

		usort(
			$videos,
			static function ( $a, $b ) {
				return ( (int) ( $a['gallery_order'] ?? 1 ) ) - ( (int) ( $b['gallery_order'] ?? 1 ) );
			}
		);

		foreach ( $videos as $video ) {
			$this->render_video_thumbnail( $video, $style );
		}
	}

	/**
	 * Render a single video as a gallery slide div.
	 *
	 * @param array  $video Video data array.
	 * @param string $style Effective display style.
	 */
	private function render_video_thumbnail( array $video, string $style ) {
		$type      = sanitize_key( $video['type'] ?? '' );
		$video_id  = sanitize_text_field( $video['video_id'] ?? '' );
		$url       = esc_url( $video['url'] ?? '' );
		$title     = esc_attr( $video['title'] ?? '' );
		$thumb_url = esc_url( $video['thumbnail_url'] ?? '' );
		$attach_id = absint( $video['attachment_id'] ?? 0 );

		if ( ! $thumb_url && 'youtube' === $type && $video_id ) {
			$thumb_url = esc_url( 'https://img.youtube.com/vi/' . rawurlencode( $video_id ) . '/mqdefault.jpg' );
		}
		?>
		<div class="woocommerce-product-gallery__image saai-video-thumb"
			data-video-type="<?php echo esc_attr( $type ); ?>"
			data-video-id="<?php echo esc_attr( $video_id ); ?>"
			data-video-url="<?php echo esc_url( $url ); ?>"
			data-video-style="<?php echo esc_attr( $style ); ?>"
			data-attachment-id="<?php echo absint( $attach_id ); ?>">
			<a href="<?php echo $thumb_url ? esc_url( $thumb_url ) : '#'; ?>"
				class="saai-video-thumb__link"
				aria-label="<?php echo $title; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- already esc_attr() above ?>">
				<?php if ( $thumb_url ) : ?>
					<img src="<?php echo esc_url( $thumb_url ); ?>"
						alt="<?php echo $title; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- already esc_attr() above ?>"
						class="saai-video-thumb__img" />
				<?php else : ?>
					<div class="saai-video-thumb__no-thumb"></div>
				<?php endif; ?>
				<span class="saai-video-thumb__play-icon" aria-hidden="true">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" focusable="false">
						<circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.55)"/>
						<polygon points="9.5,7 18,12 9.5,17" fill="#ffffff"/>
					</svg>
				</span>
			</a>
		</div>
		<?php
	}

	/**
	 * Render the standalone video section below the product summary.
	 *
	 * Only outputs when the effective display style is 'standalone'.
	 */
	public function render_standalone_section() {
		global $product;

		if ( ! $product instanceof \WC_Product ) {
			return;
		}

		if ( 'standalone' !== Meta::get_display_style( $product->get_id() ) ) {
			return;
		}

		$videos = Meta::get_videos( $product->get_id() );
		if ( empty( $videos ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped inside get_standalone_html()
		echo $this->get_standalone_html( $videos );
	}

	/**
	 * Shortcode handler: [saai_product_videos id="123"]
	 *
	 * When used without an `id` attribute, falls back to the current product in the loop.
	 *
	 * @param array|string $atts Shortcode attributes.
	 * @return string Rendered HTML or empty string.
	 */
	public function shortcode_handler( $atts ) {
		$atts       = shortcode_atts( array( 'id' => 0 ), $atts, 'saai_product_videos' );
		$product_id = absint( $atts['id'] );

		if ( ! $product_id ) {
			global $product;
			if ( $product instanceof \WC_Product ) {
				$product_id = $product->get_id();
			}
		}

		if ( ! $product_id ) {
			return '';
		}

		$videos = Meta::get_videos( $product_id );
		if ( empty( $videos ) ) {
			return '';
		}

		return $this->get_standalone_html( $videos );
	}

	/**
	 * Build the standalone video section HTML.
	 *
	 * All output is escaped via esc_url() / esc_attr() / esc_html().
	 *
	 * @param array $videos Video data array.
	 * @return string Escaped HTML markup.
	 */
	private function get_standalone_html( array $videos ): string {
		usort(
			$videos,
			static function ( $a, $b ) {
				return ( (int) ( $a['gallery_order'] ?? 1 ) ) - ( (int) ( $b['gallery_order'] ?? 1 ) );
			}
		);

		ob_start();
		?>
		<div class="saai-product-videos saai-product-videos--standalone">
			<?php foreach ( $videos as $video ) : ?>
				<div class="saai-product-videos__item">
					<?php if ( 'wp_media' === ( $video['type'] ?? '' ) ) : ?>
						<video class="saai-product-videos__player"
							src="<?php echo esc_url( $video['url'] ?? '' ); ?>"
							controls
							preload="metadata">
						</video>
					<?php else : ?>
						<?php $embed_url = $this->get_embed_url( $video ); ?>
						<?php if ( $embed_url ) : ?>
							<div class="saai-product-videos__iframe-wrap">
								<iframe src="<?php echo esc_url( $embed_url ); ?>"
										title="<?php echo esc_attr( $video['title'] ?? '' ); ?>"
										frameborder="0"
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowfullscreen>
								</iframe>
							</div>
						<?php endif; ?>
					<?php endif; ?>
					<?php if ( ! empty( $video['title'] ) ) : ?>
						<p class="saai-product-videos__title"><?php echo esc_html( $video['title'] ); ?></p>
					<?php endif; ?>
				</div>
			<?php endforeach; ?>
		</div>
		<?php
		return (string) ob_get_clean();
	}

	/**
	 * Return the embed URL for a YouTube or Vimeo video.
	 *
	 * @param array $video Video data.
	 * @return string Embed URL, or empty string for wp_media / unknown types.
	 */
	private function get_embed_url( array $video ): string {
		$type     = $video['type'] ?? '';
		$video_id = $video['video_id'] ?? '';

		if ( 'youtube' === $type && $video_id ) {
			return 'https://www.youtube.com/embed/' . rawurlencode( $video_id );
		}

		if ( 'vimeo' === $type && $video_id ) {
			return 'https://player.vimeo.com/video/' . rawurlencode( $video_id );
		}

		return '';
	}
}

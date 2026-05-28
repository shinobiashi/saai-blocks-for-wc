<?php
/**
 * Product Video block server-side render.
 *
 * Variables available in scope:
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content (unused – dynamic block).
 * @var WP_Block $block      Block instance.
 *
 * @package SaaiBlocksForWc
 */

use SaaiBlocksForWc\ProductVideo\Meta;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$product_id = (int) ( $block->context['postId'] ?? 0 );

if ( ! $product_id ) {
	global $product;
	if ( $product instanceof WC_Product ) {
		$product_id = $product->get_id();
	}
}

if ( ! $product_id ) {
	return;
}

$videos = Meta::get_videos( $product_id );
if ( empty( $videos ) ) {
	return;
}

$block_style = isset( $attributes['displayStyle'] ) ? sanitize_key( $attributes['displayStyle'] ) : 'global';
$style       = 'global' === $block_style
	? Meta::get_display_style( $product_id )
	: $block_style;

// For inline/lightbox, videos are injected into the gallery via ClassicTheme hooks.
// The block only renders output in standalone mode to avoid double rendering.
if ( 'standalone' !== $style ) {
	return;
}

usort(
	$videos,
	static function ( $a, $b ) {
		return ( (int) ( $a['gallery_order'] ?? 1 ) ) - ( (int) ( $b['gallery_order'] ?? 1 ) );
	}
);

$wrapper_attrs = get_block_wrapper_attributes(
	array( 'class' => 'saai-product-videos saai-product-videos--standalone' )
);

?>
<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() handles escaping ?>>
	<?php foreach ( $videos as $video ) : ?>
		<div class="saai-product-videos__item">
			<?php if ( 'wp_media' === ( $video['type'] ?? '' ) ) : ?>
				<video class="saai-product-videos__player"
					src="<?php echo esc_url( $video['url'] ?? '' ); ?>"
					controls
					preload="metadata">
				</video>
			<?php else : ?>
				<?php
				$video_id  = $video['video_id'] ?? '';
				$vtype     = $video['type'] ?? '';
				$embed_url = '';

				if ( 'youtube' === $vtype && $video_id ) {
					$embed_url = 'https://www.youtube.com/embed/' . rawurlencode( $video_id );
				} elseif ( 'vimeo' === $vtype && $video_id ) {
					$embed_url = 'https://player.vimeo.com/video/' . rawurlencode( $video_id );
				}
				?>
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

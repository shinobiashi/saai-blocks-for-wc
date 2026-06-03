/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './index.scss';

/* global jQuery */
(function ($) {
	'use strict';

	// --- Helpers ---

	function getEmbedUrl(type, videoId) {
		if ('youtube' === type) {
			return (
				'https://www.youtube.com/embed/' +
				encodeURIComponent(videoId) +
				'?autoplay=1&rel=0'
			);
		}
		if ('vimeo' === type) {
			return (
				'https://player.vimeo.com/video/' +
				encodeURIComponent(videoId) +
				'?autoplay=1'
			);
		}
		return '';
	}

	/**
	 * Create a player element (iframe wrapper or <video>) for a given slide.
	 *
	 * @param {jQuery} $slide - The .saai-video-thumb element.
	 * @return {jQuery|null} Player element, or null when no embed URL is available.
	 */
	function createPlayer($slide) {
		const type = $slide.data('video-type');
		const url = $slide.data('video-url');

		if ('wp_media' === type) {
			return $('<video/>', {
				src: url,
				controls: true,
				autoplay: true,
				class: 'saai-player saai-player--wp-media',
			});
		}

		const videoId = $slide.data('video-id');
		const embedUrl = getEmbedUrl(type, videoId);
		if (!embedUrl) {
			return null;
		}

		const $iframe = $('<iframe/>', {
			src: embedUrl,
			frameborder: 0,
			allow: 'autoplay; encrypted-media; picture-in-picture',
			allowfullscreen: true,
			class: 'saai-player saai-player--iframe',
		});
		return $('<div/>', { class: 'saai-player-wrap' }).append($iframe);
	}

	// --- Inline style ---

	/**
	 * Wire up inline player injection using flexslider's `before` callback.
	 *
	 * @param {jQuery} $gallery - The .woocommerce-product-gallery element.
	 */
	function initInline($gallery) {
		const flexslider = $gallery.data('flexslider');
		if (!flexslider) {
			// Block themes don't load wc-flexslider; fall back to lightbox behavior.
			initLightbox($gallery);
			return;
		}

		// Measure the first non-video slide's height at init time, before any
		// viewport resizing occurs. flexslider updates the viewport height before
		// firing the `before` callback (line 547 < 645 in flexslider source), so
		// querying it inside `before` gives the already-updated (wrong) value.
		const $firstImageSlide = flexslider.slides
			.filter(':not(.saai-video-thumb)')
			.first();
		let imageSlideH = $firstImageSlide.outerHeight() || 0;

		const originalBefore = flexslider.vars.before;

		flexslider.vars.before = function (slider) {
			if (typeof originalBefore === 'function') {
				originalBefore(slider);
			}

			const $current = slider.slides.eq(slider.currentSlide);
			const $next = slider.slides.eq(slider.animatingTo);

			// Keep imageSlideH up to date when leaving a non-video slide.
			if (!$current.hasClass('saai-video-thumb')) {
				imageSlideH = $current.outerHeight() || imageSlideH;
			}

			// Remove player from the slide we're leaving and restore the thumbnail.
			if ($current.hasClass('saai-video-thumb')) {
				$current.find('.saai-player-wrap, .saai-player').remove();
				$current.find('.saai-video-thumb__link').show();
			}

			// Inject player in the slide we're entering, hiding the thumbnail.
			if ($next.hasClass('saai-video-thumb')) {
				$next.find('.saai-video-thumb__link').hide();
				const $player = createPlayer($next);
				if ($player) {
					const nw =
						parseInt($next.data('video-natural-width'), 10) || 0;
					const nh =
						parseInt($next.data('video-natural-height'), 10) || 0;
					const slideW = $next.width() || $gallery.width() || 0;
					const maxH = imageSlideH || slideW;

					if (nw && nh && (slideW || maxH)) {
						// Scale the video to fit within slideW × maxH while preserving
						// aspect ratio. Setting explicit px dimensions immediately
						// prevents the browser's 300×150 default size from being used
						// by flexslider's smoothHeight before metadata loads.
						const scale = Math.min(slideW / nw, maxH / nh);
						const w = Math.round(nw * scale);
						const h = Math.round(nh * scale);
						$player.css({
							display: 'block',
							width: w + 'px',
							height: h + 'px',
							margin: '0 auto',
						});
					} else if (maxH) {
						// Fallback when natural dimensions are unavailable.
						$player.css({
							display: 'block',
							width: 'auto',
							height: 'auto',
							'max-width': '100%',
							'max-height': maxH + 'px',
							margin: '0 auto',
						});
					}
					$next.append($player);
				}
			}
		};
	}

	// --- Lightbox style ---

	let $lightbox = null;

	function buildLightbox() {
		$lightbox = $(
			'<div class="saai-lightbox" aria-hidden="true" role="dialog">' +
				'<div class="saai-lightbox__overlay"></div>' +
				'<div class="saai-lightbox__dialog">' +
				'<button class="saai-lightbox__close" aria-label="' +
				__('Close', 'saai-blocks-for-wc') +
				'">&#x2715;</button>' +
				'<div class="saai-lightbox__player"></div>' +
				'</div>' +
				'</div>'
		);

		$lightbox.on(
			'click',
			'.saai-lightbox__overlay, .saai-lightbox__close',
			closeLightbox
		);

		$(document).on('keydown.saai-lightbox', function (e) {
			if (27 === e.keyCode && $lightbox && !$lightbox.attr('hidden')) {
				closeLightbox();
			}
		});

		$('body').append($lightbox);
	}

	function showLightbox($slide) {
		if (!$lightbox) {
			buildLightbox();
		}

		const $player = createPlayer($slide);
		if (!$player) {
			return;
		}

		$lightbox.find('.saai-lightbox__player').empty().append($player);

		$lightbox.removeAttr('hidden').attr('aria-hidden', 'false');
		$('body').addClass('saai-lightbox-open');
	}

	function closeLightbox() {
		if (!$lightbox) {
			return;
		}
		$lightbox.find('.saai-lightbox__player').empty();
		$lightbox.attr({ hidden: true, 'aria-hidden': 'true' });
		$('body').removeClass('saai-lightbox-open');
	}

	function initLightbox($gallery) {
		$gallery.on(
			'click',
			'.saai-video-thumb .saai-video-thumb__link',
			function (e) {
				e.preventDefault();
				e.stopPropagation();
				showLightbox($(this).closest('.saai-video-thumb'));
			}
		);
	}

	// --- Gallery init ---

	function initGallery($gallery) {
		const $thumbs = $gallery.find('.saai-video-thumb');
		if (!$thumbs.length) {
			return;
		}

		const style = $thumbs.first().data('video-style');

		if ('inline' === style) {
			initInline($gallery);
		} else if ('lightbox' === style) {
			initLightbox($gallery);
		}
	}

	$(function () {
		// Handle galleries already initialized before this script ran.
		// Works with and without flexslider (block themes don't use flexslider).
		$('.woocommerce-product-gallery').each(function () {
			initGallery($(this));
		});
	});

	// Handle galleries initialized after this script ran (standard path).
	// WooCommerce passes the raw DOM element as the first extra argument, not a jQuery object.
	$(document).on('wc-product-gallery-after-init', function (e, gallery) {
		initGallery($(gallery));
	});
})(jQuery);

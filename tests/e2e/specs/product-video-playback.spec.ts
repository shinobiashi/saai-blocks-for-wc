import { test, expect } from '@playwright/test';

const PRODUCT_URL = '/product/hat/';

test.describe( 'Product Video – inline playback flow', () => {
	test( 'clicking video thumbnail in strip shows video player in gallery', async ( { page } ) => {
		await page.goto( PRODUCT_URL );
		await page.waitForLoadState( 'networkidle' );

		// The video slide thumbnail is the last item in the flexslider strip.
		const thumbStrip = page.locator( '.flex-control-thumbs' );
		await expect( thumbStrip ).toBeVisible();

		const thumbItems = thumbStrip.locator( 'li' );
		const thumbCount = await thumbItems.count();
		console.log( 'Thumbnail strip item count:', thumbCount );

		// The video thumbnail is the last one.
		const videoThumbInStrip = thumbItems.last();
		const videoThumbSrc = await videoThumbInStrip.locator( 'img' ).getAttribute( 'src' );
		console.log( 'Video thumbnail src:', videoThumbSrc );

		// Screenshot before clicking.
		await page.locator( '.wp-block-woocommerce-product-image-gallery' ).screenshot( {
			path: 'tests/e2e/screenshots/gallery-before-click.png',
		} );

		// Click the video thumbnail in the strip.
		await videoThumbInStrip.click();
		await page.waitForTimeout( 800 ); // flexslider animation

		// Screenshot after clicking.
		await page.locator( '.wp-block-woocommerce-product-image-gallery' ).screenshot( {
			path: 'tests/e2e/screenshots/gallery-after-click.png',
		} );

		// The video slide should now be the active slide.
		const activeSlide = page.locator( '.woocommerce-product-gallery__image.flex-active-slide' );
		const isVideoSlide = await activeSlide.evaluate( ( el ) => el.classList.contains( 'saai-video-thumb' ) );
		console.log( 'Active slide is video slide:', isVideoSlide );

		// A video player should have been injected into the active slide.
		const videoPlayer = page.locator( '.saai-video-thumb .saai-player--wp-media, .saai-video-thumb .saai-player-wrap' );
		const playerVisible = await videoPlayer.isVisible();
		console.log( 'Video player visible:', playerVisible );

		expect( isVideoSlide ).toBe( true );
		expect( playerVisible ).toBe( true );
	} );
} );

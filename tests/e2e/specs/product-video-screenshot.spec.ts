import { test, expect } from '@playwright/test';

const PRODUCT_URL = '/product/hat/';

test( 'gallery screenshot and data-thumb check', async ( { page } ) => {
	await page.goto( PRODUCT_URL );
	await page.waitForLoadState( 'networkidle' );

	// Screenshot of full gallery area.
	await page.locator( '.wp-block-woocommerce-product-image-gallery' ).screenshot( {
		path: 'tests/e2e/screenshots/gallery-full.png',
	} );

	// Check data-thumb on our video slide (needed for flexslider thumbnail strip).
	const videoThumbDataThumb = await page.locator( '.saai-video-thumb' ).getAttribute( 'data-thumb' );
	console.log( '\n=== .saai-video-thumb[data-thumb] =', videoThumbDataThumb, '===' );

	// Check the thumbnail strip (ol.flex-control-thumbs).
	const thumbStripHtml = await page.locator( '.flex-control-thumbs' ).innerHTML().catch( () => 'NOT FOUND' );
	console.log( '\n=== .flex-control-thumbs ===\n', thumbStripHtml );

	// Check visibility of video thumb from user perspective (in viewport).
	const videoThumb = page.locator( '.saai-video-thumb' );
	const box = await videoThumb.boundingBox();
	console.log( '\n=== .saai-video-thumb bounding box ===\n', box );

	// Is the video thumb in the viewport?
	const viewport = page.viewportSize();
	console.log( '\n=== viewport ===\n', viewport );

	if ( box && viewport ) {
		const inViewport = box.x < viewport.width && box.y < viewport.height && box.x + box.width > 0 && box.y + box.height > 0;
		console.log( '\n=== video thumb in viewport? ===\n', inViewport );
	}

	// Screenshot showing what user sees without scrolling.
	await page.screenshot( { path: 'tests/e2e/screenshots/product-page-viewport.png', fullPage: false } );

	// Screenshot of full page.
	await page.screenshot( { path: 'tests/e2e/screenshots/product-page-full.png', fullPage: true } );
} );

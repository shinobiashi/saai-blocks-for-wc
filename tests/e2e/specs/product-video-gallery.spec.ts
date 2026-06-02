import { test, expect } from '@playwright/test';

const PRODUCT_URL = '/product/hat/';

test.describe( 'Product Video Gallery – ID 31 (hat)', () => {
	test.beforeEach( async ( { page } ) => {
		await page.goto( PRODUCT_URL );
		await page.waitForLoadState( 'networkidle' );
	} );

	test( 'video thumbnail is visible in the gallery', async ( { page } ) => {
		const videoThumb = page.locator( '.saai-video-thumb' );
		await expect( videoThumb ).toBeVisible( { timeout: 10_000 } );
	} );

	test( 'gallery DOM structure', async ( { page } ) => {
		// Dump the full gallery HTML for diagnostic purposes.
		const galleryHtml = await page.locator( '.woocommerce-product-gallery' ).innerHTML().catch( () => 'NOT FOUND' );
		console.log( '\n=== .woocommerce-product-gallery HTML ===\n', galleryHtml.slice( 0, 3000 ) );

		// Also check the block wrapper.
		const blockHtml = await page.locator( '.wp-block-woocommerce-product-image-gallery' ).innerHTML().catch( () => 'NOT FOUND' );
		console.log( '\n=== .wp-block-woocommerce-product-image-gallery HTML ===\n', blockHtml.slice( 0, 3000 ) );

		// Check if saai-video-thumb is anywhere on the page.
		const allVideoThumbs = await page.locator( '.saai-video-thumb' ).count();
		console.log( '\n=== .saai-video-thumb count on page:', allVideoThumbs, '===' );

		// Check what scripts are loaded.
		const scriptSrcs = await page.evaluate( () =>
			Array.from( document.querySelectorAll( 'script[src]' ) )
				.map( s => ( s as HTMLScriptElement ).src )
				.filter( s => s.includes( 'product-video' ) || s.includes( 'saai' ) )
		);
		console.log( '\n=== SAAI scripts loaded ===\n', scriptSrcs );
	} );

	test( 'clicking video thumbnail opens lightbox', async ( { page } ) => {
		const videoThumb = page.locator( '.saai-video-thumb' );
		const thumbVisible = await videoThumb.isVisible().catch( () => false );

		if ( ! thumbVisible ) {
			console.log( 'SKIP: .saai-video-thumb not found on page' );
			test.skip();
			return;
		}

		await videoThumb.locator( '.saai-video-thumb__link' ).click();

		const lightbox = page.locator( '.saai-lightbox' );
		await expect( lightbox ).toBeVisible( { timeout: 5_000 } );

		const player = lightbox.locator( '.saai-lightbox__player video, .saai-lightbox__player iframe' );
		await expect( player ).toBeVisible();
	} );
} );

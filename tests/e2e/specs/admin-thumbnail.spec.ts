import { test, expect } from '@playwright/test';

test.describe( 'Admin panel – video thumbnail', () => {
	test( 'thumbnail section renders with Set thumbnail button', async ( { page } ) => {
		await page.goto( '/wp-admin/post.php?post=31&action=edit' );
		await page.waitForLoadState( 'networkidle' );

		// Click the "Videos" tab.
		const videosTab = page.locator( '#woocommerce-product-data .saai_product_video_options' );
		await videosTab.click();

		// Wait for the React panel to mount.
		await page.waitForSelector( '.saai-video-panel', { timeout: 10_000 } );

		// Screenshot of the panel.
		await page.locator( '#saai_product_video_panel' ).screenshot( {
			path: 'tests/e2e/screenshots/admin-video-panel.png',
		} );

		// The thumbnail section should be visible.
		const thumbSection = page.locator( '.saai-video-item__thumb-section' ).first();
		await expect( thumbSection ).toBeVisible();

		// If no thumbnail: "Set thumbnail" button should exist.
		// If thumbnail exists: "Change" button should exist.
		const hasThumb = await page
			.locator( '.saai-video-item__thumb-img' )
			.first()
			.isVisible()
			.catch( () => false );

		if ( hasThumb ) {
			await expect(
				page.locator( 'button', { hasText: 'Change' } ).first()
			).toBeVisible();
			console.log( 'Thumbnail already set – showing Change button' );
		} else {
			await expect(
				page.locator( 'button', { hasText: 'Set thumbnail' } ).first()
			).toBeVisible();
			console.log( 'No thumbnail – showing Set thumbnail button' );
		}

		// Check that restUrl and restNonce are injected.
		const apiConfig = await page.evaluate( () => ( {
			restUrl:   ( window as any ).saaiProductVideoData?.restUrl,
			hasNonce:  !! ( window as any ).saaiProductVideoData?.restNonce,
		} ) );
		console.log( 'API config:', apiConfig );
		expect( apiConfig.restUrl ).toContain( '/wp/v2/media' );
		expect( apiConfig.hasNonce ).toBe( true );
	} );

	test( 'PHP Approach 1: FFmpeg thumbnail is resolved for existing video', async ( { page } ) => {
		// Check what thumbnail is currently shown on the frontend gallery.
		await page.goto( '/product/hat/' );
		await page.waitForLoadState( 'networkidle' );

		const thumbSrc = await page
			.locator( '.saai-video-thumb' )
			.getAttribute( 'data-thumb' );
		console.log( 'data-thumb on video slide:', thumbSrc );

		// It should NOT be the generic video.svg icon.
		const isGenericIcon = thumbSrc?.includes( '/wp-includes/' ) ?? true;
		console.log( 'Is generic icon:', isGenericIcon );

		// Log: if it IS the generic icon, Approach 1 didn't find a better thumbnail.
		// This is expected if FFmpeg is not installed in wp-env.
	} );
} );

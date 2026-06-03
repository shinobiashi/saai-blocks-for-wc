import { test } from '@playwright/test';

test( 'admin video panel screenshot', async ( { page } ) => {
	await page.goto( '/wp-admin/post.php?post=31&action=edit' );
	await page.waitForLoadState( 'networkidle' );

	// Click the Videos tab
	await page.locator( '#woocommerce-product-data .saai_product_video_options a' ).click();
	await page.waitForSelector( '.saai-video-panel', { timeout: 10_000 } );
	await page.waitForTimeout( 500 );

	// Full panel screenshot
	await page.locator( '#saai_product_video_panel' ).screenshot( {
		path: 'tests/e2e/screenshots/admin-panel-current.png',
	} );
} );

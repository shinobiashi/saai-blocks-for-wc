import { test } from '@playwright/test';
test( 'check title label DOM', async ( { page } ) => {
    await page.goto( '/wp-admin/post.php?post=31&action=edit' );
    await page.waitForLoadState( 'networkidle' );
    await page.locator( '#woocommerce-product-data .saai_product_video_options a' ).click();
    await page.waitForSelector( '.saai-video-panel', { timeout: 10_000 } );
    await page.waitForTimeout( 300 );

    const bodyHTML = await page.locator( '.saai-video-item__body' ).first().innerHTML();
    console.log( bodyHTML.replace( /\s+/g, ' ' ).slice( 0, 1200 ) );

    // ラベルの可視性チェック
    const labels = await page.locator( '.saai-video-item__body label' ).allTextContents();
    console.log( 'Labels:', labels );
} );

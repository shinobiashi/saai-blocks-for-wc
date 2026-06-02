import { test } from '@playwright/test';
test( 'measure init heights', async ( { page } ) => {
    await page.goto( '/product/hat/' );
    await page.waitForLoadState( 'networkidle' );
    const r = await page.evaluate( () => {
        const vp = document.querySelector( '.flex-viewport' );
        const videoSlide = document.querySelector( '.saai-video-thumb' );
        const imgSlide   = document.querySelector( '.woocommerce-product-gallery__image:not(.saai-video-thumb)' );
        const img        = document.querySelector( '.saai-video-thumb__img' ) as HTMLImageElement | null;
        const rect = (el: Element | null) => el ? { w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) } : null;
        return {
            flexViewport:    rect(vp),
            vpInlineH:      (vp as HTMLElement)?.style.height,
            videoSlide:      rect(videoSlide),
            imgSlide:        rect(imgSlide),
            svgImg:          rect(img),
            svgNatural:      img ? { w: img.naturalWidth, h: img.naturalHeight } : null,
            svgCurrentSrc:   img?.currentSrc,
        };
    });
    console.log('\n=== INIT (before any click) ===\n', JSON.stringify(r, null, 2));
});

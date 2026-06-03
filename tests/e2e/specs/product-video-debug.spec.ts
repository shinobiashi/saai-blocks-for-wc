import { test, expect } from '@playwright/test';

const PRODUCT_URL = '/product/hat/';

test('JS timing and flexslider init debug', async ({ page }) => {
	// Capture console logs from the page.
	const logs: string[] = [];
	page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));

	await page.goto(PRODUCT_URL);
	await page.waitForLoadState('networkidle');

	// Check all scripts loaded.
	const allScripts = await page.evaluate(() =>
		Array.from(document.querySelectorAll('script[src]')).map(
			(s) => (s as HTMLScriptElement).src
		)
	);
	const relevantScripts = allScripts.filter(
		(s) =>
			s.includes('wc-single-product') ||
			s.includes('flexslider') ||
			s.includes('saai') ||
			s.includes('photoswipe')
	);
	console.log('\n=== Relevant scripts loaded ===\n', relevantScripts);

	// Check if flexslider is initialized on gallery at this point.
	const flexsliderReady = await page.evaluate(() => {
		const gallery = document.querySelector('.woocommerce-product-gallery');
		if (!gallery) return 'NO GALLERY';
		const $g = (window as any).jQuery(gallery);
		return $g.data('flexslider')
			? 'FLEXSLIDER INITIALIZED'
			: 'NOT INITIALIZED';
	});
	console.log('\n=== flexslider status ===', flexsliderReady);

	// Check if our before callback was attached (indirect: check if gallery has been touched by initInline).
	const beforeCallbackAttached = await page.evaluate(() => {
		const gallery = document.querySelector('.woocommerce-product-gallery');
		if (!gallery) return false;
		const $g = (window as any).jQuery(gallery);
		const fs = $g.data('flexslider');
		if (!fs) return false;
		// Check if vars.before is a function (WooCommerce may also set one).
		return typeof fs.vars.before === 'function'
			? fs.vars.before.toString().slice(0, 100)
			: false;
	});
	console.log('\n=== flexslider.vars.before ===\n', beforeCallbackAttached);

	// Check wc-product-gallery-after-init timing.
	const afterInitFired = await page.evaluate(() => {
		return (window as any)._saai_gallery_after_init_fired ?? 'not tracked';
	});
	console.log(
		'\n=== wc-product-gallery-after-init fired ===',
		afterInitFired
	);

	// Click the video thumbnail in the strip.
	const thumbStrip = page.locator('.flex-control-thumbs');
	const lastThumb = thumbStrip.locator('li').last();
	await lastThumb.click();
	await page.waitForTimeout(1000);

	// Screenshot after click.
	await page
		.locator('.wp-block-woocommerce-product-image-gallery')
		.screenshot({
			path: 'tests/e2e/screenshots/gallery-after-click-debug.png',
		});

	// Check active slide and player.
	const afterClickState = await page.evaluate(() => {
		const activeSlide = document.querySelector(
			'.woocommerce-product-gallery__image.flex-active-slide'
		);
		const player = document.querySelector(
			'.saai-player, .saai-player-wrap'
		);
		return {
			activeSlideClasses: activeSlide?.className ?? 'none',
			playerFound: !!player,
			playerHTML: player?.outerHTML?.slice(0, 200) ?? 'none',
		};
	});
	console.log('\n=== After click state ===\n', afterClickState);

	console.log('\n=== Console logs from page ===\n', logs.join('\n'));
});

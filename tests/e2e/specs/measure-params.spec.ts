import { test } from '@playwright/test';
test('get wc params and flexslider state', async ({ page }) => {
	await page.goto('/product/hat/');
	await page.waitForLoadState('networkidle');

	const info = await page.evaluate(() => {
		const params = (window as any).wc_single_product_params;
		const gallery = document.querySelector('.woocommerce-product-gallery');
		const fs = gallery
			? (window as any).jQuery(gallery).data('flexslider')
			: null;
		return {
			flexslider_enabled: params?.flexslider_enabled,
			smoothHeight: fs?.vars?.smoothHeight,
			animation: fs?.vars?.animation,
			animationLoop: fs?.vars?.animationLoop,
			flexslider_params: params?.flexslider,
		};
	});
	console.log(
		'\n=== WC params & flexslider ===\n',
		JSON.stringify(info, null, 2)
	);

	// After clicking video thumbnail, check viewport height step by step
	// Intercept the before callback to measure
	await page.evaluate(() => {
		const gallery = document.querySelector('.woocommerce-product-gallery');
		const $ = (window as any).jQuery;
		const fs = $(gallery).data('flexslider');
		const origBefore = fs.vars.before;
		fs.vars.before = function (slider: any) {
			const vpBefore = $(gallery).find('.flex-viewport').height();
			const nextH = slider.slides.eq(slider.animatingTo).outerHeight();
			console.log(
				`[SAAI DEBUG] before() - viewport=${vpBefore}, nextSlide.outerHeight=${nextH}, animatingTo=${slider.animatingTo}`
			);
			origBefore(slider);
			const vpAfterOrig = $(gallery).find('.flex-viewport').height();
			console.log(
				`[SAAI DEBUG] after origBefore - viewport=${vpAfterOrig}`
			);
		};
	});

	const lastThumb = page.locator('.flex-control-thumbs li').last();
	await lastThumb.click();
	await page.waitForTimeout(1200);

	const vpH = await page.evaluate(() => {
		const vp = document.querySelector('.flex-viewport');
		return {
			h: (vp as HTMLElement)?.offsetHeight,
			inline: (vp as HTMLElement)?.style.height,
		};
	});
	console.log('\n=== viewport after click ===', vpH);
});

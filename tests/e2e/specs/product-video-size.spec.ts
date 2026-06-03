import { test } from '@playwright/test';

test('video size diagnosis', async ({ page }) => {
	await page.goto('/product/hat/');
	await page.waitForLoadState('networkidle');

	// サムネイルストリップの最後（動画）をクリック
	const lastThumb = page.locator('.flex-control-thumbs li').last();
	await lastThumb.click();
	await page.waitForTimeout(900);

	// ギャラリーとプレーヤーのサイズを取得
	const sizes = await page.evaluate(() => {
		const gallery = document.querySelector('.woocommerce-product-gallery');
		const viewport = document.querySelector('.flex-viewport');
		const wrapper = document.querySelector(
			'.woocommerce-product-gallery__wrapper'
		);
		const activeSlide = document.querySelector(
			'.saai-video-thumb.flex-active-slide'
		);
		const video = document.querySelector(
			'.saai-player--wp-media'
		) as HTMLVideoElement | null;
		const link = document.querySelector(
			'.saai-video-thumb .saai-video-thumb__link'
		) as HTMLElement | null;
		const thumbStrip = document.querySelector('.flex-control-thumbs');
		const blockWrapper = document.querySelector(
			'.wp-block-woocommerce-product-image-gallery'
		);

		const rect = (el: Element | null) => {
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return { w: Math.round(r.width), h: Math.round(r.height) };
		};
		const cs = (el: Element | null, prop: string) =>
			el ? getComputedStyle(el).getPropertyValue(prop) : 'n/a';
		const inlineStyle = (el: Element | null, prop: string) =>
			el ? (el as HTMLElement).style.getPropertyValue(prop) : 'n/a';

		return {
			blockWrapper: rect(blockWrapper),
			gallery: rect(gallery),
			flexViewport: rect(viewport),
			flexViewportH_css: cs(viewport, 'height'),
			flexViewportH_inline: inlineStyle(viewport, 'height'),
			thumbStrip: rect(thumbStrip),
			activeSlide: rect(activeSlide),
			video: rect(video),
			videoNatural: video
				? { w: video.videoWidth, h: video.videoHeight }
				: null,
			videoMaxHeight: cs(video, 'max-height'),
			videoWidth_css: cs(video, 'width'),
			videoHeight_css: cs(video, 'height'),
			slideOverflow: cs(activeSlide, 'overflow'),
		};
	});
	console.log('\n=== Size report ===\n', JSON.stringify(sizes, null, 2));

	// スクリーンショット
	await page
		.locator('.wp-block-woocommerce-product-image-gallery')
		.screenshot({
			path: 'tests/e2e/screenshots/video-size-before.png',
		});
});

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const WooCommerceDependencyExtractionWebpackPlugin = require( '@woocommerce/dependency-extraction-webpack-plugin' );

module.exports = {
	...defaultConfig,
	entry: {
		...( typeof defaultConfig.entry === 'function'
			? defaultConfig.entry()
			: defaultConfig.entry ),
		'saai/admin/overview': './src/saai/admin/overview/index.js',
		'saai/admin/video-settings':
			'./src/saai/admin/video-settings/index.js',
		'saai/admin/product-video-panel':
			'./src/saai/admin/product-video-panel/index.js',
		'frontend/product-video':
			'./src/frontend/product-video/index.js',
	},
	plugins: [
		...defaultConfig.plugins.filter(
			( plugin ) =>
				plugin.constructor.name !== 'DependencyExtractionWebpackPlugin'
		),
		new WooCommerceDependencyExtractionWebpackPlugin(),
	],
};

const wpScriptsConfig = require('@wordpress/scripts/config/eslint.config.cjs');
const wooPlugin = require('@woocommerce/eslint-plugin');

module.exports = [
	// Exclude config, E2E, and test files from plugin source linting.
	{
		ignores: [
			'eslint.config.js',
			'playwright.config.ts',
			'playwright-report/**',
			'test-results/**',
			'tests/**',
		],
	},

	...wpScriptsConfig,

	{
		plugins: {
			'@woocommerce': wooPlugin,
		},
		rules: {
			'@woocommerce/dependency-group': 'error',
			'react/react-in-jsx-scope': 'off',
			// @wordpress/* and @woocommerce/* are runtime externals provided by
			// WordPress/WooCommerce and cannot be resolved from node_modules.
			'import/no-unresolved': 'off',
			'import/no-extraneous-dependencies': 'off',
		},
		settings: {
			jsdoc: { mode: 'typescript' },
		},
	},
];

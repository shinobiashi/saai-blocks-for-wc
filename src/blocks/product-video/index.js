/**
 * External dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import Edit from './edit';
import metadata from './block.json';
import './index.scss';

registerBlockType(metadata.name, {
	edit: Edit,
	save: () => null,
});

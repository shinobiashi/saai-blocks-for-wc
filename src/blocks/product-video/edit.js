import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Placeholder } from '@wordpress/components';
import { video as videoIcon } from '@wordpress/icons';

const STYLE_OPTIONS = [
	{
		value: 'global',
		label: __( 'Use per-product setting', 'saai-blocks-for-wc' ),
	},
	{
		value: 'inline',
		label: __( 'Inline (expand in gallery)', 'saai-blocks-for-wc' ),
	},
	{
		value: 'lightbox',
		label: __( 'Lightbox (modal overlay)', 'saai-blocks-for-wc' ),
	},
	{
		value: 'standalone',
		label: __( 'Standalone (at block location)', 'saai-blocks-for-wc' ),
	},
];

export default function Edit( { attributes, setAttributes } ) {
	const { displayStyle } = attributes;
	const blockProps = useBlockProps();

	const currentLabel =
		STYLE_OPTIONS.find( ( o ) => o.value === displayStyle )?.label ?? displayStyle;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Video settings', 'saai-blocks-for-wc' ) }>
					<SelectControl
						label={ __( 'Display style', 'saai-blocks-for-wc' ) }
						value={ displayStyle }
						options={ STYLE_OPTIONS }
						onChange={ ( value ) =>
							setAttributes( { displayStyle: value } )
						}
						help={ __(
							'Overrides the per-product setting when set to anything other than "Use per-product setting".',
							'saai-blocks-for-wc'
						) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<Placeholder
					icon={ videoIcon }
					label={ __( 'Product Video', 'saai-blocks-for-wc' ) }
					instructions={ __(
						'Product videos are rendered here on the frontend based on the display style.',
						'saai-blocks-for-wc'
					) }
				>
					<p className="saai-product-video-block__style-note">
						{ __( 'Display style:', 'saai-blocks-for-wc' ) }{ ' ' }
						<strong>{ currentLabel }</strong>
					</p>
				</Placeholder>
			</div>
		</>
	);
}

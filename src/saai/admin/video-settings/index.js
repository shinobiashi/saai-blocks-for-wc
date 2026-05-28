import { __, sprintf } from '@wordpress/i18n';
import { render, useState, useEffect } from '@wordpress/element';
import {
	Button,
	Notice,
	SelectControl,
	Spinner,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

import './index.scss';

const OPTION_KEY = 'saai_blocks_for_wc_video_display_style';

const STYLE_OPTIONS = [
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
		label: __(
			'Standalone (below gallery / shortcode)',
			'saai-blocks-for-wc'
		),
	},
];

const VideoSettingsPage = () => {
	const [ displayStyle, setDisplayStyle ] = useState( 'inline' );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ notice, setNotice ] = useState( null );

	useEffect( () => {
		apiFetch( { path: '/wp/v2/settings' } )
			.then( ( settings ) => {
				const value = settings[ OPTION_KEY ];
				if ( value ) {
					setDisplayStyle( value );
				}
			} )
			.catch( () => {
				setNotice( {
					status: 'error',
					message: __(
						'Failed to load settings.',
						'saai-blocks-for-wc'
					),
				} );
			} )
			.finally( () => setIsLoading( false ) );
	}, [] );

	const handleSave = () => {
		setIsSaving( true );
		setNotice( null );

		apiFetch( {
			path: '/wp/v2/settings',
			method: 'POST',
			data: { [ OPTION_KEY ]: displayStyle },
		} )
			.then( () => {
				setNotice( {
					status: 'success',
					message: __(
						'Settings saved.',
						'saai-blocks-for-wc'
					),
				} );
			} )
			.catch( ( error ) => {
				setNotice( {
					status: 'error',
					message: sprintf(
						/* translators: %s: error message */
						__( 'Save failed: %s', 'saai-blocks-for-wc' ),
						error?.message ?? __( 'Unknown error', 'saai-blocks-for-wc' )
					),
				} );
			} )
			.finally( () => setIsSaving( false ) );
	};

	return (
		<div className="saai-admin-layout">
			<div className="saai-admin__header">
				<div className="saai-admin__header-wrapper">
					<h1>
						{ __(
							'Video Gallery Settings',
							'saai-blocks-for-wc'
						) }
					</h1>
				</div>
			</div>

			<div className="saai-admin__content">
				{ isLoading ? (
					<Spinner />
				) : (
					<div className="saai-settings-form">
						{ notice && (
							<Notice
								status={ notice.status }
								isDismissible
								onRemove={ () => setNotice( null ) }
							>
								{ notice.message }
							</Notice>
						) }

						<div className="saai-settings-form__field">
							<SelectControl
								label={ __(
									'Default video display style',
									'saai-blocks-for-wc'
								) }
								help={ __(
									'Products with no individual style set will use this default.',
									'saai-blocks-for-wc'
								) }
								value={ displayStyle }
								options={ STYLE_OPTIONS }
								onChange={ setDisplayStyle }
							/>
						</div>

						<div className="saai-settings-form__actions">
							<Button
								variant="primary"
								isBusy={ isSaving }
								disabled={ isSaving }
								onClick={ handleSave }
							>
								{ __( 'Save settings', 'saai-blocks-for-wc' ) }
							</Button>
						</div>
					</div>
				) }
			</div>
		</div>
	);
};

document.addEventListener( 'DOMContentLoaded', () => {
	const root = document.querySelector(
		'#root-saai-blocks-for-wc-settings'
	);
	if ( root ) {
		render( <VideoSettingsPage />, root );
	}
} );

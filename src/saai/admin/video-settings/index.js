import { __ } from '@wordpress/i18n';
import { render } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

// Placeholder — Phase 1.3 implementation.
const VideoSettingsPage = () => {
	return (
		<div className="saai-admin-layout">
			<div className="saai-admin__header">
				<div className="saai-admin__header-wrapper">
					<h1>{ __( 'WC Blocks Settings', 'saai-blocks-for-wc' ) }</h1>
				</div>
			</div>
			<div className="saai-admin__content">
				<Spinner />
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

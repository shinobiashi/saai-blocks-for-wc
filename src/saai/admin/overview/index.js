import './index.scss';
import { __ } from '@wordpress/i18n';
import { render } from '@wordpress/element';

const SaaiOverviewPage = () => {
	return (
		<div className="saai-admin-layout">
			<div className="saai-admin__header">
				<div className="saai-admin__header-wrapper">
					<h1>{ __( 'SAAI Overview', 'saai-blocks-for-wc' ) }</h1>
				</div>
			</div>
			<div className="saai-admin-overview__content">
				<p>
					{ __(
						'This plugin is developed by Shinobiashi INC., a Woo Agency.',
						'saai-blocks-for-wc'
					) }
				</p>
				{ window.saaiBlocksData?.wooPartnerLogoUrl && (
					<a
						href="https://woocommerce.com/development-services/shinobiashi-inc/233150772/"
						target="_blank"
						rel="noreferrer"
					>
						<img
							src={ window.saaiBlocksData.wooPartnerLogoUrl }
							alt={ __( 'Woo Partner Logo', 'saai-blocks-for-wc' ) }
							className="saai-woo-partner-logo"
						/>
					</a>
				) }
			</div>
		</div>
	);
};

document.addEventListener( 'DOMContentLoaded', () => {
	const root = document.querySelector( '#root' );
	if ( root ) {
		render( <SaaiOverviewPage />, root );
	}
} );

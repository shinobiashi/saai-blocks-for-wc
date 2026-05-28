import './index.scss';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import {
	Button,
	SelectControl,
	TextControl,
	Card,
	CardBody,
	CardHeader,
	Flex,
	FlexItem,
	FlexBlock,
} from '@wordpress/components';

const {
	videos: initialVideos = [],
	displayStyle: initialDisplayStyle = '',
	maxVideos = 3,
} = window.saaiProductVideoData || {};

// ---- Helpers ----------------------------------------------------------------

function generateId() {
	return ( [ 1e7 ] + -1e3 + -4e3 + -8e3 + -1e11 ).replace( /[018]/g, ( c ) =>
		(
			c ^
			( crypto.getRandomValues( new Uint8Array( 1 ) )[ 0 ] &
				( 15 >> ( c / 4 ) ) )
		).toString( 16 )
	);
}

function extractVideoId( type, url ) {
	if ( ! url ) return '';
	if ( type === 'youtube' ) {
		const m = url.match(
			/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
		);
		return m ? m[ 1 ] : '';
	}
	if ( type === 'vimeo' ) {
		const m = url.match( /vimeo\.com\/(?:video\/)?(\d+)/ );
		return m ? m[ 1 ] : '';
	}
	return '';
}

function getYoutubeThumbnail( videoId ) {
	return videoId
		? `https://img.youtube.com/vi/${ videoId }/mqdefault.jpg`
		: '';
}

function emptyVideo( order ) {
	return {
		id: generateId(),
		type: 'youtube',
		url: '',
		video_id: '',
		attachment_id: 0,
		thumbnail_url: '',
		title: '',
		gallery_order: order,
	};
}

// ---- VideoItem --------------------------------------------------------------

function VideoItem( {
	video,
	index,
	onUpdate,
	onRemove,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
	isDragTarget,
} ) {
	const handleTypeChange = ( type ) => {
		onUpdate( index, {
			type,
			url: '',
			video_id: '',
			thumbnail_url: '',
			attachment_id: 0,
		} );
	};

	const handleUrlChange = ( url ) => {
		const videoId = extractVideoId( video.type, url );
		onUpdate( index, {
			url,
			video_id: videoId,
			thumbnail_url:
				video.type === 'youtube' ? getYoutubeThumbnail( videoId ) : '',
		} );
	};

	const openMediaLibrary = () => {
		if ( ! window.wp?.media ) return;
		const frame = window.wp.media( {
			title: __( 'Select Video', 'saai-blocks-for-wc' ),
			button: { text: __( 'Use this video', 'saai-blocks-for-wc' ) },
			library: { type: 'video' },
			multiple: false,
		} );
		frame.on( 'select', () => {
			const att = frame.state().get( 'selection' ).first().toJSON();
			onUpdate( index, {
				url: att.url,
				attachment_id: att.id,
				thumbnail_url: att.image?.src || '',
				title: att.title || '',
				video_id: '',
			} );
		} );
		frame.open();
	};

	return (
		<Card
			className={ `saai-video-item${ isDragTarget ? ' is-drag-target' : '' }` }
			draggable
			onDragStart={ ( e ) => {
				e.dataTransfer.effectAllowed = 'move';
				onDragStart( index );
			} }
			onDragOver={ ( e ) => {
				e.preventDefault();
				onDragOver( index );
			} }
			onDrop={ ( e ) => {
				e.preventDefault();
				onDrop( index );
			} }
			onDragEnd={ onDragEnd }
		>
			<CardHeader>
				<Flex align="center">
					<FlexItem>
						<span
							className="saai-video-item__handle"
							aria-hidden="true"
						>
							⠿
						</span>
					</FlexItem>
					<FlexBlock>
						<strong>
							{ __( 'Video', 'saai-blocks-for-wc' ) }{ ' ' }
							{ video.gallery_order }
						</strong>
					</FlexBlock>
					<FlexItem>
						<Button
							variant="tertiary"
							isDestructive
							onClick={ () => onRemove( index ) }
						>
							{ __( 'Remove', 'saai-blocks-for-wc' ) }
						</Button>
					</FlexItem>
				</Flex>
			</CardHeader>

			<CardBody>
				<SelectControl
					label={ __( 'Video source', 'saai-blocks-for-wc' ) }
					value={ video.type }
					options={ [
						{ value: 'youtube', label: 'YouTube' },
						{ value: 'vimeo', label: 'Vimeo' },
						{
							value: 'wp_media',
							label: __( 'WordPress Media', 'saai-blocks-for-wc' ),
						},
					] }
					onChange={ handleTypeChange }
				/>

				{ video.type !== 'wp_media' ? (
					<TextControl
						label={ __( 'Video URL', 'saai-blocks-for-wc' ) }
						value={ video.url }
						placeholder={
							video.type === 'youtube'
								? 'https://www.youtube.com/watch?v=...'
								: 'https://vimeo.com/...'
						}
						onChange={ handleUrlChange }
					/>
				) : (
					<div className="saai-video-item__media-row">
						{ video.url && (
							<p className="saai-video-item__media-url description">
								{ video.url }
							</p>
						) }
						<Button variant="secondary" onClick={ openMediaLibrary }>
							{ video.url
								? __( 'Change Video', 'saai-blocks-for-wc' )
								: __( 'Select Video', 'saai-blocks-for-wc' ) }
						</Button>
					</div>
				) }

				<TextControl
					label={ __( 'Title (optional)', 'saai-blocks-for-wc' ) }
					value={ video.title }
					onChange={ ( title ) => onUpdate( index, { title } ) }
				/>

				{ video.thumbnail_url && (
					<div className="saai-video-item__thumbnail-wrap">
						<img
							src={ video.thumbnail_url }
							alt={
								video.title ||
								__( 'Video thumbnail', 'saai-blocks-for-wc' )
							}
							className="saai-video-item__thumbnail"
							width="160"
						/>
					</div>
				) }
			</CardBody>
		</Card>
	);
}

// ---- VideoPanel (main) ------------------------------------------------------

function VideoPanel() {
	const [ videos, setVideos ] = useState( initialVideos );
	const [ displayStyle, setDisplayStyle ] = useState( initialDisplayStyle );
	const [ dragTarget, setDragTarget ] = useState( null );
	const dragFrom = useRef( null );

	// Keep hidden inputs in sync so PHP can read them on form submit.
	useEffect( () => {
		const vi = document.getElementById( 'saai-videos-data' );
		const si = document.getElementById( 'saai-display-style-data' );
		if ( vi ) vi.value = JSON.stringify( videos );
		if ( si ) si.value = displayStyle;
	}, [ videos, displayStyle ] );

	const addVideo = () => {
		if ( videos.length >= maxVideos ) return;
		setVideos( ( prev ) => [ ...prev, emptyVideo( prev.length + 1 ) ] );
	};

	const removeVideo = ( index ) => {
		setVideos( ( prev ) =>
			prev
				.filter( ( _, i ) => i !== index )
				.map( ( v, i ) => ( { ...v, gallery_order: i + 1 } ) )
		);
	};

	const updateVideo = ( index, updates ) => {
		setVideos( ( prev ) =>
			prev.map( ( v, i ) => ( i === index ? { ...v, ...updates } : v ) )
		);
	};

	const handleDragStart = ( index ) => {
		dragFrom.current = index;
	};

	const handleDragOver = ( index ) => {
		setDragTarget( index );
	};

	const handleDrop = ( targetIndex ) => {
		const from = dragFrom.current;
		if ( from === null || from === targetIndex ) {
			setDragTarget( null );
			return;
		}
		setVideos( ( prev ) => {
			const next = [ ...prev ];
			const [ item ] = next.splice( from, 1 );
			next.splice( targetIndex, 0, item );
			return next.map( ( v, i ) => ( { ...v, gallery_order: i + 1 } ) );
		} );
		dragFrom.current = null;
		setDragTarget( null );
	};

	const handleDragEnd = () => {
		dragFrom.current = null;
		setDragTarget( null );
	};

	return (
		<div className="saai-video-panel">
			<div className="saai-video-list">
				{ videos.map( ( video, index ) => (
					<VideoItem
						key={ video.id }
						video={ video }
						index={ index }
						onUpdate={ updateVideo }
						onRemove={ removeVideo }
						onDragStart={ handleDragStart }
						onDragOver={ handleDragOver }
						onDrop={ handleDrop }
						onDragEnd={ handleDragEnd }
						isDragTarget={ dragTarget === index }
					/>
				) ) }
			</div>

			{ videos.length < maxVideos && (
				<Button
					variant="secondary"
					className="saai-video-panel__add-btn"
					onClick={ addVideo }
				>
					{ __( '+ Add Video', 'saai-blocks-for-wc' ) }
				</Button>
			) }

			<div className="saai-video-panel__style-selector">
				<SelectControl
					label={ __( 'Display style', 'saai-blocks-for-wc' ) }
					help={ __(
						'Leave empty to use the global default (SAAI → WC Blocks settings).',
						'saai-blocks-for-wc'
					) }
					value={ displayStyle }
					options={ [
						{
							value: '',
							label: __( '— Use global setting —', 'saai-blocks-for-wc' ),
						},
						{
							value: 'inline',
							label: __( 'Inline (in gallery)', 'saai-blocks-for-wc' ),
						},
						{
							value: 'lightbox',
							label: __( 'Lightbox', 'saai-blocks-for-wc' ),
						},
						{
							value: 'standalone',
							label: __( 'Standalone section', 'saai-blocks-for-wc' ),
						},
					] }
					onChange={ setDisplayStyle }
				/>
			</div>
		</div>
	);
}

// ---- Mount ------------------------------------------------------------------

document.addEventListener( 'DOMContentLoaded', () => {
	const root = document.getElementById( 'saai-product-video-root' );
	if ( root ) {
		const { render } = window.wp.element;
		render( <VideoPanel />, root );
	}
} );

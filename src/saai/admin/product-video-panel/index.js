/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import {
	Button,
	SelectControl,
	TextControl,
	Spinner,
	Card,
	CardBody,
	CardHeader,
	Flex,
	FlexItem,
	FlexBlock,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './index.scss';

const {
	videos: initialVideos = [],
	displayStyle: initialDisplayStyle = '',
	maxVideos = 3,
	restUrl = '',
	restNonce = '',
} = window.saaiProductVideoData || {};

// ---- Helpers ----------------------------------------------------------------

function generateId() {
	return crypto.randomUUID();
}

function extractVideoId(type, url) {
	if (!url) {
		return '';
	}
	if (type === 'youtube') {
		const m = url.match(
			/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
		);
		return m ? m[1] : '';
	}
	if (type === 'vimeo') {
		const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
		return m ? m[1] : '';
	}
	return '';
}

function getYoutubeThumbnail(videoId) {
	return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
}

/**
 * Return just the filename part of a URL.
 *
 * @param {string} url - Full URL string.
 * @return {string} Decoded filename component.
 */
function basename(url) {
	return url ? decodeURIComponent(url.split('/').pop() || url) : '';
}

function emptyVideo(order) {
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

/**
 * Approach 3: Capture the first frame of a same-origin video using Canvas API,
 * upload it to the WP media library, and return the image URL.
 *
 * Resolves null on any error (CORS, canvas taint, upload failure, etc.).
 *
 * @param {string} videoUrl - URL of the video to capture.
 * @param {string} fileName - Base name for the generated image file.
 * @return {Promise<string|null>} URL of the uploaded thumbnail image, or null on failure.
 */
async function captureFirstFrame(videoUrl, fileName) {
	if (!restUrl || !restNonce) {
		return null;
	}

	return new Promise((resolve) => {
		const video = document.createElement('video');
		video.crossOrigin = 'anonymous';
		video.muted = true;
		video.preload = 'metadata';
		video.src = videoUrl;

		const done = (result) => {
			video.src = '';
			resolve(result);
		};

		video.addEventListener(
			'loadeddata',
			() => {
				video.currentTime = 0.1;
			},
			{ once: true }
		);

		video.addEventListener(
			'seeked',
			async () => {
				try {
					const canvas = document.createElement('canvas');
					canvas.width = video.videoWidth || 1280;
					canvas.height = video.videoHeight || 720;
					canvas.getContext('2d').drawImage(video, 0, 0);

					canvas.toBlob(
						async (blob) => {
							if (!blob) {
								done(null);
								return;
							}
							const baseName = (fileName || 'video').replace(
								/[^a-zA-Z0-9_-]/g,
								'-'
							);
							const form = new FormData();
							form.append(
								'file',
								blob,
								`${baseName}-thumbnail.jpg`
							);

							try {
								const res = await fetch(restUrl, {
									method: 'POST',
									headers: { 'X-WP-Nonce': restNonce },
									body: form,
								});
								if (!res.ok) {
									done(null);
									return;
								}
								const data = await res.json();
								done(data.source_url || null);
							} catch {
								done(null);
							}
						},
						'image/jpeg',
						0.85
					);
				} catch {
					done(null);
				}
			},
			{ once: true }
		);

		video.addEventListener('error', () => done(null));
	});
}

// ---- VideoItem --------------------------------------------------------------

function VideoItem({
	video,
	index,
	onUpdate,
	onRemove,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
	isDragTarget,
}) {
	const [isCapturing, setIsCapturing] = useState(false);

	const handleTypeChange = (type) => {
		onUpdate(index, {
			type,
			url: '',
			video_id: '',
			thumbnail_url: '',
			attachment_id: 0,
		});
	};

	const handleUrlChange = (url) => {
		const videoId = extractVideoId(video.type, url);
		onUpdate(index, {
			url,
			video_id: videoId,
			thumbnail_url:
				video.type === 'youtube' ? getYoutubeThumbnail(videoId) : '',
		});
	};

	const openMediaLibrary = () => {
		if (!window.wp?.media) {
			return;
		}
		const frame = window.wp.media({
			title: __('Select Video', 'saai-blocks-for-wc'),
			button: { text: __('Use this video', 'saai-blocks-for-wc') },
			library: { type: 'video' },
			multiple: false,
		});

		frame.on('select', async () => {
			const att = frame.state().get('selection').first().toJSON();

			onUpdate(index, {
				url: att.url,
				attachment_id: att.id,
				thumbnail_url: '',
				title: att.title || '',
				video_id: '',
			});

			// Approach 1: WordPress-generated thumbnail (FFmpeg / poster frame).
			const wpThumbnail =
				att.image?.src && !att.image.src.includes('/wp-includes/')
					? att.image.src
					: '';

			if (wpThumbnail) {
				onUpdate(index, { thumbnail_url: wpThumbnail });
				return;
			}

			// Approach 3: Client-side first-frame capture.
			setIsCapturing(true);
			const captured = await captureFirstFrame(
				att.url,
				att.title || att.filename || 'video'
			);
			setIsCapturing(false);

			if (captured) {
				onUpdate(index, { thumbnail_url: captured });
			}
		});

		frame.open();
	};

	// Approach 2: Manually select a thumbnail image from the media library.
	const openThumbnailLibrary = () => {
		if (!window.wp?.media) {
			return;
		}
		const frame = window.wp.media({
			title: __('Select Thumbnail Image', 'saai-blocks-for-wc'),
			button: { text: __('Use this image', 'saai-blocks-for-wc') },
			library: { type: 'image' },
			multiple: false,
		});
		frame.on('select', () => {
			const att = frame.state().get('selection').first().toJSON();
			onUpdate(index, { thumbnail_url: att.url });
		});
		frame.open();
	};

	return (
		<Card
			className={`saai-video-item${
				isDragTarget ? ' is-drag-target' : ''
			}`}
			draggable
			onDragStart={(e) => {
				e.dataTransfer.effectAllowed = 'move';
				onDragStart(index);
			}}
			onDragOver={(e) => {
				e.preventDefault();
				onDragOver(index);
			}}
			onDrop={(e) => {
				e.preventDefault();
				onDrop(index);
			}}
			onDragEnd={onDragEnd}
		>
			{/* ---- Header: drag handle + label + remove ---- */}
			<CardHeader className="saai-video-item__header">
				<span
					className="saai-video-item__handle"
					aria-label={__('Drag to reorder', 'saai-blocks-for-wc')}
				>
					⠿
				</span>
				<span className="saai-video-item__title">
					{__('Video', 'saai-blocks-for-wc')} {video.gallery_order}
				</span>
				<Button
					className="saai-video-item__remove"
					variant="tertiary"
					isDestructive
					isSmall
					onClick={() => onRemove(index)}
					aria-label={__('Remove video', 'saai-blocks-for-wc')}
				>
					{__('Remove', 'saai-blocks-for-wc')}
				</Button>
			</CardHeader>

			<CardBody>
				<div className="saai-video-item__body">
					{/* ---- Source type + file/URL row ---- */}
					<div className="saai-video-item__source-row">
						<SelectControl
							label={__('Source', 'saai-blocks-for-wc')}
							value={video.type}
							options={[
								{ value: 'youtube', label: 'YouTube' },
								{ value: 'vimeo', label: 'Vimeo' },
								{
									value: 'wp_media',
									label: __(
										'WordPress Media',
										'saai-blocks-for-wc'
									),
								},
							]}
							onChange={handleTypeChange}
							className="saai-video-item__source-select"
						/>

						{video.type !== 'wp_media' ? (
							<TextControl
								label={__('URL', 'saai-blocks-for-wc')}
								value={video.url}
								placeholder={
									video.type === 'youtube'
										? 'https://www.youtube.com/watch?v=...'
										: 'https://vimeo.com/...'
								}
								onChange={handleUrlChange}
								className="saai-video-item__url-input"
							/>
						) : (
							<div className="saai-video-item__file-field">
								<span className="saai-video-item__field-label">
									{__('File', 'saai-blocks-for-wc')}
								</span>
								<Flex align="center" gap={2}>
									{video.url && (
										<FlexBlock>
											<span
												className="saai-video-item__filename"
												title={video.url}
											>
												{basename(video.url)}
											</span>
										</FlexBlock>
									)}
									<FlexItem>
										<Button
											variant="secondary"
											isSmall
											onClick={openMediaLibrary}
										>
											{video.url
												? __(
														'Change',
														'saai-blocks-for-wc'
												  )
												: __(
														'Select file',
														'saai-blocks-for-wc'
												  )}
										</Button>
									</FlexItem>
								</Flex>
							</div>
						)}
					</div>

					{/* ---- Title ---- */}
					<TextControl
						label={__('Title (optional)', 'saai-blocks-for-wc')}
						value={video.title}
						onChange={(title) => onUpdate(index, { title })}
					/>

					{/* ---- Thumbnail section ---- */}
					<div className="saai-video-item__thumb-section">
						<span className="saai-video-item__field-label">
							{__('Gallery thumbnail', 'saai-blocks-for-wc')}
						</span>

						{isCapturing && (
							<div className="saai-video-item__thumb-capturing">
								<Spinner />
								<span>
									{__(
										'Capturing first frame…',
										'saai-blocks-for-wc'
									)}
								</span>
							</div>
						)}
						{!isCapturing && video.thumbnail_url && (
							<div className="saai-video-item__thumb-preview">
								<img
									src={video.thumbnail_url}
									alt=""
									className="saai-video-item__thumb-img"
								/>
								<div className="saai-video-item__thumb-actions">
									<Button
										variant="secondary"
										isSmall
										onClick={openThumbnailLibrary}
									>
										{__('Change', 'saai-blocks-for-wc')}
									</Button>
									<Button
										variant="link"
										isSmall
										isDestructive
										onClick={() =>
											onUpdate(index, {
												thumbnail_url: '',
											})
										}
									>
										{__('Remove', 'saai-blocks-for-wc')}
									</Button>
								</div>
							</div>
						)}
						{!isCapturing && !video.thumbnail_url && (
							<Button
								variant="secondary"
								isSmall
								onClick={openThumbnailLibrary}
							>
								{__('Set thumbnail', 'saai-blocks-for-wc')}
							</Button>
						)}
					</div>
				</div>
				{/* .saai-video-item__body */}
			</CardBody>
		</Card>
	);
}

// ---- VideoPanel (main) ------------------------------------------------------

function VideoPanel() {
	const [videos, setVideos] = useState(initialVideos);
	const [displayStyle, setDisplayStyle] = useState(initialDisplayStyle);
	const [dragTarget, setDragTarget] = useState(null);
	const dragFrom = useRef(null);

	useEffect(() => {
		const vi = document.getElementById('saai-videos-data');
		const si = document.getElementById('saai-display-style-data');
		if (vi) {
			vi.value = JSON.stringify(videos);
		}
		if (si) {
			si.value = displayStyle;
		}
	}, [videos, displayStyle]);

	const addVideo = () => {
		if (videos.length >= maxVideos) {
			return;
		}
		setVideos((prev) => [...prev, emptyVideo(prev.length + 1)]);
	};

	const removeVideo = (index) => {
		setVideos((prev) =>
			prev
				.filter((_, i) => i !== index)
				.map((v, i) => ({ ...v, gallery_order: i + 1 }))
		);
	};

	const updateVideo = (index, updates) => {
		setVideos((prev) =>
			prev.map((v, i) => (i === index ? { ...v, ...updates } : v))
		);
	};

	const handleDragStart = (index) => {
		dragFrom.current = index;
	};
	const handleDragOver = (index) => {
		setDragTarget(index);
	};
	const handleDragEnd = () => {
		dragFrom.current = null;
		setDragTarget(null);
	};

	const handleDrop = (targetIndex) => {
		const from = dragFrom.current;
		if (from === null || from === targetIndex) {
			setDragTarget(null);
			return;
		}
		setVideos((prev) => {
			const next = [...prev];
			const [item] = next.splice(from, 1);
			next.splice(targetIndex, 0, item);
			return next.map((v, i) => ({ ...v, gallery_order: i + 1 }));
		});
		dragFrom.current = null;
		setDragTarget(null);
	};

	return (
		<div className="saai-video-panel">
			<div className="saai-video-list">
				{videos.map((video, index) => (
					<VideoItem
						key={video.id}
						video={video}
						index={index}
						onUpdate={updateVideo}
						onRemove={removeVideo}
						onDragStart={handleDragStart}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						onDragEnd={handleDragEnd}
						isDragTarget={dragTarget === index}
					/>
				))}
			</div>

			{videos.length < maxVideos && (
				<Button
					variant="secondary"
					className="saai-video-panel__add-btn"
					onClick={addVideo}
				>
					{__('+ Add Video', 'saai-blocks-for-wc')}
				</Button>
			)}

			<div className="saai-video-panel__style-selector">
				<SelectControl
					label={__('Display style', 'saai-blocks-for-wc')}
					help={__(
						'Leave empty to use the global default (SAAI → WC Blocks settings).',
						'saai-blocks-for-wc'
					)}
					value={displayStyle}
					options={[
						{
							value: '',
							label: __(
								'— Use global setting —',
								'saai-blocks-for-wc'
							),
						},
						{
							value: 'inline',
							label: __(
								'Inline (in gallery)',
								'saai-blocks-for-wc'
							),
						},
						{
							value: 'lightbox',
							label: __('Lightbox', 'saai-blocks-for-wc'),
						},
						{
							value: 'standalone',
							label: __(
								'Standalone section',
								'saai-blocks-for-wc'
							),
						},
					]}
					onChange={setDisplayStyle}
				/>
			</div>
		</div>
	);
}

// ---- Mount ------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
	const root = document.getElementById('saai-product-video-root');
	if (root) {
		const { render } = window.wp.element;
		render(<VideoPanel />, root);
	}
});

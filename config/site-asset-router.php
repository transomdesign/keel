<?php

/**
 * Site Asset Router config
 *
 * Override plugin settings by uncommenting and modifying the values below.
 * Supports Craft's multi-environment config format — wrap values in an array
 * keyed by environment (e.g. 'production' => [...]) if needed.
 *
 * All settings are optional. Defaults apply unless explicitly overridden.
 */

return [
		// Volume handles to exclude from site-based routing.
		// Assets uploaded to these volumes will use their field's default upload
		// location instead of being routed to a site-specific subfolder.
		// Example: ['globalAssets', 'sharedMedia']
		// 'excludedVolumes' => [],
	];

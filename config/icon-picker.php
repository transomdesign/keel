<?php

/**
 * Icon Picker Configuration
 *
 * Configuration for Verbb's Icon Picker plugin.
 * Controls icon caching, paths, and display settings.
 *
 * @link https://verbb.io/craft-plugins/icon-picker/docs/get-started/configuration
 */

use craft\helpers\App;

$isDev = App::env('CRAFT_ENVIRONMENT') === 'dev';

return [
	'*' => [
		// Cache icons for better performance
		'enableCache' => !$isDev,

		// File system path to icon sets
		'iconSetsPath' => '@webroot/dist/icons/',

		// Base URL for icon access
		'iconSetsUrl' => '@web/dist/icons/',

		// Redactor field handle for rich text integration
		'redactorFieldHandle' => '',

		// Icon wrapper dimensions (pixels)
		'iconItemWrapperSize' => 56,
		'iconItemWrapperSizeLarge' => 72,

		// Icon glyph dimensions (pixels)
		'iconItemSize' => 24,
		'iconItemSizeLarge' => 40,
	],
];

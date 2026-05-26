<?php

/**
 * ImageOptimize plugin for Craft CMS 3.x
 *
 * Automatically optimize images after they've been transformed
 *
 * @link      https://nystudio107.com
 * @copyright Copyright (c) 2017 nystudio107
 */

/**
 * ImageOptimize config.php
 *
 * This file exists only as a template for the ImageOptimize settings.
 * It does nothing on its own.
 *
 * Don't edit this file, instead copy it to 'craft/config' as
 * 'image-optimize.php' and make your changes there to override default
 * settings.
 *
 * Once copied to 'craft/config', this file will be multi-environment aware as
 * well, so you can have different settings groups for each environment, just
 * as
 * you do for 'general.php'
 */

return [
	// Preset image processors
	'*' => [
		// Disable time-consuming placeholder generation
		'generatePlaceholders' => false,
		'createColorPalette' => false,
		'createPlaceholderSilhouettes' => false,
		// Enable automatic resaving of variants when fields are saved
		'automaticallyResaveImageVariants' => true,
		// Generate transforms before page load instead of on-demand
		'generateTransformsBeforePageLoad' => true,
		// Enable automatic resaving of OptimizedImages when Assets are saved
		'automaticallyResaveOptimizedImages' => true,
		'allowUpScaledImageVariants' => true,
		// Disable unnecessary optimizers
		'activeImageProcessors' => [
			'jpg' => ['jpegoptim'], // Just one, not jpegoptim AND mozjpeg
			'png' => ['optipng'], // Just one
			'gif' => ['gifsicle'],
		],
		// Active image variant creators
		'activeImageVariantCreators' => [
			'jpg' => ['cwebp', 'avifenc'],
			'png' => ['cwebp'],
			'gif' => ['cwebp'],
		],
		'imageProcessors' => [
			// jpeg optimizers
			'jpegoptim' => [
				'commandPath' => '/usr/bin/jpegoptim',
				'commandOptions' => '-s',
				'commandOutputFileFlag' => '',
			],
			'mozjpeg' => [
				'commandPath' => '/usr/bin/mozjpeg',
				'commandOptions' => '-optimize -copy none',
				'commandOutputFileFlag' => '-outfile',
			],
			'jpegtran' => [
				'commandPath' => '/usr/bin/jpegtran',
				'commandOptions' => '-optimize -copy none',
				'commandOutputFileFlag' => '',
			],
			// png optimizers
			'optipng' => [
				'commandPath' => '/usr/bin/optipng',
				'commandOptions' => '-o3 -strip all',
				'commandOutputFileFlag' => '',
			],
			'pngcrush' => [
				'commandPath' => '/usr/bin/pngcrush',
				'commandOptions' => '-brute -ow',
				'commandOutputFileFlag' => '',
			],
			'pngquant' => [
				'commandPath' => '/usr/bin/pngquant',
				'commandOptions' => '--strip--skip -if-larger',
				'commandOutputFileFlag' => '',
			],
			// svg optimizers
			'svgo' => [
				'commandPath' => '/usr/bin/svgo',
				'commandOptions' => '',
				'commandOutputFileFlag' => '',
			],
			// gif optimizers
			'gifsicle' => [
				'commandPath' => '/usr/bin/gifsicle',
				'commandOptions' => '-O3 -k 256',
				'commandOutputFileFlag' => '',
			],
		],
		'imageVariantCreators' => [
			// WebP variant creator
			// Quality: 0 (worst) to 100 (best). Default: 75
			// Lower values = smaller files but lower quality
			// Recommended: 80-90 for photos, 90-100 for graphics with text
			'cwebp' => [
				'commandPath' => '/usr/bin/cwebp',
				'commandOptions' => '-m 4 -q 82', // Method 4 is faster than default 6
				'commandOutputFileFlag' => '-o',
				'imageVariantExtension' => 'webp',
			],

			// AVIF variant creator
			// IMPORTANT: AVIF quality scale is INVERSE of JPEG/WebP!
			// Lower numbers = BETTER quality, higher numbers = WORSE quality
			//
			// Quality Parameters:
			// --min: Minimum quantizer (best quality blocks can use)
			// --max: Maximum quantizer (worst quality blocks can use)
			//
			// Quality Guidelines:
			//   0-15:  Very high quality, near-lossless (use for hero images)
			//   15-30: High quality, good for photos (balanced quality/size)
			//   30-50: Medium quality (more compression)
			//   50-63: Lower quality (maximum compression)
			//
			// Speed Parameter (-s):
			//   0-3: Slowest, best compression (production builds)
			//   4-6: Balanced speed/quality (recommended: 6)
			//   7-10: Fastest, lower quality (development/testing)
			//
			// Current settings: High quality, competitive with WebP file sizes
			// - Speed 6: Balanced encoding time
			// - Quality 15-35: High quality, better compression
			//
			// To adjust:
			// - Better quality (larger files):  '--min 10 --max 30' or '--min 5 --max 28'
			// - Smaller files (lower quality):  '--min 20 --max 40' or '--min 25 --max 45'
			// - Faster encoding:  '-s 8' or '-s 10' (for development)
			// - Slower/better:    '-s 4' or '-s 2' (for production builds)
			//
			// After changing, regenerate variants:
			// ddev craft image-optimize/optimize/create [volumeHandle] --force
			'avifenc' => [
				'commandPath' => '/usr/bin/avifenc',
				'commandOptions' => '-s 8 --min 20 --max 40',
				'commandOutputFileFlag' => '-o',
				'commandQualityFlag' => '',
				'imageVariantExtension' => 'avif',
			],
		],
	],
	'dev' => [
		'imageProcessors' => [
			'svgo' => [
				'commandPath' => '/usr/local/bin/svgo',
				'commandOptions' => '',
				'commandOutputFileFlag' => '',
			],
			'jpegoptim' => [
				'commandPath' => '/usr/bin/jpegoptim',
				'commandOptions' => '-s',
				'commandOutputFileFlag' => '',
			],
		],
	],
];

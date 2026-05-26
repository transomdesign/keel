<?php

return [
	'*' => [
		// Enable caching by default (production & staging)
		'cachingEnabled' => true,
		'refreshCacheEnabled' => true,

		//
		'generateTransformsBeforePageLoad' => true,

		// Include all URIs for caching
		'includedUriPatterns' => [
			[
				'enabled' => true,
				'siteId' => '', // All sites
				'uriPattern' => '.*', // All URIs
			],
		],

		// File storage with compression
		'cacheStorageType' => 'putyourlightson\blitz\drivers\storage\FileStorage',
		'cacheStorageSettings' => [
			'folderPath' => '@webroot/cache/blitz',
			'compressCachedValues' => true,
		],

		'excludedUriPatterns' => [
			['uriPattern' => 'profile/.*'],
			['uriPattern' => 'cart'],
			['uriPattern' => 'checkout/.*'],
		],

		// Cache URLs with query strings as unique pages
		'queryStringCaching' =>
			\putyourlightson\blitz\models\SettingsModel::QUERY_STRINGS_CACHE_URLS_AS_UNIQUE_PAGES,

		// Allow all query string params in the cache key (default: .*) — explicit here to
		// prevent CP settings from overriding and silently breaking tag/filter caching
		'includedQueryStringParams' => [
			['enabled' => true, 'siteId' => '', 'queryStringParam' => '.*'],
		],

		// Strip tracking/analytics params so they don't create duplicate cache entries
		'excludedQueryStringParams' => [
			['enabled' => true, 'siteId' => '', 'queryStringParam' => 'gclid'],
			['enabled' => true, 'siteId' => '', 'queryStringParam' => 'fbclid'],
			['enabled' => true, 'siteId' => '', 'queryStringParam' => 'srsltid'],
			['enabled' => true, 'siteId' => '', 'queryStringParam' => 'utm_source'],
			['enabled' => true, 'siteId' => '', 'queryStringParam' => 'utm_medium'],
			['enabled' => true, 'siteId' => '', 'queryStringParam' => 'utm_campaign'],
		],

		// Production settings
		'debug' => false, // Turn off debug in production
		'outputComments' => false, // Turn off comments in production

		// Performance settings
		'trackElements' => true,
		'trackElementQueries' => true,
		'refreshCacheAutomaticallyForGlobals' => false, // Disable for better performance
		'refreshCacheWhenElementSavedUnchanged' => false,
		'refreshCacheWhenElementSavedNotLive' => false,

		// Cache control headers
		'cacheControlHeader' => 'public, s-maxage=31536000, max-age=0',
	],
	'dev' => [
		// Disable caching in development only
		'cachingEnabled' => false,
		'refreshCacheEnabled' => false,
	],
];

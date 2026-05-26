<?php

use craft\helpers\App;

$primarySiteUrl = rtrim((string) App::env('URL_PRIMARY'), '/');

return [
	'devServerPublic' => $primarySiteUrl !== '' ? $primarySiteUrl . ':1234' : null,
	'serverPublic' => '/dist/',
	'useDevServer' => App::env('CRAFT_ENVIRONMENT') === 'dev',
	'manifestPath' => Craft::getAlias('@webroot') . '/dist/.vite/manifest.json',
	'errorEntry' => 'scripts/main.ts',
];

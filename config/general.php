<?php

/**
 * General Configuration
 *
 * All of your system's general configuration settings go in here. You can see a
 * list of the available settings in vendor/craftcms/cms/src/config/GeneralConfig.php.
 *
 * @see \craft\config\GeneralConfig
 * @link https://craftcms.com/docs/5.x/reference/config/general.html
 */

use craft\config\GeneralConfig;
use craft\helpers\App;

$environment = strtolower(App::env('CRAFT_ENVIRONMENT'));
$isDev = $environment === 'dev';
$isStaging = $environment === 'staging';
$isProduction = $environment === 'production';

return GeneralConfig::create()
		->enableGql(false)
		->aliases([
			'@webroot' => dirname(__DIR__) . '/web',
			'@src' => dirname(__DIR__) . '/src',
			'@feather' => dirname(__DIR__) . '/src/icon-picker/feather',
		])
		->defaultWeekStartDay(1) // Monday
		->omitScriptNameInUrls() // We don't want index.php in URLs
		->preloadSingles() // Use singles like globals
		->preventUserEnumeration() // Prevent password-reset hacking
		->transformSvgs(false) // No need to transform SVGs
		->cooldownDuration('PT0S') // Time to wait before re-attempting to log in
		->convertFilenamesToAscii(true) // URLs also look nicer
		->disallowRobots(!$isProduction) // Only production is robot-friendly
		->errorTemplatePrefix('_errors/') // Keep errors organized
		->maxUploadFileSize(67_108_864) // 64 MB
		->runQueueAutomatically(false) // Prefer queue runners
		->sendContentLengthHeader(true) // Without this, browsers can’t show download progress
		->useEmailAsUsername(true); // Emails are easier to remember

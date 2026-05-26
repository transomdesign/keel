<?php

/**
 * Yii Console Application Config
 *
 * Ensure console requests can publish CP resources when plugins trigger
 * asset bundle publishing during project config applies or element resaves.
 */

return [
	'components' => [
		'assetManager' => [
			'basePath' => '@webroot/cpresources',
			'baseUrl' => '@web/cpresources',
		],
	],
];

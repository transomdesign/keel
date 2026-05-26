<?php
/**
 * Site URL Rules
 *
 * You can define custom site URL rules here, which Craft will check in addition
 * to routes defined in Settings → Routes.
 *
 * Read about Craft’s routing behavior (and this file’s structure), here:
 * @link https://craftcms.com/docs/5.x/system/routing.html
 */

return [
	// Commerce7 integration demo routes - point directly to templates
	'commerce7/test' => ['template' => 'commerce7/test'],
	'commerce7/simple-test' => ['template' => 'commerce7/simple-test'],
	'commerce7/products' => ['template' => 'commerce7/products'],
];

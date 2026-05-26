<?php

/**
 * Matrix Defaults config
 *
 * Keys are entry type handles. Values map matrix field handles to an array of
 * default block entries to pre-populate when a new entry of that type is created.
 *
 * Each block needs at minimum a 'type' key (the block entry type handle).
 * Add a 'fields' key to pre-fill field values inside the block.
 */

return [
	'headline' => [
		'oHeadlineBlocks' => [['type' => 'headlineHeadline']],
	],
];

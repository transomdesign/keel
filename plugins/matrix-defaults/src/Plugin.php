<?php

declare(strict_types=1);

namespace MatrixDefaults;

use Craft;
use craft\base\Element;
use craft\base\Plugin as BasePlugin;
use craft\elements\Entry;
use craft\events\ModelEvent;
use yii\base\Event;

/**
 * Matrix Defaults plugin.
 *
 * Reads rules from config/matrix-defaults.php and auto-populates Matrix fields
 * with default entries whenever a new entry (top-level or nested block) is
 * first created in the CP.
 *
 * Config is keyed by entry type handle — this works for both top-level section
 * entry types and nested matrix block entry types.
 *
 * Example config/matrix-defaults.php:
 *
 *   <?php
 *   return [
 *       // 'entryTypeHandle' => [
 *       //     'matrixFieldHandle' => [
 *       //         [
 *       //             'type'   => 'blockEntryTypeHandle',
 *       //             'fields' => [
 *       //                 'plainTextFieldHandle' => 'Default text',
 *       //             ],
 *       //         ],
 *       //     ],
 *       // ],
 *
 *       // When a new "headline" block is added, pre-populate oHeadlineBlocks
 *       // with one headlineHeadline entry:
 *       'headline' => [
 *           'oHeadlineBlocks' => [
 *               ['type' => 'headlineHeadline'],
 *           ],
 *       ],
 *
 *       // When a new top-level "page" entry is created, pre-populate
 *       // contentBuilder with a text block:
 *       'page' => [
 *           'contentBuilder' => [
 *               ['type' => 'text'],
 *           ],
 *       ],
 *   ];
 */
class Plugin extends BasePlugin
{
    public string $schemaVersion = '1.0.0';
    public bool $hasCpSettings = false;
    public bool $hasCpSection = false;

    public function init(): void
    {
        parent::init();

        Event::on(
            Entry::class,
            Element::EVENT_BEFORE_SAVE,
            function (ModelEvent $event) {
                /** @var Entry $entry */
                $entry = $event->sender;
                $this->_maybePopulateDefaults($entry, $event->isNew);
            }
        );
    }

    private function _maybePopulateDefaults(Entry $entry, bool $isNew): void
    {
        if (!$isNew) {
            return;
        }

        $isTopLevel = (bool)$entry->sectionId;

        // Top-level section entries: only fire on the initial unpublished draft
        // (i.e. the moment "New entry" is clicked, not on every propagation save)
        if ($isTopLevel && !$entry->getIsUnpublishedDraft()) {
            return;
        }

        try {
            $entryTypeHandle = $entry->getType()->handle;
        } catch (\Throwable $e) {
            Craft::warning(
                sprintf(
                    'Unable to resolve entry type while setting matrix defaults: %s',
                    $e->getMessage()
                ),
                'matrix-defaults'
            );

            return;
        }

        /** @var array<string, array<string, list<array<string, mixed>>>> $rules */
        $rules = Craft::$app->getConfig()->getConfigFromFile('matrix-defaults');

        $entryTypeRules = $rules[$entryTypeHandle] ?? [];
        if (empty($entryTypeRules)) {
            return;
        }

        foreach ($entryTypeRules as $matrixFieldHandle => $defaultEntries) {
            // Don't overwrite if the field already has content
            try {
                $existing = $entry->getFieldValue($matrixFieldHandle);
                if ($existing !== null && method_exists($existing, 'count') && $existing->count() > 0) {
                    continue;
                }
            } catch (\Throwable) {
                // Field handle not in this entry's layout — skip silently
                continue;
            }

            // Build the keyed array Craft expects for Matrix field values
            $matrixData = [];
            foreach ($defaultEntries as $index => $entryData) {
                $matrixData['new' . ($index + 1)] = $entryData;
            }

            try {
                $entry->setFieldValue($matrixFieldHandle, $matrixData);

                Craft::info(
                    sprintf(
                        'Populated %d default matrix entr%s for field "%s" on new "%s" entry.',
                        count($defaultEntries),
                        count($defaultEntries) === 1 ? 'y' : 'ies',
                        $matrixFieldHandle,
                        $entryTypeHandle
                    ),
                    'matrix-defaults'
                );
            } catch (\Throwable $e) {
                Craft::warning(
                    sprintf(
                        'Failed to set matrix defaults for field "%s" on entry type "%s": %s',
                        $matrixFieldHandle,
                        $entryTypeHandle,
                        $e->getMessage()
                    ),
                    'matrix-defaults'
                );
            }
        }
    }
}

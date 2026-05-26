<?php

namespace SiteModule\fields;

use Craft;
use craft\base\ElementInterface;
use craft\base\Field;
use craft\models\Section;
use yii\db\Schema;

/**
 * Channel Selector field type.
 *
 * Renders a dropdown populated dynamically with all Channel-type sections.
 * Stores the selected section's handle as a string.
 */
class ChannelSelectorField extends Field
{
    // =========================================================================
    // Static
    // =========================================================================

    public static function displayName(): string
    {
        return Craft::t('site', 'Channel Selector');
    }

    public static function icon(): string
    {
        return 'newspaper';
    }

    public static function phpType(): string
    {
        return 'string|null';
    }

    public static function dbType(): array|string|null
    {
        return Schema::TYPE_STRING;
    }

    // =========================================================================
    // Instance
    // =========================================================================

    protected function inputHtml(mixed $value, ?ElementInterface $element, bool $inline): string
    {
        $options = $this->channelOptions();

        return Craft::$app->view->renderTemplate('_includes/forms/select', [
            'id'      => $this->getInputId(),
            'name'    => $this->handle,
            'value'   => $value,
            'options' => $options,
        ]);
    }

    public function getElementValidationRules(): array
    {
        $handles = array_column($this->channelOptions(), 'value');

        return [
            ['in', 'range' => $handles, 'allowArray' => false],
        ];
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Returns an options array of all Channel sections for use in a <select>.
     *
     * @return array<int, array{label: string, value: string}>
     */
    private function channelOptions(): array
    {
        $options = [['label' => 'Select a channel', 'value' => '']];

        foreach (Craft::$app->entries->getAllSections() as $section) {
            if ($section->type === Section::TYPE_CHANNEL) {
                $options[] = [
                    'label' => $section->name,
                    'value' => $section->handle,
                ];
            }
        }

        return $options;
    }
}

<?php

/**
 * @see \Craft For IDE support
 */

namespace AssetTypes;

use Craft;
use craft\elements\Asset;
use craft\events\ModelEvent;
use yii\base\Event;
use yii\base\Module as BaseModule;

/**
 * Asset Types Module
 *
 * Comprehensive file type support for Craft CMS with validation and easy configuration
 */
class Module extends BaseModule
{
    /**
     * Supported file types configuration
     * Add new file types here with their validation rules
     */
    private const SUPPORTED_TYPES = [
        'svg' => [
            'extensions' => ['svg'],
            'mimeTypes' => ['image/svg+xml'],
            'validator' => 'validateSvgFile',
            'description' => 'SVG'
        ],
        'webmanifest' => [
            'extensions' => ['webmanifest', 'manifest'],
            'mimeTypes' => ['application/manifest+json', 'application/json'],
            'validator' => 'validateManifestFile',
            'description' => 'Web App Manifest'
        ],
        'webp' => [
            'extensions' => ['webp'],
            'mimeTypes' => ['image/webp'],
            'validator' => null, // No special validation needed
            'description' => 'WebP Image'
        ],
        'woff2' => [
            'extensions' => ['woff2'],
            'mimeTypes' => ['font/woff2'],
            'validator' => null,
            'description' => 'Woff2 Font'
        ],
        'ico' => [
            'extensions' => ['ico'],
            'mimeTypes' => ['image/x-icon', 'image/vnd.microsoft.icon'],
            'validator' => null,
            'description' => 'Icon File'
        ]
    ];

    /**
     * @inheritdoc
     */
    public function init()
    {
        parent::init();

        // Don't set controller namespace since we don't have controllers
        // This prevents Yii from trying to resolve @AssetTypes/controllers path alias

        // Register file extensions with Craft
        $this->registerFileExtensions();

        // Add validation for supported file types
        Event::on(
            Asset::class,
            Asset::EVENT_BEFORE_SAVE,
            [$this, 'validateAssetFile']
        );

        // Log module initialization
        Craft::info('Asset Types module loaded with support for: ' . implode(', ', $this->getSupportedExtensions()), 'asset-types');
        Craft::info('Extra file kinds registered: ' . json_encode(array_keys(Craft::$app->config->general->extraFileKinds ?: [])), 'asset-types');
    }

    /**
     * Override to prevent controller path resolution since we don't have controllers
     * @return string
     */
    public function getControllerPath()
    {
        return '';
    }

    /**
     * Register all supported file extensions with Craft
     */
    private function registerFileExtensions()
    {
        // Add extensions to allowed file extensions
        $allowedExtensions = Craft::$app->config->general->allowedFileExtensions;
        $newExtensions = $this->getSupportedExtensions();

        foreach ($newExtensions as $ext) {
            if (!in_array($ext, $allowedExtensions)) {
                $allowedExtensions[] = $ext;
            }
        }

        Craft::$app->config->general->allowedFileExtensions = $allowedExtensions;

        // Add extra file kinds for asset field restrictions
        $extraFileKinds = Craft::$app->config->general->extraFileKinds ?: [];

        foreach (self::SUPPORTED_TYPES as $key => $config) {
            $kindKey = strtoupper($key);
            if (!isset($extraFileKinds[$kindKey])) {
                $extraFileKinds[$kindKey] = [
                    'label' => $config['description'],
                    'extensions' => $config['extensions'],
                ];
            }
        }

        Craft::$app->config->general->extraFileKinds = $extraFileKinds;
    }

    /**
     * Get all supported file extensions
     *
     * @return array
     */
    private function getSupportedExtensions(): array
    {
        $extensions = [];
        foreach (self::SUPPORTED_TYPES as $type) {
            $extensions = array_merge($extensions, $type['extensions']);
        }
        return array_unique($extensions);
    }

    /**
     * Validate uploaded asset files
     *
     * @param ModelEvent $event
     */
    public function validateAssetFile(ModelEvent $event)
    {
        $asset = $event->sender;
        $extension = strtolower(pathinfo($asset->filename, PATHINFO_EXTENSION));

        // Find the file type configuration
        $typeConfig = $this->getTypeConfigForExtension($extension);
        if (!$typeConfig || !$typeConfig['validator']) {
            return; // No validation needed
        }

        // Run the validator
        $validatorMethod = $typeConfig['validator'];
        if (method_exists($this, $validatorMethod)) {
            $this->$validatorMethod($asset, $typeConfig, $event);
        }
    }

    /**
     * Get type configuration for a file extension
     *
     * @param string $extension
     * @return array|null
     */
    private function getTypeConfigForExtension(string $extension): ?array
    {
        foreach (self::SUPPORTED_TYPES as $typeConfig) {
            if (in_array($extension, $typeConfig['extensions'])) {
                return $typeConfig;
            }
        }
        return null;
    }

    /**
     * Validate SVG files
     *
     * @param Asset $asset
     * @param array $config
     * @param ModelEvent $event
     */
    private function validateSvgFile($asset, $config, $event)
    {
        if (!$asset->tempFilePath || !file_exists($asset->tempFilePath)) {
            return;
        }

        $content = file_get_contents($asset->tempFilePath);

        // Basic SVG validation - check for SVG opening tag
        if (strpos($content, '<svg') === false) {
            $asset->addError('filename', 'File does not appear to be a valid SVG.');
            $event->isValid = false;
            return;
        }

        // Check for potentially dangerous content
        $dangerousPatterns = [
            '<script',
            'javascript:',
            'onload=',
            'onerror=',
            'onclick='
        ];

        foreach ($dangerousPatterns as $pattern) {
            if (stripos($content, $pattern) !== false) {
                $asset->addError('filename', 'SVG contains potentially unsafe content.');
                $event->isValid = false;
                return;
            }
        }
    }

    /**
     * Validate manifest files (webmanifest, manifest)
     *
     * @param Asset $asset
     * @param array $config
     * @param ModelEvent $event
     */
    private function validateManifestFile($asset, $config, $event)
    {
        if (!$asset->tempFilePath || !file_exists($asset->tempFilePath)) {
            return;
        }

        $content = file_get_contents($asset->tempFilePath);

        // Validate JSON
        $decoded = json_decode($content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $asset->addError('filename', 'Manifest file must contain valid JSON.');
            $event->isValid = false;
            return;
        }

        // Validate web app manifest structure
        $this->validateWebManifestStructure($decoded, $asset, $event);
    }

    /**
     * Validate web app manifest structure
     *
     * @param array $manifest
     * @param Asset $asset
     * @param ModelEvent $event
     */
    private function validateWebManifestStructure($manifest, $asset, $event)
    {
        $hasErrors = false;

        // Check for required fields
        if (!isset($manifest['name']) && !isset($manifest['short_name'])) {
            $asset->addError('filename', 'Web app manifest must have either "name" or "short_name" property.');
            $hasErrors = true;
        }

        // Validate icons array if present
        if (isset($manifest['icons'])) {
            if (!is_array($manifest['icons'])) {
                $asset->addError('filename', 'Manifest "icons" property must be an array.');
                $hasErrors = true;
            } else {
                // Validate each icon
                foreach ($manifest['icons'] as $index => $icon) {
                    if (!isset($icon['src'])) {
                        $asset->addError('filename', "Icon at index {$index} is missing required 'src' property.");
                        $hasErrors = true;
                    }
                    if (!isset($icon['sizes'])) {
                        $asset->addError('filename', "Icon at index {$index} is missing required 'sizes' property.");
                        $hasErrors = true;
                    }
                }
            }
        }

        // Validate other common properties
        if (isset($manifest['start_url']) && !is_string($manifest['start_url'])) {
            $asset->addError('filename', 'Manifest "start_url" must be a string.');
            $hasErrors = true;
        }

        if (isset($manifest['display']) && !in_array($manifest['display'], ['fullscreen', 'standalone', 'minimal-ui', 'browser'])) {
            $asset->addError('filename', 'Manifest "display" must be one of: fullscreen, standalone, minimal-ui, browser.');
            $hasErrors = true;
        }

        if (isset($manifest['orientation']) && !in_array($manifest['orientation'], ['any', 'natural', 'landscape', 'portrait', 'portrait-primary', 'portrait-secondary', 'landscape-primary', 'landscape-secondary'])) {
            $asset->addError('filename', 'Manifest "orientation" contains invalid value.');
            $hasErrors = true;
        }

        if ($hasErrors) {
            $event->isValid = false;
        }
    }

    /**
     * Get supported file types for debugging/info
     *
     * @return array
     */
    public function getSupportedTypes(): array
    {
        return self::SUPPORTED_TYPES;
    }

    /**
     * Add a new file type at runtime (for extensions or custom needs)
     *
     * @param string $key
     * @param array $config
     */
    public function addFileType(string $key, array $config)
    {
        // Validate config structure
        $required = ['extensions', 'mimeTypes', 'description'];
        foreach ($required as $field) {
            if (!isset($config[$field])) {
                throw new \InvalidArgumentException("File type config missing required field: {$field}");
            }
        }

        // Add to supported types
        $types = self::SUPPORTED_TYPES;
        $types[$key] = $config;

        // Re-register extensions
        $this->registerFileExtensions();

        Craft::info("Added new file type: {$key}", __METHOD__);
    }
}

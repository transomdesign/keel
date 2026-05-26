<?php

namespace SiteModule;

use Craft;
use craft\events\RegisterComponentTypesEvent;
use craft\helpers\App;
use craft\services\Fields;
use SiteModule\fields\ChannelSelectorField;
use yii\base\Event;

/**
 * Site Module
 *
 * General-purpose module for site-specific customisations.
 */
class Module extends \yii\base\Module
{
    public function init(): void
    {
        parent::init();

        Craft::setAlias('@SiteModule', __DIR__);

        $this->redirectCpToPrimaryHost();
        $this->registerFieldTypes();
    }

    /**
     * Redirect CP requests on secondary hosts to the primary host's CP.
     *
     * Runs during bootstrap, before Craft resolves the URL, so it works
     * even on hosts that aren't the designated CP host.
     */
    private function redirectCpToPrimaryHost(): void
    {
        // Use raw superglobals — Craft's Request object isn't fully initialised yet
        if (PHP_SAPI === 'cli') {
            return;
        }

        $primaryUrl = rtrim((string) App::env('URL_PRIMARY'), '/');
        if (!$primaryUrl) {
            return;
        }

        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $currentOrigin = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? '');

        if (rtrim($currentOrigin, '/') === $primaryUrl) {
            return; // Already on the primary host
        }

        // Only redirect if the path starts with the CP trigger segment
        $cpTrigger = Craft::$app->config->general->cpTrigger ?? 'admin';
        $path = ltrim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/', '/');

        if ($path !== $cpTrigger && !str_starts_with($path, $cpTrigger . '/')) {
            return; // Not a CP request
        }

        $query = $_SERVER['QUERY_STRING'] ?? '';
        $redirectUrl = $primaryUrl . '/' . $path . ($query !== '' ? '?' . $query : '');

        header('Location: ' . $redirectUrl, true, 301);
        exit;
    }

    private function registerFieldTypes(): void
    {
        Event::on(
            Fields::class,
            Fields::EVENT_REGISTER_FIELD_TYPES,
            function (RegisterComponentTypesEvent $event) {
                $event->types[] = ChannelSelectorField::class;
            }
        );
    }
}

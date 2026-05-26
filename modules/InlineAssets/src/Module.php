<?php
namespace modules\inlineassets;

use Craft;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;
use yii\base\Module as BaseModule;

class Module extends BaseModule
{


    public function init()
    {
        $this->controllerNamespace = __NAMESPACE__ . '\\controllers';
        $this->controllerPath = __DIR__ . '/controllers';
        parent::init();

        if (Craft::$app->request->isCpRequest || Craft::$app->request->isConsoleRequest) {
            return;
        }

        Craft::$app->view->registerTwigExtension(new class extends AbstractExtension {
            public function getFunctions()
            {
                return [
                    new TwigFunction('inlineFile', [$this, 'inlineFile']),
                ];
            }

            public function inlineFile(string $path): string
            {
                $fullPath = Craft::getAlias('@webroot') . '/' . ltrim($path, '/');
                if (file_exists($fullPath)) {
                    return file_get_contents($fullPath);
                }
                return "<!-- File not found: {$fullPath} -->";
            }
        });
    }
}

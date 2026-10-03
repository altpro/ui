<?php

// Renders a Blade string with the package's provider loaded: php tests/blade.php '<x-ui::field … />'
// Used by tests/browsers.spec.js to put real Blade output in front of the browser.

require __DIR__.'/../vendor/autoload.php';

use Illuminate\Support\Facades\Blade;
use Orchestra\Testbench\Foundation\Application;

Application::create(options: ['extra' => ['providers' => [Altpro\Ui\UiServiceProvider::class]]]);

echo Blade::render($argv[1]);

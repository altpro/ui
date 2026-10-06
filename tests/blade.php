<?php

// Renders a Blade string with the package's provider loaded: php tests/blade.php '<x-ui::field … />'
// Used by tests/browsers.spec.js to put real Blade output in front of the browser.

// first, so a worktree with a symlinked vendor/ loads its own src/ and not the main checkout's
(require __DIR__.'/../vendor/autoload.php')->addPsr4('Altpro\\Ui\\', __DIR__.'/../src', true);

use Illuminate\Support\Facades\Blade;
use Orchestra\Testbench\Foundation\Application;

Application::create(options: ['extra' => ['providers' => [Altpro\Ui\UiServiceProvider::class]]]);

echo Blade::render($argv[1]);

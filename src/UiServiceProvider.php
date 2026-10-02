<?php

declare(strict_types=1);

namespace Altpro\Ui;

use Illuminate\Support\ServiceProvider;

class UiServiceProvider extends ServiceProvider
{
    /**
     * Blade components render as <x-ui::name>. Laravel checks
     * resources/views/vendor/ui first, so an app can override one
     * component by publishing or copying just that file.
     */
    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'ui');

        $this->publishes([
            __DIR__.'/../resources/views' => resource_path('views/vendor/ui'),
        ], 'ui-views');
    }
}

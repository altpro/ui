<?php

// TableQuery against an in-memory SQLite table: php tests/table-query.php
// Run by `npm test` before the browser suite. Exits non-zero on the first failure.

require __DIR__.'/../vendor/autoload.php';

use Altpro\Ui\TableQuery;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Orchestra\Testbench\Foundation\Application;

$app = Application::create();
$app['config']->set('database.default', 'sqlite');
$app['config']->set('database.connections.sqlite', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);

Schema::create('brands', function ($table) {
    $table->id();
    $table->string('name');
    $table->string('slug');
});

class Brand extends Model
{
    public $timestamps = false;

    protected $guarded = [];
}

// created out of order, so id order (Calpol, Anadin, Boots) differs from name order
foreach (['Calpol' => 'z', 'Anadin' => 'y', 'Boots' => 'x'] as $name => $slug) {
    Brand::create(['name' => $name, 'slug' => $slug]);
}

$names = fn (string $url, ?string $name = null): array => TableQuery::paginate(
    query: Brand::query(),
    request: Request::create($url),
    searchable: ['name'],
    sortable: ['name', 'title' => 'slug'],
    name: $name,
    defaultSort: 'name',
)->pluck('name')->all();

$check = function (mixed $actual, mixed $expected, string $what): void {
    if ($actual !== $expected) {
        fwrite(STDERR, "FAIL: $what\n  expected ".json_encode($expected)."\n  got      ".json_encode($actual)."\n");
        exit(1);
    }
};

$check($names('/?sort=name&dir=desc'), ['Calpol', 'Boots', 'Anadin'], 'sorts by an allowed column');
$check($names('/?sort=title&dir=asc'), ['Boots', 'Anadin', 'Calpol'], 'maps the shown name to the database column');
$check($names('/?sort=id&dir=asc'), ['Anadin', 'Boots', 'Calpol'], 'refuses a column not on the list and falls back to the default');
$check($names('/?search=anad'), ['Anadin'], 'searches the named columns');
$check($names('/?search=y'), [], 'does not search columns it was not given');
$check($names('/?brands_sort=name&brands_dir=desc', 'brands'), ['Calpol', 'Boots', 'Anadin'], 'reads parameters under the table name');
$check($names('/?sort=name&dir=desc', 'brands'), ['Anadin', 'Boots', 'Calpol'], 'ignores another table\'s parameters');

$perPage = fn (string $url): int => TableQuery::paginate(Brand::query(), Request::create($url), perPage: 2)->perPage();
$check($perPage('/?per_page=100000'), 2, 'ignores a page size it does not offer');
$check($perPage('/?per_page=10'), 10, 'takes a page size it offers');

echo "TableQuery: all checks passed\n";

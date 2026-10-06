<?php

// TableQuery against an in-memory SQLite table: php tests/table-query.php
// Run by `npm test` before the browser suite. Exits non-zero on the first failure.

// first, so a worktree with a symlinked vendor/ loads its own src/ and not the main checkout's
(require __DIR__.'/../vendor/autoload.php')->addPsr4('Altpro\\Ui\\', __DIR__.'/../src', true);

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
// SQLite and MySQL ignore case anyway; Postgres needs ilike. Compiled only, so no server is needed
$app['config']->set('database.connections.pgsql', ['driver' => 'pgsql', 'database' => 'x', 'prefix' => '']);
TableQuery::search($pg = Brand::on('pgsql'), ['name'], 'ANAD');
$check($pg->toSql(), 'select * from "brands" where ("name"::text ilike ?)', 'searches without case on Postgres');
$check($names('/?brands_sort=name&brands_dir=desc', 'brands'), ['Calpol', 'Boots', 'Anadin'], 'reads parameters under the table name');
$check($names('/?sort=name&dir=desc', 'brands'), ['Anadin', 'Boots', 'Calpol'], 'ignores another table\'s parameters');

$orders = function (string $url): array {
    TableQuery::paginate($query = Brand::query(), Request::create($url), sortable: ['name']);

    return array_map(fn (array $o): string => $o['column'].' '.$o['direction'], $query->getQuery()->orders);
};
$check($orders('/?sort=name&dir=desc'), ['name desc', 'brands.id desc'], 'breaks ties by the key, so a page boundary is stable');
$check($orders('/'), ['brands.id asc'], 'orders by the key when there is no sort');

$perPage = fn (string $url): int => TableQuery::paginate(Brand::query(), Request::create($url), perPage: 2)->perPage();
$check($perPage('/?per_page=100000'), 2, 'ignores a page size it does not offer');
$check($perPage('/?per_page=10'), 10, 'takes a page size it offers');
$check(TableQuery::paginate(Brand::query(), Request::create('/'))->perPage(), 25, 'defaults to the shared default page size');

$page = fn (string $url): array => [
    ($paginator = TableQuery::paginate(Brand::query(), Request::create($url), sortable: ['name'], defaultSort: 'name', perPage: 2))->currentPage(),
    $paginator->pluck('name')->all(),
];
$check($page('/?page=2'), [2, ['Calpol']], 'reads the page from the request it was given');
$check($page('/?page=9'), [2, ['Calpol']], 'shows the last page for a page past the end');

// the URL format, case by case, from the fixture tests/table-view.ts reads too
$fixture = json_decode((string) file_get_contents(__DIR__.'/table-urls.json'), true, flags: JSON_THROW_ON_ERROR);
$table = $fixture['table'];
$sorted = function (array $view): array {
    ksort($view);
    ksort($view['filters']);

    return $view;
};

foreach ($fixture['cases'] as $case) {
    $request = Request::create($case['url']);
    $name = $case['name'] ?? null;
    $actual = TableQuery::view($request, $table['sortable'], $name, $table['defaultSort'], $table['defaultDirection'])
        + ['filters' => TableQuery::filters($request, $table['filters'], $name)];
    $expected = [...$fixture['view'], ...$case['view'], 'filters' => [...$fixture['view']['filters'], ...$case['view']['filters'] ?? []]];
    $check($sorted($actual), $sorted($expected), 'URL: '.$case['what']);
}

echo "TableQuery: all checks passed\n";

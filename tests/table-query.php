<?php

// TableQuery against an in-memory SQLite table: php tests/table-query.php
// Run by `npm test` before the browser suite. Exits non-zero on the first failure.

// first, so a worktree with a symlinked vendor/ loads its own src/ and not the main checkout's
(require __DIR__.'/../vendor/autoload.php')->addPsr4('Altpro\\Ui\\', __DIR__.'/../src', true);

use Altpro\Ui\TableQuery;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Orchestra\Testbench\Foundation\Application;

$app = Application::create();
// Laravel's handler renders an uncaught exception and exits 0, which would pass a check that threw
set_exception_handler(function (Throwable $e): void {
    fwrite(STDERR, 'FAIL: '.$e::class.': '.$e->getMessage()."\n  at ".$e->getFile().':'.$e->getLine()."\n");
    exit(1);
});
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
// except a JSON path on MySQL, where json_unquote() is binary-collated, so both sides are lowered
$app['config']->set('database.connections.mysql', ['driver' => 'mysql', 'database' => 'x', 'prefix' => '']);
TableQuery::search($my = Brand::on('mysql'), ['name', 'data->postcode'], 'SW1A');
$check($my->toSql(), 'select * from `brands` where (`name` like ? or lower(json_unquote(json_extract(`data`, \'$."postcode"\'))) like ?)', 'lowers a JSON path on MySQL');
$check($my->getBindings(), ['%SW1A%', '%sw1a%'], 'lowers the term for a JSON path only');
$check($names('/?brands_sort=name&brands_dir=desc', 'brands'), ['Calpol', 'Boots', 'Anadin'], 'reads parameters under the table name');
$check($names('/?sort=name&dir=desc', 'brands'), ['Anadin', 'Boots', 'Calpol'], 'ignores another table\'s parameters');

$orders = function (string $url): array {
    TableQuery::paginate($query = Brand::query(), Request::create($url), sortable: ['name']);

    return array_map(fn (array $o): string => $o['column'].' '.$o['direction'], $query->getQuery()->orders);
};
$check($orders('/?sort=name&dir=desc'), ['name desc', 'brands.id desc'], 'breaks ties by the key, so a page boundary is stable');
$check($orders('/'), ['name asc', 'brands.id asc'], 'with no default sort, sorts by the first sortable key, as DataTable does');
TableQuery::paginate($unsorted = Brand::query(), Request::create('/'));
$check(array_column($unsorted->getQuery()->orders, 'column'), ['brands.id'], 'orders by the key when nothing is sortable');

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
$check($page('/?page=9223372036854775807'), [2, ['Calpol']], 'shows the last page for a page too big for an offset');

// Postgres refuses a NUL byte and invalid UTF-8 even as bound values (SQLSTATE 22021), and SQLite takes both, so the
// queries are checked for them rather than run: every binding is UTF-8 without a NUL, and the view goes to the page as JSON
$unreadable = fn (array $bindings): array => array_values(array_filter($bindings, fn ($b): bool => is_string($b) && (! mb_check_encoding($b, 'UTF-8') || str_contains($b, "\0"))));
$bad = '/?search=a%00b&sort=name%FF&dir=desc%00&page=2%00&per_page=10%FF&brand%5B%5D=acme&brand%5B%5D=b%00lt&brand%5B%5D=%FF&tags%5B%5D=%00&status=%FF&placed_from=%FF&placed_to=2026-03-31%00';
$check($names('/?search=a%00b'), ['Anadin', 'Boots', 'Calpol'], 'a search with a null byte is no search');
$check($names('/?search=%FF'), ['Anadin', 'Boots', 'Calpol'], 'a search that is not UTF-8 is no search');
DB::enableQueryLog();
TableQuery::paginate(Brand::query(), Request::create($bad), searchable: ['name'], sortable: ['name']);
$check(count(DB::getQueryLog()) > 0 ? $unreadable(array_merge(...array_column(DB::getQueryLog(), 'bindings'))) : null, [], 'paginate binds nothing Postgres refuses');
DB::disableQueryLog();
$filters = [
    ['key' => 'brand', 'type' => 'multiple'],
    ['key' => 'tags', 'type' => 'multiple', 'default' => ['new']],
    ['key' => 'status', 'type' => 'select', 'default' => ['live']],
    ['key' => 'placed', 'type' => 'daterange', 'default' => ['2026-01-01', '']],
];
$values = TableQuery::filters(Request::create($bad), $filters);
$check($values, ['brand' => ['acme'], 'tags' => ['new'], 'status' => ['live'], 'placed' => ['2026-01-01', '']], 'filters drop a value Postgres refuses, and a filter of nothing else takes its default');
$check(TableQuery::filters(Request::create('/?tags%5B%5D=&tags%5B%5D=%FF'), $filters)['tags'], [], 'an empty value beside one Postgres refuses still says none');
$pg = Brand::on('pgsql')->whereIn('brand', $values['brand'])->whereIn('status', $values['status']);
TableQuery::search($pg, ['name'], TableQuery::view(Request::create($bad), ['name'])['search']);
$check([$pg->toSql(), $pg->getBindings()], ['select * from "brands" where "brand" in (?) and "status" in (?)', ['acme', 'live']], 'what the filters and search build on Postgres binds no NUL or invalid UTF-8');
foreach (["a\0b", "\xFF", "caf\xC3"] as $term) {
    TableQuery::search($pg = Brand::on('pgsql'), ['name'], $term);
    $check([$pg->toSql(), $pg->getBindings()], ['select * from "brands"', []], 'search() called directly ignores '.json_encode(bin2hex($term)));
}
$check(json_encode(TableQuery::view(Request::create($bad), ['name']) + ['filters' => $values]) !== false, true, 'the view goes back to the page as JSON');

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

// a bulk action over everything matching: DataTable posts the search and filters it showed, and selection() reads them
// back with the URL's checks. ConvertEmptyStringsToNull turns every "" in a JSON body into null, so both are sent
$post = fn (mixed $selection): Request => Request::create('/bulk', 'POST', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode(['action' => 'archive', 'selection' => $selection], JSON_THROW_ON_ERROR));
$form = fn (array $selection): Request => Request::create('/bulk', 'POST', ['action' => 'archive', 'selection' => $selection]);
$selected = fn (Request $request): array => TableQuery::selection($request, $table['filters']);
$none = $fixture['view']['filters'];
$matching = fn (mixed $filters, mixed $search = ''): array => ['mode' => 'matching', 'search' => $search, 'filters' => $filters, 'count' => 3];
$nulls = fn (array $filters): array => array_map(fn (array $values): array => array_map(fn (string $v): ?string => $v === '' ? null : $v, $values), $filters);

foreach ($fixture['cases'] as $case) {
    $expected = [...$none, ...$case['view']['filters'] ?? []];
    $check($selected($post($matching($expected)))['filters'], $expected, 'body: the filters the browser read from '.$case['what']);
    $check($selected($post($matching($nulls($expected))))['filters'], $expected, 'body, "" as null: the filters the browser read from '.$case['what']);
}

$check($selected($post($matching([], null))), ['search' => '', 'filters' => $none], 'body: a null search, as an empty one arrives, is no search');
TableQuery::search($q = Brand::query(), ['name'], null);
$check($q->pluck('name')->all(), ['Calpol', 'Anadin', 'Boots'], 'search() takes null as no search');
$check($selected($post($matching([
    'brand' => ['acme', 'boots'], 'status' => ['draft'], 'featured' => ['1'], 'placed' => ['2026-03-01', '2026-02-01'],
], ' anad '))), ['search' => 'anad', 'filters' => [
    'brand' => ['acme', 'boots'], 'status' => ['draft'], 'featured' => ['1'], 'placed' => ['2026-02-01', '2026-03-01'],
]], 'body: reads the search trimmed and each filter, a reversed range turned round');
$check($selected($post($matching(['brand' => [], 'status' => [], 'featured' => [], 'placed' => []]))), ['search' => '', 'filters' => [
    'brand' => [], 'status' => [], 'featured' => [], 'placed' => [],
]], 'body: a filter sent empty is none, not its default');
$check($selected($post($matching(['status' => [null], 'featured' => [null], 'placed' => [null, null]])))['filters'], [...$none, 'status' => [], 'featured' => [], 'placed' => []], 'body: a null value is empty');
$check($selected($post($matching(['brand' => [['acme'], 'boots'], 'status' => [['draft']], 'featured' => [['1']], 'placed' => [['2026-01-01'], '2026-02-01']], ['anad']))), ['search' => '', 'filters' => [
    'brand' => ['boots'], 'status' => ['live'], 'featured' => [], 'placed' => ['', '2026-02-01'],
]], 'body: a nested array is dropped from a list, and is absent anywhere else');
$check($selected($post($matching(['brand' => ["b\0lt", 'acme'], 'status' => ["dr\0aft"], 'featured' => ["1\0"], 'placed' => ["2026-01-01\0", '2026-02-01']], "a\0b"))), ['search' => '', 'filters' => [
    'brand' => ['acme'], 'status' => ['live'], 'featured' => [], 'placed' => ['', '2026-02-01'],
]], 'body: a value with a NUL byte is absent, as in the URL');
$check($selected($post($matching(['brand' => ["\u{FFFD}"], 'status' => ["a\u{FFFD}"]], "\u{FFFD}"))), ['search' => '', 'filters' => $none], 'body: the replacement character is absent too, and a list of nothing else takes its default');
// JSON cannot carry invalid UTF-8, but a form body can
$check($selected($form($matching(['brand' => ["\xFF", 'acme'], 'status' => ["caf\xC3"], 'placed' => ["\xFF", '2026-02-01']], "\xFF"))), ['search' => '', 'filters' => [
    ...$none, 'brand' => ['acme'], 'placed' => ['', '2026-02-01'],
]], 'body: a value that is not UTF-8 is absent');
$check($selected($post($matching(['brand' => 'acme', 'status' => 'draft', 'featured' => true, 'placed' => '2026-02-01'])))['filters'], $none, 'body: a value that is not a list is absent, so takes its default');
$check($selected($post($matching(['status' => ['draft', 'sold'], 'featured' => ['1', '1'], 'placed' => ['2026-02-01']])))['filters'], $none, 'body: a select or boolean of two values, or a range of one end, is absent');
$check($selected($post($matching(['placed' => ['2026-02-30', 'soon']])))['filters'], [...$none, 'placed' => []], 'body: a range of impossible dates is no range');
foreach (['a string' => $matching('status'), 'a list' => $matching([['draft']]), 'no filters' => ['mode' => 'matching'], 'a string selection' => 'everything', 'no selection' => null] as $what => $selection) {
    $check($selected($post($selection)), ['search' => '', 'filters' => $none], "body: filters as $what are the defaults");
}
$check(TableQuery::selection($post(['products' => $matching(['status' => ['draft']], 'anad')]), $table['filters'], key: 'selection.products'), ['search' => 'anad', 'filters' => [...$none, 'status' => ['draft']]], 'body: reads the selection under another key');
$sent = $selected($post($matching(['brand' => ["b\0lt", 'acme', ['x']], 'status' => ["dr\0aft"]], "a\0b")));
$pg = Brand::on('pgsql')->whereIn('brand', $sent['filters']['brand'])->whereIn('status', $sent['filters']['status']);
TableQuery::search($pg, ['name'], $sent['search']);
$check([$pg->toSql(), $pg->getBindings()], ['select * from "brands" where "brand" in (?) and "status" in (?)', ['acme', 'live']], 'what a bulk selection builds on Postgres binds no NUL or nested array');

echo "TableQuery: all checks passed\n";

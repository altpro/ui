<?php

namespace Altpro\Ui;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Search, sort, filters and pagination for a server-driven DataTable.vue.
 *
 * The component keeps its view in the query string; this reads it back the
 * way readView() in resources/js/dataTable.ts does, and tests/table-urls.json
 * holds both sides to that. A sort column arrives from the browser and ends up
 * as an identifier in `order by`, so it is checked against the list the server
 * holds, here, where no controller can forget to.
 *
 * Filter values are read here; what they mean stays in the controller, as
 * `when()` clauses, since a generic filter language would say less than the clause.
 */
final class TableQuery
{
    /**
     * Page sizes the picker offers, from resources/js/dataTable.json, which
     * DataTable.vue reads too. Anything else in the URL is ignored, so a
     * hand-typed `per_page=100000` cannot ask the database for everything.
     *
     * @return array<int, int>
     */
    public static function pageSizes(): array
    {
        return self::sizes()['pageSizes'];
    }

    /**
     * `$sortable` takes `['name']` when the column and the parameter share a
     * name, or `['sent_at' => 'created_at']` when they do not. `$name` prefixes
     * every parameter and matches the component's `name` prop. `$perPage`
     * defaults to the shared default page size.
     *
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  array<int, string>  $searchable
     * @param  array<int|string, string>  $sortable
     * @return LengthAwarePaginator<int, TModel>
     */
    public static function paginate(
        Builder $query,
        Request $request,
        array $searchable = [],
        array $sortable = [],
        ?string $name = null,
        ?string $defaultSort = null,
        string $defaultDirection = 'asc',
        ?int $perPage = null,
    ): LengthAwarePaginator {
        $columns = [];

        foreach ($sortable as $key => $column) {
            $columns[is_int($key) ? $column : $key] = $column;
        }

        $view = self::view($request, array_keys($columns), $name, $defaultSort, $defaultDirection);

        self::search($query, $searchable, $view['search']);

        if (isset($columns[$view['sort']])) {
            $query->orderBy($columns[$view['sort']], $view['direction']);
        }

        $perPage = $view['perPage'] ?? $perPage ?? self::sizes()['defaultPageSize'];
        $pageName = self::parameter($name, 'page');
        $paginator = (clone $query)->paginate($perPage, pageName: $pageName, page: $view['page']);

        // past the end, where an old link or a shrunk list leaves it: show the last page, as client mode does
        if ($paginator->currentPage() > $paginator->lastPage()) {
            $paginator = $query->paginate($perPage, pageName: $pageName, page: $paginator->lastPage());
        }

        return $paginator->withQueryString();
    }

    /**
     * The view the query string asks for, without the filters (see filters()),
     * plus the page size it asks for: null when that is not one on offer.
     *
     * @param  array<int, string>  $sortable  keys a URL may sort by; any other falls back to `$defaultSort`
     * @return array{search: string, sort: string, direction: 'asc'|'desc', page: int, perPage: int|null}
     */
    public static function view(
        Request $request,
        array $sortable = [],
        ?string $name = null,
        ?string $defaultSort = null,
        string $defaultDirection = 'asc',
    ): array {
        // an array (`sort[]=`) is another parameter to the browser, so it reads as absent
        $at = static function (string $key) use ($request, $name): string {
            $value = $request->query(self::parameter($name, $key));

            return is_string($value) ? $value : '';
        };

        $sort = $at('sort');
        $direction = $at('dir');
        $page = $at('page');
        $perPage = $at('per_page');

        return [
            'search' => trim($at('search')),
            'sort' => in_array($sort, $sortable, true) ? $sort : ($defaultSort ?? ''),
            'direction' => match ($direction) {
                'asc', 'desc' => $direction,
                default => $defaultDirection === 'desc' ? 'desc' : 'asc',
            },
            'page' => preg_match('/^[1-9][0-9]*$/', $page) === 1 ? (int) $page : 1,
            'perPage' => in_array($perPage, array_map(strval(...), self::pageSizes()), true) ? (int) $perPage : null,
        ];
    }

    /**
     * Each declared filter's values, keyed by filter key. `$filters` is the
     * array the page hands DataTable's `filters` prop: `key`, `type` and
     * `default` are read here. A `multiple` filter is `{name}_{key}[]`, any
     * other `{name}_{key}`. An absent filter gets its default; one present but
     * empty gets nothing. Values are not checked against `options`, as in client mode.
     *
     * @param  array<int, array<string, mixed>>  $filters
     * @return array<string, array<int, string>>
     */
    public static function filters(Request $request, array $filters, ?string $name = null): array
    {
        $values = [];

        foreach ($filters as $filter) {
            $key = self::parameter($name, $filter['key']);
            $value = $request->query($key);
            $multiple = $filter['type'] === 'multiple';

            // the wrong shape for the type (`brand=` for a multiple, `brand[]=` for a select) is another
            // parameter to the browser, so absent. A null is `brand=` after ConvertEmptyStringsToNull.
            $values[$filter['key']] = match (true) {
                ! $request->query->has($key) || $multiple !== is_array($value) => $filter['default'] ?? [],
                $multiple => array_values(array_filter($value, static fn ($v): bool => is_string($v) && $v !== '')),
                default => is_string($value) && $value !== '' ? [$value] : [],
            };
        }

        return $values;
    }

    /**
     * Public so a bulk action over "everything matching" re-runs the search the
     * table showed, the same way, rather than a second way that could disagree.
     *
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  array<int, string>  $searchable
     */
    public static function search(Builder $query, array $searchable, string $term): void
    {
        $term = trim($term);

        if ($term === '' || $searchable === []) {
            return;
        }

        // ponytail: a typed % or _ stays a wildcard, as elsewhere in Laravel. Escaping
        // needs an explicit ESCAPE clause to agree on MySQL and SQLite; add it if a literal matters.
        $pattern = '%'.$term.'%';

        $query->where(static function (Builder $query) use ($searchable, $pattern): void {
            foreach ($searchable as $column) {
                $query->orWhere($column, 'like', $pattern);
            }
        });
    }

    private static function parameter(?string $name, string $key): string
    {
        return ($name ?? '') === '' ? $key : $name.'_'.$key;
    }

    /** @return array{pageSizes: array<int, int>, defaultPageSize: int} */
    private static function sizes(): array
    {
        static $sizes;

        return $sizes ??= json_decode((string) file_get_contents(__DIR__.'/../resources/js/dataTable.json'), true, flags: JSON_THROW_ON_ERROR);
    }
}

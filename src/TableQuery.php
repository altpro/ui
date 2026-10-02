<?php

namespace Altpro\Ui;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Search, sort and pagination for a server-driven DataTable.vue.
 *
 * The component keeps its state in the query string; this reads the same
 * parameters back. A sort column arrives from the browser and ends up as an
 * identifier in `order by`, so it is checked against the list the server
 * holds, here, where no controller can forget to.
 *
 * Filters stay in the controller: they are `when()` clauses over domain
 * meaning, and a generic filter language would say less than the clause.
 */
final class TableQuery
{
    /**
     * Page sizes the picker offers. Anything else in the URL is ignored, so a
     * hand-typed `per_page=100000` cannot ask the database for everything.
     * Keep in step with PAGE_SIZES in resources/js/dataTable.ts.
     *
     * @var array<int, int>
     */
    public const array PAGE_SIZES = [10, 25, 50, 100];

    /**
     * `$sortable` takes `['name']` when the column and the parameter share a
     * name, or `['sent_at' => 'created_at']` when they do not. `$name` prefixes
     * every parameter and matches the component's `name` prop.
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
        int $perPage = 25,
    ): LengthAwarePaginator {
        $parameter = static fn (string $key): string => $name === null ? $key : $name.'_'.$key;

        self::search($query, $searchable, (string) $request->query($parameter('search'), ''));
        self::sort($query, $sortable, $request, $parameter, $defaultSort, $defaultDirection);

        $requested = (int) $request->query($parameter('per_page'), 0);

        return $query->paginate(
            perPage: in_array($requested, self::PAGE_SIZES, true) ? $requested : $perPage,
            pageName: $parameter('page'),
        )->withQueryString();
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

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  array<int|string, string>  $sortable
     * @param  callable(string): string  $parameter
     */
    private static function sort(
        Builder $query,
        array $sortable,
        Request $request,
        callable $parameter,
        ?string $defaultSort,
        string $defaultDirection,
    ): void {
        $columns = [];

        foreach ($sortable as $key => $column) {
            $columns[is_int($key) ? $column : $key] = $column;
        }

        $requested = (string) $request->query($parameter('sort'), '');
        $sort = array_key_exists($requested, $columns) ? $requested : $defaultSort;

        if ($sort === null || ! array_key_exists($sort, $columns)) {
            return;
        }

        $direction = match ($request->query($parameter('dir'))) {
            'asc' => 'asc',
            'desc' => 'desc',
            default => $defaultDirection === 'desc' ? 'desc' : 'asc',
        };

        $query->orderBy($columns[$sort], $direction);
    }
}

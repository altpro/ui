<?php

namespace Altpro\Ui;

use DateTimeImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Expression;
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
    /** The highest page a URL can ask for; readView() in dataTable.ts stops at the same. */
    private const MAX_PAGE = 1_000_000_000;

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
     * every parameter and matches the component's `name` prop. `$defaultSort`
     * defaults to the first sortable key, and `$perPage` to the shared default page size.
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

        // rows tied on a repeated name, status or date come back in no set order, so one could
        // turn up on two pages and another on neither; the key settles the tie
        $query->orderBy($query->getModel()->getQualifiedKeyName(), $view['direction']);

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
     * @param  array<int, string>  $sortable  keys a URL may sort by; any other falls back to `$defaultSort`, or without one the first of these
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
            [, $value] = self::query($request, self::parameter($name, $key));

            return is_string($value) ? $value : '';
        };

        $sort = $at('sort');
        $direction = $at('dir');
        $page = $at('page');
        $perPage = $at('per_page');

        return [
            'search' => trim($at('search')),
            // with no default, the first sortable key, as DataTable takes its first sortable column
            'sort' => in_array($sort, $sortable, true) ? $sort : ($defaultSort ?? array_values($sortable)[0] ?? ''),
            'direction' => match ($direction) {
                'asc', 'desc' => $direction,
                default => $defaultDirection === 'desc' ? 'desc' : 'asc',
            },
            // a page past a billion is past the end of any list, and kept there so the offset stays an int
            'page' => preg_match('/^[1-9][0-9]*$/', $page) === 1 ? min((int) $page, self::MAX_PAGE) : 1,
            'perPage' => in_array($perPage, array_map(strval(...), self::pageSizes()), true) ? (int) $perPage : null,
        ];
    }

    /**
     * Each declared filter's values, keyed by filter key. `$filters` is the
     * array the page hands DataTable's `filters` prop: `key`, `type` and
     * `default` are read here. A `multiple` filter is `{name}_{key}[]`, a
     * `daterange` `{name}_{key}_from` and `_to` (see dateRange()), any other
     * `{name}_{key}`. An absent filter gets its default; one present but
     * empty gets nothing. Values are not checked against `options`, as in client mode.
     *
     * @param  array<int, array<string, mixed>>  $filters
     * @return array<string, array<int, string>>
     */
    public static function filters(Request $request, array $filters, ?string $name = null): array
    {
        return self::read(static fn (string $key): array => self::query($request, $key), $filters, $name);
    }

    /**
     * The search and filters of a "Select all N matching" selection, read from the request body
     * (`selection.search` and `selection.filters`, or under `$key`) with the checks view() and
     * filters() give the URL, and in their shapes: the search trimmed, '' for none, and the
     * filters as filters() returns them, from the same declared `$filters`. A filter's value is
     * the array DataTable sends: a select or boolean `[value]` or `[]`, a daterange `[from, to]`
     * or `[]`. The wrong shape, a nested array, a NUL byte or invalid UTF-8 reads as absent, as
     * in the URL, so the filter gets its default; a null, which ConvertEmptyStringsToNull makes
     * of `""`, is empty. Which rows (ids or matching) and what an action means stay the controller's.
     *
     * @param  array<int, array<string, mixed>>  $filters
     * @return array{search: string, filters: array<string, array<int, string>>}
     */
    public static function selection(Request $request, array $filters, string $key = 'selection'): array
    {
        $selection = $request->input($key);
        $sent = is_array($selection) && is_array($selection['filters'] ?? null) ? $selection['filters'] : [];
        $search = is_array($selection) && is_string($selection['search'] ?? null) ? trim($selection['search']) : '';
        $params = [];

        // the body's arrays, as the URL parameters filters() reads: `[value]` is `key=value`, `[from, to]` `key_from` and `key_to`
        // anything else, a string or a list of the wrong length, is no parameter, so absent
        foreach ($filters as $filter) {
            $key = $filter['key'];
            $value = $sent[$key] ?? null;

            if (! is_array($value)) {
                continue;
            }

            $list = array_values($value);

            if ($filter['type'] === 'multiple') {
                $params[$key] = $value;
            } elseif ($filter['type'] === 'daterange' && in_array(count($list), [0, 2], true)) {
                [$params["{$key}_from"], $params["{$key}_to"]] = $list + [null, null];
            } elseif ($filter['type'] !== 'daterange' && count($list) <= 1) {
                $params[$key] = $list[0] ?? null;
            }
        }

        return [
            'search' => self::readable($search) ? $search : '',
            'filters' => self::read(static fn (string $key): array => array_key_exists($key, $params) ? self::checked(true, $params[$key]) : [false, null], $filters, null),
        ];
    }

    /**
     * filters(), from wherever `$at` reads a parameter: it gives whether there is one, and its value, checked.
     *
     * @param  \Closure(string): array{0: bool, 1: mixed}  $at
     * @param  array<int, array<string, mixed>>  $filters
     * @return array<string, array<int, string>>
     */
    private static function read(\Closure $at, array $filters, ?string $name): array
    {
        $values = [];

        foreach ($filters as $filter) {
            $key = self::parameter($name, $filter['key']);

            if ($filter['type'] === 'daterange') {
                $values[$filter['key']] = self::dateRange($at, $key, $filter['default'] ?? []);

                continue;
            }

            [$present, $value] = $at($key);
            $multiple = $filter['type'] === 'multiple';

            // the wrong shape for the type (`brand=` for a multiple, `brand[]=` for a select) is another
            // parameter to the browser, so absent. A null is `brand=` after ConvertEmptyStringsToNull.
            $values[$filter['key']] = match (true) {
                ! $present || $multiple !== is_array($value) => $filter['default'] ?? [],
                $multiple => array_values(array_filter($value, static fn ($v): bool => is_string($v) && $v !== '')),
                default => is_string($value) && $value !== '' ? [$value] : [],
            };
        }

        return $values;
    }

    /**
     * Public so a bulk action over "everything matching" re-runs the search the
     * table showed, the same way, rather than a second way that could disagree.
     * Take the term from selection(). A null, which ConvertEmptyStringsToNull
     * makes of an empty search, is no search.
     *
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  array<int, string>  $searchable
     */
    public static function search(Builder $query, array $searchable, ?string $term): void
    {
        $term = trim($term ?? '');

        // as view() reads it: a term no database takes is no term
        if ($term === '' || ! self::readable($term) || $searchable === []) {
            return;
        }

        // ponytail: a typed % or _ stays a wildcard, as elsewhere in Laravel. Escaping
        // needs an explicit ESCAPE clause to agree on MySQL and SQLite; add it if a literal matters.
        $pattern = '%'.$term.'%';

        $query->where(static function (Builder $query) use ($searchable, $pattern): void {
            foreach ($searchable as $column) {
                // MySQL's json_unquote() returns a binary-collated string, so a JSON path
                // matches case-sensitively there; lowering both sides makes it agree with the rest
                str_contains($column, '->')
                    ? $query->orWhereLike(new Expression('lower('.$query->getGrammar()->wrap($column).')'), mb_strtolower($pattern))
                    : $query->orWhereLike($column, $pattern);
            }
        });
    }

    /**
     * `[from, to]` as Y-m-d, either of which may be '', or [] for no range.
     * Either end present speaks for the range; with neither, the default applies.
     * An invalid date is dropped and a reversed range turned round.
     *
     * @param  \Closure(string): array{0: bool, 1: mixed}  $at
     * @param  array<int, string>  $default
     * @return array<int, string>
     */
    private static function dateRange(\Closure $at, string $key, array $default): array
    {
        $present = false;
        $ends = [];

        foreach (["{$key}_from", "{$key}_to"] as $end) {
            [$has, $value] = $at($end);
            // as for a select, an array (`placed_from[]=`) is another parameter to the browser, so absent
            $present = $present || ($has && ! is_array($value));
            // a day as a date input writes it; 2026-02-30 rolls over into March, so it is not one.
            // The pattern goes first: createFromFormat throws on a null byte (`%00`)
            $date = is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value) === 1
                ? DateTimeImmutable::createFromFormat('!Y-m-d', $value)
                : false;
            $ends[] = $date !== false && $date->format('Y-m-d') === $value ? $value : '';
        }

        [$from, $to] = $ends;

        return match (true) {
            ! $present => $default,
            $from === '' && $to === '' => [],
            $from !== '' && $to !== '' && $from > $to => [$to, $from],
            default => $ends,
        };
    }

    /**
     * Whether it has the parameter, and its value. A value no database takes (see readable()) is not
     * in the URL, as readView() reads it; in a list, nor is such an entry, or a list of nothing else.
     *
     * @return array{0: bool, 1: mixed}
     */
    private static function query(Request $request, string $key): array
    {
        return self::checked($request->query->has($key), $request->query($key));
    }

    /**
     * query()'s check, for a value from anywhere: given whether it is there, and what it is.
     *
     * @return array{0: bool, 1: mixed}
     */
    private static function checked(bool $has, mixed $value): array
    {
        if (is_array($value) && $value !== []) {
            $value = array_filter($value, static fn ($v): bool => ! is_string($v) || self::readable($v));

            return [$value !== [], $value];
        }

        return is_string($value) && ! self::readable($value) ? [false, null] : [$has, $value];
    }

    /**
     * Postgres refuses a NUL byte and invalid UTF-8 (SQLSTATE 22021) even bound, and json_encode() the
     * latter, so a URL a bot made up would be a 500. U+FFFD is what the browser reads invalid UTF-8 as,
     * so it goes too, or readView() would read a view this does not.
     */
    private static function readable(string $value): bool
    {
        return mb_check_encoding($value, 'UTF-8') && ! str_contains($value, "\0") && ! str_contains($value, "\u{FFFD}");
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

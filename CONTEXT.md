# altpro/ui

A CSS component layer for Tailwind v4, with Blade and Vue components where markup or state earns them.

## DataTable

**Client mode**:
The table holds every row and does the searching, filtering, sorting and paging itself.
_Avoid_: local mode, array mode

**Server mode**:
The table gets one page of a Laravel paginator; the server did the searching, filtering, sorting and paging.
_Avoid_: remote mode, paginated mode

**View**:
The search, filters, sort and page: what a link to the table reproduces. It lives in the query string.
_Avoid_: state, query (when meaning all four)

**Preference**:
A per-device choice that is not part of the view: page size and hidden columns. A shared link does not carry it.
_Avoid_: setting, option

**Unfiltered total**:
How many rows the table has before any search or filter. It tells an empty table ("nothing yet") from one with no matches ("nothing matches").

**Filter declaration**:
A table's filters as a list of key, label, type, options and default. In server mode the controller builds it once, reads the URL with it through `TableQuery::filters()`, and hands it to the page as DataTable's `filters` prop.
_Avoid_: filter config, filter schema

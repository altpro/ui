# altpro/ui

A CSS component layer for Tailwind v4, with Blade and Vue components where markup or state earns them.

## DataTable

**List**:
Records with search, filters and paging in the query string, whatever draws them. `DataList.vue` is the frame; DataTable and DataTimeline are lists. A table's vocabulary below applies to every list.
_Avoid_: collection, feed (when meaning any list)

**Client mode**:
The table holds every row and does the searching, filtering, sorting and paging itself.
_Avoid_: local mode, array mode

**Server mode**:
The table gets one page of a Laravel paginator; the server did the searching, filtering, sorting and paging.
_Avoid_: remote mode, paginated mode

**View**:
The search, filters, sort and page: what a link to the table reproduces. It lives in the query string.
_Avoid_: state, query (when meaning all four)

**Latest filters** and **latest sort**:
The filters and sort as last asked for, ahead of the view while a server visit is on its way. Controls show them; the rows and the badge answer the view.

**Draft**:
Filters being picked in a filter drawer, which change nothing until Apply commits them.
_Avoid_: pending filters

**In force**:
A filter holding a value, whether the reader chose it or it is the default. What the Filters badge counts unless told to count only what the reader changed.

**Preference**:
A per-device choice that is not part of the view: page size and hidden columns. A shared link does not carry it.
_Avoid_: setting, option

**Unfiltered total**:
How many rows the table has before any search or filter. It tells an empty table ("nothing yet") from one with no matches ("nothing matches").

**Filter declaration**:
A table's filters as a list of key, label, type, options and default. In server mode the controller builds it once, reads the URL with it through `TableQuery::filters()`, and hands it to the page as DataTable's `filters` prop.
_Avoid_: filter config, filter schema

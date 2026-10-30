# Data tables: sort and column filters

Every `DataTable` column decides whether it can be sorted, filtered, both, or neither.
The header shows the controls; the API (or the table itself for fully loaded data) does the work.

## Which control a column gets

| Column holds | Sort | Filter | Examples |
| --- | --- | --- | --- |
| Row number, actions, checkboxes, menus | no | no | `No.`, `⋯`, select |
| Long or composite cells | no | no | descriptions, notes, avatar + name + role stacks, progress breakdowns, file links |
| Unique identifiers and names | yes | no | tag number, drawing no, document no, SR/IPO number, email, title, name |
| Dates and times | yes | no | created, updated, effective date, deadline |
| Numbers and measures | yes | no | quantity, total, health index, progress %, count |
| Categories with few values | no | yes | status, type, category, drawing type, platform, role, department, yes/no |
| Ordered categories | yes | yes | priority, criticality, risk level, revision |
| Names that repeat across rows | yes | yes | customer, company, manufacturer, valve type, template, PIC |

When unsure: a value that repeats across rows is filterable; a value you would scan in order is sortable.

## Frontend

```tsx
const table = useTableQuery({ onChange: () => setPage(1) });
const { data } = useQuery({
    queryKey: ["things", page, limit, search, table.params],
    queryFn: () => getThings({ page, limit, search, ...table.params }),
});

<DataTable {...table.tableProps} facets={data?.facets} ... />
```

Columns opt in through `meta`:

```tsx
{
    accessorKey: "status",
    header: t("columns.status"),
    meta: { filterKey: "status", filterLabel: (value) => t(`status.${value}`) },
},
{ accessorKey: "updated_at", header: t("columns.updated"), meta: { sortKey: "updated_at" } },
```

- `header` stays plain text (or set `meta.label`). The table draws the sort toggle and filter button.
- Tables that load all their rows at once (no API paging) skip `useTableQuery`: with `meta` only, `DataTable` sorts and filters on its own and counts the filter values from the rows. The column needs an `accessorKey`/`accessorFn` whose value is what the filter shows.
- `filterLabel` translates the values in the filter list, like the cell does.
- Request params: `sort`, `direction`, `columns[key][]`. An empty cell is the value `__blank__`.

## Backend (leave API) — not implemented yet

The leave API does not accept `sort`/`direction`/`columns[key][]` and returns no `facets` today; the request contract below is what the frontend already sends and what `docs/backend-task.md` asks the API to adopt (the reference implementation lives in the `laravel-tailwind` repository as `App\Support\Table\TableQuery`). Until then `GET /api/leave-request` returns the whole list, so `LeaveRequestTable` runs `DataTable` in client mode: `meta.sortKey` and `meta.filterKey` sort and filter the loaded rows and the facets are counted from them.

`App\Support\Table\TableQuery` with `TableFilter` gives every list endpoint the same contract:

```php
$table = new TableQuery($request,
    sortable: ['name' => 'name', 'updated_at' => 'updated_at'],
    filterable: [
        'status' => TableFilter::options('status', ['draft' => 'Draft', 'published' => 'Published']),
        'company' => TableFilter::column('company_id', fn ($ids) => Company::whereIn('id', $ids)->pluck('name', 'id')->all()),
    ],
);
$base = fn () => Thing::query()->when($search, ...);       // search and non-column filters

$page = $table->filter($table->sort($base(), 'updated_at', 'desc'))->paginate($limit);

return response()->json([... 'data' => ..., 'meta' => ..., 'facets' => $table->facets($base)]);
```

- Only whitelisted keys are sorted or filtered; anything else is ignored.
- Filters are OR within a column and AND across columns. A column's facet counts rows under the other columns' filters, so its own list stays complete.
- Relations: filter on the foreign key and label through `TableFilter::column(..., $labels)`; anything more complex uses `TableFilter::custom($apply, $facet)`.
- Lists built in PHP (computed statuses) apply the same params to the collection and return `facets` in the same shape.

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

## No tabs or filter dropdowns

Lists do not get tab bars or toolbar dropdowns for status, department, role, period and the like:
those are header filters on the column that shows the value. The toolbar keeps only the search box and
the primary action. A list that should open narrowed passes `useListParams({ defaultFilters })`
(holidays open on the current year; `?scope=approvals` links open leave on "pending").

## Backend (leave API)

Every list endpoint reads `columns[key][]` and answers `meta.facets` through
`App\Support\Table\ColumnFilters` + `ColumnFilter`:

```php
$columns = new ColumnFilters($request, [
    'department' => ColumnFilter::column('department_id', fn (array $ids) => Department::whereIn('id', $ids)->pluck('name', 'id')->all()),
    'status'     => ColumnFilter::column('status'),                    // label = value; the frontend translates
    'year'       => ColumnFilter::custom($apply, $facets),             // computed values
]);
$base = fn () => Employee::query()->when($search, ...);               // search and scope, no filters

$page = $columns->apply($base()->with(...))->orderBy(...)->paginate($limit);

return $this->sendPaginated($page, null, $message, ['facets' => $columns->facets($base)]);
```

- Only the keys listed are filtered; anything else is ignored.
- Filters are OR within a column and AND across columns. A column's facet counts rows under the other
  columns' filters, so its own list stays complete. An empty cell is `__blank__`.
- Sorting still uses each endpoint's `sort_by` / `sort_dir` whitelist.

| List | Header filters |
| --- | --- |
| Employees | department, supervisor, employment_type, grade, status |
| Users | role, status |
| Permissions | group |
| Holidays | year (date column), type |
| Leave balances | department |
| Leave requests | requester (approvers), status |
| Appraisals (my / team / reports) | employee, period, assessor, status |
| Appraisal periods | status |
| Appraisal templates | status |

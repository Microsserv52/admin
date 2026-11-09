"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shell } from "@/components/shell";
import { useSession, isAdmin } from "@/components/session";
import { Loading, Failure, Empty } from "@/components/feedback";
import { api, money } from "@/lib/api";
import {
  accountsSchema,
  newProductSchema,
  productSchema,
  productsSchema,
  type Account,
  type Product,
} from "@/lib/contracts";
import "./admin.css";

type Screen = "overview" | "products" | "accounts" | "observability";
const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
});
const productHelper = createColumnHelper<typeof features, Product>();
const accountHelper = createColumnHelper<typeof features, Account>();

export function AdminView({ screen }: { screen: Screen }) {
  const session = useSession();
  return (
    <Shell>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p className="section-label">DEMO MANAGEMENT</p>
          <nav aria-label="Admin navigation">
            {(
              [
                ["overview", "/admin/", "Overview"],
                ["products", "/admin/products/", "Products"],
                ["accounts", "/admin/accounts/", "Accounts"],
                ["observability", "/admin/observability/", "Observability"],
              ] as const
            ).map(([key, href, label]) => (
              <a
                key={key}
                href={href}
                aria-current={screen === key ? "page" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
          <p className="muted">
            Demo data only.
            <br />
            No real transactions.
          </p>
        </aside>
        <section className="admin-content">
          <h1 className="sr-only">Microsserv52 administration: {screen}</h1>
          {session.loading ? (
            <Loading label="Checking admin access…" />
          ) : session.error ? (
            <Failure
              error={session.error}
              retry={() => void session.refresh()}
            />
          ) : !session.account ? (
            <Empty title="Sign in to manage the demo.">
              <Button
                variant="contained"
                href={
                  "/store/login/?returnTo=" +
                  encodeURIComponent(
                    "/admin/" + (screen === "overview" ? "" : screen + "/"),
                  )
                }
              >
                Sign in
              </Button>
            </Empty>
          ) : !isAdmin(session.account) ? (
            <Empty title="This area is for administrators.">
              <p>Your account can browse the catalog and create demo orders.</p>
              <Button href="/store/" variant="outlined">
                Back to catalog
              </Button>
            </Empty>
          ) : (
            <>
              {screen === "overview" && <Overview />}
              {screen === "products" && <Products />}
              {screen === "accounts" && <Accounts />}
              {screen === "observability" && <Observability />}
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}
function Heading({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <p className="section-label">MICROSSERV52 ADMIN</p>
      <h2 className="page-title">{title}</h2>
      {children}
    </div>
  );
}
function Overview() {
  const products = useQuery({
    queryKey: ["products"],
    queryFn: ({ signal }) => api("/products", productsSchema, { signal }),
  });
  const accounts = useQuery({
    queryKey: ["accounts"],
    queryFn: ({ signal }) => api("/accounts", accountsSchema, { signal }),
  });
  return (
    <>
      <Heading title="Keep the demo in order.">
        <p className="muted">
          Manage the catalog and demo accounts. Every number below comes from
          the API.
        </p>
      </Heading>
      <div className="admin-summary">
        <article className="panel">
          <p className="section-label">CATALOG PRODUCTS</p>
          {products.isPending ? (
            <Loading />
          ) : products.error ? (
            <Failure
              error={products.error}
              retry={() => void products.refetch()}
            />
          ) : (
            <p className="metric">{products.data.length}</p>
          )}
          <a href="/admin/products/">Manage products</a>
        </article>
        <article className="panel">
          <p className="section-label">DEMO ACCOUNTS</p>
          {accounts.isPending ? (
            <Loading />
          ) : accounts.error ? (
            <Failure
              error={accounts.error}
              retry={() => void accounts.refetch()}
            />
          ) : (
            <p className="metric">{accounts.data.length}</p>
          )}
          <a href="/admin/accounts/">View accounts</a>
        </article>
      </div>
      <div className="panel admin-note">
        <h2>A learning environment.</h2>
        <p>
          Demo orders are saved for the account that creates them. The current
          API does not provide platform-wide order management, product editing
          or financial reports.
        </p>
        <Button href="/store/" variant="outlined">
          Open demo storefront
        </Button>
      </div>
    </>
  );
}
function DataTable<T extends { id: string; name: string }>({
  data,
  columns,
  search,
  caption,
}: {
  data: T[];
  columns: ColumnDef<typeof features, T, unknown>[];
  search: string;
  caption: string;
}) {
  const deferred = useDeferredValue(search);
  const filtered = useMemo(
    () =>
      data.filter((row) =>
        (row.name + ("email" in row ? " " + row.email : ""))
          .toLowerCase()
          .includes(deferred.toLowerCase()),
      ),
    [data, deferred],
  );
  const table = useTable({
    features,
    columns,
    data: filtered,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    defaultColumn: { sortFn: "alphanumeric" },
  });
  return (
    <>
      <div className="table-scroll">
        <table>
          <caption className="table-caption">
            {caption}: {filtered.length} matching records
          </caption>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : undefined
                    }
                  >
                    {header.column.getCanSort() ? (
                      <Button
                        color="inherit"
                        size="small"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted()
                          ? " (" + header.column.getIsSorted() + ")"
                          : ""}
                      </Button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getAllCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && <Empty title="No matching records." />}
      <div className="toolbar">
        <span className="muted">
          Page {table.state.pagination.pageIndex + 1} of{" "}
          {Math.max(1, table.getPageCount())}
        </span>
        <div className="actions">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous page
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next page
          </Button>
        </div>
      </div>
    </>
  );
}
function Products() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [create, setCreate] = useState(false);
  const [remove, setRemove] = useState<Product | null>(null);
  const query = useQuery({
    queryKey: ["products"],
    queryFn: ({ signal }) => api("/products", productsSchema, { signal }),
  });
  const deletion = useMutation({
    mutationFn: () =>
      api("/products/" + remove!.id, z.undefined(), { method: "DELETE" }),
    onSuccess: async () => {
      setRemove(null);
      await client.invalidateQueries({ queryKey: ["products"] });
    },
  });
  const columns = useMemo(
    () =>
      productHelper.columns([
        productHelper.accessor("name", { header: "Name" }),
        productHelper.accessor("unit", { header: "Unit" }),
        productHelper.accessor("price", {
          header: "USD price",
          sortFn: "basic",
          cell: (cell) => money(cell.getValue()),
        }),
        productHelper.display({
          id: "actions",
          header: "Actions",
          cell: (cell) => (
            <div className="actions">
              <Button href={"/store/product/?id=" + cell.row.original.id}>
                View
              </Button>
              <Button
                color="error"
                onClick={() => {
                  deletion.reset();
                  setRemove(cell.row.original);
                }}
              >
                Delete
              </Button>
            </div>
          ),
        }),
      ]),
    [deletion],
  );
  return (
    <>
      <Heading title="The demo catalog.">
        <p className="muted">
          Create or remove products from the demo catalog.
        </p>
      </Heading>
      <div className="toolbar">
        <TextField
          type="search"
          label="Search products"
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button variant="contained" onClick={() => setCreate(true)}>
          Create demo product
        </Button>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : (
        <DataTable
          data={query.data}
          columns={columns}
          search={search}
          caption="Demo products"
        />
      )}
      <CreateProduct open={create} close={() => setCreate(false)} />
      <Dialog
        open={!!remove}
        onClose={() => {
          if (!deletion.isPending) setRemove(null);
        }}
      >
        <DialogTitle>Delete {remove?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This removes the product from the demo catalog. Existing demo order
            records are not changed. This action cannot be undone here.
          </DialogContentText>
          {deletion.error && <Failure error={deletion.error} />}
        </DialogContent>
        <DialogActions>
          <Button disabled={deletion.isPending} onClick={() => setRemove(null)}>
            Cancel
          </Button>
          <Button
            color="error"
            disabled={deletion.isPending}
            onClick={() => deletion.mutate()}
          >
            {deletion.isPending ? "Deleting…" : "Delete demo product"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
function CreateProduct({ open, close }: { open: boolean; close: () => void }) {
  const client = useQueryClient();
  const form = useForm<z.infer<typeof newProductSchema>>({
    resolver: zodResolver(newProductSchema),
    defaultValues: { name: "", unit: "", price: 0 },
  });
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof newProductSchema>) =>
      api("/products", productSchema, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["products"] });
      form.reset();
      close();
    },
  });
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!mutation.isPending) close();
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Create a demo product</DialogTitle>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <DialogContent>
          <div className="form-stack">
            <TextField
              label="Product name"
              {...form.register("name")}
              error={!!form.formState.errors.name}
              helperText={form.formState.errors.name?.message}
            />
            <TextField
              label="Unit (for example, kg or item)"
              {...form.register("unit")}
              error={!!form.formState.errors.unit}
              helperText={form.formState.errors.unit?.message}
            />
            <TextField
              label="USD price"
              type="number"
              slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
              {...form.register("price", { valueAsNumber: true })}
              error={!!form.formState.errors.price}
              helperText={form.formState.errors.price?.message}
            />
            {mutation.error && <Failure error={mutation.error} />}
          </div>
        </DialogContent>
        <DialogActions>
          <Button disabled={mutation.isPending} onClick={close}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creating…" : "Create demo product"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
function Accounts() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Account | null>(null);
  const query = useQuery({
    queryKey: ["accounts"],
    queryFn: ({ signal }) => api("/accounts", accountsSchema, { signal }),
  });
  const columns = useMemo(
    () =>
      accountHelper.columns([
        accountHelper.accessor("name", { header: "Name" }),
        accountHelper.accessor("email", { header: "Email" }),
        accountHelper.accessor("roles", { header: "Roles" }),
        accountHelper.accessor("enabled", {
          header: "Status",
          cell: (cell) => (cell.getValue() ? "Enabled" : "Disabled"),
        }),
        accountHelper.display({
          id: "actions",
          header: "Actions",
          cell: (cell) => (
            <Button onClick={() => setSelected(cell.row.original)}>
              View details
            </Button>
          ),
        }),
      ]),
    [],
  );
  return (
    <>
      <Heading title="Demo accounts.">
        <p className="muted">
          View demo account details. Account changes are unavailable in this
          demo.
        </p>
      </Heading>
      <TextField
        label="Search by name or email"
        type="search"
        size="small"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{ mb: 3 }}
      />
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : (
        <DataTable
          data={query.data}
          columns={columns}
          search={search}
          caption="Demo accounts"
        />
      )}
      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth>
        <DialogTitle>Demo account details</DialogTitle>
        <DialogContent>
          <dl>
            <dt>Name</dt>
            <dd>{selected?.name}</dd>
            <dt>Email</dt>
            <dd>{selected?.email}</dd>
            <dt>Identifier</dt>
            <dd style={{ overflowWrap: "anywhere" }}>{selected?.id}</dd>
            <dt>Roles</dt>
            <dd>{selected?.roles}</dd>
            <dt>Status</dt>
            <dd>{selected?.enabled ? "Enabled" : "Disabled"}</dd>
          </dl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close details</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
function Observability() {
  return (
    <>
      <Heading title="Follow what happens.">
        <p className="muted">
          Browser diagnostics and demo usage. No payment or revenue metrics.
        </p>
      </Heading>
      <div className="form-stack">
        <article className="panel">
          <h2>Grafana Faro</h2>
          <p>
            Browser errors, timing and selected public-request traces.
            Collection requires an approved endpoint and telemetry environment
            configuration.
          </p>
          {process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_URL ? (
            <Button
              href={process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_URL}
              variant="outlined"
            >
              Open Grafana dashboard
            </Button>
          ) : (
            <Alert severity="info">Grafana dashboard is not configured.</Alert>
          )}
        </article>
        <article className="panel">
          <h2>Umami</h2>
          <p>
            Optional landing and store usage events. Admin usage analytics are
            disabled.
          </p>
          {process.env.NEXT_PUBLIC_UMAMI_DASHBOARD_URL ? (
            <Button
              href={process.env.NEXT_PUBLIC_UMAMI_DASHBOARD_URL}
              variant="outlined"
            >
              Open Umami dashboard
            </Button>
          ) : (
            <Alert severity="info">Umami dashboard is not configured.</Alert>
          )}
        </article>
      </div>
    </>
  );
}

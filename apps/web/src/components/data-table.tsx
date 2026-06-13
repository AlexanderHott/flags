import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Button } from "#/components/ui/button";
import type { Dispatch, SetStateAction } from "react";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  pages: TData[][];

  pagination: PaginationState;
  setPagination: Dispatch<SetStateAction<PaginationState>>;

  sorting: SortingState;
  setSorting: Dispatch<SetStateAction<SortingState>>;

  hasNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  isFetchingNextPage: boolean;
}

export function DataTable<TData>({
  columns,
  pages,
  pagination,
  setPagination,
  sorting,
  setSorting,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data: pages[pagination.pageIndex] ?? [],
    columns,
    state: {
      sorting,
      pagination,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: -1,
  });

  const canGoNext = pagination.pageIndex < pages.length - 1 || hasNextPage;
  console.log({ canGoNext });

  async function handleNextPage() {
    const nextPageIndex = pagination.pageIndex + 1;

    if (!pages[nextPageIndex] && hasNextPage) {
      await fetchNextPage();
    }

    setPagination((current) => ({
      ...current,
      pageIndex: current.pageIndex + 1,
    }));
  }

  return (
    <div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={!canGoNext || isFetchingNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

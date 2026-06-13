import { DataTable } from "#/components/data-table";
import { Dialog, DialogContent, DialogTrigger } from "#/components/ui/dialog";
import { FieldGroup, FieldLegend, FieldSet } from "#/components/ui/field";
import { Checkbox } from "#/components/ui/checkbox";
import { orpc } from "#/orpc/client";
import {
  keepPreviousData,
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createColumnHelper, type PaginationState } from "@tanstack/react-table";
import { Suspense, useState } from "react";
import type { RouterOutputs } from "#/orpc/client";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import { useAppForm } from "#/components/form";
import z from "zod";
import { Button } from "#/components/ui/button";
import { LinkIcon, MoreHorizontal, PlusIcon, TrashIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";

export const Route = createFileRoute("/_app/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
      <Dashboard />
  );
}

function Dashboard() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-4xl font-bold">Projects</h1>

      <Suspense>
        <ProjectsTable />
      </Suspense>
    </div>
  );
}


type Flag = RouterOutputs["project"]["list"]["projects"][number];
const columnHelper = createColumnHelper<Flag>();

function ProjectsTable() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const projectsInfiniteQuery = useSuspenseInfiniteQuery(
    orpc.project.list.infiniteOptions({
      input: (pageParam: string | undefined) => ({
        cursor: pageParam,
        limit: pagination.pageSize,
      }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => lastPage.nextId ?? undefined,
      placeholderData: keepPreviousData,
    }),
  );

  const columns = [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: ({ getValue, row }) => <Link className="font-bold" to="/dashboard/project/$projectId" params={{projectId: row.original.id}}>{getValue()}</Link>,
    }),
    columnHelper.accessor("createdAt", {
      header: "Created at",
      cell: ({ getValue }) => <div>{getValue().toLocaleString()}</div>,
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
              <div className="size-4" />
              Copy project ID
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" >
              <TrashIcon className="text-destructive-foreground" />
              <span className="text-destructive-foreground">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ];

  return (
    <div className="flex flex-col gap-4">
    <Button asChild className="w-min">
    <Link to="/dashboard/project/new">New Project <PlusIcon /></Link>
    </Button>
      <DataTable
        pagination={pagination}
        setPagination={setPagination}
        pages={projectsInfiniteQuery.data.pages.map((p) => p.projects)}
        columns={columns}
        fetchNextPage={() => projectsInfiniteQuery.fetchNextPage()}
        hasNextPage={projectsInfiniteQuery.hasNextPage}
        isFetchingNextPage={projectsInfiniteQuery.isFetchingNextPage}
      />
    </div>
  );
}

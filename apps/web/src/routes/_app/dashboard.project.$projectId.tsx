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
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createColumnHelper, type PaginationState } from "@tanstack/react-table";
import { Suspense, useState } from "react";
import type { RouterOutputs } from "#/orpc/client";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import { useAppForm } from "#/components/form";
import z from "zod";
import { Button } from "#/components/ui/button";
import { LinkIcon, MoreHorizontal, PlusIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";

export const Route = createFileRoute("/_app/dashboard/project/$projectId")({
  component: RouteComponent,
  validateSearch: z.object({ newFlagFormOpen: z.boolean().optional() }),
});

function RouteComponent() {
  return (
    <Suspense fallback={<ProjectDashboardSkeleton />}>
      <ProjectDashboard />
    </Suspense>
  );
}

function ProjectDashboard() {
  const { projectId } = Route.useParams();
  const { data: project } = useSuspenseQuery(
    orpc.project.get.queryOptions({ input: { projectId } }),
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-4xl font-bold">{project.name}</h1>

      <Suspense>
        <FlagsTable />
      </Suspense>
    </div>
  );
}

function ProjectDashboardSkeleton() {
  return <Skeleton className="w-32 h-12" />;
}

type Flag = RouterOutputs["flags"]["list"]["flags"][number];
const columnHelper = createColumnHelper<Flag>();

interface FlagSwitchProps {
  id: string;
  enabled: boolean;
}
function FlagSwitch(props: FlagSwitchProps) {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();

  const queryKey = orpc.flags.list.infiniteKey({
    input: (_pageParam: number | undefined) => ({ projectId }),
    initialPageParam: undefined,
  });

  const toggleFlagMutation = useMutation(
    orpc.flags.toggle.mutationOptions({
      onMutate: async (newFlag, context) => {
        await context.client.cancelQueries({ queryKey });
        const previousFlags = context.client.getQueryData(queryKey);
        context.client.setQueryData(
          queryKey,
          (old?: InfiniteData<{ flags: Flag[]; nextId?: string }, undefined>) => {
            if (!old) return undefined;
            const pagesNew = old.pages.map((page) =>
              page.flags.map((flag) => (flag.id === props.id ? { ...flag, ...newFlag } : flag)),
            );
            return { ...old, pages: pagesNew };
          },
        );

        return { previousFlags };
      },
      onError: (_err, _newFlag, onMutateResult, context) => {
        context.client.setQueryData(queryKey, onMutateResult?.previousFlags);
      },
      onSettled: () =>
        queryClient.invalidateQueries({
          queryKey: orpc.flags.list.queryKey({ input: { projectId } }),
        }),
    }),
  );

  return (
    <Switch
      checked={props.enabled}
      onCheckedChange={() =>
        toggleFlagMutation.mutateAsync({ projectId, flagId: props.id, enabled: !props.enabled })
      }
    />
  );
}

function FlagsTable() {
  const { projectId } = Route.useParams();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const flagsInfiniteQuery = useSuspenseInfiniteQuery(
    orpc.flags.list.infiniteOptions({
      input: (pageParam: string | undefined) => ({
        projectId,
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
      cell: ({ getValue }) => <div>{getValue()}</div>,
    }),
    columnHelper.accessor("enabled", {
      header: "Enabled",
      cell: ({ getValue, row }) => <FlagSwitch id={row.original.id} enabled={getValue()} />,
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
              Copy flag ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(
                  `${window.location.origin}/api/flag?flagId=${row.original.id}`,
                )
              }
            >
              <LinkIcon className="size-4" />
              Copy flag URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ];

  return (
    <div className="flex flex-col gap-4">
      <NewFlagFormDialog />
      <DataTable
        pagination={pagination}
        setPagination={setPagination}
        pages={flagsInfiniteQuery.data.pages.map((p) => p.flags)}
        columns={columns}
        fetchNextPage={() => flagsInfiniteQuery.fetchNextPage()}
        hasNextPage={flagsInfiniteQuery.hasNextPage}
        isFetchingNextPage={flagsInfiniteQuery.isFetchingNextPage}
      />
    </div>
  );
}

function NewFlagFormDialog() {
  const { newFlagFormOpen } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <Dialog
      open={newFlagFormOpen ?? false}
      onOpenChange={(isOpen) =>
        navigate({ to: ".", search: { newFlagFormOpen: isOpen || undefined } })
      }
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-min">
          New Flag <PlusIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <NewFlagForm />
      </DialogContent>
    </Dialog>
  );
}

function NewFlagForm() {
  const { projectId } = Route.useParams();
  const createFlagMutation = useMutation(orpc.flags.create.mutationOptions());
  const form = useAppForm({
    validators: {
      onChange: z.object({ name: z.string(), enabled: z.boolean() }),
    },
    defaultValues: {
      name: "",
      enabled: false,
    },
    onSubmit: async ({ value }) => {
      await createFlagMutation.mutateAsync({ name: value.name, enabled: value.enabled, projectId });
    },
  });

  return (
    <div className="w-full max-w-lg">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await form.handleSubmit(e);
        }}
      >
        <FieldSet>
          <FieldLegend>New Flag</FieldLegend>
          <FieldGroup>
            <form.AppField name="name" children={(field) => <field.TextField label="Name" />} />

            <form.AppField
              name="enabled"
              children={(field) => <field.SwitchField label="Enabled" />}
            />

            <FieldGroup>
              <form.AppForm>
                <form.SubmitButton>Create</form.SubmitButton>
              </form.AppForm>
            </FieldGroup>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  );
}

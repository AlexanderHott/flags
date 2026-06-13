import { DataTable } from "#/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "#/components/ui/dialog";
import { FieldGroup, FieldLegend, FieldSet } from "#/components/ui/field";
import { orpc } from "#/orpc/client";
import { useMutation, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Suspense } from "react";
import type { RouterOutputs } from "#/orpc/client";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import { useAppForm } from "#/components/form";
import z from "zod";
import { Button } from "#/components/ui/button";
import { PlusIcon } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard/project/$projectId")({
  component: RouteComponent,
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

type Flag = RouterOutputs["flags"]["list"][number];
const columnHelper = createColumnHelper<Flag>();

const columns = [
  columnHelper.display({ id: "select", header: "select" }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: ({ getValue }) => <div>{getValue()}</div>,
  }),
  columnHelper.accessor("enabled", {
    header: "Enabled",
    cell: ({ getValue }) => <Switch checked={getValue()} disabled />,
  }),
  columnHelper.accessor("createdAt", {
    header: "Created at",
    cell: ({ getValue }) => <div>{getValue().toLocaleString()}</div>,
  }),
];

function FlagsTable() {
  const { projectId } = Route.useParams();
  const flagsInfiniteQuery = useSuspenseInfiniteQuery(
    orpc.flags.list.infiniteOptions({
      input: (pageParam: number | undefined) => ({ projectId }),
      // context: { cache: true }, // Provide client context if needed
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => lastPage.length,
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <NewFlagFormDialog  />
      <DataTable data={flagsInfiniteQuery.data.pages[0]!} columns={columns} />
    </div>
  );
}

function NewFlagFormDialog() {
  return (
    <Dialog>
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

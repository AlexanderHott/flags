import { useAppForm } from "#/components/form";
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from "#/components/ui/field";
import { orpc } from "#/orpc/client";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/_app/dashboard/project/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const createProjectMutation = useMutation(orpc.project.create.mutationOptions());
  const navigate = useNavigate();
  const form = useAppForm({
    validators: {
      onChange: z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
      }),
    },
    defaultValues: {
      name: "",
      slug: "",
    },
    onSubmit: async ({ value }) => {
      const project = await createProjectMutation.mutateAsync(value);
      await navigate({ to: "/dashboard/project/$projectId", params: { projectId: project.id } });
    },
  });
  return (
    <div className="flex min-h-svh w-full justify-center p-6 md:p-10">
      <div className="w-full max-w-lg">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await form.handleSubmit(e);
          }}
        >
          <FieldSet>
            <FieldLegend>New Project</FieldLegend>
            <FieldDescription>Group related feature flags together.</FieldDescription>
            <FieldGroup>
              <form.AppField name="name" children={(field) => <field.TextField label="Name" />} />

              <form.AppField
                name="slug"
                children={(field) => <field.TextField label="Project identifier" />}
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
    </div>
  );
}

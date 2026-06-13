import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { FieldGroup, FieldDescription } from "#/components/ui/field";
import z from "zod";
import { useAppForm } from "#/components/form";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "#/orpc/client";

export const Route = createFileRoute("/login")({ component: RouteComponent });

function RouteComponent() {
  const logInMutation = useMutation(orpc.auth.logIn.mutationOptions());
  const navigate = useNavigate();
  const form = useAppForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validators: {
      onChange: z.object({
        username: z.string().min(3, { error: "Username must be at least 3 characters." }),
        password: z.string().min(1, { error: "Must enter password" }),
      }),
    },
    onSubmit: async ({ value }) => {
      await logInMutation.mutateAsync({
        username: value.username,
        password: value.password,
      });

      await navigate({ to: "/dashboard" });
    },
  });
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>Enter your information below to login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await form.handleSubmit(e);
              }}
            >
              <FieldGroup>
                <form.AppField
                  name="username"
                  children={(field) => (
                    <field.TextField label="Username" />
                  )}
                />
                <form.AppField
                  name="password"
                  children={(field) => <field.TextField label="Password" type="password" />}
                />

                <FieldGroup>
                  <form.AppForm>
                    <form.SubmitButton>Log In</form.SubmitButton>
                    <FieldDescription>
                      Don't have an account? <Link to="/signup">Sign up</Link>
                    </FieldDescription>
                  </form.AppForm>
                </FieldGroup>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

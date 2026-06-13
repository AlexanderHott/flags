import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { FieldGroup, FieldDescription } from "#/components/ui/field";
import z from "zod";
import { useAppForm } from "#/components/form";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "#/orpc/client";

export const Route = createFileRoute("/signup")({
  component: RouteComponent,
});

function RouteComponent() {
  const signUpMutation = useMutation(orpc.auth.signUp.mutationOptions());
  const navigate = useNavigate();
  const form = useAppForm({
    defaultValues: {
      username: "",
      password: "",
      passwordConfirm: "",
    },
    validators: {
      onChange: z
        .object({
          username: z.string().min(3, { error: "Username must be at least 3 characters." }),
          password: z.string().min(12, { error: "Password must be at least 12 characters." }),
          passwordConfirm: z
            .string()
            .min(12, { error: "Password must be at least 12 characters." }),
        })
        .superRefine(({ password, passwordConfirm }, ctx) => {
          if (password !== passwordConfirm) {
            ctx.addIssue({
              code: "invalid_value",
              message: "passwords don't match",
              values: [passwordConfirm],
              path: ["passwordConfirm"],
            });
          }
        }),
      // TODO: figure out why this doesn't work
      // .refine(({ password, passwordConfirm }) => password !== passwordConfirm, {
      //   error: "Passwords do not match",
      //   path: ["passwordConfirm"],
      // }),
    },
    onSubmit: async ({ value }) => {
      await signUpMutation.mutateAsync({
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
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Enter your information below to create your account</CardDescription>
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
                    <field.TextField label="Username" placeholder="A unique identifier" />
                  )}
                />
                <form.AppField
                  name="password"
                  children={(field) => <field.TextField label="Password" type="password" />}
                />

                <form.AppField
                  name="passwordConfirm"
                  children={(field) => <field.TextField label="Conform Password" type="password" />}
                />

                <FieldGroup>
                  <form.AppForm>
                    <form.SubmitButton>Create Account</form.SubmitButton>
                    <FieldDescription>
                      Already have an account? <Link to="/login">Log in</Link>
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

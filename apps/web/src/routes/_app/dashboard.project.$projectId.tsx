import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard/project/$projectId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  return <div>Hello "/_app/dashboard/project/$projectId"! {projectId}</div>;
}

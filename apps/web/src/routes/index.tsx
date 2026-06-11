import { orpc } from "#/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const oneQuery = useQuery({
    ...orpc.select1.queryOptions(),
    enabled: typeof window !== "undefined",
  });

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <p className="mt-4 text-lg">
        Edit <code>src/routes/index.tsx</code> to get started.
      </p>
      <pre>{JSON.stringify(oneQuery, null, 2)}</pre>
    </div>
  );
}

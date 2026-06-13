import "#/polyfill";

import { RPCHandler } from "@orpc/server/fetch";
import { createFileRoute } from "@tanstack/react-router";
import router from "#/orpc/router";
import { getRequestHeaders } from "@tanstack/react-start/server";

const handler = new RPCHandler(router);

async function handle({ request }: { request: Request }) {
  const responseHeaders = new Headers();
  const { response } = await handler.handle(request, {
    prefix: "/api/rpc",
    context: {
      headers: new Headers(getRequestHeaders()),
      responseHeaders,
    },
  });

  if (!response) {
    return new Response("Not Found", { status: 404 });
  }

  const headers = new Headers(response.headers);
  responseHeaders.forEach((value, key) => {
    headers.append(key, value);
  });
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export const Route = createFileRoute("/api/rpc/$")({
  server: {
    handlers: {
      HEAD: handle,
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});

import "#/polyfill";

import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { SmartCoercionPlugin } from "@orpc/json-schema";
import { createFileRoute } from "@tanstack/react-router";
import { onError } from "@orpc/server";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";

import { TodoSchema } from "#/orpc/schema";
import router from "#/orpc/router";
import { getRequestHeaders } from "@tanstack/react-start/server";

const handler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
  plugins: [
    new SmartCoercionPlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: {
          title: "TanStack ORPC Playground",
          version: "1.0.0",
        },
        commonSchemas: {
          Todo: { schema: TodoSchema },
          UndefinedError: { error: "UndefinedError" },
        },
        security: [{ bearerAuth: [] }],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
            },
          },
        },
      },
      docsConfig: {
        authentication: {
          securitySchemes: {
            bearerAuth: {
              token: "default-token",
            },
          },
        },
      },
    }),
  ],
});

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

export const Route = createFileRoute("/api/openapi/$")({
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

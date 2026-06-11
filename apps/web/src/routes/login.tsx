import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({ component: Login });

export function Login() {
    return null;
}

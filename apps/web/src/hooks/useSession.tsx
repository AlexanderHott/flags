import { createContext, use } from "react";

interface SessionContext {
  userId: string;
  sessionId: string;
}

const SessionContext = createContext<SessionContext | null>(null);

export const SessionProvider = SessionContext.Provider;

export function useSession() {
  const sessionContext = use(SessionContext);
  if (!sessionContext) {
    throw new Error("`useSession` must be used from a descendant of `SessionProvider`.");
  }

  return sessionContext;
}

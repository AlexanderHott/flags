import { logIn, signUp, verifySession } from "./auth";
import * as project from "./project";
import * as flags from "./flags";

export default {
  auth: {
    signUp,
    logIn,
    verifySession,
  },
  project,
  flags,
};

import { logIn, signUp, logOut, verifySession } from "./auth";
import * as project from "./project";
import * as flags from "./flags";

export default {
  auth: {
    signUp,
    logIn,
    logOut,
    verifySession,
  },
  project,
  flags,
};

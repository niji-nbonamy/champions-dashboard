import { describe, expect, it } from "vitest";

import {
  BETA_PILOT_NOTICE,
  LOGIN_NOT_ALLOWED_MESSAGE,
  REGISTRATION_NOT_ALLOWED_MESSAGE,
} from "./beta-access";

describe("beta access messages", () => {
  it("uses explicit French copy for the pilot notice and blocked flows", () => {
    expect(BETA_PILOT_NOTICE).toContain("Phase pilote");
    expect(REGISTRATION_NOT_ALLOWED_MESSAGE).toContain("créer un compte");
    expect(LOGIN_NOT_ALLOWED_MESSAGE).toContain("se connecter");
  });
});

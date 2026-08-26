import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RosterList } from "./roster-list";

describe("RosterList", () => {
  it("renders the empty roster message", () => {
    const html = renderToStaticMarkup(<RosterList students={[]} />);

    expect(html).toContain("Aucun élève actif pour le moment.");
  });

  it("renders level status for active students", () => {
    const html = renderToStaticMarkup(
      <RosterList
        students={[
          {
            id: "770e8400-e29b-41d4-a716-446655440002",
            displayName: "DUPONT Marie",
            level: null,
          },
          {
            id: "880e8400-e29b-41d4-a716-446655440003",
            displayName: "MARTIN Lucas",
            level: "yellow",
          },
        ]}
      />
    );

    expect(html).toContain("DUPONT Marie");
    expect(html).toContain("Niveau non assigné");
    expect(html).toContain("MARTIN Lucas");
    expect(html).toContain("yellow");
  });
});

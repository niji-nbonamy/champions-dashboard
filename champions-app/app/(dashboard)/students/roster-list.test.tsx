import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./level-dot-picker", () => ({
  LevelDotPicker: ({ studentId }: { studentId: string }) => (
    <div data-testid={`level-dot-picker-${studentId}`} />
  ),
}));

import { RosterList } from "./roster-list";

describe("RosterList", () => {
  it("renders the empty roster message", () => {
    const html = renderToStaticMarkup(<RosterList students={[]} />);

    expect(html).toContain("Aucun élève actif pour le moment.");
  });

  it("renders assigned level badges and unassigned picker rows", () => {
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
    expect(html).toContain("niveau requis");
    expect(html).toContain('data-testid="level-dot-picker-770e8400-e29b-41d4-a716-446655440002"');
    expect(html).toContain("MARTIN Lucas");
    expect(html).toContain("yellow");
    expect(html).not.toContain("Niveau non assigné");
  });
});

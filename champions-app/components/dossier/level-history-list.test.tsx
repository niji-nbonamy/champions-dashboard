import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LevelHistoryList } from "./level-history-list";

describe("LevelHistoryList", () => {
  it("renders French action labels with level badges", () => {
    const html = renderToStaticMarkup(
      <LevelHistoryList
        entries={[
          {
            id: "aa0e8400-e29b-41d4-a716-446655440010",
            level: "green",
            action: "manual",
            occurredAt: new Date("2026-08-28T10:00:00.000Z"),
          },
          {
            id: "bb0e8400-e29b-41d4-a716-446655440011",
            level: "yellow",
            action: "assigned",
            occurredAt: new Date("2026-08-20T10:00:00.000Z"),
          },
          {
            id: "cc0e8400-e29b-41d4-a716-446655440012",
            level: "violet",
            action: "promoted",
            occurredAt: new Date("2026-08-22T10:00:00.000Z"),
          },
          {
            id: "dd0e8400-e29b-41d4-a716-446655440013",
            level: "green",
            action: "refused",
            occurredAt: new Date("2026-08-23T10:00:00.000Z"),
          },
        ]}
      />
    );

    expect(html).toContain('data-testid="level-history-list"');
    expect(html).toContain("Modification manuelle");
    expect(html).toContain("Assigné");
    expect(html).toContain("Promu");
    expect(html).toContain("Refusé");
    expect(html).toContain("vert");
    expect(html).toContain("jaune");
  });

  it("renders an empty state when there are no entries", () => {
    const html = renderToStaticMarkup(<LevelHistoryList entries={[]} />);

    expect(html).toContain("Aucun changement de niveau.");
    expect(html).toContain('role="status"');
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./level-dot-picker", () => ({
  LevelDotPicker: ({ studentId }: { studentId: string }) => (
    <div data-testid={`level-dot-picker-${studentId}`} />
  ),
}));

vi.mock("./archive-student-button", () => ({
  ArchiveStudentButton: ({
    studentId,
    displayName,
  }: {
    studentId: string;
    displayName: string;
  }) => (
    <button type="button" data-testid={`archive-button-${studentId}`}>
      Archiver {displayName}
    </button>
  ),
}));

import { RosterList } from "./roster-list";

describe("RosterList", () => {
  it("renders the empty roster message for active students", () => {
    const html = renderToStaticMarkup(
      <RosterList students={[]} filter="active" />
    );

    expect(html).toContain("Aucun élève actif pour le moment.");
  });

  it("renders the empty roster message for archived students", () => {
    const html = renderToStaticMarkup(
      <RosterList students={[]} filter="archived" />
    );

    expect(html).toContain("Aucun élève archivé.");
  });

  it("renders names only when level UI is hidden", () => {
    const html = renderToStaticMarkup(
      <RosterList
        students={[
          {
            id: "770e8400-e29b-41d4-a716-446655440002",
            displayName: "DUPONT Marie",
            level: null,
            archived: false,
          },
        ]}
        filter="active"
        showLevelUi={false}
      />
    );

    expect(html).toContain("DUPONT Marie");
    expect(html).not.toContain("niveau requis");
    expect(html).not.toContain("level-dot-picker");
  });

  it("renders assigned level badges and unassigned picker rows", () => {
    const html = renderToStaticMarkup(
      <RosterList
        students={[
          {
            id: "770e8400-e29b-41d4-a716-446655440002",
            displayName: "DUPONT Marie",
            level: null,
            archived: false,
          },
          {
            id: "880e8400-e29b-41d4-a716-446655440003",
            displayName: "MARTIN Lucas",
            level: "yellow",
            archived: false,
          },
        ]}
        filter="active"
      />
    );

    expect(html).toContain("DUPONT Marie");
    expect(html).toContain("niveau requis");
    expect(html).toContain(
      'data-testid="level-dot-picker-770e8400-e29b-41d4-a716-446655440002"'
    );
    expect(html).toContain("MARTIN Lucas");
    expect(html).toContain("jaune");
    expect(html).not.toContain("Niveau non assigné");
  });

  it("renders archived rows as read-only with an Archivé label", () => {
    const html = renderToStaticMarkup(
      <RosterList
        students={[
          {
            id: "990e8400-e29b-41d4-a716-446655440004",
            displayName: "BERNARD Paul",
            level: "green",
            archived: true,
          },
        ]}
        filter="archived"
        showArchiveAction
      />
    );

    expect(html).toContain("BERNARD Paul");
    expect(html).toContain("Archivé");
    expect(html).toContain("green");
    expect(html).not.toContain("level-dot-picker");
    expect(html).not.toContain("archive-button");
  });

  it("renders the empty roster message for all students", () => {
    const html = renderToStaticMarkup(
      <RosterList students={[]} filter="all" />
    );

    expect(html).toContain("Aucun élève pour le moment.");
  });

  it("renders archived rows as read-only in the all filter view", () => {
    const html = renderToStaticMarkup(
      <RosterList
        students={[
          {
            id: "770e8400-e29b-41d4-a716-446655440002",
            displayName: "DUPONT Marie",
            level: "yellow",
            archived: false,
          },
          {
            id: "990e8400-e29b-41d4-a716-446655440004",
            displayName: "BERNARD Paul",
            level: "green",
            archived: true,
          },
        ]}
        filter="all"
        showArchiveAction
      />
    );

    expect(html).toContain("Archiver DUPONT Marie");
    expect(html).toContain("Archivé");
    expect(html).not.toContain("archive-button-990e8400-e29b-41d4-a716-446655440004");
    expect(html).not.toContain("level-dot-picker-990e8400-e29b-41d4-a716-446655440004");
  });

  it("does not render archive buttons when archive actions are disabled", () => {
    const html = renderToStaticMarkup(
      <RosterList
        students={[
          {
            id: "770e8400-e29b-41d4-a716-446655440002",
            displayName: "DUPONT Marie",
            level: "yellow",
            archived: false,
          },
        ]}
        filter="active"
        showArchiveAction={false}
      />
    );

    expect(html).not.toContain("archive-button");
    expect(html).not.toContain("Archiver");
  });

  it("renders archive buttons for active rows when archive actions are enabled", () => {
    const html = renderToStaticMarkup(
      <RosterList
        students={[
          {
            id: "770e8400-e29b-41d4-a716-446655440002",
            displayName: "DUPONT Marie",
            level: "yellow",
            archived: false,
          },
        ]}
        filter="active"
        showArchiveAction
      />
    );

    expect(html).toContain('data-testid="archive-button-770e8400-e29b-41d4-a716-446655440002"');
    expect(html).toContain("Archiver DUPONT Marie");
  });
});

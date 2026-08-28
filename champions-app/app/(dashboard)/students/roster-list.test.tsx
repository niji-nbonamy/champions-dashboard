import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./level-dot-picker", () => ({
  LevelDotPicker: ({
    studentId,
    mode,
    currentLevel,
  }: {
    studentId: string;
    mode?: string;
    currentLevel?: string;
  }) => (
    <div
      data-testid={`level-dot-picker-${studentId}`}
      data-mode={mode ?? "assign"}
      data-current-level={currentLevel ?? ""}
    />
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

vi.mock("@/components/promotion/roster-promotion-action", () => ({
  RosterPromotionAction: ({
    studentId,
    targetLevel,
  }: {
    studentId: string;
    targetLevel: string;
  }) => (
    <button
      type="button"
      data-testid={`roster-promotion-${studentId}`}
      data-target-level={targetLevel}
    >
      +
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

  it("renders dossier links with an accessible aria-label", () => {
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
      />
    );

    expect(html).toContain('aria-label="Dossier de DUPONT Marie"');
    expect(html).toContain(
      'href="/students/770e8400-e29b-41d4-a716-446655440002"'
    );
  });

  it("renders plain names without dossier links when linkToDossier is false", () => {
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
        linkToDossier={false}
      />
    );

    expect(html).toContain("DUPONT Marie");
    expect(html).not.toContain('href="/students/');
    expect(html).not.toContain("Dossier de");
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
    expect(html).toContain(
      'href="/students/770e8400-e29b-41d4-a716-446655440002"'
    );
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
    expect(html).toContain(
      'href="/students/770e8400-e29b-41d4-a716-446655440002"'
    );
    expect(html).toContain("niveau requis");
    expect(html).toContain(
      'data-testid="level-dot-picker-770e8400-e29b-41d4-a716-446655440002"'
    );
    expect(html).toContain("MARTIN Lucas");
    expect(html).toContain(
      'href="/students/880e8400-e29b-41d4-a716-446655440003"'
    );
    expect(html).toContain(
      'data-testid="level-dot-picker-880e8400-e29b-41d4-a716-446655440003"'
    );
    expect(html).toContain('data-mode="override"');
    expect(html).toContain('data-current-level="yellow"');
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
    expect(html).toContain(
      'href="/students/990e8400-e29b-41d4-a716-446655440004"'
    );
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

  it("shows promotion indicators on roster rows when pending exists", () => {
    const studentId = "880e8400-e29b-41d4-a716-446655440003";
    const html = renderToStaticMarkup(
      <RosterList
        students={[
          {
            id: studentId,
            displayName: "MARTIN Lucas",
            level: "yellow",
            archived: false,
          },
        ]}
        pendingPromotionsByStudentId={{
          [studentId]: { targetLevel: "green" },
        }}
      />
    );

    expect(html).not.toContain("⬆️");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain(`data-testid="roster-promotion-${studentId}"`);
    expect(html).toContain('data-target-level="green"');
  });

  it("hides promotion indicators for archived students", () => {
    const studentId = "990e8400-e29b-41d4-a716-446655440004";
    const html = renderToStaticMarkup(
      <RosterList
        students={[
          {
            id: studentId,
            displayName: "BERNARD Paul",
            level: "green",
            archived: true,
          },
        ]}
        pendingPromotionsByStudentId={{
          [studentId]: { targetLevel: "violet" },
        }}
      />
    );

    expect(html).not.toContain("⬆️");
    expect(html).not.toContain(`data-testid="roster-promotion-${studentId}"`);
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

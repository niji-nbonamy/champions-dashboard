import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MobileStudentPicker } from "./mobile-student-picker";

const dictationId = "880e8400-e29b-41d4-a716-446655440003";

const students = [
  {
    id: "770e8400-e29b-41d4-a716-446655440002",
    displayName: "DUPONT Marie",
    level: "yellow",
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440004",
    displayName: "MARTIN Paul",
    level: "green",
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440006",
    displayName: "BERNARD Léa",
    level: "violet",
  },
];

describe("MobileStudentPicker", () => {
  it("renders remaining count and saisi badges", () => {
    const html = renderToStaticMarkup(
      <MobileStudentPicker
        dictationId={dictationId}
        students={students}
        enteredStudentIds={[students[0].id, students[2].id]}
        remainingCount={1}
        leveledStudentCount={students.length}
      />
    );

    expect(html).toContain("1 restant");
    expect(html).toContain("saisi");
    expect(html).toContain("DUPONT Marie");
    expect(html).toContain("MARTIN Paul");
    expect(html).toContain(
      `href="/dictations/${dictationId}/mobile/${students[1].id}"`
    );
  });

  it("renders the empty roster message", () => {
    const html = renderToStaticMarkup(
      <MobileStudentPicker
        dictationId={dictationId}
        students={[]}
        enteredStudentIds={[]}
        remainingCount={0}
        leveledStudentCount={0}
      />
    );

    expect(html).toContain("Aucun élève actif.");
    expect(html).toContain('role="status"');
  });

  it("shows completion subtitle when every student is entered", () => {
    const html = renderToStaticMarkup(
      <MobileStudentPicker
        dictationId={dictationId}
        students={students}
        enteredStudentIds={students.map((student) => student.id)}
        remainingCount={0}
        leveledStudentCount={students.length}
      />
    );

    expect(html).toContain("Tous les élèves sont saisis");
  });

  it("wraps long display names without squeezing badge layout", () => {
    const longName =
      "Nicolas JEPOSSEDE-UNNOMCOMPOSE-VRAIMENTSUPERLONG";

    const html = renderToStaticMarkup(
      <MobileStudentPicker
        dictationId={dictationId}
        students={[
          {
            id: "770e8400-e29b-41d4-a716-446655440099",
            displayName: longName,
            level: "green",
          },
        ]}
        enteredStudentIds={["770e8400-e29b-41d4-a716-446655440099"]}
        remainingCount={0}
        leveledStudentCount={1}
      />
    );

    expect(html).toContain(longName);
    expect(html).toContain("break-words");
    expect(html).toContain("shrink-0");
  });

  it("renders required level badge and link for unleveled students", () => {
    const unleveledId = "770e8400-e29b-41d4-a716-446655440008";

    const html = renderToStaticMarkup(
      <MobileStudentPicker
        dictationId={dictationId}
        students={[
          ...students,
          {
            id: unleveledId,
            displayName: "PETIT Lucas",
            level: null,
          },
        ]}
        enteredStudentIds={[students[0].id]}
        remainingCount={2}
        leveledStudentCount={students.length}
      />
    );

    expect(html).toContain("niveau requis");
    expect(html).toContain("PETIT Lucas");
    expect(html).toContain(
      `href="/dictations/${dictationId}/mobile/${unleveledId}"`
    );
    expect(html).toContain("2 restants");
  });

  it("shows a leveled-only subtitle when no leveled students exist", () => {
    const html = renderToStaticMarkup(
      <MobileStudentPicker
        dictationId={dictationId}
        students={[
          {
            id: "770e8400-e29b-41d4-a716-446655440008",
            displayName: "PETIT Lucas",
            level: null,
          },
        ]}
        enteredStudentIds={[]}
        remainingCount={0}
        leveledStudentCount={0}
      />
    );

    expect(html).toContain("Aucun élève nivelé pour saisir.");
    expect(html).not.toContain("Tous les élèves sont saisis");
  });
});

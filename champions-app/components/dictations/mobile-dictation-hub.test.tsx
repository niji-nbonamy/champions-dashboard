import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MobileDictationHub } from "./mobile-dictation-hub";

const lastDictation = {
  id: "880e8400-e29b-41d4-a716-446655440003",
  label: "Dictée 1",
  dictationLabelKey: "dictée 1",
  dictationDate: "2026-08-27",
};

describe("MobileDictationHub", () => {
  it("renders the empty state when no dictation exists", () => {
    const html = renderToStaticMarkup(<MobileDictationHub />);

    expect(html).toContain(
      "Créez votre première dictée depuis un ordinateur ou une tablette."
    );
    expect(html).toContain('role="status"');
    expect(html).not.toContain("Saisir");
    expect(html).not.toContain("Voir");
  });

  it("renders class setup guidance when the roster is empty", () => {
    const html = renderToStaticMarkup(
      <MobileDictationHub isClassSetupBlocked />
    );

    expect(html).toContain(
      "Utilisez un ordinateur ou une tablette pour configurer votre classe."
    );
    expect(html).not.toContain(
      "Créez votre première dictée depuis un ordinateur ou une tablette."
    );
    expect(html).not.toContain("Saisir");
    expect(html).not.toContain("Voir");
  });

  it("renders the last dictation with Saisir and Voir shortcuts", () => {
    const html = renderToStaticMarkup(
      <MobileDictationHub
        lastDictation={lastDictation}
        completionSummary={{
          enteredCount: 1,
          totalLeveledCount: 3,
          isComplete: false,
        }}
      />
    );

    expect(html).toContain("Dictée 1");
    expect(html).toContain("27 août 2026");
    expect(html).toContain('href="/dictations/880e8400-e29b-41d4-a716-446655440003/mobile"');
    expect(html).toContain(
      'href="/dictations/880e8400-e29b-41d4-a716-446655440003/mobile/summary"'
    );
    expect(html).toContain("Saisir");
    expect(html).toContain("Voir");
    expect(html).not.toContain("Dictée complète");
  });

  it("shows the completion badge when every leveled student is entered", () => {
    const html = renderToStaticMarkup(
      <MobileDictationHub
        lastDictation={lastDictation}
        completionSummary={{
          enteredCount: 3,
          totalLeveledCount: 3,
          isComplete: true,
        }}
      />
    );

    expect(html).toContain("Dictée complète");
    expect(html).toContain("Saisir");
    expect(html).toContain("Voir");
  });

  it("hides shortcuts when no leveled students are available", () => {
    const html = renderToStaticMarkup(
      <MobileDictationHub
        lastDictation={lastDictation}
        completionSummary={{
          enteredCount: 0,
          totalLeveledCount: 0,
          isComplete: false,
        }}
      />
    );

    expect(html).toContain("Aucun élève nivelé actif.");
    expect(html).toContain("Dictée 1");
    expect(html).not.toContain("Saisir");
    expect(html).not.toContain("Voir");
  });

  it("hides shortcuts when class setup is blocked but a dictation exists", () => {
    const html = renderToStaticMarkup(
      <MobileDictationHub
        lastDictation={lastDictation}
        isClassSetupBlocked
        completionSummary={{
          enteredCount: 1,
          totalLeveledCount: 3,
          isComplete: false,
        }}
      />
    );

    expect(html).toContain(
      "Utilisez un ordinateur ou une tablette pour configurer votre classe."
    );
    expect(html).toContain("Dictée 1");
    expect(html).not.toContain("Saisir");
    expect(html).not.toContain("Voir");
  });
});

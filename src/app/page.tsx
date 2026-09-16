"use client";

import { useCallback, useState } from "react";
import { AnalysisScreen } from "@/components/screens/AnalysisScreen";
import { ChoiceScreen } from "@/components/screens/ChoiceScreen";
import { DetailsScreen } from "@/components/screens/DetailsScreen";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { QuestionsScreen } from "@/components/screens/QuestionsScreen";
import { ResultsScreen } from "@/components/screens/ResultsScreen";
import { TikTokScreen } from "@/components/screens/TikTokScreen";
import { VibeScreen } from "@/components/screens/VibeScreen";
import { QUESTIONS, TIKTOK_DEMO_ARCHETYPE } from "@/lib/data";
import { resolveFromAnswers } from "@/lib/matching";
import type { BudgetId, Route, Session } from "@/lib/types";

type Step =
  | "landing"
  | "details"
  | "choice"
  | "tiktok"
  | "questions"
  | "analysis"
  | "vibe"
  | "results";

const EMPTY_SESSION: Session = {
  recipient: "",
  occasion: "",
  budget: null,
  route: null,
  tiktokHandle: "",
  answers: {},
  archetype: null,
  prefs: [],
};

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [session, setSession] = useState<Session>(EMPTY_SESSION);
  const [questionIndex, setQuestionIndex] = useState(0);

  const patchSession = useCallback(
    (patch: Partial<Session>) => setSession((s) => ({ ...s, ...patch })),
    [],
  );

  const restart = useCallback(() => {
    setSession(EMPTY_SESSION);
    setQuestionIndex(0);
    setStep("landing");
  }, []);

  const pickRoute = useCallback(
    (route: Route) => {
      patchSession({ route });
      setStep(route === "tiktok" ? "tiktok" : "questions");
      setQuestionIndex(0);
    },
    [patchSession],
  );

  const answerQuestion = useCallback(
    (questionId: string, optionId: string) => {
      const answers = { ...session.answers, [questionId]: optionId };
      patchSession({ answers });

      if (questionIndex < QUESTIONS.length - 1) {
        setQuestionIndex((i) => i + 1);
        return;
      }

      const { archetype, prefs } = resolveFromAnswers(answers);
      patchSession({ answers, archetype, prefs });
      setStep("analysis");
    },
    [patchSession, questionIndex, session.answers],
  );

  const startTikTokAnalysis = useCallback(() => {
    // The TikTok route uses a fixed, predetermined demo profile. It is a worked
    // example of how repost analysis would read someone, not a real lookup.
    patchSession({ archetype: TIKTOK_DEMO_ARCHETYPE, prefs: [] });
    setStep("analysis");
  }, [patchSession]);

  const backFromQuestions = useCallback(() => {
    if (questionIndex === 0) {
      setStep("choice");
      return;
    }
    setQuestionIndex((i) => i - 1);
  }, [questionIndex]);

  switch (step) {
    case "landing":
      return <LandingScreen onStart={() => setStep("details")} />;

    case "details":
      return (
        <DetailsScreen
          recipient={session.recipient}
          occasion={session.occasion}
          budget={session.budget}
          onChange={(patch) =>
            patchSession(patch as Partial<Session> & { budget?: BudgetId })
          }
          onBack={() => setStep("landing")}
          onNext={() => setStep("choice")}
        />
      );

    case "choice":
      return <ChoiceScreen onPick={pickRoute} onBack={() => setStep("details")} />;

    case "tiktok":
      return (
        <TikTokScreen
          handle={session.tiktokHandle}
          onChange={(tiktokHandle) => patchSession({ tiktokHandle })}
          onBack={() => setStep("choice")}
          onNext={startTikTokAnalysis}
        />
      );

    case "questions":
      return (
        <QuestionsScreen
          index={questionIndex}
          answers={session.answers}
          onAnswer={answerQuestion}
          onBack={backFromQuestions}
        />
      );

    case "analysis":
      return (
        <AnalysisScreen
          route={session.route ?? "questions"}
          onDone={() => setStep("vibe")}
        />
      );

    case "vibe":
      return (
        <VibeScreen
          archetype={session.archetype ?? TIKTOK_DEMO_ARCHETYPE}
          route={session.route ?? "questions"}
          handle={session.tiktokHandle}
          onBack={() =>
            setStep(session.route === "tiktok" ? "tiktok" : "questions")
          }
          onNext={() => setStep("results")}
        />
      );

    case "results":
      return (
        <ResultsScreen
          archetype={session.archetype ?? TIKTOK_DEMO_ARCHETYPE}
          budget={session.budget ?? "100-250"}
          prefs={session.prefs}
          recipient={session.recipient || "Friend"}
          occasion={session.occasion || "Birthday"}
          onBack={() => setStep("vibe")}
          onRestart={restart}
        />
      );
  }
}

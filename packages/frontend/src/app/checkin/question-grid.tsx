"use client";

const QUESTIONS = [
  { id: "done", number: 1, question: "What did you get done this week?" },
  { id: "challenges", number: 2, question: "Any challenges? How did you handle them?" },
  { id: "current_status", number: 3, question: "What are you currently working on and how far along are you?" },
  { id: "next_week", number: 4, question: "What's the plan for next week?" },
  { id: "dependencies", number: 5, question: "Are you blocked on or waiting for anything?" },
  { id: "support", number: 6, question: "Do you need any help or support from the team?" },
  { id: "vibe", number: 7, question: "How's the vibe? How are you and the client feeling?" },
];

export function QuestionGrid() {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Answer these questions in your recording:
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {q.number}
            </span>
            <p className="text-sm text-foreground">{q.question}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

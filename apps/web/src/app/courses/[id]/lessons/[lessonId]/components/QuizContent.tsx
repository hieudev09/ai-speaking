'use client';

import { useState } from 'react';

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctId: string;
  explanation?: string;
}

interface QuizContent {
  title?: string;
  questions: QuizQuestion[];
}

function QuestionCard({
  question,
  index,
  total,
  onAnswer,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;

  function handleSelect(optionId: string) {
    if (answered) return;
    setSelected(optionId);
    onAnswer(optionId === question.correctId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-bold text-indigo-400 ring-1 ring-indigo-500/30">
          {index + 1}
        </span>
        <p className="text-base font-medium leading-relaxed text-white">{question.question}</p>
      </div>

      <div className="grid gap-2">
        {question.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrect = opt.id === question.correctId;

          let cls =
            'group flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition-all duration-200';

          if (!answered) {
            cls +=
              ' border-slate-700/50 bg-slate-800/30 text-slate-300 hover:border-indigo-500/40 hover:bg-slate-800/60 hover:text-white';
          } else if (isCorrect) {
            cls += ' border-emerald-500/50 bg-emerald-500/10 text-emerald-300 cursor-default';
          } else if (isSelected && !isCorrect) {
            cls += ' border-rose-500/50 bg-rose-500/10 text-rose-300 cursor-default';
          } else {
            cls += ' border-slate-700/30 bg-slate-800/20 text-slate-500 cursor-default';
          }

          return (
            <button key={opt.id} className={cls} onClick={() => handleSelect(opt.id)}>
              <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  answered && isCorrect
                    ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400'
                    : answered && isSelected && !isCorrect
                      ? 'border-rose-400 bg-rose-400/20 text-rose-400'
                      : 'border-current'
                }`}
              >
                {answered && isCorrect ? '✓' : answered && isSelected ? '✗' : opt.id.toUpperCase()}
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {answered && question.explanation && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-indigo-300 leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

export function QuizContent({ content }: { content: QuizContent }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const questions = content.questions ?? [];

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/40 bg-slate-800/30 py-12 text-center text-slate-500">
        No quiz questions available.
      </div>
    );
  }

  function handleAnswer(correct: boolean) {
    const next = [...answers, correct];
    setAnswers(next);

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ((q) => q + 1);
      } else {
        setFinished(true);
      }
    }, 1200);
  }

  const score = answers.filter(Boolean).length;
  const pct = Math.round((score / questions.length) * 100);

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/30 p-6 md:p-8">
      {content.title && (
        <h3 className="mb-1 text-lg font-semibold text-white">{content.title}</h3>
      )}

      {!finished ? (
        <>
          {/* Progress bar */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-700/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${((currentQ) / questions.length) * 100}%` }}
              />
            </div>
            <span className="flex-shrink-0 text-xs text-slate-500">
              {currentQ + 1}/{questions.length}
            </span>
          </div>

          <QuestionCard
            key={currentQ}
            question={questions[currentQ]}
            index={currentQ}
            total={questions.length}
            onAnswer={handleAnswer}
          />
        </>
      ) : (
        /* Results */
        <div className="flex flex-col items-center py-6 text-center">
          <div
            className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold ring-4 ${
              pct >= 80
                ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
                : pct >= 60
                  ? 'bg-amber-500/10 text-amber-400 ring-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 ring-rose-500/30'
            }`}
          >
            {pct}%
          </div>
          <h4 className="mb-1 text-xl font-semibold text-white">
            {pct >= 80 ? '🎉 Excellent work!' : pct >= 60 ? '👍 Good job!' : '💪 Keep practicing!'}
          </h4>
          <p className="mb-6 text-sm text-slate-400">
            You got {score} out of {questions.length} questions correct.
          </p>
          <button
            onClick={() => {
              setCurrentQ(0);
              setAnswers([]);
              setFinished(false);
            }}
            className="rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-indigo-500 hover:text-indigo-300"
          >
            Retry Quiz
          </button>
        </div>
      )}
    </div>
  );
}

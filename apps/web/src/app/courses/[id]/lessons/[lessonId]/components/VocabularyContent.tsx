'use client';

import { useState } from 'react';

interface VocabCard {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition: string;
  example?: string;
  translation?: string;
}

interface VocabularyContent {
  title?: string;
  cards: VocabCard[];
}

function FlipCard({ card, index }: { card: VocabCard; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative h-52 w-full cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className="relative h-full w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front — Word */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 to-slate-800/60 p-5 text-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="mb-2 text-xs text-slate-500">Card {index + 1} · Tap to reveal</span>
          <p className="mb-1 text-2xl font-bold text-white">{card.word}</p>
          {card.phonetic && (
            <p className="mb-2 text-sm text-indigo-300">{card.phonetic}</p>
          )}
          {card.partOfSpeech && (
            <span className="rounded-full bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/20">
              {card.partOfSpeech}
            </span>
          )}
        </div>

        {/* Back — Definition */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/20 to-slate-800/60 p-5 text-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-sm leading-relaxed text-slate-300">{card.definition}</p>
          {card.example && (
            <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-2.5">
              <p className="text-xs italic text-slate-400">"{card.example}"</p>
            </div>
          )}
          {card.translation && (
            <p className="text-xs text-emerald-400">{card.translation}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function VocabularyContent({ content }: { content: VocabularyContent }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cards = content.cards ?? [];

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/40 bg-slate-800/30 py-12 text-center text-slate-500">
        No vocabulary cards available.
      </div>
    );
  }

  const current = cards[currentIndex];

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/30 p-6 md:p-8">
      {content.title && (
        <h3 className="mb-5 text-lg font-semibold text-white">{content.title}</h3>
      )}

      {/* Progress dots */}
      <div className="mb-5 flex items-center justify-center gap-1.5">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-6 bg-indigo-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <FlipCard key={currentIndex} card={current} index={currentIndex} />

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-all hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <span className="text-xs text-slate-500">
          {currentIndex + 1} / {cards.length}
        </span>

        <button
          onClick={() => setCurrentIndex((i) => Math.min(cards.length - 1, i + 1))}
          disabled={currentIndex === cards.length - 1}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 transition-all hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

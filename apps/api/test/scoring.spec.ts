import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ASSESSMENT_WEIGHTS } from '@ai-platform/types';

describe('Scoring Algorithm & Weights Verification', () => {
  it('should verify the locked assessment scoring weights sum to 1.0', () => {
    const { pronunciation, fluency, grammar, vocabulary, coherence } = ASSESSMENT_WEIGHTS;

    assert.strictEqual(pronunciation, 0.25);
    assert.strictEqual(fluency, 0.20);
    assert.strictEqual(grammar, 0.20);
    assert.strictEqual(vocabulary, 0.20);
    assert.strictEqual(coherence, 0.15);

    const sum = pronunciation + fluency + grammar + vocabulary + coherence;
    assert.strictEqual(Math.round(sum * 100) / 100, 1.0);
  });

  it('should calculate correct weighted overall score per TDD formula', () => {
    // Scores: P=80, F=70, G=75, V=85, C=90
    // Overall = 80*0.25 + 70*0.20 + 75*0.20 + 85*0.20 + 90*0.15
    //         = 20 + 14 + 15 + 17 + 13.5 = 79.5 -> 80
    const scores = {
      pronunciation: 80,
      fluency: 70,
      grammar: 75,
      vocabulary: 85,
      coherence: 90,
    };

    const overall = Math.round(
      scores.pronunciation * ASSESSMENT_WEIGHTS.pronunciation +
      scores.fluency * ASSESSMENT_WEIGHTS.fluency +
      scores.grammar * ASSESSMENT_WEIGHTS.grammar +
      scores.vocabulary * ASSESSMENT_WEIGHTS.vocabulary +
      scores.coherence * ASSESSMENT_WEIGHTS.coherence,
    );

    assert.strictEqual(overall, 80);
  });

  it('should map scores correctly to CEFR levels', () => {
    function mapCefr(score: number): string {
      if (score >= 90) return 'C2';
      if (score >= 80) return 'C1';
      if (score >= 65) return 'B2';
      if (score >= 50) return 'B1';
      if (score >= 35) return 'A2';
      return 'A1';
    }

    assert.strictEqual(mapCefr(95), 'C2');
    assert.strictEqual(mapCefr(82), 'C1');
    assert.strictEqual(mapCefr(70), 'B2');
    assert.strictEqual(mapCefr(55), 'B1');
    assert.strictEqual(mapCefr(40), 'A2');
    assert.strictEqual(mapCefr(20), 'A1');
  });

  it('should map scores correctly to IELTS bands (3.0 to 9.0)', () => {
    function mapIeltsBand(score: number): number {
      if (score >= 95) return 9.0;
      if (score >= 85) return 8.0;
      if (score >= 75) return 7.0;
      if (score >= 65) return 6.0;
      if (score >= 50) return 5.0;
      if (score >= 40) return 4.0;
      return 3.0;
    }

    assert.strictEqual(mapIeltsBand(96), 9.0);
    assert.strictEqual(mapIeltsBand(87), 8.0);
    assert.strictEqual(mapIeltsBand(76), 7.0);
    assert.strictEqual(mapIeltsBand(66), 6.0);
    assert.strictEqual(mapIeltsBand(52), 5.0);
  });
});

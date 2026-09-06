import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  RecommendationDto,
  UserRecommendationsDto,
} from '@ai-platform/types';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get personalized recommendations based on user assessment history and profile
   */
  async getRecommendations(userId: string): Promise<UserRecommendationsDto> {
    const [profile, assessments] = await Promise.all([
      this.prisma.userProfile.findUnique({
        where: { userId },
      }),
      this.prisma.assessment.findMany({
        where: { userId },
        include: { details: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const recommendations: RecommendationDto[] = [];
    let weakestSkill: string | null = null;
    let averageScore = 0;

    if (assessments.length > 0) {
      let sumP = 0, sumF = 0, sumG = 0, sumV = 0, sumC = 0, sumOverall = 0;
      let count = 0;

      for (const a of assessments) {
        if (a.details) {
          sumP += Number(a.details.pronunciationScore ?? 70);
          sumF += Number(a.details.fluencyScore ?? 70);
          sumG += Number(a.details.grammarScore ?? 70);
          sumV += Number(a.details.vocabularyScore ?? 70);
          sumC += Number(a.details.coherenceScore ?? 70);
          sumOverall += Number(a.overallScore ?? 70);
          count++;
        }
      }

      if (count > 0) {
        const avgP = Math.round(sumP / count);
        const avgF = Math.round(sumF / count);
        const avgG = Math.round(sumG / count);
        const avgV = Math.round(sumV / count);
        const avgC = Math.round(sumC / count);
        averageScore = Math.round(sumOverall / count);

        const skillScores = [
          { skill: 'pronunciation', score: avgP },
          { skill: 'fluency', score: avgF },
          { skill: 'grammar', score: avgG },
          { skill: 'vocabulary', score: avgV },
          { skill: 'coherence', score: avgC },
        ].sort((a, b) => a.score - b.score);

        weakestSkill = skillScores[0]!.skill;

        if (weakestSkill === 'pronunciation') {
          recommendations.push({
            id: 'rec-pronunciation-1',
            title: 'Vowel & Consonant Precision Drill',
            description: 'Practice challenging phonemes and syllable stress with real-time waveform feedback.',
            type: 'pronunciation_drill',
            targetSkill: 'pronunciation',
            actionUrl: '/courses/english-basics/lessons/1',
            level: profile?.englishLevel || 'Intermediate',
            reason: `Your average pronunciation score is ${avgP}%. Focusing on phoneme accuracy will quickly raise your overall band score.`,
          });
        } else if (weakestSkill === 'fluency') {
          recommendations.push({
            id: 'rec-fluency-1',
            title: 'Fast-Paced Conversation Practice',
            description: 'Train speaking with fewer pauses and reduce filler words with an AI Friend partner.',
            type: 'conversation',
            targetSkill: 'fluency',
            actionUrl: '/conversations',
            level: profile?.englishLevel || 'Intermediate',
            reason: `Your average fluency score is ${avgF}%. Building continuous speech rhythm will increase your confidence.`,
          });
        } else if (weakestSkill === 'grammar') {
          recommendations.push({
            id: 'rec-grammar-1',
            title: 'Complex Sentences & Tense Drills',
            description: 'Learn to weave past perfect and conditionals into conversational English.',
            type: 'lesson',
            targetSkill: 'grammar',
            actionUrl: '/courses',
            level: profile?.englishLevel || 'Intermediate',
            reason: `Your grammar accuracy is currently at ${avgG}%. Mastering verb tenses will sharpen your expression.`,
          });
        } else {
          recommendations.push({
            id: 'rec-vocab-1',
            title: 'Advanced Lexical Diversity Expansion',
            description: 'Upgrade common expressions into C1/C2 natural idioms and collocations.',
            type: 'lesson',
            targetSkill: 'vocabulary',
            actionUrl: '/conversations',
            level: profile?.englishLevel || 'Intermediate',
            reason: `Expand your vocabulary range from your current ${avgV}% benchmark.`,
          });
        }
      }
    }

    // Add goal-oriented recommendations
    const goal = profile?.learningGoal?.toLowerCase() || '';
    if (goal.includes('ielts')) {
      recommendations.push({
        id: 'rec-ielts-1',
        title: 'IELTS Speaking Part 2 Mock Test',
        description: 'Simulate a real 2-minute cue card monologue with an AI IELTS Examiner.',
        type: 'ielts_practice',
        targetSkill: 'exam_prep',
        actionUrl: '/conversations',
        level: 'Upper Intermediate',
        reason: 'Tailored for your declared IELTS exam preparation goal.',
      });
    } else if (goal.includes('interview') || goal.includes('job')) {
      recommendations.push({
        id: 'rec-interview-1',
        title: 'Behavioral Job Interview Simulation',
        description: 'Answer STAR method questions with an AI HR Director persona.',
        type: 'conversation',
        targetSkill: 'fluency',
        actionUrl: '/conversations',
        level: 'Intermediate',
        reason: 'Direct practice for your upcoming job interview goals.',
      });
    }

    // Default starter recommendation if list is short
    if (recommendations.length < 2) {
      recommendations.push({
        id: 'rec-starter-1',
        title: 'Daily Conversational Warm-Up',
        description: 'A friendly 5-minute chat about daily routines and hobbies.',
        type: 'conversation',
        targetSkill: 'fluency',
        actionUrl: '/conversations',
        level: 'Beginner',
        reason: 'Recommended for daily consistency and streak maintenance.',
      });
      recommendations.push({
        id: 'rec-starter-2',
        title: 'English Basics: Introducing Yourself',
        description: 'Master foundational expressions and get your first pronunciation assessment.',
        type: 'lesson',
        targetSkill: 'pronunciation',
        actionUrl: '/courses',
        level: 'Beginner',
        reason: 'Essential starter course for all new learners.',
      });
    }

    return {
      weakestSkill,
      averageScore,
      recommendations,
    };
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('PromptTemplatesService');

export const DEFAULT_PROMPT_TEMPLATES: Record<string, string> = {
  conversation_teacher: `You are an encouraging, expert English teacher having a 1-on-1 speaking lesson with a student.
Target Student Level: {{userLevel}}
Learning Goal: {{learningGoal}}
Topic of Discussion: {{topic}}

{{ragContext}}

Guidelines:
1. Speak naturally using clear, level-appropriate English.
2. If the student makes significant grammar or vocabulary errors, politely mention a better way to phrase it using "💡 Quick tip: ...".
3. Always ask an engaging open-ended question at the end of your response to keep the conversation flowing.
4. Keep your turns concise (2-4 sentences max) to give the student maximum speaking time.`,

  conversation_interviewer: `You are a professional HR and Hiring Manager conducting an English job interview.
Job Domain / Scenario: {{topic}}
Candidate Target Level: {{userLevel}}

{{ragContext}}

Guidelines:
1. Maintain a professional, supportive, and authentic interview tone.
2. Ask one clear interview question at a time (e.g. background, behavioral STAR questions, situational problem-solving).
3. If the candidate answers well, acknowledge key points and ask a deeper follow-up question.
4. Keep your questions realistic and standard for corporate interviews.`,

  conversation_friend: `You are a warm, casual native English-speaking friend chatting over coffee.
Topic: {{topic}}
Student Level: {{userLevel}}

{{ragContext}}

Guidelines:
1. Use natural, conversational English with everyday idioms and friendly expressions.
2. React enthusiastically to what the user shares.
3. Don't sound like a strict textbook or robot; speak like a real friend.
4. Ask fun, engaging questions about their opinions, feelings, or experiences.`,

  ielts_examiner: `You are an official British Council / IDP certified IELTS Speaking Examiner.
Test Part / Focus: {{topic}}
Candidate Target Band: {{learningGoal}} (Current Level: {{userLevel}})

{{ragContext}}

Guidelines:
1. Follow the standard IELTS Speaking format (Part 1: familiar topics, Part 2: cue card monologue, Part 3: abstract/in-depth discussion).
2. Frame official test questions clearly and neutrally.
3. After the student answers, guide them to the next relevant question or prompt them to expand if their answer was too brief.
4. Evaluate across Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, and Pronunciation.`,

  business_mentor: `You are a seasoned international business executive and executive communication coach.
Business Scenario: {{topic}}
Professional Level: {{userLevel}}

{{ragContext}}

Guidelines:
1. Use polished business English, professional terminology, and executive phrasing.
2. Practice real-world scenarios such as negotiations, client pitches, board meetings, or team presentations.
3. Offer constructive advice on diplomacy, persuasiveness, and executive presence.`,

  grammar_checker: `You are an expert English grammar and syntax coach.
Student Level: {{userLevel}}

Analyze the user's English input and provide structured feedback:
1. Corrected version (natural English).
2. Explanation of any grammar, preposition, or tense errors.
3. A similar example sentence for practice.`,

  pronunciation_feedback: `You are a phonetics and pronunciation specialist.
Student Level: {{userLevel}}

Analyze the spoken transcript or phonetic query.
Provide tips on word stress, syllable breakdown, minimal pairs, and American/British intonation patterns.`,
};

@Injectable()
export class PromptTemplatesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultTemplates();
  }

  /**
   * Ensure default templates are registered in DB
   */
  async seedDefaultTemplates() {
    try {
      for (const [name, content] of Object.entries(DEFAULT_PROMPT_TEMPLATES)) {
        const existing = await this.prisma.aiPromptTemplate.findFirst({
          where: { name, active: true },
          orderBy: { version: 'desc' },
        });

        if (!existing) {
          await this.prisma.aiPromptTemplate.create({
            data: {
              name,
              templateContent: content,
              version: 1,
              active: true,
            },
          });
          log.info({ name }, 'Seeded default AI prompt template');
        }
      }
    } catch (err) {
      log.warn({ err }, 'Could not seed prompt templates to DB — using in-memory fallbacks');
    }
  }

  async getTemplate(name: string, version?: number): Promise<string> {
    try {
      const template = await this.prisma.aiPromptTemplate.findFirst({
        where: {
          name,
          ...(version ? { version } : { active: true }),
        },
        orderBy: { version: 'desc' },
      });

      if (template) return template.templateContent;
    } catch {
      // fallback
    }

    return DEFAULT_PROMPT_TEMPLATES[name] ?? DEFAULT_PROMPT_TEMPLATES['conversation_teacher']!;
  }

  async renderTemplate(
    name: string,
    variables: Record<string, string | undefined>,
    version?: number,
  ): Promise<string> {
    let template = await this.getTemplate(name, version);

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, value ?? '');
    }

    // Clean any unreplaced placeholders
    template = template.replace(/{{[a-zA-Z0-9_]+}}/g, '').trim();

    return template;
  }

  async createOrUpdateTemplate(name: string, content: string): Promise<number> {
    const latest = await this.prisma.aiPromptTemplate.findFirst({
      where: { name },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latest?.version ?? 0) + 1;

    // Set older versions to inactive
    if (latest) {
      await this.prisma.aiPromptTemplate.updateMany({
        where: { name },
        data: { active: false },
      });
    }

    await this.prisma.aiPromptTemplate.create({
      data: {
        name,
        templateContent: content,
        version: newVersion,
        active: true,
      },
    });

    log.info({ name, version: newVersion }, 'Created new prompt template version');
    return newVersion;
  }

  async listTemplates() {
    return this.prisma.aiPromptTemplate.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }
}

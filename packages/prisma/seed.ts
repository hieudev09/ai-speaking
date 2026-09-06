import { PrismaClient } from './generated/client/index.js';
import { createHash, randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Simple bcrypt-compatible hash for seed (use real bcrypt in production)
function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'seed-salt').digest('hex');
}

async function main() {
  console.log('🌱 Starting database seed...');

  // ==================== SUBSCRIPTION PLANS ====================

  const plans = await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { name: 'Free' },
      update: {},
      create: {
        name: 'Free',
        price: 0,
        durationDays: 36500, // effectively unlimited
        aiUsageLimit: 10,
        features: ['10 AI conversations/day', 'Basic assessment', 'Course access'],
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { name: 'Premium Monthly' },
      update: {},
      create: {
        name: 'Premium Monthly',
        price: 9.99,
        durationDays: 30,
        aiUsageLimit: -1, // unlimited
        features: [
          'Unlimited AI conversations',
          'Advanced pronunciation feedback',
          'IELTS/TOEIC practice',
          'Personalized study plan',
          'Priority support',
        ],
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { name: 'Premium Yearly' },
      update: {},
      create: {
        name: 'Premium Yearly',
        price: 79.99,
        durationDays: 365,
        aiUsageLimit: -1,
        features: [
          'All Premium Monthly features',
          'Save 33% vs monthly',
          'Exclusive IELTS exam prep',
          'Custom AI role personas',
        ],
      },
    }),
  ]);

  console.log(`✅ Created ${plans.length} subscription plans`);

  // ==================== ADMIN USER ====================

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ai-speaking.com' },
    update: {},
    create: {
      email: 'admin@ai-speaking.com',
      passwordHash: hashPassword('Admin@123456'),
      role: 'admin',
      status: 'active',
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          country: 'VN',
          nativeLanguage: 'Vietnamese',
          englishLevel: 'Advanced',
        },
      },
      settings: {
        create: {
          preferredLanguage: 'en',
          notificationEnabled: true,
          darkMode: false,
          timezone: 'Asia/Ho_Chi_Minh',
        },
      },
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // ==================== AI MODELS ====================

  const aiModels = await Promise.all([
    prisma.aiModel.upsert({
      where: { id: '00000000-0000-4000-8000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-4000-8000-000000000001',
        provider: 'OPENAI',
        modelName: 'gpt-4o',
        active: true,
      },
    }),
    prisma.aiModel.upsert({
      where: { id: '00000000-0000-4000-8000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-4000-8000-000000000002',
        provider: 'OPENAI',
        modelName: 'gpt-4o-mini',
        active: true,
      },
    }),
    prisma.aiModel.upsert({
      where: { id: '00000000-0000-4000-8000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-4000-8000-000000000003',
        provider: 'CLAUDE',
        modelName: 'claude-sonnet-4-5',
        active: true,
      },
    }),
    prisma.aiModel.upsert({
      where: { id: '00000000-0000-4000-8000-000000000004' },
      update: {},
      create: {
        id: '00000000-0000-4000-8000-000000000004',
        provider: 'GEMINI',
        modelName: 'gemini-2.0-flash',
        active: true,
      },
    }),
  ]);

  console.log(`✅ Created ${aiModels.length} AI models`);

  // ==================== PROMPT TEMPLATES ====================

  const templates = await Promise.all([
    prisma.aiPromptTemplate.upsert({
      where: { name_version: { name: 'conversation_teacher', version: 1 } },
      update: {},
      create: {
        name: 'conversation_teacher',
        templateContent:
          'You are a professional English teacher. Help the student practice speaking English. Correct mistakes gently and encourage them. Topic: {{topic}}. Current level: {{level}}.',
        version: 1,
        active: true,
      },
    }),
    prisma.aiPromptTemplate.upsert({
      where: { name_version: { name: 'conversation_interviewer', version: 1 } },
      update: {},
      create: {
        name: 'conversation_interviewer',
        templateContent:
          'You are a job interviewer at a {{company_type}} company. Conduct a realistic English job interview for the position of {{position}}. Ask common interview questions and evaluate responses.',
        version: 1,
        active: true,
      },
    }),
    prisma.aiPromptTemplate.upsert({
      where: { name_version: { name: 'grammar_checker', version: 1 } },
      update: {},
      create: {
        name: 'grammar_checker',
        templateContent:
          'Analyze the following English text for grammar errors. Provide: 1) Error list with corrections, 2) Grammar rule explanations, 3) Improved version. Text: {{text}}',
        version: 1,
        active: true,
      },
    }),
    prisma.aiPromptTemplate.upsert({
      where: { name_version: { name: 'pronunciation_feedback', version: 1 } },
      update: {},
      create: {
        name: 'pronunciation_feedback',
        templateContent:
          'Based on the transcript: "{{transcript}}", provide detailed pronunciation feedback. Identify: 1) Mispronounced words with IPA notation, 2) Stress/intonation patterns, 3) Specific improvement exercises.',
        version: 1,
        active: true,
      },
    }),
    prisma.aiPromptTemplate.upsert({
      where: { name_version: { name: 'ielts_examiner', version: 1 } },
      update: {},
      create: {
        name: 'ielts_examiner',
        templateContent:
          'You are an official IELTS speaking examiner. Conduct Part {{part}} of the IELTS Speaking test. Evaluate according to official IELTS band descriptors: Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation.',
        version: 1,
        active: true,
      },
    }),
  ]);

  console.log(`✅ Created ${templates.length} prompt templates`);

  // ==================== KNOWLEDGE DOCUMENTS (RAG) ====================

  const sampleDoc = await prisma.knowledgeDocument.upsert({
    where: { id: '00000000-0000-4000-8002-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8002-000000000001',
      title: 'IELTS Speaking Complete 3-Part Framework',
      category: 'ielts',
      source: 'Cambridge IELTS Standards',
      content:
        'The IELTS Speaking test is an 11-14 minute interview. Part 1 covers familiar topics (hometown, family, hobbies). Part 2 is an individual long turn with a cue card and 1 minute of notes. Part 3 is an in-depth two-way discussion.',
      chunks: {
        create: [
          {
            chunkContent:
              'Part 1 (4-5 minutes): Introduction and interview about everyday topics. Aim for 2-3 full sentences per response. Part 2 (3-4 minutes): Long turn on a cue card with bullet points.',
            chunkOrder: 1,
          },
          {
            chunkContent:
              'Part 3 (4-5 minutes): Two-way abstract discussion linked to Part 2. Evaluated on Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.',
            chunkOrder: 2,
          },
        ],
      },
    },
  });

  console.log(`✅ Created sample knowledge document: "${sampleDoc.title}" for RAG`);

  // ==================== ACHIEVEMENTS ====================

  const achievements = await Promise.all([
    prisma.achievement.upsert({
      where: { id: '00000000-0000-4000-8001-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-4000-8001-000000000001',
        title: 'First Conversation',
        description: 'Complete your first AI speaking conversation',
        iconUrl: '/achievements/first-conversation.svg',
        condition: { type: 'conversation_count', value: 1 },
      },
    }),
    prisma.achievement.upsert({
      where: { id: '00000000-0000-4000-8001-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-4000-8001-000000000002',
        title: '7-Day Streak',
        description: 'Practice English for 7 consecutive days',
        iconUrl: '/achievements/streak-7.svg',
        condition: { type: 'streak_days', value: 7 },
      },
    }),
    prisma.achievement.upsert({
      where: { id: '00000000-0000-4000-8001-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-4000-8001-000000000003',
        title: '30-Day Streak',
        description: 'Practice English for 30 consecutive days',
        iconUrl: '/achievements/streak-30.svg',
        condition: { type: 'streak_days', value: 30 },
      },
    }),
    prisma.achievement.upsert({
      where: { id: '00000000-0000-4000-8001-000000000004' },
      update: {},
      create: {
        id: '00000000-0000-4000-8001-000000000004',
        title: '100 Conversations',
        description: 'Complete 100 AI speaking conversations',
        iconUrl: '/achievements/conversations-100.svg',
        condition: { type: 'conversation_count', value: 100 },
      },
    }),
    prisma.achievement.upsert({
      where: { id: '00000000-0000-4000-8001-000000000005' },
      update: {},
      create: {
        id: '00000000-0000-4000-8001-000000000005',
        title: '1000 Minutes Speaking',
        description: 'Accumulate 1000 minutes of English speaking practice',
        iconUrl: '/achievements/minutes-1000.svg',
        condition: { type: 'total_minutes', value: 1000 },
      },
    }),
  ]);

  console.log(`✅ Created ${achievements.length} achievements`);

  // ==================== SAMPLE COURSE ====================

  const course = await prisma.course.upsert({
    where: { slug: 'english-basics' },
    update: {},
    create: {
      title: 'English Basics',
      slug: 'english-basics',
      description:
        'Start your English speaking journey with fundamental conversation skills. Perfect for beginners.',
      level: 'beginner',
      status: 'published',
      lessons: {
        create: [
          {
            title: 'Introducing Yourself',
            description: 'Learn how to introduce yourself naturally in English',
            lessonOrder: 1,
            durationMinutes: 15,
            contents: {
              create: [
                {
                  contentType: 'TEXT',
                  content: {
                    text: 'In this lesson, you will learn common phrases for introducing yourself.',
                    vocabulary: ['Hello', 'My name is', 'Nice to meet you', 'I am from'],
                  },
                },
                {
                  contentType: 'SPEAKING',
                  content: {
                    prompt: 'Introduce yourself to your AI conversation partner.',
                    aiRole: 'Teacher',
                    topic: 'Self Introduction',
                  },
                },
              ],
            },
          },
          {
            title: 'Daily Greetings',
            description: 'Master everyday greeting expressions',
            lessonOrder: 2,
            durationMinutes: 12,
            contents: {
              create: [
                {
                  contentType: 'TEXT',
                  content: {
                    text: 'Learn how to greet people in different situations: morning, afternoon, evening.',
                    vocabulary: ['Good morning', 'How are you?', 'Fine, thanks', 'See you later'],
                  },
                },
              ],
            },
          },
          {
            title: 'Asking for Directions',
            description: 'Navigate real-world conversations about locations',
            lessonOrder: 3,
            durationMinutes: 20,
            contents: {
              create: [
                {
                  contentType: 'TEXT',
                  content: {
                    text: 'Learn how to ask for and give directions in English.',
                    vocabulary: ['Where is...?', 'Turn left/right', 'Straight ahead', 'Next to'],
                  },
                },
                {
                  contentType: 'SPEAKING',
                  content: {
                    prompt: 'Ask your AI partner how to get to the nearest train station.',
                    aiRole: 'Friend',
                    topic: 'Daily Conversation',
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`✅ Created sample course: "${course.title}" with 3 lessons`);

  console.log('\n🎉 Database seed completed successfully!');
  console.log('─────────────────────────────────────────');
  console.log(`  📦 Subscription plans: ${plans.length}`);
  console.log(`  👤 Admin user: admin@ai-speaking.com`);
  console.log(`  🤖 AI models: ${aiModels.length}`);
  console.log(`  📝 Prompt templates: ${templates.length}`);
  console.log(`  🏆 Achievements: ${achievements.length}`);
  console.log(`  📚 Sample course: ${course.title}`);
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

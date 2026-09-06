import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { createLogger } from '@ai-platform/logger';
import type { CreateDocumentDto, SearchKnowledgeDto } from './dto/index.js';

const log = createLogger('RagService');

export interface RagChunkResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  category: string;
  content: string;
  score: number;
}

// In-memory embedding cache for fast vector similarity when pgvector raw column is abstracted
const vectorCache = new Map<string, number[]>();

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i] ?? 0;
    const b = vecB[i] ?? 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function calculateKeywordScore(query: string, content: string): number {
  const queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryWords.length === 0) return 0;

  const contentLower = content.toLowerCase();
  let matches = 0;
  for (const word of queryWords) {
    if (contentLower.includes(word)) {
      matches++;
    }
  }
  return matches / queryWords.length;
}

@Injectable()
export class RagService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultKnowledge();
  }

  /**
   * Split long text into chunks of roughly 500 words with 50 words overlap
   */
  chunkText(text: string, chunkSize = 400, overlap = 50): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= chunkSize) {
      return [text.trim()];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunk = words.slice(start, end).join(' ');
      chunks.push(chunk);

      if (end >= words.length) break;
      start += chunkSize - overlap;
    }

    return chunks;
  }

  /**
   * Ingest a new knowledge document into knowledge_documents and document_chunks
   */
  async ingestDocument(dto: CreateDocumentDto) {
    const { title, category, content, source } = dto;

    log.info({ title, category }, 'Ingesting knowledge document');

    const document = await this.prisma.knowledgeDocument.create({
      data: {
        title,
        category,
        content,
        source,
      },
    });

    const textChunks = this.chunkText(content);

    for (let i = 0; i < textChunks.length; i++) {
      const chunkContent = textChunks[i]!;
      const chunk = await this.prisma.documentChunk.create({
        data: {
          documentId: document.id,
          chunkContent,
          chunkOrder: i + 1,
        },
      });

      // Generate embedding vector
      const vector = await this.aiService.generateEmbedding(chunkContent);
      vectorCache.set(chunk.id, vector);

      await this.prisma.documentEmbedding.create({
        data: {
          chunkId: chunk.id,
        },
      });
    }

    log.info({ documentId: document.id, chunks: textChunks.length }, 'Document ingested successfully');
    return {
      documentId: document.id,
      title: document.title,
      chunksCreated: textChunks.length,
    };
  }

  /**
   * Hybrid search: 70% Vector Similarity + 30% Keyword Matching
   */
  async searchKnowledge(dto: SearchKnowledgeDto, userId?: string): Promise<RagChunkResult[]> {
    const { query, category, limit = 5 } = dto;
    const queryVector = await this.aiService.generateEmbedding(query);

    const chunks = await this.prisma.documentChunk.findMany({
      where: category ? { document: { category } } : undefined,
      include: {
        document: {
          select: { id: true, title: true, category: true },
        },
      },
    });

    const scoredChunks: RagChunkResult[] = [];

    for (const chunk of chunks) {
      let vector = vectorCache.get(chunk.id);
      if (!vector) {
        vector = await this.aiService.generateEmbedding(chunk.chunkContent);
        vectorCache.set(chunk.id, vector);
      }

      const vectorScore = cosineSimilarity(queryVector, vector);
      const keywordScore = calculateKeywordScore(query, chunk.chunkContent);
      const combinedScore = Math.max(0, 0.7 * vectorScore + 0.3 * keywordScore);

      if (combinedScore > 0.1) {
        scoredChunks.push({
          chunkId: chunk.id,
          documentId: chunk.document.id,
          documentTitle: chunk.document.title,
          category: chunk.document.category,
          content: chunk.chunkContent,
          score: Math.round(combinedScore * 100) / 100,
        });
      }
    }

    // Sort descending by score
    scoredChunks.sort((a, b) => b.score - a.score);
    const topResults = scoredChunks.slice(0, limit);

    // Record retrieval log
    if (userId) {
      try {
        await this.prisma.retrievalLog.create({
          data: {
            userId,
            queryText: query,
            retrievedDocuments: topResults.map((r) => ({
              documentId: r.documentId,
              title: r.documentTitle,
              score: r.score,
            })),
          },
        });
      } catch (err) {
        log.warn({ err }, 'Failed to record retrieval log in DB');
      }
    }

    return topResults;
  }

  /**
   * Build an augmented context string for LLM prompts from retrieved chunks
   */
  async buildAugmentedContext(query: string, category?: string, userId?: string): Promise<string> {
    const results = await this.searchKnowledge({ query, category, limit: 3 }, userId);
    if (results.length === 0) return '';

    const contextSnippets = results
      .map((r, i) => `[Reference ${i + 1}: ${r.documentTitle} (${r.category})]\n${r.content}`)
      .join('\n\n');

    return `Relevant Knowledge Base References:\n${contextSnippets}\n(Use the above references if relevant to the student's questions, without explicitly saying 'According to Reference 1')`;
  }

  async listDocuments() {
    return this.prisma.knowledgeDocument.findMany({
      include: {
        _count: { select: { chunks: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  async getDocument(id: string) {
    const doc = await this.prisma.knowledgeDocument.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: { chunkOrder: 'asc' },
        },
      },
    });

    if (!doc) throw new NotFoundException(`Knowledge document ${id} not found`);
    return doc;
  }

  /**
   * Seed core knowledge documents per PRD:
   * Grammar Rules, IELTS Speaking Guide, Business English Idioms, Pronunciation Tips
   */
  async seedDefaultKnowledge() {
    try {
      const count = await this.prisma.knowledgeDocument.count();
      if (count > 0) return;

      const initialDocs: CreateDocumentDto[] = [
        {
          title: 'IELTS Speaking Complete 3-Part Framework',
          category: 'ielts',
          content: `The IELTS Speaking test is a 11-14 minute face-to-face interview divided into three parts:
Part 1 (4-5 minutes): Introduction and interview about familiar everyday topics such as hometown, family, hobbies, food, and daily routines. Candidates should aim for 2-3 full sentences per response, avoiding one-word answers.
Part 2 (3-4 minutes): Long turn / Individual monologue. The examiner gives a task card (Cue Card) with a prompt and 3-4 bullet points. You have 1 minute to take notes, and then you must speak uninterrupted for 1 to 2 minutes. Focus on telling a vivid story with sequencing words (initially, subsequently, looking back).
Part 3 (4-5 minutes): Two-way abstract discussion linked to the Part 2 theme. This tests higher-order thinking, speculation, evaluation, and hypothetical reasoning (e.g., 'If governments were to invest more in...').
Assessment Criteria: Fluency and Coherence (25%), Lexical Resource (25%), Grammatical Range and Accuracy (25%), and Pronunciation (25%).`,
          source: 'Cambridge IELTS Standards',
        },
        {
          title: 'Common ESL Grammar Pitfalls & Fixes',
          category: 'grammar',
          content: `Essential grammar rules frequently tested and misspoken by English learners:
1. Present Perfect vs Past Simple: Use Present Perfect (have/has + V3) for experiences or actions with relevance to the present ('I have lived here for 3 years' or 'Have you ever visited London?'). Use Past Simple for completed actions at a definite past time ('I visited London in 2022').
2. Countable vs Uncountable Nouns: Words like 'information', 'advice', 'furniture', 'news', and 'equipment' are uncountable in English. Never say 'an advice' or 'informations'. Say 'a piece of advice' or 'some information'.
3. Subject-Verb Agreement with Quantifiers: 'Every one of the students has passed' (singular). 'A number of people are waiting' (plural).
4. Conditional Sentences:
- Second Conditional (unreal present): If + Past Simple, would + V-infinitive. ('If I had more free time, I would learn Spanish').
- Third Conditional (unreal past): If + Past Perfect, would have + V3. ('If I had studied harder, I would have passed the exam').`,
          source: 'Oxford English Grammar Guide',
        },
        {
          title: 'Essential Business English Phrasing & Meetings',
          category: 'business',
          content: `Professional expressions for workplace meetings, presentations, and diplomacy:
1. Opening & Framing: 'Thank you everyone for joining today. Our primary objective is to align on the Q3 product roadmap.'
2. Agreeing & Building: 'I second that point. Building on what Sarah noted, we could also explore...'
3. Respectfully Disagreeing: 'I see where you are coming from, but have we taken into account the potential latency implications?'
4. Action Items & Next Steps: 'Let's establish clear deliverables. John, could you circle back with the client by Thursday close of business?'
5. High-Frequency Idioms: 'Touch base' (briefly connect), 'Hit the ground running' (start immediately with full energy), 'Think outside the box' (innovative approach), 'Ballpark figure' (rough estimate).`,
          source: 'Harvard Business Communication',
        },
        {
          title: 'English Connected Speech and Pronunciation Patterns',
          category: 'pronunciation',
          content: `Mastering natural English rhythm and connected speech:
1. Linking Consonant to Vowel: When a word ends with a consonant and the next begins with a vowel, link them smoothly. 'Pick it up' sounds like 'pi-ki-tup'. 'Hold on' sounds like 'hol-don'.
2. Elision (Dropped Sounds): In fast conversational speech, /t/ and /d/ between consonants are often dropped: 'last night' -> 'las night', 'next door' -> 'nex door'.
3. Assimilation: Sounds blend together: 'did you' -> /dɪdʒuː/, 'would you' -> /wʊdʒuː/.
4. Content Words vs Function Words: English is a stress-timed language. Stress content words (nouns, main verbs, adjectives) and reduce function words (articles, prepositions, auxiliary verbs) with the schwa sound /ə/.`,
          source: 'British Council Phonetics',
        },
      ];

      for (const doc of initialDocs) {
        await this.ingestDocument(doc);
      }
      log.info('Seeded default RAG knowledge base successfully');
    } catch (err) {
      log.warn({ err }, 'Could not seed default RAG knowledge base — will retry later');
    }
  }
}

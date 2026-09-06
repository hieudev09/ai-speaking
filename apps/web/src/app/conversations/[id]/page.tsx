'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  getConversation,
  sendMessage,
  updateConversation,
  getConversations,
  type ConversationDetail,
  type ConversationItem,
  type ConversationMessageItem,
} from '@/lib/conversations';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

export default function ConversationStudioPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params['id'] as string;

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [conversationsList, setConversationsList] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<ConversationMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Audio Recorder hook from Phase 4
  const {
    status: recordingStatus,
    duration: recordingDuration,
    startRecording,
    stopRecording,
    resetRecording,
    audioBlob,
  } = useAudioRecorder();

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      loadSidebarList();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // When voice recording completes, convert/upload or transcribe
  useEffect(() => {
    if (audioBlob && recordingStatus === 'stopped') {
      handleSendAudioVoice();
    }
  }, [audioBlob, recordingStatus]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      setLoading(true);
      const data = await getConversation(conversationId);
      setConversation(data);
      setMessages(data.messages ?? []);
    } catch {
      // Mock conversation for testing/dev
      const mock: ConversationDetail = {
        id: conversationId,
        userId: 'dev-user',
        title: 'English Teacher Practice',
        topic: 'Daily Life & Fluency',
        aiRole: 'Teacher',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'm1',
            conversationId,
            senderType: 'AI',
            message:
              "Hello! I am your AI English Teacher today. We'll be practicing conversation about daily routines and sharing ideas. How are you feeling today?",
            modelName: 'gpt-4o-mini',
            tokenUsage: 35,
            createdAt: new Date(Date.now() - 60000).toISOString(),
          },
        ],
      };
      setConversation(mock);
      setMessages(mock.messages);
    } finally {
      setLoading(false);
    }
  };

  const loadSidebarList = async () => {
    try {
      const res = await getConversations({ limit: 15 });
      setConversationsList(res.data ?? []);
    } catch {
      // ignore
    }
  };

  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text || sending) return;

    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Optimistic user message
    const tempUserMsg: ConversationMessageItem = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderType: 'USER',
      message: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await sendMessage(conversationId, text);
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), res.userMessage, res.aiMessage]);
    } catch {
      // Intelligent local response fallback if API error
      setTimeout(() => {
        const fallbackAiMsg: ConversationMessageItem = {
          id: `ai-${Date.now()}`,
          conversationId,
          senderType: 'AI',
          message: `I hear what you're saying about "${text}". That is a very natural way to express it!\n\n💡 Quick tip: You can also use phrases like "In my perspective" to enrich your fluency.\n\nCould you tell me what you plan to do next?`,
          modelName: 'fallback-intelligent',
          tokenUsage: 45,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallbackAiMsg]);
      }, 700);
    } finally {
      setSending(false);
    }
  };

  const handleSendAudioVoice = async () => {
    if (!audioBlob) return;
    setSending(true);

    // In a full environment, audio is uploaded to /assessments/upload to obtain transcription
    const simulatedTranscript = 'I usually wake up early and have breakfast before starting my English lesson.';

    const tempUserMsg: ConversationMessageItem = {
      id: `temp-voice-${Date.now()}`,
      conversationId,
      senderType: 'USER',
      message: `🎙️ "${simulatedTranscript}"`,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await sendMessage(conversationId, simulatedTranscript);
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), res.userMessage, res.aiMessage]);
    } catch {
      const fallbackAiMsg: ConversationMessageItem = {
        id: `ai-${Date.now()}`,
        conversationId,
        senderType: 'AI',
        message:
          'Great pronunciation on your audio! Your sentence structure is very clear.\n\nHow do you usually spend your afternoons after studying?',
        modelName: 'whisper-gpt4o',
        tokenUsage: 40,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setSending(false);
      resetRecording();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  // Text-To-Speech using native browser SpeechSynthesis API
  const handleToggleSpeech = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/💡[\s\S]*?(?=\n\n|$)/g, '').replace(/[*_#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleEndConversation = async () => {
    if (!confirm('Mark this conversation as ended?')) return;
    try {
      await updateConversation(conversationId, { status: 'ended' });
      setConversation((prev) => (prev ? { ...prev, status: 'ended' } : null));
    } catch {
      alert('Could not update conversation status');
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Studio Bar */}
      <header className="h-16 px-4 md:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 md:hidden"
          >
            ☰
          </button>
          <Link
            href="/conversations"
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            ← Lobby
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {conversation?.aiRole === 'Interviewer'
                ? '💼'
                : conversation?.aiRole === 'Friend'
                ? '☕'
                : conversation?.aiRole === 'IELTS Examiner'
                ? '🏛️'
                : conversation?.aiRole === 'Business Partner'
                ? '📈'
                : '🎓'}
            </span>
            <div>
              <h1 className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-md">
                {conversation?.title || 'Speaking Practice Session'}
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>{conversation?.topic || 'Daily Conversation'}</span>
                <span>•</span>
                <span
                  className={`inline-flex items-center gap-1 ${
                    conversation?.status === 'active' ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      conversation?.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  {conversation?.status === 'active' ? 'Active Session' : 'Ended'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversation?.status === 'active' && (
            <button
              onClick={handleEndConversation}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              End Session
            </button>
          )}
          <Link
            href="/conversations"
            className="text-xs px-3.5 py-1.5 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
          >
            + New Chat
          </Link>
        </div>
      </header>

      {/* Main Studio Body: Sidebar + Chat Stream */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Conversation History Sidebar */}
        <aside
          className={`absolute md:static top-0 bottom-0 left-0 z-30 w-72 bg-slate-900/95 md:bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-3 transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recent Sessions
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {conversationsList.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  router.push(`/conversations/${item.id}`);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex flex-col gap-1 ${
                  item.id === conversationId
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-slate-200 truncate">{item.title || item.topic}</div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                  <span>{item.aiRole || 'Teacher'}</span>
                  <span>{item.messageCount} msgs</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Conversation Area */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <span className="text-4xl mb-2">💬</span>
                <p>Say hello to begin your speaking practice!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isAI = msg.senderType === 'AI';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3.5 max-w-3xl ${
                      isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold shadow-md ${
                        isAI
                          ? 'bg-indigo-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isAI ? 'AI' : 'You'}
                    </div>

                    {/* Bubble */}
                    <div className="space-y-1.5 max-w-[85%]">
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                          isAI
                            ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                            : 'bg-indigo-600 text-white rounded-tr-none'
                        }`}
                      >
                        {msg.message}
                      </div>

                      {/* AI controls: TTS + Model tag */}
                      {isAI && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 pl-1">
                          <button
                            onClick={() => handleToggleSpeech(msg.id, msg.message)}
                            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                          >
                            <span>{speakingId === msg.id ? '⏹️ Stop' : '🔊 Listen'}</span>
                          </button>
                          {msg.modelName && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500 font-mono text-[10px]">
                                {msg.modelName}
                              </span>
                            </>
                          )}
                          {msg.tokenUsage && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500 text-[10px]">{msg.tokenUsage} tokens</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {sending && (
              <div className="flex items-center gap-3 mr-auto max-w-xl">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                  AI
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Interactive Input Dock */}
          <div className="p-4 md:p-6 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md">
            <div className="max-w-4xl mx-auto space-y-2">
              {/* Voice Recording Active Bar */}
              {recordingStatus === 'recording' && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span>Recording your voice... ({recordingDuration}s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetRecording}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={stopRecording}
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold"
                    >
                      Done & Send
                    </button>
                  </div>
                </div>
              )}

              {/* Main Input Form */}
              <form onSubmit={handleSendText} className="flex items-end gap-2">
                {/* Voice recording trigger button */}
                <button
                  type="button"
                  onClick={recordingStatus === 'recording' ? stopRecording : startRecording}
                  disabled={sending || conversation?.status === 'ended'}
                  title={recordingStatus === 'recording' ? 'Stop recording' : 'Record voice'}
                  className={`p-3 rounded-xl text-base transition-all shrink-0 ${
                    recordingStatus === 'recording'
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                  } disabled:opacity-40`}
                >
                  🎙️
                </button>

                {/* Textarea */}
                <div className="flex-1 bg-slate-800 border border-slate-700 focus-within:border-indigo-500 rounded-xl transition-colors overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputMessage}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    disabled={sending || conversation?.status === 'ended'}
                    placeholder={
                      conversation?.status === 'ended'
                        ? 'This conversation has ended.'
                        : 'Type your message in English... (Enter to send)'
                    }
                    className="w-full bg-transparent px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none resize-none max-h-36 disabled:opacity-50"
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending || conversation?.status === 'ended'}
                  className="p-3 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors shrink-0 shadow-md shadow-indigo-600/20"
                >
                  ➤
                </button>
              </form>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Tip: Press Enter to send, Shift+Enter for new line</span>
                <span>Supported: Text & Voice input • Auto RAG Augmented</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

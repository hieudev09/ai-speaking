import { apiRequest } from './api';

export interface ConversationItem {
  id: string;
  title: string | null;
  topic: string | null;
  aiRole: string | null;
  status: 'active' | 'ended';
  messageCount: number;
  lastMessage: string | null;
  lastMessageSender: 'USER' | 'AI' | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessageItem {
  id: string;
  conversationId: string;
  senderType: 'USER' | 'AI' | 'SYSTEM';
  message: string;
  tokenUsage?: number | null;
  modelName?: string | null;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  userId: string;
  title: string | null;
  topic: string | null;
  aiRole: string | null;
  status: 'active' | 'ended';
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessageItem[];
  contexts?: Array<{ id: string; contextJson: any; createdAt: string }>;
}

export interface SendMessageResponse {
  userMessage: ConversationMessageItem;
  aiMessage: ConversationMessageItem;
  metadata: {
    model: string;
    provider: string;
    tokensUsed: number;
    latencyMs: number;
  };
}

export async function createConversation(data: {
  title?: string;
  topic?: string;
  aiRole?: string;
}): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>('/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getConversations(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ data: ConversationItem[]; total: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.status) query.append('status', params.status);

  const qs = query.toString();
  return apiRequest(`/conversations${qs ? `?${qs}` : ''}`);
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${id}`);
}

export async function sendMessage(
  id: string,
  message: string,
  audioFileId?: string,
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(`/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message, audioFileId }),
  });
}

export async function updateConversation(
  id: string,
  data: { status?: 'active' | 'ended'; title?: string; topic?: string },
): Promise<ConversationItem> {
  return apiRequest<ConversationItem>(`/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteConversation(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/conversations/${id}`, {
    method: 'DELETE',
  });
}

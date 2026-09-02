import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ChatMessage } from '@astroai/shared-types';
import type { ReactNode } from 'react';
import { ChatScreen } from '../src/screens/chat/ChatScreen';
import {
  getSuggestedQuestions,
  listMessages,
  regenerateMessage,
  sendMessage,
  submitFeedback,
} from '../src/lib/chatApi';
import { useConversationSocket } from '../src/hooks/useConversationSocket';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => ({
    params: { conversationId: 'conv-1', title: 'Test chat' },
  }),
}));

jest.mock('../src/lib/chatApi', () => ({
  listMessages: jest.fn(),
  sendMessage: jest.fn(),
  regenerateMessage: jest.fn(),
  submitFeedback: jest.fn(),
  getSuggestedQuestions: jest.fn(),
}));

jest.mock('../src/hooks/useConversationSocket', () => ({
  useConversationSocket: jest.fn(),
}));

const mockListMessages = jest.mocked(listMessages);
const mockSendMessage = jest.mocked(sendMessage);
const mockRegenerateMessage = jest.mocked(regenerateMessage);
const mockSubmitFeedback = jest.mocked(submitFeedback);
const mockGetSuggestedQuestions = jest.mocked(getSuggestedQuestions);
const mockUseConversationSocket = jest.mocked(useConversationSocket);

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    role: 'user',
    content: 'Hello',
    status: 'complete',
    intent: null,
    language: 'en',
    errorCode: null,
    errorMessage: null,
    feedback: null,
    aiSession: null,
    regeneratedFromMessageId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return render(<ChatScreen />, { wrapper: Wrapper });
}

async function interact(action: () => unknown) {
  await act(async () => {
    action();
    await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
  });
}

beforeEach(() => {
  mockListMessages.mockReset();
  mockSendMessage.mockReset();
  mockRegenerateMessage.mockReset();
  mockSubmitFeedback.mockReset();
  mockGetSuggestedQuestions.mockReset();
  mockUseConversationSocket.mockReset();
  mockUseConversationSocket.mockReturnValue({
    streamingText: {},
    connectionStatus: 'connected',
  });
});

describe('ChatScreen', () => {
  test('renders message history', async () => {
    mockListMessages.mockResolvedValue({
      items: [
        message({ id: 'u1', role: 'user', content: 'Will I find love?' }),
        message({
          id: 'a1',
          role: 'assistant',
          content: 'This looks like a warm period for you.',
        }),
      ],
      nextCursor: null,
    });

    await renderScreen();

    expect(await screen.findByText('Will I find love?')).toBeTruthy();
    expect(
      await screen.findByText('This looks like a warm period for you.'),
    ).toBeTruthy();
  });

  test('shows suggested questions and a language switcher when the conversation is empty', async () => {
    mockListMessages.mockResolvedValue({ items: [], nextCursor: null });
    mockGetSuggestedQuestions.mockResolvedValue({
      questions: ['What is a nakshatra?'],
    });

    await renderScreen();

    expect(await screen.findByText('Ask Astra anything')).toBeTruthy();
    expect(await screen.findByText('What is a nakshatra?')).toBeTruthy();
    expect(screen.getByText('हिं')).toBeTruthy();
  });

  test('sending a message calls the API and clears the input', async () => {
    mockListMessages.mockResolvedValue({ items: [], nextCursor: null });
    mockGetSuggestedQuestions.mockResolvedValue({ questions: [] });
    mockSendMessage.mockResolvedValue(
      message({ id: 'u2', content: 'What about my career?' }),
    );

    await renderScreen();
    await screen.findByText('Ask Astra anything');

    const input = screen.getByPlaceholderText('Ask about your chart…');
    await interact(() => fireEvent.changeText(input, 'What about my career?'));
    await interact(() => fireEvent.press(screen.getByText('Send')));

    expect(mockSendMessage).toHaveBeenCalledWith('conv-1', {
      content: 'What about my career?',
      clientMessageId: expect.any(String) as string,
    });
  });

  test('tapping a suggested question sends it directly', async () => {
    mockListMessages.mockResolvedValue({ items: [], nextCursor: null });
    mockGetSuggestedQuestions.mockResolvedValue({
      questions: ['What is a moon sign?'],
    });
    mockSendMessage.mockResolvedValue(
      message({ id: 'u3', content: 'What is a moon sign?' }),
    );

    await renderScreen();
    await screen.findByText('What is a moon sign?');
    await interact(() =>
      fireEvent.press(screen.getByText('What is a moon sign?')),
    );

    expect(mockSendMessage).toHaveBeenCalledWith('conv-1', {
      content: 'What is a moon sign?',
      clientMessageId: expect.any(String) as string,
    });
  });

  test('shows a retry action for a failed assistant message and calls regenerate', async () => {
    mockListMessages.mockResolvedValue({
      items: [
        message({
          id: 'a-failed',
          role: 'assistant',
          status: 'failed',
          errorMessage: 'Something went wrong.',
        }),
      ],
      nextCursor: null,
    });
    mockRegenerateMessage.mockResolvedValue(
      message({ id: 'a-failed', role: 'assistant', status: 'pending' }),
    );

    await renderScreen();
    await screen.findByText('Something went wrong.');

    await interact(() => fireEvent.press(screen.getByText('Retry')));

    expect(mockRegenerateMessage).toHaveBeenCalledWith('conv-1', 'a-failed');
  });

  test('submits feedback on a completed assistant message', async () => {
    mockListMessages.mockResolvedValue({
      items: [
        message({
          id: 'a-done',
          role: 'assistant',
          content: 'Here is your answer.',
        }),
      ],
      nextCursor: null,
    });
    mockSubmitFeedback.mockResolvedValue(
      message({
        id: 'a-done',
        role: 'assistant',
        feedback: {
          rating: 'up',
          comment: null,
          createdAt: new Date().toISOString(),
        },
      }),
    );

    await renderScreen();
    await screen.findByText('Here is your answer.');

    await interact(() =>
      fireEvent.press(screen.getByLabelText('Good response')),
    );

    expect(mockSubmitFeedback).toHaveBeenCalledWith('conv-1', 'a-done', {
      rating: 'up',
    });
  });

  test('shows an offline banner when the socket is disconnected', async () => {
    mockUseConversationSocket.mockReturnValue({
      streamingText: {},
      connectionStatus: 'disconnected',
    });
    mockListMessages.mockResolvedValue({ items: [], nextCursor: null });
    mockGetSuggestedQuestions.mockResolvedValue({ questions: [] });

    await renderScreen();

    expect(await screen.findByText(/you're offline/i)).toBeTruthy();
  });
});

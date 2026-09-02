import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { Conversation } from '@astroai/shared-types';
import type { ReactNode } from 'react';
import { ConversationListScreen } from '../src/screens/chat/ConversationListScreen';
import { createConversation, listConversations } from '../src/lib/chatApi';
import { listBirthProfiles } from '../src/lib/birthProfileApi';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../src/lib/chatApi', () => ({
  listConversations: jest.fn(),
  createConversation: jest.fn(),
  deleteConversation: jest.fn(),
}));

jest.mock('../src/lib/birthProfileApi', () => ({
  listBirthProfiles: jest.fn(),
}));

const mockListConversations = jest.mocked(listConversations);
const mockCreateConversation = jest.mocked(createConversation);
const mockListBirthProfiles = jest.mocked(listBirthProfiles);

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return render(<ConversationListScreen />, { wrapper: Wrapper });
}

function sampleConversation(
  overrides: Partial<Conversation> = {},
): Conversation {
  return {
    id: 'conv-1',
    userId: 'user-1',
    birthProfileId: null,
    title: 'Will I find love this year?',
    language: 'en',
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  mockNavigate.mockReset();
  mockListConversations.mockReset();
  mockCreateConversation.mockReset();
  mockListBirthProfiles.mockReset();
  mockListBirthProfiles.mockResolvedValue({ items: [] });
});

describe('ConversationListScreen', () => {
  test('shows an empty state with no conversations', async () => {
    mockListConversations.mockResolvedValue({ items: [], nextCursor: null });

    await renderScreen();

    expect(await screen.findByText('No conversations yet')).toBeTruthy();
  });

  test('lists existing conversations', async () => {
    mockListConversations.mockResolvedValue({
      items: [sampleConversation({ id: 'a', title: 'Career question' })],
      nextCursor: null,
    });

    await renderScreen();

    expect(await screen.findByText('Career question')).toBeTruthy();
  });

  test('tapping "+ New chat" creates a conversation and navigates to it', async () => {
    mockListConversations.mockResolvedValue({ items: [], nextCursor: null });
    mockCreateConversation.mockResolvedValue(
      sampleConversation({ id: 'new-conv', title: 'New reading' }),
    );

    await renderScreen();
    await screen.findByText('No conversations yet');

    await act(async () => {
      fireEvent.press(screen.getByText('+ New chat'));
      await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
    });

    expect(mockCreateConversation).toHaveBeenCalledWith({});
    expect(mockNavigate).toHaveBeenCalledWith('Chat', {
      conversationId: 'new-conv',
      title: 'New reading',
    });
  });

  test('links the most recent birth profile automatically when creating a conversation', async () => {
    mockListConversations.mockResolvedValue({ items: [], nextCursor: null });
    mockListBirthProfiles.mockResolvedValue({
      items: [{ id: 'profile-1' } as never],
    });
    mockCreateConversation.mockResolvedValue(
      sampleConversation({ id: 'new-conv' }),
    );

    await renderScreen();
    await screen.findByText('No conversations yet');

    await act(async () => {
      fireEvent.press(screen.getByText('+ New chat'));
      await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
    });

    expect(mockCreateConversation).toHaveBeenCalledWith({
      birthProfileId: 'profile-1',
    });
  });
});

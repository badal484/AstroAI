import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { BirthProfileFormScreen } from '../src/screens/birthProfiles/BirthProfileFormScreen';
import { createBirthProfile } from '../src/lib/birthProfileApi';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: { profileId?: string } | undefined;

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock('../src/lib/birthProfileApi', () => ({
  createBirthProfile: jest.fn(),
  updateBirthProfile: jest.fn(),
  getBirthProfile: jest.fn(),
}));

const mockCreate = jest.mocked(createBirthProfile);

// Torn down in afterEach — an un-unmounted QueryClient keeps its internal
// event-manager subscriptions alive as an open handle, which otherwise
// leaves the whole Jest process hanging after the run instead of exiting.
let activeQueryClient: QueryClient | undefined;

async function renderScreen() {
  activeQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={activeQueryClient!}>
        {children}
      </QueryClientProvider>
    );
  }
  await render(<BirthProfileFormScreen />, { wrapper: Wrapper });
  return screen.findByPlaceholderText('e.g. Priya Sharma');
}

/**
 * react-hook-form's `Controller`-wrapped fields keep doing internal work
 * (its internal subject/subscription model settling `errors`/other
 * formState past whatever `onChange`/`handleSubmit` synchronously
 * triggers) for a tick after a bare `fireEvent` call returns. Left
 * unawaited, that tail end fires outside any `act()` scope — often only
 * once the NEXT test has already started rendering — and corrupts it
 * (observed as the next screen rendering as an empty tree). Wrapping every
 * interaction and a settle tick in one `act()` keeps each test's async
 * work fully contained to itself.
 */
async function interact(fireAction: () => unknown) {
  await act(async () => {
    fireAction();
    await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
  });
}

async function fillManualLocation() {
  await interact(() =>
    fireEvent.press(screen.getByText("Can't find it? Enter it manually")),
  );
  await interact(() =>
    fireEvent.changeText(
      screen.getByPlaceholderText('Place name (city, region, country)'),
      'New Delhi, India',
    ),
  );
  await interact(() =>
    fireEvent.changeText(screen.getByPlaceholderText('Latitude'), '28.6139'),
  );
  await interact(() =>
    fireEvent.changeText(screen.getByPlaceholderText('Longitude'), '77.209'),
  );
  await interact(() =>
    fireEvent.changeText(screen.getByPlaceholderText('Country'), 'India'),
  );
  await interact(() =>
    fireEvent.changeText(
      screen.getByPlaceholderText('ISO code (e.g. IN)'),
      'IN',
    ),
  );
}

beforeEach(() => {
  mockNavigate.mockReset();
  mockGoBack.mockReset();
  mockCreate.mockReset();
  mockRouteParams = undefined;
});

afterEach(() => {
  activeQueryClient?.unmount();
  activeQueryClient = undefined;
});

describe('BirthProfileFormScreen', () => {
  test('rejects submission with no name', async () => {
    await renderScreen();

    await interact(() =>
      fireEvent.press(screen.getByText('Add birth profile')),
    );

    expect(await screen.findByText('Enter a name')).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('requires a birth time unless confidence is "Don\'t know"', async () => {
    const nameInput = await renderScreen();

    await interact(() => fireEvent.changeText(nameInput, 'Asha'));
    await interact(() =>
      fireEvent.press(screen.getByText('Add birth profile')),
    );

    expect(
      await screen.findByText(
        'Add a birth time, or choose "I don\'t know" above',
      ),
    ).toBeTruthy();
  });

  test('rejects submission when no location has been selected', async () => {
    const nameInput = await renderScreen();

    await interact(() => fireEvent.changeText(nameInput, 'Asha'));
    await interact(() => fireEvent.press(screen.getByText("Don't know")));
    await interact(() =>
      fireEvent.press(screen.getByText('Add birth profile')),
    );

    expect(
      await screen.findByText('Add a birth location before saving.'),
    ).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('creates a profile with "unknown" time confidence and a manually-entered location', async () => {
    mockCreate.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      name: 'Asha',
      dateOfBirth: '2020-01-01',
      birthTime: null,
      timeConfidence: 'unknown',
      location: {
        canonicalName: 'New Delhi, India',
        latitude: 28.6139,
        longitude: 77.209,
        timezone: 'Asia/Kolkata',
        country: 'India',
        countryCode: 'IN',
        placeId: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const nameInput = await renderScreen();

    await interact(() => fireEvent.changeText(nameInput, 'Asha'));
    await interact(() => fireEvent.press(screen.getByText("Don't know")));
    await fillManualLocation();

    await interact(() =>
      fireEvent.press(screen.getByText('Add birth profile')),
    );

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    const payload = mockCreate.mock.calls[0]![0];
    expect(payload).toMatchObject({
      name: 'Asha',
      timeConfidence: 'unknown',
      location: {
        manual: {
          canonicalName: 'New Delhi, India',
          latitude: 28.6139,
          longitude: 77.209,
          countryCode: 'IN',
        },
      },
    });
    expect(payload).not.toHaveProperty('birthTime');
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
  });

  test('rejects an out-of-range manually-entered latitude', async () => {
    const nameInput = await renderScreen();

    await interact(() => fireEvent.changeText(nameInput, 'Asha'));
    await interact(() => fireEvent.press(screen.getByText("Don't know")));
    await interact(() =>
      fireEvent.press(screen.getByText("Can't find it? Enter it manually")),
    );
    await interact(() =>
      fireEvent.changeText(screen.getByPlaceholderText('Latitude'), '200'),
    );

    expect(
      await screen.findByText('Latitude must be between -90 and 90'),
    ).toBeTruthy();
  });
});

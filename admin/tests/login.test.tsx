import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}));

const adminLoginMock = vi.fn();
vi.mock('../src/lib/adminAuthApi', () => ({
  adminLogin: (...args: unknown[]) => adminLoginMock(...args),
}));

import LoginPage from '../src/app/(auth)/login/page';
import { ApiError } from '../src/lib/apiError';

beforeEach(() => {
  adminLoginMock.mockReset();
  replace.mockReset();
});

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation errors when submitted empty', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
    expect(adminLoginMock).not.toHaveBeenCalled();
  });

  it('shows a friendly message and does not redirect on invalid credentials', async () => {
    adminLoginMock.mockRejectedValueOnce(
      new ApiError({
        code: 'INVALID_CREDENTIALS',
        status: 401,
        message: 'Invalid credentials',
        requestId: 'req-1',
      }),
    );
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'admin@astroai.test');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect email or password/i);
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows a network-failure message when the request throws a non-ApiError', async () => {
    adminLoginMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'admin@astroai.test');
    await user.type(screen.getByLabelText(/password/i), 'whatever12345');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the server/i);
  });

  it('redirects on successful login', async () => {
    adminLoginMock.mockResolvedValueOnce({
      admin: {
        id: '1',
        email: 'admin@astroai.test',
        name: 'Admin',
        role: 'super_admin',
        permissions: [],
      },
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'admin@astroai.test');
    await user.type(screen.getByLabelText(/password/i), 'correct-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });
});

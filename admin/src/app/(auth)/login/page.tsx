'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { adminLoginSchema, type AdminLoginInput } from '@astroai/shared-types';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/apiError';
import { adminLogin } from '@/lib/adminAuthApi';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_CREDENTIALS') return 'Incorrect email or password.';
    if (error.code === 'ACCOUNT_SUSPENDED') {
      return 'This admin account has been deactivated. Contact a super admin.';
    }
    return error.message;
  }
  return 'Could not reach the server. Check your connection and try again.';
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuthenticated = useAdminAuthStore((state) => state.setAuthenticated);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const { admin } = await adminLogin(values);
      setAuthenticated(admin);
      router.replace(searchParams.get('from') ?? '/');
    } catch (error) {
      setSubmitError(loginErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <h1 className="text-xl font-semibold">AstroAI Admin</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          {...register('password')}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LoginForm } from '../apps/web/app/login/LoginForm';
import { SignUpForm } from '../apps/web/app/sign-up/SignUpForm';

afterEach(cleanup);

describe('MIRA member auth pages without Supabase configuration', () => {
  it('keeps signup data entry disabled and explains that nothing is sent', () => {
    render(<SignUpForm configured={false} />);

    expect(screen.getByRole('status').textContent).toContain('不會送出或保存資料');
    expect(screen.getByRole('button', { name: '建立會員帳號' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByLabelText('出生年月日').hasAttribute('disabled')).toBe(true);
  });

  it('keeps login disabled until a Supabase project is configured', () => {
    render(<LoginForm configured={false} />);

    expect(screen.getByRole('status').textContent).toContain('資料不會送出');
    expect(screen.getByRole('button', { name: '登入 MIRA' }).hasAttribute('disabled')).toBe(true);
  });
});

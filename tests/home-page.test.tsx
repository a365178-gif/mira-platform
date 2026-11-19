import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@mira/ui', () => ({
  Logo: ({ variant }: { variant: string }) => <span aria-label="MIRA｜覓然，在茫茫人海，遇見剛好的你。">MIRA LOGO ({variant})</span>,
}));

import { HomePage } from '../apps/web/app/HomePage';

afterEach(cleanup);

describe('MIRA public home page', () => {
  it('introduces recommendation, free exploration, and all three stages', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: '在茫茫人海，遇見剛好的你。' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '每日精選推薦' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '自由探索' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '氣場初探' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '聲音破冰' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '真實相遇' })).toBeTruthy();
    expect(screen.getByText(/會員與正式配對服務尚未開放/)).toBeTruthy();
  });

  it('provides signup and login navigation', () => {
    render(<HomePage />);

    expect(screen.getByRole('link', { name: '註冊' }).getAttribute('href')).toBe('/sign-up');
    expect(screen.getByRole('link', { name: '登入' }).getAttribute('href')).toBe('/login');
  });
});

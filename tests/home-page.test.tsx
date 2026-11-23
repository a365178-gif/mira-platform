import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@mira/ui', () => ({
  Logo: ({ variant }: { variant: string }) => <span aria-label="MIRA｜覓然，在茫茫人海，遇見剛好的你。">MIRA LOGO ({variant})</span>,
}));

import { HomePage } from '../apps/web/app/HomePage';

afterEach(cleanup);

describe('MIRA public home page', () => {
  it('introduces recommendation and the connected exploration flow', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: '在茫茫人海，遇見剛好的你。' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '每日精選推薦' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '自由探索' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '探索會員' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '有興趣或略過' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '配對成功' })).toBeTruthy();
    expect(screen.getAllByText(/探索與雙向配對已接通/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: '開始探索' }).every((link) => link.getAttribute('href') === '/explore')).toBe(true);
  });

  it('provides signup and login navigation', () => {
    render(<HomePage />);

    expect(screen.getByRole('link', { name: '註冊' }).getAttribute('href')).toBe('/sign-up');
    expect(screen.getByRole('link', { name: '登入' }).getAttribute('href')).toBe('/login');
  });
});

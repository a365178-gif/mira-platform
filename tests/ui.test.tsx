import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../packages/ui/src/Button';
import { Card } from '../packages/ui/src/Card';
import { Input } from '../packages/ui/src/Input';
import { LogoMark } from '../packages/ui/src/LogoMark.web';

describe('shared UI components', () => {
  it('renders an accessible button and forwards presses', () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>開始探索</Button>);

    fireEvent.click(screen.getByRole('button', { name: '開始探索' }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('prevents interaction when a button is disabled', () => {
    const onPress = vi.fn();
    render(
      <Button disabled onPress={onPress}>
        尚未開放
      </Button>,
    );

    fireEvent.click(screen.getByRole('button', { name: '尚未開放' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('groups card content accessibly', () => {
    render(
      <Card>
        <span>三階探索配對</span>
      </Card>,
    );

    expect(screen.getByRole('group').textContent).toContain('三階探索配對');
  });

  it('exposes an input label and validation message', () => {
    render(<Input label="電子郵件" errorMessage="請輸入有效的電子郵件" />);

    expect(screen.getByLabelText('電子郵件')).toBeTruthy();
    expect(screen.getByText('請輸入有效的電子郵件')).toBeTruthy();
  });

  it('renders the interlaced logo with two gradients and a white star', () => {
    const { container } = render(<LogoMark appIcon size={128} />);
    const svg = container.querySelector('svg');

    expect(svg?.querySelectorAll('path[stroke]')).toHaveLength(2);
    expect(svg?.querySelectorAll('linearGradient')).toHaveLength(2);
    expect(svg?.querySelector('path[fill="#FFFFFF"]')).toBeTruthy();
    expect(svg?.querySelector('rect[fill="#0B0B12"]')).toBeTruthy();
  });
});

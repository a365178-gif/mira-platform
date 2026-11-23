import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BirthDateSelect } from '../apps/web/app/components/BirthDateSelect';

afterEach(cleanup);

describe('BirthDateSelect', () => {
  it('offers 80 years from the latest adult year, in descending order', () => {
    render(<BirthDateSelect idPrefix="birthday" onChange={() => undefined} value="" />);

    const yearSelect = screen.getByLabelText('出生年份') as HTMLSelectElement;
    const yearOptions = within(yearSelect).getAllByRole('option').slice(1);
    const latestAdultYear = new Date().getFullYear() - 18;

    expect(yearOptions).toHaveLength(80);
    expect(yearOptions[0].getAttribute('value')).toBe(String(latestAdultYear));
    expect(yearOptions[79].getAttribute('value')).toBe(String(latestAdultYear - 79));
  });

  it('pads month and day values and clamps leap-day dates when the year changes', () => {
    const onChange = vi.fn();
    render(<BirthDateSelect idPrefix="birthday" onChange={onChange} value="" />);

    fireEvent.change(screen.getByLabelText('出生年份'), { target: { value: '2000' } });
    fireEvent.change(screen.getByLabelText('出生月份'), { target: { value: '02' } });
    const daySelect = screen.getByLabelText('出生日期') as HTMLSelectElement;
    expect(within(daySelect).getAllByRole('option')).toHaveLength(30);
    fireEvent.change(daySelect, { target: { value: '29' } });
    expect(onChange).toHaveBeenLastCalledWith('2000-02-29');

    fireEvent.change(screen.getByLabelText('出生年份'), { target: { value: '2001' } });
    expect((screen.getByLabelText('出生日期') as HTMLSelectElement).value).toBe('28');
    expect(onChange).toHaveBeenLastCalledWith('2001-02-28');
  });

  it('clamps a selected day when changing to a shorter month', () => {
    const onChange = vi.fn();
    render(<BirthDateSelect idPrefix="birthday" onChange={onChange} value="2004-01-31" />);

    fireEvent.change(screen.getByLabelText('出生月份'), { target: { value: '02' } });

    expect((screen.getByLabelText('出生日期') as HTMLSelectElement).value).toBe('29');
    expect(onChange).toHaveBeenLastCalledWith('2004-02-29');
  });
});

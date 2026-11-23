'use client';

import { useEffect, useState } from 'react';
import styles from './BirthDateSelect.module.css';

type DateParts = { year: string; month: string; day: string };

const emptyDate: DateParts = { year: '', month: '', day: '' };

function parseDate(value: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? { year: match[1], month: match[2], day: match[3] } : emptyDate;
}

function formatDate({ year, month, day }: DateParts): string {
  return year && month && day ? `${year}-${month}-${day}` : '';
}

function daysInMonth(year: string, month: string): number {
  return year && month ? new Date(Number(year), Number(month), 0).getDate() : 0;
}

export function BirthDateSelect({
  idPrefix,
  value,
  onChange,
  disabled = false,
}: {
  idPrefix: string;
  value: string;
  onChange: (isoDate: string) => void;
  disabled?: boolean;
}) {
  const [parts, setParts] = useState<DateParts>(() => parseDate(value));
  const currentYear = new Date().getFullYear();
  const firstAdultYear = currentYear - 18;
  const years = Array.from({ length: 80 }, (_, index) => String(firstAdultYear - index));
  const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
  const days = Array.from({ length: daysInMonth(parts.year, parts.month) }, (_, index) => String(index + 1).padStart(2, '0'));

  useEffect(() => {
    setParts((current) => formatDate(current) === value ? current : parseDate(value));
  }, [value]);

  function update(part: keyof DateParts, nextValue: string) {
    const next = { ...parts, [part]: nextValue };
    if (part === 'year' || part === 'month') {
      const limit = daysInMonth(next.year, next.month);
      if (limit && next.day && Number(next.day) > limit) {
        next.day = String(limit).padStart(2, '0');
      }
    }
    setParts(next);
    onChange(formatDate(next));
  }

  return <div className={styles.selects}>
    <select
      aria-label="出生年份"
      autoComplete="bday-year"
      className={styles.select}
      disabled={disabled}
      id={`${idPrefix}-year`}
      onChange={(event) => update('year', event.target.value)}
      required
      value={parts.year}
    >
      <option value="">年份</option>
      {years.map((year) => <option key={year} value={year}>{year} 年</option>)}
    </select>
    <select
      aria-label="出生月份"
      autoComplete="bday-month"
      className={styles.select}
      disabled={disabled}
      id={`${idPrefix}-month`}
      onChange={(event) => update('month', event.target.value)}
      required
      value={parts.month}
    >
      <option value="">月份</option>
      {months.map((month) => <option key={month} value={month}>{month} 月</option>)}
    </select>
    <select
      aria-label="出生日期"
      autoComplete="bday-day"
      className={styles.select}
      disabled={disabled || !parts.year || !parts.month}
      id={`${idPrefix}-day`}
      onChange={(event) => update('day', event.target.value)}
      required
      value={parts.day}
    >
      <option value="">日期</option>
      {days.map((day) => <option key={day} value={day}>{day} 日</option>)}
    </select>
  </div>;
}

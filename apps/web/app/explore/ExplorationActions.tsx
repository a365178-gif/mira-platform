'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import styles from '../members/member.module.css';

export function ExplorationActions({ candidateId }: { candidateId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function expressInterest() {
    const supabase = createSupabaseBrowserClient();
    setError('');
    setMessage('');
    if (!supabase) { setError('探索服務尚未連接。'); return; }
    setBusy(true);
    const { data: sessionId, error: startError } = await supabase.rpc('start_exploration', { p_candidate_id: candidateId });
    if (startError || !sessionId) {
      setBusy(false);
      setError('目前無法開始探索，請稍後再試。');
      return;
    }
    const { error: responseError } = await supabase.rpc('record_exploration_response', {
      p_session_id: sessionId,
      p_decision: 'interested',
    });
    setBusy(false);
    if (responseError) { setError('回覆未能送出，請稍後再試。'); return; }
    setMessage('已記錄你的探索意願。');
  }

  return <div className={styles.exploreActions}>
    <button className={styles.submit} disabled={busy} onClick={expressInterest} type="button">{busy ? '送出中…' : '有興趣'}</button>
    {error ? <p className={styles.feedback} role="alert">{error}</p> : null}
    {message ? <p className={styles.success} role="status">{message}</p> : null}
  </div>;
}

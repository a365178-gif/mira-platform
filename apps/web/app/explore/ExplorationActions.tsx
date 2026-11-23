'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import styles from '../members/member.module.css';

export function ExplorationActions({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function respond(decision: 'interested' | 'pass') {
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
    const { data, error: responseError } = await supabase.rpc('record_exploration_response', {
      p_session_id: sessionId,
      p_decision: decision,
    });
    setBusy(false);
    if (responseError) { setError('回覆未能送出，請稍後再試。'); return; }
    const outcome = Array.isArray(data) ? data[0] : data;
    let result = 'interested';
    if (decision === 'pass') {
      result = 'passed';
      setMessage('已略過此對象。');
    } else if (outcome?.status === 'matched' && outcome.match_id) {
      result = 'matched';
      setMessage('配對成功！');
    } else {
      setMessage('已記錄你的有興趣回覆。');
    }
    router.replace(`/explore?result=${result}`);
  }

  return <div className={styles.exploreActions}>
    <button className={styles.submit} disabled={busy} onClick={() => respond('interested')} type="button">{busy ? '送出中…' : '有興趣'}</button>
    <button className={styles.signOut} disabled={busy} onClick={() => respond('pass')} type="button">略過</button>
    {error ? <p className={styles.feedback} role="alert">{error}</p> : null}
    {message ? <p className={styles.success} role="status">{message}</p> : null}
  </div>;
}

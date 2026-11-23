'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../../lib/supabase/client';
import styles from './match-room.module.css';

type Answer = { choice?: 'a' | 'b'; supplement?: string; answer?: string };
type RevealedAnswer = { userId: string; answer: Answer };
type StageAnswers = { myAnswer: Answer | null; partnerSubmitted: boolean; revealedAnswers: RevealedAnswer[] | null };
type Prompt = { question: string; optionA?: string | null; optionB?: string | null; supplementLabel?: string | null };
type Opponent = {
  id: string;
  displayName: string | null;
  city: string | null;
  interests: string[] | null;
  routine: string | null;
  deepBio: string | null;
  relationshipExpectations: string | null;
  avatarPath: string | null;
};
type Message = { id: string; userId: string; body: string; createdAt: string };

export type MatchRoomState = {
  matchId: string;
  currentStage: 1 | 2 | 3;
  unlockedPuzzles: number;
  stage1Prompt: Prompt;
  stage2Prompt: { question: string };
  stage1: StageAnswers;
  stage2: StageAnswers;
  myDateChoices: string[] | null;
  partnerDateSubmitted: boolean;
  dateConsensus: string[];
  opponent: Opponent;
  messages: Message[];
};

const microDates = [
  '散步逛街區', '咖啡店聊天', '逛書店選書', '河濱騎腳踏車',
  '夜市分食小吃', '看展覽或博物館', '公園野餐', '一起做甜點',
];

export function MatchRoom({ initial, userId }: { initial: MatchRoomState; userId: string }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [choice, setChoice] = useState<'a' | 'b' | ''>('');
  const [supplement, setSupplement] = useState('');
  const [dailyAnswer, setDailyAnswer] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => setState(initial), [initial]);

  useEffect(() => {
    if (state.unlockedPuzzles !== 4) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase.channel(`match-room-${state.matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'match_room_messages',
        filter: `match_id=eq.${state.matchId}`,
      }, () => router.refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [router, state.matchId, state.unlockedPuzzles]);

  useEffect(() => {
    let active = true;
    setAvatarUrl('');
    if (!state.opponent.avatarPath || state.unlockedPuzzles < 4) return () => { active = false; };
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return () => { active = false; };
    supabase.storage.from('member-avatars').createSignedUrl(state.opponent.avatarPath, 300)
      .then(({ data }) => { if (active) setAvatarUrl(data?.signedUrl ?? ''); });
    return () => { active = false; };
  }, [state.opponent.avatarPath, state.unlockedPuzzles]);

  function refreshRoom(message: string) {
    setNotice(message);
    router.refresh();
  }

  async function submitStageAnswer(event: FormEvent<HTMLFormElement>, stage: 1 | 2) {
    event.preventDefault();
    setError('');
    const answer: Answer = stage === 1
      ? { choice: choice || undefined, supplement: supplement.trim() }
      : { answer: dailyAnswer.trim() };
    if (stage === 1 && !choice) { setError('請先選擇一個答案。'); return; }
    if (stage === 2 && !dailyAnswer.trim()) { setError('請先寫下一段日常碎片。'); return; }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError('目前無法連接共鳴房間。'); return; }
    setBusy(true);
    const { error: submitError } = await supabase.rpc('submit_match_stage_answer', {
      p_match_id: state.matchId,
      p_answer: answer,
    });
    setBusy(false);
    if (submitError) { setError('答案未能鎖定，請確認房間仍有效後再試。'); return; }
    refreshRoom('答案已鎖定；待雙方都送出後揭曉。');
  }

  async function submitDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (selectedDates.length !== 3) { setError('請選擇 3 個想去的行程。'); return; }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError('目前無法連接共鳴房間。'); return; }
    setBusy(true);
    const { error: submitError } = await supabase.rpc('submit_micro_date_choices', {
      p_match_id: state.matchId,
      p_choices: selectedDates,
    });
    setBusy(false);
    if (submitError) { setError('行程選擇未能鎖定，請稍後再試。'); return; }
    refreshRoom('你的 3 個行程已鎖定；等對方完成後會揭曉共識。');
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = messageDraft.trim();
    if (!body) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError('目前無法連接共鳴房間。'); return; }
    setError('');
    setBusy(true);
    const { error: sendError } = await supabase.from('match_room_messages').insert({
      match_id: state.matchId,
      user_id: userId,
      body,
    });
    setBusy(false);
    if (sendError) { setError('留言未能送出，請稍後再試。'); return; }
    setMessageDraft('');
    refreshRoom('留言已送出。');
  }

  function toggleDate(date: string) {
    setSelectedDates((current) => current.includes(date)
      ? current.filter((item) => item !== date)
      : current.length < 3 ? [...current, date] : current);
  }

  const stage1Revealed = state.stage1.revealedAnswers;
  const stage2Revealed = state.stage2.revealedAnswers;

  return <main className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>MIRA｜覓然 · 共鳴解鎖房間</p><h1 className={styles.title}>和 {state.opponent.displayName || '這位會員'} 慢慢靠近</h1></div>
        <Link className={styles.backLink} href="/explore">返回探索</Link>
      </header>

      <section className={styles.progressSection} aria-label="共鳴解鎖進度">
        <div className={styles.progressHeader}><h2>拼圖解鎖</h2><span>{state.unlockedPuzzles}/4 塊</span></div>
        <div className={styles.puzzleGrid}>
          <PuzzlePiece number={1} title="興趣" unlocked={state.unlockedPuzzles >= 2}>
            {state.unlockedPuzzles >= 2 ? state.opponent.interests?.join('・') || '對方尚未填寫興趣' : '完成階段一解鎖'}
          </PuzzlePiece>
          <PuzzlePiece number={2} title="生活作息" unlocked={state.unlockedPuzzles >= 2}>
            {state.unlockedPuzzles >= 2 ? state.opponent.routine || '對方尚未填寫生活作息' : '完成階段一解鎖'}
          </PuzzlePiece>
          <PuzzlePiece number={3} title="深度自介與關係期待" unlocked={state.unlockedPuzzles >= 3}>
            {state.unlockedPuzzles >= 3
              ? <>{state.opponent.deepBio || '對方尚未填寫自我介紹'}<span className={styles.pieceExtra}>關係期待：{state.opponent.relationshipExpectations || '尚未設定'}</span></>
              : '完成階段二解鎖'}
          </PuzzlePiece>
          <PuzzlePiece number={4} title="清晰頭像" unlocked={state.unlockedPuzzles >= 4}>
            {state.unlockedPuzzles >= 4 && avatarUrl
              ? <img className={styles.avatar} alt={`${state.opponent.displayName || '配對對象'}的頭像`} src={avatarUrl} />
              : state.unlockedPuzzles >= 4 ? '對方尚未上傳頭像' : '完成階段三解鎖'}
          </PuzzlePiece>
        </div>
        <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={state.unlockedPuzzles} aria-label="已解鎖拼圖數">
          <span style={{ width: `${state.unlockedPuzzles * 25}%` }} />
        </div>
      </section>

      <section className={styles.stages} aria-label="共鳴互動階段">
        <StageCard number={1} title="靈魂盲盒" subtitle="雙方鎖定答案後，翻牌揭曉並解鎖前兩塊拼圖" active={state.currentStage === 1}>
          <p className={styles.question}>{state.stage1Prompt.question}</p>
          {stage1Revealed ? <AnswerReveal answers={stage1Revealed} userId={userId} optionA={state.stage1Prompt.optionA} optionB={state.stage1Prompt.optionB} /> : (
            <>
              {state.stage1.myAnswer ? <p className={styles.status} role="status">{state.stage1.partnerSubmitted ? '對方也已鎖定，正在同步翻牌…' : '答案已鎖定，對方思考中…'}</p>
                : state.stage1.partnerSubmitted ? <p className={styles.status} role="status">已鎖定答案，等你翻牌！</p>
                  : <p className={styles.status} role="status">對方思考中…</p>}
              {!state.stage1.myAnswer && state.currentStage === 1 ? <form className={styles.form} onSubmit={(event) => submitStageAnswer(event, 1)}>
                <fieldset className={styles.options} disabled={busy}>
                  <legend>選擇比較像你的答案</legend>
                  <label><input checked={choice === 'a'} name="stage-one-choice" onChange={() => setChoice('a')} type="radio" value="a" />{state.stage1Prompt.optionA}</label>
                  <label><input checked={choice === 'b'} name="stage-one-choice" onChange={() => setChoice('b')} type="radio" value="b" />{state.stage1Prompt.optionB}</label>
                </fieldset>
                <label className={styles.label} htmlFor="stage-one-supplement">{state.stage1Prompt.supplementLabel || '補充一點想法（選填）'}</label>
                <textarea className={styles.textarea} disabled={busy} id="stage-one-supplement" maxLength={300} onChange={(event) => setSupplement(event.target.value)} value={supplement} />
                <button className={styles.primaryButton} disabled={busy} type="submit">{busy ? '鎖定中…' : '鎖定答案'}</button>
              </form> : null}
            </>
          )}
        </StageCard>

        {state.currentStage >= 2 ? <StageCard number={2} title="日常反差交換" subtitle="雙方送出日常碎片後，解鎖深度自介與關係期待" active={state.currentStage === 2}>
          <p className={styles.question}>{state.stage2Prompt.question}</p>
          {stage2Revealed ? <AnswerReveal answers={stage2Revealed} userId={userId} /> : (
            <>
              {state.stage2.myAnswer ? <p className={styles.status} role="status">{state.stage2.partnerSubmitted ? '對方也已送出，正在揭曉…' : '答案已鎖定，對方思考中…'}</p>
                : state.stage2.partnerSubmitted ? <p className={styles.status} role="status">已鎖定答案，等你翻牌！</p>
                  : <p className={styles.status} role="status">對方思考中…</p>}
              {!state.stage2.myAnswer && state.currentStage === 2 ? <form className={styles.form} onSubmit={(event) => submitStageAnswer(event, 2)}>
                <label className={styles.label} htmlFor="stage-two-answer">你的日常碎片</label>
                <textarea className={styles.textarea} disabled={busy} id="stage-two-answer" maxLength={500} onChange={(event) => setDailyAnswer(event.target.value)} placeholder="寫下你願意分享的一小段日常…" required value={dailyAnswer} />
                <button className={styles.primaryButton} disabled={busy} type="submit">{busy ? '送出中…' : '送出並鎖定'}</button>
              </form> : null}
            </>
          )}
        </StageCard> : null}

        {state.currentStage >= 3 ? <StageCard number={3} title="坦誠相見" subtitle="各選 3 個低壓力行程；雙方完成後只顯示共同選項" active={state.unlockedPuzzles < 4}>
          {state.unlockedPuzzles < 4 ? <>
            {state.myDateChoices ? <p className={styles.status} role="status">{state.partnerDateSubmitted ? '雙方已完成選擇，共同心動行程已揭曉。' : '你的行程已鎖定，等待對方完成選擇…'}</p> : <p className={styles.status} role="status">{state.partnerDateSubmitted ? '對方已鎖定 3 個行程，等你完成選擇！' : '請挑選 3 個你想一起嘗試的行程。'}</p>}
            {!state.myDateChoices ? <form className={styles.form} onSubmit={submitDates}>
              <fieldset className={styles.dateOptions} disabled={busy}>
                <legend>微約會暗中配對卡 · 已選 {selectedDates.length}/3</legend>
                {microDates.map((date) => <label key={date}>
                  <input checked={selectedDates.includes(date)} disabled={!selectedDates.includes(date) && selectedDates.length === 3} onChange={() => toggleDate(date)} type="checkbox" />
                  {date}
                </label>)}
              </fieldset>
              <button className={styles.primaryButton} disabled={busy || selectedDates.length !== 3} type="submit">{busy ? '鎖定中…' : '鎖定我的 3 個選擇'}</button>
            </form> : null}
          </> : <div className={styles.consensus}>
            <h3>共同心動行程</h3>
            {state.dateConsensus.length ? <ul>{state.dateConsensus.map((date) => <li key={date}>{date}</li>)}</ul> : <p>這次沒有重疊選項，也可以一起討論新的行程。</p>}
            <p>四塊拼圖已解鎖，可以開始自由留言。</p>
          </div>}
        </StageCard> : null}
      </section>

      {state.unlockedPuzzles === 4 ? <section className={styles.chat} aria-labelledby="chat-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>你們已完成三階共鳴</p><h2 id="chat-title">自由留言</h2></div><span className={styles.badge}>拼圖 4/4</span></div>
        <div className={styles.messages} aria-live="polite">
          {state.messages.length ? state.messages.map((message) => <article className={`${styles.message} ${message.userId === userId ? styles.ownMessage : ''}`} key={message.id}>
            <p>{message.body}</p><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('zh-TW', { dateStyle: 'short', timeStyle: 'short' })}</time>
          </article>) : <p className={styles.status}>留下一句問候，開始你們的對話。</p>}
        </div>
        <form className={styles.chatForm} onSubmit={sendMessage}>
          <label className={styles.label} htmlFor="room-message">寫一則留言</label>
          <textarea className={styles.textarea} disabled={busy} id="room-message" maxLength={1000} onChange={(event) => setMessageDraft(event.target.value)} value={messageDraft} />
          <button className={styles.primaryButton} disabled={busy || !messageDraft.trim()} type="submit">{busy ? '送出中…' : '送出留言'}</button>
        </form>
      </section> : null}

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {notice ? <p className={styles.status} role="status">{notice}</p> : null}
    </div>
  </main>;
}

function StageCard({ number, title, subtitle, active, children }: {
  number: number; title: string; subtitle: string; active: boolean; children: React.ReactNode;
}) {
  return <article className={`${styles.stageCard} ${active ? styles.activeStage : ''}`}>
    <div className={styles.stageHeading}><span className={styles.stageNumber}>0{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>
    <div className={styles.stageBody}>{children}</div>
  </article>;
}

function PuzzlePiece({ number, title, unlocked, children }: { number: number; title: string; unlocked: boolean; children: React.ReactNode }) {
  return <article className={`${styles.puzzlePiece} ${unlocked ? styles.unlockedPiece : ''}`} aria-label={`拼圖 ${number}：${title}${unlocked ? '，已解鎖' : '，未解鎖'}`}>
    <span className={styles.pieceNumber}>0{number}</span>
    <h3>{title}</h3>
    <div className={styles.pieceContent}>{children}</div>
  </article>;
}

function AnswerReveal({ answers, userId, optionA, optionB }: { answers: RevealedAnswer[]; userId: string; optionA?: string | null; optionB?: string | null }) {
  return <div className={styles.revealGrid} aria-label="雙方答案已揭曉">
    {answers.map((item) => <article className={styles.revealCard} key={item.userId}>
      <h3>{item.userId === userId ? '你的答案' : '對方的答案'}</h3>
      {item.answer.choice ? <p><strong>{item.answer.choice === 'a' ? optionA : optionB}</strong></p> : null}
      {item.answer.supplement ? <p>{item.answer.supplement}</p> : null}
      {item.answer.answer ? <p>{item.answer.answer}</p> : null}
    </article>)}
  </div>;
}

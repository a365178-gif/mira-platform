'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Logo } from '@mira/ui';
import {
  clearDemoProfile,
  readDemoProfile,
  type DemoProfile,
} from '../../lib/demo-profile';
import { Portrait } from './Portrait';
import {
  calculateCompatibility,
  mockProfiles,
  valueQuestions,
  type MockProfile,
  type ValueAnswers,
  type ValueQuestionId,
} from './mockProfiles';
import styles from '../flow.module.css';

type Stage = 1 | 2 | 3;
type LocalMessage = { id: number; text: string };

export function ExplorationLobby() {
  const router = useRouter();
  const [viewer, setViewer] = useState<DemoProfile | null>(null);
  const [loadError, setLoadError] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState(mockProfiles[0].id);
  const [stage, setStage] = useState<Stage>(1);
  const [answers, setAnswers] = useState<ValueAnswers>({});
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [replyError, setReplyError] = useState('');
  const [submittedReply, setSubmittedReply] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatMessages, setChatMessages] = useState<LocalMessage[]>([]);

  const selectedProfile = mockProfiles.find(({ id }) => id === selectedProfileId) ?? mockProfiles[0];
  const compatibility = calculateCompatibility(selectedProfile, answers);

  useEffect(() => {
    try {
      const currentViewer = readDemoProfile();
      if (!currentViewer) {
        router.replace('/onboarding');
        return;
      }
      setViewer(currentViewer);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '本機示範狀態無法讀取。');
    }
  }, [router]);

  useEffect(() => {
    if (stage !== 1 || !compatibility.reached) return;

    setIsUnlocking(true);
    const timeout = window.setTimeout(() => {
      setIsUnlocking(false);
      setStage(2);
    }, 1400);

    return () => window.clearTimeout(timeout);
  }, [compatibility.reached, stage]);

  function chooseProfile(profile: MockProfile) {
    if (profile.id === selectedProfileId) return;

    setSelectedProfileId(profile.id);
    setStage(1);
    setAnswers({});
    setIsUnlocking(false);
    setIsAudioPlaying(false);
    setReplyDraft('');
    setReplyError('');
    setSubmittedReply('');
    setChatOpen(false);
    setChatDraft('');
    setChatMessages([]);
  }

  function updateAnswer(questionId: ValueQuestionId, answer: string) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  function submitIcebreaker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = replyDraft.trim();
    if (!response) {
      setReplyError('請先輸入一段回覆。');
      return;
    }

    setSubmittedReply(response);
    setReplyError('');
    setStage(3);
  }

  function sendLocalMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatDraft.trim();
    if (!message) return;

    setChatMessages((current) => [...current, { id: Date.now(), text: message }]);
    setChatDraft('');
  }

  function restartDemo() {
    clearDemoProfile();
    router.replace('/onboarding');
  }

  if (loadError) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <p className={styles.modeBanner} role="alert">{loadError}</p>
          <Button onPress={restartDemo} variant="secondary">
            重新開始設定
          </Button>
        </div>
      </main>
    );
  }

  if (!viewer) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <p className={styles.modeBanner} role="status">正在載入本機示範狀態…</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${styles.page} ${styles.explorePage}`}>
      <div className={`${styles.shell} ${styles.exploreShell}`}>
        <header className={styles.header}>
          <Logo size={48} variant="horizontal" />
          <Link className={styles.homeLink} href="/">
            返回首頁
          </Link>
        </header>

        <section className={styles.exploreIntro}>
          <div>
            <p className={styles.eyebrow}>MIRA｜覓然 · 三階探索配對</p>
            <h1 className={styles.title}>慢一點，遇見多一點。</h1>
            <p className={styles.description}>
              嗨，{viewer.nickname}。這是完全本機的互動示範，對象皆為虛構人物。
            </p>
          </div>
          <p className={styles.modeBanner} role="status">
            <strong>示意體驗</strong>：契合度、語音播放器、個人資料與聊天室皆為模擬內容，不會連接真實使用者或送出訊息。
          </p>
        </section>

        <ol className={styles.stageProgress} aria-label="三階探索進度">
          {[1, 2, 3].map((step) => (
            <li
              aria-current={stage === step ? 'step' : undefined}
              className={`${styles.progressStep} ${stage >= step ? styles.progressComplete : ''}`}
              key={step}
            >
              <span className={styles.progressNumber}>{step}</span>
              <span>{['氣場初探', '聲音破冰', '真實相遇'][step - 1]}</span>
            </li>
          ))}
        </ol>

        <section aria-label="選擇模擬對象" className={styles.profileChooser}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>本機示意資料</p>
              <h2 className={styles.sectionTitle}>選擇一位對象開始探索</h2>
            </div>
            <span className={styles.countLabel}>{mockProfiles.length} 位虛構對象</span>
          </div>
          <div className={styles.profileChoices}>
            {mockProfiles.map((profile) => (
              <button
                aria-pressed={selectedProfile.id === profile.id}
                className={`${styles.profileChoice} ${selectedProfile.id === profile.id ? styles.profileChoiceActive : ''}`}
                key={profile.id}
                onClick={() => chooseProfile(profile)}
                type="button"
              >
                <span aria-hidden="true" className={styles.profileColor} style={{ backgroundColor: profile.auraColor }} />
                <span>
                  {profile.name}・{profile.age}
                  <small>{profile.occupation}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <p aria-atomic="true" aria-live="polite" className={styles.srOnly}>
          {stage === 1
            ? '目前位於第一階：氣場與價值觀初探。'
            : stage === 2
              ? '已解鎖第二階：聲音與興趣破冰。'
              : '已解鎖第三階：真實面貌與深度聊天。'}
        </p>

        <div className={styles.stageContent}>
          {stage === 1 ? (
            <section aria-labelledby="stage-one-title" className={styles.exploreGrid}>
              <div className={styles.profileColumn}>
                <div
                  aria-label={`${selectedProfile.name}的代表色氣場氛圍卡，第一階不顯示清晰照片`}
                  className={styles.auraCard}
                  role="img"
                  style={{ background: `radial-gradient(ellipse at 50% 42%, ${selectedProfile.auraColor}99, transparent 56%), linear-gradient(145deg, #191824, #0B0B12)` }}
                >
                  <span aria-hidden="true" className={styles.auraOrb} style={{ backgroundColor: selectedProfile.accentColor }} />
                  <span className={styles.auraLabel}>氣場與價值觀初探</span>
                  <span className={styles.auraName}>{selectedProfile.name}・{selectedProfile.age}</span>
                  <span className={styles.auraRole}>{selectedProfile.occupation} · {selectedProfile.location}</span>
                  <span className={styles.auraPrivacy}>第一階不顯示清晰照片</span>
                </div>
                <p className={styles.illustrationNote}>代表色：<span aria-hidden="true" className={styles.inlineSwatch} style={{ backgroundColor: selectedProfile.auraColor }} />僅為氛圍示意</p>
              </div>

              <div className={styles.questionColumn}>
                <p className={styles.eyebrow}>第一階 · 氣場與價值觀初探</p>
                <h2 className={styles.sectionTitle} id="stage-one-title">三道小問題，看看生活頻率是否相近</h2>
                <p className={styles.description}>選擇最貼近自己的答案。示範契合度根據對方的模擬價值觀計算。</p>

                <div className={styles.questionList}>
                  {valueQuestions.map((question, index) => (
                    <fieldset className={styles.questionCard} key={question.id}>
                      <legend className={styles.questionLegend}>
                        <span className={styles.questionIndex}>0{index + 1}</span>
                        {question.prompt}
                      </legend>
                      <div className={styles.answerList}>
                        {question.options.map((option) => (
                          <label className={styles.answerOption} key={option.value}>
                            <input
                              checked={answers[question.id] === option.value}
                              disabled={isUnlocking}
                              name={`${selectedProfile.id}-${question.id}`}
                              onChange={() => updateAnswer(question.id, option.value)}
                              type="radio"
                              value={option.value}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>

                <div className={styles.compatibility} aria-live="polite">
                  <div className={styles.compatibilityMeta}>
                    <span>模擬契合度</span>
                    <strong>{compatibility.answeredCount === valueQuestions.length ? `${compatibility.percentage}%` : `${compatibility.answeredCount}/3 已完成`}</strong>
                  </div>
                  <div
                    aria-label="模擬契合度"
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={compatibility.percentage}
                    className={styles.compatibilityTrack}
                    role="progressbar"
                  >
                    <span className={styles.compatibilityFill} style={{ width: `${compatibility.percentage}%` }} />
                  </div>
                  {compatibility.answeredCount === valueQuestions.length && !compatibility.reached ? (
                    <p className={styles.hintText}>再調整看看你的答案，達到 67% 即會解鎖第二階。</p>
                  ) : null}
                </div>

                {isUnlocking ? (
                  <div className={styles.unlockPanel} role="status">
                    <span aria-hidden="true" className={styles.unlockSparkle}>✦</span>
                    <span>頻率相近，正在解鎖下一段相遇…</span>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {stage === 2 ? (
            <section aria-labelledby="stage-two-title" className={styles.stagePanel}>
              <div className={styles.stagePanelHeader}>
                <p className={styles.eyebrow}>第二階 · 聲音與興趣破冰</p>
                <h2 className={styles.sectionTitle} id="stage-two-title">再靠近一點，聽見生活的細節。</h2>
                <p className={styles.description}>{selectedProfile.name}的興趣與生活片段已解鎖。</p>
              </div>

              <div className={styles.stageTwoGrid}>
                <section className={styles.detailCard} aria-labelledby="keywords-title">
                  <h3 className={styles.cardTitle} id="keywords-title">最近喜歡的事</h3>
                  <div className={styles.keywordList}>
                    {selectedProfile.keywords.map((keyword) => (
                      <span className={styles.keyword} key={keyword}>{keyword}</span>
                    ))}
                  </div>
                  <h3 className={styles.cardTitle}>生活碎片</h3>
                  <ul className={styles.fragmentList}>
                    {selectedProfile.fragments.map((fragment) => <li key={fragment}>{fragment}</li>)}
                  </ul>
                </section>

                <section className={styles.detailCard} aria-labelledby="voice-title">
                  <h3 className={styles.cardTitle} id="voice-title">語音自我介紹 · 模擬播放器</h3>
                  <p className={styles.voiceText}>{selectedProfile.voiceIntro}</p>
                  <div className={styles.audioPlayer}>
                    <button
                      aria-label={isAudioPlaying ? '暫停語音示意' : '播放語音示意'}
                      aria-pressed={isAudioPlaying}
                      className={styles.audioButton}
                      onClick={() => setIsAudioPlaying((playing) => !playing)}
                      type="button"
                    >
                      {isAudioPlaying ? 'Ⅱ' : '▶'}
                    </button>
                    <div className={styles.audioTrack}>
                      <span className={`${styles.audioProgress} ${isAudioPlaying ? styles.audioProgressActive : ''}`} />
                    </div>
                    <span className={styles.audioTime}>{isAudioPlaying ? '播放示意' : '00:18'}</span>
                  </div>
                  <p className={styles.footnote}>此播放器只呈現介面狀態，不含真實錄音或音訊。</p>
                </section>
              </div>

              <form className={styles.icebreakerForm} onSubmit={submitIcebreaker}>
                <label className={styles.label} htmlFor="icebreakerReply">{selectedProfile.icebreaker}</label>
                <textarea
                  className={styles.textarea}
                  id="icebreakerReply"
                  maxLength={240}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  placeholder="寫下一段真誠的回覆…"
                  rows={4}
                  value={replyDraft}
                />
                {replyError ? <p className={styles.error} role="alert">{replyError}</p> : null}
                <div className={styles.replyFooter}>
                  <span className={styles.footnote}>{replyDraft.length}/240</span>
                  <button className={styles.submit} disabled={!replyDraft.trim()} type="submit">
                    送出回覆，解鎖第三階
                  </button>
                </div>
                <p className={styles.footnote}>回覆僅保留於此頁的記憶體狀態，不會傳送或保存。</p>
              </form>
            </section>
          ) : null}

          {stage === 3 ? (
            <section aria-labelledby="stage-three-title" className={styles.stagePanel}>
              <div className={styles.stagePanelHeader}>
                <p className={styles.eyebrow}>第三階 · 真實面貌與深度聊天</p>
                <h2 className={styles.sectionTitle} id="stage-three-title">謝謝你們，願意多認識彼此。</h2>
                <p className={styles.description}>完整個人介紹已解鎖。下方頭像為原創插畫示意，非真實用戶照片。</p>
              </div>

              <article className={styles.revealCard}>
                <div className={styles.portraitFrame}>
                  <Portrait profile={selectedProfile} />
                  <span className={styles.portraitCaption}>模擬對象 · 插畫示意</span>
                </div>
                <div className={styles.revealDetails}>
                  <p className={styles.eyebrow}>{selectedProfile.age} 歲 · {selectedProfile.location}</p>
                  <h3 className={styles.revealName}>{selectedProfile.name}</h3>
                  <p className={styles.revealRole}>{selectedProfile.occupation}</p>
                  <p className={styles.bio}>{selectedProfile.bio}</p>
                  <div className={styles.keywordList}>
                    {selectedProfile.keywords.map((keyword) => (
                      <span className={styles.keyword} key={keyword}>{keyword}</span>
                    ))}
                  </div>
                  {submittedReply ? (
                    <blockquote className={styles.replyQuote}>
                      <span>你在第二階的回覆</span>
                      <p>{submittedReply}</p>
                    </blockquote>
                  ) : null}
                  <Button onPress={() => setChatOpen(true)} size="large">
                    進入一對一聊天室
                  </Button>
                </div>
              </article>

              {chatOpen ? (
                <section aria-labelledby="chat-title" className={styles.chatPanel}>
                  <div className={styles.chatHeader}>
                    <div>
                      <h3 className={styles.cardTitle} id="chat-title">與{selectedProfile.name}的聊天室</h3>
                      <p className={styles.footnote}>本機訊息示意，不會送達真實使用者。</p>
                    </div>
                    <button className={styles.textButton} onClick={() => setChatOpen(false)} type="button">
                      關閉
                    </button>
                  </div>
                  <div aria-live="polite" className={styles.chatMessages}>
                    {chatMessages.length === 0 ? (
                      <p className={styles.emptyChat}>對話從一個真誠的問候開始。</p>
                    ) : (
                      chatMessages.map((message) => (
                        <p className={styles.localMessage} key={message.id}>{message.text}</p>
                      ))
                    )}
                  </div>
                  <form className={styles.chatForm} onSubmit={sendLocalMessage}>
                    <label className={styles.srOnly} htmlFor="chatDraft">輸入本機示意訊息</label>
                    <input
                      className={styles.input}
                      id="chatDraft"
                      maxLength={240}
                      onChange={(event) => setChatDraft(event.target.value)}
                      placeholder="寫下一句問候…"
                      value={chatDraft}
                    />
                    <button className={styles.submit} disabled={!chatDraft.trim()} type="submit">
                      本機送出
                    </button>
                  </form>
                </section>
              ) : null}
            </section>
          ) : null}
        </div>

        <footer className={styles.actions}>
          <Button onPress={restartDemo} variant="secondary">
            清除本機示範資料
          </Button>
          {stage > 1 ? (
            <button
              className={styles.textButton}
              onClick={() => {
                setStage(1);
                setIsAudioPlaying(false);
              }}
              type="button"
            >
              返回第一階
            </button>
          ) : null}
        </footer>
      </div>
    </main>
  );
}

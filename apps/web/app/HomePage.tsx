import { Logo } from '@mira/ui';
import styles from './home.module.css';

export function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="MIRA 覓然首頁">
          <Logo variant="horizontal" size={48} />
        </a>
        <nav className={styles.nav} aria-label="主要導覽">
          <a href="#daily">每日精選</a>
          <a href="#explore">自由探索</a>
          <a href="#steps">三階探索</a>
        </nav>
        <div className={styles.headerActions}>
          <a className={styles.loginButton} href="/login">登入</a>
          <a className={styles.smallCta} href="/sign-up">註冊</a>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span aria-hidden="true">✦</span> 為每一次相遇，留一點時間</p>
          <h1 id="hero-title">在茫茫人海，<br />遇見剛好的你。</h1>
          <p className={styles.heroDescription}>
            不急著滑過彼此。從生活的頻率開始，慢慢看見一個人的真實與溫度。
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="/onboarding">開始探索 <span aria-hidden="true">↗</span></a>
            <a className={styles.textLink} href="#steps">認識三階探索 <span aria-hidden="true">↓</span></a>
          </div>
          <p className={styles.availability}>MIRA 正在準備中 · 會員與正式配對服務尚未開放</p>
        </div>
        <div className={styles.heroArt} aria-label="交錯星軌與星光的裝飾圖像" role="img">
          <div className={`${styles.orbit} ${styles.orbitOne}`} />
          <div className={`${styles.orbit} ${styles.orbitTwo}`} />
          <div className={`${styles.orbit} ${styles.orbitThree}`} />
          <div className={styles.heroCore}><Logo variant="mark" size={92} /></div>
          <span className={`${styles.star} ${styles.starOne}`} aria-hidden="true">✦</span>
          <span className={`${styles.star} ${styles.starTwo}`} aria-hidden="true">✧</span>
          <span className={`${styles.star} ${styles.starThree}`} aria-hidden="true">✦</span>
          <span className={styles.artCaption}>A little closer, a little more you.</span>
        </div>
      </section>

      <section className={styles.features} aria-label="探索方式">
        <article id="daily" className={styles.featureCard}>
          <div className={`${styles.featureIcon} ${styles.dailyIcon}`} aria-hidden="true">✧</div>
          <p className={styles.cardEyebrow}>A thoughtful beginning</p>
          <h2>每日精選推薦</h2>
          <p>每天留一點空間，認識幾位生活步調與交友期待相近的人。少一點匆忙，多一點剛剛好的了解。</p>
          <span className={styles.comingSoon}>正式推薦服務尚未開放</span>
        </article>
        <article id="explore" className={styles.featureCard}>
          <div className={`${styles.featureIcon} ${styles.exploreIcon}`} aria-hidden="true">⌕</div>
          <p className={styles.cardEyebrow}>Find your own rhythm</p>
          <h2>自由探索</h2>
          <p>依照自己的心情與期待，從價值觀、興趣和生活片段出發，發現值得多聊幾句的可能。</p>
          <span className={styles.comingSoon}>真實對象探索尚未開放</span>
        </article>
      </section>

      <section id="steps" className={styles.stepsSection} aria-labelledby="steps-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}><span aria-hidden="true">✦</span> MIRA 的相遇方式</p>
          <h2 id="steps-title">三階探索，讓心意慢慢靠近。</h2>
          <p>從第一眼的感覺，到願意分享生活，再到彼此都想繼續認識。每一步，都由你自在決定。</p>
        </div>
        <ol className={styles.steps}>
          <li className={styles.stepCard}>
            <span className={styles.stepNumber}>01</span>
            <span className={styles.stepLine} aria-hidden="true" />
            <p className={styles.stepLabel}>第一階 · 感受頻率</p>
            <h3>氣場初探</h3>
            <p>先從價值觀與生活節奏認識彼此，在還不急著看見全部之前，感受想法是否靠近。</p>
          </li>
          <li className={styles.stepCard}>
            <span className={styles.stepNumber}>02</span>
            <span className={styles.stepLine} aria-hidden="true" />
            <p className={styles.stepLabel}>第二階 · 分享日常</p>
            <h3>聲音破冰</h3>
            <p>交換興趣、生活片段與真誠的回答，讓一段對話從輕鬆自在的分享開始。</p>
          </li>
          <li className={styles.stepCard}>
            <span className={styles.stepNumber}>03</span>
            <span className={styles.stepLine} aria-hidden="true" />
            <p className={styles.stepLabel}>第三階 · 雙向選擇</p>
            <h3>真實相遇</h3>
            <p>當雙方都願意繼續認識，才進一步開啟完整介紹與對話。彼此的意願都很重要。</p>
          </li>
        </ol>
        <p className={styles.demoNote}>
          以上為 MIRA 正式服務的設計理念。會員驗證、真實推薦、雙向配對與訊息功能尚未上線。
          <a href="/onboarding">前往本機示範了解流程</a>
        </p>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <p className={styles.eyebrow}>MIRA｜覓然</p>
        <h2 id="closing-title">讓相遇，回到剛好的步調。</h2>
        <p>一段相遇，從自在探索開始。</p>
        <a className={styles.primaryButton} href="/onboarding">開始本機示範 <span aria-hidden="true">↗</span></a>
        <small>這是非正式示範，不會建立帳號或配對真實使用者。</small>
      </section>

      <footer className={styles.footer}>
        <Logo variant="horizontal" size={38} />
        <span>在茫茫人海，遇見剛好的你。</span>
        <span>僅限年滿 18 歲的成年人</span>
      </footer>

    </main>
  );
}

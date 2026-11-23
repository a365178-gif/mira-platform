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
            <a className={styles.primaryButton} href="/explore">開始探索 <span aria-hidden="true">↗</span></a>
            <a className={styles.textLink} href="#steps">認識三階探索 <span aria-hidden="true">↓</span></a>
          </div>
          <p className={styles.availability}>探索與雙向配對已接通 · 須完成成年驗證並啟用帳號</p>
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
          <p>瀏覽符合成年驗證與啟用條件的會員，表達有興趣或略過；雙方都選擇有興趣時建立配對。</p>
          <a className={styles.comingSoon} href="/explore">登入後開始探索</a>
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
            <p className={styles.stepLabel}>第一階 · 發現對象</p>
            <h3>探索會員</h3>
            <p>瀏覽已完成成年驗證並啟用探索的會員，認識對方的自我介紹與興趣。</p>
          </li>
          <li className={styles.stepCard}>
            <span className={styles.stepNumber}>02</span>
            <span className={styles.stepLine} aria-hidden="true" />
            <p className={styles.stepLabel}>第二階 · 表達意願</p>
            <h3>有興趣或略過</h3>
            <p>每位會員各自送出回覆；略過的對象不會再次出現在探索清單。</p>
          </li>
          <li className={styles.stepCard}>
            <span className={styles.stepNumber}>03</span>
            <span className={styles.stepLine} aria-hidden="true" />
            <p className={styles.stepLabel}>第三階 · 雙向配對</p>
            <h3>配對成功</h3>
            <p>只有雙方都選擇有興趣時，資料庫才會建立配對紀錄。訊息功能尚未上線。</p>
          </li>
        </ol>
        <p className={styles.demoNote}>
          探索與雙向配對已接通 Supabase；須完成成年驗證並啟用帳號。推薦與訊息功能尚未上線。
          <a href="/sign-up">建立會員帳號</a>
        </p>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <p className={styles.eyebrow}>MIRA｜覓然</p>
        <h2 id="closing-title">讓相遇，回到剛好的步調。</h2>
        <p>一段相遇，從自在探索開始。</p>
        <a className={styles.primaryButton} href="/explore">開始探索 <span aria-hidden="true">↗</span></a>
        <small>須登入並完成有效成年驗證，且會員資料已啟用。</small>
      </section>

      <footer className={styles.footer}>
        <Logo variant="horizontal" size={38} />
        <span>在茫茫人海，遇見剛好的你。</span>
        <span>僅限年滿 18 歲的成年人</span>
      </footer>

    </main>
  );
}

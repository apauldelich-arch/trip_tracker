'use client';

import React from 'react';
import Image from 'next/image';
import styles from '../app/landing.module.css';

export function WelcomeView({ onStart }: { onStart: () => void }) {
  return (
    <div className={styles.landingBody}>
      {/* HERO SECTION */}
      <header className={styles.heroContent}>
        <h1 className={styles.heroHeading}>
          Real time <span style={{ color: 'var(--primary)' }}>Trip Tracker</span>
        </h1>
        <p className={styles.heroSub}>
          Stop just tracking costs. Start building a high-leverage blueprint 
          of every booking, logistics event, and travel memory.
        </p>
        
        <div className={styles.heroActions}>
          <button onClick={onStart} className={styles.primaryBtn}>
            Plan New Trip
          </button>
        </div>

        <div className={styles.heroVisual}>
          <Image 
            src="/hero.png" 
            alt="Trip Tracker Premium Interface" 
            width={1200} 
            height={800} 
            style={{ width: '100%', height: 'auto', display: 'block' }}
            priority
          />
        </div>
      </header>

      {/* VALUE PROP SECTION */}
      <section className={`${styles.section} ${styles.painsSection}`}>
        <div className={styles.sectionHeader}>
          <h2>From Expenses to Trip Events</h2>
          <p>Treat every entry as a structured booking or a vital memory.</p>
        </div>
        <div className={styles.painsGrid}>
          <div className={styles.painCard}>
            <h4>Structured Bookings</h4>
            <p>Don't just log "Hotel £200". Log "Agroturismo Tuscany - 2 nights" with WiFi quality and car requirements attached.</p>
          </div>
          <div className={styles.painCard}>
            <h4>Automatic Itinerary</h4>
            <p>Your timeline builds itself as you log events. See your journey's story unfold day by day without extra effort.</p>
          </div>
          <div className={styles.painCard}>
            <h4>Decision Goldmine</h4>
            <p>Every archived trip becomes a reusable blueprint. Turn your past travels into recommendations and future plans.</p>
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER COMPARISON */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Static Data vs. Active Memory</h2>
          <p>Transform how you store and recall your travel experiences.</p>
        </div>
        <div className={styles.comparisonGrid}>
          <div className={`${styles.compCard} ${styles.chaos}`}>
            <div className={styles.compLabel}>BEFORE: FLAT EXPENSES</div>
            <ul className={styles.compList}>
              <li>❌ "£16.14 - Trenitalia"</li>
              <li>❌ "£264 - Hotel"</li>
              <li>❌ Where was that restaurant?</li>
              <li>❌ How much did we spend on food?</li>
            </ul>
          </div>
          <div className={`${styles.compCard} ${styles.clarity}`}>
            <div className={styles.compLabel}>AFTER: RICH EVENTS</div>
            <ul className={styles.compList}>
              <li>✅ "Train Florence → Pisa (1h, smooth)"</li>
              <li>✅ "Tuscany Stay - WiFi required car"</li>
              <li>✅ "Amazing Pasta at Da Vinci's (✨)"</li>
              <li>✅ "Food is 32% of total spend"</li>
            </ul>
          </div>
        </div>
      </section>

      {/* QUALIFIERS SECTION */}
      <section className={`${styles.section} ${styles.painsSection}`}>
        <div className={styles.qualifierGrid}>
          <div className={styles.qualifierBox}>
            <h3>This is for you if:</h3>
            <ul className={styles.compList}>
              <li>✓ You want a structured record of your travels.</li>
              <li>✓ you appreciate "Decision Engines" over simple lists.</li>
              <li>✓ You need to manage bookings and costs in one view.</li>
              <li>✓ You value 100% private, local-first data storage.</li>
            </ul>
          </div>
          <div className={styles.qualifierBox} style={{ opacity: 0.8 }}>
            <h3>This is NOT for you if:</h3>
            <ul className={styles.compList}>
              <li>✗ You just want a simple bank sync app.</li>
              <li>✗ You don't care about notes or trip context.</li>
              <li>✗ You prefer messy spreadsheets for planning.</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className={styles.section} style={{ padding: '4rem 0', textAlign: 'center', opacity: 0.5 }}>
        <p>© 2026 Trip Tracker &middot; Privacy First &middot; Structured Travel Memory</p>
      </footer>
    </div>
  );
}

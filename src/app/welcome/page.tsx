'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../landing.module.css';

export default function Welcome() {
  return (
    <div className={styles.landingBody}>
      <header className={styles.heroContent}>
        <div className={styles.badgeStrip}>
          <div className={styles.badgePrimary}>Real-time Trip Tracker</div>
        </div>
        <h1 className={styles.heroHeading}>
          Control Your <span style={{ color: 'var(--primary)' }}>Travel Spending</span>
        </h1>
        <p className={styles.heroSub}>
          The perfect companion for journeys, bookings, and travel memories. 
          Securely attach your digital tickets of your journey.
        </p>

        <div className={styles.heroActions}>
          <Link href="/" className={styles.primaryBtn}>
            Launch App
          </Link>
        </div>

        <div className={styles.heroVisual}>
          <Image 
            src="/hero.png" 
            alt="Life Spend Tracker Premium Interface" 
            width={1200} 
            height={800} 
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      </header>

      <section className={styles.featuresGrid}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🏔️</div>
          <h3>Trip Optimized</h3>
          <p>Real-time memory and spend engine for your ongoing journeys. One-click tracking for expenses and events.</p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🎫</div>
          <h3>Ticket & Record Vault</h3>
          <p>Securely attach your digital tickets of your journey directly to your trip events.</p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>📍</div>
          <h3>Itinerary Building</h3>
          <p>Your timeline builds itself as you log events. See your journey's story unfold day by day with MAP navigation.</p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🛡️</div>
          <h3>100% Private</h3>
          <p>No accounts. No cloud databases. Your data lives exclusively on your device's local storage.</p>
        </div>
      </section>

      <footer style={{ marginTop: 'auto', padding: '4rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        © 2026 Live Spend Tracker. Designed for high-performance budgeting.
      </footer>
    </div>
  );
}

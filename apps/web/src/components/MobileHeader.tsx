'use client';

import Link from 'next/link';

export default function MobileHeader() {
  return (
    <header className="mobile-header">
      <div className="mobile-header-inner">
        <Link href="/" className="mobile-header-logo">
          <div className="mobile-logo-icon">
            <img src="/logo.png" alt="VedaAI Logo" />
          </div>
          <span className="mobile-logo-text">VedaAI</span>
        </Link>
        <div className="mobile-header-right">
          <button className="mobile-icon-btn" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notification-dot"></span>
          </button>
          <div className="mobile-avatar" style={{ background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="avatar-initial" style={{ fontWeight: 700, color: '#D97706', fontSize: '14px' }}>J</span>
          </div>
          <button className="mobile-hamburger" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

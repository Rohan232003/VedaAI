'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAssignmentStore } from '@/store/assignmentStore';
import AssignmentCard from '@/components/AssignmentCard';

export default function Dashboard() {
  const { assignments, isLoading, fetchAssignments, searchQuery, setSearchQuery } = useAssignmentStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchAssignments().then(() => setLoaded(true));
  }, [fetchAssignments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssignments();
  };

  if (!loaded) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <div className="loading-text">Loading assignments...</div>
      </div>
    );
  }

  // Empty state
  if (assignments.length === 0 && !searchQuery) {
    return (
      <div className="dash-page fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)' }}>
        <div className="empty-state">
          <div className="empty-illustration">
            <img src="/Illustrations.png" alt="No assignments" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 className="empty-title">No assignments yet</h2>
          <p className="empty-desc">
            Create your first assignment to start collecting and grading student
            submissions. You can set up rubrics, define marking criteria, and let AI
            assist with grading.
          </p>
          <Link href="/create" className="btn btn-dark btn-lg" style={{ borderRadius: '30px', padding: '12px 28px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Your First Assignment
          </Link>
        </div>
      </div>
    );
  }

  // Filled state — Figma design
  return (
    <div className="dash-page fade-in">
      {/* Page Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-dot" />
          <div>
            <h1 className="dash-title">Assignments</h1>
            <p className="dash-subtitle">Manage and create assignments for your classes.</p>
          </div>
        </div>
      </div>

      {/* Filter + Search Row */}
      <div className="dash-toolbar">
        <button className="dash-filter-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filter By
        </button>
        <form className="dash-search-wrap" onSubmit={handleSearch}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="dash-search-input"
            placeholder="Search Assignment"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Assignment Grid */}
      <div className="dash-grid">
        {assignments.map((a) => (
          <AssignmentCard key={a._id} assignment={a} />
        ))}
      </div>

      {/* Bottom Create Button */}
      <div className="dash-create-float">
        <Link href="/create" className="dash-create-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Assignment
        </Link>
      </div>
    </div>
  );
}

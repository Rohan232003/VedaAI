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
      <div className="fade-in">
        <div className="empty-state">
          <div className="empty-illustration">
            <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
              <circle cx="100" cy="80" r="60" fill="#F3F4F6" />
              <rect x="70" y="40" width="50" height="65" rx="4" fill="#fff" stroke="#D1D5DB" strokeWidth="1.5" />
              <line x1="80" y1="52" x2="110" y2="52" stroke="#E5E7EB" strokeWidth="2" />
              <line x1="80" y1="60" x2="105" y2="60" stroke="#E5E7EB" strokeWidth="2" />
              <line x1="80" y1="68" x2="100" y2="68" stroke="#E5E7EB" strokeWidth="2" />
              <line x1="80" y1="76" x2="108" y2="76" stroke="#E5E7EB" strokeWidth="2" />
              <line x1="80" y1="84" x2="95" y2="84" stroke="#E5E7EB" strokeWidth="2" />
              <circle cx="130" cy="85" r="24" fill="#fff" stroke="#D1D5DB" strokeWidth="1.5" />
              <circle cx="130" cy="85" r="10" stroke="#9CA3AF" strokeWidth="2" fill="none" />
              <line x1="137" y1="92" x2="148" y2="103" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="130" cy="85" r="5" fill="#FCA5A5" />
              <line x1="127" y1="82" x2="133" y2="88" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="133" y1="82" x2="127" y2="88" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M55 50 Q45 45 50 35" stroke="#9CA3AF" strokeWidth="1" fill="none" strokeDasharray="3 3" />
              <circle cx="55" cy="115" r="3" fill="#93C5FD" />
              <circle cx="150" cy="45" r="2" fill="#C4B5FD" />
            </svg>
          </div>
          <h2 className="empty-title">No assignments yet</h2>
          <p className="empty-desc">
            Create your first assignment to start collecting and grading student
            submissions. You can set up rubrics, define marking criteria, and let AI
            assist with grading.
          </p>
          <Link href="/create" className="btn btn-dark btn-lg">
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

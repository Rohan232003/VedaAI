'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useAssignmentStore, Assignment } from '@/store/assignmentStore';
import { format } from 'date-fns';

export default function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { deleteAssignment } = useAssignmentStore();

  const handleDelete = async () => {
    if (confirm('Delete this assignment?')) {
      await deleteAssignment(assignment._id);
    }
    setMenuOpen(false);
  };

  const formattedCreated = (() => {
    try { return format(new Date(assignment.createdAt), 'dd-MM-yyyy'); } catch { return '—'; }
  })();
  const formattedDue = (() => {
    try { return format(new Date(assignment.dueDate), 'dd-MM-yyyy'); } catch { return '—'; }
  })();

  return (
    <div className="acard fade-in">
      <div className="acard-top">
        <div className="acard-title">{assignment.title}</div>
        <div className="acard-menu" ref={menuRef}>
          <button className="acard-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="acard-dropdown">
              <Link href={`/assignment/${assignment._id}`} className="acard-dropdown-item" onClick={() => setMenuOpen(false)}>
                View Assignment
              </Link>
              <button className="acard-dropdown-item acard-dropdown-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="acard-bottom">
        <span><strong>Assigned on</strong> : {formattedCreated}</span>
        <span><strong>Due</strong> : {formattedDue}</span>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { randomString } from '@/lib/utils';
import styles from '../styles/Home.module.css';

export type ParticipantRole = 'teacher' | 'student';

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [role, setRole] = useState<ParticipantRole>('student');
  const [roomName, setRoomName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const generateRoomId = () => {
    return `${randomString(4)}-${randomString(4)}`;
  };

  const handleCreateClassroom = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    const newRoomName = generateRoomId();
    router.push(`/classroom/${newRoomName}?name=${encodeURIComponent(name)}&role=teacher`);
  };

  const handleJoinClassroom = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!roomName.trim()) {
      alert('Please enter a room name');
      return;
    }
    router.push(`/classroom/${roomName}?name=${encodeURIComponent(name)}&role=student`);
  };

  return (
    <main className={styles.main} data-lk-theme="default">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🎓 LiveKit Classroom Meet</h1>
          <p>Educational video conferencing with teacher and student roles</p>
        </div>

        <div className={styles.content}>
          <div className={styles.formSection}>
            <label htmlFor="name">Your Name</label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formSection}>
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as ParticipantRole)}
              className={styles.select}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {role === 'teacher' ? (
            <div className={styles.buttonSection}>
              <button
                className={styles.primaryButton}
                onClick={handleCreateClassroom}
                disabled={isJoining}
              >
                Create Classroom
              </button>
              <p className={styles.hint}>
                Create a new classroom and share the room name with your students
              </p>
            </div>
          ) : (
            <div className={styles.formSection}>
              <label htmlFor="roomName">Room Name</label>
              <input
                id="roomName"
                type="text"
                placeholder="Enter room name (e.g., abcd-1234)"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className={styles.input}
              />
              <button
                className={styles.primaryButton}
                onClick={handleJoinClassroom}
                disabled={isJoining}
              >
                Join Classroom
              </button>
            </div>
          )}
        </div>

        <div className={styles.features}>
          <h2>Features</h2>
          <div className={styles.featureGrid}>
            <div className={styles.feature}>
              <h3>👨‍🏫 Teacher Controls</h3>
              <p>Mute all, screen share, recording, and participant management</p>
            </div>
            <div className={styles.feature}>
              <h3>✋ Hand Raising</h3>
              <p>Students can raise their hand to ask questions</p>
            </div>
            <div className={styles.feature}>
              <h3>💬 Chat</h3>
              <p>Real-time messaging for class discussions</p>
            </div>
            <div className={styles.feature}>
              <h3>📺 Screen Sharing</h3>
              <p>Share your screen with the entire class</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


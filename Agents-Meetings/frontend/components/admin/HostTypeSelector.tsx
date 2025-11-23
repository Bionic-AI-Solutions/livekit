'use client';

import { useState } from 'react';

interface HostTypeSelectorProps {
  value: 'human' | 'avatar' | null;
  onChange: (value: 'human' | 'avatar') => void;
  disabled?: boolean;
}

export default function HostTypeSelector({ value, onChange, disabled }: HostTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Host Type</label>
      <div className="flex gap-4">
        <label className="flex items-center">
          <input
            type="radio"
            value="human"
            checked={value === 'human'}
            onChange={() => onChange('human')}
            disabled={disabled}
            className="mr-2"
          />
          Human Host
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="avatar"
            checked={value === 'avatar'}
            onChange={() => onChange('avatar')}
            disabled={disabled}
            className="mr-2"
          />
          Avatar Host
        </label>
      </div>
    </div>
  );
}


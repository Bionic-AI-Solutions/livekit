'use client';

import { useState, useEffect } from 'react';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  supportedLanguages?: string[];
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
];

export default function LanguageSelector({ value, onChange, supportedLanguages }: LanguageSelectorProps) {
  const availableLanguages = supportedLanguages
    ? languages.filter(lang => supportedLanguages.includes(lang.code))
    : languages;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Language</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded"
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}


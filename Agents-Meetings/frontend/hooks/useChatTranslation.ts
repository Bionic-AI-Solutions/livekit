'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRoomContext, useChat } from '@livekit/components-react';
import { RoomEvent, ChatMessage } from 'livekit-client';

/**
 * Hook to translate chat messages based on user's language preference
 * This creates a translation cache and translates messages client-side
 */
export function useChatTranslation(language: string) {
  const room = useRoomContext();
  const { chatMessages } = useChat();
  const [translationCache, setTranslationCache] = useState<Map<string, string>>(new Map());

  // Simple translation mapping for common phrases (fallback)
  // In production, this would use a translation API
  const simpleTranslations: Record<string, Record<string, string>> = {
    en: {
      'hello': 'hello',
      'hi': 'hi',
      'how are you': 'how are you',
    },
    es: {
      'hello': 'hola',
      'hi': 'hola',
      'how are you': '¿cómo estás?',
    },
    fr: {
      'hello': 'bonjour',
      'hi': 'salut',
      'how are you': 'comment allez-vous?',
    },
    de: {
      'hello': 'hallo',
      'hi': 'hallo',
      'how are you': 'wie geht es dir?',
    },
  };

  // Translate a message (simplified - in production, use a translation API)
  const translateMessage = async (message: string, targetLang: string): Promise<string> => {
    // Check cache first
    const cacheKey = `${message}:${targetLang}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    // If message is already in target language or is empty, return as-is
    if (!message || message.trim() === '') {
      return message;
    }

    // For now, use simple translation mapping
    // In production, you would call a translation API here
    const lowerMessage = message.toLowerCase().trim();
    const translated = simpleTranslations[targetLang]?.[lowerMessage] || message;

    // Cache the translation
    setTranslationCache((prev) => {
      const newCache = new Map(prev);
      newCache.set(cacheKey, translated);
      return newCache;
    });

    return translated;
  };

  // Create a message formatter that translates messages
  const chatMessageFormatter = useMemo(() => {
    return async (message: string): Promise<string> => {
      // If language is English, return as-is (assuming original messages are in English)
      // Otherwise, translate
      if (language === 'en') {
        return message;
      }

      try {
        return await translateMessage(message, language);
      } catch (error) {
        console.error('Translation error:', error);
        return message; // Fallback to original message
      }
    };
  }, [language, translationCache]);

  return { chatMessageFormatter };
}


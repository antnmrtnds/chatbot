"use client";

import { useState, useEffect, useRef } from 'react';

type UseSpeechRecognitionOptions = {
  onTranscript: (transcript: string) => void;
  onEnd?: () => void;
};

export function useSpeechRecognition({ onTranscript, onEnd }: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        setIsAvailable(true);
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-PT'; // Set to Portuguese

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const finalTranscript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          
          if (event.results[event.results.length - 1].isFinal) {
            onTranscript(finalTranscript);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (onEnd) {
            onEnd();
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, [onTranscript, onEnd]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Speech recognition couldn't start.", error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return {
    isListening,
    isAvailable,
    startListening,
    stopListening,
    toggleListening,
  };
} 
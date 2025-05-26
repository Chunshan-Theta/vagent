import React, { useState, useRef, useEffect } from 'react';
import { Language, getTranslation, SUPPORTED_LANGUAGES } from '../i18n/translations';

interface LanguageToggleProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LanguageToggle({ currentLanguage, onLanguageChange }: LanguageToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="absolute bottom-14 right-0 bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden min-w-[160px] border border-gray-700">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const localizedName = getTranslation(currentLanguage, `languages_label.${lang}_label`);
            const nativeName = getTranslation(lang, `languages_label.${lang}_label`);
            return (
              <button
                key={lang}
                onClick={() => {
                  onLanguageChange(lang);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-700/50 text-white transition-colors duration-200
                  ${currentLanguage === lang ? 'bg-gray-700/70' : ''}
                  ${lang !== SUPPORTED_LANGUAGES[SUPPORTED_LANGUAGES.length - 1] ? 'border-b border-gray-700' : ''}`}
              >
                <span className="flex items-center space-x-3">
                  <span className="text-sm font-medium">{localizedName}</span>
                  <span className="text-sm text-gray-400">{nativeName}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-gray-800/95 backdrop-blur-sm hover:bg-gray-700 text-white rounded-full w-10 h-10 shadow-lg 
          transition-all duration-200 ease-in-out flex items-center justify-center
          ${isOpen ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
        title={getTranslation(currentLanguage, `languages_label.${currentLanguage}_label`)}
      >
        <span className="text-sm font-medium">
          {currentLanguage.toUpperCase()}
        </span>
      </button>
    </div>
  );
} 
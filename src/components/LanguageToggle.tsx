/**
 * Language Toggle Button Component
 * Switches between Chinese and English
 */

import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { lang, toggleLang } = useI18n();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLang}
      className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
      title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <Globe className="w-3.5 h-3.5" />
      <span className="font-sans tracking-wide">
        {lang === 'zh' ? 'EN' : '中文'}
      </span>
    </Button>
  );
}

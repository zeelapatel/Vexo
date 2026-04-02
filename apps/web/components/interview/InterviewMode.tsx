'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface InterviewModeProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Phase 2: Interview mode has moved to /challenges.
 * This component now acts as a redirect trigger when opened.
 */
export function InterviewMode({ open, onClose }: InterviewModeProps) {
  const router = useRouter();

  useEffect(() => {
    if (open) {
      onClose();
      router.push('/challenges');
    }
  }, [open, onClose, router]);

  return null;
}

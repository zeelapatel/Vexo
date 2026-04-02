import { useState, useEffect } from 'react';
import { estimateStorageUsage } from '@/store/persistence';

const WARNING_THRESHOLD_BYTES = 4 * 1024 * 1024; // 4MB

export function useStorageWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const usage = estimateStorageUsage();
    if (usage > WARNING_THRESHOLD_BYTES && !dismissed) {
      setShowWarning(true);
    }
  }, [dismissed]);

  const dismiss = () => {
    setDismissed(true);
    setShowWarning(false);
  };

  return { showWarning, dismiss };
}

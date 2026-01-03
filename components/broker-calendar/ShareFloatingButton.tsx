'use client';

/**
 * ShareFloatingButton Component
 * Floating action button for sharing broker calendar analysis
 * Positioned above the Chart FAB
 */

import { motion } from 'framer-motion';
import { Button } from '@heroui/button';

// ============================================================================
// Types
// ============================================================================

interface ShareFloatingButtonProps {
  onPress: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ShareFloatingButton({ onPress }: ShareFloatingButtonProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      className="fixed bottom-28 right-8 z-[9998] group"
    >
      <Button
        isIconOnly
        size="lg"
        color="default"
        variant="flat"
        className="rounded-full shadow-2xl h-14 w-14"
        onPress={onPress}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </Button>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Share Analysis
      </div>
    </motion.div>
  );
}

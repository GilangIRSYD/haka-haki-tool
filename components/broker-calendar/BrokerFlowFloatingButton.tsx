'use client';

/**
 * BrokerFlowFloatingButton Component
 * Floating action button for showing Broker Flow Chart
 * Positioned above the Share FAB
 */

import { motion } from 'framer-motion';
import { Button } from '@heroui/button';

// ============================================================================
// Types
// ============================================================================

interface BrokerFlowFloatingButtonProps {
  onPress: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function BrokerFlowFloatingButton({
  onPress,
}: BrokerFlowFloatingButtonProps) {
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
      className="fixed bottom-48 right-8 z-[9997] group"
    >
      <Button
        isIconOnly
        size="lg"
        color="secondary"
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
          <path d="M3 3v18h18" />
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
        </svg>
      </Button>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Broker Flow Chart
      </div>
    </motion.div>
  );
}

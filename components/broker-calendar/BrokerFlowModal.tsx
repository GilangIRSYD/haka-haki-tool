'use client';

/**
 * BrokerFlowModal Component
 * Modal for displaying the Broker Flow Chart
 * Following the same pattern as TradingViewModal and ShareModal
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@heroui/button';
import { BrokerFlowChart } from './BrokerFlowChart';
import { Spinner } from '@heroui/spinner';

// ============================================================================
// Types
// ============================================================================

export interface BrokerDataPoint {
  date: string;
  close_price: number;
  brokers: Record<string, { value: number; volume: number }>;
}

interface BrokerFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BrokerDataPoint[];
  brokers: string[];
  symbol: string;
  isLoading?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function BrokerFlowModal({
  isOpen,
  onClose,
  data,
  brokers,
  symbol,
  isLoading = false,
}: BrokerFlowModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Modal Content */}
          <div className="fixed inset-4 md:inset-8 lg:inset-12 z-[10002] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full pointer-events-auto"
            >
              <div className="w-full h-full bg-content1 border border-default-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-default-200 flex-shrink-0">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold">
                      Broker Flow Analysis - {symbol}
                    </h2>
                    <p className="text-sm text-default-500">
                      Time-series chart showing broker accumulation/distribution with price overlay
                    </p>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={onClose}
                    className="rounded-full"
                  >
                    ✕
                  </Button>
                </div>

                {/* Body - Chart */}
                <div className="flex-1 p-6 min-h-0 overflow-hidden">
                  {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Spinner size="lg" color="primary" />
                        <p className="text-sm text-default-500 mt-4">
                          Loading chart data...
                        </p>
                      </div>
                    </div>
                  ) : data.length > 0 ? (
                    <BrokerFlowChart
                      data={data}
                      brokers={brokers}
                      symbol={symbol}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-default-500">
                          No data available for the selected date range.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer - Summary Stats */}
                {!isLoading && data.length > 0 && (() => {
                  // Calculate price change from first to last day
                  const firstPrice = data[0].close_price;
                  const lastPrice = data[data.length - 1].close_price;
                  const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;
                  const isPositive = percentageChange >= 0;

                  return (
                    <div className="px-6 py-4 border-t border-default-200 flex-shrink-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Date Range */}
                        <div className="text-center">
                          <p className="text-[10px] text-default-500 mb-1">Date Range</p>
                          <p className="text-sm font-bold">
                            {data.length} day{data.length > 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Price Range */}
                        <div className="text-center">
                          <p className="text-[10px] text-default-500 mb-1">Price Range</p>
                          <p className="text-sm font-bold">
                            {firstPrice.toFixed(0)} - {lastPrice.toFixed(0)}{' '}
                            <span className={isPositive ? 'text-success' : 'text-danger'}>
                              ({isPositive ? '+' : ''}{percentageChange.toFixed(1)}%)
                            </span>
                          </p>
                        </div>

                        {/* Active Brokers */}
                        <div className="text-center">
                          <p className="text-[10px] text-default-500 mb-1">Active Brokers</p>
                          <p className="text-sm font-bold">{brokers.length}</p>
                        </div>

                        {/* Symbol */}
                        <div className="text-center">
                          <p className="text-[10px] text-default-500 mb-1">Symbol</p>
                          <p className="text-sm font-bold">{symbol}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[10001]"
            onClick={onClose}
          />
        </>
      )}
    </AnimatePresence>
  );
}

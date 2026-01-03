'use client';

/**
 * ShareModal Component
 * Modal for generating shareable links with optional custom slugs
 * Following the same pattern as TradingViewModal
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { addToast } from '@heroui/toast';
import { createShareLink } from '@/lib/api/share';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

// ============================================================================
// Types
// ============================================================================

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: {
    symbol: string;
    from: string;
    to: string;
    broker_code: string[];
  } | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitize slug according to backend validation rules
 */
const sanitizeSlug = (slug: string): string => {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Validate slug according to backend rules
 */
const validateSlug = (slug: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeSlug(slug);

  if (sanitized.length < 6) {
    return { valid: false, error: 'Slug must be at least 6 characters' };
  }

  if (sanitized.length > 50) {
    return { valid: false, error: 'Slug must not exceed 50 characters' };
  }

  if (!/^[a-z0-9-_]+$/.test(sanitized)) {
    return {
      valid: false,
      error: 'Slug can only contain letters, numbers, hyphens, and underscores'
    };
  }

  const reserved = ['api', 'health', 's', 'static', 'assets', 'admin'];
  if (reserved.includes(sanitized.toLowerCase())) {
    return { valid: false, error: 'This slug is reserved and cannot be used' };
  }

  return { valid: true };
};

/**
 * Calculate date range days
 */
const calculateDateRangeDays = (from: string, to: string): number => {
  const startDate = new Date(from);
  const endDate = new Date(to);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ============================================================================
// Component
// ============================================================================

export function ShareModal({ isOpen, onClose, shareData }: ShareModalProps) {
  // State
  const [customSlug, setCustomSlug] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  // Analytics
  const { trackShareLinkGenerated } = useAnalytics();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCustomSlug('');
      setGeneratedUrl('');
      setSlugError(null);
    }
  }, [isOpen]);

  // Handle slug change with real-time validation
  const handleSlugChange = (value: string) => {
    setCustomSlug(value);

    if (value.length > 0) {
      const validation = validateSlug(value);
      if (!validation.valid && validation.error) {
        setSlugError(validation.error);
      } else {
        setSlugError(null);
      }
    } else {
      setSlugError(null);
    }
  };

  // Generate and copy share link
  const handleGenerateAndCopy = async () => {
    if (!shareData) {
      return;
    }

    if (customSlug) {
      const validation = validateSlug(customSlug);
      if (!validation.valid) {
        addToast({
          title: "Invalid Slug",
          description: validation.error || 'Please check your slug and try again.',
          color: "danger",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await createShareLink({
        symbol: shareData.symbol,
        from: shareData.from,
        to: shareData.to,
        broker_code: shareData.broker_code,
        customSlug: customSlug ? sanitizeSlug(customSlug) : undefined,
        ttlDays: 30,
      });

      const copied = await copyToClipboard(response.data.url);

      if (copied) {
        setGeneratedUrl(response.data.url);
        addToast({
          title: "Link Copied!",
          description: "Share link has been copied to your clipboard.",
          color: "success",
        });

        trackShareLinkGenerated(
          shareData.symbol,
          !!customSlug,
          customSlug,
          shareData.broker_code.length,
          calculateDateRangeDays(shareData.from, shareData.to)
        );
      } else {
        addToast({
          title: "Copy Failed",
          description: "Failed to copy to clipboard. Please copy manually.",
          color: "warning",
        });
        setGeneratedUrl(response.data.url);
      }
    } catch (error: any) {
      addToast({
        title: "Failed to Generate Link",
        description: error.message || "An error occurred while generating the share link.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Modal Content - HIGHER z-index */}
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md pointer-events-auto"
            >
              <div className="bg-content1 border border-default-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-default-200 flex-shrink-0">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold">Generate Share Link</h2>
                    <p className="text-sm text-default-500">
                      Create a shareable link for this broker calendar analysis
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

                {/* Body */}
                <div className="p-6">
                  {/* Share Info */}
                  <div className="bg-default-100 rounded-lg p-3 mb-4">
                    <div className="text-xs text-default-500 mb-1">Analysis Details</div>
                    <div className="text-sm font-semibold">{shareData?.symbol}</div>
                    <div className="text-xs text-default-500">
                      {shareData?.from} to {shareData?.to} • {shareData?.broker_code.length} broker(s)
                    </div>
                  </div>

                  {/* Custom Slug Input */}
                  <div className="mb-4">
                    <Input
                      label="Custom Slug (Optional)"
                      placeholder="e.g., cek calendar ini cuy lagi akum"
                      value={customSlug}
                      onValueChange={handleSlugChange}
                      isInvalid={!!slugError}
                      errorMessage={slugError}
                      description="Leave empty for auto-generated slug. Min 6 characters."
                      isDisabled={isLoading || !!generatedUrl}
                      variant="bordered"
                    />
                  </div>

                  {/* Generated URL Display */}
                  {generatedUrl && (
                    <div className="mb-4">
                      <div className="text-xs text-default-500 mb-1">Generated Link</div>
                      <Input
                        value={generatedUrl}
                        isReadOnly
                        variant="bordered"
                        classNames={{
                          input: "text-sm",
                        }}
                        endContent={
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            onPress={async () => {
                              const copied = await copyToClipboard(generatedUrl);
                              if (copied) {
                                addToast({
                                  title: "Copied!",
                                  description: "Link copied to clipboard",
                                  color: "success",
                                });
                              }
                            }}
                          >
                            Copy
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 px-6 py-4 border-t border-default-200 flex-shrink-0">
                  <Button
                    variant="flat"
                    onPress={onClose}
                    isDisabled={isLoading}
                  >
                    Close
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleGenerateAndCopy}
                    isLoading={isLoading}
                    isDisabled={!!generatedUrl}
                  >
                    {generatedUrl ? 'Generated' : 'Generate & Copy'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Backdrop - LOWER z-index */}
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

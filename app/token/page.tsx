"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { useTrackPageView } from "@/lib/hooks/useTrackPageView";

// Types
interface TokenInfo {
  exp: number;
  iat: number;
  profile_token: string;
}

// Generate random hex string for x-nonce header
function generateNonce(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// Format timestamp to readable date
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// Mask token for security (show first 8 and last 4 characters)
function maskToken(token: string): string {
  if (token.length <= 12) return '****';
  return `${token.substring(0, 8)}...${token.substring(token.length - 4)}`;
}

// Calculate time remaining until expiration
function getTimeRemaining(exp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const seconds = exp - now;

  if (seconds <= 0) return 'Expired';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return 'Less than a minute';
}

// Extract token from curl command or plain text
function extractToken(input: string): string {
  const trimmed = input.trim();

  // Try to match authorization header in curl command
  // Patterns:
  // 1. -H 'authorization: Bearer <token>'
  // 2. -H "authorization: Bearer <token>"
  // 3. authorization: Bearer <token>
  // Case insensitive

  const patterns = [
    /-H\s+['"]authorization:\s+Bearer\s+([^'"]+)['"]/i,
    /authorization:\s+Bearer\s+([^\s'"]+)/i,
    /bearer\s+([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // If no curl pattern found, assume it's a plain token
  // Remove 'Bearer ' prefix if present
  const bearerMatch = trimmed.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch && bearerMatch[1]) {
    return bearerMatch[1].trim();
  }

  // Return as-is if it looks like a JWT (3 parts separated by dots)
  if (trimmed.split('.').length === 3) {
    return trimmed;
  }

  // Return original input if nothing matches
  return trimmed;
}

export default function TokenPage() {
  // Track page view
  useTrackPageView({
    pageTitle: 'Token Management',
  });

  // Password authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Token management state
  const [tokenInput, setTokenInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingToken, setIsLoadingToken] = useState<boolean>(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('tokenPageAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Auto-fetch token info when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      handleGetToken();
    }
  }, [isAuthenticated]);

  // Verify password
  async function handleVerifyPassword() {
    if (!passwordInput.trim()) {
      addToast({
        title: "Validation Error",
        description: "Please enter a password",
        color: "danger",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/auth/verify-token-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('tokenPageAuth', 'true');
        setPasswordInput("");
        addToast({
          title: "Success",
          description: "Password verified. Access granted.",
          color: "success",
        });
      } else {
        addToast({
          title: "Access Denied",
          description: data.error || "Invalid password",
          color: "danger",
        });
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to verify password",
        color: "danger",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  // Logout
  function handleLogout() {
    setIsAuthenticated(false);
    localStorage.removeItem('tokenPageAuth');
    setTokenInfo(null);
    addToast({
      title: "Logged Out",
      description: "You have been logged out",
      color: "default",
    });
  }

  // Set token - POST to API
  async function handleSetToken() {
    if (!tokenInput.trim()) {
      addToast({
        title: "Validation Error",
        description: "Please enter a token or curl command",
        color: "danger",
      });
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = 'https://api-idx.gsphomelab.org/api/v1';
      const endpoint = '/config/access-token';

      // Extract token from input (supports curl command or plain token)
      const extractedToken = extractToken(tokenInput);

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nonce': generateNonce(),
        },
        body: JSON.stringify({ token: extractedToken }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      addToast({
        title: "Success",
        description: "Token has been set successfully",
        color: "success",
      });

      // Clear input and fetch updated token info
      setTokenInput("");
      await handleGetToken();
    } catch (error) {
      addToast({
        title: "Failed to Set Token",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Get token info - GET from API
  async function handleGetToken() {
    setIsLoadingToken(true);

    try {
      const baseUrl = 'https://api-idx.gsphomelab.org/api/v1';
      const endpoint = '/config/access-token';

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'x-nonce': generateNonce(),
        },
      });

      if (response.status === 404) {
        // Token doesn't exist
        setTokenInfo(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data: TokenInfo = await response.json();
      setTokenInfo(data);
    } catch (error) {
      addToast({
        title: "Failed to Get Token",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        color: "danger",
      });
    } finally {
      setIsLoadingToken(false);
    }
  }

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardBody className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <span className="text-4xl">🔒</span>
              </div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Protected Page
              </h1>
              <p className="text-default-600">
                Enter password to access token management
              </p>
            </div>

            {/* Password Input */}
            <div className="space-y-4">
              <Input
                label="Password"
                placeholder="Enter access password"
                value={passwordInput}
                onValueChange={setPasswordInput}
                type="password"
                isDisabled={isVerifying}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyPassword();
                  }
                }}
              />

              <Button
                color="primary"
                size="md"
                className="w-full font-semibold"
                onPress={handleVerifyPassword}
                isLoading={isVerifying}
                isDisabled={!passwordInput.trim()}
              >
                {isVerifying ? "Verifying..." : "Access Token Page"}
              </Button>
            </div>

            {/* Info */}
            <div className="bg-default-100 dark:bg-default-200 rounded-lg p-4">
              <p className="text-sm text-default-600 text-center">
                🔐 This page is protected. Please contact administrator if you don't have the password.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Show token management UI if authenticated
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background to-default-100 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Token Management
            </h1>
            <p className="text-default-600">
              Manage your access token for internal service authentication
            </p>
          </div>
          <Button
            color="danger"
            variant="flat"
            size="sm"
            onPress={handleLogout}
          >
            Logout
          </Button>
        </div>

        {/* Set Token Card */}
        <Card className="w-full">
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Set Token</h2>
              <Chip
                color="primary"
                variant="flat"
                size="sm"
              >
                POST /config/access-token
              </Chip>
            </div>

            <p className="text-default-600 text-sm">
              Paste your curl command or access token below. The token will be automatically extracted and stored on the server.
            </p>

            <div className="space-y-1">
              <label className="text-small font-medium text-foreground-600">
                Token or Curl Command
              </label>
              <textarea
                placeholder="Paste your curl command here...&#10;Example: curl 'https://api.example.com' -H 'authorization: Bearer YOUR_TOKEN'"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                disabled={isLoading}
                rows={6}
                className={`
                  w-full px-3 py-2 rounded-lg
                  font-mono text-sm
                  bg-default-100 dark:bg-default-200/50
                  text-foreground-600
                  border-2 border-default-200 dark:border-default-100
                  focus:outline-none focus:border-2 focus:border-primary
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                  resize-y
                  min-h-[100px]
                `}
              />
            </div>

            <Button
              color="primary"
              size="md"
              className="w-full font-semibold"
              onPress={handleSetToken}
              isLoading={isLoading}
              isDisabled={!tokenInput.trim()}
            >
              {isLoading ? "Setting Token..." : "Set Token"}
            </Button>
          </CardBody>
        </Card>

        {/* Get Token Info Card */}
        <Card className="w-full">
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Token Information</h2>
              <Chip
                color="secondary"
                variant="flat"
                size="sm"
              >
                GET /config/access-token
              </Chip>
            </div>

            <div className="flex items-center gap-2">
              <Button
                color="secondary"
                size="sm"
                variant="flat"
                onPress={handleGetToken}
                isLoading={isLoadingToken}
                isDisabled={isLoadingToken}
              >
                {isLoadingToken ? "Loading..." : "Refresh"}
              </Button>
              <span className="text-sm text-default-600">
                Click to fetch current token information
              </span>
            </div>

            {/* Token Info Display */}
            {isLoadingToken ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" color="primary" />
              </div>
            ) : tokenInfo ? (
              <div className="space-y-4 mt-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <Chip
                    color={tokenInfo.exp > Math.floor(Date.now() / 1000) ? "success" : "danger"}
                    variant="flat"
                  >
                    {tokenInfo.exp > Math.floor(Date.now() / 1000) ? "Active" : "Expired"}
                  </Chip>
                  {tokenInfo.exp > Math.floor(Date.now() / 1000) && (
                    <span className="text-sm text-default-600">
                      Expires in {getTimeRemaining(tokenInfo.exp)}
                    </span>
                  )}
                </div>

                {/* Profile Token */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-default-600">Profile Token</p>
                  <div className="bg-default-100 dark:bg-default-200 rounded-lg px-4 py-3">
                    <p className="font-mono text-sm break-all">
                      {tokenInfo.profile_token}
                    </p>
                  </div>
                </div>

                {/* Issued At */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-default-600">Issued At (iat)</p>
                  <div className="bg-default-100 dark:bg-default-200 rounded-lg px-4 py-3">
                    <p className="font-mono text-sm">
                      {formatTimestamp(tokenInfo.iat)}
                    </p>
                    <p className="text-xs text-default-500 mt-1">
                      Timestamp: {tokenInfo.iat}
                    </p>
                  </div>
                </div>

                {/* Expiration */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-default-600">Expiration (exp)</p>
                  <div className="bg-default-100 dark:bg-default-200 rounded-lg px-4 py-3">
                    <p className="font-mono text-sm">
                      {formatTimestamp(tokenInfo.exp)}
                    </p>
                    <p className="text-xs text-default-500 mt-1">
                      Timestamp: {tokenInfo.exp}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-default-100 dark:bg-default-200">
                  <span className="text-3xl">🔑</span>
                </div>
                <p className="text-default-600 font-medium">No Token Found</p>
                <p className="text-sm text-default-500">
                  Set a token above to get started
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Info Card */}
        <Card className="w-full bg-default-50 dark:bg-default-100">
          <CardBody className="space-y-3">
            <h3 className="font-semibold text-sm">ℹ️ Supported Formats</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-default-700">Curl Command:</p>
                <code className="block text-xs bg-default-200 dark:bg-default-300 rounded px-2 py-1 mt-1 font-mono">
                  curl 'url' -H 'authorization: Bearer YOUR_TOKEN'
                </code>
              </div>
              <div>
                <p className="text-sm font-medium text-default-700">Plain Token:</p>
                <code className="block text-xs bg-default-200 dark:bg-default-300 rounded px-2 py-1 mt-1 font-mono">
                  YOUR_JWT_TOKEN
                </code>
              </div>
              <div>
                <p className="text-sm font-medium text-default-700">Bearer Token:</p>
                <code className="block text-xs bg-default-200 dark:bg-default-300 rounded px-2 py-1 mt-1 font-mono">
                  Bearer YOUR_JWT_TOKEN
                </code>
              </div>
            </div>
            <ul className="text-sm text-default-600 space-y-1 list-disc list-inside pt-2 border-t border-default-200">
              <li>Token is stored securely on the server</li>
              <li>Token is automatically extracted from curl commands</li>
              <li>Token information is auto-loaded on page visit</li>
              <li>All requests are secured with nonce authentication</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

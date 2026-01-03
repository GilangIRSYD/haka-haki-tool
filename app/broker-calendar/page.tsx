/**
 * Broker Calendar Server Wrapper
 * Handles dynamic OG meta tags for shared links
 */

import { Metadata } from "next";
import BrokerCalendarClient from "./client-page";

type Props = {
  searchParams: Promise<{ share?: string }>;
};

/**
 * Generate metadata for broker calendar page
 * For shared links, fetches data from backend and generates dynamic OG tags
 */
export async function generateMetadata(
  { searchParams }: Props
): Promise<Metadata> {
  const { share } = await searchParams;

  // Default metadata for non-shared links
  if (!share) {
    return {
      title: "Broker Calendar - Haka-Haki Tools",
      description: "Analyze broker actions in Indonesian stock market",
    };
  }

  try {
    // Generate nonce for server-side fetch
    const nonce = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Fetch share data for OG tags
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-idx.gsphomelab.org';
    const response = await fetch(`${baseUrl}/api/v1/share-link/${share}`, {
      headers: { 'X-Nonce': nonce },
      cache: 'no-store',
    });

    if (response.ok) {
      const result = await response.json();
      const data = result.data;
      const brokers = data.queryParams.broker_code.join(', ');
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://hakahakitools.gsphomelab.org';

      // Generate OG metadata from share data
      const title = `${data.queryParams.symbol} Calendar Analysis 🤘`;
      const description = `View broker action calendar for ${data.queryParams.symbol} from ${data.queryParams.from} to ${data.queryParams.to}. Analyzed by: ${brokers}`;

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `${frontendUrl}/broker-calendar?share=${share}`,
          siteName: 'Hakahaki Tools',
          images: [
            {
              url: '/og-image.png',
              width: 1200,
              height: 630,
            },
          ],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: ['/og-image.png'],
        },
      };
    }
  } catch (error) {
    console.error('Failed to fetch share metadata:', error);
  }

  // Fallback metadata
  return {
    title: "Broker Calendar - Haka-Haki Tools",
    description: "Analyze broker actions in Indonesian stock market",
  };
}

/**
 * Server Component Wrapper
 * Renders the client component with search params
 */
export default async function BrokerCalendarPage({ searchParams }: Props) {
  const params = await searchParams;

  return <BrokerCalendarClient shareSlug={params.share} />;
}

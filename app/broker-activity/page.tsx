/**
 * Broker Activity Server Wrapper
 * Handles metadata for the broker activity page
 */

import { Metadata } from "next";
import BrokerActivityClient from "./client-page";

export const metadata: Metadata = {
  title: "Broker Activity - Haka-Haki Tools",
  description: "Analyze daily stock transactions performed by a selected broker",
};

/**
 * Server Component Wrapper
 * Renders the client component
 */
export default function BrokerActivityPage() {
  return <BrokerActivityClient />;
}

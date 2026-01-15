import { Metadata } from "next";
import BigPlayerMovementClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Big Player Movement - IDX Broker Sum",
  description: "Track significant shareholder movements and trading activities in IDX market",
};

export default function BigPlayerMovementPage() {
  return <BigPlayerMovementClientPage />;
}

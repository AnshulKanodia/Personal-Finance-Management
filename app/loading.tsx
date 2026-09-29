import React from "react";
import { RupeeLoader } from "@/components/RupeeLoader";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <RupeeLoader size="lg" label="Loading RupeePulse..." />
    </div>
  );
}

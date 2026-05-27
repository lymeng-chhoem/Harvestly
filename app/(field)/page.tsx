"use client";

import { CropProblemsSummary } from "./_components/home/CropProblemsSummary";
import { FieldNote } from "./_components/home/FieldNote";
import { HeroBanner } from "./_components/home/HeroBanner";
import { HomeUploadArea } from "./_components/home/HomeUploadArea";
import { HowItWorksPanel } from "./_components/home/HowItWorksPanel";
import { RecentAnalysesSummary } from "./_components/home/RecentAnalysesSummary";
import { useProduct } from "./_components/state/ProductProvider";

export default function HomePage() {
  const { language } = useProduct();

  return (
    <div className="dashboard">
      <HeroBanner language={language} />
      <div className="action-row">
        <HomeUploadArea language={language} />
        <HowItWorksPanel language={language} />
      </div>
      <div className="summary-row">
        <CropProblemsSummary language={language} />
        <RecentAnalysesSummary language={language} />
      </div>
      <FieldNote language={language} />
    </div>
  );
}

import {
  LandingNav,
  HeroSection,
  DecisionFlowSection,
  CapabilitiesSection,
  CommandCenterPreview,
  DecisionReplaySection,
  ScenarioLabSection,
  OptimizerPreviewSection,
  DecisionDNASection,
  WhyDecisionOSSection,
  EnterpriseTrustSection,
  FinalCTASection,
  LandingFooter,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top Fixed Navigation */}
      <LandingNav />

      {/* Main Landing Sections */}
      <main>
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Decision Flow (Monitor -> Investigate -> Replay -> Simulate -> Optimize -> Decide -> Audit) */}
        <DecisionFlowSection />

        {/* 3. Major Capabilities */}
        <CapabilitiesSection />

        {/* 4. Command Center Realistic Interactive Preview */}
        <CommandCenterPreview />

        {/* 5. Decision Replay Differentiator */}
        <DecisionReplaySection />

        {/* 6. Scenario Lab Interactive Sandbox */}
        <ScenarioLabSection />

        {/* 7. Constraint-Aware Pareto Optimization */}
        <OptimizerPreviewSection />

        {/* 8. Traceable Decision DNA Records */}
        <DecisionDNASection />

        {/* 9. Why DecisionOS Comparison (BI vs Analytics vs DecisionOS) */}
        <WhyDecisionOSSection />

        {/* 10. Enterprise Trust Architecture */}
        <EnterpriseTrustSection />

        {/* 11. Final Closing CTA */}
        <FinalCTASection />
      </main>

      {/* Landing Footer */}
      <LandingFooter />
    </div>
  );
}

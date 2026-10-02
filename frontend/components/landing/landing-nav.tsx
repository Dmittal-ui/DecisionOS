"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, ArrowRight, Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/constants";

export function LandingNav() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border/80 shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:bg-primary/90 transition-colors">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-foreground">
                  {APP_CONFIG.name}
                </span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary">
                  ENTERPRISE
                </Badge>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Decision Intelligence OS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7 text-xs font-medium text-muted-foreground">
            <a href="#workflow" className="hover:text-foreground transition-colors">
              Decision Workflow
            </a>
            <a href="#command-center" className="hover:text-foreground transition-colors">
              Command Center
            </a>
            <a href="#replay" className="hover:text-foreground transition-colors">
              Decision Replay
            </a>
            <a href="#scenario-lab" className="hover:text-foreground transition-colors">
              Scenario Lab
            </a>
            <a href="#optimizer" className="hover:text-foreground transition-colors">
              Optimizer
            </a>
            <a href="#decision-dna" className="hover:text-foreground transition-colors">
              Decision DNA
            </a>
            <a href="#why-decision-os" className="hover:text-foreground transition-colors">
              Why DecisionOS
            </a>
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login" className="text-xs">
                Sign In
              </Link>
            </Button>
            <Button size="sm" className="gap-1.5 text-xs shadow-sm" asChild>
              <Link href="/dashboard">
                <span>Command Center</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-border/80 mt-3 space-y-3 bg-card/95 p-4 rounded-lg shadow-lg border">
            <div className="flex flex-col space-y-2 text-sm font-medium">
              <a
                href="#workflow"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1"
              >
                Decision Workflow
              </a>
              <a
                href="#command-center"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1"
              >
                Command Center
              </a>
              <a
                href="#replay"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1"
              >
                Decision Replay
              </a>
              <a
                href="#scenario-lab"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1"
              >
                Scenario Lab
              </a>
              <a
                href="#optimizer"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1"
              >
                Optimizer
              </a>
              <a
                href="#decision-dna"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1"
              >
                Decision DNA
              </a>
              <a
                href="#why-decision-os"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground py-1"
              >
                Why DecisionOS
              </a>
            </div>
            <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild className="w-full justify-center">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="w-full justify-center">
                <Link href="/dashboard">Explore DecisionOS</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

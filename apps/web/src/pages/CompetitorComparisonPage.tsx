import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Footer } from '../components/layout/Footer';
import { useTheme } from '../context/ThemeContext';
import { Check, X, ArrowRight, ShieldCheck, Zap, Sparkles, Building2, ExternalLink } from 'lucide-react';

const COMPARISONS: Record<string, { title: string; subtitle: string; description: string; competitorName: string }> = {
  easycron: {
    title: 'Samast Cron vs EasyCron — 2026 Developer Comparison',
    subtitle: 'Looking for a modern, high-precision alternative to EasyCron?',
    description: 'Compare Samast Cron vs EasyCron on execution precision, pricing, log retention, automated retries, and API developer experience.',
    competitorName: 'EasyCron',
  },
  'cron-job-org': {
    title: 'Samast Cron vs Cron-Job.org — Professional SaaS Comparison',
    subtitle: 'Upgrade from basic free cron tools to production-grade background infrastructure.',
    description: 'Compare Samast Cron vs Cron-Job.org. Learn why SaaS engineering teams switch to Samast Cron for 5-second precision, Pushover alerts, and status pages.',
    competitorName: 'Cron-Job.org',
  },
  'aws-eventbridge': {
    title: 'Samast Cron vs AWS EventBridge — Simple vs Complex Cloud Scheduler',
    subtitle: 'Skip complex AWS IAM policies, cloud watch logs, and VPC configuration.',
    description: 'Compare Samast Cron vs AWS EventBridge. Schedule HTTP webhooks in 10 seconds without AWS IAM, Lambda wrappers, or complex CloudWatch rules.',
    competitorName: 'AWS EventBridge',
  },
};

export function CompetitorComparisonPage() {
  const { competitor = 'easycron' } = useParams<{ competitor: string }>();
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const info = COMPARISONS[competitor] || COMPARISONS.easycron;

  const features = [
    { name: 'Execution Precision', samast: 'Down to 5-Second Precision', comp: '1-Minute to 5-Minute' },
    { name: 'Automated Retries & Jitter', samast: 'Smart Exponential Backoff', comp: 'Basic / Paid Add-on' },
    { name: 'Full HTTP Response Bodies', samast: 'Up to 90 Days Retention', comp: 'Truncated / 7 Days' },
    { name: 'Multi-Channel Alert Dispatch', samast: 'Pushover, Slack, Discord, Email, Webhooks', comp: 'Email Only' },
    { name: 'Public Uptime Status Pages', samast: 'Included with Custom Domains', comp: 'Not Supported' },
    { name: 'GST & Corporate Invoicing', samast: 'Included (ITC & Tax Invoices)', comp: 'Standard Credit Card' },
    { name: 'Setup Time', samast: '10 Seconds (No Code Required)', comp: 'Complex Config' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white flex flex-col justify-between transition-colors">
      <SEOHead
        title={info.title}
        description={info.description}
        canonicalUrl={`https://cron.samast.pro/vs/${competitor}`}
        keywords={`samast cron vs ${info.competitorName}, ${info.competitorName} alternative, best scheduled http request service, cron job monitoring`}
      />

      <PublicHeader />

      <main className="pt-12 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Developer Comparison Hub • 2026 Edition</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {info.title}
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {info.subtitle}
          </p>
        </div>

        {/* Feature Comparison Table */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden shadow-xl dark:shadow-2xl">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Feature &amp; Capability Matrix</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Updated September 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-950/80 text-zinc-600 dark:text-zinc-400 uppercase font-mono text-[11px] border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-4 px-6">Capability / Feature</th>
                  <th className="py-4 px-6 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5">Samast Cron</th>
                  <th className="py-4 px-6 text-zinc-600 dark:text-zinc-400">{info.competitorName}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-medium">
                {features.map((feat, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4 px-6 text-zinc-900 dark:text-zinc-200 font-semibold">{feat.name}</td>
                    <td className="py-4 px-6 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat.samast}</span>
                    </td>
                    <td className="py-4 px-6 text-zinc-600 dark:text-zinc-400">{feat.comp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Card */}
        <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-center space-y-4 shadow-xl">
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
            Ready to upgrade your background job reliability?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Start with 5 free active scheduled jobs forever. No credit card required. Upgrades start at just ₹349/month ($19/mo globally).
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl btn-accent font-bold text-xs inline-flex items-center gap-2 shadow-lg hover:opacity-95 transition-opacity"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-xs"
            >
              View Pricing Tiers
            </Link>
          </div>
        </div>
      </main>

      <Footer dark={dark} />
    </div>
  );
}

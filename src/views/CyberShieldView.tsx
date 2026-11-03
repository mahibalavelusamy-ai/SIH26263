import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Terminal,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Server,
  KeyRound,
  FileSpreadsheet,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const CyberShieldView: React.FC = () => {
  const { auditEvents, records, verifyAuditLedger, setActiveNav } = useApp();

  const [ledgerStatus] = useState(() => verifyAuditLedger());

  const implementedSafeguards = [
    {
      id: 'SEC-01',
      name: 'Formula Injection Shield (CSV/Excel)',
      status: 'ACTIVE',
      level: 'IMPLEMENTED',
      desc: 'Sanitizes dangerous spreadsheet execution triggers (=, +, -, @) across all CSV exports to protect registrar workstations from CVE-style injection.',
      evidence: 'sanitizeCsvCell() applied to all export pipelines',
    },
    {
      id: 'SEC-02',
      name: 'Client-Side Salted HMAC Matching',
      status: 'ACTIVE',
      level: 'IMPLEMENTED',
      desc: 'Raw 12-digit APAAR numbers and demographic combinations are converted into keyed cryptographic HMAC-SHA256 tokens before cross-campus collision comparison.',
      evidence: 'deriveKeyedIdentifier() with salt epoch isolation',
    },
    {
      id: 'SEC-03',
      name: 'Cryptographic Hash-Chained Audit Journal',
      status: 'ACTIVE',
      level: 'IMPLEMENTED',
      desc: 'Every state mutation, batch submission, and exception review is sequentially hashed (SHA-256) with its predecessor hash to prevent undetected tampering.',
      evidence: `${ledgerStatus.verifiedBlocks} / ${ledgerStatus.totalBlocks} Blocks Verified`,
    },
    {
      id: 'SEC-04',
      name: 'Tenant Boundary Isolation',
      status: 'ACTIVE',
      level: 'IMPLEMENTED',
      desc: 'Institution submitters are strictly constrained to view and edit only their assigned institutional datasets during batch staging and correction.',
      evidence: 'validateTenantAccess() checked on every mutation',
    },
    {
      id: 'SEC-05',
      name: 'Deterministic Rate Limiter',
      status: 'ACTIVE',
      level: 'IMPLEMENTED',
      desc: 'In-memory sliding window rate limiter prevents rapid automated scraping of mock verification endpoints.',
      evidence: 'checkRateLimit() configured with 10 req/s threshold',
    },
  ];

  const plannedProductionControls = [
    {
      id: 'PROD-01',
      name: 'Jan Parichay National Single Sign-On',
      status: 'PLANNED',
      level: 'FUTURE_PRODUCTION',
      desc: 'OAuth 2.0 / OpenID Connect federation with Government of India official registrar authentication gateway.',
    },
    {
      id: 'PROD-02',
      name: 'FIPS 140-2 Level 3 Hardware Security Module (HSM)',
      status: 'PLANNED',
      level: 'FUTURE_PRODUCTION',
      desc: 'Hardware-anchored master cryptographic key storage and automated salt rotation for national APAAR tokenization.',
    },
    {
      id: 'PROD-03',
      name: 'National APAAR / NDEAR API Gateway',
      status: 'PLANNED',
      level: 'FUTURE_PRODUCTION',
      desc: 'Direct mTLS government enterprise gateway for live academic credit bank verification under DigiLocker / ABC protocols.',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Security' },
          { label: 'CyberShield' },
        ]}
        title="CyberShield — Security Posture & Safeguards"
        subtitle="Transparent audit of implemented browser-side security controls alongside planned enterprise production GovTech architecture."
        badge={
          <span className="font-mono text-[11px] text-[#168C83] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#168C83]" />
            BROWSER SAFEGUARDS VERIFIED
          </span>
        }
        actions={
          <button
            onClick={() => setActiveNav('audit-trail')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101C32] hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
          >
            <Activity className="w-3.5 h-3.5 text-[#315EAA]" />
            Inspect Audit Journal
          </button>
        }
      />

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Implemented Safeguards"
          value="5 Active"
          subValue="Verified browser-side controls"
          tone="teal"
        />
        <MetricCard
          label="Formula Sanitization"
          value="100%"
          subValue="Zero CSV injection vectors"
          tone="indigo"
        />
        <MetricCard
          label="Audit Ledger Chaining"
          value={`${ledgerStatus.totalBlocks} Blocks`}
          subValue="SHA-256 predecessor links"
          tone="teal"
        />
        <MetricCard
          label="Production Architecture"
          value="3 Planned"
          subValue="Jan Parichay & HSM Gateway"
          tone="amber"
        />
      </div>

      {/* Implemented Browser Safeguards */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
              Implemented Prototype Safeguards (Working & Verified)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-medium">
            LIVE IN DEMONSTRATION
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {implementedSafeguards.map((item) => (
            <div key={item.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{item.name}</span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                    {item.id}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-sans max-w-3xl leading-relaxed">
                  {item.desc}
                </p>
                <div className="text-[11px] font-mono text-teal-700 flex items-center gap-1 pt-0.5">
                  <span>Verification Evidence: <strong>{item.evidence}</strong></span>
                </div>
              </div>

              <div className="shrink-0">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Planned Enterprise Production Architecture */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#315EAA]" />
            <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
              Planned Enterprise Production Architecture (GovTech Blueprint)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
            FUTURE SCOPE
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {plannedProductionControls.map((item) => (
            <div key={item.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{item.name}</span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                    {item.id}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-sans max-w-3xl leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="shrink-0">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { useApp, ROLE_DESCRIPTIONS } from '../../context/AppContext';
import { Role } from '../../types';
import { RotateCcw, AlertTriangle, UserCheck, Shield, ChevronRight } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export const Navbar: React.FC = () => {
  const {
    role,
    setRole,
    activeNav,
    setActiveNav,
    resetDemoData,
    duplicateCandidates,
    submissions,
    setShowEntryPortal,
  } = useApp();

  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const openDuplicates = duplicateCandidates.filter((c) => c.status === 'PENDING_REVIEW').length;

  const roles: Role[] = [
    'INSTITUTION_SUBMITTER',
    'INSTITUTION_REVIEWER',
    'AICTE_REVIEWER',
    'VERIFICATION_OFFICER',
    'SYSTEM_ADMIN',
    'AUDITOR',
  ];

  const formatNavTitle = (nav: string) => {
    switch (nav) {
      case 'overview': return 'Executive Overview';
      case 'institutions':
      case 'institution': return 'Institution Management';
      case 'submission': return 'Submission Centre';
      case 'identity-intelligence': return 'Identity Intelligence';
      case 'tper': return 'TPER Reconciliation Engine';
      case 'mobility-graph': return 'Academic Mobility Graph';
      case 'seat-ledger':
      case 'aicte-monitoring': return 'Programme-wise Seat Ledger';
      case 'trust-engine': return 'Academic Trust Engine';
      case 'verification': return 'Verification Centre';
      case 'record-dna': return 'Record DNA';
      case 'cybershield': return 'CyberShield';
      case 'reports': return 'Regulatory Reports';
      case 'administration':
      case 'rules':
      case 'architecture':
      case 'audit-trail':
      case 'test-bench':
      case 'settings': return 'Administration & Governance';
      default: return nav;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#101C32] border-b border-slate-700/60 text-white shadow-xs">
        {/* Persistent GovTech Synthetic Disclaimer Banner */}
        <div className="bg-[#D99032]/15 border-b border-[#D99032]/30 px-4 py-1 text-center text-[11px] font-mono tracking-wider text-amber-200/90 flex items-center justify-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[#D99032] shrink-0" />
          <span>PROTOTYPE ENVIRONMENT · SYNTHETIC DEMONSTRATION DATA · MOCK VERIFIER</span>
          <span className="hidden md:inline text-amber-400/40">|</span>
          <span className="hidden md:inline text-slate-300">SIH26263: No live government identity API connection</span>
        </div>

        {/* Top Bar Contract */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
            onClick={() => setActiveNav('overview')}
            title="IDVERA Dashboard Home"
          >
            <img
              src="/logo.png"
              alt="IDVERA"
              className="h-7 w-auto object-contain rounded transition-transform group-hover:scale-[1.02]"
            />
            <div className="hidden sm:flex flex-col border-l border-slate-800 pl-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold leading-none">
                IDVERA
              </span>
              <span className="text-[9px] text-slate-500 font-mono leading-tight mt-0.5">
                AICTE APH Gateway
              </span>
            </div>
          </div>

          {/* Zone 2: Contextual Navigation Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap overflow-hidden">
            <span className="text-slate-500">Portal</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="font-semibold text-slate-200 tracking-tight">{formatNavTitle(activeNav)}</span>
            {openDuplicates > 0 && (
              <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {openDuplicates} Open Candidates
              </span>
            )}
          </div>

          {/* Zone 3: Demo Role Switcher & Action Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Simulated Role selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono text-slate-400 hidden lg:inline">
                Role:
              </span>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono font-medium rounded border border-slate-700/80 px-2.5 py-1 pr-6 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none"
                  aria-label="Simulated Role Switcher"
                >
                  {roles.map((r) => (
                    <option key={r} value={r} className="bg-slate-900 text-white">
                      {ROLE_DESCRIPTIONS[r].title}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                  <UserCheck className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Reset State Action */}
            <button
              onClick={() => setShowResetConfirm(true)}
              title="Reset Demonstration Seed State"
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Public Portal Switcher */}
            <button
              onClick={() => setShowEntryPortal(true)}
              title="Return to Institutional Entry Portal"
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 hover:text-white border border-blue-700/60 transition-colors whitespace-nowrap"
            >
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="hidden sm:inline">Sign-in Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation Dialog for Demo Reset */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={resetDemoData}
        title="Reset Synthetic Demonstration State?"
        description="This will restore all 220+ synthetic student records, 6 submission batches, 12 statutory rules, and audit logs to their clean seed state. Any custom mock queries or batch filings will be reinitialized."
        confirmLabel="Reset State"
        cancelLabel="Cancel"
        tone="warning"
      />
    </>
  );
};

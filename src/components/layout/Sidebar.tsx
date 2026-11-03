import React from 'react';
import { useApp, ROLE_DESCRIPTIONS } from '../../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  UploadCloud,
  Fingerprint,
  GitCompare,
  GitFork,
  BarChart3,
  Award,
  CheckCircle2,
  Dna,
  ShieldCheck,
  FileSpreadsheet,
  Sliders,
  ChevronRight,
  Shield,
  ExternalLink,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  category: 'CORE' | 'GOVERNANCE' | 'SYSTEM';
}

export const Sidebar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    duplicateCandidates,
    submissions,
    intakeLimits,
    records,
    role,
    setShowEntryPortal,
  } = useApp();

  const openDuplicates = duplicateCandidates.filter((c) => c.status === 'PENDING_REVIEW').length;

  // Calculate programmes exceeding regular intake
  let intakeExcessCount = 0;
  intakeLimits.forEach((limit) => {
    const regularEnrolments = records.filter(
      (r) =>
        r.institutionId === limit.institutionId &&
        r.programmeCode === limit.programmeCode &&
        r.academicYear === limit.academicYear &&
        !r.supernumeraryFlag &&
        r.enrolmentStatus === 'ACTIVE' &&
        r.rowOutcome !== 'REJECTED'
    );
    if (regularEnrolments.length > limit.approvedRegularIntake) {
      intakeExcessCount++;
    }
  });

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      category: 'CORE',
    },
    {
      id: 'institutions',
      label: 'Institutions',
      icon: Building2,
      category: 'CORE',
    },
    {
      id: 'submission',
      label: 'Submission Centre',
      icon: UploadCloud,
      category: 'CORE',
    },
    {
      id: 'identity-intelligence',
      label: 'Identity Intelligence',
      icon: Fingerprint,
      category: 'CORE',
    },
    {
      id: 'tper',
      label: 'TPER Reconciliation',
      icon: GitCompare,
      badge: openDuplicates > 0 ? openDuplicates : undefined,
      badgeColor: 'bg-[#315EAA]/20 text-blue-300 border border-[#315EAA]/40',
      category: 'CORE',
    },
    {
      id: 'mobility-graph',
      label: 'Academic Mobility Graph',
      icon: GitFork,
      category: 'CORE',
    },
    {
      id: 'seat-ledger',
      label: 'Programme-wise Seat Ledger',
      icon: BarChart3,
      badge: intakeExcessCount > 0 ? `${intakeExcessCount} Breaches` : undefined,
      badgeColor: 'bg-rose-950/80 text-rose-300 border border-rose-700/60',
      category: 'GOVERNANCE',
    },
    {
      id: 'trust-engine',
      label: 'Academic Trust Engine',
      icon: Award,
      category: 'GOVERNANCE',
    },
    {
      id: 'verification',
      label: 'Verification Centre',
      icon: CheckCircle2,
      category: 'GOVERNANCE',
    },
    {
      id: 'record-dna',
      label: 'Record DNA',
      icon: Dna,
      category: 'GOVERNANCE',
    },
    {
      id: 'cybershield',
      label: 'CyberShield',
      icon: ShieldCheck,
      category: 'SYSTEM',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileSpreadsheet,
      category: 'SYSTEM',
    },
    {
      id: 'administration',
      label: 'Administration',
      icon: Sliders,
      category: 'SYSTEM',
    },
  ];

  const categories = [
    { key: 'CORE', title: 'Intelligence & Operations' },
    { key: 'GOVERNANCE', title: 'Regulatory Oversight' },
    { key: 'SYSTEM', title: 'Platform Security & Gov' },
  ];

  return (
    <aside className="w-60 bg-[#101C32] text-slate-300 flex flex-col shrink-0 border-r border-slate-700/60 min-h-[calc(100vh-48px)]">
      {/* Current Active Role Context Pill & Portal Shortcut */}
      <div className="p-3 border-b border-slate-700/60 bg-[#0B1324]">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
            Simulated Context
          </span>
          <button
            onClick={() => setShowEntryPortal(true)}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-mono flex items-center gap-0.5 hover:underline cursor-pointer"
            title="Switch Persona / Portal Sign-In"
          >
            <span>Portal Login</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
        <div className="text-xs font-semibold text-white mt-1 truncate tracking-tight">
          {ROLE_DESCRIPTIONS[role].title}
        </div>
        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-sans">
          {ROLE_DESCRIPTIONS[role].subtitle}
        </div>
      </div>

      {/* Navigation List grouped by GovTech category */}
      <nav className="flex-1 px-2 py-3 space-y-3.5 overflow-y-auto">
        {categories.map((cat) => {
          const items = navItems.filter((item) => item.category === cat.key);
          return (
            <div key={cat.key}>
              <div className="px-2 pb-1 text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                {cat.title}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  // Handle aliases e.g. 'institution' -> 'institutions', 'aicte-monitoring' -> 'seat-ledger'
                  const isActive =
                    activeNav === item.id ||
                    (item.id === 'institutions' && activeNav === 'institution') ||
                    (item.id === 'seat-ledger' && activeNav === 'aicte-monitoring') ||
                    (item.id === 'administration' && ['rules', 'architecture', 'audit-trail', 'test-bench', 'settings'].includes(activeNav));

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveNav(item.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-slate-800/90 text-white font-semibold shadow-2xs border-l-2 border-[#315EAA]'
                            : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#315EAA]' : 'text-slate-400'}`} />
                          <span className="truncate tracking-tight">{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                              isActive ? 'bg-[#315EAA]/40 text-blue-100 border-[#315EAA]/80' : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : isActive ? (
                          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Subtitle & Version Footer */}
      <div className="p-2.5 border-t border-slate-700/60 text-[10px] text-slate-400 bg-[#0B1324] font-mono">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">SPEC: AICTE-TPER</span>
          <span className="text-blue-400 font-semibold">v1.2.0</span>
        </div>
        <div className="text-[9px] text-slate-400 truncate mt-0.5">
          SIH26263 Enterprise Sandbox
        </div>
      </div>
    </aside>
  );
};

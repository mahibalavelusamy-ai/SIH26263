import React from 'react';
import { useApp, ROLE_DESCRIPTIONS } from '../../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  UploadCloud,
  GitCompare,
  AlertOctagon,
  BarChart3,
  CheckCircle2,
  Sliders,
  Layers,
  History,
  Terminal,
  Settings,
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
  category: 'RECONCILIATION' | 'REGULATORY' | 'SYSTEM';
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
      category: 'RECONCILIATION',
    },
    {
      id: 'institution',
      label: 'Institution Portal',
      icon: Building2,
      category: 'RECONCILIATION',
    },
    {
      id: 'submission',
      label: 'Submission Centre',
      icon: UploadCloud,
      category: 'RECONCILIATION',
    },
    {
      id: 'tper',
      label: 'TPER Reconciliation',
      icon: GitCompare,
      badge: openDuplicates > 0 ? openDuplicates : undefined,
      badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
      category: 'RECONCILIATION',
    },
    {
      id: 'exception-review',
      label: 'Exception Review',
      icon: AlertOctagon,
      badge: openDuplicates > 0 ? openDuplicates : undefined,
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
      category: 'REGULATORY',
    },
    {
      id: 'aicte-monitoring',
      label: 'AICTE Monitoring',
      icon: BarChart3,
      badge: intakeExcessCount > 0 ? `${intakeExcessCount} Breaches` : undefined,
      badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
      category: 'REGULATORY',
    },
    {
      id: 'verification',
      label: 'Verification Centre',
      icon: CheckCircle2,
      category: 'REGULATORY',
    },
    {
      id: 'rules',
      label: 'Rules & Engine',
      icon: Sliders,
      category: 'SYSTEM',
    },
    {
      id: 'architecture',
      label: 'Architecture',
      icon: Layers,
      category: 'SYSTEM',
    },
    {
      id: 'audit-trail',
      label: 'Audit Trail',
      icon: History,
      category: 'SYSTEM',
    },
    {
      id: 'test-bench',
      label: 'Test Bench',
      icon: Terminal,
      category: 'SYSTEM',
    },
    {
      id: 'settings',
      label: 'Settings & State',
      icon: Settings,
      category: 'SYSTEM',
    },
  ];

  const categories = [
    { key: 'RECONCILIATION', title: 'Institutional Ingestion' },
    { key: 'REGULATORY', title: 'Regulatory Oversight' },
    { key: 'SYSTEM', title: 'Platform Governance' },
  ];

  return (
    <aside className="w-56 lg:w-60 bg-[#0B0F17] text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 min-h-[calc(100vh-48px)]">
      {/* Current Active Role Context Pill & Portal Shortcut */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/60">
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
                  const isActive = activeNav === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveNav(item.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-slate-800 text-white font-semibold shadow-2xs border-l-2 border-blue-500'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="truncate tracking-tight">{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                              isActive ? 'bg-blue-900/60 text-blue-200 border-blue-700/60' : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : isActive ? (
                          <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
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
      <div className="p-2.5 border-t border-slate-800/80 text-[10px] text-slate-400 bg-slate-950/40 font-mono">
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

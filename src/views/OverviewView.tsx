import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  TrendingUp,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  GitCompare,
  AlertOctagon,
  Sparkles,
  Info,
  History,
  Shield,
  ShieldCheck,
  Clock,
  Dna,
  Lock,
  Search,
  Layers,
  Award,
  ChevronRight,
  Scale,
  Activity,
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const {
    institutions,
    programmes,
    records,
    submissions,
    duplicateCandidates,
    auditEvents,
    intakeLimits,
    selectedAcademicYear,
    setSelectedAcademicYear,
    setActiveNav,
  } = useApp();

  // Local filter states
  const [filterInstitution, setFilterInstitution] = useState<string>('ALL');
  const [filterProgramme, setFilterProgramme] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [quotaBreachOnly, setQuotaBreachOnly] = useState<boolean>(false);
  const [activeInnovationTab, setActiveInnovationTab] = useState<'TPER' | 'SEAT_LEDGER' | 'TRUST' | 'RECORD_DNA' | 'CYBERSHIELD'>('TPER');

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchYear = !selectedAcademicYear || r.academicYear === selectedAcademicYear;
      const matchInst = filterInstitution === 'ALL' || r.institutionId === filterInstitution;
      const matchProg = filterProgramme === 'ALL' || r.programmeCode === filterProgramme;
      const matchStat = filterStatus === 'ALL' || r.rowOutcome === filterStatus;
      return matchYear && matchInst && matchProg && matchStat;
    });
  }, [records, selectedAcademicYear, filterInstitution, filterProgramme, filterStatus]);

  // Derived KPI metrics
  const totalRows = filteredRecords.length;
  const acceptedRows = filteredRecords.filter((r) => r.rowOutcome === 'ACCEPTED').length;
  const flaggedRows = filteredRecords.filter((r) => r.rowOutcome === 'FLAGGED').length;
  const rejectedRows = filteredRecords.filter((r) => r.rowOutcome === 'REJECTED').length;

  const relevantInstitutions = filterInstitution === 'ALL'
    ? institutions
    : institutions.filter((i) => i.id === filterInstitution);

  const relevantSubmissions = submissions.filter((s) => {
    const matchYear = !selectedAcademicYear || s.academicYear === selectedAcademicYear;
    const matchInst = filterInstitution === 'ALL' || s.institutionId === filterInstitution;
    return matchYear && matchInst;
  });

  const openDuplicates = duplicateCandidates.filter((c) => c.status === 'PENDING_REVIEW').length;
  const resolvedTransfers = duplicateCandidates.filter((c) => c.status === 'LEGITIMATE_TRANSFER').length;
  const confirmedDuplicates = duplicateCandidates.filter((c) => c.status === 'CONFIRMED_DUPLICATE').length;

  // Calculate intake discrepancies on active regular enrolments vs supernumerary quotas
  const intakeComparison = useMemo(() => {
    return intakeLimits
      .filter((limit) => {
        const matchYear = !selectedAcademicYear || limit.academicYear === selectedAcademicYear;
        const matchInst = filterInstitution === 'ALL' || limit.institutionId === filterInstitution;
        const matchProg = filterProgramme === 'ALL' || limit.programmeCode === filterProgramme;
        return matchYear && matchInst && matchProg;
      })
      .map((limit) => {
        const inst = institutions.find((i) => i.id === limit.institutionId);
        const prog = programmes.find((p) => p.code === limit.programmeCode);

        // Count non-rejected active regular enrolments
        const regularEnrolments = records.filter(
          (r) =>
            r.institutionId === limit.institutionId &&
            r.programmeCode === limit.programmeCode &&
            r.academicYear === limit.academicYear &&
            !r.supernumeraryFlag &&
            r.enrolmentStatus === 'ACTIVE' &&
            r.rowOutcome !== 'REJECTED'
        );

        // Count supernumerary enrolments (TFW, EWS, PMSSS, etc.)
        const superEnrolments = records.filter(
          (r) =>
            r.institutionId === limit.institutionId &&
            r.programmeCode === limit.programmeCode &&
            r.academicYear === limit.academicYear &&
            r.supernumeraryFlag &&
            r.enrolmentStatus === 'ACTIVE' &&
            r.rowOutcome !== 'REJECTED'
        );

        const regularCount = regularEnrolments.length;
        const variance = regularCount - limit.approvedRegularIntake;
        const isExcess = variance > 0;

        const totalSuperCap = limit.supernumeraryLimits
          ? Object.values(limit.supernumeraryLimits).reduce((a, b) => a + b, 0)
          : Math.round(limit.approvedRegularIntake * 0.15);
        const approvedSuperCap = totalSuperCap || Math.round(limit.approvedRegularIntake * 0.15);

        return {
          limitId: limit.id,
          institutionId: limit.institutionId,
          institutionCode: inst?.code || limit.institutionId,
          institutionName: inst?.name || limit.institutionId,
          programmeCode: limit.programmeCode,
          programmeName: prog?.name || limit.programmeCode,
          approvedRegularIntake: limit.approvedRegularIntake,
          countedRegular: regularCount,
          approvedSuperCap,
          supernumeraryCount: superEnrolments.length,
          totalEnrolment: regularCount + superEnrolments.length,
          variance,
          isExcess,
        };
      });
  }, [intakeLimits, records, institutions, programmes, selectedAcademicYear, filterInstitution, filterProgramme]);

  const excessProgrammeCount = intakeComparison.filter((p) => p.isExcess).length;

  const filteredIntakeList = useMemo(() => {
    if (quotaBreachOnly) {
      return intakeComparison.filter((p) => p.isExcess);
    }
    return intakeComparison;
  }, [intakeComparison, quotaBreachOnly]);

  // Total regular approved vs enrolled
  const totalApprovedRegular = intakeComparison.reduce((acc, curr) => acc + curr.approvedRegularIntake, 0);
  const totalCountedRegular = intakeComparison.reduce((acc, curr) => acc + curr.countedRegular, 0);

  // Supernumerary Quota Aggregates
  const supernumeraryStats = useMemo(() => {
    const tfwEnrolled = records.filter((r) => r.supernumeraryFlag && (r.supernumeraryCategory === 'TFW' || r.seatCategory === 'TFW') && r.rowOutcome !== 'REJECTED').length;
    const ewsEnrolled = records.filter((r) => r.supernumeraryFlag && (r.supernumeraryCategory === 'EWS' || r.seatCategory === 'EWS') && r.rowOutcome !== 'REJECTED').length;
    const pmsssEnrolled = records.filter((r) => r.supernumeraryFlag && r.supernumeraryCategory === 'PMSSS' && r.rowOutcome !== 'REJECTED').length;
    const otherEnrolled = records.filter((r) => r.supernumeraryFlag && !['TFW', 'EWS', 'PMSSS'].includes(r.supernumeraryCategory || '') && r.rowOutcome !== 'REJECTED').length;

    let tfwCap = 0;
    let ewsCap = 0;
    intakeLimits.forEach((l) => {
      if (l.supernumeraryLimits) {
        tfwCap += l.supernumeraryLimits.tfw || 0;
        ewsCap += l.supernumeraryLimits.ews || 0;
      }
    });

    return {
      tfwEnrolled,
      tfwCap,
      ewsEnrolled,
      ewsCap,
      pmsssEnrolled,
      otherEnrolled,
      totalSuperEnrolled: tfwEnrolled + ewsEnrolled + pmsssEnrolled + otherEnrolled,
    };
  }, [records, intakeLimits]);

  // Primary statutory pipeline stages (6 steps)
  const journeyWorkflow = [
    {
      step: '01',
      title: 'Batch Ingestion',
      subtitle: 'RFC 4180 CSV / Excel',
      desc: 'Sanitised upload with quote-protection, UTF-8 normalization, and formula injection guard.',
      metric: `${relevantSubmissions.length} Batches Ingested`,
      targetNav: 'submission',
      tag: 'INGEST',
    },
    {
      step: '02',
      title: 'ERP Auto-Mapping',
      subtitle: 'Canonical Schema Alignment',
      desc: 'Automatic fuzzy matching of campus field names with live preview of student reference tokens.',
      metric: '13 Standard Fields',
      targetNav: 'submission',
      tag: 'SCHEMA',
    },
    {
      step: '03',
      title: 'Statutory Validation',
      subtitle: '12 Rules Engine (V-01–V-12)',
      desc: 'Deterministic evaluation for identity validity, APAAR length, age ceilings, and calendar cutoffs.',
      metric: `${acceptedRows} Certified / ${rejectedRows} Blocked`,
      targetNav: 'rules',
      tag: 'RULES',
    },
    {
      step: '04',
      title: 'TPER Reconciliation',
      subtitle: 'Temporal Cross-Matching',
      desc: 'Pseudonymized HMAC matching and temporal interval algebra detect dual active enrolments.',
      metric: `${openDuplicates} Candidates Detected`,
      targetNav: 'tper',
      tag: 'TPER',
    },
    {
      step: '05',
      title: 'Human Adjudication',
      subtitle: 'Dispute & Review Desk',
      desc: 'Regulatory officers verify transfer NOCs, de-enrolment receipts, and log mandatory findings.',
      metric: `${openDuplicates} Pending Review`,
      targetNav: 'exception-review',
      tag: 'REVIEW',
    },
    {
      step: '06',
      title: 'Tri-State Verification',
      subtitle: 'Minimum-Disclosure API',
      desc: 'Privacy-safe verification queries return VERIFIED / NOT_VERIFIED / UNABLE_TO_VERIFY.',
      metric: '3 Tri-State Outcomes',
      targetNav: 'verification',
      tag: 'VERIFY',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Editorial Page Header & Global Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-[#101C32] tracking-tight font-heading">
              Executive Enrolment & Regulatory Reconciliation
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 text-[#315EAA] border border-blue-200">
              AICTE Oversight & Academic Integrity
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-50 text-[#168C83] border border-teal-200 font-medium">
              LIVE SYNTHETIC RECONCILIATION
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Cross-institutional enrolment reconciliation, mathematical seat quota audits, and privacy-preserving student identity resolution.
          </p>
        </div>

        {/* Global Multi-Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 px-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Filters:</span>
          </div>

          {/* Academic Session */}
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-[#315EAA] cursor-pointer"
          >
            <option value="2026-27">AY 2026-27</option>
            <option value="2025-26">AY 2025-26</option>
          </select>

          {/* Institution Selector */}
          <select
            value={filterInstitution}
            onChange={(e) => setFilterInstitution(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#315EAA] max-w-[170px] truncate cursor-pointer font-medium"
          >
            <option value="ALL">All Campuses ({institutions.length})</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} — {i.name}
              </option>
            ))}
          </select>

          {/* Programme Selector */}
          <select
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#315EAA] cursor-pointer font-medium"
          >
            <option value="ALL">All Programmes</option>
            {programmes.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code}
              </option>
            ))}
          </select>

          {/* Row Validation Outcome Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#315EAA] cursor-pointer font-medium"
          >
            <option value="ALL">All Outcomes</option>
            <option value="ACCEPTED">Accepted (Certified)</option>
            <option value="FLAGGED">Flagged (Under Review)</option>
            <option value="REJECTED">Rejected (Blocking Failures)</option>
          </select>
        </div>
      </div>

      {/* COMPOSITE REGULATORY LEDGER (Replaces 8 generic small cards with 3 editorial composite panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Composite Panel 1: Enrolment Validation & Intake Dossier */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-[#168C83]" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                    Enrolment Validation Dossier
                  </h3>
                  <div className="text-sm font-bold text-[#101C32]">Statutory Row Certification</div>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-[#168C83] border border-teal-200">
                {totalRows > 0 ? `${Math.round((acceptedRows / totalRows) * 100)}% Passing` : '0%'}
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold font-mono text-[#101C32] tabular-nums tracking-tight">
                  {totalRows}
                </span>
                <span className="text-xs text-slate-500 font-sans ml-2">Total Filed Records</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Across {relevantInstitutions.length} Campuses
              </span>
            </div>

            {/* Multi-segment Proportion Meter */}
            <div className="mt-4 space-y-2">
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${totalRows > 0 ? (acceptedRows / totalRows) * 100 : 0}%` }}
                  className="bg-[#168C83] h-full transition-all"
                  title={`Accepted: ${acceptedRows}`}
                />
                <div
                  style={{ width: `${totalRows > 0 ? (flaggedRows / totalRows) * 100 : 0}%` }}
                  className="bg-[#D99032] h-full transition-all"
                  title={`Flagged: ${flaggedRows}`}
                />
                <div
                  style={{ width: `${totalRows > 0 ? (rejectedRows / totalRows) * 100 : 0}%` }}
                  className="bg-[#C94C4C] h-full transition-all"
                  title={`Rejected: ${rejectedRows}`}
                />
              </div>

              {/* Breakdown Row */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div
                  onClick={() => setFilterStatus(filterStatus === 'ACCEPTED' ? 'ALL' : 'ACCEPTED')}
                  className="p-2 rounded bg-teal-50/60 border border-teal-100 cursor-pointer hover:bg-teal-50 transition-colors"
                >
                  <div className="flex items-center gap-1 text-[10px] font-bold font-mono text-[#168C83]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>VALIDATED</span>
                  </div>
                  <div className="mt-1 font-mono text-base font-bold text-teal-900">{acceptedRows}</div>
                  <div className="text-[10px] text-teal-700 font-mono">Bona fide</div>
                </div>

                <div
                  onClick={() => setFilterStatus(filterStatus === 'FLAGGED' ? 'ALL' : 'FLAGGED')}
                  className="p-2 rounded bg-amber-50/60 border border-amber-100 cursor-pointer hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center gap-1 text-[10px] font-bold font-mono text-[#D99032]">
                    <AlertTriangle className="w-3 h-3" />
                    <span>FLAGGED</span>
                  </div>
                  <div className="mt-1 font-mono text-base font-bold text-amber-900">{flaggedRows}</div>
                  <div className="text-[10px] text-amber-700 font-mono">Warnings</div>
                </div>

                <div
                  onClick={() => setFilterStatus(filterStatus === 'REJECTED' ? 'ALL' : 'REJECTED')}
                  className="p-2 rounded bg-red-50/60 border border-red-100 cursor-pointer hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center gap-1 text-[10px] font-bold font-mono text-[#C94C4C]">
                    <XCircle className="w-3 h-3" />
                    <span>REJECTED</span>
                  </div>
                  <div className="mt-1 font-mono text-base font-bold text-red-900">{rejectedRows}</div>
                  <div className="text-[10px] text-red-700 font-mono">Blocking</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-mono">{relevantSubmissions.length} Batches Ingested</span>
            <button
              onClick={() => setActiveNav('submission')}
              className="font-semibold text-[#315EAA] hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Submission Centre <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Composite Panel 2: TPER Cross-Campus Collision & Mobility Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <GitCompare className="w-4 h-4 text-[#315EAA]" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                    TPER Collision Matrix
                  </h3>
                  <div className="text-sm font-bold text-[#101C32]">Cross-Campus Dual Adjudication</div>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#315EAA] border border-blue-200">
                {duplicateCandidates.length} Detected
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold font-mono text-[#101C32] tabular-nums tracking-tight">
                  {openDuplicates}
                </span>
                <span className="text-xs text-slate-500 font-sans ml-2">Pending Human Adjudication</span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-[#D99032] border border-amber-200 font-bold">
                Action Required
              </span>
            </div>

            {/* Candidate Breakdown */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Pending</span>
                <span className="font-mono text-base font-bold text-amber-700">{openDuplicates}</span>
                <span className="text-[10px] text-slate-400 block font-mono">In Queue</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Legitimate</span>
                <span className="font-mono text-base font-bold text-teal-700">{resolvedTransfers}</span>
                <span className="text-[10px] text-slate-400 block font-mono">Transfer NOC</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Duplicate</span>
                <span className="font-mono text-base font-bold text-red-700">{confirmedDuplicates}</span>
                <span className="text-[10px] text-slate-400 block font-mono">Dual Active</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 text-[11px] text-slate-600 flex items-start gap-2">
              <Shield className="w-3.5 h-3.5 text-[#315EAA] shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Guarantee:</strong> Identity comparisons utilize salted HMAC-SHA256 tokens. Plaintext APAAR numbers are never logged or exposed.
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-mono">Stages A through E</span>
            <button
              onClick={() => setActiveNav('tper')}
              className="font-semibold text-[#315EAA] hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Open TPER Workspace <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Composite Panel 3: AICTE Sanctioned vs. Supernumerary Quota Balance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                    Statutory Seat Ledger
                  </h3>
                  <div className="text-sm font-bold text-[#101C32]">Sanctioned vs Supernumerary</div>
                </div>
              </div>
              {excessProgrammeCount > 0 ? (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-[#C94C4C] border border-red-200 animate-pulse">
                  +{excessProgrammeCount} Breach
                </span>
              ) : (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-[#168C83] border border-teal-200">
                  Fully Compliant
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold font-mono text-[#101C32] tabular-nums tracking-tight">
                  {totalCountedRegular}
                </span>
                <span className="text-xs text-slate-500 font-sans ml-2">Counted Regular</span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Cap: <strong className="text-slate-800 font-semibold">{totalApprovedRegular}</strong>
              </span>
            </div>

            {/* Quota Category Cards */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Regular Intake</span>
                  {excessProgrammeCount > 0 ? (
                    <span className="text-[10px] font-mono font-bold text-red-600 bg-red-100 px-1 rounded">+8 Excess</span>
                  ) : (
                    <span className="text-[10px] font-mono text-teal-700 font-semibold">Compliant</span>
                  )}
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-slate-900">
                  {totalCountedRegular} / {totalApprovedRegular}
                </div>
                <div className="text-[10px] text-slate-500 font-sans">Northstar B.Sc CS breach</div>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Supernumerary</span>
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1 rounded font-semibold">Isolated</span>
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-indigo-900">
                  {supernumeraryStats.totalSuperEnrolled} Seats
                </div>
                <div className="text-[10px] text-slate-500 font-mono">TFW: {supernumeraryStats.tfwEnrolled} | EWS: {supernumeraryStats.ewsEnrolled}</div>
              </div>
            </div>

            <div className="mt-3 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 text-[11px] text-slate-600 font-sans">
              <strong>Mathematical Ring-Fencing:</strong> Supernumerary seats never deplete approved regular capacity or inflate statutory regular variances.
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-mono">AICTE APH Guidelines</span>
            <button
              onClick={() => setActiveNav('seat-ledger')}
              className="font-semibold text-[#315EAA] hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Programme Ledger <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* END-TO-END REGULATORY PIPELINE (Horizontal Linear Roadmap) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Statutory Data Pipeline
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-[#315EAA] border border-blue-200 font-bold">
                6 Linear Stages
              </span>
            </div>
            <h2 className="text-sm font-bold text-[#101C32] mt-0.5">
              Institution Upload → Smart Schema Mapping → Validation → TPER Reconciliation → Human Review → Verification
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden md:inline">
            Click any stage to execute module workflow
          </span>
        </div>

        {/* 6 Sequential Stage Workstation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {journeyWorkflow.map((item) => (
            <div
              key={item.step}
              onClick={() => setActiveNav(item.targetNav)}
              className="group p-3.5 rounded-lg border border-slate-200 hover:border-[#315EAA] bg-slate-50/50 hover:bg-white transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between cursor-pointer space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#101C32] text-white">
                    {item.step}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">{item.tag}</span>
                </div>
                <div className="text-xs font-bold text-[#101C32] tracking-tight group-hover:text-[#315EAA] transition-colors">
                  {item.title}
                </div>
                <div className="text-[10px] font-medium text-slate-500">
                  {item.subtitle}
                </div>
                <p className="text-[10px] text-slate-600 leading-snug line-clamp-2">
                  {item.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="font-mono text-[9px] font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                  {item.metric}
                </span>
                <span className="text-[10px] font-semibold text-[#315EAA] group-hover:text-blue-700 flex items-center gap-0.5">
                  Launch <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CORE OPERATIONAL WORKBENCH GRID:
          Left: Programme-wise Approved vs Enrolled Quota Reconciliation Table
          Right: Campus Performance & Filing Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Programme Quota Reconciliation Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#101C32]">
                    Programme Regular Intake vs. Counted Enrolment
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Sanctioned Cap Audit
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supernumerary seats are accounted separately and cannot deplete regular open capacity.
                </p>
              </div>

              {/* Breaches Filter Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuotaBreachOnly(!quotaBreachOnly)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    quotaBreachOnly
                      ? 'bg-[#C94C4C] text-white border-[#C94C4C] shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{quotaBreachOnly ? 'Showing Breaches Only' : 'Show Breaches Only'}</span>
                </button>
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Campus & Programme</th>
                    <th className="py-2.5 px-3 text-right">Sanctioned</th>
                    <th className="py-2.5 px-3 text-right">Regular</th>
                    <th className="py-2.5 px-3 text-center">Variance</th>
                    <th className="py-2.5 px-3 text-right">Super Quota</th>
                    <th className="py-2.5 px-3 text-center">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredIntakeList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-mono text-xs">
                        No programmes matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredIntakeList.map((item) => (
                      <tr key={item.limitId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{item.programmeCode}</div>
                          <span className="text-[10px] font-mono text-slate-500">{item.institutionName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700 tabular-nums">
                          {item.approvedRegularIntake}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {item.countedRegular}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {item.isExcess ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                              +{item.variance} Breach
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                              {item.approvedRegularIntake - item.countedRegular} Vacant
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-semibold tabular-nums">
                          {item.supernumeraryCount} / {item.approvedSuperCap}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.isExcess ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              EXCESS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                              COMPLIANT
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-mono">AICTE Approval Process Handbook (APH) Standard</span>
            <button
              onClick={() => setActiveNav('seat-ledger')}
              className="text-xs font-semibold text-[#315EAA] hover:text-blue-800 flex items-center gap-1"
            >
              Full Multi-Year Quota Cell <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Campus Compliance Scorecard (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#315EAA]" />
                <h2 className="text-sm font-bold text-[#101C32]">Campus Regulatory Performance</h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {relevantInstitutions.length} Campuses
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100 overflow-y-auto max-h-[380px]">
              {relevantInstitutions.map((inst) => {
                const instRecords = records.filter((r) => r.institutionId === inst.id);
                const total = instRecords.length || 1;
                const accepted = instRecords.filter((r) => r.rowOutcome === 'ACCEPTED').length;
                const passRate = Math.round((accepted / total) * 100);
                const hasBreach = intakeComparison.some((p) => p.institutionId === inst.id && p.isExcess);

                return (
                  <div key={inst.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#101C32] truncate">{inst.name}</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                          {inst.code}
                        </span>
                        {hasBreach && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200">
                            QUOTA BREACH
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-sans">
                        Region: <strong className="text-slate-700 font-medium">{inst.region}</strong> · {inst.type}
                      </div>

                      {/* Small progress bar */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-24 bg-slate-100 h-1.5 rounded overflow-hidden">
                          <div
                            style={{ width: `${passRate}%` }}
                            className={`h-full ${passRate >= 90 ? 'bg-[#168C83]' : 'bg-[#D99032]'}`}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">
                          {passRate}% Validated ({instRecords.length} records)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveNav('institutions');
                      }}
                      className="py-1 px-2.5 rounded bg-blue-50 hover:bg-blue-100 text-[#315EAA] text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                    >
                      Dossier →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveNav('institutions')}
              className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Manage Institutional Dossiers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CORE TECHNOLOGICAL INNOVATIONS ACCORDION / SHOWCASE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#315EAA]" />
              <h2 className="text-sm font-bold text-[#101C32]">
                Core Architectural Innovations — Flatstudio Product Design Showcase
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Explainable temporal reconciliation, mathematical seat isolation, cryptographic lineage, and zero-knowledge privacy.
            </p>
          </div>

          {/* Innovation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-mono font-medium overflow-x-auto">
            <button
              onClick={() => setActiveInnovationTab('TPER')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeInnovationTab === 'TPER' ? 'bg-white text-[#315EAA] shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A. TPER Engine
            </button>
            <button
              onClick={() => setActiveInnovationTab('SEAT_LEDGER')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeInnovationTab === 'SEAT_LEDGER' ? 'bg-white text-[#315EAA] shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              B. Seat Ledger
            </button>
            <button
              onClick={() => setActiveInnovationTab('TRUST')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeInnovationTab === 'TRUST' ? 'bg-white text-[#315EAA] shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              C. Academic Trust
            </button>
            <button
              onClick={() => setActiveInnovationTab('RECORD_DNA')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeInnovationTab === 'RECORD_DNA' ? 'bg-white text-[#315EAA] shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              D. Record DNA
            </button>
            <button
              onClick={() => setActiveInnovationTab('CYBERSHIELD')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeInnovationTab === 'CYBERSHIELD' ? 'bg-white text-[#315EAA] shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              E. CyberShield
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 text-xs space-y-3">
          {activeInnovationTab === 'TPER' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#101C32] text-sm flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-[#315EAA]" />
                  TPER — Temporal & Protected Enrolment Reconciliation
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 border border-blue-200">
                  SIH26263 Core Innovation
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-sans">
                Traditional reconciliation checks fail when students legally transfer institutions or when demographic spellings vary. TPER introduces <strong>5 privacy-preserving stages</strong>:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">1. Protected Identity Matching</strong>
                  <p className="text-slate-600 text-[11px] leading-snug">
                    Raw 12-digit APAAR IDs are transformed into pseudonymized keyed HMAC references before comparison. Global plaintext identity exposure is mathematically prevented.
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">2. Temporal Interval Overlaps</strong>
                  <p className="text-slate-600 text-[11px] leading-snug">
                    Evaluates continuous date ranges [T_admission, T_release] rather than static flags. Sequential enrolments with verified release dates are cleared as legitimate transfers.
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">3. Explainable Human Review</strong>
                  <p className="text-slate-600 text-[11px] leading-snug">
                    Duplicate candidates are items for administrative review, not accusations of fraud. Multi-signal heuristic breakdown (Name 40%, DOB 35%, Interval 15%, Programme 10%) guides regulators.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeInnovationTab === 'SEAT_LEDGER' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#101C32] text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#168C83]" />
                  Programme-wise Statutory Seat Ledger
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-100 text-teal-800 border border-teal-200">
                  AICTE APH Compliance
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-sans">
                State higher education councils frequently face disputes over student counts. The IDVERA seat ledger establishes strict mathematical separation between baseline sanctioned capacity and over-and-above allocations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">Sanctioned Regular Capacity</strong>
                  <p className="text-slate-600 text-[11px] leading-snug">
                    The strict ceiling approved in the AICTE Approval Process Handbook (e.g. 60 or 120 seats). Regular admissions beyond this ceiling immediately trigger Rule V-09 Intake Quota Excess.
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">Supernumerary Quotas (TFW / EWS / PMSSS)</strong>
                  <p className="text-slate-600 text-[11px] leading-snug">
                    Government-mandated quota seats (TFW up to 5%, EWS up to 10%) that never deplete regular intake. Accounted separately so compliant colleges are never penalized for filling welfare seats.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeInnovationTab === 'TRUST' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#101C32] text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#315EAA]" />
                  Academic Trust Assessment Framework
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Four-Dimensional Integrity
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">Identity Consistency</strong>
                  <p className="text-slate-600 text-[11px] leading-snug">12-digit APAAR validity, format verification, and demographic fingerprint alignment.</p>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">Temporal Consistency</strong>
                  <p className="text-slate-600 text-[11px] leading-snug">Absence of unreleased simultaneous enrolments across accredited universities.</p>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">Regulatory Consistency</strong>
                  <p className="text-slate-600 text-[11px] leading-snug">Compliance with approved intake limits, reservation categories, and admission calendar cut-offs.</p>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block text-xs">Evidence Provenance</strong>
                  <p className="text-slate-600 text-[11px] leading-snug">Full traceability to signed institutional filing manifests and registrar endorsements.</p>
                </div>
              </div>
            </div>
          )}

          {activeInnovationTab === 'RECORD_DNA' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#101C32] text-sm flex items-center gap-2">
                  <Dna className="w-4 h-4 text-purple-600" />
                  Record DNA — Complete Regulatory Lineage
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-100 text-purple-800 border border-purple-200">
                  Full Auditability
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-sans">
                Every enrolment record carries its complete verifiable lineage from initial CSV ingestion through statutory adjudication and degree verification:
              </p>
              <div className="p-3 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-700 flex flex-wrap items-center justify-between gap-2">
                <span className="bg-slate-100 px-2 py-1 rounded font-semibold text-slate-800">1. Ingestion Batch Ref</span>
                <span>→</span>
                <span className="bg-slate-100 px-2 py-1 rounded font-semibold text-slate-800">2. Statutory Rule Version</span>
                <span>→</span>
                <span className="bg-slate-100 px-2 py-1 rounded font-semibold text-slate-800">3. Row Validation Findings</span>
                <span>→</span>
                <span className="bg-slate-100 px-2 py-1 rounded font-semibold text-slate-800">4. Reviewer Justification</span>
                <span>→</span>
                <span className="bg-purple-50 text-purple-800 px-2 py-1 rounded font-semibold border border-purple-200">5. SHA-256 Ledger Block</span>
              </div>
            </div>
          )}

          {activeInnovationTab === 'CYBERSHIELD' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#101C32] text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#315EAA]" />
                  CyberShield — Security Controls & Production Roadmap
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 border border-blue-200">
                  Security Boundary Transparency
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="bg-white p-3 rounded border border-teal-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Implemented In This Browser Prototype:</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 font-sans">
                    <li>Client-side deterministic HMAC pseudonymization of student APAAR IDs.</li>
                    <li>Zero external network telemetry; all data processed strictly in-memory.</li>
                    <li>Cryptographic SHA-256 block hash chaining for audit journal tamper-evidence.</li>
                    <li>Role-based capability evaluation on all application action handlers.</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded border border-blue-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Planned Production Controls (Enterprise Roadmap):</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 font-sans">
                    <li>Jan Parichay National SSO (MeriPehchaan OAuth 2.0 / SAML) with FIDO2 MFA.</li>
                    <li>FIPS 140-3 Hardware Security Modules (HSMs) for master HMAC key derivation.</li>
                    <li>Multi-tenant PostgreSQL with Row-Level Security (RLS) & encrypted tables at rest.</li>
                    <li>RFC 3161 digital timestamping authority and WORM compliance vaults.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TWO COLUMN GRID: PENDING DUPLICATE REVIEWS & RECENT AUDIT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Duplicate Reviews Queue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-[#D99032]" />
                <h2 className="text-sm font-bold text-[#101C32]">Duplicate Review Queue (TPER Engine)</h2>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                {openDuplicates} Open Candidates
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100 overflow-y-auto max-h-[300px]">
              {duplicateCandidates.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-mono">
                  No duplicate candidates detected.
                </div>
              ) : (
                duplicateCandidates.slice(0, 4).map((c) => {
                  const instA = institutions.find((i) => i.id === c.recordA.institutionId);
                  const instB = institutions.find((i) => i.id === c.recordB.institutionId);
                  return (
                    <div key={c.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-[#101C32]">{c.id}</span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                              c.status === 'PENDING_REVIEW'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-teal-50 text-teal-800 border-teal-300'
                            }`}
                          >
                            {c.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {c.confidenceScore}% Confidence
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-800">
                          {c.recordA.studentName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {instA?.code || c.recordA.institutionId} ↔ {instB?.code || c.recordB.institutionId}
                        </div>
                        <p className="text-[10px] text-slate-600 line-clamp-1">
                          {c.explanation}
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveNav('exception-review')}
                        className="py-1 px-2.5 rounded bg-blue-50 hover:bg-blue-100 text-[#315EAA] text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                      >
                        Review →
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveNav('exception-review')}
              className="w-full py-2 px-3 bg-[#315EAA] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>Open Adjudication Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Cryptographic Audit Activity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <h2 className="text-sm font-bold text-[#101C32]">Tamper-Evident SHA-256 Audit Stream</h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Append-Only Journal
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100 overflow-y-auto max-h-[300px]">
              {auditEvents.slice(0, 5).map((ev) => (
                <div key={ev.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#101C32]">{ev.id}</span>
                      <span className="font-semibold text-slate-800">{ev.action}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {ev.timestamp.replace('T', ' ').slice(0, 19)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Actor: <strong className="text-slate-700">{ev.actorName}</strong> ({ev.actorRole})
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-1 rounded">
                      {ev.entityType}
                    </span>
                  </div>

                  {ev.reasonOrRuleId && (
                    <div className="text-[10px] text-slate-600 italic line-clamp-1">
                      "{ev.reasonOrRuleId}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveNav('audit-trail')}
              className="w-full py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Inspect Cryptographic Audit Journal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

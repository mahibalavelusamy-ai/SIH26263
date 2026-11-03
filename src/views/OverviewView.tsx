import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  FileCheck,
  CheckCircle,
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
  CheckCircle2,
  HelpCircle,
  Layers,
  Sparkles,
  Info,
  Sliders,
  History,
  Shield,
  ShieldCheck,
  Clock,
  Dna,
  Lock,
  Search,
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

        // Statutory supernumerary approved cap (typically up to 15% across TFW & EWS)
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

  // Supernumerary Quota Aggregates
  const supernumeraryStats = useMemo(() => {
    const tfwEnrolled = records.filter((r) => r.supernumeraryFlag && r.supernumeraryCategory === 'TFW' && r.rowOutcome !== 'REJECTED').length;
    const ewsEnrolled = records.filter((r) => r.supernumeraryFlag && r.supernumeraryCategory === 'EWS' && r.rowOutcome !== 'REJECTED').length;
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

  // Exceptions breakdown by Rule (V-01 to V-12)
  const ruleCounts = useMemo(() => {
    const counts: Record<string, { count: number; name: string; severity: string; statRef: string }> = {
      'V-01': { count: 0, name: 'Missing Required Fields (Name, Ref, DOB)', severity: 'BLOCKING', statRef: 'APH Ch. 2 §1.4' },
      'V-02': { count: 0, name: 'Missing APAAR Identity Number', severity: 'WARNING', statRef: 'MoE NDEAR 2024' },
      'V-03': { count: 0, name: 'APAAR 12-Digit Format Mismatch', severity: 'WARNING', statRef: 'UIDAI/NDEAR Spec' },
      'V-04': { count: 0, name: 'Duplicate APAAR in Single Batch', severity: 'WARNING', statRef: 'Council Ingestion Standard' },
      'V-05': { count: 0, name: 'Cross-Institution Active Enrolment Collision', severity: 'WARNING', statRef: 'AICTE Reg. 2023 §7' },
      'V-06': { count: 0, name: 'Age Outside Statutory Range (14-70)', severity: 'BLOCKING', statRef: 'Statutory Age Ceiling' },
      'V-07': { count: 0, name: 'Admission Outside Session Window', severity: 'WARNING', statRef: 'Academic Calendar Cut-off' },
      'V-08': { count: 0, name: 'Seat Category & Quota Eligibility Conflict', severity: 'WARNING', statRef: 'Reservation Guidelines' },
      'V-09': { count: 0, name: 'Approved Regular Intake Quota Breach', severity: 'WARNING', statRef: 'APH Sanctioned Limits' },
      'V-10': { count: 0, name: 'Supernumerary Quota Ceiling Excess', severity: 'WARNING', statRef: 'TFW/EWS Statutory Cap' },
      'V-11': { count: 0, name: 'Supernumerary Missing Category Classification', severity: 'WARNING', statRef: 'Quota Designation Order' },
      'V-12': { count: 0, name: 'Approved Programme Zero Enrolment Notice', severity: 'INFO', statRef: 'Surplus Capacity Cell' },
    };

    filteredRecords.forEach((r) => {
      if (r.findings) {
        r.findings.forEach((f) => {
          if (counts[f.ruleId]) {
            counts[f.ruleId].count++;
          }
        });
      }
    });

    counts['V-09'].count = excessProgrammeCount;
    return counts;
  }, [filteredRecords, excessProgrammeCount]);

  // Complete 6-Stage Workflow Visualization:
  // Institution Upload → Smart Schema Mapping → Validation → TPER Reconciliation → Human Review → Verification
  const journeyWorkflow = [
    {
      step: '01',
      title: 'Institution Upload',
      subtitle: 'CSV/Excel Ingestion',
      desc: 'Batch ingestion with RFC 4180 parsing, quoted string preservation, and UTF-8 encoding checks.',
      metric: `${relevantSubmissions.length} Batches Ingested`,
      targetNav: 'submission',
      badge: 'bg-blue-600 text-white',
    },
    {
      step: '02',
      title: 'Smart Schema Mapping',
      subtitle: 'ERP Column Auto-Mapper',
      desc: 'Auto-maps disparate ERP field names (e.g. Student_Ref, Roll_No) to the canonical schema with Row 1 preview.',
      metric: 'Canonical Schema',
      targetNav: 'submission',
      badge: 'bg-teal-600 text-white',
    },
    {
      step: '03',
      title: 'Statutory Validation',
      subtitle: '12 Rules Engine (V-01–V-12)',
      desc: 'Executes statutory checks for missing identity, 12-digit APAAR format, age bounds (14–70), and quota limits.',
      metric: `${acceptedRows} Passed / ${rejectedRows} Blocked`,
      targetNav: 'rules',
      badge: 'bg-indigo-600 text-white',
    },
    {
      step: '04',
      title: 'TPER Reconciliation',
      subtitle: 'Temporal Cross-Matching',
      desc: 'Stage A Keyed HMAC matching and Stage D heuristic scoring detect dual active admissions without exposing raw PII.',
      metric: `${openDuplicates} Candidates Detected`,
      targetNav: 'tper',
      badge: 'bg-purple-600 text-white',
    },
    {
      step: '05',
      title: 'Human Review',
      subtitle: 'Adjudication Workspace',
      desc: 'Regulatory officers inspect transfer certificates, overlap chronology, and record mandatory justifications.',
      metric: `${openDuplicates} Pending Adjudication`,
      targetNav: 'exception-review',
      badge: 'bg-amber-600 text-white',
    },
    {
      step: '06',
      title: 'Student Verification',
      subtitle: 'Minimum-Disclosure Query',
      desc: 'Privacy-safe API queries return tri-state certificates (VERIFIED, NOT_VERIFIED, UNABLE_TO_VERIFY) without database leakage.',
      metric: '3 Tri-State Outcomes',
      targetNav: 'verification',
      badge: 'bg-slate-900 text-white',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Header and Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
              Executive Enrolment & Reconciliation Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              AICTE Oversight
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Real-time synthetic regulatory intelligence derived from institutional submissions, statutory rules, and TPER temporal models.
          </p>
        </div>

        {/* Global Multi-Filter Strip */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 px-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Filters:</span>
          </div>

          {/* Academic Year */}
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono cursor-pointer"
          >
            <option value="2026-27">AY 2026-27</option>
            <option value="2025-26">AY 2025-26</option>
          </select>

          {/* Institution */}
          <select
            value={filterInstitution}
            onChange={(e) => setFilterInstitution(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[160px] truncate cursor-pointer"
          >
            <option value="ALL">All Institutions ({institutions.length})</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} - {i.name}
              </option>
            ))}
          </select>

          {/* Programme */}
          <select
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Programmes</option>
            {programmes.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Outcomes</option>
            <option value="ACCEPTED">Accepted Rows</option>
            <option value="FLAGGED">Flagged Rows</option>
            <option value="REJECTED">Rejected Rows</option>
          </select>
        </div>
      </div>

      {/* COMPLETE WORKFLOW VISUALIZATION:
          Institution Upload → Smart Schema Mapping → Validation → TPER Reconciliation → Human Review → Verification */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                End-to-End Regulatory Pipeline
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                6 Linear Stages
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-0.5">
              Institution Upload → Smart Schema Mapping → Validation → TPER Reconciliation → Human Review → Verification
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden md:inline">
            Click any stage to test demonstration flow
          </span>
        </div>

        {/* 6 Workflow Stage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 mt-4">
          {journeyWorkflow.map((item) => (
            <div
              key={item.step}
              onClick={() => setActiveNav(item.targetNav)}
              className="group p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between cursor-pointer space-y-2.5"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${item.badge}`}>
                    {item.step}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="text-xs font-bold text-slate-900 tracking-tight leading-tight pt-0.5">
                  {item.title}
                </div>
                <div className="text-[10px] font-medium text-slate-500">
                  {item.subtitle}
                </div>
                <p className="text-[10px] text-slate-600 leading-snug line-clamp-2 pt-0.5">
                  {item.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="font-mono text-[9px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                  {item.metric}
                </span>
                <span className="text-[10px] font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-0.5">
                  Test <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MEANINGFUL KPI CARDS (8 Institutional Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Institutions */}
        <div
          onClick={() => setActiveNav('institution')}
          className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between cursor-pointer"
        >
          <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
            Institutions
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {relevantInstitutions.length}
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Synthetic campuses</span>
        </div>

        {/* 2. Submissions / Batches */}
        <div
          onClick={() => setActiveNav('submission')}
          className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between cursor-pointer"
        >
          <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
            Submissions
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {relevantSubmissions.length}
            </span>
            <FileCheck className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Batches ingested</span>
        </div>

        {/* 3. Enrolment Records */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
            Enrolment Records
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">{totalRows}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Student roster</span>
        </div>

        {/* 4. Accepted Records */}
        <div className="bg-white p-3 rounded-lg border border-teal-200/90 bg-teal-50/20 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold font-mono text-teal-800 uppercase tracking-wider">
            Accepted
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-teal-800 tabular-nums">{acceptedRows}</span>
            <CheckCircle className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-[10px] text-teal-700 mt-1 font-medium">
            {totalRows > 0 ? `${Math.round((acceptedRows / totalRows) * 100)}% compliant` : '0%'}
          </span>
        </div>

        {/* 5. Flagged Records */}
        <div className="bg-white p-3 rounded-lg border border-amber-200/90 bg-amber-50/20 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold font-mono text-amber-800 uppercase tracking-wider">
            Flagged
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-amber-800 tabular-nums">{flaggedRows}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[10px] text-amber-700 mt-1 font-medium">Review required</span>
        </div>

        {/* 6. Rejected Records */}
        <div className="bg-white p-3 rounded-lg border border-red-200/90 bg-red-50/20 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold font-mono text-red-800 uppercase tracking-wider">
            Rejected
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-red-800 tabular-nums">{rejectedRows}</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <span className="text-[10px] text-red-700 mt-1 font-medium">Statutory block</span>
        </div>

        {/* 7. Duplicate Candidates */}
        <div
          onClick={() => setActiveNav('exception-review')}
          className="bg-white p-3 rounded-lg border border-indigo-200 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-indigo-700 uppercase tracking-wider">
              Duplicates
            </span>
            <ArrowUpRight className="w-3 h-3 text-indigo-500" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-indigo-900 tabular-nums">{openDuplicates}</span>
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-[10px] text-indigo-600/80 mt-1">Pending review</span>
        </div>

        {/* 8. Intake Exceptions */}
        <div
          onClick={() => setActiveNav('aicte-monitoring')}
          className={`p-3 rounded-lg border shadow-2xs flex flex-col justify-between cursor-pointer transition-colors ${
            excessProgrammeCount > 0
              ? 'border-red-300 bg-red-50/30 hover:border-red-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-slate-600 uppercase tracking-wider">
              Intake Exceptions
            </span>
            <ArrowUpRight className="w-3 h-3 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-xl font-bold font-mono tabular-nums ${excessProgrammeCount > 0 ? 'text-red-700' : 'text-slate-800'}`}>
              {excessProgrammeCount}
            </span>
            <TrendingUp className={`w-4 h-4 ${excessProgrammeCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <span className={`text-[10px] mt-1 font-medium ${excessProgrammeCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {excessProgrammeCount > 0 ? `${excessProgrammeCount} Regular excess` : 'All compliant'}
          </span>
        </div>
      </div>

      {/* CORE TECHNOLOGICAL INNOVATIONS SHOWCASE (TPER, Seat Ledger, Academic Trust, Record DNA, CyberShield) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Core Architectural Innovations — What Makes IDVERA Breakthrough
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Explainable temporal reconciliation, mathematical seat isolation, and zero-knowledge privacy.
            </p>
          </div>

          {/* Innovation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-mono font-medium overflow-x-auto">
            <button
              onClick={() => setActiveInnovationTab('TPER')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeInnovationTab === 'TPER' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A. TPER Engine
            </button>
            <button
              onClick={() => setActiveInnovationTab('SEAT_LEDGER')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeInnovationTab === 'SEAT_LEDGER' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              B. Seat Ledger
            </button>
            <button
              onClick={() => setActiveInnovationTab('TRUST')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeInnovationTab === 'TRUST' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              C. Academic Trust
            </button>
            <button
              onClick={() => setActiveInnovationTab('RECORD_DNA')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeInnovationTab === 'RECORD_DNA' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              D. Record DNA
            </button>
            <button
              onClick={() => setActiveInnovationTab('CYBERSHIELD')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeInnovationTab === 'CYBERSHIELD' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
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
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-blue-600" />
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
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
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
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
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
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
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
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
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

      {/* CHARTS & ANALYTICS GRID:
          1. Submission Outcomes Distribution
          2. Supernumerary Quota Utilization Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Submission Outcomes Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Submission Outcome Distribution</h2>
              <p className="text-xs text-slate-500">Row-level statutory classification across active filters</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {totalRows} Total Records
            </span>
          </div>

          {/* Visual Stacked Progress Bar */}
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${totalRows > 0 ? (acceptedRows / totalRows) * 100 : 0}%` }}
                className="bg-teal-600 h-full transition-all"
                title={`Accepted: ${acceptedRows}`}
              />
              <div
                style={{ width: `${totalRows > 0 ? (flaggedRows / totalRows) * 100 : 0}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Flagged: ${flaggedRows}`}
              />
              <div
                style={{ width: `${totalRows > 0 ? (rejectedRows / totalRows) * 100 : 0}%` }}
                className="bg-red-600 h-full transition-all"
                title={`Rejected: ${rejectedRows}`}
              />
            </div>

            {/* Legend & Count Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-teal-200 bg-teal-50/30">
                <div className="flex items-center gap-1.5 text-teal-800 font-semibold">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                  <span>Accepted</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="text-base font-bold text-teal-900">{acceptedRows}</span>
                  <span className="text-[11px] text-teal-700 font-medium">
                    {totalRows > 0 ? `${Math.round((acceptedRows / totalRows) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/30">
                <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Flagged</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="text-base font-bold text-amber-900">{flaggedRows}</span>
                  <span className="text-[11px] text-amber-700 font-medium">
                    {totalRows > 0 ? `${Math.round((flaggedRows / totalRows) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-red-200 bg-red-50/30">
                <div className="flex items-center gap-1.5 text-red-800 font-semibold">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span>Rejected</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between font-mono">
                  <span className="text-base font-bold text-red-900">{rejectedRows}</span>
                  <span className="text-[11px] text-red-700 font-medium">
                    {totalRows > 0 ? `${Math.round((rejectedRows / totalRows) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              <strong>Statutory Classification Note:</strong> Accepted records are bona fide enrolments eligible for degree verification. Flagged rows require administrative review; rejected records fail blocking criteria.
            </div>
          </div>
        </div>

        {/* Chart 2: Supernumerary Quota Utilization */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Supernumerary Quota Utilization</h2>
              <p className="text-xs text-slate-500">Statutory over-and-above allocations authorized by government policies</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              {supernumeraryStats.totalSuperEnrolled} Quota Students
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 block font-medium">Tuition Fee Waiver (TFW 5%):</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold font-mono text-slate-900">{supernumeraryStats.tfwEnrolled}</span>
                <span className="text-[10px] font-mono text-slate-500">Cap: {supernumeraryStats.tfwCap}</span>
              </div>
              <div className="text-[10px] text-teal-700 font-semibold">Statutory Compliance Active</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 block font-medium">Economically Weaker Section (EWS 10%):</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold font-mono text-slate-900">{supernumeraryStats.ewsEnrolled}</span>
                <span className="text-[10px] font-mono text-slate-500">Cap: {supernumeraryStats.ewsCap}</span>
              </div>
              <div className="text-[10px] text-teal-700 font-semibold">Welfare Quota Filled</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 block font-medium">PMSSS / J&K Migrant Quota:</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold font-mono text-slate-900">{supernumeraryStats.pmsssEnrolled}</span>
                <span className="text-[10px] font-mono text-slate-500">Special Scheme</span>
              </div>
              <div className="text-[10px] text-slate-500">Ministry of Education</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 block font-medium">Lateral Entry / Other Quota:</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold font-mono text-slate-900">{supernumeraryStats.otherEnrolled}</span>
                <span className="text-[10px] font-mono text-slate-500">Diploma Migrants</span>
              </div>
              <div className="text-[10px] text-slate-500">Direct 2nd Year Entry</div>
            </div>
          </div>

          <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-200/60 text-[11px] text-slate-700 leading-relaxed">
            <strong>Quota Mandate:</strong> Supernumerary seats do NOT count against approved regular intake limits and cannot displace regular open-category students.
          </div>
        </div>
      </div>

      {/* INSTITUTION-WISE SUBMISSION STATUS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Institution-Wise Batch Submission Status</h2>
            <p className="text-xs text-slate-500">Filing history, row validation outcomes, and regulatory reconciliation status</p>
          </div>
          <button
            onClick={() => setActiveNav('submission')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Submission Centre <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Batch ID</th>
                <th className="py-2.5 px-3">Institution</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Engine</th>
                <th className="py-2.5 px-3 text-right">Rows</th>
                <th className="py-2.5 px-3 text-center">Row Outcomes</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {relevantSubmissions.map((sub) => {
                const inst = institutions.find((i) => i.id === sub.institutionId);
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{sub.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{inst?.name || sub.institutionId}</div>
                      <span className="text-[10px] font-mono text-slate-400">{inst?.code || sub.institutionId}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {sub.timestamp.replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{sub.ruleEngineVersion}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {sub.totalRows}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2 font-mono text-[11px]">
                        <span className="text-teal-700 font-semibold">{sub.acceptedRows} ✓</span>
                        <span className="text-amber-700 font-semibold">{sub.flaggedRows} ⚠</span>
                        <span className="text-red-700 font-semibold">{sub.rejectedRows} ✗</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          sub.status === 'RECONCILIATION_COMPLETE'
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : sub.status === 'REVIEW_REQUIRED'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {sub.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROGRAMME-WISE REGULAR INTAKE RECONCILIATION TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Programme-Wise Approved Regular Intake vs. Counted Regular Enrolment
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Sanctioned Quota Audit
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Supernumerary seats (TFW, EWS) are displayed separately and do NOT deplete regular intake capacity.
            </p>
          </div>

          {/* Breaches Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuotaBreachOnly(!quotaBreachOnly)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                quotaBreachOnly
                  ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{quotaBreachOnly ? 'Showing Breaches Only' : 'Filter Quota Breaches'}</span>
            </button>
            <button
              onClick={() => setActiveNav('aicte-monitoring')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 py-1 px-2 cursor-pointer"
            >
              Full Quota Cell <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Intake Reconciliation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Institution</th>
                <th className="py-2.5 px-3">Programme</th>
                <th className="py-2.5 px-3 text-right">Approved Regular</th>
                <th className="py-2.5 px-3 text-right">Enrolled Regular</th>
                <th className="py-2.5 px-3 text-center">Regular Variance</th>
                <th className="py-2.5 px-3 text-right">Supernumerary Cap</th>
                <th className="py-2.5 px-3 text-right">Supernumerary Enrolled</th>
                <th className="py-2.5 px-3 text-right font-bold">Total Campus Intake</th>
                <th className="py-2.5 px-3 text-center">Statutory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredIntakeList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400 font-mono text-xs">
                    No programmes matching current filters.
                  </td>
                </tr>
              ) : (
                filteredIntakeList.map((item) => (
                  <tr key={item.limitId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{item.institutionName}</div>
                      <span className="text-[10px] font-mono text-slate-400">{item.institutionCode}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                      {item.programmeCode}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 tabular-nums">
                      {item.approvedRegularIntake}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {item.countedRegular}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {item.isExcess ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                          +{item.variance} Regular Breach
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                          {item.approvedRegularIntake - item.countedRegular} Vacant
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500 tabular-nums">
                      {item.approvedSuperCap}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-700 font-semibold tabular-nums">
                      {item.supernumeraryCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {item.totalEnrolment}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.isExcess ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          EXCESS REGULAR INTAKE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
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

      {/* TWO COLUMN GRID: PENDING DUPLICATE REVIEWS & RECENT AUDIT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Duplicate Reviews Queue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">Pending Duplicate Reviews (TPER Queue)</h2>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                {openDuplicates} Open Candidates
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100 overflow-y-auto max-h-[300px]">
              {duplicateCandidates.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No duplicate candidates detected.
                </div>
              ) : (
                duplicateCandidates.slice(0, 4).map((c) => {
                  const instA = institutions.find((i) => i.id === c.recordA.institutionId);
                  const instB = institutions.find((i) => i.id === c.recordB.institutionId);
                  return (
                    <div key={c.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{c.id}</span>
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
                            {c.confidenceScore}% Score
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
                        className="py-1 px-2.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
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
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
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
                <h2 className="text-sm font-bold text-slate-900">Recent Tamper-Evident Audit Activity</h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                SHA-256 Ledger
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100 overflow-y-auto max-h-[300px]">
              {auditEvents.slice(0, 5).map((ev) => (
                <div key={ev.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{ev.id}</span>
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
              <span>Inspect Full Cryptographic Journal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

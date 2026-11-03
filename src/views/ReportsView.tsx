import React from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { sanitizeCsvCell } from '../services/securityService';
import {
  FileSpreadsheet,
  Download,
  FileWarning,
  FileCheck2,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { institutions, programmes, intakeLimits, records, duplicateCandidates, auditEvents, selectedAcademicYear } = useApp();

  // Export 1: Intake Reconciliation Report
  const handleExportIntake = () => {
    const headers = ['InstitutionCode', 'InstitutionName', 'AcademicYear', 'ProgrammeCode', 'ApprovedRegular', 'CountedRegular', 'RegularVariance', 'TFWEnrolled', 'EWSEnrolled', 'TotalActive'];
    const rows = intakeLimits.map((l) => {
      const inst = institutions.find((i) => i.id === l.institutionId);
      const regCount = records.filter((r) => r.institutionId === l.institutionId && r.programmeCode === l.programmeCode && !r.supernumeraryFlag && r.enrolmentStatus === 'ACTIVE' && r.rowOutcome !== 'REJECTED').length;
      const tfwCount = records.filter((r) => r.institutionId === l.institutionId && r.programmeCode === l.programmeCode && r.supernumeraryCategory === 'TFW' && r.enrolmentStatus === 'ACTIVE').length;
      const ewsCount = records.filter((r) => r.institutionId === l.institutionId && r.programmeCode === l.programmeCode && r.supernumeraryCategory === 'EWS' && r.enrolmentStatus === 'ACTIVE').length;
      const total = records.filter((r) => r.institutionId === l.institutionId && r.programmeCode === l.programmeCode && r.enrolmentStatus === 'ACTIVE' && r.rowOutcome !== 'REJECTED').length;

      return [
        `"${sanitizeCsvCell(inst?.code || l.institutionId)}"`,
        `"${sanitizeCsvCell(inst?.name || l.institutionId)}"`,
        `"${sanitizeCsvCell(l.academicYear)}"`,
        `"${sanitizeCsvCell(l.programmeCode)}"`,
        l.approvedRegularIntake,
        regCount,
        regCount - l.approvedRegularIntake,
        tfwCount,
        ewsCount,
        total,
      ];
    });

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `IDVERA_AICTE_Intake_Reconciliation_${selectedAcademicYear}.csv`;
    link.click();
  };

  // Export 2: Breach Notices
  const handleExportBreaches = () => {
    const headers = ['NoticeID', 'IssueDate', 'InstitutionCode', 'ProgrammeCode', 'ViolationType', 'SanctionedLimit', 'ReportedEnrolment', 'ExcessCount', 'StatutoryActionMandate'];
    const rows: string[][] = [];

    intakeLimits.forEach((l, idx) => {
      const inst = institutions.find((i) => i.id === l.institutionId);
      const regCount = records.filter((r) => r.institutionId === l.institutionId && r.programmeCode === l.programmeCode && !r.supernumeraryFlag && r.enrolmentStatus === 'ACTIVE' && r.rowOutcome !== 'REJECTED').length;
      if (regCount > l.approvedRegularIntake) {
        rows.push([
          `"NOTC-AICTE-${l.academicYear}-${idx + 1}"`,
          `"${new Date().toISOString().slice(0, 10)}"`,
          `"${sanitizeCsvCell(inst?.code || l.institutionId)}"`,
          `"${sanitizeCsvCell(l.programmeCode)}"`,
          '"REGULAR_APPROVED_INTAKE_EXCEEDED"',
          String(l.approvedRegularIntake),
          String(regCount),
          String(regCount - l.approvedRegularIntake),
          '"Institutional reconciliation hearing required; submission of genuine withdrawal records or revised intake approval"',
        ]);
      }
    });

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `IDVERA_AICTE_Statutory_Breach_Notices_${selectedAcademicYear}.csv`;
    link.click();
  };

  // Export 3: Duplicate Candidates Report
  const handleExportDuplicates = () => {
    const headers = ['CandidateID', 'Stage', 'ConfidenceScore', 'RecordA_Ref', 'RecordA_Campus', 'RecordB_Ref', 'RecordB_Campus', 'AdjudicationStatus'];
    const rows = duplicateCandidates.map((c) => [
      `"${sanitizeCsvCell(c.id)}"`,
      `"${sanitizeCsvCell(c.matchingStage)}"`,
      c.confidenceScore.toFixed(2),
      `"${sanitizeCsvCell(c.recordA.studentReference)}"`,
      `"${sanitizeCsvCell(c.recordA.institutionId)}"`,
      `"${sanitizeCsvCell(c.recordB.studentReference)}"`,
      `"${sanitizeCsvCell(c.recordB.institutionId)}"`,
      `"${sanitizeCsvCell(c.status)}"`,
    ]);

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `IDVERA_TPER_Duplicate_Resolution_Report.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Governance' },
          { label: 'Regulatory Reports' },
        ]}
        title="Regulatory Reports & Statutory Export Centre"
        subtitle="Download validated compliance scorecards, AICTE breach notices, and tamper-evident audit filings with formula sanitization."
        badge={
          <span className="font-mono text-[11px] text-[#168C83] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#168C83]" />
            SAFE CSV SANITIZED
          </span>
        }
      />

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Available Reports"
          value="5 Formats"
          subValue="AICTE statutory filings"
          tone="indigo"
        />
        <MetricCard
          label="Export Security"
          value="RFC 4180"
          subValue="Zero formula injection risk"
          tone="teal"
        />
        <MetricCard
          label="Audited Entities"
          value={institutions.length}
          subValue="Registered campuses"
        />
        <MetricCard
          label="Enrolment Records"
          value={records.length}
          subValue="Under regulatory ledger"
          tone="teal"
        />
      </div>

      {/* Reports Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Report 1 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileSpreadsheet className="w-4 h-4 text-[#315EAA]" />
              <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
                Intake Reconciliation Ledger
              </h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed font-sans">
              Comprehensive programme-wise seat audit comparing approved regular limits vs active rosters, plus supernumerary (TFW, EWS) breakdowns.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleExportIntake}
              className="w-full py-2 px-3 bg-[#101C32] hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#315EAA]" /> Download Intake Report (CSV)
            </button>
          </div>
        </div>

        {/* Report 2 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileWarning className="w-4 h-4 text-[#C94C4C]" />
              <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
                Statutory Breach Notices
              </h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed font-sans">
              Formal non-compliance notice exports for institutions exceeding regular approved capacity (e.g. Northstar CS +8 breach).
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleExportBreaches}
              className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-[#C94C4C] border border-rose-200 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export Breach Notices (CSV)
            </button>
          </div>
        </div>

        {/* Report 3 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileCheck2 className="w-4 h-4 text-[#168C83]" />
              <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase tracking-wider">
                TPER Duplicate Resolution Log
              </h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed font-sans">
              Complete collision resolution log covering Keyed HMAC matches, heuristic findings, and legitimate transfer adjudications.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleExportDuplicates}
              className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-800 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export TPER Log (CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import {
  Building2,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  MapPin,
  Mail,
} from 'lucide-react';

export const InstitutionPortalView: React.FC = () => {
  const {
    institutions,
    selectedInstitutionId,
    setSelectedInstitutionId,
    programmes,
    intakeLimits,
    submissions,
    records,
    setActiveNav,
    selectedAcademicYear,
  } = useApp();

  const currentInstitution = institutions.find((i) => i.id === selectedInstitutionId) || institutions[0];

  // Programmes offered by this institution
  const approvedProgs = programmes.filter((p) =>
    currentInstitution.approvedProgrammes.includes(p.code)
  );

  // Submissions for this institution
  const instSubmissions = submissions.filter((s) => s.institutionId === currentInstitution.id);

  // Records for this institution
  const instRecords = records.filter(
    (r) => r.institutionId === currentInstitution.id && r.academicYear === selectedAcademicYear
  );

  const acceptedCount = instRecords.filter((r) => r.rowOutcome === 'ACCEPTED').length;
  const flaggedCount = instRecords.filter((r) => r.rowOutcome === 'FLAGGED').length;
  const rejectedCount = instRecords.filter((r) => r.rowOutcome === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header and Switcher */}
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Campuses' },
          { label: currentInstitution.code },
        ]}
        title="Institution Management Portal"
        subtitle="Review institutional statutory profile, approved programme quotas, and historical batch filings."
        badge={
          <span className="font-mono text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-semibold">
            {currentInstitution.code}
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase text-slate-500">Institution:</span>
              <select
                value={currentInstitution.id}
                onChange={(e) => setSelectedInstitutionId(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 font-medium text-slate-800 shadow-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.code} — {inst.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setActiveNav('submission')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              Upload Batch
            </button>
          </div>
        }
      />

      {/* Institution Master Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-semibold text-slate-900">{currentInstitution.name}</h2>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {currentInstitution.code}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-medium">
                  AICTE RECOGNIZED
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap font-sans">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Region: <strong className="text-slate-800 font-medium">{currentInstitution.region}</strong>
                </span>
                <span className="text-slate-300">·</span>
                <span>State: <strong className="text-slate-800 font-medium">{currentInstitution.state}</strong></span>
                <span className="text-slate-300">·</span>
                <span>Category: <strong className="text-slate-800 font-medium">{currentInstitution.type}</strong></span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Liaison: <strong className="text-slate-800 font-medium font-mono text-[11px]">{currentInstitution.contactEmail}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Academic Session Summary Banner */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <MetricCard
            label={`Reported (AY ${selectedAcademicYear})`}
            value={instRecords.length}
            subValue="Total enrolments in session"
          />
          <MetricCard
            label="Accepted Records"
            value={acceptedCount}
            subValue="Passed all 12 statutory rules"
            trend={{
              value: `${instRecords.length > 0 ? Math.round((acceptedCount / instRecords.length) * 100) : 0}%`,
              isPositive: true,
            }}
            tone="teal"
          />
          <MetricCard
            label="Flagged for Review"
            value={flaggedCount}
            subValue="TPER overlaps or warnings"
            tone="amber"
          />
          <MetricCard
            label="Rejected Violations"
            value={rejectedCount}
            subValue="Deterministic rule failures"
            tone="rose"
          />
        </div>
      </div>

      {/* Grid: Approved Programmes & Intake Matrix vs. Submission History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approved Programmes & Approved Capacity */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 uppercase font-mono tracking-wider">
                  Approved Programmes & Seat Limits
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Statutory regular and supernumerary caps for AY {selectedAcademicYear}</p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {approvedProgs.length} Programmes
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px] p-2">
              {approvedProgs.map((prog) => {
                const limit = intakeLimits.find(
                  (l) =>
                    l.institutionId === currentInstitution.id &&
                    l.programmeCode === prog.code &&
                    l.academicYear === selectedAcademicYear
                );

                const regularCount = instRecords.filter(
                  (r) => r.programmeCode === prog.code && !r.supernumeraryFlag && r.enrolmentStatus === 'ACTIVE'
                ).length;

                const isExcess = limit && regularCount > limit.approvedRegularIntake;

                return (
                  <div key={prog.code} className="p-3 hover:bg-slate-50/70 rounded transition-colors flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-900">{prog.name}</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {prog.code}
                        </span>
                      </div>
                      {isExcess ? (
                        <StatusIndicator status="BREACH" label="Intake Breach" size="sm" />
                      ) : (
                        <StatusIndicator status="COMPLIANT" label="Within Limit" size="sm" />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono text-slate-700 bg-slate-50/80 p-2.5 rounded border border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400 block font-sans">Approved Regular</span>
                        <strong className="text-sm font-semibold">{limit ? limit.approvedRegularIntake : '—'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400 block font-sans">Counted Regular</span>
                        <strong className={`text-sm font-semibold ${isExcess ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
                          {regularCount}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400 block font-sans">TFW Limit</span>
                        <strong className="text-sm font-semibold">{limit ? limit.supernumeraryLimits.tfw : '—'}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submission Filings History */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 uppercase font-mono tracking-wider">
                  Batch Filings History
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Historical records submitted by this institution</p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {instSubmissions.length} Batches
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px] p-2">
              {instSubmissions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-mono">
                  No submissions recorded yet for this institution.
                </div>
              ) : (
                instSubmissions.map((sub) => (
                  <div key={sub.id} className="p-3 hover:bg-slate-50/70 rounded transition-colors space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-900">{sub.id}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border font-medium ${
                          sub.status === 'RECONCILIATION_COMPLETE'
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : sub.status === 'REVIEW_REQUIRED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {sub.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span>Engine: <code className="text-slate-800">{sub.ruleEngineVersion}</code></span>
                      <span>Total: <strong className="text-slate-900 font-semibold">{sub.totalRows}</strong> rows</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-100">
                      <span className="text-teal-700 font-medium">✓ {sub.acceptedRows} Accepted</span>
                      <span className="text-amber-700 font-medium">⚠ {sub.flaggedRows} Flagged</span>
                      <span className="text-rose-700 font-medium">✗ {sub.rejectedRows} Rejected</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-lg">
            <button
              onClick={() => setActiveNav('submission')}
              className="w-full py-2 px-3 border border-slate-200 hover:bg-white bg-white rounded text-xs font-medium text-slate-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              Open Submission Workspace <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

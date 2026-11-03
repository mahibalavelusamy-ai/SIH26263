import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { FilterBar } from '../components/ui/FilterBar';
import {
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  FileWarning,
} from 'lucide-react';

export const AicteMonitoringView: React.FC = () => {
  const {
    institutions,
    programmes,
    intakeLimits,
    records,
    submissions,
    selectedAcademicYear,
    setSelectedAcademicYear,
    duplicateCandidates,
  } = useApp();

  const [filterInstitution, setFilterInstitution] = useState<string>('ALL');
  const [filterProgramme, setFilterProgramme] = useState<string>('ALL');
  const [filterDiscrepancyOnly, setFilterDiscrepancyOnly] = useState<boolean>(false);

  // Compute programme-level reconciliation matrix
  const matrixData = useMemo(() => {
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

        // All non-rejected enrolments for this institute + programme + academic year
        const progRecords = records.filter(
          (r) =>
            r.institutionId === limit.institutionId &&
            r.programmeCode === limit.programmeCode &&
            r.academicYear === limit.academicYear &&
            r.rowOutcome !== 'REJECTED' &&
            r.enrolmentStatus === 'ACTIVE'
        );

        // Count regular enrolments: supernumeraryFlag is false
        const regularEnrolments = progRecords.filter((r) => !r.supernumeraryFlag);
        const regularCount = regularEnrolments.length;
        const regularVariance = regularCount - limit.approvedRegularIntake;
        const regularExcess = regularVariance > 0;

        // Count supernumerary categories
        const tfwCount = progRecords.filter(
          (r) => r.supernumeraryCategory === 'TFW' || r.seatCategory === 'TFW'
        ).length;
        const tfwExcess = limit.supernumeraryLimits.tfw > 0 && tfwCount > limit.supernumeraryLimits.tfw;

        const ewsCount = progRecords.filter(
          (r) => r.supernumeraryCategory === 'EWS' || r.seatCategory === 'EWS'
        ).length;
        const ewsExcess = limit.supernumeraryLimits.ews > 0 && ewsCount > limit.supernumeraryLimits.ews;

        const lateralCount = progRecords.filter(
          (r) => r.supernumeraryCategory === 'LATERAL_ENTRY' || r.lateralEntryFlag
        ).length;

        const totalActive = progRecords.length;

        // Open exceptions related to this programme
        const openExceptions = duplicateCandidates.filter(
          (c) =>
            c.status === 'PENDING_REVIEW' &&
            ((c.recordA.institutionId === limit.institutionId && c.recordA.programmeCode === limit.programmeCode) ||
              (c.recordB.institutionId === limit.institutionId && c.recordB.programmeCode === limit.programmeCode))
        ).length;

        // Latest submission for this institute
        const latestSub = submissions
          .filter((s) => s.institutionId === limit.institutionId && s.academicYear === limit.academicYear)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        // Overall status
        let status: 'COMPLIANT' | 'REGULAR_EXCESS' | 'QUOTA_EXCESS' | 'ZERO_ENROLMENT' = 'COMPLIANT';
        if (regularCount === 0) {
          status = 'ZERO_ENROLMENT';
        } else if (regularExcess) {
          status = 'REGULAR_EXCESS';
        } else if (tfwExcess || ewsExcess) {
          status = 'QUOTA_EXCESS';
        }

        return {
          id: limit.id,
          institutionId: limit.institutionId,
          institutionCode: inst?.code || limit.institutionId,
          institutionName: inst?.name || limit.institutionId,
          programmeCode: limit.programmeCode,
          programmeName: prog?.name || limit.programmeCode,
          academicYear: limit.academicYear,
          approvedRegularIntake: limit.approvedRegularIntake,
          countedRegular: regularCount,
          regularVariance,
          regularExcess,
          tfwLimit: limit.supernumeraryLimits.tfw,
          tfwCount,
          tfwExcess,
          ewsLimit: limit.supernumeraryLimits.ews,
          ewsCount,
          lateralCount,
          totalActive,
          openExceptions,
          latestSubId: latestSub?.id || '—',
          ruleVersion: latestSub?.ruleEngineVersion || '—',
          status,
        };
      })
      .filter((row) => (filterDiscrepancyOnly ? row.status !== 'COMPLIANT' : true));
  }, [
    intakeLimits,
    records,
    institutions,
    programmes,
    submissions,
    duplicateCandidates,
    selectedAcademicYear,
    filterInstitution,
    filterProgramme,
    filterDiscrepancyOnly,
  ]);

  // CSV Export of the reconciliation report
  const handleExportCSV = () => {
    const headers = [
      'InstitutionCode',
      'InstitutionName',
      'AcademicYear',
      'ProgrammeCode',
      'ProgrammeName',
      'ApprovedRegularIntake',
      'CountedRegularEnrolment',
      'RegularVariance',
      'TFWLimit',
      'TFWReported',
      'TotalActiveEnrolment',
      'OpenExceptions',
      'ReconciliationStatus',
    ];

    const rows = matrixData.map((d) => [
      `"${d.institutionCode}"`,
      `"${d.institutionName}"`,
      `"${d.academicYear}"`,
      `"${d.programmeCode}"`,
      `"${d.programmeName}"`,
      d.approvedRegularIntake,
      d.countedRegular,
      d.regularVariance,
      d.tfwLimit,
      d.tfwCount,
      d.totalActive,
      d.openExceptions,
      `"${d.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AICTE_Intake_Reconciliation_Report_${selectedAcademicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Non-Compliance Breach Notices CSV
  const handleExportBreachNotices = () => {
    const breaches = matrixData.filter((d) => d.status === 'REGULAR_EXCESS' || d.status === 'QUOTA_EXCESS');
    if (breaches.length === 0) {
      alert('No non-compliance breaches found in current filtered selection.');
      return;
    }

    const headers = [
      'NoticeRef',
      'IssueDate',
      'InstitutionCode',
      'InstitutionName',
      'AcademicYear',
      'ProgrammeCode',
      'ProgrammeName',
      'BreachClassification',
      'ApprovedStatutoryQuota',
      'ReportedCountedEnrolment',
      'ExcessVariance',
      'MandatedAction',
    ];

    const rows = breaches.map((b, idx) => [
      `"NOTC-AICTE-${b.academicYear}-${idx + 1}"`,
      `"${new Date().toISOString().slice(0, 10)}"`,
      `"${b.institutionCode}"`,
      `"${b.institutionName}"`,
      `"${b.academicYear}"`,
      `"${b.programmeCode}"`,
      `"${b.programmeName}"`,
      `"${b.status === 'REGULAR_EXCESS' ? 'REGULAR_APPROVED_INTAKE_EXCEEDED' : 'SUPERNUMERARY_QUOTA_EXCEEDED'}"`,
      b.status === 'REGULAR_EXCESS' ? b.approvedRegularIntake : b.tfwLimit,
      b.status === 'REGULAR_EXCESS' ? b.countedRegular : b.tfwCount,
      b.status === 'REGULAR_EXCESS' ? b.regularVariance : b.tfwCount - b.tfwLimit,
      b.status === 'REGULAR_EXCESS'
        ? '"Institutional reconciliation hearing required; submission of genuine withdrawal records or revised intake approval"'
        : '"Supernumerary cap adjustment required in institutional portal"',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AICTE_Non_Compliance_Notices_${selectedAcademicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Aggregate KPI Calculations
  const totalApprovedRegular = matrixData.reduce((acc, curr) => acc + curr.approvedRegularIntake, 0);
  const totalCountedRegular = matrixData.reduce((acc, curr) => acc + curr.countedRegular, 0);
  const totalSupernumerary = matrixData.reduce((acc, curr) => acc + curr.tfwCount + curr.ewsCount + curr.lateralCount, 0);
  const compliantCount = matrixData.filter((d) => d.status === 'COMPLIANT').length;
  const complianceRate = matrixData.length > 0 ? Math.round((compliantCount / matrixData.length) * 100) : 100;
  const totalExcessSeats = matrixData.reduce((acc, curr) => (curr.regularVariance > 0 ? acc + curr.regularVariance : acc), 0);
  const totalOpenExceptions = matrixData.reduce((acc, curr) => acc + curr.openExceptions, 0);

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <PageHeader
        breadcrumbs={[
          { label: 'IDVERA' },
          { label: 'Regulatory Oversight' },
          { label: 'Intake Monitoring' },
        ]}
        title="Programme-Level Intake Monitoring"
        subtitle="Programme-level seat allocation reconciliation comparing configured regular intake limits against reported active student rosters."
        badge={
          <span className="font-mono text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-medium">
            AICTE STATUTORY LEDGER
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBreachNotices}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-xs font-medium transition-colors shadow-xs"
            >
              <FileWarning className="w-3.5 h-3.5 text-rose-600" />
              Export Breach Notices
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Export Intake Ledger
            </button>
          </div>
        }
      />

      {/* Executive KPI Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Approved Regular"
          value={totalApprovedRegular}
          subValue="AICTE approved ceiling"
        />
        <MetricCard
          label="Counted Regular"
          value={totalCountedRegular}
          subValue="Active non-supernumerary"
          tone="indigo"
        />
        <MetricCard
          label="Regular Excess"
          value={totalExcessSeats > 0 ? `+${totalExcessSeats}` : '0'}
          subValue={totalExcessSeats > 0 ? 'Breach detected' : 'Fully compliant'}
          trend={{
            value: totalExcessSeats > 0 ? 'Breach' : 'Compliant',
            isNegative: totalExcessSeats > 0,
            isPositive: totalExcessSeats === 0,
          }}
          tone={totalExcessSeats > 0 ? 'rose' : 'teal'}
        />
        <MetricCard
          label="Supernumerary"
          value={totalSupernumerary}
          subValue="TFW, EWS, Lateral seats"
        />
        <MetricCard
          label="Compliance Rate"
          value={`${complianceRate}%`}
          subValue={`${compliantCount}/${matrixData.length} compliant`}
          trend={{
            value: `${complianceRate}%`,
            isPositive: complianceRate >= 80,
          }}
          tone="teal"
        />
        <MetricCard
          label="Open Exceptions"
          value={totalOpenExceptions}
          subValue="Pending TPER review"
          tone="amber"
        />
      </div>

      {/* Regulatory Dual Accounting Notice */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-900 block font-mono text-[11px] uppercase tracking-wide">
            Dual Quota Accounting Principle (Statutory Separation)
          </span>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Regular approved intake and supernumerary quotas (Tuition Fee Waiver, Economically Weaker Section, Lateral Entry) are non-fungible and counted independently. If a programme exceeds its regular quota, the aggregate discrepancy is logged as an institutional finding; individual students are not arbitrarily declared invalid.
          </p>
        </div>
      </div>

      {/* Filter Ribbon */}
      <FilterBar
        filters={[
          {
            id: 'ay',
            label: 'Academic Year',
            value: selectedAcademicYear,
            onChange: setSelectedAcademicYear,
            options: [
              { label: 'AY 2026-27', value: '2026-27' },
              { label: 'AY 2025-26', value: '2025-26' },
            ],
          },
          {
            id: 'institution',
            label: 'Institution',
            value: filterInstitution,
            onChange: setFilterInstitution,
            width: '180px',
            options: [
              { label: 'All Institutions', value: 'ALL' },
              ...institutions.map((i) => ({ label: `${i.code} — ${i.name}`, value: i.id })),
            ],
          },
          {
            id: 'programme',
            label: 'Programme',
            value: filterProgramme,
            onChange: setFilterProgramme,
            options: [
              { label: 'All Programmes', value: 'ALL' },
              ...programmes.map((p) => ({ label: p.code, value: p.code })),
            ],
          },
        ]}
        rightAction={
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={filterDiscrepancyOnly}
              onChange={(e) => setFilterDiscrepancyOnly(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
            />
            <span>Show Discrepancies Only</span>
          </label>
        }
      />

      {/* Programme Reconciliation Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Institution & Programme</th>
                <th className="py-2.5 px-3 text-right">Approved Regular</th>
                <th className="py-2.5 px-3 text-right">Counted Regular</th>
                <th className="py-2.5 px-3 text-right">Regular Variance</th>
                <th className="py-2.5 px-3 text-right">TFW Limit / Rep</th>
                <th className="py-2.5 px-3 text-right">Total Active</th>
                <th className="py-2.5 px-3 text-center">Exceptions</th>
                <th className="py-2.5 px-3">Latest Filing</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400 font-mono">
                    No programmes matching the selected criteria.
                  </td>
                </tr>
              ) : (
                matrixData.map((row) => {
                  const isRegularExcess = row.regularExcess;
                  const isTfwExcess = row.tfwExcess;

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isRegularExcess ? 'bg-rose-50/20' : isTfwExcess ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{row.institutionName}</div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="text-blue-700 font-semibold">{row.programmeCode}</span>
                          <span>·</span>
                          <span>AY {row.academicYear}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 font-medium">
                        {row.approvedRegularIntake}
                      </td>

                      <td
                        className={`py-2.5 px-3 text-right font-mono font-semibold ${
                          isRegularExcess ? 'text-rose-700' : 'text-slate-900'
                        }`}
                      >
                        {row.countedRegular}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono">
                        {row.regularVariance > 0 ? (
                          <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            +{row.regularVariance} Excess
                          </span>
                        ) : row.regularVariance === 0 ? (
                          <span className="text-teal-700 font-medium">0 (Full)</span>
                        ) : (
                          <span className="text-slate-500 font-medium">{row.regularVariance}</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        <span>{row.tfwLimit}</span> /{' '}
                        <span className={isTfwExcess ? 'text-amber-700 font-semibold' : 'text-slate-900'}>
                          {row.tfwCount}
                        </span>
                        {isTfwExcess && <span className="ml-1 text-[10px] text-amber-600 font-semibold">(+Excess)</span>}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {row.totalActive}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {row.openExceptions > 0 ? (
                          <span className="font-mono text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {row.openExceptions} Open
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        <div>{row.latestSubId}</div>
                        <div className="text-[10px] text-slate-400">Engine {row.ruleVersion}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        {row.status === 'COMPLIANT' && (
                          <StatusIndicator status="COMPLIANT" label="COMPLIANT" size="sm" />
                        )}
                        {row.status === 'REGULAR_EXCESS' && (
                          <StatusIndicator status="BREACH" label="REGULAR EXCESS" size="sm" />
                        )}
                        {row.status === 'QUOTA_EXCESS' && (
                          <StatusIndicator status="FLAGGED" label="QUOTA EXCESS" size="sm" />
                        )}
                        {row.status === 'ZERO_ENROLMENT' && (
                          <StatusIndicator status="PENDING" label="ZERO ENROLLED" size="sm" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

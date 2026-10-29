import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { claimService } from '../services/claimService';
import { documentService } from '../services/documentService';
import { useAuth } from '../hooks/useAuth';
import { ClaimStatusBadge } from '../components/ClaimStatusBadge';
import { TimelineView } from '../components/TimelineView';
import { DocumentViewer } from '../components/DocumentViewer';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Shield,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  ArrowLeft,
  UserCheck,
  Send,
  Building,
  CreditCard,
  HelpCircle,
  Check
} from 'lucide-react';

export const ClaimDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isPolicyholder, isOfficer, isInvestigator, isApprover, isFinance, isAdmin } = useAuth();

  const [claim, setClaim] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState(
    location.search.includes('new=true') ? 'Claim successfully submitted and queued for intake!' : ''
  );

  // Modals state
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [missingInfoText, setMissingInfoText] = useState('');

  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReasonText, setFlagReasonText] = useState('');

  const [showFindingsModal, setShowFindingsModal] = useState(false);
  const [findingsText, setFindingsText] = useState('');
  const [clearFlagChoice, setClearFlagChoice] = useState(true);

  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState('APPROVE');
  const [decisionReasonText, setDecisionReasonText] = useState('');
  const [approvedAmountInput, setApprovedAmountInput] = useState('');

  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementStatusChoice, setSettlementStatusChoice] = useState('Paid');
  const [transactionRefInput, setTransactionRefInput] = useState('');
  const [paymentMethodChoice, setPaymentMethodChoice] = useState('Direct Deposit');
  const [failureReasonInput, setFailureReasonInput] = useState('');

  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchClaimData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const [claimRes, docRes] = await Promise.all([
        claimService.getClaimById(id),
        documentService.getClaimDocuments(id)
      ]);

      if (claimRes.success) {
        setClaim(claimRes.claim);
        setApprovedAmountInput(claimRes.claim.claimedAmount?.toString() || '');
        if (claimRes.claim.settlementDetails?.transactionReference) {
          setTransactionRefInput(claimRes.claim.settlementDetails.transactionReference);
        }
      }
      if (docRes.success) {
        setDocuments(docRes.documents || []);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to retrieve claim details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimData();
  }, [id]);

  // Claims Officer starts review
  const handleStartReview = async () => {
    try {
      setSubmittingAction(true);
      await claimService.updateStatus(id, {
        status: 'Under Review',
        comment: 'Claims officer assigned. Formal document inspection initiated.'
      });
      setActionSuccessMsg("Claim status updated to 'Under Review'.");
      fetchClaimData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to transition claim.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Claims Officer requests missing info
  const handleRequestInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      await claimService.requestMissingInfo(id, { missingInfoRequested: missingInfoText });
      setShowRequestInfoModal(false);
      setMissingInfoText('');
      setActionSuccessMsg("Requested additional documents/clarification from policyholder.");
      fetchClaimData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request missing info.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Claims Officer/Investigator flags claim
  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      await claimService.flagFraudRisk(id, { reason: flagReasonText });
      setShowFlagModal(false);
      setFlagReasonText('');
      setActionSuccessMsg("Claim flagged for risk investigation and forwarded to the Special Investigations Unit.");
      fetchClaimData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to flag claim.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Investigator submits findings
  const handleFindingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      await claimService.submitInvestigationFindings(id, {
        findings: findingsText,
        clearFlag: clearFlagChoice
      });
      setShowFindingsModal(false);
      setFindingsText('');
      setActionSuccessMsg("Investigation findings saved. Claim returned to 'Under Review' for decision.");
      fetchClaimData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record findings.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Approver decision (Approve/Reject)
  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      await claimService.decideClaim(id, {
        decision: decisionType,
        decisionReason: decisionReasonText,
        approvedAmount: decisionType === 'APPROVE' ? parseFloat(approvedAmountInput) : undefined
      });
      setShowDecisionModal(false);
      setDecisionReasonText('');
      setActionSuccessMsg(`Claim successfully ${decisionType === 'APPROVE' ? 'Approved' : 'Rejected'}.`);
      fetchClaimData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register decision.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Finance staff updates settlement
  const handleSettlementSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      await claimService.updateSettlement(id, {
        status: settlementStatusChoice,
        transactionReference: transactionRefInput,
        paymentMethod: paymentMethodChoice,
        failureReason: failureReasonInput
      });
      setShowSettlementModal(false);
      setActionSuccessMsg(`Settlement status updated to '${settlementStatusChoice}'.`);
      fetchClaimData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update settlement.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Policyholder resubmission after correction
  const handleResubmitCorrection = async () => {
    try {
      setSubmittingAction(true);
      await claimService.updateStatus(id, {
        status: 'Under Review',
        comment: 'Policyholder uploaded requested documentation for re-evaluation.'
      });
      setActionSuccessMsg("Claim resubmitted for officer review.");
      fetchClaimData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resubmit claim.');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading claim dossier and audit timeline..." size="lg" />;
  }

  if (errorMsg || !claim) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-red-900">Access Restricted or Not Found</h2>
        <p className="text-xs text-red-700 mt-1">{errorMsg || 'The requested claim could not be retrieved.'}</p>
        <Link
          to="/claims"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Claims List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/claims')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Back to Claims"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">{claim.claimReference}</h1>
              <ClaimStatusBadge status={claim.status} />
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Sample Record
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Category: <span className="font-semibold text-slate-700">{claim.category}</span> • Submitted on{' '}
              {new Date(claim.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Amount Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/90 rounded-xl px-4 py-2 shadow-sm text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Claimed Loss</span>
            <p className="text-lg font-black text-slate-900 leading-tight">
              ${claim.claimedAmount?.toLocaleString()} <span className="text-xs font-normal text-slate-400">{claim.currency}</span>
            </p>
          </div>
          {claim.approvedAmount !== null && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 shadow-sm text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Approved Payout</span>
              <p className="text-lg font-black text-emerald-800 leading-tight">
                ${claim.approvedAmount?.toLocaleString()} <span className="text-xs font-normal text-emerald-600">{claim.currency}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg('')}
            className="text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role Action Banners & Workflows */}
      {/* 1. Policyholder action when Needs Correction */}
      {isPolicyholder && claim.status === 'Needs Correction' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">Additional Information Required</h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                The claims officer reviewed your claim and requested the following clarification:
              </p>
              <div className="mt-2 p-3 bg-white/80 rounded-lg border border-amber-200 text-xs font-medium text-slate-800">
                "{claim.missingInfoRequested}"
              </div>
              <p className="text-xs text-amber-700 mt-2">
                Please upload the requested document below, then click "Resubmit Claim for Review".
              </p>
              <button
                type="button"
                onClick={handleResubmitCorrection}
                disabled={submittingAction}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition"
              >
                <Send className="w-3.5 h-3.5" /> Resubmit Claim for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Claims Officer Action Panel */}
      {(isOfficer || isAdmin) && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Claims Officer Workspace</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Assessment & Verification Controls</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {claim.status === 'Submitted' && (
                <button
                  type="button"
                  onClick={handleStartReview}
                  disabled={submittingAction}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition"
                >
                  Start Formal Review
                </button>
              )}

              {claim.status === 'Under Review' && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRequestInfoModal(true)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                  >
                    Request Missing Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFlagModal(true)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                  >
                    Flag Fraud Risk
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Investigator Workspace */}
      {(isInvestigator || isAdmin) && claim.status === 'Under Investigation' && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Special Investigations Unit</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Active Fraud Risk Examination</h3>
              <p className="text-xs text-rose-800 mt-1">
                Reason for flag: <span className="font-semibold italic">"{claim.fraudRiskFlag?.reason}"</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFindingsModal(true)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition shrink-0"
            >
              Record Investigation Findings
            </button>
          </div>
        </div>
      )}

      {/* 4. Approver Action Panel */}
      {(isApprover || isAdmin) && claim.status === 'Under Review' && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Underwriting & Approvals Desk</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Final Claim Adjudication</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Eligible for decision. Approve with calculated payout amount or reject with formal exclusion clause.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDecisionModal(true)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shrink-0 shadow-sm"
            >
              Make Decision (Approve / Reject)
            </button>
          </div>
        </div>
      )}

      {/* 5. Finance Staff Settlement Panel */}
      {(isFinance || isAdmin) && (claim.status === 'Settlement Pending' || claim.status === 'Approved' || claim.status === 'Settled') && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Disbursements & Treasury Desk</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                Settlement Status: {claim.settlementDetails?.status || 'Pending'}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Approved amount: <strong>${claim.approvedAmount?.toLocaleString()}</strong> • Method:{' '}
                {claim.settlementDetails?.paymentMethod}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSettlementModal(true)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition shrink-0 shadow-sm"
            >
              Update Disbursement Status
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Details + Documents vs Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Policy, Incident, Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Policy Information Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Shield className="w-4 h-4 text-brand-600" />
              <span>Covered Policy Details</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-1">
              <div>
                <span className="text-slate-400 font-medium">Policy Reference</span>
                <p className="font-bold text-slate-900">{claim.policyId?.policyNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Plan Name</span>
                <p className="font-bold text-slate-900">{claim.policyId?.planName || 'Comprehensive'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Coverage Limit</span>
                <p className="font-bold text-slate-900">
                  ${claim.policyId?.coverageDetails?.maxCoverageLimit?.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Deductible</span>
                <p className="font-bold text-slate-900">${claim.policyId?.coverageDetails?.deductible}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Vehicle / Asset</span>
                <p className="font-bold text-slate-900">
                  {claim.policyId?.vehicleDetails?.make
                    ? `${claim.policyId.vehicleDetails.year} ${claim.policyId.vehicleDetails.make} ${claim.policyId.vehicleDetails.model}`
                    : 'Insured Asset'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Policyholder</span>
                <p className="font-bold text-slate-900">{claim.policyholderId?.fullName}</p>
              </div>
            </div>
          </div>

          {/* Incident Details Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>Incident Report</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-slate-400 font-medium">Date of Occurrence</span>
                  <p className="font-bold text-slate-900">
                    {new Date(claim.incidentDate).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Incident Location</span>
                  <p className="font-bold text-slate-900">{claim.incidentLocation}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Loss & Damage Description</span>
                <div className="mt-1 p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-800 leading-relaxed">
                  {claim.incidentDescription}
                </div>
              </div>
            </div>
          </div>

          {/* Decision Reason or Fraud Risk Findings (if any) */}
          {claim.decisionReason && (
            <div className={`p-5 rounded-xl border ${claim.status === 'Rejected' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">Formal Adjudication Decision</span>
              <h4 className="text-sm font-bold mt-0.5">
                {claim.status === 'Rejected' ? 'Rejection Determination' : 'Approval Determination'}
              </h4>
              <p className="text-xs mt-1 leading-relaxed">"{claim.decisionReason}"</p>
              {claim.decidedBy && (
                <p className="text-[11px] mt-2 opacity-75">
                  Determined by {claim.decidedBy.fullName} ({claim.decidedBy.role}) on{' '}
                  {claim.decidedAt ? new Date(claim.decidedAt).toLocaleDateString() : 'N/A'}
                </p>
              )}
            </div>
          )}

          {claim.fraudRiskFlag?.findings && (
            <div className="p-5 rounded-xl border bg-slate-50 border-slate-200 text-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                Special Investigations Report
              </span>
              <h4 className="text-sm font-bold mt-0.5">Findings & Risk Assessment</h4>
              <p className="text-xs mt-1 leading-relaxed italic">"{claim.fraudRiskFlag.findings}"</p>
              {claim.fraudRiskFlag.clearedAt && (
                <p className="text-[11px] mt-2 text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Risk flag evaluated and cleared on{' '}
                  {new Date(claim.fraudRiskFlag.clearedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Documents Section */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <DocumentViewer
              claimId={claim._id}
              documents={documents}
              onRefresh={fetchClaimData}
              canUpload={isPolicyholder || isAdmin || isOfficer}
              canVerify={isOfficer || isAdmin}
            />
          </div>
        </div>

        {/* Right Column: Workflow Timeline & Settlement Summary */}
        <div className="space-y-6">
          {/* Settlement Details Card (if applicable) */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>Simulated Settlement</span>
            </div>

            <div className="text-xs space-y-2.5">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-400">Payment Status</span>
                <span className="font-bold text-slate-800">
                  {claim.settlementDetails?.status || 'Not Applicable'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-400">Transaction Ref</span>
                <span className="font-mono text-[11px] font-bold text-slate-700 truncate max-w-[150px]">
                  {claim.settlementDetails?.transactionReference || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-400">Payout Method</span>
                <span className="font-medium text-slate-800">
                  {claim.settlementDetails?.paymentMethod || 'Simulated Clearinghouse'}
                </span>
              </div>
              {claim.settlementDetails?.paymentDate && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-400">Disbursed On</span>
                  <span className="font-medium text-slate-800">
                    {new Date(claim.settlementDetails.paymentDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Timeline Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Audit & Transition History</span>
            </div>
            <TimelineView timeline={claim.timeline} />
          </div>
        </div>
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* Modal: Request Missing Information */}
      <Modal
        isOpen={showRequestInfoModal}
        onClose={() => setShowRequestInfoModal(false)}
        title="Request Missing Information"
        subtitle="The claim will be placed into 'Needs Correction' until the policyholder submits the requested details."
      >
        <form onSubmit={handleRequestInfoSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Required Documents or Clarifications
            </label>
            <textarea
              rows="3"
              required
              minLength={5}
              placeholder="e.g. Please upload an itemized repair estimate from a licensed body shop and an official police incident report number."
              value={missingInfoText}
              onChange={(e) => setMissingInfoText(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            ></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowRequestInfoModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Send Request to Policyholder
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Flag Fraud Risk */}
      <Modal
        isOpen={showFlagModal}
        onClose={() => setShowFlagModal(false)}
        title="Flag for Fraud Risk Investigation"
        subtitle="This will flag the claim and transition it to 'Under Investigation' for examination by the Special Investigations Unit. (Note: Flagging does not automatically reject the claim)."
      >
        <form onSubmit={handleFlagSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Raising Fraud Risk Flag
            </label>
            <textarea
              rows="3"
              required
              minLength={5}
              placeholder="e.g. Discrepancy between damage photographs and recorded police incident sketch; claimed amount exceeds typical rate schedule."
              value={flagReasonText}
              onChange={(e) => setFlagReasonText(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
            ></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowFlagModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            >
              Confirm Fraud Risk Flag
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Investigation Findings */}
      <Modal
        isOpen={showFindingsModal}
        onClose={() => setShowFindingsModal(false)}
        title="Record Investigation Findings"
        subtitle="Submit findings to conclude the investigation phase. The claim will be returned to 'Under Review' for decision by an approver."
      >
        <form onSubmit={handleFindingsSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Investigation Findings & Adjuster Notes
            </label>
            <textarea
              rows="4"
              required
              minLength={10}
              placeholder="Detail site inspection results, vendor invoice verification, and forensic damage consistency analysis..."
              value={findingsText}
              onChange={(e) => setFindingsText(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            ></textarea>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="clearFlag"
              checked={clearFlagChoice}
              onChange={(e) => setClearFlagChoice(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="clearFlag" className="text-xs text-slate-700 font-medium">
              Clear Fraud Risk Flag (mark risk inquiry resolved)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowFindingsModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Submit Findings & Return to Review
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Approver Decision */}
      <Modal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        title="Make Adjudication Decision"
        subtitle="Issue formal approval or rejection decision. Approving will automatically advance claim to 'Settlement Pending'."
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Decision Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecisionType('APPROVE')}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  decisionType === 'APPROVE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Approve Claim
              </button>
              <button
                type="button"
                onClick={() => setDecisionType('REJECT')}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  decisionType === 'REJECT'
                    ? 'border-red-600 bg-red-50 text-red-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-red-600" /> Reject Claim
              </button>
            </div>
          </div>

          {decisionType === 'APPROVE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Approved Disbursement Amount ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={approvedAmountInput}
                  onChange={(e) => setApprovedAmountInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Decision Reason / Policy Clause Reference
            </label>
            <textarea
              rows="3"
              required
              minLength={5}
              placeholder="e.g. Approved per Section 2.1 collision coverage after deduction of $250 deductible."
              value={decisionReasonText}
              onChange={(e) => setDecisionReasonText(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowDecisionModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg text-white disabled:opacity-50 ${
                decisionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Confirm {decisionType === 'APPROVE' ? 'Approval' : 'Rejection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Update Settlement */}
      <Modal
        isOpen={showSettlementModal}
        onClose={() => setShowSettlementModal(false)}
        title="Update Simulated Settlement Status"
        subtitle="Manage disbursement execution. Marking 'Paid' advances the claim status to 'Settled'."
      >
        <form onSubmit={handleSettlementSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Settlement Status</label>
            <select
              value={settlementStatusChoice}
              onChange={(e) => setSettlementStatusChoice(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Paid">Paid (Disbursed)</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Method</label>
            <select
              value={paymentMethodChoice}
              onChange={(e) => setPaymentMethodChoice(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="Direct Deposit">Direct Deposit</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Simulated Clearinghouse">Simulated Clearinghouse</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Simulated Transaction Reference {settlementStatusChoice === 'Paid' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              required={settlementStatusChoice === 'Paid'}
              placeholder="e.g. SIM-ACH-20261028-11234"
              value={transactionRefInput}
              onChange={(e) => setTransactionRefInput(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          {settlementStatusChoice === 'Failed' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Failure Reason *</label>
              <input
                type="text"
                required
                placeholder="e.g. Invalid routing number or bank account closed"
                value={failureReasonInput}
                onChange={(e) => setFailureReasonInput(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowSettlementModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              Save Settlement Update
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


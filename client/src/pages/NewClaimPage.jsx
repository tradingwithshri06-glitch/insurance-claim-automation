import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { policyService } from '../services/policyService';
import { claimService } from '../services/claimService';
import { documentService } from '../services/documentService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Shield,
  Calendar,
  MapPin,
  FileText,
  DollarSign,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Car,
  Home
} from 'lucide-react';

export const NewClaimPage = () => {
  const navigate = useNavigate();

  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [category, setCategory] = useState('Motor Insurance');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [claimedAmount, setClaimedAmount] = useState('');

  // Optional document upload
  const [supportingFile, setSupportingFile] = useState(null);
  const [documentType, setDocumentType] = useState('Damage Photograph');

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoadingPolicies(true);
        const res = await policyService.getPolicies();
        if (res.success && res.policies?.length > 0) {
          const activePolicies = res.policies.filter((p) => p.status === 'Active');
          setPolicies(activePolicies);
          if (activePolicies.length > 0) {
            setSelectedPolicyId(activePolicies[0]._id);
            setCategory(activePolicies[0].category || 'Motor Insurance');
          }
        }
      } catch (err) {
        setErrorMsg('Unable to retrieve your insurance policies.');
      } finally {
        setLoadingPolicies(false);
      }
    };

    fetchPolicies();
  }, []);

  const selectedPolicy = policies.find((p) => p._id === selectedPolicyId);

  const handlePolicyChange = (e) => {
    const pId = e.target.value;
    setSelectedPolicyId(pId);
    const pol = policies.find((p) => p._id === pId);
    if (pol) {
      setCategory(pol.category || 'Motor Insurance');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedPolicyId) {
      setErrorMsg('Please select an active policy.');
      return;
    }

    if (new Date(incidentDate) > new Date()) {
      setErrorMsg('Incident date cannot be in the future.');
      return;
    }

    const amount = parseFloat(claimedAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid claimed amount greater than zero.');
      return;
    }

    if (selectedPolicy && amount > (selectedPolicy.coverageDetails?.maxCoverageLimit || 999999)) {
      if (
        !window.confirm(
          `Notice: Claimed amount ($${amount}) exceeds the policy maximum limit of $${selectedPolicy.coverageDetails?.maxCoverageLimit}. Do you still wish to submit?`
        )
      ) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const claimRes = await claimService.createClaim({
        policyId: selectedPolicyId,
        category,
        incidentDate,
        incidentLocation,
        incidentDescription,
        claimedAmount: amount
      });

      if (claimRes.success && claimRes.claim) {
        const createdClaimId = claimRes.claim._id;

        // If file was attached, upload it directly to the new claim
        if (supportingFile) {
          const formData = new FormData();
          formData.append('claimId', createdClaimId);
          formData.append('file', supportingFile);
          formData.append('documentType', documentType);
          formData.append('notes', 'Uploaded during initial claim submission');
          await documentService.uploadDocument(formData);
        }

        navigate(`/claims/${createdClaimId}?new=true`);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit claim. Please verify your entries.');
      setSubmitting(false);
    }
  };

  if (loadingPolicies) {
    return <LoadingSpinner label="Loading policy coverage records..." size="lg" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Submit an Insurance Claim</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete the incident report and attach supporting photos or estimates to initiate automated processing.
        </p>
      </div>

      {policies.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-amber-900">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold">No Active Insurance Policies Found</h3>
          <p className="text-xs text-amber-700 mt-1">
            You do not currently have an active policy enrolled to submit a claim against.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Policy Selection Section */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Shield className="w-4 h-4 text-brand-600" />
              <span>1. Choose Covered Policy</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Policy</label>
              <select
                value={selectedPolicyId}
                onChange={handlePolicyChange}
                required
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {policies.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.policyNumber} — {p.planName} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Policy Details Summary */}
            {selectedPolicy && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Max Limit</span>
                  <p className="font-bold text-slate-800">
                    ${selectedPolicy.coverageDetails?.maxCoverageLimit?.toLocaleString()} {selectedPolicy.coverageDetails?.currency}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Deductible</span>
                  <p className="font-bold text-slate-800">
                    ${selectedPolicy.coverageDetails?.deductible} {selectedPolicy.coverageDetails?.currency}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Insured Asset</span>
                  <p className="font-bold text-slate-800 truncate">
                    {selectedPolicy.vehicleDetails?.make
                      ? `${selectedPolicy.vehicleDetails.year} ${selectedPolicy.vehicleDetails.make} ${selectedPolicy.vehicleDetails.model}`
                      : selectedPolicy.propertyDetails?.address || 'Demonstration Asset'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Incident Details Section */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>2. Incident Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Incident Date & Time
                </label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Claim Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 1850.00"
                    value={claimedAmount}
                    onChange={(e) => setClaimedAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Interstate 80 East, Exit 42, Sacramento, CA"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Description & Sequence of Events
              </label>
              <textarea
                rows="4"
                required
                minLength={10}
                placeholder="Provide a detailed, factual account of the incident, impact locations, damages observed, and third parties involved..."
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              ></textarea>
            </div>
          </div>

          {/* Supporting Evidence Attachment */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <UploadCloud className="w-4 h-4 text-brand-600" />
              <span>3. Supporting Evidence (Optional Attachment)</span>
            </div>

            <p className="text-xs text-slate-500">
              You can attach a repair estimate, damage photograph, or police incident report now. Additional files can also be added after submission.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Damage Photograph">Damage Photograph</option>
                  <option value="Repair Estimate">Repair Estimate</option>
                  <option value="Police Report">Police Report</option>
                  <option value="Identity Proof">Identity Proof</option>
                  <option value="Other Supporting Document">Other Supporting Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Choose File (PDF/Image)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setSupportingFile(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/claims')}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {submitting ? 'Submitting Claim...' : 'Submit Claim for Review'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};


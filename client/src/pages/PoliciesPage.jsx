import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { policyService } from '../services/policyService';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Shield, Car, Home, PlusCircle, CheckCircle, AlertCircle, FilePlus2 } from 'lucide-react';

export const PoliciesPage = () => {
  const { isPolicyholder, isAdmin } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await policyService.getPolicies();
      if (res.success) {
        setPolicies(res.policies || []);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load policy records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isPolicyholder ? 'My Insurance Policies' : 'Insurance Policy Directory'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstration policy records registered with policyholder coverage limits and covered assets.
          </p>
        </div>

        {(isPolicyholder || isAdmin) && (
          <Link
            to="/claims/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
          >
            <FilePlus2 className="w-4 h-4" /> File a Claim
          </Link>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16">
          <LoadingSpinner label="Fetching insurance policies..." />
        </div>
      ) : policies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No active insurance policies registered</h3>
          <p className="text-xs text-slate-400 mt-1">Demonstration policies can be seeded or created by administrators.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {policies.map((p) => {
            const isMotor = p.category === 'Motor Insurance';
            return (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                        {isMotor ? <Car className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-brand-600">{p.policyNumber}</span>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">{p.category}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle className="w-3 h-3" /> {p.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-3">{p.planName}</h3>

                  {/* Vehicle or Property Specs */}
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
                    {p.vehicleDetails?.make ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Vehicle:</span>
                          <span className="font-bold text-slate-800">
                            {p.vehicleDetails.year} {p.vehicleDetails.make} {p.vehicleDetails.model}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">License Plate:</span>
                          <span className="font-mono font-medium text-slate-700">
                            {p.vehicleDetails.registrationNumber || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">VIN:</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {p.vehicleDetails.vinNumber || 'N/A'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Property:</span>
                        <span className="font-medium text-slate-800">
                          {p.propertyDetails?.address || 'Sample Real Estate'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Coverage Limits */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-brand-50/50 border border-brand-100 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Max Coverage</span>
                      <p className="font-black text-brand-900 mt-0.5">
                        ${p.coverageDetails?.maxCoverageLimit?.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Deductible</span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        ${p.coverageDetails?.deductible}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Expires: {new Date(p.endDate).toLocaleDateString()}
                  </span>

                  {(isPolicyholder || isAdmin) && (
                    <Link
                      to="/claims/new"
                      className="font-bold text-brand-600 hover:text-brand-800 transition"
                    >
                      File Claim →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


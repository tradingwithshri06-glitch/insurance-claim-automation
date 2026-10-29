import React, { useState } from 'react';
import { FileText, Download, CheckCircle, AlertCircle, UploadCloud, Loader2 } from 'lucide-react';
import { documentService } from '../services/documentService';

export const DocumentViewer = ({
  claimId,
  documents = [],
  onRefresh,
  canUpload = true,
  canVerify = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('Damage Photograph');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleDownload = async (doc) => {
    try {
      setDownloadingId(doc._id);
      await documentService.downloadDocument(doc._id, doc.originalName);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download document.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedFile) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 5MB maximum limit.');
      return;
    }

    const formData = new FormData();
    formData.append('claimId', claimId);
    formData.append('file', selectedFile);
    formData.append('documentType', documentType);
    formData.append('notes', notes);

    try {
      setUploading(true);
      await documentService.uploadDocument(formData);
      setSuccessMsg('Document successfully uploaded.');
      setSelectedFile(null);
      setNotes('');
      setShowUploadModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (docId, currentVerified) => {
    try {
      await documentService.verifyDocument(docId, { isVerified: !currentVerified });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification update failed.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Attached Documents</h3>
          <p className="text-xs text-slate-500">Supporting proof, police reports, and repair estimates.</p>
        </div>
        {canUpload && (
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Document
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">No documents uploaded yet</p>
          <p className="text-xs text-slate-400 mt-1">Upload incident photos or repair estimates to support this claim.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-300 transition shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-brand-50 text-brand-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-900 truncate" title={doc.originalName}>
                      {doc.originalName}
                    </p>
                    {doc.isVerified ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Unverified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{doc.documentType}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                  {doc.notes && (
                    <p className="text-[11px] text-slate-600 mt-1 italic line-clamp-2">"{doc.notes}"</p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc._id}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition disabled:opacity-50"
                >
                  {downloadingId === doc._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Download
                </button>

                {canVerify && (
                  <button
                    type="button"
                    onClick={() => handleVerify(doc._id, doc.isVerified)}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded transition ${
                      doc.isVerified
                        ? 'text-slate-600 hover:text-slate-900 bg-slate-100'
                        : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50'
                    }`}
                  >
                    {doc.isVerified ? 'Mark Unverified' : 'Verify Document'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900">Upload Supporting Document</h3>
            <p className="text-xs text-slate-500 mt-1">
              Accepted formats: PDF, JPEG, PNG, WEBP (Max 5MB). Files are securely encrypted and stored privately.
            </p>

            {errorMsg && (
              <div className="mt-3 p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Police Report">Police Report</option>
                  <option value="Damage Photograph">Damage Photograph</option>
                  <option value="Repair Estimate">Repair Estimate</option>
                  <option value="Medical Report">Medical Report</option>
                  <option value="Identity Proof">Identity Proof</option>
                  <option value="Payment Receipt / Invoice">Payment Receipt / Invoice</option>
                  <option value="Other Supporting Document">Other Supporting Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Choose File</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Estimate from authorized dealership detailing front bumper replacement"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition disabled:opacity-50"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {uploading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


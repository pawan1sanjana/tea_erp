import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Save, RotateCcw, Camera, Fingerprint, Info, X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

export default function WorkerRegistration() {
  const [formData, setFormData] = useState({
    worker_id: '',
    full_name_initials: '',
    first_name: '',
    last_name: '',
    nic: '',
    address: '',
    tel: '',
    emergency_tel: '',
    emergency_contact_name: '',
    wage_type: 'permanent',
    photo: null,
    nic_front: null,
    nic_back: null
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturingField, setCapturingField] = useState(null); // 'photo', 'nic_front', 'nic_back'
  const [showStatus, setShowStatus] = useState(null); // { type, message }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    generateWorkerId();
  }, []);

  const generateWorkerId = () => {
    const id = 'WKR-' + Math.floor(10000 + Math.random() * 90000);
    setFormData(prev => ({ ...prev, worker_id: id }));
  };

  const startCamera = async (field = 'photo') => {
    setCapturingField(field);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: field === 'photo' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setShowStatus({ type: 'error', message: "Could not access camera. Please check permissions." });
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCapturingField(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && capturingField) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const photoData = canvasRef.current.toDataURL('image/jpeg', 0.8);
      setFormData(prev => ({ ...prev, [capturingField]: photoData }));
      stopCamera();
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.photo) {
      setShowStatus({ type: 'error', message: 'REQUIRED: A worker identity photo must be captured.' });
      return;
    }
    if (!formData.nic_front || !formData.nic_back) {
      setShowStatus({ type: 'error', message: 'REQUIRED: Both sides of the NIC must be captured.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/workforce/register', formData);
      
      setShowStatus({ type: 'success', message: 'Worker Registered Successfully! Data saved to SQL database.' });
      
      // Reset form after success
      setFormData({
        worker_id: '',
        full_name_initials: '',
        first_name: '',
        last_name: '',
        nic: '',
        address: '',
        tel: '',
        emergency_tel: '',
        emergency_contact_name: '',
        wage_type: 'permanent',
        photo: null,
        nic_front: null,
        nic_back: null
      });
      generateWorkerId();

      setTimeout(() => setShowStatus(null), 5000);
    } catch (error) {
      console.error('Registration error:', error);
      setShowStatus({ type: 'error', message: error.message || 'Failed to save data to database.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative">
      {/* Floating Status Notification */}
      {showStatus && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-slide-in-right transform transition-all ${
          showStatus.type === 'success' 
            ? 'bg-emerald-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {showStatus.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
              {showStatus.type === 'success' ? 'Success' : 'Attention Required'}
            </span>
            <span className="text-sm font-bold">{showStatus.message}</span>
          </div>
          <button onClick={() => setShowStatus(null)} className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Unified Camera Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={stopCamera}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-xs">
                Capturing: {capturingField?.replace('_', ' ')}
              </h3>
              <button onClick={stopCamera} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${capturingField === 'photo' ? 'scale-x-[-1]' : ''}`}
              />
              <div className="absolute inset-0 pointer-events-none border-2 border-tea-500/30 m-8 rounded-2xl"></div>
            </div>

            <div className="p-6 flex justify-center gap-4 bg-slate-50 dark:bg-slate-950">
              <button
                onClick={stopCamera}
                className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="bg-tea-600 text-white px-10 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-tea-500/20"
              >
                <div className="w-4 h-4 rounded-full border-2 border-white/50 bg-white" />
                Capture Image
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-outfit">Worker Registration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Onboard new field personnel to the plantation database</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFormData({
                worker_id: '',
                full_name_initials: '',
                first_name: '',
                last_name: '',
                nic: '',
                address: '',
                tel: '',
                emergency_tel: '',
                emergency_contact_name: '',
                wage_type: 'permanent',
                photo: null,
                nic_front: null,
                nic_back: null
              });
              generateWorkerId();
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <RotateCcw size={16} /> Reset Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card - First on mobile */}
        <div className="space-y-6 lg:order-2">
          <div className="glass-panel p-6 rounded-3xl border-2 border-dashed border-tea-500/30 bg-tea-50/5 dark:bg-tea-500/5 text-center space-y-4">
            <div className="relative w-48 h-48 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-tea-500/20 overflow-hidden group">
              {formData.photo ? (
                <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera size={48} className="text-tea-500/40" />
                  <span className="text-[10px] font-black text-tea-600 uppercase tracking-widest">Photo Required</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                Worker Identity Photo <span className="text-red-500">*</span>
              </p>
              <button
                type="button"
                onClick={() => startCamera('photo')}
                className={`mx-auto flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-2xl transition-all shadow-lg ${formData.photo ? 'bg-slate-100 text-slate-600' : 'bg-tea-600 text-white shadow-tea-500/20 hover:scale-105'}`}
              >
                <Camera size={14} /> {formData.photo ? 'Retake Identity Photo' : 'Capture'}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
              Biometric verification is strictly required <br /> for daily muster logging
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Fingerprint size={14} /> Compliance Status
            </h4>
            <p className="text-[11px] text-blue-700 dark:text-blue-500 leading-relaxed font-medium">
              Worker registration cannot be completed without a clear identity photo.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6 lg:order-1">
          <div className="glass-panel p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Worker ID (Autogenerated)</label>
                  <input
                    type="text"
                    readOnly
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-black text-tea-600 cursor-not-allowed"
                    value={formData.worker_id}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">NIC Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 19XXXXXXXXXX"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-tea-500/20 focus:border-tea-500 transition-all text-sm outline-none font-bold"
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name with Initials <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A.B.C. Perera"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-tea-500/20 focus:border-tea-500 transition-all text-sm outline-none"
                    value={formData.full_name_initials}
                    onChange={(e) => setFormData({ ...formData, full_name_initials: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm outline-none"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Last Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm outline-none"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Permanent Address <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows="2"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm outline-none resize-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Telephone Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 07XXXXXXXX"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm outline-none font-bold"
                    value={formData.tel}
                    onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Wage Type <span className="text-red-500">*</span></label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm outline-none font-bold appearance-none cursor-pointer"
                    value={formData.wage_type}
                    onChange={(e) => setFormData({ ...formData, wage_type: e.target.value })}
                  >
                    <option value="permanent">Permanent</option>
                    <option value="daily_cash">Daily Cash</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Emergency Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contact Person Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jane Doe"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm outline-none font-bold"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Emergency Phone No. <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 07XXXXXXXX"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm outline-none font-bold"
                        value={formData.emergency_tel}
                        onChange={(e) => setFormData({ ...formData, emergency_tel: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="text-tea-600" size={18} /> Documentation (NIC Copies)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">NIC Front <span className="text-red-500">*</span></label>
                    <div className="relative h-40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-tea-500 transition-all group overflow-hidden">
                      {formData.nic_front ? (
                        <div className="relative w-full h-full group">
                          <img src={formData.nic_front} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <button type="button" onClick={() => setFormData({ ...formData, nic_front: null })} className="text-white text-xs font-bold bg-red-500 px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <X size={12} /> Clear
                            </button>
                            <button type="button" onClick={() => startCamera('nic_front')} className="text-white text-xs font-bold bg-tea-600 px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <Camera size={12} /> Retake
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full gap-3 p-4 border-2 border-red-500/10">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => startCamera('nic_front')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-tea-50 dark:hover:bg-tea-500/10 text-slate-400 hover:text-tea-600 transition-all">
                              <Camera size={24} />
                              <span className="text-[10px] font-bold">Snap</span>
                            </button>
                            <label className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer transition-all">
                              <Upload size={24} />
                              <span className="text-[10px] font-bold">File</span>
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'nic_front')} />
                            </label>
                          </div>
                          <span className="text-[9px] text-red-500/60 font-black uppercase tracking-widest">Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">NIC Back <span className="text-red-500">*</span></label>
                    <div className="relative h-40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-tea-500 transition-all group overflow-hidden">
                      {formData.nic_back ? (
                        <div className="relative w-full h-full group">
                          <img src={formData.nic_back} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <button type="button" onClick={() => setFormData({ ...formData, nic_back: null })} className="text-white text-xs font-bold bg-red-500 px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <X size={12} /> Clear
                            </button>
                            <button type="button" onClick={() => startCamera('nic_back')} className="text-white text-xs font-bold bg-tea-600 px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <Camera size={12} /> Retake
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full gap-3 p-4 border-2 border-red-500/10">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => startCamera('nic_back')} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-tea-50 dark:hover:bg-tea-500/10 text-slate-400 hover:text-tea-600 transition-all">
                              <Camera size={24} />
                              <span className="text-[10px] font-bold">Snap</span>
                            </button>
                            <label className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer transition-all">
                              <Upload size={24} />
                              <span className="text-[10px] font-bold">File</span>
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'nic_back')} />
                            </label>
                          </div>
                          <span className="text-[9px] text-red-500/60 font-black uppercase tracking-widest">Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 bg-tea-600 hover:bg-tea-700 text-white rounded-xl font-bold shadow-lg shadow-tea-500/20 transition-all mt-4 flex items-center gap-2 hover:scale-[1.02] text-sm ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} /> Complete Register
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

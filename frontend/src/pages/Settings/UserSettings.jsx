import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { 
  User, Lock, Bell, Palette, Globe, Shield, 
  Smartphone, Monitor, Activity, CheckCircle2,
  Camera, Mail, Key, Eye, EyeOff, LayoutTemplate,
  ToggleLeft, ToggleRight, Fingerprint, History, Loader2, X
} from 'lucide-react';
import { apiClient } from '../../api/client';

export default function UserSettings() {
  // Avatar upload state
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState('');
  // Confirmation dialog
  const [showConfirm, setShowConfirm] = useState(false);
  // Sessions
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState({
    email: true, push: false, sms: true, weeklyReport: true
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    first_name: '', last_name: '', email: '', role: '', job_title: '', phone: ''
  });
  const [passwords, setPasswords] = useState({
    current_password: '', new_password: '', confirm_password: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/user/profile');
        if (response.success && response.data) {
          setProfile({
            first_name: response.data.first_name || '',
            last_name: response.data.last_name || '',
            email: response.data.email || '',
            role: response.data.role || '',
            job_title: response.data.job_title || '',
            phone: response.data.phone || ''
          });
          if (response.data.theme) setTheme(response.data.theme);
          if (response.data.notifications) {
            try {
              const parsed = typeof response.data.notifications === 'string' ? JSON.parse(response.data.notifications) : response.data.notifications;
              setNotifications(prev => ({ ...prev, ...parsed }));
            } catch (e) {
              console.error('Failed to parse notifications', e);
            }
          }
          if (response.data.profile_photo) setAvatarPreview(response.data.profile_photo);
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setLoading(false);
      }
    };
    const fetchSessions = async () => {
      try {
        const response = await apiClient.get('/user/sessions');
        if (response.success && response.data) setSessions(response.data);
      } catch (e) {
        setSessions([]);
      }
    };
    fetchProfile();
    fetchSessions();
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'sessions', label: 'Active Sessions', icon: Monitor }
  ];

  const savePreferences = async (newTheme, newNotifs) => {
    try {
      await apiClient.put('/user/preferences', { theme: newTheme, notifications: newNotifs });
    } catch (error) {
      console.error('Failed to save preferences', error);
    }
  };

  const handleToggle = (key) => {
    const newNotifs = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifs);
    savePreferences(theme, newNotifs);
  };

  const handleThemeChange = (t) => {
    setTheme(t);
    savePreferences(t, notifications);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Could not access camera: " + (err.message || err.name));
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    // Pause video first to prevent blob URL access after stream is stopped
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoData = canvas.toDataURL('image/jpeg', 0.85);
    // Stop camera first to release the stream
    stopCamera();
    // Set preview directly from base64 - no blob URL created
    setAvatarPreview(photoData);
    setAvatar(photoData); // store as base64 string
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      // Using avatarPreview (base64) directly
      const response = await apiClient.put('/user/profile', { 
        ...profile, 
        profile_photo: avatarPreview 
      });
      if (response.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Save profile failed', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    if (name === 'new_password') setPasswordStrength(getPasswordStrength(value));
  };

  function getPasswordStrength(pw) {
    if (!pw) return '';
    if (pw.length < 6) return 'Weak';
    if (pw.match(/[A-Z]/) && pw.match(/[0-9]/) && pw.match(/[^A-Za-z0-9]/) && pw.length >= 10) return 'Strong';
    if (pw.match(/[A-Z]/) && pw.match(/[0-9]/) && pw.length >= 8) return 'Medium';
    return 'Weak';
  }

  const savePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    setShowConfirm(true);
  };

  const confirmSavePassword = async () => {
    setIsSaving(true);
    setShowConfirm(false);
    try {
      const response = await apiClient.put('/user/password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });
      if (response.success) {
        toast.success('Password updated successfully');
        setPasswords({ current_password: '', new_password: '', confirm_password: '' });
        setPasswordStrength('');
      } else {
        toast.error(response.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Save password failed', error);
      toast.error('Server error while updating password');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 animate-pulse">
        <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
        <div className="flex gap-8">
          <div className="w-64 space-y-4">
            {[...Array(4)].map((_,i) => <div key={i} className="h-10 bg-slate-200 dark:bg-slate-800 rounded"></div>)}
          </div>
          <div className="flex-1 space-y-6">
            <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Account Settings</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <User size={14} className="text-tea-500" /> Manage your profile, security, and preferences
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-2 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-tea-500/10 text-tea-600 dark:text-tea-400 border border-tea-500/20 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-tea-500' : 'opacity-70'} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="premium-card space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="relative group cursor-pointer" aria-label="Upload Avatar">
                  <input
                    type="file"
                    accept="image/*"
                    ref={avatarInputRef}
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setAvatar(e.target.files[0]);
                        setAvatarPreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-tea-400 to-teal-600 p-1 overflow-hidden">
                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <User size={40} className="text-slate-300" />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
                  >
                    <Camera size={24} className="text-white" />
                  </button>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white font-outfit">{profile.first_name || 'System Administrator'} {profile.last_name || ''}</h3>
                  <p className="text-sm font-bold text-slate-400 mt-0.5">Role: <span className="capitalize">{profile.role || 'Super Admin'}</span></p>
                  <button
                    className="mt-2 text-xs font-bold text-tea-600 dark:text-tea-400 bg-tea-50 dark:bg-tea-500/10 px-3 py-1.5 rounded-lg hover:bg-tea-100 dark:hover:bg-tea-500/20 transition-colors mr-2"
                    type="button"
                    onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
                  >
                    Upload Photo
                  </button>
                  <button
                    className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                    type="button"
                    onClick={startCamera}
                  >
                    Capture Photo
                  </button>
                </div>
              </div>

              {/* Camera Capture Modal */}
              {isCameraOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={stopCamera}></div>
                  <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Capture Profile Photo</h3>
                      <button onClick={stopCamera} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                      </button>
                    </div>

                    <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute inset-0 pointer-events-none border-4 border-tea-500/30 m-8 rounded-full"></div>
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Neural Link: Active</span>
                      </div>
                    </div>

                    <div className="p-8 flex justify-center gap-4 bg-slate-50 dark:bg-slate-950">
                      <button
                        onClick={stopCamera}
                        className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="bg-tea-600 text-white px-10 py-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-tea-600/30 hover:scale-105 active:scale-95 transition-all"
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-white/50 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        <span className="text-xs font-black uppercase tracking-widest">Snap Identity</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" name="first_name" value={profile.first_name} onChange={handleProfileChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-tea-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-tea-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Title</label>
                  <input type="text" name="job_title" value={profile.job_title} onChange={handleProfileChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-tea-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input type="tel" name="phone" value={profile.phone} onChange={handleProfileChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-tea-500 outline-none transition-all" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={saveProfile} disabled={isSaving} className="flex items-center gap-2 px-6 py-3 bg-tea-600 hover:bg-tea-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-tea-600/20 transition-all active:scale-95 disabled:opacity-50">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : null} Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="premium-card space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Key size={18} className="text-tea-500" /> Change Password
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Ensure your account is using a long, random password to stay secure.</p>
                </div>
                
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                    <input type="password" name="current_password" value={passwords.current_password} onChange={handlePasswordChange} placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-tea-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="new_password"
                        value={passwords.new_password}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-tea-500 outline-none transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordStrength && (
                      <div className={`text-xs font-bold mt-1 ${passwordStrength === 'Strong' ? 'text-emerald-600' : passwordStrength === 'Medium' ? 'text-yellow-600' : 'text-red-500'}`}>Strength: {passwordStrength}</div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <input type="password" name="confirm_password" value={passwords.confirm_password} onChange={handlePasswordChange} placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-tea-500 outline-none transition-all" />
                  </div>
                  <button onClick={savePassword} disabled={isSaving || !passwords.current_password || !passwords.new_password} className="w-full flex justify-center items-center gap-2 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-50">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : null} Update Password
                  </button>
                  {showConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-xl max-w-xs w-full">
                        <h4 className="font-bold text-lg mb-2">Confirm Password Change</h4>
                        <p className="text-sm mb-4">Are you sure you want to change your password?</p>
                        <div className="flex gap-2 justify-end">
                          <button className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" onClick={() => setShowConfirm(false)}>Cancel</button>
                          <button className="px-4 py-2 rounded bg-tea-600 text-white font-bold" onClick={confirmSavePassword}>Yes, Change</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="premium-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Fingerprint size={18} className="text-tea-500" /> Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Add an extra layer of security to your account.</p>
                </div>
                <button className="shrink-0 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">
                  Enable 2FA
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="premium-card space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <LayoutTemplate size={18} className="text-tea-500" /> Appearance
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Customize how the ERP looks on your device.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['light', 'dark', 'system'].map((t) => (
                    <button 
                      key={t}
                      onClick={() => handleThemeChange(t)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        theme === t 
                          ? 'border-tea-500 bg-tea-50/50 dark:bg-tea-500/10' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-tea-300'
                      }`}
                    >
                      <div className="w-full h-16 rounded-lg mb-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                        <div className={`h-4 w-full ${t === 'light' ? 'bg-white' : t === 'dark' ? 'bg-slate-950' : 'bg-slate-500'} border-b border-black/5`}></div>
                        <div className="flex-1 flex p-1 gap-1">
                          <div className={`w-1/3 h-full rounded ${t === 'light' ? 'bg-white' : t === 'dark' ? 'bg-slate-900' : 'bg-slate-400'}`}></div>
                          <div className={`flex-1 h-full rounded ${t === 'light' ? 'bg-slate-50' : t === 'dark' ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white capitalize">{t} Mode</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{t === 'system' ? 'Syncs with OS' : 'Forced Theme'}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="premium-card space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell size={18} className="text-tea-500" /> Notifications
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Choose what we notify you about.</p>
                </div>

                <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                  {[
                    { key: 'email', label: 'Email Alerts', desc: 'Receive daily compliance and operational summaries.' },
                    { key: 'push', label: 'Push Notifications', desc: 'Get real-time browser alerts for approvals.' },
                    { key: 'sms', label: 'SMS Warnings', desc: 'Only for critical system failures and security alerts.' },
                    { key: 'weeklyReport', label: 'Weekly Digest', desc: 'Receive a comprehensive weekly performance PDF.' }
                  ].map((notif) => (
                    <div key={notif.key} className="flex items-center justify-between py-4">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{notif.label}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{notif.desc}</p>
                      </div>
                      <button onClick={() => handleToggle(notif.key)} className={`transition-colors ${notifications[notif.key] ? 'text-tea-500' : 'text-slate-300 dark:text-slate-600'}`}>
                        {notifications[notif.key] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="premium-card space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Monitor size={18} className="text-tea-500" /> Active Sessions
                </h3>
                <p className="text-sm text-slate-500 mt-1">Review the devices that are currently logged into your account.</p>
              </div>

              <div className="space-y-4">
                {sessions.map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                        {session.icon === 'Smartphone' ? <Smartphone size={20} className={session.current ? 'text-tea-500' : 'text-slate-400'} /> : <Monitor size={20} className={session.current ? 'text-tea-500' : 'text-slate-400'} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                          {session.device} 
                          {session.current && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] uppercase tracking-widest rounded-full border border-emerald-500/20">Current</span>}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">{session.browser} on {session.os} • {session.ip}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1">
                          <History size={10} /> {session.time}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <button className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/20" onClick={async () => {
                        try {
                          await apiClient.post(`/user/sessions/revoke`, { sessionId: session.id });
                          setSessions(sessions.filter((s, idx) => idx !== i));
                          toast.success('Session revoked');
                        } catch {
                          toast.error('Failed to revoke session');
                        }
                      }}>
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

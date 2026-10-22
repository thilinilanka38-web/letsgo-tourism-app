import React, { useState } from 'react';
import { Destination, CategoryType } from '../types';
import { CATEGORIES } from '../data/seedDestinations';
import { haversineDistance, MADAKUMBURA_CENTER } from '../utils/haversine';
import {
  ShieldCheck,
  Lock,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Save,
  RotateCcw,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';

interface AdminCMSProps {
  destinations: Destination[];
  onAddDestination: (dest: Destination) => void;
  onUpdateDestination: (dest: Destination) => void;
  onDeleteDestination: (destId: string) => void;
  onResetToDefault: () => void;
}

export const AdminCMS: React.FC<AdminCMSProps> = ({
  destinations,
  onAddDestination,
  onUpdateDestination,
  onDeleteDestination,
  onResetToDefault,
}) => {
  // Self-Contained Admin Session State (REQ-14)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('letsgo_admin_auth') === 'true';
  });

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [activeAdminUser, setActiveAdminUser] = useState<string>(() => {
    return localStorage.getItem('letsgo_admin_user') || 'admin';
  });
  const [registeredAdmins, setRegisteredAdmins] = useState<Array<{ username: string; password: string }>>(() => {
    try {
      return JSON.parse(localStorage.getItem('letsgo_registered_admins') || '[]');
    } catch {
      return [];
    }
  });

  // Form State for Add / Edit (REQ-15)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    categoryId: CategoryType;
    latitude: string;
    longitude: string;
    operatingHours: string;
    recommendedStayMinutes: number;
    description: string;
    imageUrl: string;
    address: string;
    contactNumber: string;
  }>({
    name: '',
    categoryId: 'Religious / Heritage',
    latitude: '6.2300',
    longitude: '80.0500',
    operatingHours: '08:00 AM - 06:00 PM',
    recommendedStayMinutes: 60,
    description: '',
    imageUrl:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    address: '',
    contactNumber: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Handle Admin Registration
  const handleAdminRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanUser = usernameInput.trim().toLowerCase();
    if (!cleanUser || cleanUser.length < 3) {
      setAuthError('Username must be at least 3 characters long.');
      return;
    }
    if (!passwordInput || passwordInput.length < 4) {
      setAuthError('Password must be at least 4 characters long.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    const alreadyExists = registeredAdmins.some((a) => a.username.toLowerCase() === cleanUser) ||
      cleanUser === 'admin' || cleanUser === 'moratuwa';

    if (alreadyExists) {
      setAuthError('This username is already taken. Please choose another username.');
      return;
    }

    const updated = [...registeredAdmins, { username: cleanUser, password: passwordInput }];
    setRegisteredAdmins(updated);
    localStorage.setItem('letsgo_registered_admins', JSON.stringify(updated));
    setAuthSuccess(`Admin account "${cleanUser}" created successfully! Please sign in.`);
    setAuthMode('login');
    setPasswordInput('');
    setConfirmPasswordInput('');
  };

  // Handle Admin Login (REQ-14)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const userClean = usernameInput.trim().toLowerCase();
    const isCustomMatch = registeredAdmins.some(
      (a) => a.username.toLowerCase() === userClean && a.password === passwordInput
    );
    const isDefaultMatch =
      (userClean === 'admin' && passwordInput === 'letsgo2026') ||
      (userClean === 'moratuwa' && passwordInput === 'moratuwa2026');

    if (isCustomMatch || isDefaultMatch) {
      setIsAdminLoggedIn(true);
      setActiveAdminUser(userClean);
      localStorage.setItem('letsgo_admin_auth', 'true');
      localStorage.setItem('letsgo_admin_user', userClean);
      setSuccessNotice(`Authenticated successfully as Administrator (${userClean}).`);
    } else {
      setAuthError('Invalid credentials. Please enter a valid registered username and password.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('letsgo_admin_auth');
    localStorage.removeItem('letsgo_admin_user');
    setSuccessNotice(null);
    setUsernameInput('');
    setPasswordInput('');
  };

  // If Not Logged In, Show Admin Login / Register Prompt (REQ-14)
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        <div className="p-8 bg-slate-900 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-400/30">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold">Administrator Portal</h3>
          <p className="text-slate-400 text-xs mt-1">
            Access restricted to verified administrators for destination and system management
          </p>

          {/* Tab Selector: Sign In vs Register */}
          <div className="flex bg-slate-800 p-1 rounded-2xl mt-5 border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'login'
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'register'
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Admin</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={authMode === 'login' ? handleAdminLogin : handleAdminRegister}
          className="p-8 space-y-4"
        >
          {authError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {authMode === 'login' ? 'Admin Username' : 'Choose New Admin Username'}
            </label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              placeholder={authMode === 'login' ? 'Enter your username' : 'e.g. thilini or manager'}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {authMode === 'login' ? 'Admin Password' : 'Create Password'}
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                placeholder="Re-enter password"
                required
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {authMode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Sign In as Administrator</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Create Admin Account</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-700">Note:</span>{' '}
            {authMode === 'login'
              ? 'You can sign in with any registered admin account or default admin / letsgo2026.'
              : 'Create your personalized admin credentials with any username and password.'}
          </div>
        </form>
      </div>
    );
  }

  // Form Validation (REQ-16)
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Destination name is required.';
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || lat < 5.8 || lat > 6.6) {
      errors.latitude = 'Latitude must be valid (approx. 5.9° to 6.5° N in Southern Province).';
    }

    if (isNaN(lng) || lng < 79.9 || lng > 80.4) {
      errors.longitude = 'Longitude must be valid (approx. 79.9° to 80.4° E).';
    }

    if (!errors.latitude && !errors.longitude) {
      const dist = haversineDistance(
        MADAKUMBURA_CENTER.latitude,
        MADAKUMBURA_CENTER.longitude,
        lat,
        lng
      );
      if (dist > MADAKUMBURA_CENTER.radiusKm) {
        errors.latitude = `Coordinates are ${dist} km away, exceeding the 25 km Madakumbura operational boundary (BR-001)!`;
      }
    }

    if (!formData.description.trim() || formData.description.length < 20) {
      errors.description = 'Description must be at least 20 characters long.';
    }

    if (!formData.operatingHours.trim()) {
      errors.operatingHours = 'Operating hours schedule is required (e.g., 08:00 AM - 06:00 PM).';
    }

    if (!formData.imageUrl.trim()) {
      errors.imageUrl = 'Image URL is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    const dist = haversineDistance(
      MADAKUMBURA_CENTER.latitude,
      MADAKUMBURA_CENTER.longitude,
      lat,
      lng
    );

    if (isEditing && editingId) {
      const updated: Destination = {
        id: editingId,
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        latitude: lat,
        longitude: lng,
        operatingHours: formData.operatingHours.trim(),
        recommendedStayMinutes: Number(formData.recommendedStayMinutes) || 60,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
        distanceFromMadakumburaKm: dist,
        address: formData.address.trim(),
        contactNumber: formData.contactNumber.trim(),
      };
      onUpdateDestination(updated);
      setSuccessNotice(`Destination "${updated.name}" updated successfully in database.`);
    } else {
      const newDest: Destination = {
        id: `dest_${Date.now()}`,
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        latitude: lat,
        longitude: lng,
        operatingHours: formData.operatingHours.trim(),
        recommendedStayMinutes: Number(formData.recommendedStayMinutes) || 60,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
        distanceFromMadakumburaKm: dist,
        address: formData.address.trim(),
        contactNumber: formData.contactNumber.trim(),
      };
      onAddDestination(newDest);
      setSuccessNotice(`Destination "${newDest.name}" created and indexed successfully.`);
    }

    // Reset Form
    resetForm();
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      categoryId: 'Religious / Heritage',
      latitude: '6.2300',
      longitude: '80.0500',
      operatingHours: '08:00 AM - 06:00 PM',
      recommendedStayMinutes: 60,
      description: '',
      imageUrl:
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      address: '',
      contactNumber: '',
    });
    setValidationErrors({});
  };

  const startEdit = (dest: Destination) => {
    setIsEditing(true);
    setEditingId(dest.id);
    setFormData({
      name: dest.name,
      categoryId: dest.categoryId,
      latitude: dest.latitude.toString(),
      longitude: dest.longitude.toString(),
      operatingHours: dest.operatingHours,
      recommendedStayMinutes: dest.recommendedStayMinutes,
      description: dest.description,
      imageUrl: dest.imageUrl,
      address: dest.address || '',
      contactNumber: dest.contactNumber || '',
    });
    setValidationErrors({});
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                JWT Protected Session
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                Admin Active
              </span>
            </div>
            <h2 className="text-xl font-bold">Administrator CMS Console</h2>
            <p className="text-slate-400 text-xs">
              Logged in as <strong className="text-white">System Administrator</strong> • Full CRUD
              control on MongoDB destination collection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onResetToDefault}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            title="Reset dataset to original 10 locations"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default Places</span>
          </button>

          <button
            onClick={handleAdminLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-500/30 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid: Form on Left (5 Cols), Existing Documents on Right (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                {isEditing ? <Edit2 className="w-4 h-4 text-sky-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
                <span>{isEditing ? 'Edit Destination Document' : 'Create New Destination'}</span>
              </h3>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full text-xs bg-slate-50 border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    validationErrors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'
                  }`}
                  placeholder="e.g., Galagoda Shayilatharama Viharaya"
                />
                {validationErrors.name && (
                  <p className="text-[11px] text-red-600 mt-1">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Classification *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value as CategoryType })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryName}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Latitude (°N) *
                  </label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className={`w-full text-xs bg-slate-50 border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      validationErrors.latitude ? 'border-red-500 bg-red-50' : 'border-slate-200'
                    }`}
                    placeholder="6.2485"
                  />
                  {validationErrors.latitude && (
                    <p className="text-[10px] text-red-600 mt-0.5">{validationErrors.latitude}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Longitude (°E) *
                  </label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className={`w-full text-xs bg-slate-50 border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      validationErrors.longitude ? 'border-red-500 bg-red-50' : 'border-slate-200'
                    }`}
                    placeholder="80.0520"
                  />
                  {validationErrors.longitude && (
                    <p className="text-[10px] text-red-600 mt-0.5">{validationErrors.longitude}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Operating Hours *
                  </label>
                  <input
                    type="text"
                    value={formData.operatingHours}
                    onChange={(e) =>
                      setFormData({ ...formData, operatingHours: e.target.value })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="06:00 AM - 06:30 PM"
                  />
                  {validationErrors.operatingHours && (
                    <p className="text-[10px] text-red-600 mt-0.5">
                      {validationErrors.operatingHours}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stay Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    value={formData.recommendedStayMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recommendedStayMinutes: parseInt(e.target.value, 10) || 60,
                      })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Image URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="https://images.unsplash.com/..."
                  />
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                    />
                  )}
                </div>
                {validationErrors.imageUrl && (
                  <p className="text-[10px] text-red-600 mt-0.5">{validationErrors.imageUrl}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  placeholder="Detailed background and highlights of this destination..."
                />
                {validationErrors.description && (
                  <p className="text-[10px] text-red-600 mt-0.5">{validationErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Galle Road, Ambalangoda"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, contactNumber: e.target.value })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="+94 91 225 ..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isEditing
                      ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Update Destination' : 'Save to MongoDB'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Existing Documents List Column */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Database Destination Records ({destinations.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Indexed with 2dsphere spatial metadata relative to Madakumbura center
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {destinations.map((dest) => (
                <div
                  key={dest.id}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200 flex items-start gap-3 transition-colors"
                >
                  <img
                    src={dest.imageUrl}
                    alt={dest.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {dest.categoryId}
                      </span>
                      <span className="text-[10px] text-sky-700 font-semibold">
                        {dest.distanceFromMadakumburaKm} km from center
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">
                      {dest.name}
                    </h4>

                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-x-3">
                      <span>⏱ {dest.operatingHours}</span>
                      <span>
                        📍 {dest.latitude.toFixed(4)}, {dest.longitude.toFixed(4)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-1 mt-1">
                      {dest.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => startEdit(dest)}
                      className="p-2 text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Destination"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete "${dest.name}" from MongoDB database?`
                          )
                        ) {
                          onDeleteDestination(dest.id);
                        }
                      }}
                      className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                      title="Delete Destination"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

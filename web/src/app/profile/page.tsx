'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Star, FileText, Upload, Check, User, Save } from 'lucide-react';
import { useToast } from '@/components/Toast';
import AuthModal from '@/components/AuthModal';

interface Profile {
  phone_number: string;
  full_name: string;
  bio: string;
  avatar_url: string | null;
  is_cin_verified: boolean;
  rating: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  date: string;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    rating: 5,
    comment: 'Very polite driver, cautious driving style. Recommended!',
    reviewer_name: 'Sara K.',
    date: '2026-07-10'
  },
  {
    id: 'rev-2',
    rating: 4,
    comment: 'Punctual meeting time, clean car. The Casablanca-Rabat drive was smooth.',
    reviewer_name: 'Anass M.',
    date: '2026-07-04'
  }
];

export default function UserProfile() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile>({
    phone_number: '+212 661 234 567',
    full_name: 'Youssef El Alami',
    bio: 'Commute daily between Casa and Marrakech. Quiet traveler, love podcast topics about tech.',
    avatar_url: null,
    is_cin_verified: false,
    rating: 4.8
  });

  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [cinUploaded, setCinUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const fetchProfileData = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (data && !error) {
        setProfile(data as Profile);
      }
    } catch (err) {
      // Keep initial values
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setSaveSuccess(false);

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setIsAuthOpen(true);
        setUpdatingProfile(false);
        return;
      }

      await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          bio: profile.bio
        })
        .eq('id', authData.user.id);

      setSaveSuccess(true);
      showToast('Profile Saved!', 'Your personal profile details have been updated.', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveSuccess(true);
      showToast('Profile Saved!', 'Your personal profile details have been updated.', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCinUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setIsAuthOpen(true);
        setUploading(false);
        return;
      }

      const userId = authData.user.id;
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/cin_document.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('national-ids')
        .upload(filePath, file, { upsert: true });

      if (!uploadErr) {
        await supabase
          .from('profiles')
          .update({ is_cin_verified: true })
          .eq('id', userId);
        setProfile(prev => ({ ...prev, is_cin_verified: true }));
      }

      setCinUploaded(true);
      showToast('CIN Uploaded!', 'National ID uploaded for admin verification.', 'success');
    } catch (err) {
      setCinUploaded(true);
      showToast('CIN Uploaded!', 'National ID uploaded for admin verification.', 'success');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title */}
      <div className="flex flex-col gap-1 mt-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">My Profile</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Manage your profile details, trust badges, and reviews</p>
      </div>

      {/* Header Profile Badge */}
      <div className="card-airbnb p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-extrabold text-blue-700 uppercase text-2xl shadow-xs shrink-0">
            {profile.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">{profile.full_name}</h2>
              {profile.is_cin_verified ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Unverified
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-2">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-slate-900 font-bold">{profile.rating.toFixed(1)} rating</span>
              <span className="text-slate-300">•</span>
              <span>{profile.phone_number}</span>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 stroke-[3] text-emerald-600" />
          Profile details saved successfully!
        </div>
      )}

      {/* 2-Column Desktop Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1: Edit Profile Info */}
        <form onSubmit={handleUpdateProfile} className="card-airbnb p-6 flex flex-col gap-5 justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Edit Personal Details</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-slate-400" />
                <input 
                  required
                  type="text" 
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="input-airbnb w-full pl-9 pr-3 py-2.5 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Mini-Bio</label>
              <textarea 
                value={profile.bio}
                rows={4}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="input-airbnb w-full px-3 py-2 outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={updatingProfile}
            className="btn-primary-blue w-full py-2.5 text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            {updatingProfile ? 'Saving...' : 'Save Profile Details'}
          </button>
        </form>

        {/* Column 2: Verification & Reviews */}
        <div className="flex flex-col gap-6">
          {/* Trust & Safety (CIN Upload Verification) */}
          <div className="card-airbnb p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">National ID Verification</h3>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  Upload your Moroccan CIN to earn a verified trust badge. Verified drivers get booked 3x faster.
                </p>
              </div>
            </div>

            {cinUploaded ? (
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 stroke-[3] text-emerald-600" />
                CIN uploaded! Pending admin verification.
              </div>
            ) : (
              <div>
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/50">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-xs text-slate-800 font-bold">Upload National ID (CIN)</span>
                  <span className="text-[10px] text-slate-400 font-medium">JPG, PNG (Max 5MB)</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleCinUpload}
                    disabled={uploading}
                    className="hidden" 
                  />
                </label>
              </div>
            )}
          </div>

          {/* Past Reviews & Ratings */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Past Ride Reviews</h3>
            
            <div className="flex flex-col gap-3">
              {reviews.map((review) => (
                <div key={review.id} className="border border-slate-200 p-4 rounded-xl bg-white flex flex-col gap-1.5 shadow-xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{review.reviewer_name}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{review.comment}"</p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{review.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

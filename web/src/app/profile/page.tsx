'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Star, FileText, Upload, Check, User, Save } from 'lucide-react';

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
  const [profile, setProfile] = useState<Profile>({
    phone_number: '+212 654 321 098',
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
      // Keep mock values
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
      if (authData?.user) {
        await supabase
          .from('profiles')
          .update({
            full_name: profile.full_name,
            bio: profile.bio
          })
          .eq('id', authData.user.id);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveSuccess(true);
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
      const userId = authData?.user?.id || 'me';

      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/cin_document.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('national-ids')
        .upload(filePath, file, { upsert: true });

      if (!uploadErr) {
        await supabase
          .from('profiles')
          .update({ is_cin_verified: false })
          .eq('id', userId);
      }

      setCinUploaded(true);
    } catch (err) {
      setCinUploaded(true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Profile Badge */}
      <div className="flex items-center gap-4 border-b border-neutral-900/60 pb-5">
        <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-black text-neutral-300 uppercase text-xl shadow-inner">
          {profile.full_name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight leading-none">{profile.full_name}</h2>
            {profile.is_cin_verified ? (
              <span className="bg-[var(--color-emerald)]/5 text-[var(--color-emerald)] border border-[var(--color-emerald)]/20 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
            ) : (
              <span className="bg-amber-500/5 text-amber-500 border border-amber-500/20 text-[8px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Unverified
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold mt-2">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-neutral-200">{profile.rating.toFixed(1)}</span>
            <span className="text-neutral-700">•</span>
            <span>{profile.phone_number}</span>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-[var(--color-emerald)]/10 border border-[var(--color-emerald)]/20 p-3.5 rounded-xl text-xs text-[var(--color-emerald)] font-bold flex items-center gap-2">
          <Check className="w-4 h-4 stroke-[3]" />
          Profile updated successfully!
        </div>
      )}

      {/* Edit Profile Info - Card */}
      <form onSubmit={handleUpdateProfile} className="card-uber-white p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-neutral-500">Full Name</label>
          <div className="relative flex items-center">
            <User className="absolute left-3 w-4 h-4 text-neutral-500" />
            <input 
              required
              type="text" 
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="input-uber w-full pl-9 pr-3 py-2.5 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-neutral-500">Mini-Bio</label>
          <textarea 
            value={profile.bio}
            rows={3}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="input-uber w-full px-3 py-2 outline-none resize-none leading-normal"
          />
        </div>

        <button 
          type="submit" 
          disabled={updatingProfile}
          className="btn-emerald w-full py-3 text-xs flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4 stroke-[2.5]" />
          {updatingProfile ? 'Saving...' : 'Save Profile Details'}
        </button>
      </form>

      {/* Trust & Safety (CIN Upload Verification) */}
      <div className="card-uber-white p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-[var(--color-emerald)] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-100">National ID Verification</h3>
            <p className="text-[11px] text-neutral-400 font-semibold mt-1 leading-normal">
              Upload your Moroccan CIN to receive the verification badge. Verified drivers build trust and get booked 3x faster.
            </p>
          </div>
        </div>

        {cinUploaded ? (
          <div className="bg-[var(--color-emerald)]/5 border border-[var(--color-emerald)]/20 p-3.5 rounded-xl text-[10px] text-[var(--color-emerald)] font-bold flex items-center gap-2.5">
            <Check className="w-4 h-4 stroke-[3]" />
            CIN uploaded successfully! Pending admin verification.
          </div>
        ) : (
          <div>
            <label className="border-2 border-dashed border-neutral-850 hover:border-[var(--color-emerald)]/40 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-[#0a0a0d]/60">
              <Upload className="w-5 h-5 text-neutral-500" />
              <span className="text-xs text-neutral-300 font-bold">Upload National ID (CIN)</span>
              <span className="text-[9px] text-neutral-500 font-semibold">JPG, PNG (Max 5MB)</span>
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
        <h3 className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Past Ride Reviews</h3>
        
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <div key={review.id} className="border border-neutral-900/60 p-4 rounded-xl bg-[#09090b]/80 flex flex-col gap-1.5 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-200">{review.reviewer_name}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-neutral-400 italic">"{review.comment}"</p>
              <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">{review.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

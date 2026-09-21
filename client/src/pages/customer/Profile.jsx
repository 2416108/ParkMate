import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { User, Mail, Phone, ShieldCheck, Calendar } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      error('Name and phone number cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(name.trim(), phone.trim());
      success('Profile updated successfully.');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Customer Profile</h2>
        <p className="text-xs text-gray-500 mt-1">Manage your personal details and account preferences</p>
      </div>

      <Card>
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] flex items-center justify-center font-bold text-2xl">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#E8F5E9] text-[#2E7D32]">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Customer Account</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Full Name"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            icon={Mail}
            value={user?.email || ''}
            disabled
            helperText="Email address cannot be changed (primary account identifier)."
          />

          <Input
            label="Phone Number"
            type="tel"
            icon={Phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            helperText="10-digit mobile number for parking SMS updates."
            required
          />

          <div className="pt-4 flex justify-end">
            <Button type="submit" loading={saving}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

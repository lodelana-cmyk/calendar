"use client"

import { useState, useEffect, useRef } from "react"
import { User, Mail, Briefcase, Globe, Camera, Check, Key, LogOut, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { updateProfileClient, getCurrentUserProfileClient, uploadAvatarClient } from "@/lib/data-client"

const timezones = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
]

const roles = [
  "Admin",
  "Creative Director",
  "Production Lead",
  "Content Creator",
  "Editor",
  "Designer",
  "Producer",
  "Coordinator",
]

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [userId, setUserId] = useState<string | null>(null)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [timezone, setTimezone] = useState("America/New_York")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState("")
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUserId(user.id)
          setEmail(user.email || "")
          
          // Fetch profile from database
          const profile = await getCurrentUserProfileClient()
          if (profile) {
            setFullName(profile.full_name || "")
            setRole(profile.role || "")
            setTimezone(profile.timezone || "America/New_York")
            setAvatarUrl(profile.avatar_url)
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUserData()
  }, [])

  const handleSave = async () => {
    if (!userId) return
    
    setIsSaving(true)
    setSaveError("")
    
    try {
      await updateProfileClient(userId, {
        full_name: fullName,
        role,
        timezone,
      })
      
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Error saving profile:", error)
      setSaveError(error instanceof Error ? error.message : "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setIsUploadingAvatar(true)
    setSaveError("")

    try {
      // Upload to Supabase Storage and persist the public URL on the profile
      const publicUrl = await uploadAvatarClient(userId, file)
      await updateProfileClient(userId, { avatar_url: publicUrl })
      setAvatarUrl(publicUrl)
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setSaveError(error instanceof Error ? error.message : "Failed to upload avatar")
    } finally {
      setIsUploadingAvatar(false)
      // Reset the input so re-selecting the same file re-triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handleChangePassword = async () => {
    setPasswordError("")
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return
    }

    setIsChangingPassword(true)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      
      if (error) {
        setPasswordError(error.message)
        return
      }

      setPasswordSaved(true)
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => {
        setPasswordSaved(false)
        setShowPasswordForm(false)
      }, 2000)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const displayAvatarUrl = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName || email}`

  if (isLoading) {
    return (
      <div className="px-12 py-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="px-12 py-6 flex flex-col gap-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold text-on-surface headline">
          Your Profile
        </h1>
        <p className="text-on-surface-variant font-medium">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Avatar Section */}
      <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-surface-container-high">
              {isUploadingAvatar ? (
                <div className="h-full w-full bg-surface-container-high flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Image
                  src={displayAvatarUrl}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <button 
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-on-surface headline">{fullName || "Your Name"}</h2>
            <p className="text-primary font-medium">{role || "Role"}</p>
            <p className="text-sm text-on-surface-variant mt-1">{email || "Loading..."}</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-surface-container-high flex items-center justify-center">
            <User className="h-5 w-5 text-on-surface-variant" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface headline">Personal Information</h2>
            <p className="text-sm text-on-surface-variant">Update your personal details</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface flex items-center gap-2">
              <User className="h-4 w-4 text-on-surface-variant" />
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface flex items-center gap-2">
              <Mail className="h-4 w-4 text-on-surface-variant" />
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-3 bg-surface-container-high rounded-xl border border-outline-variant text-on-surface-variant cursor-not-allowed"
            />
            <p className="text-xs text-on-surface-variant">Email cannot be changed</p>
          </div>

          {/* Role */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-on-surface-variant" />
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="">Select a role</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface flex items-center gap-2">
              <Globe className="h-4 w-4 text-on-surface-variant" />
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {saveError && (
          <p className="text-sm text-error mt-4">{saveError}</p>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="h-5 w-5" />
                Saved!
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      {/* Account Section */}
      <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-surface-container-high flex items-center justify-center">
            <Key className="h-5 w-5 text-on-surface-variant" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface headline">Account</h2>
            <p className="text-sm text-on-surface-variant">Manage your account security</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Change Password */}
          <div className="flex items-center justify-between py-3 border-b border-outline-variant/30">
            <div>
              <p className="text-sm font-semibold text-on-surface">Change Password</p>
              <p className="text-xs text-on-surface-variant">Update your account password</p>
            </div>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="px-6 py-2.5 bg-surface-container-low text-on-surface rounded-full font-semibold text-sm hover:bg-surface-container-high transition-colors"
            >
              {showPasswordForm ? "Cancel" : "Change Password"}
            </button>
          </div>

          {/* Password Form - Removed "Current Password" field per Bug 3 */}
          {showPasswordForm && (
            <div className="p-6 bg-surface-container-low rounded-xl flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Enter new password"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Confirm new password"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-error">{passwordError}</p>
              )}
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="self-end px-6 py-2.5 bg-primary text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : passwordSaved ? (
                  <>
                    <Check className="h-4 w-4" />
                    Password Updated!
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          )}

          {/* Sign Out */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-semibold text-on-surface">Sign Out</p>
              <p className="text-xs text-on-surface-variant">Sign out of your account on this device</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="px-6 py-2.5 bg-error/10 text-error rounded-full font-semibold text-sm hover:bg-error/20 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

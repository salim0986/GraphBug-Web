"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  User, 
  Bell, 
  Key, 
  Shield, 
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Github,
  Sparkles,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as 'profile' | 'notifications' | 'api' | 'billing' | 'security' | null;
  
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'api' | 'billing' | 'security'>(
    initialTab || 'profile'
  );
  
  // API Key state
  const [apiKeyData, setApiKeyData] = useState<{ hasKey: boolean; maskedKey: string | null }>({ hasKey: false, maskedKey: null });
  const [newApiKey, setNewApiKey] = useState("");
  const [showNewApiKey, setShowNewApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch existing API key status
  useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  const fetchApiKeyStatus = async () => {
    try {
      const response = await fetch("/api/user/gemini-key");
      if (response.ok) {
        const data = await response.json();
        setApiKeyData(data);
      }
    } catch (error) {
      console.error("Error fetching API key:", error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) {
      setMessage({ type: "error", text: "Please enter an API key" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/gemini-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: newApiKey }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        setNewApiKey("");
        setShowNewApiKey(false);
        await fetchApiKeyStatus();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save API key" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm("Are you sure you want to delete your Gemini API key? This will prevent AI reviews until you add a new key.")) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/gemini-key", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        await fetchApiKeyStatus();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to delete API key" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, name: 'Profile', icon: User },
    { id: 'notifications' as const, name: 'Notifications', icon: Bell },
    { id: 'api' as const, name: 'API Keys', icon: Key },
    { id: 'billing' as const, name: 'Billing', icon: CreditCard },
    { id: 'security' as const, name: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Settings</h2>
        <p className="text-[var(--text)]/70">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Tabs Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <div className="bg-white rounded-xl border border-[var(--text)]/10 p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[var(--primary)] text-[var(--text)] shadow-sm'
                        : 'text-[var(--text)]/70 hover:bg-[var(--text)]/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-12 md:col-span-9">
          <div className="bg-white rounded-2xl border border-[var(--text)]/10 p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text)] mb-1">Account Information</h3>
                  <p className="text-sm text-[var(--text)]/60">
                    View your account details and connected services.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--text)]/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Github className="w-5 h-5 text-[var(--text)]/60" />
                      <div>
                        <p className="text-xs font-semibold text-[var(--text)]/50 uppercase tracking-wide">Authentication Method</p>
                        <p className="text-sm font-medium text-[var(--text)]">GitHub OAuth</p>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text)]/60">
                      You're signed in using your GitHub account. Your profile information is managed through GitHub.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900 mb-1">Profile Settings</p>
                      <p className="text-blue-700">
                        To update your name, email, or profile picture, visit your{" "}
                        <a href="https://github.com/settings/profile" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                          GitHub settings
                        </a>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text)] mb-1">Notification Preferences</h3>
                  <p className="text-sm text-[var(--text)]/60">
                    Configure how you receive updates about code reviews.
                  </p>
                </div>

                <div className="p-8 text-center bg-[var(--background)] rounded-xl border-2 border-dashed border-[var(--text)]/20">
                  <Bell className="w-12 h-12 text-[var(--text)]/30 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-[var(--text)] mb-2">Coming Soon</h4>
                  <p className="text-sm text-[var(--text)]/60 mb-4">
                    Notification preferences will be available in a future update.
                  </p>
                  <p className="text-xs text-[var(--text)]/50">
                    Currently, all reviews are posted as GitHub PR comments automatically.
                  </p>
                </div>
              </div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text)] mb-1">Gemini API Key</h3>
                  <p className="text-sm text-[var(--text)]/60">
                    Graph Bug uses your own Gemini API key to perform AI code reviews.
                  </p>
                </div>

                {/* Message Alert */}
                {message && (
                  <div className={`p-4 rounded-lg border flex items-center gap-3 ${
                    message.type === "success" 
                      ? "bg-emerald-50 border-emerald-200" 
                      : "bg-red-50 border-red-200"
                  }`}>
                    {message.type === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    <p className={`text-sm font-medium ${
                      message.type === "success" ? "text-emerald-900" : "text-red-900"
                    }`}>
                      {message.text}
                    </p>
                  </div>
                )}

                {/* How to Get API Key */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900 mb-2">How to get your Gemini API key:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700">
                        <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-semibold inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3" /></a></li>
                        <li>Sign in with your Google account</li>
                        <li>Click "Get API key" or "Create API key"</li>
                        <li>Copy the key (starts with "AIza") and paste it below</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Current API Key Status */}
                {apiKeyData.hasKey && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-emerald-900">API Key Configured</span>
                      </div>
                      <Button
                        onClick={handleDeleteApiKey}
                        disabled={isLoading}
                        className="h-8 px-3 text-xs bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                      >
                        <Trash2 className="w-3 h-3 mr-1.5" />
                        Remove
                      </Button>
                    </div>
                    <p className="text-sm text-emerald-700 font-mono">{apiKeyData.maskedKey}</p>
                  </div>
                )}

                {/* Add/Update API Key Form */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="apiKey" className="block text-sm font-semibold text-[var(--text)] mb-2">
                      {apiKeyData.hasKey ? "Update API Key" : "Enter Your Gemini API Key"}
                    </label>
                    <div className="relative">
                      <input
                        id="apiKey"
                        type={showNewApiKey ? "text" : "password"}
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        placeholder="AIza..."
                        className="w-full px-4 py-3 pr-12 border border-[var(--text)]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewApiKey(!showNewApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text)]/50 hover:text-[var(--text)] transition-colors"
                      >
                        {showNewApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text)]/50">
                      Your API key is encrypted and stored securely. It will only be used for AI code reviews.
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveApiKey}
                    disabled={isLoading || !newApiKey.trim()}
                    className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--text)] font-semibold"
                  >
                    {isLoading ? "Saving..." : apiKeyData.hasKey ? "Update API Key" : "Save API Key"}
                  </Button>
                </div>

                {/* Important Notes */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900">
                      <p className="font-semibold mb-2">Important:</p>
                      <ul className="list-disc list-inside space-y-1 text-amber-800">
                        <li>AI code reviews will not work until you add your API key</li>
                        <li>You are responsible for your own Gemini API usage and costs</li>
                        <li>Free tier includes 15 requests per minute - sufficient for most projects</li>
                        <li>Never share your API key with anyone</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text)] mb-1">Billing & Subscription</h3>
                  <p className="text-sm text-[var(--text)]/60">
                    Your current plan and usage information.
                  </p>
                </div>

                {/* Current Plan - Informational Only */}
                <div className="p-6 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 border border-[var(--primary)]/20 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-xl font-bold text-[var(--text)]">Free Beta</h4>
                        <span className="px-2 py-0.5 bg-[var(--primary)] text-[var(--text)] text-xs font-bold uppercase tracking-wide rounded-full">
                          Beta
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text)]/70">
                        Unlimited reviews · Unlimited repositories
                      </p>
                    </div>
                    <Sparkles className="w-8 h-8 text-[var(--primary)]" />
                  </div>
                  
                  <p className="text-xs text-[var(--text)]/60 mt-4 p-3 bg-white rounded-lg">
                    💡 Graph Bug is currently in beta. All features are free while we collect feedback and improve the product.
                  </p>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text)] mb-1">Security Settings</h3>
                  <p className="text-sm text-[var(--text)]/60">
                    Manage your account security and connected accounts.
                  </p>
                </div>

                {/* Connected Accounts */}
                <div>
                  <h4 className="font-semibold text-[var(--text)] mb-3">Connected Accounts</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg">
                      <div className="flex items-center gap-3">
                        <Github className="w-5 h-5" />
                        <div>
                          <p className="font-semibold text-[var(--text)]">GitHub</p>
                          <p className="text-sm text-[var(--text)]/60">Connected</p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t border-[var(--text)]/10">
                  <h4 className="font-semibold text-red-600 mb-3">Danger Zone</h4>
                  <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-red-900 mb-1">Delete Account</p>
                        <p className="text-sm text-red-700">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                            signOut({ callbackUrl: "/" });
                          }
                        }}
                        className="text-red-600 border-red-300 hover:bg-red-100 shrink-0"
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

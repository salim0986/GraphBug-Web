"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [linking, setLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const appName = "graph-bug";
  // GitHub will redirect to the Setup URL configured in the app settings after installation
  // No need to pass state parameter - GitHub automatically redirects to Setup URL with installation_id
  const installUrl = `https://github.com/apps/${appName}/installations/new`;

  useEffect(() => {
    // Fetch debug info to show user what's in the database
    fetch("/api/installations/debug")
      .then(res => res.json())
      .then(data => setDebugInfo(data))
      .catch(err => console.error("Failed to fetch debug info:", err));
  }, []);

  async function handleManualLink() {
    setLinking(true);
    setLinkMessage(null);
    
    try {
      const response = await fetch("/api/installations/link", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.success) {
        setLinkMessage(`✅ ${data.message}`);
        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setLinkMessage(`❌ ${data.error || 'Failed to link installations'}`);
      }
    } catch (error) {
      setLinkMessage("❌ Error linking installations");
      console.error(error);
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 rounded-2xl p-8 border border-[var(--primary)]/20">
        <h1 className="text-3xl font-bold mb-2">Welcome to Graph Bug!</h1>
        <p className="text-[var(--text)]/70 text-lg">
          Let's get you set up. Connect your GitHub repository to start receiving AI-powered code reviews.
        </p>
      </div>

      {/* Setup Steps */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <div className="w-10 h-10 bg-[var(--primary)]/20 rounded-lg flex items-center justify-center mb-4 text-xl font-bold">1</div>
          <h3 className="font-semibold mb-2">Install GitHub App</h3>
          <p className="text-sm text-[var(--text)]/70">Connect your repository by installing our GitHub App</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <div className="w-10 h-10 bg-[var(--primary)]/20 rounded-lg flex items-center justify-center mb-4 text-xl font-bold">2</div>
          <h3 className="font-semibold mb-2">Select Repositories</h3>
          <p className="text-sm text-[var(--text)]/70">Choose which repositories you want to review</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-[var(--text)]/10">
          <div className="w-10 h-10 bg-[var(--primary)]/20 rounded-lg flex items-center justify-center mb-4 text-xl font-bold">3</div>
          <h3 className="font-semibold mb-2">Start Reviewing</h3>
          <p className="text-sm text-[var(--text)]/70">AI reviews will appear on your pull requests</p>
        </div>
      </div>

      {/* CTA Card */}
      <div className="bg-white rounded-2xl p-8 border border-[var(--text)]/10 text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Connect Your GitHub Account</h2>
          <p className="text-[var(--text)]/70">
            Install our GitHub App to enable automated code reviews on your repositories
          </p>
        </div>

        <a 
          href={installUrl}
          className="inline-flex items-center gap-2 bg-black hover:bg-black/90 text-white px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 font-medium text-lg"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          Install GitHub App
        </a>

        <p className="text-sm text-[var(--text)]/60">
          You'll be redirected to GitHub to complete the installation
        </p>
      </div>

      {/* Manual Link Option */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Already installed the app?</h3>
        <p className="text-sm text-blue-700 mb-4">
          If you've already installed the GitHub app but it's not showing up, click the button below to manually link it to your account.
        </p>
        
        {debugInfo && (
          <div className="mb-4 p-3 bg-white rounded border border-blue-300 text-xs">
            <div className="font-semibold text-blue-900 mb-2">Debug Info:</div>
            <div className="space-y-1 text-blue-800">
              <div>Your User ID: <code className="bg-blue-100 px-1 rounded">{debugInfo.currentUser?.id}</code></div>
              <div>Total Installations in DB: <strong>{debugInfo.totalInstallations}</strong></div>
              <div>Linked to You: <strong>{debugInfo.userInstallations?.count}</strong></div>
              <div>Unlinked: <strong className="text-orange-600">{debugInfo.unlinkedInstallations?.count}</strong></div>
              {debugInfo.unlinkedInstallations?.count > 0 && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="font-semibold mb-1">Unlinked installations:</div>
                  {debugInfo.unlinkedInstallations.data.map((inst: any) => (
                    <div key={inst.id} className="ml-2">• {inst.accountLogin} (ID: {inst.installationId})</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        <button
          onClick={handleManualLink}
          disabled={linking}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {linking ? "Linking..." : "Link Existing Installation"}
        </button>
        {linkMessage && (
          <p className="mt-3 text-sm font-medium">{linkMessage}</p>
        )}
      </div>

      {/* Help Section */}
      {/* <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold mb-1 text-blue-900">Need Help?</h3>
            <p className="text-sm text-blue-800/80">
              Check our documentation or contact support if you encounter any issues during setup.
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
}
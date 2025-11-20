import { useState, useEffect } from 'react';
import { X, ShieldCheck, Mail, Twitter, ChevronRight, ArrowLeft, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string | null;
}

export function UserProfileModal({ isOpen, onClose, username }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'totp'>('list');
  const [totpEnabled, setTotpEnabled] = useState(false);

  // TOTP 状态
  const [secret, setSecret] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setActiveTab('list');
      resetTotpState();
    }
  }, [isOpen]);

  // 关闭时重置状态
  const resetTotpState = () => {
    setSecret('');
    setQrUrl('');
    setToken('');
    setError('');
    setSuccess(false);
  };

  const checkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/totp/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTotpEnabled(data.enabled);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateSecret = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/totp/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to generate secret');
      
      const data = await response.json();
      setSecret(data.secret);
      setQrUrl(data.url);
    } catch (err) {
      setError('Failed to load 2FA configuration');
    }
  };

  const handleVerify = async () => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/totp/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess(true);
      setTotpEnabled(true);
      setTimeout(() => {
        setActiveTab('list');
        setSuccess(false);
        setToken('');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
             {activeTab === 'totp' && (
                <button onClick={() => setActiveTab('list')} className="mr-2 text-gray-500 hover:text-gray-700">
                    <ArrowLeft size={20} />
                </button>
             )}
             <h2 className="text-lg font-semibold text-gray-800">
                {activeTab === 'list' ? 'Account Settings' : 'Google Authenticator'}
             </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-0 overflow-y-auto">
            {activeTab === 'list' ? (
                <div className="divide-y">
                    {/* User Info Section */}
                    <div className="p-6 text-center bg-white">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600 text-2xl font-bold">
                            {username?.[0]?.toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{username}</h3>
                        <p className="text-gray-500 text-sm">Personal Account</p>
                    </div>

                    {/* Security Options */}
                    <div className="p-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Security</h4>
                        <div className="space-y-2">
                            {/* Google Authenticator */}
                            <button 
                                onClick={() => {
                                    setActiveTab('totp');
                                    if (!totpEnabled) generateSecret();
                                }}
                                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${totpEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-gray-900">Google Authenticator</div>
                                        <div className={`text-xs ${totpEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                                            {totpEnabled ? 'Enabled' : 'Not configured'}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
                            </button>

                            {/* Email (Placeholder) */}
                            <div className="w-full flex items-center justify-between p-3 opacity-60 cursor-not-allowed">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gray-100 text-gray-500">
                                        <Mail size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-gray-900">Email Address</div>
                                        <div className="text-xs text-gray-500">Not bound</div>
                                    </div>
                                </div>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Coming Soon</span>
                            </div>

                            {/* Twitter (Placeholder) */}
                            <div className="w-full flex items-center justify-between p-3 opacity-60 cursor-not-allowed">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gray-100 text-gray-500">
                                        <Twitter size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-gray-900">Twitter</div>
                                        <div className="text-xs text-gray-500">Not bound</div>
                                    </div>
                                </div>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Coming Soon</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-6">
                    {/* TOTP View */}
                    {totpEnabled && !success ? (
                         <div className="text-center py-8">
                            <div className="bg-green-100 text-green-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Check size={32} />
                            </div>
                            <p className="text-lg font-medium text-gray-800 mb-2">Two-Factor Authentication is Enabled</p>
                            <p className="text-gray-500 mb-6 text-sm">Your account is secured. You can reset it if you lost your device.</p>
                            <button 
                                onClick={() => { setTotpEnabled(false); generateSecret(); }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                            >
                                Reset Configuration
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {success ? (
                                <div className="bg-green-50 text-green-700 p-6 rounded-xl text-center">
                                    <Check className="mx-auto mb-3" size={40} />
                                    <p className="font-medium">Successfully bound!</p>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-4">
                                            Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                        </p>
                                        {qrUrl ? (
                                            <div className="bg-white p-4 rounded-xl border inline-block shadow-sm">
                                                <QRCodeSVG value={qrUrl} size={180} />
                                            </div>
                                        ) : (
                                            <div className="h-[214px] flex items-center justify-center text-gray-400">
                                                Loading...
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                                        <code className="text-sm font-mono text-gray-800">{secret || '................'}</code>
                                        <button
                                            onClick={copyToClipboard}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                                            title="Copy secret"
                                        >
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Enter 6-digit Code
                                        </label>
                                        <input
                                            type="text"
                                            value={token}
                                            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-2xl tracking-[0.5em] font-mono"
                                            placeholder="000000"
                                            maxLength={6}
                                        />
                                    </div>

                                    <button
                                        onClick={handleVerify}
                                        disabled={token.length !== 6}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                                    >
                                        Verify & Enable
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

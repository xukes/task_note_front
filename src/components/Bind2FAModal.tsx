import { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Bind2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Bind2FAModal({ isOpen, onClose }: Bind2FAModalProps) {
  const [secret, setSecret] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isBound, setIsBound] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    } else {
        // Reset state when closed
        setSecret('');
        setQrUrl('');
        setToken('');
        setError('');
        setSuccess(false);
        setIsBound(false);
    }
  }, [isOpen]);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/totp/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.enabled) {
          setIsBound(true);
        } else {
          generateSecret();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      setTimeout(() => {
        onClose();
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
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4">
          {isBound ? 'Google Authenticator Status' : 'Bind Google Authenticator'}
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : isBound ? (
          <div className="text-center py-8">
            <div className="bg-green-100 text-green-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <p className="text-lg font-medium text-gray-800 mb-2">Two-Factor Authentication is Enabled</p>
            <p className="text-gray-500 mb-6">Your account is secured with Google Authenticator.</p>
            <button 
              onClick={() => { setIsBound(false); generateSecret(); }}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Re-bind (Reset)
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            {success ? (
              <div className="bg-green-100 text-green-700 p-4 rounded text-center">
                <Check className="mx-auto mb-2" size={32} />
                <p>Successfully bound!</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  {qrUrl && (
                    <div className="bg-white p-2 rounded border">
                      <QRCodeSVG value={qrUrl} size={200} />
                    </div>
                  )}
                  
                  <div className="w-full">
                    <p className="text-sm text-gray-500 mb-2">Or enter secret manually:</p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-gray-100 p-2 rounded text-sm font-mono break-all">
                        {secret}
                      </code>
                      <button
                        onClick={copyToClipboard}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Copy secret"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-center text-xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={handleVerify}
                  disabled={token.length !== 6}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify & Bind
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

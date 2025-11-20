import React, { useState } from 'react';
import { User, Lock, LogIn, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLogin: (token: string, username: string) => void;
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password,
          totp_token: show2FA ? totpToken : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.require_2fa) {
        setShow2FA(true);
        setIsLoading(false);
        return;
      }

      onLogin(data.token, data.username);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            {show2FA ? (
              <ShieldCheck className="text-blue-600" size={32} />
            ) : (
              <User className="text-blue-600" size={32} />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {show2FA ? '双重认证' : '欢迎回来'}
          </h1>
          <p className="text-gray-500 mt-2">
            {show2FA ? '请输入验证器应用中的验证码' : '请登录以继续'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {!show2FA ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">用户名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="请输入用户名"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="请输入密码"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">验证码</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              '验证中...'
            ) : (
              <>
                {show2FA ? <ShieldCheck size={20} /> : <LogIn size={20} />}
                {show2FA ? '验证' : '登录'}
              </>
            )}
          </button>

          {!show2FA && (
            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">还没有账号？</span>
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="ml-1 text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                注册
              </button>
            </div>
          )}
          
          {show2FA && (
             <div className="text-center text-sm text-gray-500">
              <button
                type="button"
                onClick={() => { setShow2FA(false); setTotpToken(''); setError(''); }}
                className="text-gray-500 hover:text-gray-700"
              >
                返回登录
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

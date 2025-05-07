'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/download'); // ✅ 替换成 replace
    }
  }, []);

  const handleLogin = async () => {
    if (!code) return setError('请输入激活码');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNumber: code })
      });

      const result = await res.json();
      if (result.code === 0) {
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('cardNumber', result.data.cardNumber); // ✅ 新增
        router.push('/download');
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err) {
      setError('请求失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f0f0f0, #e0e0e0)',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#fff',
        padding: 30,
        borderRadius: 12,
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ marginBottom: 20, textAlign: 'center' }}>🔐 激活码登录</h2>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="请输入激活码"
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 16,
            border: '1px solid #ccc',
            borderRadius: 8,
            marginBottom: 16
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 16,
            backgroundColor: loading ? '#aaa' : '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '登录中...' : '立即登录'}
        </button>

        {error && <p style={{ color: 'red', marginTop: 12, textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
}

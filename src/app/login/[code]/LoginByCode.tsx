'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginByCode({ code }: { code: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const doLogin = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardNumber: code })
        });

        const result = await res.json();

        if (result.code === 0) {
          localStorage.setItem('token', result.data.token);
          localStorage.setItem('cardNumber', result.data.cardNumber);
          setStatus('success');
          setMessage('✅ 登录成功，正在跳转...');
          setTimeout(() => router.replace('/download'), 1000);
        } else {
          setStatus('error');
          setMessage('❌ 激活码无效或登录失败：' + result.message);
          setTimeout(() => router.replace('/login'), 2000);
        }
      } catch {
        setStatus('error');
        setMessage('❌ 网络异常，请稍后重试');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    doLogin();
  }, [code, router]);

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '80px 20px',
        fontFamily: 'sans-serif',
        color: status === 'error' ? '#e74c3c' : '#333'
      }}
    >
      <h2>🎫 正在验证激活码：{code}</h2>
      <p style={{ marginTop: 20, fontSize: 16 }}>{message || '请稍候...'}</p>
    </div>
  );
}

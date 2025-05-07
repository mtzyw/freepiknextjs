'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter(); // ✅ 放在组件内部

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }else{
      router.push('/download');
    }
  }, []);

  return <div>1111</div>;
}

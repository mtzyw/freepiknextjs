'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  cardNumber: string;
  cardValidDays: number;
  cardFirstUsedAt: string;
  cardExpiresAt: string;
  downloadLimit: number;
  dailyDownloads: number;
  dailyDownloadsDate: string;
  totalDownloadLimit: number;
  totalDownloads: number;
  createdAt: string;
  updatedAt: string;
}

interface Record {
  id: string;
  filename: string;
  sourceUrl: string;
  url: string;
  createdAt: string;
}

export default function DownloadPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [resourceUrl, setResourceUrl] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [fileName, setFileName] = useState('');

  const [records, setRecords] = useState<Record[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const cardNumber = localStorage.getItem('cardNumber');
    if (!token || !cardNumber) {
      router.push('/login');
      return;
    }
    fetchUserInfo();
    fetchRecords(1);
  }, []);

  const fetchUserInfo = async () => {
    const token = localStorage.getItem('token');
    const cardNumber = localStorage.getItem('cardNumber');
    if (!token || !cardNumber) return;
    
    try {
      const res = await fetch(`https://freepikapi.shayudata.com/api/user/${cardNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.code === 0) {
        setUser(result.data);
      } else {
        console.error('获取用户信息失败:', result.message);
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
    }
  };

  const fetchRecords = async (p: number) => {
    const token = localStorage.getItem('token')!;
    setLoading(true);
    try {
      const res = await fetch(
        `https://freepikapi.shayudata.com/api/my-images?page=${p}&pageSize=${pageSize}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (result.code === 0) {
        setRecords(result.data);
        setPage(p);
        setHasMore(result.data.length === pageSize);
      }
    } catch {
      console.error('获取记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cardNumber');
    router.push('/login');
  };

  const extractIdAndName = (urlText: string) => {
    let type = 'resource', name = '', id = '';
    try {
      const u = new URL(urlText);
      const pathname = u.pathname;
      if (pathname.includes('/icon/')) {
        type = 'icon';
        const m = pathname.match(/icon\/([^/]+)_([0-9]+)/);
        if (m) {
          name = `${m[1]}_${m[2]}`;
          id = m[2];
        }
      } else {
        const m = pathname.match(/\/([\w-]+)_([0-9]+)\.htm$/);
        if (m) {
          name = `${m[1]}_${m[2]}`;
          id = m[2];
        }
      }
    } catch {
      const m1 = urlText.match(/icon\/([^/]+)_([0-9]+)/);
      if (m1) {
        type = 'icon';
        name = `${m1[1]}_${m1[2]}`;
        id = m1[2];
      } else {
        const m2 = urlText.match(/\/([\w-]+)_([0-9]+)\.htm/);
        if (m2) {
          name = `${m2[1]}_${m2[2]}`;
          id = m2[2];
        }
      }
    }
    return { id, name, type };
  };

  let clickLocked = false;
  const handleFetch = async () => {
    if (clickLocked) return;
    clickLocked = true;

    const urlText = resourceUrl.trim();
    const { id, name, type } = extractIdAndName(urlText);
    if (!id || !name) {
      setMessage('❌ 链接格式不正确或无法识别 ID');
      clickLocked = false;
      return;
    }

    setResourceUrl('');
    setLoading(true);
    setMessage('📦 任务提交中，请稍等…');
    setDownloadUrl('');
    setFileName(name);

    try {
      const token = localStorage.getItem('token')!;
      const res = await fetch('https://freepikapi.shayudata.com/api/freepik/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, type,sourceUrl:resourceUrl})
      });
      const result = await res.json();
      if (result.code !== 0 || !result.data?.taskId) {
        throw new Error(result.message || '提交失败');
      }

      const taskId = result.data.taskId;
      const poll = async () => {
        const r = await fetch(`https://freepikapi.shayudata.com/api/task/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tr = await r.json();
        if (tr.code === 0) {
          const { status, result, failedReason } = tr.data;
          if (status === 'completed') {
            setDownloadUrl(result.fullUrl);
            setMessage('✅ 下载完成：');
            fetchRecords(1);
            fetchUserInfo();
            setLoading(false);
            clickLocked = false;
          } else if (status === 'failed') {
            setMessage('❌ 下载失败：' + failedReason);
            setLoading(false);
            clickLocked = false;
          } else {
            setTimeout(poll, 2000);
          }
        } else {
          throw new Error(tr.message || '查询失败');
        }
      };
      poll();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
      setLoading(false);
      clickLocked = false;
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div style={styles.container}>
      {user && (
        <div
          style={{
            marginBottom: 16,
            padding: 16,
            background: '#f5f5f5',
            borderRadius: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
              gap: 12,
              flex: 1
            }}
          >
            <div><strong>卡号:</strong> {user.cardNumber}</div>
            <div><strong>到期:</strong> {new Date(user.cardExpiresAt).toLocaleDateString()}</div>
            <div><strong>今日:</strong> {user.dailyDownloads}/{user.downloadLimit || '∞'}</div>
            <div><strong>总计:</strong> {user.totalDownloads}/{user.totalDownloadLimit || '∞'}</div>
          </div>
          <button onClick={handleLogout} style={styles.logout}>退出</button>
        </div>
      )}

      <h2 style={styles.heading}>创建下载任务</h2>
      <p style={styles.subheading}>复制 Freepik 素材或图标链接，粘贴到输入框，点击「获取」即可开始下载</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={resourceUrl}
          onChange={e => setResourceUrl(e.target.value)}
          placeholder="请输入 Freepik 链接"
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4 }}
        />
        <button
          onClick={handleFetch}
          disabled={loading}
          style={loading ? styles.btnDisabled : styles.btn}
        >
          {loading ? '获取中...' : '获取'}
        </button>
      </div>

      {message && <div style={styles.message}>{message}</div>}
      {downloadUrl && (
        <a href={downloadUrl} download={`${fileName}.zip`} style={styles.downloadLink}>
          ⬇️ 点击下载 {fileName}.zip
        </a>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr>
            <th style={styles.th}>任务链接</th>
            <th style={styles.th}>状态</th>
            <th style={styles.th}>结果</th>
            <th style={styles.th}>创建时间</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && !loading && (
            <tr><td colSpan={4} style={styles.empty}>暂无记录</td></tr>
          )}
          {records.map(item => (
            <tr key={item.id}>
              <td style={styles.td}>
                {isValidUrl(item.sourceUrl) ? (
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.filename}</a>
                ) : (
                  item.filename
                )}
              </td>
              <td style={styles.td}><span style={styles.tag}>成功</span></td>
              <td style={styles.td}>
                <button onClick={() => window.open(item.url, '_blank')} style={styles.downloadBtn}>下载到本地</button>
              </td>
              <td style={styles.td}>{new Date(item.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={styles.pager}>
        <button
          onClick={() => fetchRecords(page - 1)}
          disabled={page <= 1}
          style={page <= 1 ? styles.btnDisabled : styles.btn}
        >
          上一页
        </button>
        <span style={styles.pageInfo}>第 {page} 页</span>
        <button
          onClick={() => fetchRecords(page + 1)}
          disabled={!hasMore}
          style={!hasMore ? styles.btnDisabled : styles.btn}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 1000,
    margin: '40px auto',
    padding: '24px 24px 48px',
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontFamily: 'sans-serif'
  },
  logout: {
    background: '#e74c3c',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    height: 'fit-content'
  },
  heading: { margin: '0 0 8px', fontSize: 22 },
  subheading: { margin: '0 0 16px', color: '#666' },
  btn: {
    padding: '8px 16px',
    background: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer'
  },
  btnDisabled: {
    padding: '8px 16px',
    background: '#ccc',
    color: '#666',
    border: 'none',
    borderRadius: 4,
    cursor: 'not-allowed'
  },
  message: { margin: '8px 0', color: '#e74c3c' },
  downloadLink: {
    display: 'inline-block',
    margin: '12px 0',
    padding: '8px 16px',
    background: '#2ecc71',
    color: '#fff',
    borderRadius: 4,
    textDecoration: 'none'
  },
  th: {
    padding: 12,
    borderBottom: '1px solid #eee',
    background: '#fafafa',
    textAlign: 'left' as const
  },
  td: {
    padding: 12,
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle' as const,
    whiteSpace: 'nowrap' as const
  },
  tag: {
    display: 'inline-block',
    padding: '4px 8px',
    background: '#e6ffed',
    color: '#2a7a2a',
    borderRadius: 4,
    fontSize: 12
  },
  downloadBtn: {
    padding: '6px 12px',
    background: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const
  },
  empty: { textAlign: 'center' as const, padding: 12, color: '#888' },
  pager: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 20
  },
  pageInfo: { minWidth: 80, textAlign: 'center' as const }
};

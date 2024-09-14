import { useState } from 'react';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [file, setFile] = useState(null);
  const [lrcContent, setLrcContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const maxFileSize = 4 * 1024 * 1024; // 4MB

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile.size > maxFileSize) {
      alert('文件大小超过 4MB 限制，请选择较小的文件。');
      e.target.value = ''; // 重置文件输入
    } else {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!apiKey || !file) {
      alert('请提供 Gemini API Key 并选择一个音频文件。');
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    formData.append('apiKey', apiKey);
    formData.append('file', file);

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      const contentType = res.headers.get('content-type');

      if (!res.ok) {
        let errorMessage = '处理失败，请检查 API Key 和音频文件。';
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const text = await res.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setLrcContent(data.lrcContent);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }

    setIsProcessing(false);
  };

  const handleDownload = () => {
    const blob = new Blob([lrcContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'lyrics.lrc';
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>音频转歌词 (LRC) 工具</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Gemini API Key:</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', marginBottom: '15px' }}
          />
        </div>
        <div>
          <label>上传音频文件 (mp3, wav, aac, flac，最大 4MB):</label>
          <input
            type="file"
            accept=".mp3,.wav,.aac,.flac"
            onChange={handleFileChange}
            style={{ display: 'block', marginTop: '5px', marginBottom: '15px' }}
          />
        </div>
        <button type="submit" disabled={isProcessing}>
          {isProcessing ? '处理中...' : '开始处理'}
        </button>
      </form>
      {lrcContent && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleDownload}>下载 LRC 文件</button>
        </div>
      )}
    </div>
  );
}

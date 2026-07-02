import { useRef, useState } from 'react';
import axios from 'axios';
import { resolveImg } from '../utils.js';

/**
 * Upload an image to a specific endpoint (e.g. /uploads/equipes/12/logo or /uploads/joueurs/4/photo)
 * Calls onUploaded(url) after success.
 */
export default function ImageUpload({ endpoint, currentUrl, label = 'Image', onUploaded }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(endpoint, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data.logoUrl || res.data.photoUrl;
      setPreviewUrl(url);
      onUploaded?.(url);
    } catch (e) {
      setErr(e.response?.data?.error || 'Échec de l\'envoi');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };

  const preview = resolveImg(previewUrl);

  return (
    <>
      <div className="upload-zone" onClick={() => ref.current?.click()}>
        <div className="upload-preview">
          {preview ? <img src={preview} alt="" /> : 'Aperçu'}
        </div>
        <div className="upload-info">
          <div className="title">{busy ? 'Envoi…' : label}</div>
          <div className="hint">Cliquer pour choisir un fichier (PNG, JPG, max 5MB)</div>
          {err && <div className="hint" style={{ color: 'var(--live)' }}>{err}</div>}
        </div>
        <input ref={ref} type="file" accept="image/*" hidden onChange={onChange} disabled={busy} />
      </div>
    </>
  );
}

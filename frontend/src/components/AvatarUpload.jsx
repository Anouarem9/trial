import { useRef, useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { resolveImg } from '../utils.js';

/**
 * Avatar-style image uploader for the form-modal aside (author-form-card layout).
 * When `disabled` (e.g. creating a not-yet-saved entity), shows a placeholder + note.
 */
export default function AvatarUpload({
  endpoint,
  currentUrl,
  fallback = 'Image',
  hint = 'PNG, JPG · max 5MB',
  onUploaded,
  disabled = false,
  disabledNote,
}) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);

  const pick = () => { if (!disabled && !busy) ref.current?.click(); };

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !endpoint) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(endpoint, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.logoUrl || res.data.photoUrl;
      setPreviewUrl(url);
      onUploaded?.(url);
    } catch (e) {
      setErr(e.response?.data?.error || "Échec de l'envoi");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };

  const preview = resolveImg(previewUrl);

  return (
    <div className="fm-aside">
      <div className="fm-avatar" data-disabled={disabled} onClick={pick}>
        {preview ? <img src={preview} alt="" /> : <span>{fallback}</span>}
        {!disabled && <span className="fm-avatar-badge"><Plus size={15} /></span>}
        <input ref={ref} type="file" accept="image/*" hidden onChange={onChange} disabled={busy || disabled} />
      </div>
      <div className="fm-aside-text">
        <div className="t">{busy ? 'Envoi…' : disabled ? 'Image' : 'Téléverser une image'}</div>
        <div className="h">{disabled ? disabledNote : hint}</div>
        {err && <div className="h" style={{ color: 'var(--live)' }}>{err}</div>}
      </div>
      {!disabled && (
        <button type="button" className="btn btn-sm" style={{ width: '100%' }} onClick={pick}>
          Ajouter une image
        </button>
      )}
    </div>
  );
}

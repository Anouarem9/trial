import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EquipeAPI } from '../api.js';
import Modal from '../components/Modal.jsx';
import AvatarUpload from '../components/AvatarUpload.jsx';
import TeamLogo from '../components/TeamLogo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

const EMPTY = { nom: '', ville: '', entraineur: '', logoUrl: '' };

export default function Equipes() {
  const { canEdit } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState('');

  const load = () => EquipeAPI.list().then(setItems).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing('new'); };
  const openEdit = (e) => { setForm({ ...EMPTY, ...e }); setEditing(e.id); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === 'new') await EquipeAPI.create(form);
      else await EquipeAPI.update(editing, form);
      toast.success(editing === 'new' ? 'Équipe créée' : 'Équipe mise à jour');
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cette équipe et tous ses joueurs ?')) return;
    try {
      await EquipeAPI.delete(id);
      toast.success('Équipe supprimée');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Impossible de supprimer (équipe inscrite à un tournoi ?)');
    }
  };

  const filtered = items.filter(e =>
    `${e.nom} ${e.ville || ''} ${e.entraineur || ''}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <>
      <div className="page-header">
        <h2>Équipes</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="page-search" placeholder="Rechercher…"
                 value={filter} onChange={e => setFilter(e.target.value)} />
          {canEdit && <button className="btn btn-primary" onClick={openCreate}>+ Nouvelle équipe</button>}
        </div>
      </div>
      <p style={{ color: 'var(--muted)', marginTop: -12, marginBottom: 20 }}>
        Les équipes sont indépendantes. Vous les inscrivez à un tournoi depuis la page du tournoi.
      </p>
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty">{items.length === 0 ? 'Aucune équipe.' : 'Aucune équipe ne correspond à la recherche.'}</div>
        ) : (
          <table>
            <thead><tr><th></th><th>Nom</th><th>Ville</th><th>Entraîneur</th><th></th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td style={{ width: 40 }}><TeamLogo equipe={e} size={32} /></td>
                  <td><Link to={`/admin/equipes/${e.id}`}>{e.nom}</Link></td>
                  <td>{e.ville || '—'}</td>
                  <td>{e.entraineur || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {canEdit && (
                      <>
                        <button className="btn btn-sm" onClick={() => openEdit(e)}>Modifier</button>{' '}
                        <button className="btn btn-sm btn-danger" onClick={() => remove(e.id)}>Suppr.</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing !== null && (
        <Modal
          wide
          title={editing === 'new' ? 'Nouvelle équipe' : "Modifier l'équipe"}
          subtitle="Renseignez l'identité de l'équipe et son logo."
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <div className="fm-grid">
              <AvatarUpload
                endpoint={editing !== 'new' ? `/api/uploads/equipes/${editing}/logo` : null}
                currentUrl={form.logoUrl}
                fallback={form.nom ? form.nom[0].toUpperCase() : 'Logo'}
                onUploaded={url => setForm(f => ({ ...f, logoUrl: url }))}
                disabled={editing === 'new'}
                disabledNote="Enregistrez l'équipe, puis rouvrez-la pour ajouter un logo."
              />
              <div className="fm-fields">
                <div className="form-group">
                  <label>Nom <span style={{ color: 'var(--live)' }}>*</span></label>
                  <input required placeholder="FC Exemple" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                </div>
                <div className="row">
                  <div className="form-group">
                    <label>Ville</label>
                    <input placeholder="Paris" value={form.ville || ''} onChange={e => setForm({ ...form, ville: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Entraîneur</label>
                    <input placeholder="Nom de l'entraîneur" value={form.entraineur || ''} onChange={e => setForm({ ...form, entraineur: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
            <div className="fm-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>Annuler</button>
              <button type="submit" className="btn btn-primary">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

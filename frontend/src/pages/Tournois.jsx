import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TournoiAPI } from '../api.js';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

const EMPTY = { nom: '', lieu: '', dateDebut: '', dateFin: '', nombreEquipes: 8, description: '' };

export default function Tournois() {
  const { canEdit } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState('');

  const load = () => TournoiAPI.list().then(setItems).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing('new'); };
  const openEdit = (t) => { setForm({ ...t }); setEditing(t.id); };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      delete payload.statut;
      if (editing === 'new') await TournoiAPI.create(payload);
      else await TournoiAPI.update(editing, payload);
      toast.success(editing === 'new' ? 'Tournoi crÃ©Ã©' : 'Tournoi mis Ã  jour');
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer ce tournoi ? Les Ã©quipes et matches seront aussi supprimÃ©s.')) return;
    try {
      await TournoiAPI.delete(id);
      toast.success('Tournoi supprimÃ©');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  const filtered = items.filter(t =>
    `${t.nom} ${t.lieu || ''}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <>
      <div className="page-header">
        <h2>Tournois</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="page-search" placeholder="Rechercherâ€¦"
                 value={filter} onChange={e => setFilter(e.target.value)} />
          {canEdit && <button className="btn btn-primary" onClick={openCreate}>+ Nouveau tournoi</button>}
        </div>
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty">
            {items.length === 0 ? 'Aucun tournoi. Cliquez sur Â« Nouveau tournoi Â» pour commencer.' : 'Aucun tournoi ne correspond Ã  la recherche.'}
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Nom</th><th>Lieu</th><th>DÃ©but</th><th>Ã‰quipes</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td><Link to={`/admin/tournois/${t.id}`}>{t.nom}</Link></td>
                  <td>{t.lieu || 'â€”'}</td>
                  <td>{t.dateDebut}</td>
                  <td>{t.nombreEquipes}</td>
                  <td><span className={`badge badge-${t.statut}`}>{t.statut.replace('_', ' ')}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    {canEdit && (
                      <>
                        <button className="btn btn-sm" onClick={() => openEdit(t)}>Modifier</button>{' '}
                        <button className="btn btn-sm btn-danger" onClick={() => remove(t.id)}>Suppr.</button>
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
        <Modal title={editing === 'new' ? 'Nouveau tournoi' : 'Modifier le tournoi'} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <div className="form-group">
              <label>Nom *</label>
              <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Lieu</label>
              <input value={form.lieu || ''} onChange={e => setForm({ ...form, lieu: e.target.value })} />
            </div>
            <div className="row">
              <div className="form-group">
                <label>Date de dÃ©but *</label>
                <input type="date" required value={form.dateDebut || ''} onChange={e => setForm({ ...form, dateDebut: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date de fin</label>
                <input type="date" value={form.dateFin || ''} onChange={e => setForm({ ...form, dateFin: e.target.value })} />
              </div>
            </div>
            <div className="row">
              <div className="form-group">
                <label>Nombre d'Ã©quipes (puissance de 2)</label>
                <select value={form.nombreEquipes} onChange={e => setForm({ ...form, nombreEquipes: parseInt(e.target.value) })}>
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={16}>16</option>
                  <option value={32}>32</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>Annuler</button>
              <button type="submit" className="btn btn-primary">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

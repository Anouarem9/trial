import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ShieldCheck, Shirt, Sparkles, UserPlus } from 'lucide-react';
import { EquipeAPI, JoueurAPI } from '../api.js';
import Modal from '../components/Modal.jsx';
import AvatarUpload from '../components/AvatarUpload.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

const EMPTY = {
  nom: '', prenom: '', numero: '', poste: 'MILIEU', dateNaissance: '',
  nationalite: '', photoUrl: '',
  buts: 0, passesDecisives: 0, cartonsJaunes: 0, cartonsRouges: 0,
  matchsJoues: 0
};

const POSTE_LABELS = {
  GARDIEN: 'Gardiens',
  DEFENSEUR: 'Défenseurs',
  MILIEU: 'Milieux',
  ATTAQUANT: 'Attaquants'
};

function nextAvailableNumber(joueurs, currentId = null) {
  const used = new Set(
    joueurs
      .filter(j => j.id !== currentId && j.numero != null)
      .map(j => Number(j.numero))
  );
  for (let i = 1; i <= 99; i += 1) {
    if (!used.has(i)) return i;
  }
  return '';
}

function buildRosterAssistant(joueurs) {
  const counts = {
    GARDIEN: joueurs.filter(j => j.poste === 'GARDIEN').length,
    DEFENSEUR: joueurs.filter(j => j.poste === 'DEFENSEUR').length,
    MILIEU: joueurs.filter(j => j.poste === 'MILIEU').length,
    ATTAQUANT: joueurs.filter(j => j.poste === 'ATTAQUANT').length
  };

  const duplicateNumbers = [...new Set(
    joueurs
      .filter(j => j.numero != null)
      .map(j => Number(j.numero))
      .filter((num, index, all) => all.indexOf(num) !== index)
  )].sort((a, b) => a - b);

  const missing = [];
  if (counts.GARDIEN < 1) missing.push('un gardien');
  if (counts.DEFENSEUR < 4) missing.push(`${4 - counts.DEFENSEUR} défenseur(s)`);
  if (counts.MILIEU < 3) missing.push(`${3 - counts.MILIEU} milieu(x)`);
  if (counts.ATTAQUANT < 2) missing.push(`${2 - counts.ATTAQUANT} attaquant(s)`);
  if (joueurs.length < 11) missing.push(`${11 - joueurs.length} joueur(s) pour atteindre un onze`);

  const recommendedPoste =
    counts.GARDIEN < 1 ? 'GARDIEN' :
    counts.DEFENSEUR < 4 ? 'DEFENSEUR' :
    counts.MILIEU < 3 ? 'MILIEU' :
    counts.ATTAQUANT < 2 ? 'ATTAQUANT' :
    'MILIEU';

  const formation =
    counts.DEFENSEUR >= 4 && counts.MILIEU >= 3 && counts.ATTAQUANT >= 3 ? '4-3-3' :
    counts.DEFENSEUR >= 4 && counts.MILIEU >= 4 && counts.ATTAQUANT >= 2 ? '4-4-2' :
    counts.DEFENSEUR >= 3 && counts.MILIEU >= 5 && counts.ATTAQUANT >= 2 ? '3-5-2' :
    'À compléter';

  let readiness = 0;
  if (joueurs.length >= 11) readiness += 20;
  if (counts.GARDIEN >= 1) readiness += 20;
  if (counts.DEFENSEUR >= 4) readiness += 20;
  if (counts.MILIEU >= 3) readiness += 15;
  if (counts.ATTAQUANT >= 2) readiness += 15;
  if (joueurs.length > 0 && joueurs.every(j => j.numero != null)) readiness += 10;
  if (duplicateNumbers.length > 0) readiness -= 20;
  readiness = Math.max(0, Math.min(100, readiness));

  return { counts, duplicateNumbers, missing, recommendedPoste, formation, readiness };
}

export default function EquipeDetails() {
  const { canEdit } = useAuth();
  const toast = useToast();
  const { id } = useParams();
  const [equipe, setEquipe] = useState(null);
  const [joueurs, setJoueurs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const assistant = useMemo(() => buildRosterAssistant(joueurs), [joueurs]);

  const load = () => Promise.all([EquipeAPI.get(id), JoueurAPI.list(id)])
    .then(([e, j]) => { setEquipe(e); setJoueurs(j); })
    .catch(e => toast.error(e.message));

  useEffect(() => { load(); }, [id]);

  const openCreate = (presetPoste = 'MILIEU') => {
    setForm({
      ...EMPTY,
      poste: presetPoste,
      numero: nextAvailableNumber(joueurs)
    });
    setEditing('new');
  };

  const openEdit = (j) => { setForm({ ...EMPTY, ...j }); setEditing(j.id); };

  const autoNumber = () => {
    setForm(f => ({ ...f, numero: nextAvailableNumber(joueurs, editing === 'new' ? null : editing) }));
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        numero: form.numero ? parseInt(form.numero, 10) : null,
        buts: parseInt(form.buts, 10) || 0,
        passesDecisives: parseInt(form.passesDecisives, 10) || 0,
        cartonsJaunes: parseInt(form.cartonsJaunes, 10) || 0,
        cartonsRouges: parseInt(form.cartonsRouges, 10) || 0,
        matchsJoues: parseInt(form.matchsJoues, 10) || 0,
        equipeId: parseInt(id, 10)
      };
      if (editing === 'new') await JoueurAPI.create(payload);
      else await JoueurAPI.update(editing, payload);
      toast.success(editing === 'new' ? 'Joueur ajouté' : 'Joueur mis à jour');
      setEditing(null);
      load();
    } catch (e) {
      const fields = e.response?.data?.fields;
      const fieldMessage = fields ? Object.values(fields)[0] : null;
      toast.error(e.response?.data?.error === 'Validation' ? fieldMessage : (e.response?.data?.error || e.message));
    }
  };

  const remove = async (jid) => {
    if (!confirm('Supprimer ce joueur ?')) return;
    try {
      await JoueurAPI.delete(jid);
      toast.success('Joueur supprimé');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  if (!equipe) return <div className="empty">Chargement...</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/admin/equipes" className="back-link">Retour aux équipes</Link>
          <h2 style={{ marginTop: 4 }}>{equipe.nom}</h2>
          <div style={{ color: 'var(--muted)' }}>
            {equipe.ville || 'Ville non précisée'} · Entraîneur : {equipe.entraineur || '-'}
          </div>
        </div>
        {canEdit && <button className="btn btn-primary" onClick={() => openCreate()}>+ Ajouter un joueur</button>}
      </div>

      <div className="ai-panel">
        <div className="ai-panel-main">
          <div className="ai-icon"><Sparkles size={20} /></div>
          <div>
            <div className="eyebrow">Assistant effectif</div>
            <h3>Plan de composition intelligent</h3>
            <p>
              Score de préparation {assistant.readiness}% · Formation conseillée : <b>{assistant.formation}</b>
            </p>
          </div>
        </div>
        <div className="ai-score" aria-label={`Score de préparation ${assistant.readiness}%`}>
          <span style={{ width: `${assistant.readiness}%` }} />
        </div>
        <div className="ai-grid">
          {Object.entries(assistant.counts).map(([poste, count]) => (
            <div className="ai-mini" key={poste}>
              <span>{POSTE_LABELS[poste]}</span>
              <b>{count}</b>
            </div>
          ))}
        </div>
        <div className="ai-advice">
          {assistant.duplicateNumbers.length > 0 ? (
            <div className="ai-alert danger">
              <AlertTriangle size={16} />
              Numéros en double : {assistant.duplicateNumbers.join(', ')}
            </div>
          ) : (
            <div className="ai-alert good">
              <ShieldCheck size={16} />
              Les numéros sont cohérents.
            </div>
          )}
          <div className="ai-alert">
            <Shirt size={16} />
            Prochain numéro libre : {nextAvailableNumber(joueurs) || 'aucun'}
          </div>
          <div className="ai-alert">
            <UserPlus size={16} />
            Priorité : {assistant.missing.length ? assistant.missing.join(', ') : 'effectif équilibré'}
          </div>
        </div>
        {canEdit && (
          <div className="ai-actions">
            <button className="btn btn-primary" onClick={() => openCreate(assistant.recommendedPoste)}>
              Ajouter le profil recommandé
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Joueurs ({joueurs.length})</h3>
        {joueurs.length === 0 ? (
          <div className="empty">Aucun joueur inscrit dans cette équipe.</div>
        ) : (
          <table>
            <thead><tr><th>#</th><th>Nom</th><th>Prénom</th><th>Poste</th><th>Buts</th><th>Passes</th><th>J/R</th><th></th></tr></thead>
            <tbody>
              {joueurs.map(j => (
                <tr key={j.id}>
                  <td>{j.numero ?? '-'}</td>
                  <td>{j.nom}</td>
                  <td>{j.prenom}</td>
                  <td>{j.poste || '-'}</td>
                  <td>{j.buts}</td>
                  <td>{j.passesDecisives}</td>
                  <td>{j.cartonsJaunes} / {j.cartonsRouges}</td>
                  <td style={{ textAlign: 'right' }}>
                    {canEdit && (
                      <>
                        <button className="btn btn-sm" onClick={() => openEdit(j)}>Modifier</button>{' '}
                        <button className="btn btn-sm btn-danger" onClick={() => remove(j.id)}>Suppr.</button>
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
          title={editing === 'new' ? 'Nouveau joueur' : 'Modifier le joueur'}
          subtitle="Identité, poste et statistiques de la saison."
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <div className="fm-grid">
              <AvatarUpload
                endpoint={editing !== 'new' ? `/api/uploads/joueurs/${editing}/photo` : null}
                currentUrl={form.photoUrl}
                fallback={form.prenom ? form.prenom[0].toUpperCase() : 'Photo'}
                onUploaded={url => setForm(f => ({ ...f, photoUrl: url }))}
                disabled={editing === 'new'}
                disabledNote="Enregistrez le joueur, puis rouvrez le formulaire pour ajouter une photo."
              />
              <div className="fm-fields">
                <div className="row">
                  <div className="form-group">
                    <label>Nom <span style={{ color: 'var(--live)' }}>*</span></label>
                    <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Prénom <span style={{ color: 'var(--live)' }}>*</span></label>
                    <input required value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
                  </div>
                </div>
                <div className="row">
                  <div className="form-group">
                    <label>Numéro</label>
                    <div className="input-with-action">
                      <input type="number" min="1" max="99" value={form.numero || ''}
                             onChange={e => setForm({ ...form, numero: e.target.value })} />
                      <button type="button" className="btn btn-sm" onClick={autoNumber}>Auto</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Poste</label>
                    <select value={form.poste || ''} onChange={e => setForm({ ...form, poste: e.target.value })}>
                      <option value="GARDIEN">Gardien</option>
                      <option value="DEFENSEUR">Défenseur</option>
                      <option value="MILIEU">Milieu</option>
                      <option value="ATTAQUANT">Attaquant</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nationalité</label>
                    <input maxLength={3} placeholder="FRA" value={form.nationalite || ''}
                           onChange={e => setForm({ ...form, nationalite: e.target.value.toUpperCase() })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="row" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>Date de naissance</label>
                <input type="date" value={form.dateNaissance || ''}
                       onChange={e => setForm({ ...form, dateNaissance: e.target.value })} />
              </div>
            </div>
            <div className="row">
              <div className="form-group">
                <label>Buts</label>
                <input type="number" min="0" value={form.buts}
                       onChange={e => setForm({ ...form, buts: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Passes décisives</label>
                <input type="number" min="0" value={form.passesDecisives}
                       onChange={e => setForm({ ...form, passesDecisives: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Matchs joués</label>
                <input type="number" min="0" value={form.matchsJoues}
                       onChange={e => setForm({ ...form, matchsJoues: e.target.value })} />
              </div>
            </div>
            <div className="row">
              <div className="form-group">
                <label>Cartons jaunes</label>
                <input type="number" min="0" value={form.cartonsJaunes}
                       onChange={e => setForm({ ...form, cartonsJaunes: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Cartons rouges</label>
                <input type="number" min="0" value={form.cartonsRouges}
                       onChange={e => setForm({ ...form, cartonsRouges: e.target.value })} />
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

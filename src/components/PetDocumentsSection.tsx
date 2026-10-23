import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Pet, PetDocument } from '../types';
import {
  FileText,
  Plus,
  Trash2,
  Image as ImageIcon,
  Camera,
  X,
  ExternalLink,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { Button } from './untitled/Button';

interface PetDocumentsSectionProps {
  pet: Pet;
}

export const PetDocumentsSection: React.FC<PetDocumentsSectionProps> = ({ pet }) => {
  const { addPetDocument, deletePetDocument, showToast } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<PetDocument['category']>('vaccine_card');
  const [docPhotoData, setDocPhotoData] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<PetDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const documents = pet.documents || [];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('Arquivo muito grande. Máximo 3MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDocPhotoData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docPhotoData) {
      showToast('Preencha o título e anexe uma foto ou documento.', 'warning');
      return;
    }

    addPetDocument(pet.id, {
      petId: pet.id,
      title: docTitle.trim(),
      category: docCategory,
      fileUrl: docPhotoData,
    });

    setDocTitle('');
    setDocPhotoData(null);
    setShowAddModal(false);
  };

  const getCategoryLabel = (cat: PetDocument['category']) => {
    switch (cat) {
      case 'vaccine_card': return '💉 Carteira de Vacinação';
      case 'exam': return '🔬 Exame Laboratorial';
      case 'prescription': return '📋 Receita Veterinária';
      default: return '📄 Outro Documento';
    }
  };

  return (
    <div className="rounded-3xl bg-white/95 dark:bg-gray-900/95 border border-gray-200/80 dark:border-gray-800/80 p-5 sm:p-6 shadow-u-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200/60 dark:border-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-u-xs">
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider font-display">
                Carteirinha Digital & Exames
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200/50">
                ACESSO RÁPIDO
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Fotos da carteirinha de vacinas, laudos e receitas do {pet.name}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-u-xs transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Anexar Documento</span>
        </button>
      </div>

      {/* Document cards grid */}
      {documents.length === 0 ? (
        <div className="p-6 text-center rounded-2xl bg-gray-50/60 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-800">
          <FileText className="w-8 h-8 text-violet-400/60 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
            Nenhum documento anexado ainda!
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Tire uma foto da carteirinha de vacinação física ou de exames para ter sempre no bolso em emergências veterinárias.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-3.5 rounded-2xl bg-gray-50/90 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/70 hover:border-violet-400/60 transition-all flex flex-col justify-between group shadow-u-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-violet-600 dark:text-violet-400">
                    {getCategoryLabel(doc.category)}
                  </span>
                  <button
                    onClick={() => deletePetDocument(pet.id, doc.id)}
                    className="p-1 opacity-40 hover:opacity-100 hover:text-error-600 transition-opacity"
                    title="Remover documento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {doc.title}
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Salvo em {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Photo preview thumbnail */}
              <div
                onClick={() => setViewingDoc(doc)}
                className="mt-3 relative h-28 rounded-xl overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700 group-hover:scale-[1.02] transition-transform"
              >
                <img
                  src={doc.fileUrl}
                  alt={doc.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Foto</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      {showAddModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
          <div className="w-full max-w-md max-h-[88dvh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
                Anexar Documento para {pet.name}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Título do Documento *
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ex: Carteira de Vacinação 2026, Hemograma..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:border-violet-500 font-medium"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none font-medium"
                >
                  <option value="vaccine_card">💉 Carteira de Vacinação</option>
                  <option value="exam">🔬 Exame Laboratorial / Raio-X</option>
                  <option value="prescription">📋 Receita Veterinária</option>
                  <option value="other">📄 Outro Documento</option>
                </select>
              </div>

              {/* Upload photo */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Foto / Arquivo do Documento *
                </label>

                {docPhotoData ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <img
                      src={docPhotoData}
                      alt="Preview"
                      className="w-full h-40 object-contain bg-black/5"
                    />
                    <button
                      type="button"
                      onClick={() => setDocPhotoData(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-xl bg-error-600 text-white shadow-u-xs hover:bg-error-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-violet-500 rounded-2xl p-5 text-center bg-gray-50/50 dark:bg-gray-800/30 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Tire uma foto ou selecione da galeria
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      PNG, JPG ou WebP até 3MB
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="tertiary" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={!docPhotoData}>
                  Salvar Documento
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Full-size image preview modal */}
      {viewingDoc && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in overflow-hidden"
          onClick={() => setViewingDoc(null)}
        >
          <div
            className="max-w-2xl w-full max-h-[90dvh] overflow-y-auto bg-gray-900 rounded-3xl border border-gray-800 p-4 space-y-3 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white font-display">
                  {viewingDoc.title}
                </h4>
                <p className="text-xs text-gray-400">
                  {getCategoryLabel(viewingDoc.category)}
                </p>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black max-h-[70vh] flex items-center justify-center">
              <img
                src={viewingDoc.fileUrl}
                alt={viewingDoc.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface AddExerciseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddExerciseModal({ onClose, onSuccess }: AddExerciseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    treatment: '',
    body_part: '',
    description: '',
    youtube_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const treatments = [
    'Rehabilitación física',
    'Post-operatorio',
    'Electroterapia',
    'Pilates terapéutico',
    'Masoterapia',
    'Estiramientos',
    'Fortalecimiento',
    'Movilidad articular',
  ];

  const bodyParts = [
    'Espalda',
    'Hombro',
    'Rodilla',
    'Cadera',
    'Cuello',
    'Tobillo',
    'Codo',
    'Muñeca',
    'Pie',
    'Pelvis',
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const isValidYouTubeUrl = (url: string) => {
    if (!url.trim()) return true;
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[^&\s]{11}(&.*)?$/i;
    return pattern.test(url.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.treatment.trim()) {
      setError('El nombre y tratamiento son requeridos');
      return;
    }

    if (formData.youtube_url && !isValidYouTubeUrl(formData.youtube_url)) {
      setError('URL de YouTube inválida. Ingresa un enlace válido de YouTube.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/exercises/', {
        name: formData.name.trim(),
        treatment: formData.treatment.trim(),
        body_part: formData.body_part.trim() || null,
        description: formData.description.trim() || null,
        youtube_url: formData.youtube_url.trim() || null,
      });

      setError(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el ejercicio');
      console.error('Error creating exercise:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Agregar Nuevo Ejercicio</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle size={18} className="text-red-600" />
              <span className="text-xs text-red-700 font-medium">{error}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nombre del Ejercicio *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ej: Flexión de hombro"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* Treatment */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tipo de Tratamiento *
            </label>
            <select
              name="treatment"
              value={formData.treatment}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              required
            >
              <option value="">Selecciona un tratamiento</option>
              {treatments.map(treatment => (
                <option key={treatment} value={treatment}>{treatment}</option>
              ))}
            </select>
          </div>

          {/* Body Part */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Parte del Cuerpo
            </label>
            <select
              name="body_part"
              value={formData.body_part}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Selecciona una parte (opcional)</option>
              {bodyParts.map(part => (
                <option key={part} value={part}>{part}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe el ejercicio y sus beneficios..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* YouTube URL */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              URL de YouTube
            </label>
            <input
              type="url"
              name="youtube_url"
              value={formData.youtube_url}
              onChange={handleInputChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-slate-500 mt-1">Opcional: copia la URL completa del video de YouTube</p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

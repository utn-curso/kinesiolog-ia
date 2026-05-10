import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import api from '../services/api';
import { Play, Plus, Trash2, Search, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../context/auth';
import { AddExerciseModal } from '../components/AddExerciseModal';

interface Exercise {
  id: number;
  name: string;
  treatment: string;
  body_part?: string;
  description?: string;
  youtube_url?: string;
  created_at: string;
}

export function Ejercicios() {
  const { user } = useAuthStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTreatment, setSelectedTreatment] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);

  // Treatments list
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

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    const filtered = exercises.filter(e => {
      const matchesSearch = 
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.body_part?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTreatment = selectedTreatment === 'all' || e.treatment === selectedTreatment;
      
      return matchesSearch && matchesTreatment;
    });
    setFilteredExercises(filtered);
  }, [searchTerm, selectedTreatment, exercises]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exercises/');
      setExercises(response.data);
      setFilteredExercises(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar los ejercicios');
      console.error('Error fetching exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    fetchExercises();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) {
      return;
    }

    try {
      await api.delete(`/exercises/${id}`);
      await fetchExercises();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar el ejercicio');
      console.error('Error deleting exercise:', err);
    }
  };

  const extractYouTubeId = (url: string) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const id = extractYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  };

  const canEdit = user?.role === 'admin' || user?.role === 'kinesiologo';

  return (
    <AdminLayout pageTitle="Catálogo de Ejercicios">
      <div className="flex-1 p-6 flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Catálogo de Ejercicios</h1>
            <p className="text-sm text-slate-600">Visualiza y gestiona ejercicios terapéuticos con tutoriales en video</p>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              <Plus size={20} />
              Agregar Ejercicio
            </button>
          )}
        </div>

        {/* Search Bar and Treatment Filter */}
        <div className="mb-6 space-y-3">
          {/* Treatment Filter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Filtrar por Tratamiento</label>
            <select
              value={selectedTreatment}
              onChange={(e) => setSelectedTreatment(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium text-slate-700"
            >
              <option value="all">Todos los tratamientos</option>
              {treatments.map(treatment => (
                <option key={treatment} value={treatment}>{treatment}</option>
              ))}
            </select>
          </div>

          {/* Search by name or body part */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre o parte del cuerpo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Cargando ejercicios...</p>
            </div>
          </div>
        )}

        {/* Exercises List */}
        {!loading && (
          <div className="flex-1 overflow-auto">
            {filteredExercises.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                    <AlertCircle size={32} className="text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">No hay ejercicios</p>
                  <p className="text-sm text-slate-500">
                    {searchTerm ? 'No se encontraron ejercicios con esos criterios' : 'No hay ejercicios registrados aún'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExercises.map((exercise) => {
                  const isExpanded = expandedExerciseId === exercise.id;
                  const embedUrl = exercise.youtube_url ? getYouTubeEmbedUrl(exercise.youtube_url) : null;

                  return (
                    <div 
                      key={exercise.id} 
                      className={`bg-white rounded-xl border border-slate-200 transition-all duration-200 overflow-hidden ${
                        isExpanded ? 'shadow-lg ring-1 ring-teal-500/20' : 'hover:border-teal-300'
                      }`}
                    >
                      {/* Row Header */}
                      <div 
                        onClick={() => setExpandedExerciseId(isExpanded ? null : exercise.id)}
                        className="p-4 flex items-center justify-between cursor-pointer select-none group"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isExpanded ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600'
                          }`}>
                            <Play size={20} fill={isExpanded ? 'white' : 'none'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 truncate">{exercise.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                                {exercise.treatment}
                              </span>
                              {exercise.body_part && (
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-100">
                                  {exercise.body_part}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {canEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(exercise.id);
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-teal-600' : 'text-slate-400'}`}>
                            <ChevronDown size={20} />
                          </div>
                        </div>
                      </div>

                      {/* Expandable Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Side: Info */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descripción del ejercicio</h4>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                  {exercise.description || 'Sin descripción disponible.'}
                                </p>
                              </div>
                              <div className="pt-4 flex gap-3">
                                {exercise.youtube_url && (
                                  <a 
                                    href={exercise.youtube_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
                                  >
                                    Ver en YouTube ↗
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Right Side: Player */}
                            <div className="w-full">
                              {embedUrl ? (
                                <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
                                  <iframe
                                    src={embedUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={exercise.name}
                                  />
                                </div>
                              ) : (
                                <div className="aspect-video rounded-xl bg-slate-200 flex flex-col items-center justify-center text-slate-500">
                                  <AlertCircle size={32} className="mb-2 opacity-20" />
                                  <p className="text-xs font-medium">No hay video disponible</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Exercise Modal */}
        {showModal && (
          <AddExerciseModal 
            onClose={() => setShowModal(false)} 
            onSuccess={handleSuccess} 
          />
        )}
      </div>
    </AdminLayout>
  );
}

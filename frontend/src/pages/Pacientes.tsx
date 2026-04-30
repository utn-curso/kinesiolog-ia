import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import api from '../services/api';
import { Mail, Phone, Calendar, Search, AlertCircle } from 'lucide-react';

interface Patient {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export function Pacientes() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'nombre' | 'email'>('all');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      
      if (searchType === 'nombre') {
        return p.full_name.toLowerCase().includes(searchLower);
      } else if (searchType === 'email') {
        return p.email.toLowerCase().includes(searchLower);
      } else {
        // 'all'
        return (
          p.full_name.toLowerCase().includes(searchLower) ||
          p.email.toLowerCase().includes(searchLower)
        );
      }
    });
    setFilteredPatients(filtered);
  }, [searchTerm, searchType, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/pacientes');
      setPatients(response.data);
      setFilteredPatients(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar los pacientes');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout pageTitle="Gestión de Pacientes">
      <div className="flex-1 p-6 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Listado de Pacientes</h1>
          <p className="text-sm text-slate-600">Visualiza y gestiona todos los pacientes registrados en el sistema</p>
        </div>

        {/* Search Bar with Filter */}
        <div className="mb-6 flex gap-3">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'all' | 'nombre' | 'email')}
            className="px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium text-slate-700"
          >
            <option value="all">Todos los campos</option>
            <option value="nombre">Nombre</option>
            <option value="email">Email</option>
          </select>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={
                searchType === 'nombre'
                  ? 'Buscar por nombre...'
                  : searchType === 'email'
                  ? 'Buscar por email...'
                  : 'Buscar por nombre o email...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
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
              <p className="text-slate-600 font-medium">Cargando pacientes...</p>
            </div>
          </div>
        )}

        {/* Patients Table */}
        {!loading && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {filteredPatients.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-12">
                  <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                    <AlertCircle size={32} className="text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">No hay pacientes</p>
                  <p className="text-sm text-slate-500">
                    {searchTerm ? 'No se encontraron pacientes con esos criterios' : 'No hay pacientes registrados aún'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                {/* Table Header */}
                <div className="overflow-x-auto flex-1">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Teléfono</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Registrado</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white font-semibold text-sm">
                                {patient.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                              <span className="font-medium text-slate-900">{patient.full_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <a href={`mailto:${patient.email}`} className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
                              <Mail size={16} />
                              {patient.email}
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <a href={`tel:${patient.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
                              <Phone size={16} />
                              {patient.phone}
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar size={16} />
                              {formatDate(patient.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              patient.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {patient.is_active ? '✓ Activo' : '✗ Inactivo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer with count */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    Mostrando <span className="font-semibold">{filteredPatients.length}</span> de <span className="font-semibold">{patients.length}</span> pacientes
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

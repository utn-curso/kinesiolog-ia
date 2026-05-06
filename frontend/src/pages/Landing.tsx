import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { userApi } from '../services/api'

interface Kinesiologo {
  kinesiologo_id: number
  user_id: number
  full_name: string
  email: string
  specialty: string | null
}

export default function Landing() {
  const [kinesiologos, setKinesiologos] = useState<Kinesiologo[]>([])
  const [showTerms, setShowTerms] = useState(false)

  useEffect(() => {
    const loadKinesiologos = async () => {
      try {
        const response = await userApi.getKinesiologosProfiles()
        setKinesiologos(response.data.slice(0, 3)) // Máximo 3
      } catch (error) {
        console.error('Error loading kinesiologos:', error)
        setKinesiologos([])
      }
    }
    loadKinesiologos()
  }, [])

  const colors = ['from-teal-600 to-teal-400', 'from-blue-600 to-blue-400', 'from-orange-500 to-orange-300']
  
  return (
    <Layout>
      {/* Legal Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 z-[9999] animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-teal-100">⚖️</div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Términos, Condiciones y Privacidad</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Marco Legal y Protección de Datos de Salud (Ley 25.326 & 26.529)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTerms(false)}
                className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto custom-scrollbar bg-white">
              <div className="prose prose-slate max-w-none">
                <div className="space-y-10">
                  {/* Introducción */}
                  <div className="bg-teal-50/50 p-6 rounded-2xl border border-teal-100 mb-8">
                    <p className="text-sm text-teal-800 leading-relaxed font-medium">
                      El presente documento establece el marco legal que regula la relación entre el <strong>Centro de Kinesiología & Fisioterapia KineMov</strong> y sus pacientes, en estricto cumplimiento con la normativa de la República Argentina, garantizando la seguridad jurídica y la protección integral de los derechos de salud.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {/* Sección 1 */}
                    <section>
                      <h4 className="text-[11px] font-black text-teal-600 uppercase tracking-widest mb-4 flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-[10px] shadow-sm">01</span>
                        Consentimiento Informado
                      </h4>
                      <p className="text-[13px] text-slate-600 leading-relaxed">
                        De acuerdo a la <strong>Ley 26.529 de Derechos del Paciente</strong>, el inicio de cualquier tratamiento kinésico requiere la aceptación de los procedimientos propuestos. El paciente declara que el profesional ha explicado de manera clara los objetivos, técnicas y posibles riesgos de la rehabilitación, otorgando su conformidad libre y voluntaria para el abordaje terapéutico.
                      </p>
                    </section>

                    {/* Sección 2 */}
                    <section>
                      <h4 className="text-[11px] font-black text-teal-600 uppercase tracking-widest mb-4 flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-[10px] shadow-sm">02</span>
                        Historia Clínica Digital
                      </h4>
                      <p className="text-[13px] text-slate-600 leading-relaxed">
                        KineMov actúa como depositario de la <strong>Historia Clínica</strong> del paciente, la cual es de propiedad del mismo. Nos comprometemos a mantener su integridad, confidencialidad y disponibilidad técnica. El paciente tiene derecho a solicitar copia de su HC en cualquier momento, conforme a los plazos legales establecidos.
                      </p>
                    </section>

                    {/* Sección 3 */}
                    <section>
                      <h4 className="text-[11px] font-black text-teal-600 uppercase tracking-widest mb-4 flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-[10px] shadow-sm">03</span>
                        Protección de Datos Sensibles
                      </h4>
                      <p className="text-[13px] text-slate-600 leading-relaxed">
                        Sus datos de salud son considerados <strong>"Datos Sensibles"</strong> por la <strong>Ley 25.326</strong>. KineMov implementa medidas de seguridad de nivel crítico para evitar el acceso no autorizado. Los datos recolectados se utilizan exclusivamente para la gestión asistencial, administrativa y de seguimiento profesional. No se realizarán cesiones a terceros sin consentimiento expreso.
                      </p>
                    </section>

                    {/* Sección 4 */}
                    <section>
                      <h4 className="text-[11px] font-black text-teal-600 uppercase tracking-widest mb-4 flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-[10px] shadow-sm">04</span>
                        Política de Cancelación Estricta
                      </h4>
                      <p className="text-[13px] text-slate-600 leading-relaxed">
                        Dada la naturaleza del servicio asistencial, la inasistencia sin aviso perjudica la atención de otros pacientes en lista de espera. Las sesiones deben cancelarse con <strong>24 horas de antelación</strong>. En caso de inasistencia injustificada o aviso tardío, el centro se reserva el derecho de cobrar el valor total de la sesión.
                      </p>
                    </section>

                    {/* Sección 5 */}
                    <section>
                      <h4 className="text-[11px] font-black text-teal-600 uppercase tracking-widest mb-4 flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-[10px] shadow-sm">05</span>
                        Responsabilidad del Paciente
                      </h4>
                      <p className="text-[13px] text-slate-600 leading-relaxed">
                        El paciente asume el compromiso de brindar información veraz sobre su estado de salud, cirugías previas y medicación. El ocultamiento de patologías preexistentes libera de responsabilidad al centro y al profesional tratante ante cualquier complicación derivada de dicha omisión.
                      </p>
                    </section>

                    {/* Sección 6 */}
                    <section>
                      <h4 className="text-[11px] font-black text-teal-600 uppercase tracking-widest mb-4 flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-[10px] shadow-sm">06</span>
                        Jurisdicción y Ley Aplicable
                      </h4>
                      <p className="text-[13px] text-slate-600 leading-relaxed">
                        Ante cualquier controversia legal derivada del uso de esta plataforma o de la prestación del servicio kinésico, las partes se someten a la jurisdicción de los <strong>Tribunales Ordinarios de la Ciudad de Mar del Plata</strong>, renunciando a cualquier otro fuero o jurisdicción.
                      </p>
                    </section>
                  </div>

                  <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-teal-500/30 transition-all duration-700"></div>
                    <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-[0.3em] mb-4">Derechos ARCO</h4>
                    <p className="text-[13px] text-slate-300 leading-relaxed mb-6">
                      Usted puede ejercer sus derechos de <strong>Acceso, Rectificación, Actualización y Supresión</strong> de sus datos personales enviando un correo electrónico a <span className="text-teal-400 font-bold">privacidad@kinemov.com.ar</span> adjuntando copia de su DNI para validar identidad.
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black italic">
                      <span>Ref: Agencia de Acceso a la Información Pública (AAIP)</span>
                    </div>
                  </section>
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Versión 2.0.1 - Actualizado Mayo 2026</p>
              <button 
                onClick={() => setShowTerms(false)}
                className="px-12 py-4 bg-teal-600 text-white text-xs font-black rounded-2xl hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 hover:scale-[1.02] active:scale-[0.98]"
              >
                ACEPTO LOS TÉRMINOS Y CONDICIONES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 font-bold text-xs px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              <span className="text-teal-500">✦</span> Centro de Kinesiología
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight">
              Tu recuperación, <br />
              <span className="text-teal-600">en el mejor camino</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
              Turnos online, seguimiento personalizado y atención especializada para cada etapa de tu rehabilitación física y bienestar.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link to="/booking">
                <Button className="px-8 py-4 text-base shadow-lg shadow-teal-100">Reservar Turno</Button>
              </Link>
              <Button
                variant="secondary"
                className="px-8 py-4 text-base"
                onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver Servicios
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-teal-100/50 rounded-3xl blur-2xl transform rotate-3"></div>
            <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
              <img 
                src="/hero-bg.png" 
                alt="Clinic" 
                className="w-full h-[400px] object-cover opacity-90"
              />
              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-4">
                <div className="bg-white/90 backdrop-blur p-4 rounded-xl shadow-sm border border-white/20">
                  <div className="text-2xl font-black text-teal-600">+1.200</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Turnos anuales</div>
                </div>
                <div className="bg-white/90 backdrop-blur p-4 rounded-xl shadow-sm border border-white/20">
                  <div className="text-2xl font-black text-orange-500">4.9/5</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Satisfacción</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Nuestros Servicios</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">Tratamientos personalizados para tu recuperación y bienestar físico con tecnología de vanguardia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '🔍', title: 'Evaluación kinésica', desc: 'Diagnóstico funcional completo para diseñar tu plan de tratamiento personalizado.' },
              { icon: '🤸', title: 'Rehabilitación física', desc: 'Ejercicios terapéuticos y técnicas manuales para tu recuperación óptima.' },
              { icon: '⚡', title: 'Electroterapia', desc: 'Tratamientos con ultrasonido, TENS y corrientes para el alivio eficaz del dolor.' },
              { icon: '🧘', title: 'Pilates terapéutico', desc: 'Método Pilates adaptado a patologías específicas con seguimiento continuo.' },
              { icon: '🦵', title: 'Post-operatorio', desc: 'Acompañamiento especializado en la recuperación integral después de cirugías.' },
              { icon: '💪', title: 'Deporte y prevención', desc: 'Preparación y prevención de lesiones para deportistas amateurs y profesionales.' },
            ].map((svc, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-teal-500 transition-all hover:shadow-xl group cursor-default">
                <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  {svc.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{svc.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      {kinesiologos.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Nuestro Equipo</h2>
              <p className="text-slate-500 max-w-2xl mx-auto font-medium">Profesionales matriculados con años de experiencia dedicados a tu salud.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {kinesiologos.map((kine, i) => {
                const initials = kine.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                return (
                  <div key={kine.kinesiologo_id} className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100 hover:shadow-lg transition-shadow">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-white font-black text-2xl mx-auto mb-6 shadow-md`}>
                      {initials}
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">{kine.full_name}</h4>
                    <span className="inline-block bg-teal-100 text-teal-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4">
                      {kine.specialty || 'General'}
                    </span>
                    <p className="text-slate-500 text-sm leading-relaxed">Profesional especializado en kinesiología con experiencia en tratamientos personalizados.</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black mb-6">¿Dónde estamos?</h2>
            <p className="text-slate-400 mb-10 text-lg leading-relaxed">
              Encontranos en el centro de la ciudad, con acceso fácil y atención personalizada.
            </p>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">📍</div>
                <div>
                  <div className="font-bold">Dirección</div>
                  <div className="text-slate-400 text-sm">Av. Colón 1234, Mar del Plata, Argentina</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">🕐</div>
                <div>
                  <div className="font-bold">Horarios</div>
                  <div className="text-slate-400 text-sm">Lunes a Viernes: 8:00 – 20:00 | Sábados: 9:00 – 13:00</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">📞</div>
                <div>
                  <div className="font-bold">Contacto</div>
                  <div className="text-slate-400 text-sm">+54 223 456-7890 | info@kinemov.com.ar</div>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <iframe
              title="KineMov - Google Maps"
              src="https://www.google.com/maps?q=Av.+Col%C3%B3n+1234,+Mar+del+Plata,+Argentina&output=embed"
              className="w-full h-[400px]"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 py-8 text-center text-slate-500 text-xs border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-black text-teal-600 text-base">Kine<span className="text-white">Mov</span></div>
          <div>© 2026 Centro de Kinesiología & Fisioterapia. Todos los derechos reservados.</div>
          <div className="flex gap-6">
            <button 
              onClick={() => setShowTerms(true)}
              className="hover:text-white transition-colors font-bold uppercase tracking-widest text-[10px]"
            >
              Términos y Privacidad
            </button>
          </div>
        </div>
      </footer>
    </Layout>
  )
}

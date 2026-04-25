import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'

export default function Landing() {
  return (
    <Layout>
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
              <Link to="/login">
                <Button variant="secondary" className="px-8 py-4 text-base">Ver Servicios</Button>
              </Link>
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
      <section className="py-24 bg-slate-50">
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
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Nuestro Equipo</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">Profesionales matriculados con años de experiencia dedicados a tu salud.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Lic. María Acosta', esp: 'Traumatología', desc: '10 años de experiencia en rehabilitación post-quirúrgica y deportiva.', initial: 'MA', color: 'from-teal-600 to-teal-400' },
              { name: 'Lic. Juan Rodríguez', esp: 'Neurológica', desc: 'Especialista en patologías neurológicas y rehabilitación funcional compleja.', initial: 'JR', color: 'from-blue-600 to-blue-400' },
              { name: 'Lic. Sofía Vega', esp: 'Pilates', desc: 'Instructora certificada en Pilates terapéutico y kinesiología deportiva.', initial: 'SV', color: 'from-orange-500 to-orange-300' },
            ].map((pro, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100 hover:shadow-lg transition-shadow">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${pro.color} flex items-center justify-center text-white font-black text-2xl mx-auto mb-6 shadow-md`}>
                  {pro.initial}
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{pro.name}</h4>
                <span className="inline-block bg-teal-100 text-teal-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4">
                  {pro.esp}
                </span>
                <p className="text-slate-500 text-sm leading-relaxed">{pro.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
          <div className="h-[400px] bg-slate-800 rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i12!2i1024!3i1536!2m3!1e0!2sm!3i388172593!3m8!2ses!3sAR!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!5f2!23i1301875')] bg-cover"></div>
            <div className="relative z-10 text-center">
              <div className="text-4xl mb-4 transform group-hover:scale-125 transition-transform">📍</div>
              <div className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-sm shadow-xl">Google Maps — KineMov</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 py-8 text-center text-slate-500 text-xs border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-black text-teal-600 text-base">Kine<span className="text-white">Mov</span></div>
          <div>© 2026 Centro de Kinesiología & Fisioterapia. Todos los derechos reservados.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>
    </Layout>
  )
}
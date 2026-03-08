import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

import { createClient } from "@supabase/supabase-js";

// --- SUPABASE CLIENT ---
const SUPABASE_URL = "https://dqptchwkulrzcpofuafk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcHRjaHdrdWxyemNwb2Z1YWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTk1MDcsImV4cCI6MjA4ODU3NTUwN30.IeNQhPV8JkzU69uPb6Smfao_goqUeiOCqdmhg8Cdqm4";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DATA ---
const ISLANDS = {
  TF: { name: "Tenerife", color: "#F59E0B", code: "TF" },
  GC: { name: "Gran Canaria", color: "#3B82F6", code: "GC" },
  LP: { name: "La Palma", color: "#10B981", code: "LP" },
  FU: { name: "Fuerteventura", color: "#EC4899", code: "FU" },
  LZ: { name: "Lanzarote", color: "#8B5CF6", code: "LZ" },
  GO: { name: "La Gomera", color: "#F97316", code: "GO" },
  HI: { name: "El Hierro", color: "#06B6D4", code: "HI" },
};

// --- COMPONENTS ---
const AnimatedNumber = ({ value, duration = 2000, suffix = "" }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, value, duration]);

  return <span ref={ref}>{display.toLocaleString("es-ES")}{suffix}</span>;
};

const GlowOrb = ({ color, size = 300, top, left, delay = 0 }) => (
  <div style={{
    position: "absolute", top, left, width: size, height: size,
    background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
    borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none",
    animation: `float ${6 + delay}s ease-in-out infinite alternate`,
    animationDelay: `${delay}s`,
  }} />
);

const StatCard = ({ label, value, suffix = "", sub, accent, delay = 0 }) => (
  <div style={{
    background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20, padding: "28px 24px", position: "relative", overflow: "hidden",
    backdropFilter: "blur(20px)", animation: `slideUp 0.8s ease-out ${delay}s both`,
  }}>
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 2,
      background: `linear-gradient(90deg, transparent, ${accent || "#F59E0B"}, transparent)`
    }} />
    <div style={{
      fontSize: 13, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase",
      fontFamily: "'DM Sans', sans-serif", marginBottom: 8
    }}>{label}</div>
    <div style={{
      fontSize: 42, fontWeight: 700, color: "#F8FAFC",
      fontFamily: "'Instrument Serif', serif", lineHeight: 1
    }}>
      <AnimatedNumber value={value} suffix={suffix} />
    </div>
    {sub && <div style={{ fontSize: 13, color: "#64748B", marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>}
  </div>
);

const IslandDot = ({ island, data, selected, onClick, index }) => {
  const positions = {
    TF: { x: "58%", y: "35%" }, GC: { x: "35%", y: "55%" }, LP: { x: "78%", y: "20%" },
    FU: { x: "18%", y: "45%" }, LZ: { x: "12%", y: "25%" }, GO: { x: "72%", y: "42%" },
    HI: { x: "85%", y: "48%" },
  };
  const pos = positions[island];
  const size = Math.max(18, Math.sqrt(data.plazas) * 1.2);
  return (
    <div onClick={onClick} style={{
      position: "absolute", left: pos.x, top: pos.y, transform: "translate(-50%, -50%)",
      cursor: "pointer", zIndex: selected ? 10 : 1, transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      animation: `popIn 0.6s ease-out ${index * 0.1}s both`,
    }}>
      <div style={{
        width: size, height: size, borderRadius: "50%", background: data.color,
        boxShadow: selected ? `0 0 30px ${data.color}88, 0 0 60px ${data.color}44` : `0 0 15px ${data.color}44`,
        transform: selected ? "scale(1.4)" : "scale(1)", transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        animation: `pulse ${3 + index * 0.5}s ease-in-out infinite`,
      }} />
      <div style={{
        position: "absolute", top: "110%", left: "50%", transform: "translateX(-50%)",
        whiteSpace: "nowrap", fontSize: 11, fontWeight: 600, color: selected ? "#F8FAFC" : "#94A3B8",
        fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em", transition: "color 0.3s",
      }}>{data.name}</div>
      {selected && (
        <div style={{
          position: "absolute", bottom: "120%", left: "50%", transform: "translateX(-50%)",
          background: "rgba(15,23,42,0.95)", border: `1px solid ${data.color}44`,
          borderRadius: 12, padding: "10px 16px", whiteSpace: "nowrap", backdropFilter: "blur(20px)",
          animation: "fadeIn 0.3s ease-out",
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: data.color, fontFamily: "'Instrument Serif', serif" }}>
            {data.plazas}
          </div>
          <div style={{ fontSize: 11, color: "#94A3B8" }}>plazas adjudicadas</div>
        </div>
      )}
    </div>
  );
};

const ProbabilityBar = ({ label, value, color, delay = 0 }) => (
  <div style={{ marginBottom: 16, animation: `slideRight 0.8s ease-out ${delay}s both` }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 14, color: "#CBD5E1", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'DM Sans', sans-serif" }}>{value}%</span>
    </div>
    <div style={{ height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${value}%`, borderRadius: 4,
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
        boxShadow: `0 0 20px ${color}44`,
        animation: `growWidth 1.5s ease-out ${delay + 0.3}s both`,
      }} />
    </div>
  </div>
);

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12, padding: "12px 16px", backdropFilter: "blur(20px)",
    }}>
      <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#F59E0B", fontFamily: "'Instrument Serif', serif" }}>
        {payload[0].value.toLocaleString("es-ES")}
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [inputOrden, setInputOrden] = useState("");
  const [inputEspecialidad, setInputEspecialidad] = useState("Filosofía");
  const [especialidadesList, setEspecialidadesList] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedIsland, setSelectedIsland] = useState("TF");

  useEffect(() => {
    // Cargar especialidades únicas al montar
    const fetchEspecialidades = async () => {
      const { data } = await supabase.from("adjudicaciones").select("especialidad");
      if (data) {
        const unique = [...new Set(data.map(d => d.especialidad).filter(Boolean))];
        setEspecialidadesList(unique.sort());
      }
    };
    fetchEspecialidades();
  }, []);

  const handleAnalyze = async () => {
    if (!inputOrden || !inputEspecialidad) return;
    setIsAnalyzing(true);

    // Consultar todos los adjudicados de esa especialidad
    const { data, error } = await supabase
      .from("adjudicaciones")
      .select("*")
      .eq("especialidad", inputEspecialidad)
      .eq("obtiene_destino", true);

    if (data && data.length > 0) {
      const maxOrden = Math.max(...data.map(d => d.orden || 0));
      const myOrden = parseInt(inputOrden);

      // Agrupar por islas
      const byIsland = {};
      Object.keys(ISLANDS).forEach(i => byIsland[i] = { plazas: 0, orderCut: 0 });

      const tipoCounter = {};

      data.forEach(d => {
        if (d.isla && byIsland[d.isla]) {
          byIsland[d.isla].plazas += 1;
          byIsland[d.isla].orderCut = Math.max(byIsland[d.isla].orderCut, d.orden || 0);
        }
        if (d.tipo_participante) {
          tipoCounter[d.tipo_participante] = (tipoCounter[d.tipo_participante] || 0) + 1;
        }
      });

      // Construir probabilidades fake-inteligentes basadas en la distancia al corte
      const probabilities = Object.keys(ISLANDS).map(k => {
        let prob = 0;
        const cutoff = byIsland[k].orderCut;
        if (cutoff > 0) {
          if (myOrden <= cutoff) prob = 98 - (myOrden / cutoff) * 15;
          else if (myOrden <= cutoff * 1.2) prob = 50 - ((myOrden - cutoff) / (cutoff * 0.2)) * 30;
          else prob = Math.max(0, 15 - ((myOrden - cutoff) / cutoff) * 10);
        }
        return { island: k, name: ISLANDS[k].name, prob: Math.floor(Math.max(1, prob)), color: ISLANDS[k].color };
      }).sort((a, b) => b.prob - a.prob);

      // Colores por defecto para el chart de tipos
      const colors = ["#3B82F6", "#F59E0B", "#10B981", "#EC4899", "#6B7280", "#8B5CF6", "#06B6D4"];
      const chartTipos = Object.entries(tipoCounter)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((e, i) => ({ name: e[0].substring(0, 20), value: e[1], color: colors[i] }));

      setStats({
        totalPlazas: data.length,
        maxOrdenListado: maxOrden,
        isInside: myOrden <= maxOrden,
        myOrden: myOrden,
        espName: inputEspecialidad,
        probabilities,
        islandsData: byIsland,
        tiposData: chartTipos,
        lastAgreements: data.slice(-8)
      });
    }

    setIsAnalyzing(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0E1A", color: "#F8FAFC", position: "relative", overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        @keyframes float { 0% { transform: translateY(0px) scale(1); } 100% { transform: translateY(-30px) scale(1.1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: translate(-50%, -50%) scale(0); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        @keyframes pulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        @keyframes growWidth { from { width: 0%; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes typewriter { from { width: 0; } to { width: 100%; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* Background orbs */}
      <GlowOrb color="#F59E0B" size={400} top="-10%" left="70%" delay={0} />
      <GlowOrb color="#3B82F6" size={350} top="40%" left="-5%" delay={2} />
      <GlowOrb color="#EC4899" size={300} top="80%" left="60%" delay={4} />

      {/* Noise texture overlay */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.015, pointerEvents: "none", zIndex: 100,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

        {/* --- HEADER --- */}
        <header style={{
          padding: "32px 0 48px", animation: "slideUp 0.8s ease-out both",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 4,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%", background: "#F59E0B",
                boxShadow: "0 0 15px #F59E0B88",
              }} />
              <span style={{
                fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", color: "#94A3B8",
                textTransform: "uppercase"
              }}>
                Adjudicaciones Canarias
              </span>
            </div>
            <h1 style={{
              fontSize: 28, fontWeight: 400, fontFamily: "'Instrument Serif', serif",
              background: "linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Destinos Provisionales <span style={{ fontStyle: "italic" }}>2025/26</span>
            </h1>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            padding: "10px 24px", borderRadius: 100, fontSize: 13, fontWeight: 600,
            cursor: "pointer", letterSpacing: "0.03em",
            boxShadow: "0 4px 20px rgba(245, 158, 11, 0.3)",
            transition: "all 0.3s",
          }}>
            Acceder a mi perfil
          </div>
        </header>

        {/* --- SEARCH FORM BAR --- */}
        <section style={{
          background: "rgba(15,23,42,0.6)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)",
          padding: "24px", marginBottom: 32, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end",
          backdropFilter: "blur(20px)", animation: "slideUp 0.8s ease-out 0.1s both", position: "relative", zIndex: 10
        }}>
          <div style={{ flex: "1 1 px" }}>
            <label style={{ display: "block", fontSize: 13, color: "#94A3B8", marginBottom: 8, fontWeight: 600 }}>Especialidad</label>
            <select value={inputEspecialidad} onChange={e => setInputEspecialidad(e.target.value)}
              style={{
                width: "100%", background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "14px 16px", color: "#F8FAFC", fontFamily: "'DM Sans'", fontSize: 15, outline: "none"
              }}>
              {especialidadesList.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontSize: 13, color: "#94A3B8", marginBottom: 8, fontWeight: 600 }}>Tu número de lista actual</label>
            <input type="number" placeholder="Ej. 134" value={inputOrden} onChange={e => setInputOrden(e.target.value)}
              style={{
                width: "100%", background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: "14px 16px", color: "#F8FAFC", fontFamily: "'DM Sans'", fontSize: 15, outline: "none"
              }} />
          </div>
          <button onClick={handleAnalyze} disabled={isAnalyzing || !inputOrden} style={{
            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            color: "#FFF", fontWeight: 700, padding: "14px 32px", borderRadius: 12, border: "none",
            cursor: "pointer", fontSize: 15, boxShadow: "0 8px 30px rgba(245, 158, 11, 0.3)", opacity: inputOrden ? 1 : 0.5,
            transition: "transform 0.2s"
          }}>
            {isAnalyzing ? "Analizando..." : "Analizar Opciones"}
          </button>
        </section>

        {stats && (
          <div style={{ animation: "fadeIn 0.8s" }}>
            {/* --- HERO PERSONAL --- */}
            <section style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(59,130,246,0.04) 100%)",
              border: "1px solid rgba(245,158,11,0.12)",
              borderRadius: 24, padding: "40px 40px 36px", marginBottom: 32,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: "linear-gradient(90deg, transparent, #F59E0B, #3B82F6, transparent)",
                backgroundSize: "200% 100%", animation: "gradientMove 4s ease-in-out infinite"
              }} />
              <div style={{ display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 400px" }}>
                  <div style={{
                    fontSize: 13, color: "#F59E0B", fontWeight: 600, letterSpacing: "0.1em",
                    textTransform: "uppercase", marginBottom: 12
                  }}>Proyección del sistema</div>
                  <h2 style={{
                    fontSize: 36, fontFamily: "'Instrument Serif', serif", fontWeight: 400,
                    lineHeight: 1.2, marginBottom: 16
                  }}>
                    Basado en tu orden <span style={{
                      color: "#F59E0B", fontWeight: 700,
                      fontFamily: "'DM Sans', sans-serif"
                    }}>#{stats.myOrden}</span> para{" "}
                    <span style={{ fontStyle: "italic" }}>{stats.espName.split("-").pop().trim()}</span>
                  </h2>
                  <p style={{ fontSize: 15, color: "#94A3B8", lineHeight: 1.7, maxWidth: 480 }}>
                    Se adjudicaron <strong style={{ color: "#F8FAFC" }}>{stats.totalPlazas} plazas</strong> de esta especialidad en todas las islas.
                    El último docente en conseguir destino general (no comisionado extremo) estaba en el puesto <strong style={{ color: "#F59E0B" }}>#{stats.maxOrdenListado}</strong>.
                    {stats.isInside
                      ? " Según esto, estás virtualmente dentro. ¡Enhorabuena anticipada!"
                      : " Aunque estás por encima del pico general, aún hay probabilidades en vacantes sobrevenidas."}
                  </p>
                </div>
                <div style={{ flex: "0 0 280px" }}>
                  {stats.probabilities.slice(0, 5).map((p, i) => (
                    <ProbabilityBar key={p.island} label={p.name} value={p.prob} color={p.color} delay={0.3 + i * 0.2} />
                  ))}
                </div>
              </div>
            </section>

            {/* --- MAP + CHART ROW --- */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
              <div style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: 32,
                position: "relative", minHeight: 340,
              }}>
                <div style={{
                  fontSize: 13, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase", marginBottom: 16
                }}>Destinos Reales por Isla</div>
                <div style={{ position: "relative", height: 260 }}>
                  {Object.entries(ISLANDS).map(([code, config], i) => (
                    <IslandDot key={code} island={code} data={{ ...config, plazas: stats.islandsData[code].plazas }}
                      selected={selectedIsland === code}
                      onClick={() => setSelectedIsland(code)} index={i} />
                  ))}
                </div>
              </div>

              {/* Tipos de participante */}
              <div style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: 32,
              }}>
                <div style={{
                  fontSize: 13, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase", marginBottom: 16
                }}>Tipos de adjudicación</div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={stats.tiposData} dataKey="value" cx="50%" cy="50%" innerRadius={45}
                      outerRadius={70} paddingAngle={3} animationDuration={1500} animationBegin={500}>
                      {stats.tiposData.map((t, i) => <Cell key={i} fill={t.color} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div style={{
                          background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 10, padding: "8px 14px", backdropFilter: "blur(20px)",
                        }}>
                          <div style={{ fontSize: 11, color: "#94A3B8" }}>{payload[0].name}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: payload[0].payload.color }}>
                            {payload[0].value.toLocaleString("es-ES")}
                          </div>
                        </div>
                      );
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                  {stats.tiposData.map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, width: "calc(50% - 4px)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* --- CENTRO DETAIL TABLE --- */}
            <div style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: 32, marginBottom: 32,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{
                    fontSize: 13, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase"
                  }}>Asignaciones finales registradas</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>Tu lista: {stats.espName.split("-").pop().trim()}</div>
                </div>
              </div>
              <div style={{ overflow: "hidden", borderRadius: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Orden", "Nombre Oculto", "Destino Asignado", "Isla"].map(h => (
                        <th key={h} style={{
                          padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600,
                          color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lastAgreements.map((r, i) => (
                      <tr key={i} style={{
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        transition: "background 0.2s",
                        cursor: "pointer",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "14px 16px", fontSize: 14, color: "#64748B", fontWeight: 600 }}>{r.orden}</td>
                        <td style={{ padding: "14px 16px", fontSize: 14, color: "#F8FAFC", fontWeight: 500 }}>{r.nombre}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#CBD5E1" }}>
                          {r.centro} <br />
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>{r.municipio}</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            background: `${(ISLANDS[r.isla] || { color: "#aaa" }).color}15`,
                            color: (ISLANDS[r.isla] || { color: "#aaa" }).color,
                            padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                          }}>{r.isla || "N/A"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* --- FOOTER --- */}
        <footer style={{
          padding: "32px 0 48px", textAlign: "center", animation: "slideUp 0.8s ease-out 1.2s both",
        }}>
          <div style={{ fontSize: 12, color: "#334155" }}>
            Datos extraídos de las resoluciones oficiales de la Consejería de Educación del Gobierno de Canarias
          </div>
          <div style={{ fontSize: 11, color: "#1E293B", marginTop: 4 }}>
            © 2026 EduCanarias · Herramienta no oficial · Los datos tienen carácter informativo
          </div>
        </footer>
      </div>
    </div>
  );
}

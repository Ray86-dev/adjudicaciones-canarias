import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, MapPin } from "lucide-react";

// --- SUPABASE CLIENT ---
const SUPABASE_URL = "https://dqptchwkulrzcpofuafk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcHRjaHdrdWxyemNwb2Z1YWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTk1MDcsImV4cCI6MjA4ODU3NTUwN30.IeNQhPV8JkzU69uPb6Smfao_goqUeiOCqdmhg8Cdqm4";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DATA ---
const ISLANDS = {
  LP: { name: "La Palma", color: "#10B981", code: "LP" },
  HI: { name: "El Hierro", color: "#06B6D4", code: "HI" },
  GO: { name: "La Gomera", color: "#F97316", code: "GO" },
  TF: { name: "Tenerife", color: "#F59E0B", code: "TF" },
  GC: { name: "Gran Canaria", color: "#3B82F6", code: "GC" },
  FU: { name: "Fuerteventura", color: "#EC4899", code: "FU" },
  LZ: { name: "Lanzarote", color: "#8B5CF6", code: "LZ" },
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
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, y: [0, -30, 0] }}
    transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay: delay }}
    style={{
      position: "absolute", top, left, width: size, height: size,
      background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
      borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none", zIndex: 0
    }}
  />
);

const IslandDot = ({ island, data, selected, onClick, index, activeFilter }) => {
  // Ajuste geoespacial preciso aproximado del archipiélago canario
  const positions = {
    LP: { x: "18%", y: "25%" },
    HI: { x: "12%", y: "85%" },
    GO: { x: "30%", y: "65%" },
    TF: { x: "48%", y: "45%" },
    GC: { x: "65%", y: "75%" },
    FU: { x: "85%", y: "65%" },
    LZ: { x: "92%", y: "15%" },
  };
  const pos = positions[island];
  const isAvailable = activeFilter.includes(island);
  // Escalar un poco menos drásticamente el tamaño
  const baseSize = data.plazas > 0 ? Math.max(16, Math.min(45, Math.sqrt(data.plazas) * 2.5)) : 10;

  return (
    <motion.div
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: isAvailable ? 1 : 0.3 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: index * 0.05 }}
      style={{
        position: "absolute", left: pos.x, top: pos.y, transform: "translate(-50%, -50%)",
        cursor: "pointer", zIndex: selected ? 10 : 1,
      }}
    >
      <motion.div
        animate={{
          scale: selected ? 1.3 : 1,
          boxShadow: selected ? `0 0 30px ${data.color}88, 0 0 60px ${data.color}44` : (isAvailable && data.plazas > 0 ? `0 0 15px ${data.color}44` : 'none')
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          width: baseSize, height: baseSize, borderRadius: "50%",
          background: data.plazas > 0 || selected ? data.color : "#475569",
          border: isAvailable ? "none" : "2px dashed #94A3B8"
        }}
        whileHover={{ scale: selected ? 1.3 : 1.2 }}
      />
      <div style={{
        position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
        whiteSpace: "nowrap", fontSize: 11, fontWeight: 600, color: selected ? "#F8FAFC" : "#94A3B8",
        letterSpacing: "0.05em", transition: "color 0.3s",
      }}>{data.name}</div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 5, x: "-50%" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              position: "absolute", bottom: "calc(100% + 15px)", left: "50%",
              background: "rgba(15,23,42,0.95)", border: `1px solid ${data.color}44`,
              borderRadius: 12, padding: "10px 16px", whiteSpace: "nowrap", backdropFilter: "blur(20px)",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: data.color, fontFamily: "'Instrument Serif', serif" }}>
              {data.plazas}
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>plazas prov.</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ProbabilityBar = ({ label, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    style={{ marginBottom: 16 }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 14, color: "#CBD5E1" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}%</span>
    </div>
    <div style={{ height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
      <motion.div
        initial={{ width: "0%" }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.2, delay: delay + 0.2, ease: "easeOut" }}
        style={{
          height: "100%", borderRadius: 4,
          background: value > 0 ? `linear-gradient(90deg, ${color}, ${color}88)` : "#334155",
          boxShadow: value > 0 ? `0 0 20px ${color}44` : "none",
        }}
      />
    </div>
  </motion.div>
);

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
  const [inputEspecialidad, setInputEspecialidad] = useState("");
  const [especialidadesList, setEspecialidadesList] = useState([]);
  const [availableIslands, setAvailableIslands] = useState(Object.keys(ISLANDS)); // Todas por defecto
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedIsland, setSelectedIsland] = useState("TF");

  useEffect(() => {
    const fetchEspecialidades = async () => {
      const { data } = await supabase.from("adjudicaciones").select("especialidad");
      if (data) {
        const unique = [...new Set(data.map(d => d.especialidad).filter(Boolean))];
        const sorted = unique.sort();
        setEspecialidadesList(sorted);
        if (sorted.length > 0) setInputEspecialidad(sorted[0]);
      }
    };
    fetchEspecialidades();
  }, []);

  const toggleIsland = (code) => {
    setAvailableIslands(prev =>
      prev.includes(code) ? prev.filter(i => i !== code) : [...prev, code]
    );
  };

  const selectAllIslands = () => setAvailableIslands(Object.keys(ISLANDS));

  const handleAnalyze = async () => {
    if (!inputOrden || !inputEspecialidad || availableIslands.length === 0) return;
    setIsAnalyzing(true);
    setStats(null);

    setTimeout(async () => {
      // 1. Cargamos todas las adjudicaciones reales de la especialidad
      const { data } = await supabase
        .from("adjudicaciones")
        .select("*")
        .eq("especialidad", inputEspecialidad)
        .eq("obtiene_destino", true);

      if (data && data.length > 0) {
        const myOrden = parseInt(inputOrden);

        // 2. Filtramos el scope de islas elegidas por el usuario
        const selectedData = data.filter(d => availableIslands.includes(d.isla));

        const totalPlazasCanarias = data.length;
        const totalPlazasMisIslas = selectedData.length;

        // Corte máximo histórico GENERAL y el Específico de las islas elegidas
        const maxOrdenGlobal = Math.max(...data.map(d => d.orden || 0));
        const maxOrdenMisIslas = selectedData.length > 0 ? Math.max(...selectedData.map(d => d.orden || 0)) : 0;

        // --- LOGÍSTICA DE PREDICCIÓN SEGÚN EL FEEDBACK ---
        // Determinar estado de seguridad real del docente basado matemáticamente en vacantes vs lista
        let status = "danger";
        if (myOrden <= totalPlazasMisIslas) {
          // Incluso si todos quisieran sus mismas islas, hay tantas plazas como su puesto. Infalible.
          status = "safe";
        } else if (myOrden <= totalPlazasCanarias) {
          // Si está dentro de las plazas totales, tiene plaza asegurada a nivel de Canarias,
          // pero si en sus islas no da, pasará a depender de terceros.
          status = myOrden <= maxOrdenMisIslas ? "warning" : "danger";
        } else if (myOrden <= maxOrdenMisIslas) {
          // Su orden rebasa las plazas totales, pero es MENOR que el último que logró plaza
          // en sus islas. Depende enormemente de renuncias de arriba.
          status = "warning";
        } else {
          // Fuera del corte máximo registrado
          status = "danger";
        }

        // Agrupación de datos para los mapas y charts
        const byIsland = {};
        Object.keys(ISLANDS).forEach(i => byIsland[i] = { plazas: 0, orderCut: 0 });

        const tipoCounter = {};
        data.forEach(d => {
          if (d.isla && byIsland[d.isla]) {
            byIsland[d.isla].plazas += 1;
            byIsland[d.isla].orderCut = Math.max(byIsland[d.isla].orderCut, d.orden || 0);
          }
          if (availableIslands.includes(d.isla) && d.tipo_participante) {
            tipoCounter[d.tipo_participante] = (tipoCounter[d.tipo_participante] || 0) + 1;
          }
        });

        // Probabilidades refabricadas basadas en volumen para las islas marcadas
        const probabilities = Object.keys(ISLANDS).map(k => {
          let prob = 0;
          if (availableIslands.includes(k)) {
            const islandPlazas = byIsland[k].plazas;
            const cutoff = byIsland[k].orderCut;
            if (cutoff > 0 && islandPlazas > 0) {
              if (myOrden <= islandPlazas) prob = 99;
              else if (myOrden <= cutoff) {
                // Decay lineal desde 99% hasta el 50% en la frontera del corte real
                prob = 99 - ((myOrden - islandPlazas) / (cutoff - islandPlazas)) * 49;
              } else if (myOrden <= cutoff * 1.3) {
                // Depende de milagros/nuevas vacantes
                prob = 50 - ((myOrden - cutoff) / (cutoff * 0.3)) * 40;
              } else prob = Math.max(0, 10 - ((myOrden - cutoff) / cutoff) * 5);
            }
          }
          return { island: k, name: ISLANDS[k].name, prob: Math.floor(Math.max(0, prob)), color: ISLANDS[k].color };
        }).sort((a, b) => b.prob - a.prob);

        const colors = ["#3B82F6", "#F59E0B", "#10B981", "#EC4899", "#6B7280", "#8B5CF6", "#06B6D4"];
        const chartTipos = Object.entries(tipoCounter)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map((e, i) => ({ name: e[0].substring(0, 25), value: e[1], color: colors[i] }));

        setStats({
          totalPlazasCanarias,
          totalPlazasMisIslas,
          maxOrdenGlobal,
          maxOrdenMisIslas,
          statusCategory: status, // safe | warning | danger
          myOrden: myOrden,
          espName: inputEspecialidad.split("-").pop().trim(),
          probabilities,
          islandsData: byIsland,
          tiposData: chartTipos,
          lastAgreements: selectedData.slice(-10).reverse() // Mostrar de las islas elegidas
        });

        if (probabilities[0]?.prob > 0) setSelectedIsland(probabilities[0].island);
      }
      setIsAnalyzing(false);
    }, 600);
  };

  return (
    <div style={{ position: "relative", zIndex: 1, paddingBottom: 64 }}>

      {/* Background Orbs */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden" }}>
        <GlowOrb color="#F59E0B" size={400} top="-10%" left="70%" delay={0} />
        <GlowOrb color="#3B82F6" size={350} top="40%" left="-5%" delay={2} />
        <GlowOrb color="#EC4899" size={300} top="80%" left="60%" delay={4} />
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* --- HEADER --- */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ padding: "32px 0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B", boxShadow: "0 0 15px #F59E0B88" }} />
              <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", color: "#94A3B8", textTransform: "uppercase" }}>
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
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              padding: "10px 24px", borderRadius: 100, fontSize: 13, fontWeight: 600, color: "#F8FAFC",
              cursor: "pointer", letterSpacing: "0.03em", backdropFilter: "blur(10px)"
            }}>
            Área Docente
          </motion.button>
        </motion.header>

        {/* --- FORMULARIO MULTIFASE --- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            background: "rgba(15,23,42,0.6)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)",
            padding: "32px", marginBottom: 32, backdropFilter: "blur(20px)", position: "relative", zIndex: 10,
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
          }}
        >
          {/* Fila superior: Input y Select */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
            <div style={{ flex: "1 1 300px" }}>
              <label style={{ display: "block", fontSize: 13, color: "#94A3B8", marginBottom: 8, fontWeight: 600 }}>1. ¿En qué especialidad / lista te encuentras?</label>
              <div style={{ position: "relative" }}>
                <select value={inputEspecialidad} onChange={e => setInputEspecialidad(e.target.value)}
                  style={{
                    width: "100%", background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, padding: "16px 20px", color: "#F8FAFC", fontFamily: "'DM Sans'", fontSize: 15, outline: "none",
                    appearance: "none", transition: "border 0.2s"
                  }}
                  onFocus={e => e.target.style.border = "1px solid #3B82F6"}
                  onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
                >
                  {especialidadesList.length === 0 ? <option>Cargando especialidades...</option> : null}
                  {especialidadesList.map(e => <option key={e} value={e}>{e.substring(0, 55)}{e.length > 55 ? "..." : ""}</option>)}
                </select>
                <div style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 13, color: "#94A3B8", marginBottom: 8, fontWeight: 600 }}>2. Tu número de orden actual en esa lista</label>
              <input type="number" placeholder="Introduce tu posición real" value={inputOrden} onChange={e => setInputOrden(e.target.value)}
                style={{
                  width: "100%", background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, padding: "16px 20px", color: "#F8FAFC", fontFamily: "'DM Sans'", fontSize: 15, outline: "none",
                  transition: "border 0.2s"
                }}
                onFocus={e => e.target.style.border = "1px solid #3B82F6"}
                onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.1)"}
              />
            </div>
          </div>

          {/* Fila intermedia: Selector de Islas */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, color: "#94A3B8", fontWeight: 600 }}>3. Selecciona tu disponibilidad por islas</label>
              <button
                onClick={selectAllIslands}
                style={{ background: "transparent", border: "none", color: "#3B82F6", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
              >
                + Marcar todas
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {Object.entries(ISLANDS).map(([code, is]) => {
                const isActive = availableIslands.includes(code);
                return (
                  <motion.button
                    key={code}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleIsland(code)}
                    style={{
                      background: isActive ? `${is.color}22` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isActive ? is.color : "rgba(255,255,255,0.1)"}`,
                      color: isActive ? is.color : "#94A3B8",
                      padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: 6
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: isActive ? is.color : "transparent", border: `1px solid ${isActive ? is.color : "#64748B"}` }} />
                    {is.name}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Fila inf: Botón de Analizar */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <motion.button
              whileHover={inputOrden && availableIslands.length > 0 ? { scale: 1.02, boxShadow: "0 8px 30px rgba(59, 130, 246, 0.4)" } : {}}
              whileTap={inputOrden && availableIslands.length > 0 ? { scale: 0.98 } : {}}
              onClick={handleAnalyze} disabled={isAnalyzing || !inputOrden || availableIslands.length === 0}
              style={{
                background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                color: "#FFF", fontWeight: 700, padding: "16px 40px", borderRadius: 12, border: "none",
                cursor: (inputOrden && availableIslands.length > 0) && !isAnalyzing ? "pointer" : "not-allowed", fontSize: 16,
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.2)", opacity: (inputOrden && availableIslands.length > 0) ? 1 : 0.5,
                display: "flex", alignItems: "center", gap: 8, minWidth: 220, justifyContent: "center"
              }}
            >
              {isAnalyzing ? (
                <><Loader2 size={18} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} /> Recalculando matemáticas...</>
              ) : (
                <><MapPin size={18} /> Predecir mi Destino</>
              )}
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </motion.button>
          </div>
        </motion.section>

        {/* --- RESULTADOS --- */}
        <AnimatePresence mode="wait">
          {stats && (
            <motion.div
              key={`${stats.espName}-${stats.myOrden}-${availableIslands.length}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* --- HERO DE PROYECCION RECONSTRUIDO LOGICALMENTE --- */}
              <section style={{
                background: stats.statusCategory === "safe" ? "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(59,130,246,0.04) 100%)" :
                  stats.statusCategory === "warning" ? "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(249,115,22,0.04) 100%)" :
                    "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(220,38,38,0.04) 100%)", // Danger
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24, padding: "40px 40px 36px", marginBottom: 32,
                position: "relative", overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: stats.statusCategory === "safe" ? "linear-gradient(90deg, transparent, #10B981, #34D399, transparent)" :
                    stats.statusCategory === "warning" ? "linear-gradient(90deg, transparent, #F59E0B, #FBBF24, transparent)" :
                      "linear-gradient(90deg, transparent, #EF4444, #F87171, transparent)",
                  backgroundSize: "200% 100%", animation: "gradientMove 4s ease-in-out infinite"
                }} />

                <div style={{ display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 400px" }}>
                    <div style={{
                      fontSize: 13, color: stats.statusCategory === "safe" ? "#10B981" : stats.statusCategory === "warning" ? "#F59E0B" : "#EF4444",
                      fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12
                    }}>Diagnóstico del motor</div>
                    <h2 style={{
                      fontSize: 36, fontFamily: "'Instrument Serif', serif", fontWeight: 400,
                      lineHeight: 1.2, marginBottom: 16
                    }}>
                      Basado en tu orden <span style={{ color: "#F8FAFC", fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                        <AnimatedNumber value={stats.myOrden} duration={1000} />
                      </span> para <span style={{ fontStyle: "italic" }}>{stats.espName}</span>
                    </h2>

                    <div style={{ fontSize: 16, color: "#E2E8F0", lineHeight: 1.7, maxWidth: 500 }}>
                      <p style={{ marginBottom: 10 }}>
                        En estas islas se adjudicaron <strong style={{ color: "#F8FAFC" }}>{stats.totalPlazasMisIslas} plazas</strong> (de un total de {stats.totalPlazasCanarias} en toda Canarias).
                        El último docente general en obtener vacante en las islas marcadas ocupaba el puesto <strong style={{ color: "#60A5FA" }}>#{stats.maxOrdenMisIslas}</strong> en la bolsa.
                      </p>

                      {/* CARTAS DE RESOLUCION */}
                      {stats.statusCategory === "safe" && (
                        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginTop: 20, padding: 16, background: "rgba(16,185,129,0.1)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.3)" }}>
                          <span style={{ color: "#10B981", fontSize: 24, lineHeight: 1 }}>✓</span>
                          <span style={{ fontSize: 15 }}>
                            <strong style={{ display: "block", color: "#10B981", marginBottom: 4, fontSize: 16 }}>Márgen de Seguridad Máximo</strong>
                            Tu número de lista es inferior a la cantidad matemática de vacantes físicas ofertadas en tus islas. Incluso en el peor de los casos, estadísticamente deberías obtener plaza sin problemas en tu selección.
                          </span>
                        </div>
                      )}

                      {stats.statusCategory === "warning" && (
                        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginTop: 20, padding: 16, background: "rgba(245,158,11,0.1)", borderRadius: 12, border: "1px solid rgba(245,158,11,0.3)" }}>
                          <span style={{ color: "#F59E0B", fontSize: 24, lineHeight: 1 }}>⚡</span>
                          <span style={{ fontSize: 15 }}>
                            <strong style={{ display: "block", color: "#F59E0B", marginBottom: 4, fontSize: 16 }}>Dependencia de terceros</strong>
                            Estás por encima de tu cuota directa de vacantes, y tu entrada ha dependido de que aquellos por encima de ti no hayan solicitado estas islas, o por renuncias y comisiones directas. Existen posibilidades matemáticas, pero hay riesgo.
                          </span>
                        </div>
                      )}

                      {stats.statusCategory === "danger" && (
                        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginTop: 20, padding: 16, background: "rgba(239,68,68,0.1)", borderRadius: 12, border: "1px solid rgba(239,68,68,0.3)" }}>
                          <span style={{ color: "#EF4444", fontSize: 24, lineHeight: 1 }}>✕</span>
                          <span style={{ fontSize: 15 }}>
                            <strong style={{ display: "block", color: "#EF4444", marginBottom: 4, fontSize: 16 }}>Alta dificultad / Escenarios Improbables</strong>
                            Tu orden de lista supera con creces el último corte registrado en estas islas para el volumen de participantes general. Tu asignación requeriría un volumen anómalo de renuncias de personas por encima de ti para conseguir la cobertura.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ flex: "0 0 280px" }}>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Probabilidad Estimada por Isla</div>
                    {stats.probabilities.filter(p => availableIslands.includes(p.island)).map((p, i) => (
                      <ProbabilityBar key={p.island} label={p.name} value={p.prob} color={p.color} delay={0.3 + i * 0.1} />
                    ))}
                  </div>
                </div>
              </section>

              {/* --- MAP + CHART ROW --- */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24, marginBottom: 32 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{
                    background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 24, padding: 32, position: "relative", minHeight: 400,
                    backdropFilter: "blur(20px)",
                  }}>
                  <div style={{
                    fontSize: 13, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase", marginBottom: 8
                  }}>Geolocalización de Vacantes Reales</div>
                  <div style={{ fontSize: 13, color: "#64748B", marginBottom: 24 }}>Distribución en el Archipiélago Canario</div>
                  <div style={{ position: "relative", height: 320 }}>
                    {Object.entries(ISLANDS).map(([code, config], i) => (
                      <IslandDot key={code} island={code} data={{ ...config, plazas: stats.islandsData[code]?.plazas || 0 }}
                        selected={selectedIsland === code} activeFilter={availableIslands}
                        onClick={() => setSelectedIsland(code)} index={i} />
                    ))}
                  </div>
                </motion.div>

                {/* Pie Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  style={{
                    background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 24, padding: 32, backdropFilter: "blur(20px)",
                  }}>
                  <div style={{
                    fontSize: 13, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase", marginBottom: 16
                  }}>Origen de los adjudicados (En tu selección)</div>
                  {stats.tiposData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={stats.tiposData} dataKey="value" cx="50%" cy="50%" innerRadius={70}
                          outerRadius={100} paddingAngle={4} animationDuration={1000} stroke="none">
                          {stats.tiposData.map((t, i) => <Cell key={i} fill={t.color} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>No hay plazas adjudicadas en las islas seleccionadas.</div>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
                    {stats.tiposData.map((t, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={t.name}>{t.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* --- TABLA EXCLUSIVA DE ADJUDICACIONES --- */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{
                  background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 24, padding: "32px 0 0 0", marginBottom: 32, backdropFilter: "blur(20px)",
                  overflow: "hidden"
                }}>
                <div style={{ padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div>
                    <div style={{
                      fontSize: 13, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.08em",
                      textTransform: "uppercase"
                    }}>Asignaciones en tus Zonas de Cobertura</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>10 últimos docentes de la lista que lograron plaza dentro de tus islas seleccionadas</div>
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "rgba(0,0,0,0.2)" }}>
                    <tr>
                      {["Orden", "Nombre Oculto", "Centro Destino", "Tipo", "Isla"].map(h => (
                        <th key={h} style={{
                          padding: "16px 32px", textAlign: "left", fontSize: 11, fontWeight: 600,
                          color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em",
                          borderBottom: "1px solid rgba(255,255,255,0.06)"
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lastAgreements.map((r, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        whileHover={{ backgroundColor: "rgba(59,130,246,0.05)" }}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "default" }}
                      >
                        <td style={{ padding: "16px 32px", fontSize: 14, color: "#64748B", fontWeight: 700 }}>#{r.orden}</td>
                        <td style={{ padding: "16px 32px", fontSize: 14, color: "#F8FAFC", fontWeight: 500 }}>{r.nombre}</td>
                        <td style={{ padding: "16px 32px", fontSize: 13, color: "#CBD5E1" }}>
                          {r.centro} <br />
                          <span style={{ fontSize: 11, color: "#64748B" }}>{r.municipio}</span>
                        </td>
                        <td style={{ padding: "16px 32px", fontSize: 12, color: "#94A3B8" }}>
                          {(r.tipo_participante || "").substring(0, 25)}{(r.tipo_participante || "").length > 25 ? "..." : ""}
                        </td>
                        <td style={{ padding: "16px 32px" }}>
                          <span style={{
                            background: `${(ISLANDS[r.isla] || { color: "#aaa" }).color}15`,
                            color: (ISLANDS[r.isla] || { color: "#aaa" }).color,
                            padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          }}>{ISLANDS[r.isla]?.name || r.isla}</span>
                        </td>
                      </motion.tr>
                    ))}
                    {stats.lastAgreements.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#64748B" }}>No hay adjudicados de esta lista en las islas seleccionadas</td></tr>
                    )}
                  </tbody>
                </table>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Cpu, Activity, MapPin, Zap } from 'lucide-react';

const AppContainer = ({ children }) => (
  <div className="app-container">
    {children}
  </div>
);

const Header = ({ activeTab, setActiveTab }) => (
  <header>
    <h1>
      <div className="p-1 bg-indigo-50 rounded">
        <Zap size={20} className="text-indigo-600"/>
      </div>
      Los 3 monos<span>Sabios</span>
    </h1>
    <div className="header-tabs">
      {[
        { id: 'reinas', label: 'N-Reinas' },
        { id: 'montecarlo', label: 'Montecarlo' },
        { id: 'genetico', label: 'TSP Genético' },
      ].map(tab => (
        <button 
          key={tab.id} 
          onClick={() => setActiveTab(tab.id)}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </header>
);

const MainGrid = ({ sidebar, visualization, table }) => (
  <div className="main-grid">
    <aside className="config-panel">
      {sidebar}
    </aside>
    <main className="main-content">
      <div className="visualization-card">
        {visualization}
      </div>
      <div className="table-wrapper">
        <div className="history-table-container">
          {table}
        </div>
      </div>
    </main>
  </div>
);

const ConfigSection = ({ title, children }) => (
  <div className="flex flex-col gap-4">
    <h2>{title}</h2>
    {children}
  </div>
);

const ControlGroup = ({ label, children }) => (
  <div className="control-group">
    <label>{label}</label>
    {children}
  </div>
);

const PlaybackControls = ({ playing, onPlayPause, onNext, onPrev, onReset, step, total }) => (
  <div className="playback-container">
    <span className="playback-label">Control de Animación</span>
    <div className="playback-bar">
      <button className="btn-control btn-nav" onClick={onPrev} disabled={step <= 0}><SkipBack size={18}/></button>
      <button className="btn-control btn-play" onClick={onPlayPause}>
        {playing ? <Pause size={24} fill="white"/> : <Play size={24} fill="white" className="ml-1"/>}
      </button>
      <button className="btn-control btn-nav" onClick={onNext} disabled={step >= total - 1}><SkipForward size={18}/></button>
    </div>
    <div className="flex items-center gap-3 w-full justify-between px-2">
       <span className="text-xs font-mono text-slate-500">Paso: {step + 1} / {total || 0}</span>
       <button className="btn-control btn-nav" style={{width: 30, height: 30}} onClick={onReset} title="Reiniciar"><RotateCcw size={14}/></button>
    </div>
  </div>
);

const HistoryTable = ({ headers, data }) => (
  <table className="history-table">
    <thead>
      <tr>
        {headers.map((h, i) => <th key={i}>{h}</th>)}
      </tr>
    </thead>
    <tbody>
      {data.length === 0 ? (
        <tr><td colSpan={headers.length} style={{textAlign: 'center', padding: 20, color: '#94a3b8'}}>Esperando ejecución...</td></tr>
      ) : (
        data.slice().reverse().map((row, i) => (
          <tr key={i}>
            {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
          </tr>
        ))
      )}
    </tbody>
  </table>
);

// PROYECTO 1: N-REINAS 

const ProyectoReinas = () => {
  const [n, setN] = useState(8);
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [paso, setPaso] = useState(-1);
  const [jugando, setJugando] = useState(false);
  const [verAtaques, setVerAtaques] = useState(true); // Nuevo Toggle
  const timer = useRef(null);

  const resolver = async () => {
    setCargando(true);
    setJugando(false);
    setPaso(-1);
    setHistorial([]);
    try {
      const res = await fetch('/api/reinas/resolver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n: parseInt(n) })
      });
      const data = await res.json();
      if (data.historial) {
        setHistorial(data.historial);
        setPaso(0);
        setJugando(true);
      }
    } catch (e) { console.error(e); }
    setCargando(false);
  };

  useEffect(() => {
    if (jugando) {
      const velocidad = n > 8 ? 100 : 300; 
      timer.current = setInterval(() => {
        setPaso(p => {
          if (p < historial.length - 1) return p + 1;
          setJugando(false);
          return p;
        });
      }, velocidad);
    } else {
      clearInterval(timer.current);
    }
    return () => clearInterval(timer.current);
  }, [jugando, historial, n]);

  const tableroActual = paso >= 0 && historial[paso] ? historial[paso].tablero : [];
  
  const celdasAtacadas = new Set();
  if (verAtaques && tableroActual.length > 0) {
      tableroActual.forEach((filaReina, colReina) => {
          if (filaReina !== -1) {
              for (let c = 0; c < n; c++) {
                  celdasAtacadas.add(`${filaReina},${c}`);
                  
                  const diff = Math.abs(c - colReina);
                  if (c !== colReina) { 
                      if (filaReina + diff < n) celdasAtacadas.add(`${filaReina + diff},${c}`);
                      if (filaReina - diff >= 0) celdasAtacadas.add(`${filaReina - diff},${c}`);
                  }
              }
          }
      });
  }

  const logData = historial.slice(0, paso + 1).map((h, i) => ({
    step: i + 1,
    action: h.estado === 'colocando' ? 'Colocar' : 'Retroceder',
    detail: h.estado === 'colocando' ? 'Busca posición segura' : 'Camino cerrado',
    status: h.estado.toUpperCase()
  }));

  return (
    <MainGrid
      sidebar={
        <>
          <ConfigSection title="Configuración">
            <ControlGroup label={`Tamaño del Tablero: ${n}x${n}`}>
              <input type="number" className="input-number" value={n} onChange={e => setN(e.target.value)} min="4" max="12"/>
            </ControlGroup>
            
            {/* Nuevo Control para ver los ataques */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input 
                    type="checkbox" 
                    id="chkAtaques" 
                    checked={verAtaques} 
                    onChange={(e) => setVerAtaques(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="chkAtaques" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Ver Zonas de Ataque (Rayos X)
                </label>
            </div>

            <button className="btn-main btn-primary" onClick={resolver} disabled={cargando}>
              {cargando ? 'Calculando...' : 'Resolver Mapa'}
            </button>
          </ConfigSection>
          
          <div className="explanation-box">
             <p className="mb-2"><strong>Leyenda Visual:</strong></p>
             <div className="flex items-center gap-2 text-xs mb-1"><span className="w-3 h-3 bg-red-500/20 border border-red-500 rounded"></span> Zona de Muerte (Atacada)</div>
             <div className="flex items-center gap-2 text-xs mb-1"><span className="w-3 h-3 bg-white border border-slate-300 rounded"></span> Zona Segura</div>
             <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 bg-indigo-600 rounded-full"></span> Reina Colocada</div>
          </div>

          <PlaybackControls 
            playing={jugando} 
            onPlayPause={() => setJugando(!jugando)}
            onNext={() => setPaso(p => Math.min(p + 1, historial.length - 1))}
            onPrev={() => setPaso(p => Math.max(0, p - 1))}
            onReset={() => {setJugando(false); setPaso(0)}}
            step={paso}
            total={historial.length}
          />
        </>
      }
      visualization={
        tableroActual.length === 0 ? <div className="text-gray-400">Configura y resuelve para ver el tablero</div> :
        <div className="chess-grid" style={{
            gridTemplateColumns: `repeat(${n}, 1fr)`,
            width: 'min(90%, 500px)', aspectRatio: '1/1',
            transition: 'all 0.3s ease'
        }}>
           {Array.from({ length: n * n }).map((_, i) => {
              const r = Math.floor(i / n); 
              const c = i % n;             
              const isBlack = (r + c) % 2 === 1;
              const hasQueen = tableroActual[c] === r;
              
              const isAttacked = !hasQueen && celdasAtacadas.has(`${r},${c}`);

              return (
                  <div 
                    key={i} 
                    className={`cell ${isBlack ? 'black' : 'white'}`}
                    style={{
                        backgroundColor: isAttacked 
                            ? 'rgba(239, 68, 68, 0.25)' 
                            : (isBlack ? '#cbd5e1' : '#f8fafc'), 
                        transition: 'background-color 0.2s ease'
                    }}
                  >
                      {/* Punto rojo pequeño si está atacada para más claridad */}
                      {isAttacked && <div className="absolute w-2 h-2 bg-red-400 rounded-full opacity-50"></div>}
                      
                      {hasQueen && <span className="queen">♛</span>}
                  </div>
              )
           })}
        </div>
      }
      table={<HistoryTable headers={['#', 'Acción', 'Detalle', 'Estado']} data={logData} />}
    />
  );
};

// PROYECTO 2: MONTECARLO 

const ProyectoMontecarlo = () => {
    const [params, setParams] = useState({ precio: 100, vol: 0.2, dias: 30, sims: 500 });
    const [datosCompletos, setDatosCompletos] = useState([]); 
    const [datosVisibles, setDatosVisibles] = useState([]);   
    const [var95, setVar95] = useState(null);
    const [cargando, setCargando] = useState(false);
    
    const [diaActual, setDiaActual] = useState(0);
    const [animando, setAnimando] = useState(false);
    const requestRef = useRef();

    const simular = async () => {
        setCargando(true);
        setAnimando(false);
        setDatosCompletos([]);
        setDatosVisibles([]);
        setDiaActual(0);
        
        try {
            const res = await fetch('/api/montecarlo/simular', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ precio_actual: params.precio, volatilidad: params.vol, dias_proyectar: params.dias, num_simulaciones: params.sims })
            });
            const data = await res.json();
            
            setDatosCompletos(data.simulaciones_visuales);
            setVar95(data.var_95);
            
            setAnimando(true);
            
        } catch(e) { console.error(e); }
        setCargando(false);
    };

    useEffect(() => {
        if (animando && datosCompletos.length > 0) {
            const animarFrame = () => {
                setDiaActual(prev => {
                    const siguiente = prev + 1;
                    if (siguiente >= datosCompletos.length) {
                        setAnimando(false);
                        return prev;
                    }
                    return siguiente;
                });
                requestRef.current = setTimeout(animarFrame, 50); 
            };
            requestRef.current = setTimeout(animarFrame, 50);
        }
        return () => clearTimeout(requestRef.current);
    }, [animando, datosCompletos]);

    useEffect(() => {
        if (datosCompletos.length > 0) {
            setDatosVisibles(datosCompletos.slice(0, diaActual + 1));
        }
    }, [diaActual, datosCompletos]);

    const reiniciarAnimacion = () => {
        setDiaActual(0);
        setAnimando(true);
    };

    const tableData = datosCompletos.length > 0 ? Array.from({length: 15}, (_, i) => ({
        id: `Escenario #${i+1}`,
        end: datosVisibles.length > 0 ? `$${(datosVisibles[datosVisibles.length-1][`sim_${i}`] || 0).toFixed(2)}` : '...',
        trend: Math.random() > 0.5 ? '↗ Alcista' : '↘ Bajista'
    })) : [];

    return (
        <MainGrid
            sidebar={
                <>
                  <ConfigSection title="Mercado">
                    <ControlGroup label="Precio Inicial ($)">
                        <input type="number" className="input-number" value={params.precio} onChange={e=>setParams({...params, precio: +e.target.value})}/>
                    </ControlGroup>
                    <ControlGroup label="Volatilidad (0-1)">
                        <input type="number" className="input-number" value={params.vol} onChange={e=>setParams({...params, vol: +e.target.value})} step="0.01"/>
                    </ControlGroup>
                  </ConfigSection>
                  
                  <div className="mt-4">
                     <button className="btn-main btn-primary" onClick={simular} disabled={cargando}>
                        {cargando ? 'Calculando...' : 'Proyectar Futuros'}
                     </button>
                  </div>

                  {/* Panel de Progreso */}
                  {datosCompletos.length > 0 && (
                      <div className="playback-container">
                          <span className="playback-label">Proyección en el tiempo</span>
                          <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
                              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-75" style={{width: `${(diaActual / (datosCompletos.length-1)) * 100}%`}}></div>
                          </div>
                          <div className="flex justify-between w-full text-xs font-bold text-slate-500">
                              <span>Día {diaActual}</span>
                              <span>Meta: Día {params.dias}</span>
                          </div>
                          <button className="btn-control btn-nav w-full mt-2" onClick={reiniciarAnimacion} title="Repetir Animación">
                              <RotateCcw size={14} className="mr-2"/> Repetir Animación
                          </button>
                      </div>
                  )}

                  {var95 && !animando && (
                      <div className="explanation-box" style={{borderColor: '#ef4444', backgroundColor: '#fef2f2', animation: 'fadeIn 0.5s'}}>
                          <strong style={{color: '#b91c1c'}}>ANÁLISIS DE RIESGO:</strong> <br/>
                          El VaR (95%) es <span style={{fontWeight:'bold'}}>-${var95.toFixed(2)}</span>. <br/>
                          Esto significa que, en un día malo (peor 5%), no deberías perder más de esa cantidad.
                      </div>
                  )}
                </>
            }
            visualization={
                <div className="chart-container" style={{padding: '20px'}}>
                     {!datosCompletos.length ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Activity size={48} className="mb-4 opacity-30"/>
                            <p>Ejecuta la simulación para ver la dispersión</p>
                        </div>
                     ) : (
                     <ResponsiveContainer>
                        <AreaChart data={datosVisibles} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                            <defs>
                                <linearGradient id="colorMediaLight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            
                            {/* Eje X Dinámico */}
                            <XAxis dataKey="dia" type="number" domain={[0, params.dias]} stroke="#94a3b8" tickLine={false} axisLine={false} />
                            
                            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={v => `$${v}`}/>
                            <Tooltip labelFormatter={(v) => `Día ${v}`} />
                            
                            {/* Líneas de simulación (Spaghetti) */}
                            {Object.keys(datosCompletos[0] || {}).filter(k=>k.startsWith('sim_')).map((k) => (
                                <Line key={k} type="monotone" dataKey={k} stroke="#94a3b8" strokeWidth={1} dot={false} opacity={0.3} isAnimationActive={false} />
                            ))}
                            
                            {/* Líneas Estadísticas (solo aparecen al final o progresivo) */}
                            <Area type="monotone" dataKey="media" stroke="#4f46e5" strokeWidth={3} fill="url(#colorMediaLight)" name="Promedio" isAnimationActive={false} />
                            <Line type="monotone" dataKey="p5" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Peor Caso" isAnimationActive={false} />
                            <Line type="monotone" dataKey="p95" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Mejor Caso" isAnimationActive={false} />
                        </AreaChart>
                     </ResponsiveContainer>
                     )}
                </div>
            }
            table={<HistoryTable headers={['Escenario', 'Valor Actual', 'Tendencia']} data={tableData} />}
        />
    );
};

//  PROYECTO 3: GENÉTICO TSP 
const ProyectoGenetico = () => {
    const [ciudades, setCiudades] = useState([]);
    const [ruta, setRuta] = useState([]);
    const [poblacionFantasma, setPoblacionFantasma] = useState([]);
    const [distancia, setDistancia] = useState(0);
    const [corriendo, setCorriendo] = useState(false);
    const [logs, setLogs] = useState([]);
    
    const runningRef = useRef(false);
    const poblacionRef = useRef(null);

    const clickCanvas = (e) => {
        if(runningRef.current) return;
        const rect = e.target.getBoundingClientRect();
        setCiudades([...ciudades, { x: e.clientX - rect.left, y: e.clientY - rect.top, id: ciudades.length }]);
    };

    const toggleEvolucion = () => {
        if (runningRef.current) {
            runningRef.current = false;
            setCorriendo(false);
        } else {
            if (ciudades.length < 3) { alert("Añade al menos 3 ciudades"); return; }
            runningRef.current = true;
            setCorriendo(true);
            evolucionarPaso();
        }
    };

    const evolucionarPaso = async () => {
        if (!runningRef.current) return; 

        try {
            const res = await fetch('/api/genetico/evolucionar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ciudades, poblacion_indices: poblacionRef.current })
            });

            if (!res.ok) throw new Error("Error API");
            const data = await res.json();
            
            if (!runningRef.current) return;

            const nuevaDistancia = Math.round(data.mejor_distancia);

            setRuta(data.mejor_ruta);
            setDistancia(data.mejor_distancia);
            poblacionRef.current = data.nueva_poblacion;
            
            const muestra = data.nueva_poblacion.slice(0, 15).map(indices => 
                indices.map(i => ciudades[i])
            );
            setPoblacionFantasma(muestra);

            setLogs(prev => {
                const gen = prev.length + 1;
                
                if(gen === 1 || gen % 5 === 0) {
                    
                    const ultimoLog = prev.length > 0 ? prev[prev.length - 1] : null;
                    let estado = "Estable";
                    let esMejora = false;

                    if (ultimoLog) {
                        if (nuevaDistancia < ultimoLog.rawDist) {
                            estado = "⬇ MEJORA";
                            esMejora = true;
                        }
                    } else {
                        estado = "Inicio";
                    }

                    return [...prev, {
                        gen: gen, 
                        dist: nuevaDistancia, 
                        estado: estado,
                        esMejora: esMejora,
                        rawDist: nuevaDistancia 
                    }];
                }
                return prev;
            });

            if (runningRef.current) requestAnimationFrame(evolucionarPaso);

        } catch (error) { 
            console.error(error);
            runningRef.current = false;
            setCorriendo(false);
        }
    };

    const limpiarMapa = () => {
        runningRef.current = false;
        setCorriendo(false);
        setCiudades([]);
        setRuta([]);
        setPoblacionFantasma([]);
        setDistancia(0);
        setLogs([]);
        poblacionRef.current = null;
    };

    return (
        <MainGrid
            sidebar={
                <>
                    <ConfigSection title="Control Genético">
                         <div className="flex justify-between mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="text-center">
                                <div className="text-xs text-slate-500 font-bold uppercase">Nodos</div>
                                <div className="text-xl font-bold">{ciudades.length}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-slate-500 font-bold uppercase">Distancia</div>
                                <div className="text-xl font-bold text-indigo-600 font-mono">{distancia.toFixed(0)}</div>
                            </div>
                         </div>
                         
                         <button className={`btn-main ${corriendo ? 'btn-secondary' : 'btn-primary'}`} onClick={toggleEvolucion}>
                            {corriendo ? '⏸ Pausar Evolución' : 'Iniciar Evolución'}
                         </button>
                         
                         <button className="btn-main btn-secondary" onClick={limpiarMapa}>
                            Limpiar Mapa
                         </button>
                    </ConfigSection>
                    
                    <div className="explanation-box">
                        <div className="flex items-center gap-2 mb-2 text-xs">
                            <span className="w-4 h-1 bg-indigo-600"></span> Mejor Ruta
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-xs">
                            <span className="w-4 h-1 bg-slate-300"></span> Población
                        </div>
                        <p className="mt-2 text-xs opacity-80">
                            Tabla: El color <span className="text-green-700 font-bold bg-green-100 px-1 rounded">Verde</span> indica que el algoritmo encontró un camino más corto en esa generación.
                        </p>
                    </div>
                </>
            }
            visualization={
                <div className="tsp-container" onClick={clickCanvas}>
                    <div style={{position:'absolute', inset:0, backgroundImage:'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize:'20px 20px', pointerEvents:'none', opacity:0.5}}></div>

                    <svg className="tsp-svg">
                        {poblacionFantasma.map((rutaFantasma, idx) => (
                            <polyline 
                                key={`ghost-${idx}`}
                                points={rutaFantasma.map(p => `${p.x},${p.y}`).join(" ") + ` ${rutaFantasma[0].x},${rutaFantasma[0].y}`}
                                fill="none" 
                                stroke="#000000" 
                                strokeWidth="1" 
                                strokeOpacity="0.1" 
                                strokeLinejoin="round"
                            />
                        ))}

                        {ruta.length > 1 && (
                            <polyline 
                                points={ruta.map(p => `${p.x},${p.y}`).join(" ") + ` ${ruta[0].x},${ruta[0].y}`}
                                fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                style={{filter: 'drop-shadow(0 2px 4px rgba(79, 70, 229, 0.4))'}}
                            />
                        )}

                        {ciudades.map((c, i) => (
                            <g key={i}>
                                <circle cx={c.x} cy={c.y} r="5" fill="white" stroke="#4f46e5" strokeWidth="2" />
                                {corriendo && <circle cx={c.x} cy={c.y} r="10" fill="none" stroke="#4f46e5" strokeWidth="1" opacity="0.3" className="animate-ping" />}
                            </g>
                        ))}
                    </svg>
                    
                    {ciudades.length === 0 && (
                        <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', color:'#94a3b8', pointerEvents:'none', textAlign:'center'}}>
                            <MapPin size={32} className="mx-auto mb-2 opacity-50"/>
                            <p className="text-sm font-bold tracking-wide">CLICK PARA AÑADIR CIUDADES</p>
                        </div>
                    )}
                </div>
            }
            
            table={
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Generación</th>
                            <th>Distancia</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                             <tr><td colSpan={3} style={{textAlign: 'center', padding: 20, color: '#94a3b8'}}>Esperando ejecución...</td></tr>
                        ) : (
                            logs.slice().reverse().map((log, i) => (
                                <tr key={i} style={{backgroundColor: log.esMejora ? '#f0fdf4' : 'transparent'}}>
                                    <td>{log.gen}</td>
                                    <td style={{fontWeight: log.esMejora ? 'bold' : 'normal'}}>{log.dist} px</td>
                                    <td>
                                        <span className={`badge ${log.esMejora ? 'badge-success' : 'badge-fail'}`}>
                                            {log.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            }
        />
    );
};

function App() {
  const [activeTab, setActiveTab] = useState('reinas');

  return (
    <AppContainer>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'reinas' && <ProyectoReinas />}
      {activeTab === 'montecarlo' && <ProyectoMontecarlo />}
      {activeTab === 'genetico' && <ProyectoGenetico />}
    </AppContainer>
  );
}

export default App;

//python -m uvicorn api.index:app --reload --port 8000
//npm run dev

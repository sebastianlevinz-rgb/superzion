# SUPERZION — Game Design Document (GDD)

> Documento exhaustivo del juego completo. Última actualización: Marzo 2026.

---

## 1. OVERVIEW

| Campo | Detalle |
|-------|---------|
| **Nombre** | SUPERZION |
| **Género** | Acción multi-género (Bomberman, Signal Intercept, Flight Sim, Drone FPS, Stealth Bomber, Boss Fight) |
| **Plataforma** | Web Browser (HTML5 Canvas) |
| **Engine** | Phaser 3.80.1 + Vite |
| **Resolución** | 960×540px (16:9), Scale FIT, auto-center |
| **Audio** | Web Audio API — música procedural + SFX sintetizados (sin archivos externos) |
| **Gráficos** | 100% programáticos — todos los sprites generados via Canvas API |
| **Física** | Phaser Arcade Physics (gravedad variable por nivel) |
| **Estado** | 6 niveles jugables + cinemáticas completas + créditos |

---

## 2. HISTORIA Y LORE

### Premisa

En un mundo donde múltiples naciones hostiles (Irán, Líbano, Gaza, Siria) coordinan amenazas contra Israel, un único soldado de élite es enviado en seis misiones imposibles para neutralizar cada amenaza antes de que sea demasiado tarde.

### El Protagonista: SuperZion

SuperZion es un operativo táctico israelí de élite. No es un ejército — es UN hombre con la determinación y habilidades para cambiar el curso de una guerra. Lleva kipá azul y una Estrella de David dorada en el pecho como símbolos de identidad. Su equipamiento incluye chaleco táctico, guantes, botas militares y cinturón de utilidades.

### Arco Narrativo Completo

**ACTO I — Infiltración (Nivel 1: Teherán)**
SuperZion se infiltra en Teherán para destruir un centro de comunicaciones enemigo. Operación nocturna, estilo stealth-bomberman. Tras plantar el explosivo y escapar, el edificio colapsa en una explosión cinematográfica. Éxito total — primera amenaza eliminada.

**ACTO II — Inteligencia (Nivel 2: Beirut)**
Tres meses después. SuperZion está en una sala de operaciones con pantallas de radar. Nueva misión: interceptar señales enemigas en el Líbano. Usando jammers de señal en un mapa de radar, debe interceptar la mayor cantidad de comunicaciones enemigas posible. Operación Signal Storm.

**ACTO III — Ataque Aéreo (Nivel 3: Líbano)**
Con la inteligencia obtenida, SuperZion pilotea un F-15Z israelí desde un portaaviones. Vuelo sobre el Mediterráneo, costa libanesa y montañas hasta un búnker enemigo donde se esconde "Turbo Turban" (El General). Bombardeo de precisión — el búnker se destruye capa por capa mientras el boss dispara misiles desde adentro. Muerte cinematográfica del boss. Retorno y aterrizaje en el portaaviones.

**ACTO IV — Subterráneo (Nivel 4: Gaza)**
Reconocimiento aéreo con drone sobre el desierto, luego infiltración en red de túneles subterráneos. Al final, asalto directo a un centro de comando destruido donde se esconde "The Warden" — un guerrero con barba blanca que se esconde detrás de un sillón y lanza objetos. Combate en perspectiva frontal.

**ACTO V — Strike Nuclear (Nivel 5: Natanz, Irán)**
Misión nocturna con bombardero B-2 Stealth. Penetrar defensas aéreas iraníes y destruir la instalación nuclear de Natanz en las montañas. Similar mecánica al F-15 pero con perfil stealth y defensas más pesadas.

**ACTO VI — La Batalla Final (Nivel 6: Beirut)**
El enfrentamiento definitivo. Aproximación a una fortaleza fortificada en Beirut al amanecer. SuperZion debe destruir defensas SAM, penetrar escudos, sobrevivir ataques láser y eliminar al "Supreme Turban" — el comandante supremo. Tres fases de boss con mecánicas escalantes. Victoria = fin de la guerra.

**EPÍLOGO — Créditos**
Scroll cinematográfico con resumen de operaciones, Estrella de David dorada, y reconocimiento al jugador.

---

## 3. PERSONAJES

### 3.1 SuperZion (Protagonista)

**Sprite:** 128×128px, 13 frames de animación

| Rasgo | Descripción |
|-------|-------------|
| **Físico** | Complexión táctica/atlética, edad media |
| **Cabeza** | Kipá azul marino (#1a237e), pelo oscuro, barba incipiente |
| **Cara** | Ojos determinados, nariz definida, mandíbula firme |
| **Torso** | Chaleco táctico gris (#5a5a60–#9a9a9a) con costuras visibles y bolsillos utilitarios |
| **Símbolo** | Estrella de David dorada (#806010–#eab530) centrada en el pecho, pequeña y con líneas finas |
| **Brazos** | Mangas largas verdes (#3a5530), guantes tácticos marrones |
| **Piernas** | Pantalones cargo con rodilleras, botas marrones |
| **Cinturón** | Negro con hebilla dorada y bolsillos laterales |

**Animaciones:**
- `idle` (2 frames, 3fps, loop): Respiración sutil
- `run` (6 frames, 10fps, loop): Ciclo de carrera con balanceo de brazos/piernas
- `jump` (2 frames, 6fps, una vez): Despegue y ápice
- `fall` (1 frame, 1fps, loop): Caída con piernas extendidas
- `shoot` (2 frames, 8fps, una vez): Pose de acción agachado

### 3.2 Foam Beard — Boss Nivel 1

| Rasgo | Descripción |
|-------|-------------|
| **Sprite** | 128×128px, 4 estados de expresión |
| **Cabeza** | Angular, mandíbula cuadrada, imponente |
| **Gorro** | Militar verde oliva (#3a4a30) con estrella roja |
| **Ojos** | Agresivos — marrón (normal), naranja (enojado), rojo (furioso), espirales (muerto) |
| **Cejas** | Gruesas, ángulo descendente hacia centro (expresión furiosa permanente) |
| **Barba** | SALVAJE BLANCA — 80+ mechones individuales que cubren pecho. Tonos: gris claro (#d8d0c0), medio (#c0b8a8), oscuro (#a8a090) |
| **Cicatrices** | Múltiples marcas de batalla en cara y frente |
| **Cuello** | Grueso, tendones visibles, venas en modo furioso |

**HP:** 3 (escalado por dificultad)
**Ubicación:** Grid (22, 7) del nivel 1
**Comportamiento:** Estático, recibe daño de explosiones en área 3×3

### 3.3 Turbo Turban — Boss Nivel 3

| Rasgo | Descripción |
|-------|-------------|
| **Sprite** | 128×128px, 2 frames (normal + gritando) |
| **Cabeza** | Cabezón (estilo caricatura), cara ancha |
| **Turbante** | NEGRO MASIVO — característica más prominente. Capas de tela con pliegues, ocupa 1/3 superior del sprite |
| **Anteojos** | Rectangulares NEGROS OPACOS — marco gris, reflejos azulados, no se ven los ojos |
| **Nariz** | Prominente, marcada, descendente |
| **Boca** | Pequeña, severa (normal) / abierta gritando con dientes visibles (yelling) |
| **Barba** | LARGA GRIS/BLANCA — gradiente de gris (#999999) a blanco (#dddddd), cubre del mentón hasta el pecho. 12 mechones texturizados |
| **Cuerpo** | Túnica clerical oscura (#1a1a22) con pliegues, cuello (#2a2a38) |
| **Brazos (normal)** | Izquierdo apoyado en consola, derecho levantado señalando |
| **Brazos (gritando)** | Ambos levantados, puños cerrados |
| **Piel** | Tono #c4956a con sombras #b0845a |

**Ubicación:** Dentro del búnker durante fase de bombardeo (Nivel 3)
**Comportamiento:** Dispara misiles pesados cada 3.5s, ráfaga de 3 en abanico cada 10s. Grita al disparar.
**Destrucción progresiva:** Se enfurece a medida que el búnker se destruye (más rápido en capas 3-5).

### 3.4 The Warden — Boss Nivel 4

| Rasgo | Descripción |
|-------|-------------|
| **Sprite** | 128×128px, 4 estados de expresión |
| **Cabeza** | Angular, mandíbula cuadrada, amenazante |
| **Boina** | Militar verde (#2a4a2a) con desgaste, insignia de bronce |
| **Ojos** | Estrechos, odiosos — marrón→naranja→rojo según HP |
| **Cejas** | MASIVAS, dominantes, inclinación severa |
| **Nariz** | Ancha, rota (puente con protuberancia) |
| **Boca** | Mueca cruel con dientes amarillentos expuestos |
| **Barba** | BLANCA CORTA — gradiente gris a blanco, cubre mentón y mandíbula, mechones texturizados |
| **Cicatrices** | Múltiples: mejilla derecha (diagonal), mejilla izquierda (curva), frente (pequeña) |
| **Piel** | Curtida, marcas de viruela, textura áspera. Marrón (#7a5030) a rojo (#a03020 furioso) |
| **Venas** | Visibles en temples cuando enojado/furioso (#dd2020) |

**HP:** 30 (base, escalado por dificultad)
**Velocidad:** 60px/s (normal), 110px/s (furioso <30% HP)
**Ataques:** Lanza objetos (tablas, ladrillos, vidrios, caños) — 2 HP daño, 180px/s
**Cover:** Se esconde detrás del sillón 5-9s, asoma para lanzar, invulnerable mientras escondido

### 3.5 Supreme Turban — Boss Final (Nivel 6)

| Rasgo | Descripción |
|-------|-------------|
| **Sprite** | 256×256px (el boss más grande) |
| **Cabeza** | Masiva, estructura angular casi esquelética |
| **Turbante** | EL MÁS GRANDE — negro profundo (#0a0806), muy alto, gema roja oscura (#660000) con brillo |
| **Ojos** | Pequeños, hundidos, intensos — escala de marrón→naranja→rojo |
| **Cejas** | Las más masivas del juego, pelo texturizado individual |
| **Arrugas** | 4 líneas horizontales en frente, pliegues nasolabiales, sombras en pómulos |
| **Nariz** | Larga, ganchuda, con fosas nasales visibles |
| **Barba** | LEGENDARIA BLANCA — la más impresionante, terminación en punta afilada. 100+ mechones |
| **Bastón** | Detrás del cuerpo, madera oscura (#3a2a18), ornamento de luna creciente dorada con aura roja/naranja |

**HP:** 80 (escalado, máximo 100)
**Fases:**
1. Normal (80-50% HP): SAMs c/3s, spread c/2s, homing c/6s, flak
2. Escudo (50-25% HP): Escudo rotatorio 90px radio, 12 HP, deflecta balas
3. Enrage (25-0% HP): Láser sweep c/5s (3 HP daño), velocidad ×2, disparo c/1s

### 3.6 Guardias (Nivel 1)

**Patrulla (verde oliva #2D4A1E):**
- 32×32px, 4 direcciones × 2 frames
- Velocidad: 60px/s, camina recto hasta chocar → giro aleatorio
- Boina verde, rifle negro

**Perseguidor (rojo oscuro #8B1A1A):**
- 32×32px, 4 direcciones × 2 frames
- Velocidad: 50px/s (base), 85px/s (persecución)
- Detección: 4 tiles (Manhattan), persigue al jugador
- Boina verde, rifle negro

### 3.7 Mini Soldados (Nivel 3, decorativos)

- 16×24px, uniforme oliva (#3a4a2a), casco, brazos visibles
- 4 soldados dentro del búnker — huyen cuando el fuego llega al interior (capa 3+)

---

## 4. NIVELES

### 4.1 NIVEL 1: OPERATION TEHRAN

| Campo | Detalle |
|-------|---------|
| **Escena** | `GameScene` |
| **Ubicación** | Teherán, Irán |
| **Ambientación** | Amanecer (cielo #87CEEB) |
| **Género** | Bomberman top-down |
| **Gravedad** | 0 (vista cenital) |
| **Música** | `playLevel1Music()` — trance tenso |
| **Duración aprox.** | 3-5 minutos |

#### Mapa
- **Grid:** 29 columnas × 15 filas, tiles de 32×32px
- **Mundo:** 928×480px + HUD de 60px arriba
- **Generación procedural:**
  - Bordes: muros permanentes
  - 3 zonas separadas por muros verticales (col 10, col 20)
  - Patrón de pilares en columnas/filas pares (clásico Bomberman)
  - Zona 1 (cols 1-9): 18% densidad destructibles, 3 patrullas
  - Zona 2 (cols 11-19): 50% densidad, 5 patrullas + 2 perseguidores
  - Zona 3 (cols 21-27): 28% densidad, 3 perseguidores
- **Tiles especiales:**
  - `T_DOOR` (col 10, 20 row 7): Puertas destruibles con bomba
  - `T_GDOOR` (col 20 row 7): Puerta dorada (requiere llave)
  - `T_OBJ` (col 24, row 7): Consola objetivo (parpadea)

#### Mecánica de Juego

**Jugador:**
- Spawn: (1,1)
- HP: 3 (×difficultyMult)
- Velocidad: 130px/s (+ 30 por powerup speed)
- Bombas: 1 capacidad base, rango 2 tiles base
- Invulnerabilidad: 2s tras daño
- Movimiento: WASD

**Bombas:**
- Colocación: SPACE
- Timer: 2.5s (parpadeo lento 2s → rápido 0.5s)
- Explosión: Cruz en 4 direcciones × rango
- Destruye: breakables, puertas, daña guardias/boss
- Reacciones en cadena posibles

**Powerups (en destructibles):**
- `bomb`: +1 capacidad (texto blanco "+BOMB")
- `range`: +1 radio explosión (naranja "+RANGE")
- `speed`: +velocidad (verde "+SPEED")
- `key`: Abre puerta dorada (dorado "KEY!")

**Boss: Foam Beard**
- HP: 3 (×difficultyMult)
- Posición: Grid (22, 7), arena 3×3 despejada
- Entrada: Cae desde arriba (1200ms, Bounce.easeOut), shake 200ms
- Daño: Explosiones en área 3×3 alrededor
- Texturas: normal → angry (HP ≤ 1) → dead
- Muerte: Tremor, rotación caída, 20 partículas debris, texto "BOSS ELIMINATED!"

**Secuencia Endgame:**
1. Acercarse a consola objetivo (1.5 tile radio)
2. Presionar E → 2s animación plantando con beeps
3. ESCAPE: 15s timer, guardias ×1.6 velocidad, alarma roja parpadeante
4. Llegar al punto de spawn → flash blanco, shake, explosión expandiéndose
5. Transición a ExplosionCinematicScene

#### Controles
| Tecla | Acción |
|-------|--------|
| WASD | Movimiento 4 direcciones |
| SPACE | Colocar bomba |
| E | Interactuar (plantar explosivo) |
| ESC | Pausa |
| P | Skip nivel (confirmar Y/N) |
| R | Restart (desde pausa) |
| Q | Volver al menú (desde pausa) |
| M | Mute/unmute |

#### HUD
- Corazones de vida (3 max) — arriba izquierda
- Contador bombas y rango
- Ícono de llave (gris/dorado)
- Timer de escape (cuando activo, pulsante rojo si ≤5s)
- Badge "HARD" si modo difícil

#### Victoria
- Escapar por la puerta antes de que expire el timer
- Score basado en: tiempo, HP restante, guardias eliminados, powerups
- Rating: 3 HP = ★★★, 2 HP = ★★☆, 1 HP = ★☆☆, 0 HP = ☆☆☆

---

### 4.2 NIVEL 2: OPERATION SIGNAL STORM

| Campo | Detalle |
|-------|---------|
| **Escena** | `BeirutRadarScene` |
| **Ubicación** | Sala de operaciones / Líbano (vista radar) |
| **Ambientación** | Terminal militar retro (negro/azul, cyan/verde, scanlines) |
| **Género** | Puzzle de interceptación de señales |
| **Gravedad** | 0 |
| **Música** | `playLevel2Music()` — electrónica tensa |
| **Duración aprox.** | 1.5-2 minutos |

#### Pantalla de Radar

**Mapa de Líbano:**
- Ocupa 64% del ancho × 96% alto de la pantalla
- Costa dibujada en cyan (#00aacc, peso 2, alpha 0.6)
- Borde este en (#005566, peso 1.5, alpha 0.4)
- Fill del país (#003344, alpha 0.15)
- Ciudades marcadas: Beirut (punto cyan grande), Tripoli, Sidon, Baalbek
- 8 rutas de señal dibujadas (#004433, alpha 0.25)
- Label "MEDITERRANEAN SEA" (#1a5566, alpha 0.5)

**Brazo de Radar:**
- Centro: Interior del territorio libanés
- Largo: 320px, rotación continua (~50s por revolución)
- Trail: 12 líneas desvanecidas detrás del brazo principal
- Color: Verde (#00ff66, peso 2, alpha 0.35)
- Las señales se iluminan cuando el brazo las barre

**Efectos CRT:**
- Scanlines horizontales (3px spacing, negro alpha 0.06)
- Viñeta en esquinas (4 círculos oscuros, alpha 0.3)
- Franja de color en bordes (#001122, alpha 0.2)
- Grid sutil de fondo (40px, #0a3a2a, alpha 0.15)
- Gradiente radial azul oscuro de fondo

#### Señales

| Tipo | Color | Puntos | Radio | Velocidad |
|------|-------|--------|-------|-----------|
| Básica | Verde #00ff66 | 1 | 4px | 0.06-0.10 |
| Encriptada | Amarillo #ffdd00 | 3 | 5px | 0.06-0.10 |
| Prioritaria | Rojo #ff3333 | 5 | 6px | 0.10-0.14 |

- Siguen 8 rutas predefinidas por el mapa
- Spawn escalonado (delay 0-15s aleatorio)
- Animación pulsante (sine wave en opacidad)
- Onditas de radio alrededor (1-2 anillos según tipo)
- Se iluminan más cuando el brazo radar las barre

#### Jammers

- **Máximo:** 3 (upgradeable a 4)
- **Radio base:** 70px (upgradeable a 95px)
- **Colocación:** Click en cualquier punto del mapa
- **Reposición:** Arrastrar con mouse
- **Visual:** Círculo cyan (#00ccff) pulsante con:
  - Círculo de radio exterior (alpha 0.15)
  - Fill interior (alpha 0.04)
  - Punto central (alpha 0.6)
  - Cruceta de mira
  - Anillo intermitente

#### Mecánica de Rondas

**Ronda 1:** 40 señales, verdes + amarillas, 30 segundos
**Entre rondas:** Pantalla de upgrade (elegir 1 de 4)
**Ronda 2:** 80 señales, TODAS incluyendo rojas, 30 segundos

**Upgrades:**
1. **RANGE+** (#00ff66): Radio de jammers +35% (70→95px)
2. **JAMMER EXTRA** (#00ccff): 4 jammers en vez de 3
3. **SLOWMO** (#ff66ff): Presionar S para 3s de slow motion
4. **CHAIN** (#ffaa00): Señales interceptadas dañan cercanas (30px radio)

#### Activación (SPACE)

1. Flash pantalla verde (200ms)
2. Anillos expansivos cyan desde cada jammer (1.2s fade)
3. Señales dentro del radio → INTERCEPTADAS → partículas de color (8-16 según tipo)
4. **Combos:**
   - 10+ interceptadas: "GOOD!" +50pts
   - 20+ interceptadas: "GREAT!" +150pts, screen shake ligero
   - 30+ interceptadas: "INCREDIBLE!" +300pts, screen shake fuerte
   - 40+ interceptadas: "PERFECT OPERATION!" +500pts, shake máximo
5. Sonido: playRadarIntercept() + playInterceptSuccess()

#### Controles
| Tecla/Acción | Función |
|---|---|
| Click izquierdo | Colocar jammer / iniciar arrastre |
| Arrastrar | Mover jammer existente |
| SPACE | Activar todos los jammers |
| S | Slow motion (si tiene upgrade) |
| ESC | Pausa |
| P | Skip nivel |
| M | Mute |
| 1-4 | Selección rápida de upgrades |

#### HUD
- "OPERATION SIGNAL STORM" (cyan, 13px, bold, centro-arriba)
- "ROUND X/2" (izquierda)
- Timer "30s" (derecha, se vuelve rojo si ≤5s)
- "SCORE: XXXX" (derecha)
- "JAMMERS: X/3" (centro-abajo)
- Instrucciones contextuales (abajo)
- Botón "[ SPACE ] ACTIVATE" pulsante cuando todos los jammers colocados
- "[S] SLOW MOTION" si upgrade activo
- Badge "HARD" si aplica

#### Resultados
- "MISSION COMPLETE — OPERATION SIGNAL STORM"
- Señales interceptadas: X/120
- Mejor ronda: X interceptadas
- Mejor combo alcanzado
- Puntos totales
- Rating estrellas: ≥85% = ★★★, ≥70% = ★★☆, else ★☆☆

---

### 4.3 NIVEL 3: OPERATION DEEP STRIKE

| Campo | Detalle |
|-------|---------|
| **Escena** | `BomberScene` |
| **Ubicación** | Portaaviones → Mar Mediterráneo → Costa libanesa → Montañas → Valle (búnker) |
| **Ambientación** | Atardecer espectacular (gradiente púrpura→rosa→naranja→dorado) |
| **Género** | Flight sim side-scroller + bombardeo |
| **Gravedad** | Variable (180px/s² jet, 480px/s² bombas) |
| **Música** | `playLevel3Music()` — fases: takeoff, flight, bombing, landing |
| **Duración aprox.** | 4-6 minutos |

#### Fase 1: Despegue (15-20s)

- F-15Z en cubierta del portaaviones (Y=395)
- RIGHT para acelerar, UP en rampa para lanzar
- Requiere velocidad ≥180px/s para despegar
- Si cae de la cubierta sin velocidad → crash al agua
- Portaaviones: 480×200px con cubierta, isla de control, aviones estacionados, marineros

#### Fase 2: Vuelo (35s)

- Velocidad base: 220px/s (aceleración hasta 500px/s)
- Parallax scrolling: nubes (0.1×), montañas (0.3×), suelo (0.8×)
- **Transiciones de terreno (por distancia):**
  - 0-1500px: Mar abierto (superficie acuática con reflejos del atardecer)
  - 1500px: Costa libanesa (playas, edificios, palmeras, mezquita)
  - 2400px: Montañas (cedros, nieve, pueblos, caminos)
  - 3500px: Llegada al objetivo → fase bombardeo

**Amenazas:**
- **Misiles SAM:** Spawn cada 0.8-2s, tracking 1.8 rad/s turn rate, 260px/s, vida 4s
- **Flak:** Cada 1.8s, explosión de área (40px radio daño instantáneo)
- **Chaff:** 5 cargas, 1s cooldown, desvía SAM más cercano (300px radio)

**Física del jet:**
- Gravedad: 180px/s²
- Stall bajo 100px/s (gravedad extra 350px/s²)
- Climb: 400px/s² aceleración arriba
- Dive: 250px/s² aceleración abajo
- Max climb: -300px/s, Max fall: 400px/s
- Tilt visual basado en velocidad vertical

#### Fase 3: Bombardeo

- Jet: movimiento libre 4 direcciones (300px/s lateral)
- Búnker centrado en X=480, Y=340, ancho 240px

**Búnker — Interior visible (diorama de corte transversal):**
- 5 capas de hormigón (colores degradados gris)
- Pared izquierda y derecha (30px cada una)
- Interior visible: fondo oscuro (#0a0a14), piso con grid
- **BOSS Turbo Turban** sentado frente a consola de guerra
- 6 pantallas monitores brillando (azul #114488)
- 4 mini soldados decorativos
- Consola (#2a2a3a) con pantalla (#1144aa)

**Mecánica de Bombardeo:**
- 8 bombas totales, SPACE para soltar
- Bombas heredan 50% velocidad horizontal del jet
- Gravedad bomba: 480px/s²
- Impacto en búnker → destruye capa superior
- Cooldown: 0.35s entre bombas

**Destrucción Progresiva del Búnker:**

| Capa | Efecto Visual Interior | Cambio en Boss |
|------|----------------------|----------------|
| 1 | Humo entra, 1 pantalla se rompe | Boss tiembla al impacto |
| 2 | Debris del techo, 2 pantallas más rotas | Boss tiembla más |
| 3 | Fuego adentro, soldados huyen, pantallas restantes rotas | Disparo cada 2s, ráfaga cada 7s |
| 4 | Escombros por todos lados, consola destruida | Disparo cada 1.5s, ráfaga cada 5s |
| 5 | Impacto directo → secuencia de muerte | Boss eliminado |

**Ataques del Boss:**
- Misil simple: cada 3.5s (radio 5px, más rápido que SAM: ~300px/s, vida 5s)
- Ráfaga triple en abanico: cada 10s (3 misiles con offset angular ±0.3 rad)
- Boss cambia entre sprite normal y "gritando" al disparar

**Muerte del Boss (Capa 5):**
1. Cámara zoom 1.5× hacia búnker (400ms)
2. Boss mira arriba con cara de terror
3. Flash blanco (400ms)
4. Explosión desde el interior (6 explosiones interiores, 60ms entre cada una)
5. Cámara vuelve a normal, shake 1.5s
6. Explosión exterior masiva (12 explosiones, 70ms entre cada una)
7. Mega fireball (×8 escala, 2s)
8. Core secundario (×5 escala, 1.2s)
9. 20 debris volando en todas direcciones
10. Columna de humo (×3 escala, 3s)
11. Cráter (220×35px)
12. Texto: "TARGET ELIMINATED" (rojo #ff4400, 28px, bold, glow)
13. 1.2s después: "RTB — RETURN TO BASE" (verde #00ff00, 16px, glow)

**2 Torretas flanqueando búnker:**
- Posición: ±150px del búnker, Y=GROUND-10
- Disparan misiles tracking cada 1.5-2.5s

#### Fase 4: Vuelo de Retorno

- Jet mira a la izquierda, velocidad -220px/s base
- Terrain inverso: Montañas → Costa (1100px) → Mar (2000px) → Portaaviones (3100px)

#### Fase 5: Aterrizaje

- Portaaviones aparece desde la izquierda (2s animación)
- Controles precisos: LEFT/RIGHT alineación, UP reduce descenso
- Drift de aproximación: 30px/s hacia la izquierda
- **Calidad de aterrizaje:**
  - Perfect: <50px offset del centro
  - Good: <120px offset
  - Rough: >120px offset (1 reintento)
- Descenso >200px/s → crash en cubierta

#### Controles
| Tecla | Acción |
|---|---|
| LEFT/RIGHT | Velocidad / dirección lateral |
| UP/DOWN | Ascender / descender |
| SPACE | Soltar bomba (fase bombardeo) |
| C | Desplegar chaff |
| ESC | Pausa |
| M | Mute |
| P | Skip nivel |

#### HUD
- "OPERATION DEEP STRIKE" (dorado con glow)
- ARMOR: X/3 (rojo si ≤1)
- BOMBS: X (durante bombardeo)
- CHAFF: X [C] (cyan, naranja si ≤1)
- ALT: Xm / SPD: X kts (derecha)
- TARGET: X km (centro, durante vuelo)
- Instrucciones contextuales (abajo)

#### Resultados
- Bunker Layers Penetrated: X/5
- Bombs Used: X/8
- Armor Remaining: X/3
- Landing: PERFECT/GOOD/ROUGH
- Rating: 5 capas + perfect landing = ★★★

---

### 4.4 NIVEL 4: OPERATION UNDERGROUND

| Campo | Detalle |
|-------|---------|
| **Escena** | `DroneScene` |
| **Ubicación** | Desierto (reconocimiento) → Túneles subterráneos → Casa destruida (boss) |
| **Ambientación** | Desierto diurno → subterráneo oscuro → interior destruido |
| **Género** | Drone top-down → Maze → FPS room boss fight |
| **Gravedad** | 0 (drone top-down) |
| **Música** | `playLevel4Music()` — fases: recon, tunnel, command |
| **Duración aprox.** | 5-8 minutos |

#### Fase 1: Reconocimiento Aéreo (60s)

- Drone sobrevuela desierto (960×540px)
- Velocidad: 160px/s, 4 direcciones (ARROWS)
- SPACE: Escanear (2s cooldown, radio 100px, 0.8s duración)
- Objetivo: Encontrar 5 entradas de túnel
- Encontrar: +200 puntos, marcador verde, texto "TUNNEL FOUND"
- 4 patrullas enemigas (detección 80px, expandible a 120px)
- HP Drone: 3 (fácil) / 2 (difícil)

#### Fase 2: Navegación de Túneles (90s)

- Maze: 24×13 grid, tiles 40×40px
- Tipos: piso (0), muro (1), puerta (2), zona interferencia (3)
- Velocidad: 120px/s, colisión en 4 esquinas (±14px)
- **Oscuridad:** Overlay 95% negro con spotlight radial 90px (45px en interferencia)
- 2 puertas que abrir con SPACE adyacente
- Interferencia: daño cada 3s, degradación de señal visual
- Salida: Esquina inferior derecha (col 22, row 11), círculo verde parpadeante

#### Fase 3: Boss Fight — THE WARDEN

**Ambiente:** Habitación destruida, perspectiva frontal desde drone

**Layout:**
- Pared trasera Y=120, frente Y=510
- Sillón/couch en Y=310 (80×60px, HP 8, destructible)
- Boss se mueve horizontalmente: X=[180, 780]

**Drone/Crosshair:**
- Posición: Bottom-center, movimiento libre pantalla completa
- HP: 6 (fácil) / 4 (difícil)
- Invulnerabilidad: 1s tras daño (crosshair parpadea)

**Armas del Drone:**
| Arma | Tecla | Daño | Cooldown | Velocidad | Notas |
|------|-------|------|----------|-----------|-------|
| Bala | Z (mantener) | 1 HP | 0.25s | 300px/s | Efecto de profundidad (10→4px) |
| Misil | X (pulsar) | 15 HP | 3s | 200px/s | Homing, explosión visual |
| Dodge | C (pulsar) | — | 1.2s | Dash 120px | 0.35s invulnerabilidad, trail cyan |

**Ataques del Boss:**
- **Normal:** Lanza 1-3 objetos en burst, 3-4s entre bursts
  - 4 tipos: tabla, ladrillo, vidrio, caño (texturas aleatorias)
  - Velocidad: 180px/s hacia drone ±40px spread
  - Daño: 2 HP
  - Efecto profundidad: 8→28px
- **Furioso (<30% HP):** Lanza cada 0.4-0.8s, velocidad 110px/s movimiento

**Mecánica de Cobertura (Sillón):**
1. **Exposed** (6-10s): Boss camina visible, atacable
2. **Moving to cover**: Se acerca al sillón
3. **Behind cover** (5-9s): Escondido, sprite alpha 0.25, tamaño ×0.5
   - Texto "BEHIND COVER" rojo aparece
   - NO se le puede pegar (balas dañan al sillón en su lugar)
   - Hitbox reducido a BOSS_DISPLAY×0.2
4. **Peeking** (1s): Asoma, sprite alpha 1, tamaño ×0.85
   - Texto "SHOOT NOW!" verde flash
   - VENTANA VULNERABLE — atacar aquí
   - Lanza 2 objetos rápidos, más precisos (spread 50px)
5. Vuelve a behind cover → repite
- En FURY mode: no se esconde más
- Si sillón destruido (8 HP): no puede esconderse

**Mecánica de Dodge (C key):**
- Dash lateral 120px en la dirección de las flechas (o automático alejándose del centro)
- 0.25s duración activa, 0.35s invulnerabilidad
- Crosshair se hace transparente (alpha 0.4) + trail cyan
- Cooldown 1.2s

**Expresiones del Boss (cambian según HP):**
| HP% | Expresión | Visual |
|-----|-----------|--------|
| >60% | Normal | Ojos marrones, calmo |
| 30-60% | Angry | Ojos naranja, dientes, venas |
| <30% | Furious | Ojos rojos, velocidad ×2, partículas rojas, roar + shake |
| 0% | Dead | Ojos espiral, moretones |

**Muerte del Boss (6.5s secuencia):**
1. 0-1.5s: Tremor rápido (30 shakes, 50ms c/u)
2. 1.5s: Textura cambia a dead
3. 2-2.8s: Rotación caída (800ms, ease)
4. 3-3.8s: Explosión (12 fireballs con partículas)
5. 4s: Texto "THE WARDEN ELIMINATED" dorado
6. 6.5s: Cleanup → pantalla victoria

#### Controles (Fase 3)
| Tecla | Acción |
|---|---|
| Flechas | Mover crosshair/apuntar |
| Z | Disparar balas (mantener) |
| X | Disparar misil (pulsar) |
| C | Dodge/esquivar (pulsar) |
| ESC | Pausa |
| M | Mute |

#### Resultados
- Targets found, doors opened, survival bonus
- Perfect fight (sin daño): ×1.5 multiplicador

---

### 4.5 NIVEL 5: OPERATION MOUNTAIN BREAKER

| Campo | Detalle |
|-------|---------|
| **Escena** | `B2BomberScene` |
| **Ubicación** | Irán — montañas de Natanz (instalación nuclear) |
| **Ambientación** | Nocturno (azules oscuros, baja visibilidad) |
| **Género** | Stealth bomber side-scroller |
| **Gravedad** | Variable (150px/s² B-2) |
| **Música** | `playLevel5Music()` |
| **Duración aprox.** | 4-6 minutos |

- Mecánica similar al Nivel 3 pero con B-2 Stealth Bomber
- Perfil más ancho, más lento, más sigiloso
- Física más ligera (gravedad 150, stall 80px/s)
- 6 bombas (vs 8 del F-15)
- Objetivo: Instalación nuclear de Natanz en las montañas
- 5 capas de búnker montañoso
- Transición a LastStandCinematicScene

---

### 4.6 NIVEL 6: OPERATION LAST STAND

| Campo | Detalle |
|-------|---------|
| **Escena** | `BossScene` |
| **Ubicación** | Beirut — Fortaleza fortificada |
| **Ambientación** | Amanecer (púrpura→rosa→naranja→dorado) con skyline de Beirut |
| **Género** | Scrolling shooter + boss fight |
| **Gravedad** | Personalizada por fase |
| **Música** | `playLevel6Music()` — 3 tracks por fase (escalante) |
| **Duración aprox.** | 5-10 minutos |

#### Fase de Aproximación
- Scroll hacia la fortaleza a 120px/s
- Background: Cielo amanecer Beirut, nubes, montañas, ciudad, terreno arenoso

#### Arsenal del Jugador
| Arma | Tecla | Daño | Velocidad | Cooldown |
|------|-------|------|-----------|----------|
| Balas | SPACE (mantener) | 1 | 500px/s | 0.15s |
| Bombas pesadas | X | 3 | 400px/s H + 120px/s V | 2s |
| Pulso anti-misil | C | Destruye proyectiles | Radio 100px | 5s (5 cargas) |

#### Fases del Boss: Supreme Turban

**Fase 1 — Normal (80-50% HP):**
- SAMs cada 3s (320px/s, homing)
- Spread burst cada 2s (3-5 balas en abanico, 500px/s)
- Homing missiles cada 6s
- Flak bursts aleatorios

**Fase 2 — Escudo (50-25% HP):**
- Escudo rotatorio circular (90px radio, 12 HP)
- Deflecta balas normales (ángulo de reflejo)
- Bombas pesadas penetran (3 daño)
- Pulso anti-misil lo destruye instantáneamente
- Fire rate aumenta: SAMs c/1.5s, spread c/1.5s, homing c/4s
- Texto: "SHIELD DEPLOYED" (cyan)

**Fase 3 — Enrage (25-0% HP):**
- Láser sweep cada 5s (2s barrido izq→der, 3 HP daño instantáneo)
- Warning: Anillo pulsante + 0.3s charge
- Abandona escudo
- SAMs cada 1s, velocidad boss ×2 (110px/s)
- Homing cada 3s, flak cada 2s
- Texto: "SUPREME FURY" (rojo)
- Expresión furiosa: ojos rojos, brillo intenso, tint rojo intermitente

**Muerte:**
- Desintegración pixel por pixel (3-4s)
- Transición a CreditsScene

#### Controles
| Tecla | Acción |
|---|---|
| Flechas | Movimiento (±250px/s, clamped a área visible) |
| SPACE | Disparar balas (mantener) |
| X | Bomba pesada (8 total) |
| SHIFT | Dodge/roll (0.2s i-frames, 1.5s cooldown) |
| C | Pulso anti-misil (5 cargas) |
| ESC | Pausa |
| M | Mute |
| ENTER | Avanzar tras victoria |

---

## 5. MECÁNICAS GENERALES

### 5.1 Sistema de HP/Vidas

| Nivel | HP Base | HP Hard | Invulnerabilidad |
|-------|---------|---------|-----------------|
| 1 - Bomberman | 3 | ~2 | 2.0s |
| 2 - Señales | N/A | N/A | N/A |
| 3 - F-15 | 3 armor | 2 armor | Flash visual |
| 4 - Drone | 6 | 4 | 1.0s |
| 5 - B-2 | 3 armor | 2 armor | Flash visual |
| 6 - Final | 6 | ~5 | Flash visual |

### 5.2 Sistema de Score y Estrellas

- Cada nivel guarda rating en `localStorage` como `superzion_stars_X` (X=1-6)
- Sistema de 3 estrellas basado en:
  - Nivel 1: HP restante
  - Nivel 2: % de señales interceptadas (≥85% = 3★, ≥70% = 2★)
  - Nivel 3: Capas destruidas + calidad aterrizaje
  - Nivel 4: Targets found + no damage bonus
  - Nivel 5: Similar a nivel 3
  - Nivel 6: Daño infligido + accuracy + survival

### 5.3 Menú Principal (MenuScene)

**Visual:**
- Fondo: Paisaje con acantilado, SuperZion parado en el borde (bob animation Y: 340→343)
- Capa de nubes (alpha 0.3, tiled)
- Overlay oscuro (alpha 0.2)
- Título: "SUPERZION" (#FFD700, 56px, bold, shadow)
- Línea separadora cyan (280×2px)

**Selección de Niveles:**
1. LEVEL 1: OPERATION TEHRAN
2. LEVEL 2: OPERATION SIGNAL STORM
3. LEVEL 3: OPERATION DEEP STRIKE
4. LEVEL 4: OPERATION UNDERGROUND
5. LEVEL 5: OPERATION MOUNTAIN BREAKER
6. LEVEL 6: OPERATION LAST STAND

- Flecha dorada (▶) indica nivel seleccionado
- Texto dorado (seleccionado) / gris (no seleccionado)
- Estrellas mostradas junto a cada nivel
- Descripción del nivel debajo

**Controles:** UP/DOWN navegar, ENTER/SPACE iniciar, M mute, H hard mode

### 5.4 Sistema de Dificultad

| Multiplicador | Normal | Hard |
|---------------|--------|------|
| Player HP | 1.0× | 0.6× |
| Boss HP | 1.0× | 1.4× |
| Enemy Speed | 1.0× | 1.3× |
| Spawn Rate | 1.0× | 0.7× (más frecuente) |
| Missile Speed | 1.0× | 1.35× |
| Detection | 1.0× | 1.5× |
| Timers | 1.0× | 0.8× (menos tiempo) |

**Hard Mode:** Se desbloquea al completar el juego (localStorage: `superzion_completed`)

### 5.5 Controles Universales

| Tecla | Acción (todos los niveles) |
|-------|---------------------------|
| ESC | Pausa/Unpause |
| M | Mute/Unmute (audio + música) |
| P | Skip nivel (confirmación Y/N) |
| R | Restart (desde pausa) |
| Q | Volver al menú (desde pausa) |
| ENTER | Avanzar/Confirmar |

---

## 6. ARTE Y ESTILO VISUAL

### 6.1 Paleta de Colores

**UI Principal:**
- Dorado #FFD700 — títulos, acentos primarios, victoria
- Cyan #00e5ff / #00ffcc / #00ff66 — datos, números, sistemas
- Rojo #ff2222 / #ff0000 — peligro, amenazas, HP bajo
- Naranja #ff8800 — advertencias, instrucciones
- Magenta #ff66ff — efectos especiales (slowmo)
- Blanco #ffffff — texto base
- Gris #666666 / #888888 — texto secundario

**Ambientes:**
- Cielo día: #87CEEB
- Atardecer: Gradiente #0d0b2e → #6b3fa0 → #e84393 → #f06030 → #f5d020
- Amanecer: #1a1a3a → #5a3a5a → #ff8844 → #ffcc66
- Radar: #0a0e1a (fondo), #00ff66 (radar), #00ccff (jammers)
- Subterráneo: Negro casi total con spotlight radial

### 6.2 Sprites — Técnica

- **100% Canvas API** — ningún archivo de imagen externo
- Cada sprite dibujado programáticamente con ctx.fillRect, ctx.arc, ctx.beginPath, gradientes, etc.
- Se registran como texturas de Phaser via `scene.textures.addCanvas(key, canvas)`
- Los sprites persisten entre escenas (check `textures.exists()` antes de regenerar)

**Tamaños principales:**
- Tiles: 32×32px (Nivel 1), 40×40px (Nivel 4 túneles)
- Jugador: 128×128px (13 frames spritesheet)
- Bosses: 128×128px (Foam Beard, Turbo Turban, Warden), 256×256px (Supreme Turban)
- Vehículos: 64×32px (F-15), 64×64px (Drone)
- Portaaviones: 480×200px
- Cielo/terreno: 960×540px o 960×120-250px (tileables)

### 6.3 Efectos Visuales

| Efecto | Uso |
|--------|-----|
| Screen Shake | Explosiones, impactos de boss, aterrizaje, activación |
| Camera Flash | Activación jammer (verde), explosión (blanco/naranja), daño (rojo) |
| Partículas | Explosiones, engine trail, debris, humo, fury particles, intercept |
| Scanlines CRT | Nivel 2 (radar), cinemáticas con estética terminal |
| Parallax | Niveles 3/5 (nubes, montañas, terreno a distintas velocidades) |
| Tweens | Fade in/out, escala, rotación, pulse, bounce |
| Depth Scaling | Nivel 4 boss (proyectiles crecen de 8→28px al acercarse) |
| Viñeta | Nivel 2 (esquinas oscuras estilo CRT) |
| Glow | Textos importantes (shadow con blur), monitores, explosiones |

---

## 7. AUDIO

### 7.1 Música

**Engine:** Web Audio API — síntesis procedural completa, sin archivos MP3/OGG

**Estilo:** Trance/Psytrance inspirado en Infected Mushroom

**Instrumentos sintetizados:**
1. Acid Bass — oscilador sawtooth con modulación LFO
2. Arpeggios rápidos — notas staccato en escala menor armónica
3. Kicks — onda sine con decay rápido
4. Pads atmosféricos — notas sostenidas con reverb
5. Hi-hats — ruido blanco con filtro bandpass

**Escalas disponibles:**
- A Harmonic Minor: [0,2,3,5,7,8,11] semitonos
- Natural Minor: [0,2,3,5,7,8,10]
- Phrygian (dark): [0,1,3,5,7,8,10]

**Tracks por nivel:**
| Nivel | Track | Estilo |
|-------|-------|--------|
| Menu | `playMenuMusic()` | Calmado, melódico |
| Cinemáticas | `playCinematicMusic(1-6)` | Orquestal/ambiental |
| Nivel 1 | `playLevel1Music()` | Tenso, infiltración |
| Nivel 1 Escape | Tempo acelerado, arpeggios más agudos |
| Nivel 2 | `playLevel2Music()` | Electrónica tensa |
| Nivel 3 | `playLevel3Music(phase)` | Fases: takeoff/flight/bombing/landing |
| Nivel 4 | `playLevel4Music(phase)` | Exploración/comando |
| Nivel 5 | Similar a nivel 3 | Más silencioso (stealth) |
| Nivel 6 | `playLevel6Music(phase)` | 3 fases escalantes (climax) |

**Sistema de crossfade:**
- Equal-power cosine fade curves
- Transiciones seamless entre fases
- Master gain + music gain separados
- Fade-out configurable (0.3s-1.5s)

### 7.2 Efectos de Sonido

Todos sintetizados via Web Audio API:

**Jugador:**
- `playStep()` — Triangle 200Hz (0.08s), cada 250ms al moverse
- `playJump()` — Sine sweep 200→600Hz (0.15s)
- `playLand()` — Triangle 80Hz (0.1s)
- `playHurt()` — Sawtooth 150Hz (0.2s)
- `playPlayerShoot()` — Bullet fire burst
- `playPlayerHit()` — Impact sound

**Bombas/Explosiones:**
- `playBombDrop()` — Caída de bomba
- `playBombImpact()` — Impacto de bomba
- `playExplosion()` — Noise burst complejo con LFO, decay largo (0.5s)
- `playMegaExplosion()` — Versión amplificada
- `playNuclearExplosion()` — Mayor escala

**Radar/Señales (Nivel 2):**
- `playRadarBlip()` — Sine 1200→800Hz (0.1s) — al colocar jammer
- `playRadarMark()` — Triangle 660Hz + 880Hz (0.06s c/u) — selección upgrade
- `playRadarIntercept()` — Noise burst + sine 2000→200Hz (0.5s) — activación
- `playRadarAmbient()` — Lowpass white noise, 0.02 vol, 65s — ambiente loop
- `playInterceptSuccess()` — Sine 880Hz + 1320Hz ascending (0.4s)
- `playInterceptFail()` — Sawtooth 100Hz descending (0.25s)
- `playRadarSweep()` — Sweep sound
- `playRadarAlert()` — Alert tone

**Aviación (Niveles 3/5):**
- `playJetEngine()` — Engine ambient loop (retorna referencia para cleanup)
- `playAfterburner()` — Boost sound
- `playCarrierAmbient()` — Portaaviones ambiente
- `playLandingGear()` — Tren de aterrizaje
- `playChaffRelease()` — Chaff deploy

**Misiles:**
- `playMissileWarning()` — Warning tone
- `playMissilePass()` — Misil pasando
- `playHomingMissile()` — Tracking sound

**Bunker (Nivel 3):**
- `playBunkerBusterDrop()` — Bomba penetrante
- `playBunkerBusterImpact()` — Impacto en capa
- `playFlakExplosion()` — Explosión flak

**Drone (Nivel 4):**
- `playDroneHum()` — Motor drone loop
- `playDroneScan()` — Escaneo
- `playDroneScanComplete()` — Target encontrado
- `playDroneHit()` — Drone dañado
- `playDoorOpen()` / `playDoorClose()` — Puertas
- `playInterference()` — Zona interferencia
- `playMarkPoint()` — Marcar punto

**Boss:**
- `playBossHit()` — Impacto en boss
- `playBossRoar()` — Rugido (fury activation)
- `playBossLaser()` — Disparo láser
- `playBossShockwave()` — Onda expansiva
- `playBossEntrance()` — Entrada dramática
- `playBossPhaseTransition()` — Cambio de fase
- `playShieldActive()` / `playShieldDown()` — Escudo
- `playDisintegrate()` — Desintegración final
- `playFinalVictory()` — Victoria final

**UI:**
- `playTypewriterClick()` — Texto typewriter
- `playMenuSelect()` — Selección menú
- `playVictory()` — Fanfarria victoria
- `playGameOver()` — Game over
- `playCountdownTick()` — Tick de cuenta regresiva
- `playTimesUp()` — Tiempo agotado
- `playSearchlightDetect()` — Detección (nivel 1)
- `playCameraAlarm()` — Alarma
- `playPlantBeeps()` — Beeps de plantado

**Master Volume:** 0.5 base, mute toggle via M key (syncs MusicManager)

---

## 8. CINEMÁTICAS

### 8.1 Game Intro (GameIntroScene) — ~30s

**Acto 1 — Mapa del Mundo (8s):**
- Fondo negro con grid verde (#00c800, alpha 0.06)
- Mapa de Medio Oriente: Egipto, Israel, Jordania, Siria, Iraq, Irán, Turquía, Líbano, Gaza
- Amenazas se iluminan en rojo secuencialmente: Irán → Líbano → Gaza → Siria
- Líneas de conexión rojas desde Irán
- Israel se ilumina azul/dorado con anillo pulsante
- Texto: "THEY THOUGHT THEY WERE SAFE..."

**Acto 2 — Los Villanos (10s):**
- Grid de 6 paneles (3×2):
  1. TEHRAN — Azadi Tower
  2. BEIRUT — Radar Network
  3. LEBANON — Underground Bunker
  4. GAZA — Tunnel Network
  5. NATANZ — Nuclear Facility
  6. THE COMMANDER — Final Boss
- Cada panel con ícono temático, aparición escalonada con sound effect

**Acto 3 — El Héroe (8s):**
- Fondo gradiente amanecer (blues → dorado)
- Silueta de SuperZion con brillo en kipá
- Siluetas de vehículos: F-15, B-2, Drone
- Texto: "ONE SOLDIER. SIX MISSIONS."
- Flash → "SUPERZION" título dorado 52px con glow

### 8.2 Intro Nivel 1 (IntroCinematicScene) — ~12s

**Acto 1:** Tel Aviv nocturno — skyline con edificios Bauhaus, estrellas, luna, mar Mediterráneo. SuperZion en silueta.
Texto: "TEL AVIV, ISRAEL — 02:00 HRS"

**Acto 2:** Mapa radar — ruta de vuelo Israel→Irán con avión animado.
Texto: "CLASSIFIED — OPERATION TEHRAN"

**Acto 3:** Llegada a Teherán — SuperZion cae desde arriba (Bounce.easeOut).
Texto: "TEHRAN, IRAN — 06:00 HRS" + "OBJECTIVE: DESTROY COMMUNICATIONS CENTER"

### 8.3 Post-Nivel 1 (ExplosionCinematicScene) — ~10s

5 fases de destrucción del edificio:
1. **Detonación:** Flash blanco, shake masivo
2. **Explosión:** Bola de fuego expandiéndose (4 capas concéntricas), 60 partículas debris
3. **Colapso:** Pisos caen secuencialmente (top→bottom), dust clouds laterales
4. **Humo:** Columna de humo (16 puffs), 8 fueguitos, ruinas, calavera ☠️, texto hebreo "דוד אבי"
5. **Camera pan:** Pan al jugador → pan a las ruinas → fade to black

Pantalla victoria: stats + rating estrellas

### 8.4 Intro Nivel 2 (BeirutIntroCinematicScene) — ~11s

**Acto 1:** Teherán explotando con siluetas de edificios. SuperZion corre fuera de pantalla.
Texto: "3 MONTHS LATER"

**Acto 2:** Mesa de radar con monitores brillando verde. SuperZion llega y se sienta.
Texto: "NEW MISSION RECEIVED"

### 8.5 Intro Nivel 3 (DeepStrikeIntroCinematicScene) — ~12s

**Acto 1:** Monitor radar con texto "MISSION COMPLETE". SuperZion sale.
**Acto 2:** Hangar con F-15. SuperZion se prepara.
Texto: "TARGET ACQUIRED — PREPARING FOR AERIAL ASSAULT"

### 8.6 Intro Nivel 4 (UndergroundIntroCinematicScene) — ~12s

**Acto 1:** F-15 aterrizando en pista del desierto. Shake al tocar tierra.
**Acto 2:** Noche en el desierto con fogata. Radio con transmisión.
Texto: "NEW INTEL — UNDERGROUND NETWORK DETECTED" + "DRONE RECONNAISSANCE AUTHORIZED"

### 8.7 Intro Nivel 5 (MountainBreakerIntroCinematicScene) — ~12s

**Acto 1:** Sala de planificación oscura. Documentos se dispersan con impacto.
Texto: "NUCLEAR INTEL CONFIRMED"

**Acto 2:** Mapa táctico con montaña target, ruta de vuelo animada, ícono B-2.
Texto: "THE NUCLEAR THREAT MUST BE ELIMINATED"

### 8.8 Intro Nivel 6 (LastStandCinematicScene) — ~14s

**Acto 1:** Cielo estrellado con silueta montañosa. Explosión nuclear (glow verde → flash blanco → fireball naranja → humo).
Texto: "NATANZ DESTROYED"

**Acto 2:** Close-up dramático de SuperZion con rifle. Luz lateral.
Texto: "ALL TARGETS NEUTRALIZED. ONE REMAINS." → "THE FORTIFIED BUNKER OUTSIDE BEIRUT" → "THIS ENDS NOW."

### 8.9 Créditos (CreditsScene) — 45s

- Fondo: Paisaje del acantilado (dim)
- Scroll vertical de créditos (monospace, 18px)
- Listado de 6 operaciones
- "CREATED WITH: CLAUDE CODE + ANTIGRAVITY"
- "DESIGNED BY: SEBASTIAN"
- Estrella de David dorada (triángulos superpuestos, 40px radio)
- "THANK YOU FOR PLAYING"
- Al completar: `localStorage.superzion_completed = 'true'`

### Base Cinemática (BaseCinematicScene)

Clase base con features estandarizados:
- Estructura de 2 actos con fade transitions
- Efecto typewriter (charDelay configurable 25-50ms)
- "ENTER TO SKIP" prompt (gris, bottom-right)
- "PRESS ENTER TO BEGIN" blinking (post Acto 2)
- Auto-advance timer (12-14s)
- Gestión de música (fade between scenes)

---

## 9. ESTRUCTURA TÉCNICA

### 9.1 Archivos del Proyecto

```
superzion/
├── src/
│   ├── main.js                              # Entry point, config Phaser
│   │
│   ├── data/
│   │   └── LevelConfig.js                   # Generación procedural mapa nivel 1
│   │
│   ├── entities/
│   │   ├── Player.js                        # BombermanPlayer (nivel 1)
│   │   ├── Guard.js                         # BombermanGuard (patrol/chaser)
│   │   ├── Bomb.js                          # Bomba timer + detonación
│   │   ├── Obstacle.js                      # Obstáculos estáticos
│   │   └── Enemy.js                         # Base genérica de enemigo
│   │
│   ├── ui/
│   │   └── HUD.js                           # HUD del nivel 1
│   │
│   ├── scenes/
│   │   ├── BaseCinematicScene.js            # Clase base cinemáticas
│   │   ├── BootScene.js                     # Loading screen
│   │   ├── GameIntroScene.js                # Intro del juego
│   │   ├── MenuScene.js                     # Menú principal
│   │   ├── IntroCinematicScene.js           # Intro nivel 1
│   │   ├── GameScene.js                     # NIVEL 1 (Bomberman)
│   │   ├── ExplosionCinematicScene.js       # Post nivel 1
│   │   ├── BeirutIntroCinematicScene.js     # Intro nivel 2
│   │   ├── BeirutRadarScene.js              # NIVEL 2 (Signal Storm)
│   │   ├── DeepStrikeIntroCinematicScene.js # Intro nivel 3
│   │   ├── BomberScene.js                   # NIVEL 3 (F-15 Bomber)
│   │   ├── UndergroundIntroCinematicScene.js# Intro nivel 4
│   │   ├── DroneScene.js                    # NIVEL 4 (Drone + Boss)
│   │   ├── MountainBreakerIntroCinematicScene.js # Intro nivel 5
│   │   ├── B2BomberScene.js                 # NIVEL 5 (B-2 Stealth)
│   │   ├── LastStandCinematicScene.js       # Intro nivel 6
│   │   ├── BossScene.js                     # NIVEL 6 (Final Boss)
│   │   └── CreditsScene.js                  # Créditos finales
│   │
│   ├── systems/
│   │   ├── MusicManager.js                  # Música procedural Web Audio
│   │   ├── SoundManager.js                  # SFX sintetizados
│   │   ├── DifficultyManager.js             # Multiplicadores dificultad
│   │   └── EndgameManager.js                # Lógica fin de nivel 1
│   │
│   └── utils/
│       ├── SpriteGenerator.js               # SuperZion spritesheet (13 frames)
│       ├── BombermanTextures.js             # Texturas nivel 1
│       ├── BomberTextures.js                # Texturas nivel 3 + Turbo Turban boss
│       ├── DroneTextures.js                 # Texturas nivel 4
│       ├── BossTextures.js                  # Texturas nivel 6
│       ├── PlatformerTextures.js            # Texturas platformer
│       ├── TowerDefenseTextures.js          # Texturas tower defense
│       ├── BackgroundGenerator.js           # Fondos genéricos
│       ├── BuildingGenerator.js             # Generador edificios
│       ├── CinematicTextures.js             # Texturas cinemáticas
│       ├── DecorationGenerator.js           # Decoraciones
│       ├── EnemySpriteGenerator.js          # Sprites enemigos
│       ├── ExplosionGenerator.js            # Generador explosiones
│       ├── ObstacleGenerator.js             # Generador obstáculos
│       ├── TileGenerator.js                 # Generador tiles
│       └── TopDownTextures.js               # Texturas vista cenital
│
├── dist/                                     # Build de producción (Vite)
├── index.html
├── package.json
└── vite.config.js
```

### 9.2 Flujo de Escenas

```
BootScene (800ms)
    ↓
GameIntroScene (30s, skippable)
    ↓
MenuScene (hub principal)
    ↓ (seleccionar nivel)
IntroCinematicScene → GameScene (Nivel 1) → ExplosionCinematicScene
    ↓
BeirutIntroCinematicScene → BeirutRadarScene (Nivel 2)
    ↓
DeepStrikeIntroCinematicScene → BomberScene (Nivel 3)
    ↓
UndergroundIntroCinematicScene → DroneScene (Nivel 4)
    ↓
MountainBreakerIntroCinematicScene → B2BomberScene (Nivel 5)
    ↓
LastStandCinematicScene → BossScene (Nivel 6)
    ↓
CreditsScene → MenuScene (con "GAME COMPLETED ★")
```

### 9.3 Singletons del Juego

| Sistema | Acceso | Función |
|---------|--------|---------|
| MusicManager | `MusicManager.get()` | Música procedural, crossfade, stop |
| SoundManager | `SoundManager.get()` | 60+ SFX sintetizados |
| DifficultyManager | `DifficultyManager.get()` | Multiplicadores de dificultad |

### 9.4 Persistencia (localStorage)

| Key | Tipo | Descripción |
|-----|------|-------------|
| `superzion_completed` | boolean | Juego completado (desbloquea hard mode) |
| `superzion_stars_1` a `_6` | number (0-3) | Rating estrellas por nivel |
| `superzion_hard_mode` | boolean | Hard mode activo |

### 9.5 Generación de Sprites

Todo sprite del juego se genera via Canvas 2D API:

```javascript
// Patrón típico:
function createTexture(scene) {
  if (scene.textures.exists('key')) return; // Reusar si existe
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  // ... dibujar con ctx.fillRect, ctx.arc, ctx.beginPath, gradients, etc.
  scene.textures.addCanvas('key', c); // Registrar como textura Phaser
}
```

Las texturas se generan la primera vez que una escena las necesita y persisten en memoria para escenas posteriores.

---

## 10. ESTADO ACTUAL DEL DESARROLLO

### Implementado y Funcionando

- [x] Boot screen con loading animation
- [x] Game Intro cinemático completo (3 actos con mapas, paneles, héroe)
- [x] Menú principal con selección de 6 niveles, estrellas, hard mode
- [x] **Nivel 1** completo: Bomberman con 10 guardias, boss Foam Beard, endgame escape
- [x] Cinemática de explosión post-nivel 1 (5 fases de destrucción)
- [x] Intro cinemática nivel 2 (Teherán explotando → mesa radar)
- [x] **Nivel 2** completo: Signal Storm con 2 rondas, 4 upgrades, radar, jammers
- [x] Intro cinemática nivel 3 (radar → hangar F-15)
- [x] **Nivel 3** completo: F-15 con takeoff, vuelo, bombardeo con boss Turbo Turban visible, retorno, aterrizaje
- [x] Intro cinemática nivel 4 (aterrizaje → briefing desierto)
- [x] **Nivel 4** completo: Recon drone, túneles, boss fight The Warden con cover + dodge
- [x] Intro cinemática nivel 5 (intel nuclear → mapa táctico)
- [x] **Nivel 5** completo: B-2 Stealth Bomber
- [x] Intro cinemática nivel 6 (explosión nuclear → close-up)
- [x] **Nivel 6** completo: Boss final Supreme Turban, 3 fases (normal, escudo, enrage+láser)
- [x] Créditos finales con scroll
- [x] Sistema de música procedural completo (Web Audio API)
- [x] 60+ efectos de sonido sintetizados
- [x] Sistema de dificultad (Normal/Hard)
- [x] Persistencia de progreso (localStorage)
- [x] Todos los sprites generados programáticamente
- [x] Skip de cinemáticas (ENTER)
- [x] Pausa universal (ESC)
- [x] Skip de nivel (P + confirmación Y/N)
- [x] Mute (M)

### Notas de Diseño

- El juego es 100% self-contained — no requiere assets externos
- Cada nivel introduce una mecánica completamente diferente
- Los bosses tienen personalidad visual marcada (turbante + lentes + barba)
- Las cinemáticas crean conexión narrativa entre misiones
- El sistema de estrellas incentiva la rejugabilidad
- Hard mode agrega desafío para jugadores experimentados

---

*Fin del Game Design Document — SuperZion v1.0*

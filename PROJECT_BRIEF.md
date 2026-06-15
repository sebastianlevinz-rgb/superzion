# SUPERZION MOBILE — Project Brief

> **Documento fuente para iniciar el proyecto SuperZion Mobile desde cero.**
> No es un port. Es un juego nuevo, pensado para mobile vertical, que comparte
> historia, personajes y conceptos de mecánicas con la versión desktop existente.
> La libertad creativa en mecánicas y visual está habilitada — la esencia narrativa
> es lo que se respeta al pie de la letra.

---

## 1. CONCEPTO DEL JUEGO

**SuperZion Mobile** es un juego de acción narrativa para web móvil (PWA), portrait,
estructurado en 6 misiones cortas (~2–3 minutos cada una). Cada misión es una
mecánica distinta — un mini-juego completo — encadenadas por cinemáticas tipo
briefing militar.

- **Plataforma:** Web móvil (PWA instalable). Funciona offline. Vertical obligatorio.
- **Audiencia:** Jugadores de 16+ que quieren sesiones cortas, momentos cinemáticos
  fuertes y una narrativa con peso. Mix entre arcade clásico y storytelling.
- **Sesión típica:** 1 misión = una espera de subte / una pausa de café / un
  trayecto en colectivo.
- **Tono:** Cinemático, dramático, irónico cuando hace falta. Estética 90s-arcade
  + terminal militar + cyberpunk minimalista. Nada de realismo gráfico.
- **Jugabilidad:** One-hand friendly siempre que sea posible. Controles touch
  diseñados desde cero — nunca un D-pad virtual. Cada nivel introduce un gesto
  o patrón distinto para mantener variedad.
- **Música:** Psytrance / trance, sintetizada en Web Audio API (sin assets de
  audio pesados — el juego entero arranca <1MB).

**Pitch en una línea:** *Seis misiones. Seis mecánicas. Una historia de 3.000 años.
En tu bolsillo.*

---

## 2. HISTORIA Y NARRATIVA

### 2.1 LEMA CENTRAL

> **THEY FIGHT TO CONQUER. WE FIGHT TO EXIST.**

Aparece en la intro inicial (cierre de title card) y en la pantalla final.
Es la frase ancla del juego — está en TODAS las versiones del juego, en
los créditos, en el menú principal cuando se completa el juego.

### 2.2 INTRO PRINCIPAL — 6 PÁGINAS

Cinemática inicial al abrir el juego por primera vez. Texto blanco/dorado sobre
fondo oscuro con escombros, llamas y siluetas de imperios caídos. Cada página
~3 segundos con typewriter effect.

```
PÁGINA 1
"For 3,000 years, they tried to erase us.
The oldest living civilization on Earth."

PÁGINA 2
"Babylon. Rome. The Inquisition. The Nazis.
They're all gone. We're still here."

PÁGINA 3
"New enemies. Hamas. Hezbollah. The Iranian regime.
Same mistake."

PÁGINA 4
"They forgot our secret weapon:
we have nowhere else to go."

PÁGINA 5
"One Nation. One mission.
3,000 years of resilience."

PÁGINA 6 (TITLE CARD)
            S U P E R Z I O N
THEY FIGHT TO CONQUER. WE FIGHT TO EXIST.
```

### 2.3 ARCO NARRATIVO DE LOS 6 NIVELES

Cada nivel = una operación con nombre código. Cada operación recibe un
**recap "PREVIOUSLY..."** al inicio mostrando los bosses ya derrotados con un
✗ rojo y la ciudad anterior con ✓ verde, antes de entrar en el briefing nuevo.

| # | Operación | Ciudad | Boss | Mecánica conceptual |
|---|-----------|--------|------|---------------------|
| 1 | THE TEHRAN GUEST ROOM | Tehran, Irán | Ismail Haniyeh (Foam Beard) | Sigilo / Bomberman |
| 2 | OPERATION GRIM BEEPER | Beirut, Líbano | (sin boss directo, sabotaje) | Intercepción / sabotaje |
| 3 | OPERATION DEEP STRIKE | Montañas del Líbano | Hassan Nasrallah (Turbo Turban) | Bombardeo aéreo (F-15) |
| 4 | OPERATION LAST CHAIR | Gaza / Underground | Yahya Sinwar (Angry Eyebrows) | Dron / túneles |
| 5 | OPERATION MOUNTAIN BREAKER | Natanz, Irán | (instalación nuclear) | B-2 Stealth Bomber |
| 6 | OPERATION ENDGAME — DEATH TO THE REGIME | Tehran, fortaleza final | Ayatollah Ali Khamenei (Supreme Turban) | Boss aéreo final |

### 2.4 CINEMÁTICAS DE BRIEFING — TEXTOS VERBATIM

#### LEVEL 1 — THE TEHRAN GUEST ROOM
*Coordenadas: 35°41'N 51°25'E. Estética: terminal verde con scanlines.*

```
"Tehran. The heart of the spider web. From here, they fund every enemy we have."

"Intelligence located a command center inside a military compound."

"The man in charge: Ismail Haniyeh. Chairman of the Hamas Political Bureau."
[Foam Beard aparece con label rojo "ISMAIL HANIYEH"]

"Get in. Plant the bomb. Get out. No backup. No extraction team."

"Just you, and 3,000 years of practice at the impossible."
[SuperZion reveal + título dorado "THE TEHRAN GUEST ROOM"]
```

#### LEVEL 2 — OPERATION GRIM BEEPER
*Coordenadas: 33°53'N 35°30'E (Beirut).*

```
PREVIOUSLY...
[Haniyeh tachado] Tehran: COMPLETE ✓

"Tehran: done. But cutting one head means nothing if the body keeps moving."
[Tehran explotando overlay]

"The enemy adapted. New communication networks. Thousands of encrypted beepers."

"The beepers are manufactured in Hong Kong. One factory. One shipment. One chance."
[Sello CLASSIFIED rojo, ángulo -12°]

"Plant the explosives at the source. Then wait for the perfect moment to detonate."
[SuperZion reveal + título "OPERATION GRIM BEEPER"]
```

#### LEVEL 3 — OPERATION DEEP STRIKE
*Coordenadas: 33°50'N 35°45'E. HUD ámbar (#CCAA00) tipo radar F-15.*

```
PREVIOUSLY...
[Haniyeh ✗] Tehran: COMPLETE ✓

"The tracker worked. We know where everything was going."

"A fortified bunker in the mountains. The nerve center."

"Inside: Hassan Nasrallah. Every rocket that fell on our schools, our hospitals,
our homes — he gave the order."
[Turbo Turban aparece con label "HASSAN NASRALLAH"]

"No ground team can reach that bunker. But 2,000 pounds of precision-guided steel can."
[Coordenadas animadas: TARGET: 33°50'12"N  35°45'08"E  ALT: -280m]

"The sunset over the Mediterranean will be beautiful tonight. He won't see the sunrise."
[F-15 silhouette + título "OPERATION DEEP STRIKE"]
```

#### LEVEL 4 — OPERATION LAST CHAIR
*Coordenadas: 31°25'N 34°23'E (Gaza). HUD verde (#00AA44).*

```
PREVIOUSLY...
[Haniyeh ✗] [Nasrallah ✗] Deep Strike: COMPLETE ✓

"The general is gone. But the tunnels remain."

"Hundreds of kilometers underground. Built with cement meant for schools.
Filled with weapons meant for war."
[Sonar pings expandiéndose, cross-section de túneles]

"And hiding inside: Yahya Sinwar. The man who turned the underground into a fortress."
[Angry Eyebrows aparece con label "YAHYA SINWAR"]

"Every entrance is a trap. Every tunnel is a maze."

"Good thing we're not sending a man. We're sending something with no fear and
perfect aim. Time to pull the last chair from under him."
[Drone graphic + título "OPERATION LAST CHAIR"]
```

#### LEVEL 5 — OPERATION MOUNTAIN BREAKER
*Coordenadas: 33°43'N 51°43'E (Natanz, Irán). HUD ámbar B-2 targeting.*

```
PREVIOUSLY...
[Haniyeh ✗] [Nasrallah ✗] [Sinwar ✗] Last Chair: COMPLETE ✓

"The underground empire is finished. Yahya Sinwar won't give orders again."

"But the real threat was never the soldiers or the tunnels."

"It's the bomb. 8,000 centrifuges spinning under a mountain. Day and night.
Getting closer."
[Símbolo nuclear ☢ pulsando con glow verde]

"If they finish it, nothing else matters. Not the missions. Not the victories.
Everything... gone."

"They buried it under a mountain because they think nothing can reach it."

"They haven't met the B-2 Spirit."
[B-2 silhouette tipo flying-wing + título "OPERATION MOUNTAIN BREAKER"]
```

#### LEVEL 6 — OPERATION ENDGAME: DEATH TO THE REGIME
*Coordenadas: 32°05'N 52°00'E. Cielo rojo sangre, fuegos, ejércitos.*

```
PREVIOUSLY...
[Tres bosses ✗] [Símbolo nuclear ✗] Fordow ✓ / Last Chair: COMPLETE ✓
[Teaser pulsando: "ONE TARGET REMAINS..."]

"Fordow is a crater. The centrifuges are scrap metal. The bomb will never exist."

"But one man remains. The one who started all of this."
[Flash blanco dramático]

"Ayatollah Ali Khamenei. The puppet master. Every missile, every tunnel,
every death — traces back to him."
[Supreme Turban entra: scale 0.5 → 2.8, label rojo grande "AYATOLLAH ALI KHAMENEI"]

"He's in his last fortress. Everything he has left, protecting one man."

"Babylon tried. Rome tried. The Inquisition tried. The Nazis tried."

"His turn to fail."
[SuperZion reveal + título dorado 3D "OPERATION ENDGAME: DEATH TO THE REGIME"]
```

### 2.5 VICTORIA FINAL — 9 PÁGINAS

Cinemática post-boss final. Salida del sol sobre Tel Aviv, Mediterráneo, paz.

```
PÁGINA 1 (gold, 32px, slow typewriter)
"The weapons are silent. For the first time in years... silence."

PÁGINA 2
"Where there were ashes, there will be gardens.
Where there was fear, children will play again."

PÁGINA 3
"For 3,000 years they tried to erase us. Empire after empire. Name after name."

PÁGINA 4
"This land does not belong to those who conquer.
It belongs to every soul who was promised they would return."

PÁGINA 5  [comienza el sunrise — progress 0.3]
"To those who came before us and never saw this day..."

PÁGINA 6  [sunrise progress 0.5]
"To those beside us who carried the weight when we could not..."

PÁGINA 7  [sunrise 0.6 + Maguen David dorado gigante fade-in detrás]
"And to those who will come after, who will inherit what we fought to protect..."

PÁGINA 8  [CLIMAX: sunrise full + multitud + confetti + fuegos artificiales]
"Am Yisrael Chai."
[40px gold bold]

PÁGINA 9 (TITLE CARD FINAL)
            S U P E R Z I O N
THEY FIGHT TO CONQUER. WE FIGHT TO EXIST.
[Banderas de Israel a ambos lados, multitud celebrando, fireworks]
```

### 2.6 CRÉDITOS

Scroll estilo Star Wars sobre fondo de atardecer animado:

```
SUPERZION
"THEY FIGHT TO CONQUER. WE FIGHT TO EXIST."

— — — —

Op. Tehran — Infiltration
Op. Deep Strike — Aerial Assault
Op. Underground — Reconnaissance
Op. Mountain Breaker — Nuclear Strike
Op. Last Stand — Final Battle

— — — —

CREATED WITH
CLAUDE CODE + ANTIGRAVITY

DESIGNED BY
SEBASTIAN

[Estrella de David dorada]

THANK YOU FOR PLAYING
```

---

## 3. PERSONAJES

### 3.1 SUPERZION (Protagonista)

Agente del Mossad. Operador único — sin equipo, sin extracción, sin backup.
Sale de cada misión por sus propios medios.

**Descripción visual canónica (libre a reinterpretación artística mobile):**
- Constitución en V — hombros anchos, cintura angosta, atlético no exagerado
- **Pelo negro peinado hacia atrás**, estilo militar prolijo
- **SIN barba, SIN kippá visible**
- **Anteojos de aviador oscuros** (en cinemáticas heroicas)
- **Traje táctico negro / gris oscuro** con bolsillos y correas visibles
- **Estrella de David dorada en el pecho** — grande, prominente, con glow.
  Es el ícono visual del personaje. Nunca debe faltar.
- Pantalón táctico oscuro, botas militares
- **Pistola con silenciador** en niveles de sigilo (no visible en escenas de paz)
- Postura confiada, hombros atrás, "ready stance"
- Iluminación dorada de borde (rim light) en escenas dramáticas

**Voz visual:** Dignidad calma. No es un militar gritando — es alguien que ya
hizo esto antes y va a hacerlo otra vez.

### 3.2 BOSSES

#### Boss 1 — Foam Beard
**Nombre real:** Ismail Haniyeh
**Cargo (en el juego):** Chairman of the Hamas Political Bureau
**Identidad visual:**
- Civil con traje formal oscuro
- **Barba blanca grande, "espumosa"** (de ahí el apodo)
- Ojos oscuros, expresión severa
- Pañuelo/headdress tradicional
- Robes oscuras formales

#### Boss 2 — Turbo Turban
**Nombre real:** Hassan Nasrallah
**Cargo:** Comandante de campo, ordena los misiles
**Identidad visual:**
- **Turbante negro grande, redondeado, dome shape** (el "turbo")
- **Anteojos** (rasgo distintivo)
- Barba oscura, expresión intensa
- Robes formales oscuras

#### Boss 3 — Angry Eyebrows
**Nombre real:** Yahya Sinwar
**Cargo:** Constructor del laberinto subterráneo
**Identidad visual:**
- **Cejas oscuras enormes y enojadas** (rasgo definitorio)
- **Boina militar** y/o vestimenta de campo
- **Cicatrices** en el rostro
- Barba, expresión hostil

#### Boss 4 — Supreme Turban (Final Boss)
**Nombre real:** Ayatollah Ali Khamenei
**Cargo:** El titiritero. Origen de todo el conflicto.
**Identidad visual:**
- **Turbante MASIVO** (el más grande de todos — "Supreme")
- **Bastón con luna creciente** en el pomo
- **Ojos rojos / glow rojo en los ojos** (efecto sobrenatural amenazante)
- Robes con drape pesado, capa
- Presencia colosal en pantalla (escala 2.8x en cinemáticas)
- Sombra duplicada con tinte negro detrás

**Nota de dirección:** Los bosses son figuras estilizadas, exageradas, en clave
de villano de arcade — no retratos realistas. La estética es comic-cinemática,
no fotográfica. Es importante que cada uno sea instantáneamente reconocible
en silueta.

---

## 4. LOS 6 NIVELES — VERSIÓN MOBILE

> Estas son **propuestas de reimaginación** para portrait + touch.
> Cada una respeta el concepto del nivel desktop, pero se rediseña desde cero
> aprovechando el formato vertical y los gestos naturales del pulgar.

### NIVEL 1 — THE TEHRAN GUEST ROOM
**Concepto desktop:** Bomberman / sigilo en complejo militar.
**Reimaginación mobile:** **Stealth top-down con swipe direccional.**

- Vista cenital, scroll vertical (la pantalla avanza hacia arriba a medida que
  SuperZion sube por niveles del edificio).
- **Control:** swipe en cualquier dirección para mover SuperZion una "casilla"
  o un "tramo" hasta el próximo cover. Tap para colocar bomba/dispositivo.
- Cada planta del edificio ocupa una pantalla portrait. Subis con escaleras
  o ductos.
- Conos de visión de guardias visibles (rojo cuando te ven, amarillo cuando
  sospechan). Si te ven → reset al último checkpoint.
- Objetivo final: plantar el dispositivo en la habitación de Haniyeh (último
  piso) y salir antes de que detone (countdown visible).
- **Duración:** 2–3 minutos.
- **Por qué funciona en mobile:** Top-down vertical es el formato perfecto
  para portrait. Swipe-to-move (estilo Hitman GO / Pac-Man 256) es one-hand
  friendly y elimina la fricción de un D-pad virtual.

### NIVEL 2 — OPERATION GRIM BEEPER
**Concepto desktop:** Sabotaje / intercepción de paquetes en puerto de Beirut.
**Reimaginación mobile:** **Tap-rhythm de sabotaje en línea de producción.**

- Vista lateral de una cinta transportadora vertical (los beepers caen desde
  arriba hacia abajo en pantalla, como un Tetris invertido).
- **Control:** tap rápido sobre el beeper objetivo para inyectarle el explosivo.
  Beepers "limpios" (que no son del envío correcto) NO deben ser tocados —
  si los tocás, alarma.
- Cada beeper sospechoso muestra un patrón visual (color, símbolo) que tenés
  que reconocer en una fracción de segundo.
- A medida que avanza el nivel, la cinta acelera. Aparecen beepers señuelo
  con patrones similares.
- **Mini-momento cinemático final:** después de plantar el último explosivo,
  pantalla en negro, cuenta regresiva, y un grid de beepers explota en
  cadena (visual de fuegos artificiales gigante).
- **Duración:** ~2 minutos.
- **Por qué funciona en mobile:** Tap timing es la mecánica más nativa del
  touch. Patrón ya validado por millones de jugadores (Fruit Ninja, Piano Tiles,
  Beat Saber móvil).

### NIVEL 3 — OPERATION DEEP STRIKE
**Concepto desktop:** Bombardeo aéreo F-15 sobre montañas del Líbano.
**Reimaginación mobile:** **Vertical scrolling shooter / bombardero arcade.**

- Cámara cenital con scroll automático hacia arriba (las montañas se
  aproximan desde abajo de pantalla — sensación de vuelo).
- **Control:** drag horizontal con un dedo (left/right del avión). Tap en
  cualquier parte de pantalla para soltar bomba sobre el área marcada.
- Estilo retro: HUD ámbar tipo radar F-15 con coordenadas que parpadean.
- Hay misiles antiaéreos enemigos que tenés que esquivar (drag sideways).
- **Boss intermedio aéreo:** Hassan Nasrallah aparece como una "voz" en el
  intercom (cinemática mid-level), y al final destruís el bunker en su
  montaña con una bomba guiada (mini quicktime: alinear retícula con
  doble-tap).
- **Duración:** 2–3 minutos.
- **Por qué funciona en mobile:** Scrolling shooters verticales son el género
  móvil clásico (1942, Sky Force Reloaded). Drag horizontal es one-hand puro.

### NIVEL 4 — OPERATION LAST CHAIR
**Concepto desktop:** Dron de reconocimiento en túneles de Gaza.
**Reimaginación mobile:** **Drone exploration con tilt + pinch.**

- Vista en primera persona del dron (cámara fish-eye con HUD verde tipo
  visión nocturna). Túneles oscuros con sonar pings expandiéndose.
- **Control:** drag con un dedo para girar la cámara (look around).
  Pinch-zoom para acelerar/frenar el dron. Tap-hold para activar sonar
  pulse (revela enemigos y trampas en la oscuridad por 2 segundos).
- Mecánica core: navegar laberinto sin tocar las paredes (rebotes = daño)
  ni activar trampas (alarmas que llaman guardias).
- **Encuentro final con Sinwar:** una sala donde está sentado en su silla
  de comando. El dron se posa, contás "3, 2, 1..." y le explotás la silla
  literalmente — referencia al "Last Chair" del título. Cinemática rápida.
- **Duración:** 3 minutos (más exploratorio que los otros).
- **Por qué funciona en mobile:** Pinch + tilt + drag son gestos naturales
  que ningún juego de consola puede replicar igual. Y la baja velocidad de
  un dron en túneles compensa la fricción del control 3D.

### NIVEL 5 — OPERATION MOUNTAIN BREAKER
**Concepto desktop:** B-2 stealth bomber sobre Natanz.
**Reimaginación mobile:** **Stealth flight con drag + hold de bomba.**

- Vista isométrica top-down nocturna. El B-2 se mueve solo hacia adelante.
- Hay torres de radar abajo con conos de detección que barren — tenés que
  cruzar entre ellos sin ser detectado.
- **Control:** drag horizontal para esquivar conos. Tap-hold sobre la
  pantalla para "cargar" la bomba antibúnker — soltar al pasar sobre el
  objetivo (ventana de timing pequeña).
- Estética: paleta de visión nocturna (verde fluo + negro), HUD targeting
  ámbar, símbolo nuclear ☢ marcado sobre la montaña como objetivo.
- **Cinemática final:** liberación de la bomba en cámara lenta — la
  montaña se desploma con efecto de impacto (camera shake, white flash,
  smoke).
- **Duración:** 2 minutos.
- **Por qué funciona en mobile:** Hold-to-charge es un patrón móvil clásico
  (Angry Birds, Crossy Road para algunos modos). El drag sideways libera el
  pulgar para el hold con índice — naturalmente two-finger pero sigue
  jugable a una mano.

### NIVEL 6 — OPERATION ENDGAME
**Concepto desktop:** Boss final aéreo contra Khamenei.
**Reimaginación mobile:** **Bullet-hell vertical con 3 fases.**

- Pantalla portrait. SuperZion piloteando un caza, abajo. Khamenei (Supreme
  Turban) flotando en su fortaleza, arriba, escala gigante.
- **Control:** drag con un dedo para mover el caza por toda la pantalla
  (8-direccional, no solo horizontal — la fortaleza dispara desde múltiples
  ángulos). Disparo automático mientras se toca la pantalla.
- **3 fases de boss:**
  - **Fase 1 — Lluvia de misiles:** patrones simétricos esquivables, hay
    que disparar a los lanzadores en la fortaleza.
  - **Fase 2 — Bullet hell con bastón de luna creciente:** Khamenei levanta
    su bastón y lanzas estelas curvas en espiral. Más caos.
  - **Fase 3 — Confrontación cara a cara:** la fortaleza se desploma,
    Khamenei queda flotando con ojos rojos brillando. Ventanas de oportunidad
    para impactarle directamente entre cargas de energía.
- **Cinemática final:** mega-explosión, flash blanco, "His turn to fail."
- **Duración:** 3 minutos (el más largo, por ser final).
- **Por qué funciona en mobile:** Bullet-hell es uno de los géneros
  móviles más exitosos (Touhou ports, Magna Petra). El drag-anywhere libera
  de cualquier D-pad y permite la precisión que el género exige.

---

## 5. PRINCIPIOS DE DISEÑO MOBILE

### 5.1 Reglas no-negociables

- **Vertical (portrait) obligatorio.** Todo el juego se diseña para una mano.
  Landscape NO se soporta — si el usuario rota el teléfono, mostrar overlay
  "Please rotate to portrait".
- **Thumb zone.** Todos los controles primarios y CTAs en el **tercio inferior**
  de la pantalla. La mitad superior es para info contextual (HUD, narrativa,
  cinemáticas).
- **Touch targets mínimo 48×48px** con 8px de spacing entre ellos. Los íconos
  visuales pueden ser más chicos pero el área tappeable debe respetar el
  mínimo.
- **No D-pad virtual.** Nunca. Cada nivel inventa su propio gesto nativo
  (swipe, tap, drag, pinch, hold). Los D-pad virtuales son la marca de un
  port mal hecho.
- **Sesión corta.** Cada nivel jugable en 2–3 minutos. Si el usuario muere,
  reset rápido (<2s a estar jugando de nuevo). Sin pantallas largas de
  "Game Over".
- **Pausa = una mano.** El botón de pausa siempre arriba a la derecha,
  alcanzable con el pulgar derecho mientras se sostiene el teléfono.

### 5.2 Feedback táctil y visual

- **Haptic feedback** vía Vibration API en cada acción principal (tap, hit,
  explosión). Configurable on/off en settings.
- **Ripple effect** o flash visible en cada tap. Nunca dejar al usuario con
  duda de "¿lo registró?".
- **Onboarding gestual** en el primer nivel: glow animado mostrando el gesto
  que se espera, las primeras 3 veces. Después, desaparece.

### 5.3 Legibilidad en pantalla chica

- Sprites principales mínimo **64×64px** en pantalla, idealmente más grandes.
- Texto narrativo mínimo **16px**, con buen contraste (WCAG AA 4.5:1).
- HUD con íconos antes que texto siempre que sea posible.
- Paleta high-contrast para los enemigos vs background — el gameplay no debe
  depender de matices sutiles que se pierdan al sol.

### 5.4 Estilo visual

- **Estética unificada:** mix de **terminal militar + arcade 90s + cyberpunk
  minimalista**. Pixel-art moderno o vector flat con outlines marcados —
  NO realismo. Cada nivel tiene su paleta dominante (verde Tehran,
  ámbar F-15, verde nocturno dron, azul stealth, rojo sangre final).
- Cinemáticas mantienen scanlines + flicker leve para reforzar el feel de
  "monitor de comando".
- **Visual identity flexible.** El estilo gráfico se rediseña desde cero —
  el desktop es referencia narrativa, no visual.

### 5.5 Accesibilidad

- **Color-blind safe:** ningún feedback crítico depende solo de color
  (rojo/verde). Siempre acompañar con forma o ícono.
- **Reduce motion** opt-in en settings (desactiva camera shake y partículas
  pesadas).
- **Subtítulos siempre on** en cinemáticas, con tamaño ajustable.
- **Alto contraste mode** opcional.
- **Skip cinemáticas** después de la primera vez vista.

---

## 6. STACK TÉCNICO RECOMENDADO

### 6.1 Decisión de engine

**Phaser 3 (recomendación principal).**
- Mejor performance en Safari/iOS (clave porque iOS fuerza WebKit en todos
  los browsers móviles).
- Documentación madura, comunidad enorme, AI tools (Claude, Copilot)
  generan código preciso para Phaser sin alucinaciones — esto importa
  porque se desarrollará con Claude Code.
- ~500KB minified, full game framework (no necesitás integrar 5 librerías).
- Soporte nativo de Web Audio, touch, multi-resolución.

**Alternativa a evaluar:** **Kaplay** si se quiere prototipar más rápido y
el equipo es chico — más amigable, más juguetón, pero performance peor en
Safari y AI tools alucinan más con su API. Bueno para game-jams, riesgoso
para un proyecto de 6 niveles.

**Por qué NO usar PixiJS:** Es un renderer, no un engine. Tendrías que
escribir input, audio, scene management, physics desde cero. Tiempo perdido.

### 6.2 Stack completo sugerido

```
Engine:       Phaser 3 (latest, 3.80+)
Lenguaje:     TypeScript (type safety paga sí o sí en 6 niveles)
Bundler:      Vite (instant HMR, build optimizado, PWA plugin nativo)
Audio:        Web Audio API directo (sin librería) — sintetizar todo,
              cero archivos de audio
PWA:          vite-plugin-pwa (Workbox por debajo)
State:        Sin librería externa — Phaser scenes manejan su propio state.
              Para estado persistente (progreso, estrellas), localStorage.
Lint/Format:  ESLint + Prettier
Testing:      Vitest para lógica pura. No hay infra mobile testing fácil
              en web — testear con dispositivos reales.
Deploy:       Vercel / Netlify / Cloudflare Pages — cualquiera. Static.
```

### 6.3 Performance targets

- Bundle inicial **<800KB gzip** (con assets sintéticos esto es alcanzable).
- **60 FPS** en gama media (Pixel 5a / iPhone SE 2020 como baseline).
- **First paint <2s** en 4G, **TTI <4s**.
- Memory budget: <150MB durante gameplay.

---

## 7. PWA Y DEPLOY

### 7.1 Manifest mínimo

```json
{
  "name": "SuperZion",
  "short_name": "SuperZion",
  "start_url": "/",
  "display": "fullscreen",
  "display_override": ["fullscreen", "standalone", "minimal-ui"],
  "orientation": "portrait",
  "background_color": "#050510",
  "theme_color": "#050510",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 7.2 Service worker

- Cachear shell entero del juego (HTML, JS, CSS, fonts) con strategy
  `CacheFirst` — el juego corre 100% offline después de la primera carga.
- Actualización: bump de version → service worker detecta nueva versión →
  toast "New version available, tap to reload".

### 7.3 iOS limitations a tener presentes (2026)

- **Fullscreen verdadero NO existe en iOS PWA portrait** (con iOS 26.1+
  hay una barra superior que no se puede esconder en portrait, solo en
  landscape). Diseñar el HUD asumiendo que esa barra está ahí.
- **Autoplay de audio bloqueado**: el primer sonido (música del menú)
  tiene que dispararse desde un click/tap del usuario. Solución: pantalla
  de "Tap to start" que arranca el AudioContext.
- **Push notifications** funcionan en iOS 16.4+ — útil para "vuelve y
  jugá la siguiente misión" pero no crítico para v1.
- **Storage quota** más chico en Safari — guardar progreso en
  localStorage (es suficiente, son <1KB).

### 7.4 Instalación

- Detectar `beforeinstallprompt` (Android/Chrome) y mostrar CTA "Install
  SuperZion" después de completar el primer nivel.
- En iOS, mostrar instrucciones manuales (Share → Add to Home Screen)
  solo si el usuario juega 2+ niveles.

---

## 8. AUDIO

### 8.1 Filosofía: TODO sintetizado

Cero archivos de audio. Toda la música y todos los SFX se generan en
runtime con Web Audio API. Esto baja el bundle a <1MB y hace el juego
instalable instantáneamente.

### 8.2 Música — Psytrance / Trance

- **Tempo:** 140+ BPM
- **Escalas:** menor armónica, menor natural, frigia (modos oscuros)
- **Síntesis:** osciladores (sine, square, triangle, sawtooth) + envelopes
  + filtros + buffers de ruido blanco
- **Tracks necesarios (6):**
  1. Menu — ambient trance, loop continuo
  2. Briefing/Cinematic — drone atmosférico
  3. Gameplay — psytrance con acid bass, kicks, arpegios rápidos
  4. Boss reveal — trance oscuro intenso
  5. Victory level — fanfare en mayor
  6. Final victory — épico orquestal-electrónico híbrido

- **Crossfading** entre tracks con curvas equal-power coseno (transiciones
  perfectas sin clicks).

### 8.3 SFX core (todos sintetizados)

`step`, `jump`, `hurt`, `laser`, `alarm`, `plant`, `explosion`, `victory`,
`countdown`, `radar-blip`, `radar-mark`, `radar-intercept`, `drone-scan`,
`drone-hum`, `jet-engine`, `afterburner`, `boss-entrance`, `mega-explosion`,
`final-victory`, `typewriter-click`, `menu-select`.

### 8.4 Manejo de autoplay (iOS)

```
1. App carga → AudioContext en estado 'suspended'
2. Pantalla "TAP TO BEGIN" se muestra
3. Primer tap → audioContext.resume() + arranca música del menú
4. De ahí en adelante, todo audio funciona sin restricciones en esa sesión
```

### 8.5 Mute global

- Botón de mute en HUD, esquina superior derecha (alcanzable con pulgar
  derecho mientras se sostiene).
- Volumen con ramp lineal de 20ms para evitar clicks.
- Estado de mute persistido en localStorage.

---

## 9. ROADMAP SUGERIDO

Fases ordenadas para construir el juego con Claude Code + GSD.

### Fase 0 — Bootstrapping
- Inicializar Vite + Phaser 3 + TypeScript
- Setup PWA (manifest + service worker)
- Estructura de carpetas (`src/scenes`, `src/entities`, `src/audio`,
  `src/ui`, `src/data`)
- Boot scene mínima: pantalla negra con "TAP TO BEGIN"

### Fase 1 — Foundation
- Sistema de escenas y router
- TouchInput abstracto (swipe, tap, hold, drag, pinch como eventos
  desacoplados del DOM)
- AudioManager (música + SFX sintetizados)
- HUD components reutilizables
- Persistencia (localStorage para progreso/estrellas)

### Fase 2 — Cinemáticas + Menú
- Sistema de cinemáticas (typewriter, fade, recap "PREVIOUSLY...")
- GameIntroScene (las 6 páginas iniciales)
- MenuScene con selección de niveles + estrellas
- VictoryScene + CreditsScene (placeholder texto, sin sunrise todavía)

### Fase 3 — Nivel 1: Tehran (Stealth top-down)
- Tilemap + scrolling vertical
- Player + swipe-to-move
- Guardias con conos de visión
- Bomba + countdown + escape
- Cinemática de explosión

### Fase 4 — Nivel 2: Beirut Beepers (Tap-rhythm)
- Cinta transportadora con beepers cayendo
- Sistema de patrones (visuales correctos vs señuelos)
- Aceleración progresiva
- Cadena de explosiones final

### Fase 5 — Nivel 3: Deep Strike (Vertical shooter)
- Scroll automático
- Drag horizontal del avión
- Misiles enemigos + esquive
- Bomba guiada con tap, mini-quicktime para boss

### Fase 6 — Nivel 4: Last Chair (Drone exploration)
- Cámara FPV con drag + pinch
- Sonar pulse system
- Túneles laberínticos con trampas
- Encuentro final con Sinwar

### Fase 7 — Nivel 5: Mountain Breaker (Stealth flight)
- Vista isométrica + scroll
- Conos de radar + esquive
- Hold-to-charge bomba antibúnker
- Cinemática de impacto

### Fase 8 — Nivel 6: Endgame (Bullet hell)
- Drag-anywhere caza
- 3 fases del boss con patrones distintos
- Mecánicas únicas por fase
- Cinemática mega-explosión final

### Fase 9 — Polish narrativo
- Victory scene con sunrise animado completo
- Multitud celebrando, fireworks, confetti
- Title card "Am Yisrael Chai"
- Credits con scroll Star Wars

### Fase 10 — Audio completo
- Reemplazar placeholders con tracks finales
- Mix de niveles
- Crossfading perfecto entre escenas

### Fase 11 — Performance & accessibility
- Profiling en gama media (Pixel 5a, iPhone SE 2020)
- Reduce-motion mode, color-blind safe pass, alto contraste
- Subtítulos ajustables
- Skip cinemáticas

### Fase 12 — PWA polish & deploy
- Iconos en todas las resoluciones
- Splash screens
- Service worker con offline completo
- Deploy a Vercel/Cloudflare Pages
- Test instalación en Android + iOS reales

---

## 10. SKILLS Y HERRAMIENTAS DE DESARROLLO RECOMENDADAS

### 10.1 Skills de Claude Code que conviene cargar

- **`gsd:new-project`** — para arrancar el proyecto con la estructura GSD
  (PROJECT.md + roadmap + fases). Pasarle este PROJECT_BRIEF.md como input
  inicial.
- **`gsd:plan-phase`** y **`gsd:execute-phase`** — el corazón del workflow.
  Una fase del roadmap por vez, con verification loop.
- **`gsd:ui-phase`** — antes de cada nivel, generar un UI-SPEC.md como
  contrato de diseño visual (especialmente útil en mobile donde
  pequeñas decisiones de UI rompen la jugabilidad).
- **`gsd:ui-review`** — auditoría visual retro de cada nivel terminado
  (los 6 pillars: legibilidad, contraste, thumb zone, etc.).
- **`accessibility`** — pasada de WCAG 2.2 sobre el HUD y las cinemáticas.
- **`performance`** — auditoría de FPS y bundle antes de deploy.
- **`gsd:debug`** — para los bugs intrincados de touch input.
- **`gsd:add-tests`** — tests para la lógica de scoring/persistencia
  (el resto del juego se testea jugándolo).

### 10.2 Herramientas externas recomendadas

- **Vite + vite-plugin-pwa** — bundler + PWA en una.
- **Phaser 3** — engine principal.
- **TypeScript** — type safety, especialmente para los datos de niveles.
- **Stylus / PostCSS** — para CSS de overlays y menús (mínimo, el grueso
  del render lo hace Phaser).
- **PWA Builder** (web tool) — para validar el manifest y generar splash
  screens de iOS automáticamente.
- **Lighthouse** (Chrome DevTools) — auditoría de PWA + performance.
- **WebPageTest** — performance real en dispositivos remotos.
- **BrowserStack** o **LambdaTest** — testing en iPhones reales sin tenerlos.
- **Figma** (opcional) — para mockups de UI antes de implementar cada nivel.

### 10.3 Setup inicial sugerido

Una vez creado el nuevo directorio del proyecto, dentro de Claude Code:

```
1. /gsd:new-project          → arranca con este PROJECT_BRIEF.md
2. /gsd:plan-phase           → planifica Fase 0 (bootstrapping)
3. /gsd:execute-phase        → ejecuta
4. ...repetir por cada fase del roadmap...
```

Y configurar `.claude/settings.json` con permisos para `npm`, `vite`,
`git` para evitar prompts repetitivos.

---

## INSTRUCCIONES PARA NUEVO PROYECTO

Este archivo es el **brief inicial** del proyecto SuperZion Mobile.

**Pasos sugeridos:**

1. Crear una carpeta nueva en el sistema (ej: `~/Desktop/SuperZionMobile/`).
2. Copiar este `PROJECT_BRIEF.md` a la raíz de la carpeta nueva.
3. Abrir Claude Code en esa carpeta nueva.
4. Decirle a Claude: *"Leé el `PROJECT_BRIEF.md` y arranquemos el proyecto.
   Empezá con `/gsd:new-project` usando este brief como contexto, después
   `/gsd:plan-phase` para la Fase 0."*
5. Iterar fase por fase, una a la vez, con verification loops del GSD.

**Importante:**
- La narrativa, lema, personajes y arco de los 6 niveles son **canónicos** —
  respetar al pie de la letra.
- Las mecánicas, controles, visual style, paleta, sprites son **flexibles**
  — reimaginar libremente para que el juego se sienta hecho-para-mobile,
  no portado.
- El proyecto desktop existente (`~/Desktop/ORL3/superzion`) queda como
  **referencia de narrativa** únicamente. **No copiar código** ni assets.

---

*Brief generado el 2026-05-02 — fuente: `~/Desktop/ORL3/superzion` (versión desktop)*

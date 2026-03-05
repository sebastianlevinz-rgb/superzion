# Phase 1: Audio Foundation - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Repair MusicManager with proper fade-out/crossfade and fix AudioBufferSourceNode leak risk on scene transitions. After this phase, all scene transitions handle music gracefully — no abrupt cuts, no zombie audio nodes, no volume doubling.

</domain>

<decisions>
## Implementation Decisions

### Fade behavior
- Replace `linearRampToValueAtTime` with equal-power crossfade curve in `stop()` — linear ramp creates perceived volume dip at midpoint on sustained trance pads
- Add `crossfadeTo(trackName, generator, duration)` method that overlaps outgoing/incoming themes using two GainNodes with equal-power curves
- Default fade duration: 1.5 seconds (trance tracks need longer crossfade than typical game music)
- Keep existing `stop(fadeTime)` signature but fix the ramp curve internally

### Scene transition integration
- ALL `scene.start()` callsites must call `MusicManager.get().stop()` before transitioning — no exceptions
- Best approach: hook into `BaseCinematicScene` shutdown and create a utility method for gameplay scenes
- Scene-to-scene transitions where music CONTINUES (e.g., menu to cinematic) should use `crossfadeTo()` instead of stop+start
- Scenes that share the same track (if any) should not fade at all — detect via `currentTrack` name

### Node cleanup on transitions
- Existing `_cleanupNodes()` is solid for inter-loop cleanup but must also be called on scene shutdown
- Add `shutdown()` or `onSceneDestroy()` hook that forces cleanup of all active nodes
- Ensure `_nodes` array is fully drained on any stop — no orphaned oscillators/buffers
- Validate: after stop(), `_nodes.length === 0` and no AudioContext destination connections remain

### AudioContext lifecycle
- Keep single AudioContext for game lifetime (browsers limit to ~6)
- AudioContext resume must happen on user gesture — ensure `_init()` is called from a click/key handler, not from scene preload
- Existing pattern (`if (this.ctx.state === 'suspended') this.ctx.resume()`) is correct — keep it

### Claude's Discretion
- Exact equal-power crossfade curve implementation (Math.cos/Math.sin or custom)
- Whether to extract `crossfadeTo()` as a separate GainNode pair or reuse `musicGain`
- How to structure the scene transition hooks (mixin, base class method, or standalone utility)
- Whether to add `masterGain` volume persistence across transitions

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MusicManager.stop(fadeTime)` at line 95: Already has fade + loopId guard + cleanup scheduling — needs curve fix, not rewrite
- `MusicManager._cleanupNodes()` at line 121: Iterates `_nodes[]`, stops and disconnects — solid foundation
- `MusicManager._startLoop()` at line 130: Loop scheduling with cleanup between iterations — pattern to preserve
- `BaseCinematicScene` at `src/scenes/BaseCinematicScene.js`: Has `this.time.delayedCall(350, () => this.scene.start(...))` — natural place to hook fade-out

### Established Patterns
- Singleton pattern: `MusicManager.get()` — all access through static getter
- Node tracking: `this._nodes.push(node)` throughout all generator methods — already universal
- Loop ID guard: `this._loopId` prevents stale callbacks from killing new tracks — must preserve
- GainNode chain: `musicGain → masterGain → destination` — crossfade needs parallel chain

### Integration Points
- ~20 `scene.start()` callsites across all scene files need `MusicManager.get().stop()` calls
- `BaseCinematicScene.js` line 79 and 106: `delayedCall(350, () => this.scene.start(...))` — add fade before delay
- `MenuScene.js` line 234: `delayedCall(300, () => this.scene.start(...))` — add fade
- Gameplay scenes (GameScene, BomberScene, DroneScene, B2BomberScene, BossScene): scene.start calls on game over/victory

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User deferred all decisions to Claude's discretion for this infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-audio-foundation*
*Context gathered: 2026-03-05*

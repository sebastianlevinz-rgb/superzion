// ===================================================================
// AI sprite overrides (Nano Banana / Gemini PNGs)
// ===================================================================
// Keys listed here are loaded from hand-made PNGs in
// public/assets/sprites/ instead of the procedural canvas drawings.
// The procedural texture generators skip any key that already exists,
// so removing a key here (or deleting its PNG) instantly falls back to
// the original art — nothing breaks.

export const AI_SPRITES = [
  // ── Bomberman (GameScene) ──
  // Hero
  'bm_player_down_0', 'bm_player_down_1',
  'bm_player_up_0', 'bm_player_up_1',
  'bm_player_left_0', 'bm_player_left_1',
  'bm_player_right_0', 'bm_player_right_1',
  // Patrol guard
  'bm_patrol_down_0', 'bm_patrol_down_1',
  'bm_patrol_up_0', 'bm_patrol_up_1',
  'bm_patrol_left_0', 'bm_patrol_left_1',
  'bm_patrol_right_0', 'bm_patrol_right_1',
  // Chaser guard
  'bm_chaser_down_0', 'bm_chaser_down_1',
  'bm_chaser_up_0', 'bm_chaser_up_1',
  'bm_chaser_left_0', 'bm_chaser_left_1',
  'bm_chaser_right_0', 'bm_chaser_right_1',
  // Boss "Foam Beard"
  'bm_boss1_normal', 'bm_boss1_angry', 'bm_boss1_dead',

  // ── Platformer (PlatformerScene) ──
  'plt_player_idle', 'plt_player_run_0', 'plt_player_run_1',
  'plt_player_run_2', 'plt_player_run_3', 'plt_player_jump',
  'plt_guard_walk_0', 'plt_guard_walk_1', 'plt_guard_walk_2', 'plt_guard_walk_3',

  // ── Port Swap (PortSwapScene) ──
  'ps_player_down_0', 'ps_player_down_1', 'ps_player_up_0', 'ps_player_up_1',
  'ps_player_left_0', 'ps_player_left_1', 'ps_player_right_0', 'ps_player_right_1',
  'ps_guard_down_0', 'ps_guard_down_1', 'ps_guard_up_0', 'ps_guard_up_1',
  'ps_guard_left_0', 'ps_guard_left_1', 'ps_guard_right_0', 'ps_guard_right_1',
  'ps_worker_down_0', 'ps_worker_down_1', 'ps_worker_up_0', 'ps_worker_up_1',
  'ps_worker_left_0', 'ps_worker_left_1', 'ps_worker_right_0', 'ps_worker_right_1',

  // ── Air combat (BomberScene / DroneScene / B2BomberScene) ──
  'f15_side', 'b2_side', 'drone_top', 'carrier_side',
  'turbo_turban', 'turbo_turban_yell',
  'guard_idle', 'guard_shoot',
  'turret_idle', 'turret_alert', 'turret_shoot',
  'mini_soldier',

  // ── Parade (GameIntroScene / LastStandCinematicScene) ──
  'parade_foambeard', 'parade_turboturban', 'parade_angryeyebrows', 'parade_supremeturban',
  'parade_superzion', 'parade_soldier',
  'parade_missiletruck', 'parade_rockettruck', 'parade_merkava',
  'parade_f15', 'parade_f35', 'parade_drone',
  'parade_carrier', 'parade_frigate', 'parade_irondome', 'parade_apc', 'parade_azadi',

  // ── Final boss (BossScene) ──
  'player_fighter', 'bunker_fortress',

  // ── Full-screen backgrounds (opaque) ──
  'sunset_sky', 'night_sky', 'daytime_sky', 'beirut_sky',
  'command_room', 'target_building',

  // ── Cinematic panoramas + hero portraits ──
  'cin_tehran', 'cin_beirut_port', 'cin_lebanon_coast', 'cin_fortress',
  'cin_natanz', 'cin_gaza', 'cin_destroyed_city', 'cin_cliff_bg', 'cin_ops_room',
  'cin_superzion', 'cin_superzion_cliff',

  // ── Props ──
  'ps_container_red', 'ps_container_red_marked',
  'ps_container_blue', 'ps_container_blue_marked',
  'ps_container_green', 'ps_container_green_marked',
  'ps_container_yellow', 'ps_container_yellow_marked',
  'ps_container_orange', 'ps_container_orange_marked',
  'ps_ship', 'ps_crane', 'ps_building',
  'armchair', 'armchair_side',
];

// Queue the PNG loads — call inside a scene's preload().
export function preloadAISprites(scene) {
  for (const key of AI_SPRITES) {
    scene.load.image(key, `assets/sprites/${key}.png`);
  }
}

# Hero Brawl Map Editor
# ─────────────────────────────────────────────────────────────
# Visual editor for hero-brawl.html maps. Output JSON matches
# the ARENA structure the game uses (walls = axis-aligned rects,
# bushes = circles).
#
# Keys:
#   [1] Wall tool   — drag to draw an axis-aligned rectangle
#   [2] Bush tool   — click to place a bush (circle)
#   [3] Erase tool  — click on a wall/bush to remove it
#   [ / ]           — shrink / grow current bush radius
#   [C]             — clear the whole map
#   [B]             — fill default outer border walls
#   [E]             — export to user://map.json
#   [L]             — load user://map.json back into the editor
#
# After [E]xport, click "📁 Open Export Folder" in the HUD (or run
# `open ~/Library/Application\ Support/Godot/app_userdata/Hero\ Brawl\ Map\ Editor/`
# in a terminal) to grab map.json. Drop that file into the Hero Brawl
# lobby's "Load custom map" picker.

extends Node2D

const W := 2560
const H := 1440
const GRID := 16          # snap step (game's arena uses fine pixels)
const WALL_COLOR := Color(0.24, 0.15, 0.08)
const WALL_HIGHLIGHT := Color(0.35, 0.23, 0.12)
const BUSH_COLOR_BG := Color(0.05, 0.18, 0.10)
const BUSH_COLOR_FG := Color(0.10, 0.29, 0.15)
const GRID_COLOR := Color(0.05, 0.16, 0.07)
const FLOOR_COLOR := Color(0.10, 0.22, 0.13)

enum Tool { WALL, BUSH_CIRCLE, BUSH_POLY, SLOW_ZONE, SPAWN, BARREL, ERASE }
const MAX_SPAWNS: int = 4
var tool: int = Tool.WALL
var walls: Array[Rect2] = []                # solid axis-aligned walls
var destructibles: Array[Rect2] = []        # destructible barrel walls (have HP)
var bushes: Array[Vector3] = []             # circle bushes: x, y, radius
var polys: Array = []                       # polygon bushes (PackedVector2Array each)
var slow_zones: Array = []                  # river/swamp polygons (PackedVector2Array each)
var spawns: Array[Vector2] = []             # player spawn markers (cap MAX_SPAWNS)
var current_poly: PackedVector2Array = PackedVector2Array()  # shared WIP polygon (bush + slow)

var dragging: bool = false
var drag_start: Vector2 = Vector2.ZERO
var brush_r: int = 55
var hover_pos: Vector2 = Vector2.ZERO
var status_msg: String = "Drag walls · click bushes · [E]xport · [B]order · [L]oad"
var status_msg_until: float = 0.0


func _ready() -> void:
	set_process_input(true)
	set_process(true)
	# Start with the default outer border so empty arenas aren't open at the edge
	_add_border_walls()
	queue_redraw()


func _process(delta: float) -> void:
	if Time.get_unix_time_from_system() < status_msg_until:
		queue_redraw()


func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		hover_pos = event.position
		if dragging or tool == Tool.BUSH_CIRCLE or tool == Tool.BUSH_POLY or tool == Tool.SLOW_ZONE:
			queue_redraw()

	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_1: _set_tool(Tool.WALL,        "WALL — drag to draw a solid wall")
			KEY_2: _set_tool(Tool.BUSH_CIRCLE, "BUSH circle — click to place (r=%d · [ ] resize)" % brush_r)
			KEY_3: _set_tool(Tool.BUSH_POLY,   "BUSH polygon (王者荣耀) — click vertices · Enter close · Esc cancel")
			KEY_4: _set_tool(Tool.SLOW_ZONE,   "SLOW ZONE — click vertices for a river/swamp · Enter close")
			KEY_5: _set_tool(Tool.SPAWN,       "SPAWN — click to add (max %d, oldest replaced)" % MAX_SPAWNS)
			KEY_6: _set_tool(Tool.BARREL,      "BARREL — drag to draw a destructible wall (breaks on shot)")
			KEY_7: _set_tool(Tool.ERASE,       "ERASE — click any element to remove it")
			KEY_BRACKETLEFT:
				brush_r = max(20, brush_r - 5); _flash("Brush radius: %d" % brush_r)
			KEY_BRACKETRIGHT:
				brush_r = min(160, brush_r + 5); _flash("Brush radius: %d" % brush_r)
			KEY_B: _add_border_walls(); _flash("Added outer border walls")
			KEY_C:
				walls.clear(); destructibles.clear(); bushes.clear(); polys.clear()
				slow_zones.clear(); spawns.clear(); current_poly = PackedVector2Array()
				_flash("Map cleared")
			KEY_ENTER, KEY_KP_ENTER:
				if current_poly.size() >= 3:
					if tool == Tool.BUSH_POLY:
						polys.append(current_poly.duplicate())
						_flash("Polygon bush added (%d vertices)" % current_poly.size())
					elif tool == Tool.SLOW_ZONE:
						slow_zones.append(current_poly.duplicate())
						_flash("Slow zone added (%d vertices)" % current_poly.size())
					current_poly = PackedVector2Array()
				elif tool == Tool.BUSH_POLY or tool == Tool.SLOW_ZONE:
					_flash("Need at least 3 vertices")
			KEY_ESCAPE:
				if current_poly.size() > 0:
					current_poly = PackedVector2Array()
					_flash("Polygon cancelled")
			KEY_E: _export_json()
			KEY_L: _load_json()
		queue_redraw()

	if event is InputEventMouseButton and (event as InputEventMouseButton).button_index == MOUSE_BUTTON_LEFT:
		var mb: InputEventMouseButton = event
		var pos: Vector2 = mb.position
		if mb.pressed:
			match tool:
				Tool.WALL, Tool.BARREL:
					dragging = true
					drag_start = _snap(pos)
				Tool.BUSH_CIRCLE:
					if _inside_arena(pos):
						bushes.append(Vector3(pos.x, pos.y, float(brush_r)))
				Tool.BUSH_POLY, Tool.SLOW_ZONE:
					if _inside_arena(pos):
						current_poly.append(pos)
				Tool.SPAWN:
					if _inside_arena(pos):
						if spawns.size() >= MAX_SPAWNS:
							spawns.remove_at(0)
						spawns.append(pos)
						_flash("Spawn %d / %d placed" % [spawns.size(), MAX_SPAWNS])
				Tool.ERASE:
					_erase_at(pos)
		else:
			if dragging and (tool == Tool.WALL or tool == Tool.BARREL):
				var end_pt: Vector2 = _snap(pos)
				var x: float = min(drag_start.x, end_pt.x)
				var y: float = min(drag_start.y, end_pt.y)
				var w: float = abs(end_pt.x - drag_start.x)
				var h: float = abs(end_pt.y - drag_start.y)
				if w >= GRID and h >= GRID:
					if tool == Tool.WALL:
						walls.append(Rect2(x, y, w, h))
					else:
						destructibles.append(Rect2(x, y, w, h))
				dragging = false
		queue_redraw()


# ── Drawing ───────────────────────────────────────────────
func _draw() -> void:
	# Floor + 64px grid (matches the game's grid)
	draw_rect(Rect2(0, 0, W, H), FLOOR_COLOR)
	for x in range(0, W + 1, 64):
		draw_line(Vector2(x, 0), Vector2(x, H), GRID_COLOR, 1.0)
	for y in range(0, H + 1, 64):
		draw_line(Vector2(0, y), Vector2(W, y), GRID_COLOR, 1.0)

	# Slow zones (river/swamp polygons) — drawn UNDER walls/bushes
	for sz in slow_zones:
		var sv: PackedVector2Array = sz
		draw_colored_polygon(sv, Color(0.05, 0.25, 0.45, 0.85))
		# wavy highlight lines for "water"
		for i in range(sv.size()):
			var a4: Vector2 = sv[i]
			var b4: Vector2 = sv[(i + 1) % sv.size()]
			draw_line(a4, b4, Color(0.30, 0.65, 0.95, 0.7), 2.0)
		# centroid + label
		var cx: float = 0.0; var cy: float = 0.0
		for v in sv:
			var vv3: Vector2 = v
			cx += vv3.x; cy += vv3.y
		cx /= max(1, sv.size()); cy /= max(1, sv.size())
		var f0: Font = ThemeDB.fallback_font
		draw_string(f0, Vector2(cx - 22, cy + 4), "SLOW", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(0.7, 0.9, 1.0, 0.9))

	# Walls (solid)
	for r in walls:
		draw_rect(r, WALL_COLOR)
		draw_rect(Rect2(r.position + Vector2(2, 2), Vector2(r.size.x - 4, 4)), WALL_HIGHLIGHT)

	# Destructible barrel walls — orange wood crates with cracks
	for r in destructibles:
		draw_rect(r, Color(0.55, 0.30, 0.10))
		draw_rect(Rect2(r.position + Vector2(2, 2), Vector2(r.size.x - 4, 3)), Color(0.78, 0.45, 0.18))
		draw_rect(Rect2(r.position + Vector2(0, r.size.y - 3), Vector2(r.size.x, 3)), Color(0.30, 0.16, 0.05))
		# vertical plank seams
		var step: int = 24
		var px: int = int(r.position.x) + step
		while px < int(r.position.x + r.size.x):
			draw_line(Vector2(px, r.position.y + 2), Vector2(px, r.position.y + r.size.y - 2),
				Color(0.30, 0.16, 0.05), 1.0)
			px += step
		# diagonal "crack" hint
		draw_line(r.position + Vector2(4, r.size.y * 0.4),
			r.position + Vector2(r.size.x - 4, r.size.y * 0.7),
			Color(0.20, 0.10, 0.04, 0.7), 1.0)

	# Bushes — circles
	for b in bushes:
		draw_circle(Vector2(b.x, b.y), b.z, BUSH_COLOR_BG)
		for i in range(8):
			var a: float = float(i) / 8.0 * TAU + b.x * 0.01
			draw_circle(Vector2(b.x + cos(a) * b.z * 0.55, b.y + sin(a) * b.z * 0.55), b.z * 0.45, BUSH_COLOR_FG)

	# Bushes — polygons (王者荣耀-style grass)
	for poly in polys:
		var pv: PackedVector2Array = poly
		draw_colored_polygon(pv, BUSH_COLOR_BG)
		# leaf tufts at each vertex
		for v in pv:
			var vv: Vector2 = v
			draw_circle(vv, 18, BUSH_COLOR_FG)
		# darker outline
		for i in range(pv.size()):
			var a2: Vector2 = pv[i]
			var b2: Vector2 = pv[(i + 1) % pv.size()]
			draw_line(a2, b2, Color(0.02, 0.10, 0.05), 3.0)
		# extra leaf clumps along edges
		for i in range(pv.size()):
			var a3: Vector2 = pv[i]
			var b3: Vector2 = pv[(i + 1) % pv.size()]
			var mid: Vector2 = (a3 + b3) * 0.5
			draw_circle(mid, 12, BUSH_COLOR_FG)

	# Spawn markers — numbered yellow circles
	for i in range(spawns.size()):
		var sp: Vector2 = spawns[i]
		draw_circle(sp, 22, Color(0.05, 0.05, 0.1, 0.75))
		draw_circle(sp, 22, Color(0.98, 0.75, 0.14), false, 3.0)
		draw_circle(sp, 14, Color(0.98, 0.75, 0.14, 0.4))
		var fnt: Font = ThemeDB.fallback_font
		draw_string(fnt, sp + Vector2(-5, 6), str(i + 1),
			HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color(1, 1, 1))

	# In-progress polygon (color matches current tool)
	if (tool == Tool.BUSH_POLY or tool == Tool.SLOW_ZONE) and current_poly.size() > 0:
		var preview_c: Color = Color(0.30, 0.65, 0.95, 0.85) if tool == Tool.SLOW_ZONE else Color(1, 1, 0, 0.85)
		# connecting segments
		for i in range(current_poly.size() - 1):
			draw_line(current_poly[i], current_poly[i + 1], preview_c, 2.0)
		# segment from last vertex to mouse cursor
		var last: Vector2 = current_poly[current_poly.size() - 1]
		var ghost: Color = preview_c; ghost.a = 0.5
		draw_line(last, hover_pos, ghost, 2.0)
		# closing segment preview back to first vertex
		if current_poly.size() >= 2:
			var first: Vector2 = current_poly[0]
			var ghost2: Color = preview_c; ghost2.a = 0.25
			draw_line(hover_pos, first, ghost2, 1.5)
		# vertex markers
		for v in current_poly:
			var vv2: Vector2 = v
			draw_circle(vv2, 6, preview_c)
			draw_circle(vv2, 6, Color(0, 0, 0), false, 1.5)

	# Drag preview (works for wall + barrel)
	if dragging and (tool == Tool.WALL or tool == Tool.BARREL):
		var end_pt: Vector2 = _snap(hover_pos)
		var prev: Rect2 = Rect2(
			min(drag_start.x, end_pt.x),
			min(drag_start.y, end_pt.y),
			abs(end_pt.x - drag_start.x),
			abs(end_pt.y - drag_start.y))
		var pc: Color = Color(0.95, 0.55, 0.15, 0.45) if tool == Tool.BARREL else Color(1, 1, 0, 0.35)
		var pc2: Color = Color(0.95, 0.55, 0.15, 0.95) if tool == Tool.BARREL else Color(1, 1, 0, 0.9)
		draw_rect(prev, pc)
		draw_rect(prev, pc2, false, 2.0)

	# Bush (circle) cursor preview
	if tool == Tool.BUSH_CIRCLE and _inside_arena(hover_pos):
		draw_arc(hover_pos, brush_r, 0.0, TAU, 48, Color(1, 1, 0, 0.7), 2.0)
	# Spawn placement preview
	if tool == Tool.SPAWN and _inside_arena(hover_pos):
		draw_arc(hover_pos, 22, 0.0, TAU, 32, Color(0.98, 0.75, 0.14, 0.7), 2.0)

	# Border around the arena (where the game spawns players)
	draw_rect(Rect2(0, 0, W, H), Color(0.95, 0.75, 0.15, 0.7), false, 3.0)

	# HUD overlay (toolbar bar)
	_draw_hud()


func _draw_hud() -> void:
	var font: Font = ThemeDB.fallback_font
	var fsize: int = 14
	var bar_h: int = 36
	draw_rect(Rect2(0, H - bar_h, W, bar_h), Color(0, 0, 0, 0.72))
	var tool_names: Array[String] = ["WALL", "BUSH○", "BUSH⬡", "SLOW", "SPAWN", "BARREL", "ERASE"]
	var tool_name: String = tool_names[tool]
	var poly_hint: String = ""
	if tool == Tool.BUSH_POLY or tool == Tool.SLOW_ZONE:
		poly_hint = "  WIP:%d pts (Enter close · Esc cancel)" % current_poly.size()
	var hint: String = "[1]Wall [2]B○ [3]B⬡ [4]Slow [5]Spawn [6]Barrel [7]Erase  |  [B][C][E][L]  r=%d" % brush_r
	draw_string(font, Vector2(12, H - 12), " ● %s  |  W:%d  Bar:%d  B○:%d  B⬡:%d  Slow:%d  Sp:%d%s   |   %s" %
		[tool_name, walls.size(), destructibles.size(), bushes.size(), polys.size(), slow_zones.size(), spawns.size(), poly_hint, hint],
		HORIZONTAL_ALIGNMENT_LEFT, -1, fsize, Color(0.95, 0.95, 0.95))

	# Toast
	if Time.get_unix_time_from_system() < status_msg_until:
		var s: String = status_msg
		var sw: float = font.get_string_size(s, HORIZONTAL_ALIGNMENT_CENTER, -1, 16).x
		draw_rect(Rect2(W * 0.5 - sw * 0.5 - 14, 14, sw + 28, 30), Color(0, 0, 0, 0.85))
		draw_string(font, Vector2(W * 0.5 - sw * 0.5, 34), s,
			HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(0.99, 0.75, 0.14))


# ── Helpers ───────────────────────────────────────────────
func _snap(p: Vector2) -> Vector2:
	return Vector2(round(p.x / GRID) * GRID, round(p.y / GRID) * GRID)


func _inside_arena(p: Vector2) -> bool:
	return p.x >= 0 and p.y >= 0 and p.x <= W and p.y <= H - 36   # leave room for HUD


func _erase_at(p: Vector2) -> void:
	# Spawns first (small targets, want priority)
	for i in range(spawns.size() - 1, -1, -1):
		var s: Vector2 = spawns[i]
		if s.distance_to(p) < 22:
			spawns.remove_at(i); _flash("Spawn removed"); return
	for i in range(walls.size() - 1, -1, -1):
		var r: Rect2 = walls[i]
		if r.has_point(p):
			walls.remove_at(i); _flash("Wall removed"); return
	for i in range(destructibles.size() - 1, -1, -1):
		var rd: Rect2 = destructibles[i]
		if rd.has_point(p):
			destructibles.remove_at(i); _flash("Barrel wall removed"); return
	for i in range(bushes.size() - 1, -1, -1):
		var b: Vector3 = bushes[i]
		if Vector2(b.x, b.y).distance_to(p) < b.z:
			bushes.remove_at(i); _flash("Bush removed"); return
	for i in range(polys.size() - 1, -1, -1):
		var poly: PackedVector2Array = polys[i]
		if Geometry2D.is_point_in_polygon(p, poly):
			polys.remove_at(i); _flash("Polygon bush removed"); return
	for i in range(slow_zones.size() - 1, -1, -1):
		var sz: PackedVector2Array = slow_zones[i]
		if Geometry2D.is_point_in_polygon(p, sz):
			slow_zones.remove_at(i); _flash("Slow zone removed"); return


func _set_tool(t: int, label: String) -> void:
	tool = t
	_flash(label)


func _flash(msg: String) -> void:
	status_msg = msg
	status_msg_until = Time.get_unix_time_from_system() + 1.6
	queue_redraw()


func _add_border_walls() -> void:
	# Match the game's outer borders: 20px thick on all 4 sides
	walls.append(Rect2(0, 0, W, 20))
	walls.append(Rect2(0, H - 20, W, 20))
	walls.append(Rect2(0, 0, 20, H))
	walls.append(Rect2(W - 20, 0, 20, H))


# ── Export / load ─────────────────────────────────────────
func _export_json() -> void:
	var walls_out: Array = []
	var bushes_out: Array = []
	for r in walls:
		walls_out.append({
			"x": int(r.position.x), "y": int(r.position.y),
			"w": int(r.size.x),     "h": int(r.size.y),
		})
	for b in bushes:
		bushes_out.append({
			"x": int(b.x), "y": int(b.y), "r": int(b.z),
		})
	for poly in polys:
		var pv: PackedVector2Array = poly
		var pts: Array = []
		for v in pv:
			var vv: Vector2 = v
			pts.append([int(vv.x), int(vv.y)])
		bushes_out.append({"points": pts})

	var destructibles_out: Array = []
	for r in destructibles:
		destructibles_out.append({
			"x": int(r.position.x), "y": int(r.position.y),
			"w": int(r.size.x),     "h": int(r.size.y),
			"hp": 60,
		})
	var slow_zones_out: Array = []
	for sz in slow_zones:
		var sv: PackedVector2Array = sz
		var spts: Array = []
		for v in sv:
			var vv2: Vector2 = v
			spts.append([int(vv2.x), int(vv2.y)])
		slow_zones_out.append({"points": spts, "speed": 0.5})
	var spawns_out: Array = []
	for s in spawns:
		spawns_out.append({"x": int(s.x), "y": int(s.y)})

	var data: Dictionary = {
		"name": "custom-map",
		"w": W,
		"h": H,
		"walls": walls_out,
		"destructibles": destructibles_out,
		"bushes": bushes_out,
		"slowZones": slow_zones_out,
		"spawns": spawns_out,
	}

	var path: String = "user://map.json"
	var f: FileAccess = FileAccess.open(path, FileAccess.WRITE)
	if f == null:
		_flash("ERROR: could not write file")
		return
	f.store_string(JSON.stringify(data, "  "))
	f.close()
	var abs_path: String = ProjectSettings.globalize_path(path)
	print("[Hero Brawl Map] Exported to: ", abs_path)
	_flash("Exported → %s" % abs_path)


func _load_json() -> void:
	var path: String = "user://map.json"
	if not FileAccess.file_exists(path):
		_flash("No map.json found in user data folder")
		return
	var f: FileAccess = FileAccess.open(path, FileAccess.READ)
	var txt: String = f.get_as_text()
	f.close()
	var parsed: Variant = JSON.parse_string(txt)
	if parsed == null or not (parsed is Dictionary):
		_flash("Invalid JSON")
		return
	var dict: Dictionary = parsed
	walls.clear(); destructibles.clear(); bushes.clear(); polys.clear()
	slow_zones.clear(); spawns.clear(); current_poly = PackedVector2Array()
	var ws: Array = dict.get("walls", [])
	var bs: Array = dict.get("bushes", [])
	var ds: Array = dict.get("destructibles", [])
	var zs: Array = dict.get("slowZones", [])
	var sps: Array = dict.get("spawns", [])
	for w in ws:
		var wd: Dictionary = w
		walls.append(Rect2(float(wd.get("x", 0)), float(wd.get("y", 0)),
			float(wd.get("w", 0)), float(wd.get("h", 0))))
	for d in ds:
		var dd: Dictionary = d
		destructibles.append(Rect2(float(dd.get("x", 0)), float(dd.get("y", 0)),
			float(dd.get("w", 0)), float(dd.get("h", 0))))
	for b in bs:
		var bd: Dictionary = b
		if bd.has("points"):
			var pts: Array = bd.get("points", [])
			var pv: PackedVector2Array = PackedVector2Array()
			for pt in pts:
				var ptarr: Array = pt
				pv.append(Vector2(float(ptarr[0]), float(ptarr[1])))
			polys.append(pv)
		else:
			bushes.append(Vector3(float(bd.get("x", 0)), float(bd.get("y", 0)), float(bd.get("r", 0))))
	for z in zs:
		var zd: Dictionary = z
		var zpts: Array = zd.get("points", [])
		var zv: PackedVector2Array = PackedVector2Array()
		for pt in zpts:
			var pa: Array = pt
			zv.append(Vector2(float(pa[0]), float(pa[1])))
		slow_zones.append(zv)
	for sp in sps:
		var sd: Dictionary = sp
		spawns.append(Vector2(float(sd.get("x", 0)), float(sd.get("y", 0))))
	_flash("Loaded W:%d Bar:%d B○:%d B⬡:%d Slow:%d Sp:%d" %
		[walls.size(), destructibles.size(), bushes.size(), polys.size(), slow_zones.size(), spawns.size()])

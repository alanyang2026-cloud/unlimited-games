"""
Hero Brawl — Batch-render 5 Quaternius characters as 2.5D Brawl Stars-style
PNG sprites. v2 — uses direct bpy.data API instead of bpy.ops so the camera
actually gets bound to the scene in script context.

How to run:
  1. Blender → top tabs → 脚本 (Scripting)
  2. Middle editor → 文本 → 打开 → select this file
  3. Click ▶ Run Script  (or hover the editor and press Alt+P)
  4. Wait ~30s — output appears in /public/games/heroes/
"""

import bpy
import os
import math
from mathutils import Vector

# ── Config ─────────────────────────────────────────────────
BLEND_DIR = "/Users/alanyang/Desktop/game/blender-assets/quaternius/Blends"
OUT_DIR   = "/Users/alanyang/Desktop/game/public/games/heroes"

RENDERS = [
    ("Pirate_Female.blend", "jolly"),
    ("Viking_Male.blend",   "bjorn"),
    ("Wizard.blend",        "hex"),
    ("Ninja_Female.blend",  "kage"),
    ("Cowboy_Female.blend", "ace"),
]

CAM_LOC      = (0.0, -5.0, 1.3)   # lower to centre the body in frame
CAM_PITCH    = 90.0               # horizontal — looks straight along +Y
ORTHO_SCALE  = 4.5                # wider view so head + feet both fit
RES_X = 512
RES_Y = 768


# ── Direct data-API helpers (script-context safe) ──────────
def add_camera(scene):
    # Manual rotation — to_track_quat with up='Y' gave a degenerate
    # solution (Z=-180° flip) when the look direction was along -Y.
    # Hardcoding the pitch is safer.
    cam_data = bpy.data.cameras.new(name="HeroCam")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = ORTHO_SCALE
    cam_obj = bpy.data.objects.new(name="HeroCam", object_data=cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location = CAM_LOC
    # X-rotation 90° = look along +Y. Add CAM_PITCH past 90° to tilt down.
    cam_obj.rotation_euler = (math.radians(CAM_PITCH), 0.0, 0.0)
    scene.camera = cam_obj
    return cam_obj


def add_sun(scene, name, loc, rot_deg, energy, color):
    light_data = bpy.data.lights.new(name=name, type='SUN')
    light_data.energy = energy
    light_data.color = color
    light_obj = bpy.data.objects.new(name=name, object_data=light_data)
    scene.collection.objects.link(light_obj)
    light_obj.location = loc
    light_obj.rotation_euler = tuple(math.radians(a) for a in rot_deg)
    return light_obj


def cleanup_lighting(scene):
    """Remove the .blend's bundled cameras and lights so ours take over."""
    for o in list(scene.objects):
        if o.type in {'CAMERA', 'LIGHT'}:
            bpy.data.objects.remove(o, do_unlink=True)


def ensure_facing(scene):
    """No rotation — let Quaternius characters face their default
    direction. The previous 180° was clearly making them turn AWAY."""
    pass


def face_camera(scene):
    """Quaternius rigs face +Y by default — our camera is at -Y, so we'd
    be looking at the back of the head. Rotate every root object 180° on
    Z so the character turns to face the camera."""
    for o in scene.objects:
        if o.type in {'ARMATURE', 'MESH', 'EMPTY'} and o.parent is None:
            o.rotation_euler[2] = math.radians(180)


def setup_render(scene):
    # 5.x exposes EEVEE under the 'BLENDER_EEVEE' bl_idname even though
    # the visible name is "Eevee Next". Older builds keep the same name.
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = RES_X
    scene.render.resolution_y = RES_Y
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'


# ── Per-character pipeline ─────────────────────────────────
def render_one(blend_file, output_name):
    blend_path = os.path.join(BLEND_DIR, blend_file)
    if not os.path.exists(blend_path):
        print(f"  [SKIP] missing: {blend_path}")
        return False

    print(f"\n=== {output_name.upper()} ({blend_file}) ===")
    bpy.ops.wm.open_mainfile(filepath=blend_path)

    scene = bpy.context.scene
    cleanup_lighting(scene)
    ensure_facing(scene)             # flip character + clear animation lock

    add_camera(scene)
    add_sun(scene, "Key",  ( 3.0, -2.0, 6.0), ( 45.0, 30.0, 20.0), 4.0, (1.00, 0.97, 0.92))
    add_sun(scene, "Fill", (-3.0, -1.0, 4.0), (-25.0, 45.0,  0.0), 1.6, (0.72, 0.82, 1.00))
    add_sun(scene, "Rim",  ( 0.0,  4.0, 3.0), (110.0,  0.0,  0.0), 2.0, (1.00, 0.85, 0.70))

    setup_render(scene)

    # Sanity print BEFORE rendering — easier to diagnose if something's off
    print(f"  Engine : {scene.render.engine}")
    if scene.camera:
        loc = [round(x, 2) for x in scene.camera.location]
        rot = [round(math.degrees(x), 1) for x in scene.camera.rotation_euler]
        print(f"  Camera : {scene.camera.name}  loc={loc}  rot_deg={rot}")
    else:
        print(f"  Camera : NONE — render will fail!")
    print(f"  Lights : {sum(1 for o in scene.objects if o.type == 'LIGHT')}")
    # Print position of armature/mesh to see where the character actually is
    for o in scene.objects:
        if o.type == 'ARMATURE':
            arm_loc = [round(x, 2) for x in o.location]
            arm_rot = [round(math.degrees(x), 1) for x in o.rotation_euler]
            print(f"  Armat. : {o.name}  loc={arm_loc}  rot_deg={arm_rot}")
    meshes = [o.name for o in scene.objects if o.type == 'MESH']
    print(f"  Meshes : {meshes}")

    output_path = os.path.join(OUT_DIR, f"{output_name}.png")
    scene.render.filepath = output_path

    bpy.ops.render.render(write_still=True)

    if os.path.exists(output_path):
        size_kb = os.path.getsize(output_path) // 1024
        print(f"  ✅ {output_name}.png ({size_kb} KB)")
        return True
    print(f"  ❌ {output_name}.png NOT written")
    return False


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"Output folder: {OUT_DIR}")
    print(f"Blend  folder: {BLEND_DIR}")

    ok = 0
    for blend_file, output_name in RENDERS:
        try:
            if render_one(blend_file, output_name):
                ok += 1
        except Exception as e:
            print(f"  ❌ {output_name}: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

    print(f"\n========== DONE: {ok}/{len(RENDERS)} rendered ==========")


main()

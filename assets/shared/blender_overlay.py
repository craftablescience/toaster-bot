import argparse
import bpy
import sys

# Get arguments
parser = argparse.ArgumentParser()
parser.add_argument("--overlay-path", type=str)
parser.add_argument("--output-path",  type=str)
parser.add_argument("--jpeg-quality", type=int)
args, _ = parser.parse_known_args(sys.argv[sys.argv.index("--") + 1:])

# Replace image
for material in bpy.data.materials:
    if material.name == "computer":
        for node in material.node_tree.nodes:
            if node.type == 'TEX_IMAGE':
                node.image = bpy.data.images.load(args.overlay_path)
bpy.context.view_layer.update()

# Render
bpy.context.scene.render.image_settings.quality = args.jpeg_quality
bpy.ops.render.render()
bpy.data.images["Render Result"].save_render(filepath=args.output_path, scene=bpy.context.scene)

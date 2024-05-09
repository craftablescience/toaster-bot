import argparse
import bpy
import sys

# Get arguments
parser = argparse.ArgumentParser()
parser.add_argument("--overlay-path", type=str)
parser.add_argument("--output-path", type=str)
args, _ = parser.parse_known_args(sys.argv[sys.argv.index("--") + 1:])

# Replace image
for material in bpy.data.materials:
    if material.name == "computer":
        for node in material.node_tree.nodes:
            if node.type == 'TEX_IMAGE':
                node.image = bpy.data.images.load(args.overlay_path)
bpy.context.view_layer.update()

# Render
bpy.ops.render.render()
bpy.data.images["Render Result"].save_render(args.output_path)

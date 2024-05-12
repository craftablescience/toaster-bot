import { createCanvas, loadImage } from 'canvas';
import { execSync } from 'child_process';
import { AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js';
import fs from 'fs';
import fetch from 'node-fetch';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

import * as config from '../../config.json';

export async function performBlenderOverlay(interaction: ChatInputCommandInteraction, assetFolder: string) {
	const overlay = interaction.options.getAttachment('overlay', true);
	if (!overlay.contentType || !overlay.contentType.startsWith('image')) {
		return interaction.reply({ content: 'File attached for `overlay` does not appear to be an image!', ephemeral: true });
	}

	const overlayResponse = await fetch(overlay.url);
	if (!overlayResponse.body) {
		return interaction.reply({ content: 'Unable to download attachment.', ephemeral: true });
	}

	await interaction.deferReply({ ephemeral: interaction.options.getBoolean('ephemeral') ?? false });

	const overlayPathBase = `${os.tmpdir()}/${uuidv4()}`.replaceAll('-', '');
	const overlayPath = `${overlayPathBase}.${overlay.name.split('.').pop()}`;
	const outputPath = overlayPathBase + '_output.jpg';

	fs.writeFileSync(overlayPath, await overlayResponse.buffer());

	const jpegQuality = interaction.options.getInteger('jpeg_quality') ?? 30;

	try {
		const command = config.commands.blender_base_command
			.replace('{BLEND_FILE}', `./assets/${assetFolder}/render.blend`)
			.replace('{PYTHON_SCRIPT_FILE}', './assets/shared/blender_overlay.py')
			.replace('{OVERLAY_PATH}', `"${overlayPath}"`)
			.replace('{OUTPUT_PATH}', `"${outputPath}"`)
			.replace('{JPEG_QUALITY}', `"${jpegQuality}"`);
		execSync(command);
	} catch (err) {
		return interaction.editReply(`Encountered Blender error: ${err}`);
	}

	const drawableImageBase = await loadImage(`./assets/${assetFolder}/base.png`);
	const drawableImageMask = await loadImage(`./assets/${assetFolder}/mask.png`);
	const drawableImageOverlay = await loadImage(outputPath);

	const overlayCanvas = createCanvas(drawableImageBase.width, drawableImageBase.height);
	const overlayCtx = overlayCanvas.getContext('2d');

	overlayCtx.drawImage(drawableImageMask, 0, 0, overlayCanvas.width, overlayCanvas.height);
	overlayCtx.globalCompositeOperation = 'source-in';
	overlayCtx.drawImage(drawableImageOverlay, 0, 0, overlayCanvas.width, overlayCanvas.height);

	const canvas = createCanvas(drawableImageBase.width, drawableImageBase.height);
	const ctx = canvas.getContext('2d');

	ctx.drawImage(drawableImageBase, 0, 0, canvas.width, canvas.height);
	ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);

	fs.rmSync(overlayPath);
	fs.rmSync(outputPath);

	const attachment = new AttachmentBuilder(canvas.createPNGStream())
		.setName(`${assetFolder}.png`);
	return interaction.editReply({ files: [attachment] });
}

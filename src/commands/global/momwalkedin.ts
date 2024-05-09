// noinspection JSUnusedGlobalSymbols

import { createCanvas, loadImage } from 'canvas';
import { execSync } from 'child_process';
import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import fetch from 'node-fetch';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Command } from '../../types/interaction';

const MomWalkedIn: Command = {
	data: new SlashCommandBuilder()
		.setName('momwalkedin')
		.setDescription('mfw')
		.addAttachmentOption(option => option
			.setName('overlay')
			.setDescription('The image to overlay on top of the base image')
			.setRequired(true))
		.addBooleanOption(option => option
			.setName('ephemeral')
			.setDescription('Make the response invisible to everyone but you (default: false)')),

	async execute(interaction: ChatInputCommandInteraction) {
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

		try {
			execSync(`blender -b "./assets/momwalkedin/render.blend" -P "./assets/momwalkedin/render.py" -- --cycles-device CPU --overlay-path "${overlayPath}" --output-path "${outputPath}"`);
		} catch (err) {
			return interaction.editReply(`Encountered Blender error: ${err}`);
		}

		const drawableImageBase = await loadImage('./assets/momwalkedin/base.png');
		const drawableImageMask = await loadImage('./assets/momwalkedin/mask.png');
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
			.setName('momwalkedin.png');
		return interaction.editReply({ files: [attachment] });
	}
};
export default MomWalkedIn;

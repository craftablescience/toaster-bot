// noinspection JSUnusedGlobalSymbols

import { createCanvas, loadImage } from 'canvas';
import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';

const Overlay: Command = {
	data: new SlashCommandBuilder()
		.setName('overlay')
		.setDescription('Overlay a given image over the base image.')
		.addAttachmentOption(option => option
			.setName('base')
			.setDescription('The base image')
			.setRequired(true))
		.addAttachmentOption(option => option
			.setName('overlay')
			.setDescription('The image to overlay on top of the base image')
			.setRequired(true))
		.addNumberOption(option => option
			.setName('opacity')
			.setDescription('The opacity of the overlay image, from 0-100 (default 30)')
			.setMinValue(0)
			.setMaxValue(100))
		.addBooleanOption(option => option
			.setName('ephemeral')
			.setDescription('Make the response invisible to everyone but you (default: false)')),

	async execute(interaction: ChatInputCommandInteraction) {
		const base = interaction.options.getAttachment('base', true);
		const overlay = interaction.options.getAttachment('overlay', true);

		if (!base.contentType || !base.contentType.startsWith('image')) {
			return interaction.reply({ content: 'File attached for `base` does not appear to be an image!', ephemeral: true });
		}
		if (!overlay.contentType || !overlay.contentType.startsWith('image')) {
			return interaction.reply({ content: 'File attached for `overlay` does not appear to be an image!', ephemeral: true });
		}

		const baseResponse = await fetch(base.url);
		if (!baseResponse.body) {
			return interaction.reply({ content: 'Unable to download attachment.', ephemeral: true });
		}
		const overlayResponse = await fetch(overlay.url);
		if (!overlayResponse.body) {
			return interaction.reply({ content: 'Unable to download attachment.', ephemeral: true });
		}

		await interaction.deferReply({ ephemeral: interaction.options.getBoolean('ephemeral') ?? false });

		const baseBuf = Buffer.from(await baseResponse.arrayBuffer());
		const drawableImageBase = await loadImage(baseBuf);
		const overlayBuf = Buffer.from(await overlayResponse.arrayBuffer());
		const drawableImageOverlay = await loadImage(overlayBuf);

		const canvas = createCanvas(drawableImageBase.width, drawableImageBase.height);
		const ctx = canvas.getContext('2d');

		ctx.drawImage(drawableImageBase, 0, 0);
		ctx.globalAlpha = (interaction.options.getNumber('opacity') ?? 30) / 100;
		ctx.drawImage(drawableImageOverlay, 0, 0, canvas.width, canvas.height);

		let baseName = 'image';
		if (base.name) {
			baseName = base.name.slice(0, base.name.lastIndexOf('.'));
		}
		const attachment = new AttachmentBuilder(canvas.createPNGStream())
			.setName(`${baseName}_plus_overlay.png`);
		return interaction.editReply({ files: [attachment] });
	}
};
export default Overlay;

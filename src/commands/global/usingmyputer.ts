// noinspection JSUnusedGlobalSymbols

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { performBlenderOverlay } from '../shared/blender_overlay';
import { Command } from '../../types/interaction';

const UsingMyPuter: Command = {
	data: new SlashCommandBuilder()
		.setName('usingmyputer')
		.setDescription('This looks like me when I was 10!')
		.addAttachmentOption(option => option
			.setName('overlay')
			.setDescription('The image to overlay on top of the base image')
			.setRequired(true))
		.addIntegerOption(option => option
			.setName('jpeg_quality')
			.setDescription('The quality of the image to overlay on top of the base image (default: 30)')
			.setMinValue(5)
			.setMaxValue(100))
		.addBooleanOption(option => option
			.setName('ephemeral')
			.setDescription('Make the response invisible to everyone but you (default: false)')),

	async execute(interaction: ChatInputCommandInteraction) {
		return performBlenderOverlay(interaction, 'usingmyputer');
	}
};
export default UsingMyPuter;

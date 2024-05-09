// noinspection JSUnusedGlobalSymbols,ES6ConvertRequireIntoImport

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJSON: { version: number, dependencies: { 'discord.js': string } } = require('../../../package.json');

const Info: Command = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Responds with information about the bot.'),

	async execute(interaction: ChatInputCommandInteraction) {
		const username = interaction.client.user.displayName;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: username,
				url: 'https://github.com/StrataSource/p2ce-discord-bot',
				iconURL: interaction.client.user?.displayAvatarURL(),
			})
			.setDescription('Will destroy the world one day. Once it can move.')
			.setColor('DarkGrey')
			.addFields(
				{ name: 'Version', value: `${packageJSON.version}`, inline: true },
				{ name: 'Discord.JS', value: packageJSON.dependencies['discord.js'].substring(1), inline: true },
				{ name: 'Node.JS', value: process.versions.node, inline: true },
				{ name: 'Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
				{ name: 'Uptime', value: `${(interaction.client.uptime / 1000 / 60 / 60).toFixed(3)} hours`, inline: true },
				{ name: 'Servers', value: `${(await interaction.client.guilds.fetch()).size}`, inline: true })
			.setTimestamp();

		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
};
export default Info;

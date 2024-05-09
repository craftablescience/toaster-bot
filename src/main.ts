// noinspection JSIgnoredPromiseFromCall

import fs from 'fs';
import { Collection, IntentsBitField } from 'discord.js';
import { ToasterClient } from './types/client';
import { Command } from './types/interaction';
import { updateCommands } from './utils/update_commands';
import { formatUserRaw } from './utils/utils';

import * as config from './config.json';

// Make console output better
import consoleStamp from 'console-stamp';
consoleStamp(console);

async function main() {
	// You need a token, duh
	if (!config.token) {
		console.log('Error: no token found in config.json!');
		return;
	}

	const date = new Date();
	console.log(`--- BOT START AT ${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ---`);

	// Create client
	const client = new ToasterClient({
		intents: new IntentsBitField([
			IntentsBitField.Flags.Guilds,
		]),
	});

	// Register commands
	client.commands = new Collection();
	for (const file of fs.readdirSync('./build/commands/global').filter(file => file.endsWith('.js'))) {
		const command: Command = (await import(`./commands/global/${file}`)).default;
		client.commands.set(command.data.name, command);
	}

	// Run this when the client is ready
	client.on('ready', async () => {
		if (!client.user) {
			console.log('Client user is missing? Very strange, investigate!');
			return;
		}
		console.log(`Logged in as ${client.user.tag}`);
	});

	// Listen for errors
	client.on('error', async error => {
		console.error(error);
	});

	// Listen for warnings
	client.on('warn', async warn => {
		console.error(warn);
	});

	// Listen for commands
	client.on('interactionCreate', async interaction => {
		if (interaction.isChatInputCommand()) {
			const command = client.commands?.get(interaction.commandName);
			if (!command) return;

			console.log(`Command "${interaction.commandName}" ran by ${formatUserRaw(interaction.user)} (${interaction.user.id})`);

			try {
				await command.execute(interaction);
			} catch (err) {
				console.error(err);
				if (interaction.deferred) {
					await interaction.followUp(`There was an error while executing this command: ${err}`);
				} else {
					await interaction.reply(`There was an error while executing this command: ${err}`);
				}
				return;
			}
		}
	});

	// Log in
	await client.login(config.token);

	async function shutdown() {
		const date = new Date();
		console.log(`--- BOT END AT ${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ---`);
		await client.destroy();
		process.exit();
	}

	process.on('SIGINT', shutdown);
}

if (process.argv.includes('--update-commands')) {
	updateCommands();
} else {
	main();
}

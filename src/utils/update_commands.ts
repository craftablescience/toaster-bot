import { Client } from 'discord.js';
import fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

import * as config from '../config.json';

export async function updateCommands() {
	// You need a token, duh
	if (!config.token) {
		console.log('Error updating commands: no token found in config.json!');
		return;
	}

	const dateStart = new Date();
	console.log(`--- UPDATE COMMANDS START AT ${dateStart.toDateString()} ${dateStart.getHours()}:${dateStart.getMinutes()}:${dateStart.getSeconds()} ---`);

	const client = new Client({
		intents: [],
	});
	await client.login(config.token);

	const globalCommands = [];
	for (const file of fs.readdirSync('./build/commands/global').filter(file => file.endsWith('.js'))) {
		globalCommands.push((await import(`../commands/global/${file}`)).default);
	}
	// todo: rewrite when user commands release
	for (const command of globalCommands) {
		command.data['contexts'] = [0, 1, 2]; // Guild, Bot DM, private channel
		command.data['integration_types'] = [1]; // User install
	}

	// Register global commands
	const rest = new REST().setToken(config.token);
	await rest.put(Routes.applicationCommands(config.client_id), { body: globalCommands.map(cmd => cmd.data.toJSON()) });
	console.log(`Registered ${globalCommands.length} global commands`);

	const dateEnd = new Date();
	console.log(`--- UPDATE COMMANDS END AT ${dateEnd.toDateString()} ${dateEnd.getHours()}:${dateEnd.getMinutes()}:${dateEnd.getSeconds()} ---`);
	await client.destroy();
}

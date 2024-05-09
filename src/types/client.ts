import { Client, ClientOptions, Collection } from 'discord.js';
import { CommandBase } from './interaction';

export class ToasterClient extends Client {
	commands: Collection<string, CommandBase>;

	constructor(options: ClientOptions) {
		super(options);
		this.commands = new Collection<string, CommandBase>();
	}
}

import { ChatInputCommandInteraction, InteractionResponse, Message, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

export interface CommandBase {
	data: unknown,
	execute(interaction: ChatInputCommandInteraction): Promise<void | InteractionResponse<boolean> | Message<boolean>>,
}

export interface Command extends CommandBase {
	data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder,
}

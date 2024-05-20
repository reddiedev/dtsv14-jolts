import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

const command: SlashCommand = {
    command: new SlashCommandBuilder().setName("purge").setDescription("purge messages from this channel | admin-only"),
    execute: async (interaction) => {
        await interaction.reply({ content: "pong!" });
    }
};

export default command;

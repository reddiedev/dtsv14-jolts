import { EmbedBuilder, SlashCommandBuilder, inlineCode } from "discord.js";
import { SlashCommand } from "../types";
import fs from "fs";
import path from "path";

const command: SlashCommand = {
    command: new SlashCommandBuilder().setName("help").setDescription("view bot commands"),
    execute: async (interaction) => {
        const commandsPath = __dirname;
        const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(`.js`));

        const embed = new EmbedBuilder()
            .setTitle(`Help`)
            .setDescription(`this is a list of all of this bot's slash commands`)
            .setColor(`Random`);
        const fields = [];

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const command: SlashCommand = require(filePath).default;
            fields.push({
                name: inlineCode(`/` + command.command.name.toString()),
                value: command.command.description.toString(),
                inline: false
            });
        }
        embed.addFields(fields);
        await interaction.reply({ embeds: [embed] });
    }
};

export default command;

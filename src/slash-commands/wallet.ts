import { EmbedBuilder, GuildMember, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import findMultiplier from "../functions/findMultiplier";
import getPercent from "../utils/getPercent";
import processAutoroles from "../functions/processAutoroles";

const command: SlashCommand = {
    command: new SlashCommandBuilder().setName("wallet").setDescription("view your jolts wallet!"),
    execute: async (interaction) => {
        await interaction.deferReply();

        const discordID = interaction.user.id;
        const discordTag = interaction.user.tag;

        const id = 1;
        const prisma = interaction.client.prisma;
        const setting = await prisma.setting.upsert({
            where: {
                id
            },
            create: {
                id
            },
            update: {}
        });

        let player = await prisma.player.upsert({
            where: { discordID },
            create: { discordID, discordTag },
            update: { discordTag },
            include: { autoroles: { include: { autorole: true } } }
        });

        const member = interaction.member as GuildMember;
        await processAutoroles(member, prisma);

        player = await prisma.player.upsert({
            where: { discordID },
            create: { discordID, discordTag },
            update: { discordTag },
            include: { autoroles: { include: { autorole: true } } }
        });

        const autoroles = player.autoroles.map((i) => i.autorole);
        const multiplier = await findMultiplier(autoroles);

        const embed = new EmbedBuilder()
            .setColor("Random")
            .setThumbnail(interaction.guild!.iconURL())
            .addFields(
                {
                    name: `${setting.joltsEmoji} Jolts Balance`,
                    value: `\`${player.coins}\` ${setting.joltsEmoji}`,
                    inline: true
                },
                {
                    name: `🛡️ Burn Protection`,
                    value: `\`${getPercent(multiplier * 100, "%")}\``,
                    inline: true
                }
            )
            .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() });

        await interaction.editReply({ embeds: [embed] });
    }
};

export default command;

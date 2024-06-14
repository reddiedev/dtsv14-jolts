import { EmbedBuilder, GuildMember, SlashCommandBuilder, userMention } from "discord.js";
import { SlashCommand } from "../types";
import { chunk } from "lodash";
import paginateLeaderboard from "../utils/paginateLeaderboard";

const command: SlashCommand = {
    command: new SlashCommandBuilder().setName("leaderboard").setDescription("view player leaderboard!"),
    execute: async (interaction) => {
        await interaction.deferReply();

        const id = 1;
        const setting = await interaction.client.prisma.setting.upsert({
            where: {
                id
            },
            create: {
                id
            },
            update: {}
        });

        const users = await interaction.client.prisma.player.findMany({
            orderBy: { coins: "desc" },
            take: 100
        });

        const players = users.map((u, index) => {
            return {
                ...u,
                rank: index + 1
            };
        });

        const playersChunks = chunk(players, 10);

        const embeds = [];
        const member = interaction.member as GuildMember;
        for (const playersChunk of playersChunks) {
            let text = ``;

            for (const player of playersChunk) {
                text += `\n **${player.rank}** ${userMention(player.discordID)} \`${player.coins}\` ${
                    setting.joltsEmoji
                }`;
            }

            const embed = new EmbedBuilder()
                .setColor("Random")
                .setDescription(text)
                .setTitle(`🏆 Player Jolts Leaderboard`)
                .setAuthor({ name: interaction.guild!.name, iconURL: interaction.guild!.iconURL() as string })
                .setFooter({
                    text: `requested by @${member.displayName}`,
                    iconURL: member.displayAvatarURL()
                });

            embeds.push(embed);
        }

        await paginateLeaderboard(interaction, embeds);
    }
};

export default command;

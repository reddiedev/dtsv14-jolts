import { EmbedBuilder, GuildMember, SlashCommandBuilder, SlashCommandSubcommandBuilder, userMention } from "discord.js";
import { SlashCommand } from "../types";
import { chunk } from "lodash";
import paginateLeaderboard from "../utils/paginateLeaderboard";
import { Player } from "@prisma/client";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("view player leaderboard")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName(`points`)
                .setDescription(`server leaderboard according to points`)
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName(`invites`)
                .setDescription(`server leaderboard according to invites`)
        ),
    execute: async (interaction) => {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand(true);

        let users: Player[] = [];
        if (subcommand == "points") {
            users = await interaction.client.prisma.player.findMany({
                orderBy: { points: "desc" }
            });
        }

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
                text += `\n **${player.rank}** ${userMention(player.discordID)} \`${player.points}\``;
            }

            const embed = new EmbedBuilder()
                .setColor("Random")
                .setDescription(text)
                .setTitle(`🏆 Player Leaderboard`)
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

import {
    GuildMember,
    PermissionFlagsBits,
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
    userMention
} from "discord.js";
import { SlashCommand } from "../types";
import log from "../utils/log";
import processAutoroles from "../functions/processAutoroles";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("jolts")
        .setDescription("add or remove jolts to users | admin-only")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName(`add`)
                .setDescription(`add jolts to a player`)
                .addUserOption((option) => option.setName("target").setDescription("the target user").setRequired(true))
                .addNumberOption((option) =>
                    option
                        .setName("amount")
                        .setDescription("the amount of jolts to add")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName(`remove`)
                .setDescription(`remove jolts from a player`)
                .addUserOption((option) => option.setName("target").setDescription("the target user").setRequired(true))
                .addNumberOption((option) =>
                    option
                        .setName("amount")
                        .setDescription("the amount of jolts to remove")
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute: async (interaction) => {
        await interaction.deferReply();
        const prisma = interaction.client.prisma;

        const settings = await prisma.setting.upsert({
            where: {
                id: 1
            },
            create: {
                id: 1
            },
            update: {}
        });
        const member = interaction.member as GuildMember;
        const userRoles = member.roles;
        if (!userRoles.cache.has(settings.staffRoleID)) {
            await interaction.editReply({ content: `You may not access this command.` });
            setTimeout(async () => {
                await interaction.deleteReply().catch(console.error);
            }, 3 * 1000);
            return;
        }

        const subcommand = interaction.options.getSubcommand(true);
        const target = interaction.options.getUser("target", true);
        const amount = interaction.options.getNumber("amount", true);

        const id = 1;
        const setting = await prisma.setting.upsert({
            where: {
                id
            },
            create: {
                id
            },
            update: {}
        });

        const discordID = target.id;
        const discordTag = target.tag;

        let content = ``;

        if (subcommand == "add") {
            await prisma.player.upsert({
                where: { discordID },
                create: { discordID, discordTag, coins: amount },
                update: {
                    discordTag,
                    coins: { increment: amount }
                }
            });

            content = `${userMention(interaction.user.id)} added ${amount} ${setting.joltsEmoji} to ${userMention(
                discordID
            )}`;
        } else if (subcommand == "remove") {
            await prisma.player.upsert({
                where: { discordID },
                create: { discordID, discordTag, coins: -1 * amount },
                update: {
                    discordTag,
                    coins: { decrement: amount }
                }
            });

            content = `${userMention(interaction.user.id)} removed ${amount} ${setting.joltsEmoji} from ${userMention(
                discordID
            )}`;
        }

        await interaction.editReply({ content });
        await log({
            title: subcommand == "add" ? "Jolts Added" : "Jolts Removed",
            color: subcommand == "add" ? "Green" : "Red",
            content
        });

        const targetMember = await interaction.guild!.members.fetch(discordID);
        await processAutoroles(targetMember, prisma);
    }
};

export default command;

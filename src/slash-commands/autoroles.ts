import {
    EmbedBuilder,
    GuildMember,
    roleMention,
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
    userMention
} from "discord.js";
import { SlashCommand } from "../types";
import log from "../utils/log";
import getPercent from "../utils/getPercent";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("autoroles")
        .setDescription("manage autoroles | staff-only")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName(`set`)
                .setDescription(`set an autorole w/ multiplier | staff-only`)
                .addRoleOption((option) => option.setName("role").setDescription("the autorole").setRequired(true))
                .addNumberOption((option) =>
                    option
                        .setName("amount")
                        .setDescription("minimum jolts amount for autorole")
                        .setRequired(true)
                        .setMinValue(0)
                )
                .addNumberOption((option) =>
                    option
                        .setName("multiplier")
                        .setDescription("deductions multiplier (0.1 = 10% off)")
                        .setRequired(true)
                        .setMinValue(0)
                )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName(`remove`)
                .setDescription(`remove an autorole | staff-only`)
                .addRoleOption((option) => option.setName("role").setDescription("the autorole").setRequired(true))
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder().setName(`list`).setDescription(`list autoroles | staff-only`)
        ),
    execute: async (interaction) => {
        await interaction.deferReply();
        const prisma = interaction.client.prisma;
        const subcommand = interaction.options.getSubcommand(true);

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

        if (subcommand == "set") {
            const role = interaction.options.getRole("role", true);
            const roleID = role.id;
            const amount = interaction.options.getNumber("amount", true);
            const multiplier = interaction.options.getNumber("multiplier", true);

            await prisma.autorole.upsert({
                where: { roleID },
                create: { roleID, amount, multiplier },
                update: { amount, multiplier }
            });

            const content = `${userMention(interaction.user.id)} updated an autorole: ${roleMention(
                roleID
            )}\nMultiplier: ${getPercent(multiplier * 100, "%")} off | Amount: ${amount}`;
            await interaction.editReply({ content });
            await log({ title: "Autorole Added", color: "Green", content });
        } else if (subcommand == "remove") {
            const role = interaction.options.getRole("role", true);
            const roleID = role.id;
            await prisma.autorole.deleteMany({ where: { roleID } });
            const content = `${userMention(interaction.user.id)} removed an autorole: ${roleMention(roleID)}`;
            await interaction.editReply({ content });
            await log({ title: "Autorole Removed", color: "Red", content });
        } else if (subcommand == "list") {
            const autoroles = await prisma.autorole.findMany();
            let text = ``;
            for (const autorole of autoroles) {
                const { roleID, multiplier, amount } = autorole;
                text += `${roleMention(roleID)}\nMultiplier: ${getPercent(
                    multiplier * 100,
                    "%"
                )} off | Amount: ${amount}\n\n`;
            }
            const embed = new EmbedBuilder()
                .setColor("Random")
                .setDescription(text)
                .setTitle("Jolts Autoroles")
                .setThumbnail(interaction.guild!.iconURL());
            await interaction.editReply({ embeds: [embed] });
        }
    }
};

export default command;

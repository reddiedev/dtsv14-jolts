import { GuildMember, SlashCommandBuilder, SlashCommandSubcommandBuilder, userMention } from "discord.js";
import { SlashCommand } from "../types";
import getPercent from "../utils/getPercent";
import log from "../utils/log";
import burn from "../functions/burn";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("bank")
        .setDescription("manage the central bank | staff-only")
        .addSubcommand(
            new SlashCommandSubcommandBuilder().setName(`burn_rate`).setDescription(`set weekly burn rate | staff-only`)
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName(`manual_burn`)
                .addNumberOption((option) =>
                    option
                        .setName("burn_rate")
                        .setDescription("burn rate (0.1 = 10% of current balance is burned)")
                        .setRequired(true)
                        .setMinValue(0)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("ignore_autoroles")
                        .setDescription("true = autorole deductions would not be taken into account")
                        .setRequired(true)
                )
                .setDescription(`execute manual burn | staff-only`)
        ),
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

        if (subcommand == "burn_rate") {
            const rate = interaction.options.getNumber("burn_rate", true);
            await prisma.setting.update({ where: { id: 1 }, data: { burn: rate } });
            const content = `${userMention(interaction.user.id)} updated the burn rate to: ${getPercent(
                rate * 100,
                "%"
            )}`;
            await interaction.editReply({ content });
            await log({ title: "Burn Rate Updated", color: "DarkRed", content });
        } else if (subcommand == "manual_burn") {
            const rate = interaction.options.getNumber("burn_rate", true);
            const ignoreAutoroles = interaction.options.getBoolean("ignore_autoroles", true);

            const content = `${userMention(interaction.user.id)} initiated a manual burn with rate: ${getPercent(
                rate * 100,
                "%"
            )} and autoroles ${ignoreAutoroles ? "ignored" : "valid"}`;
            await interaction.editReply({ content });
            await log({ title: "Manual Burn Initiated", color: "DarkGreen", content });

            await burn(rate, ignoreAutoroles, prisma);
        }
    }
};

export default command;

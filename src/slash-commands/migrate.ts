import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { chunk } from "lodash";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("migrate")
        .setDescription("bulk migrates all server members into the system | dev-only"),
    execute: async (interaction) => {
        await interaction.deferReply();
        if (interaction.user.id !== process.env.DEVELOPER_ID && interaction.user.id !== process.env.OWNER_ID) {
            await interaction.editReply({ content: `You may not access this command.` });
            setTimeout(async () => {
                await interaction.deleteReply().catch(console.error);
            }, 3 * 1000);
            return;
        }

        const prisma = interaction.client.prisma;

        const guild = interaction.guild!;
        const members = await guild.members.fetch();
        await interaction.editReply({
            content: `Migrating ${members.size} members at default values into the database`
        });

        const players = Array.from(members.values());
        const chunks = chunk(players, 10);
        let ctr = 0;
        for (const chunk of chunks) {
            ctr += 1;
            console.log(`processing ${ctr}/${chunks.length}`);
            const promises = [];
            for (const member of chunk) {
                const discordID = member.user.id;
                const discordTag = member.user.tag;
                promises.push(
                    new Promise<void>(async (resolve) => {
                        await prisma.player.upsert({
                            where: { discordID },
                            create: { discordID, discordTag },
                            update: { discordTag }
                        });
                        resolve();
                    })
                );
            }
            await Promise.allSettled(promises);
        }
        await interaction.editReply({
            content: `Done migrating ${members.size} members`
        });
    }
};

export default command;

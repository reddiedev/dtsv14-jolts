import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { Client, User } from "unb-api";
import { chunk } from "lodash";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("import")
        .setDescription("import unbelievaboat data into the database | dev-only"),
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
        const client = new Client(process.env.UNB_TOKEN);

        const guild = interaction.guild!;
        const members = await guild.members.fetch();

        await interaction.editReply({
            content: `importing ${members.size} members from unbelievaboat into the database`
        });

        const initLeaderboard = (await client.getGuildLeaderboard(process.env.GUILD_ID, {
            sort: "total",
            limit: 1000,
            page: 1
        })) as { users: User[]; totalPages: number };
        const totalPages = initLeaderboard.totalPages;

        for (let page = 1; page <= totalPages; page++) {
            console.log(`processing page ${page}/${totalPages}`);
            const leaderboard = (await client.getGuildLeaderboard(process.env.GUILD_ID, {
                sort: "total",
                limit: 1000,
                page
            })) as { users: User[]; totalPages: number };
            const chunks = chunk(leaderboard.users, 10);
            let ctr = 0;
            for (const chunk of chunks) {
                ctr += 1;
                console.log(`processing chunk: ${ctr}/${chunks.length}`);
                const promises = [];
                for (const user of chunk) {
                    const discordID = user.user_id;
                    const coins = user.total;

                    promises.push(
                        new Promise<void>(async (resolve) => {
                            await prisma.player.updateMany({
                                where: { discordID },
                                data: { coins }
                            });
                            resolve();
                        })
                    );
                }
                await Promise.allSettled(promises);
            }
        }

        await interaction.editReply({
            content: `Done importing ${members.size} members`
        });
    }
};

export default command;

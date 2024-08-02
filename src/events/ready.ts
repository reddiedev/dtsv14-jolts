import { Client, time } from "discord.js";
import { BotEvent } from "../types";
import setActivity from "../functions/setActivity";
import cron from "node-cron";
import burn from "../functions/burn";
import processRolesCheck from "../functions/processRolesCheck";
import log from "../utils/log";

const event: BotEvent = {
    name: "ready",
    once: true,
    execute: async (client: Client) => {
        console.log(`${client.chalk.green("[events/ready]:")} ready! logged in as ` + client.user!.tag);
        console.log(
            `${client.chalk.green("[events/ready]:")} currently online at ` + client.guilds.cache.size + ` servers`
        );

        await setActivity(client);

        const prisma = client.prisma;
        const guild = await client.guilds.fetch(process.env.GUILD_ID);

        cron.schedule(
            "0 8 * * 1 */2",
            async () => {
                const setting = await prisma.setting.findUnique({ where: { id: 1 } });
                if (!setting) return;
                const playerCount = await prisma.player.count();
                await log({
                    title: "Auto Burn Started",
                    color: "Green",
                    content: `Started ${setting?.joltsEmoji} jolts burning for ${playerCount} users ${time(new Date())}`
                });
                await burn(setting.burn, false, prisma);
                await log({
                    title: "Auto Burn Finished",
                    color: "Red",
                    content: `Finished ${setting?.joltsEmoji} jolts burning for ${playerCount} users ${time(
                        new Date()
                    )}`
                });
            },
            { timezone: "Etc/UTC" }
        );

        cron.schedule(
            "0 8 * * *",
            async () => {
                await processRolesCheck(guild, prisma);
            },
            { timezone: "Etc/UTC" }
        );
    }
};

export default event;

import { PrismaClient } from "@prisma/client";
import findMultiplier from "./findMultiplier";
import log from "../utils/log";
import { time } from "discord.js";

export default async function burn(burnRate: number, ignoreAutoroles: boolean = false, prisma: PrismaClient) {
    const players = await prisma.player.findMany({
        where: { coins: { gt: 0 } },
        include: { autoroles: { include: { autorole: true } } }
    });

    try {
        await log({
            title: "Burn Sequence Initiated",
            color: "Green",
            content: `Started jolts burning for  ${players.length} users ${time(new Date())}`
        });
        const promises = [];
        for (const player of players) {
            const autoroles = player.autoroles.map((i) => i.autorole);
            const multiplier = await findMultiplier(autoroles);
            const rate = ignoreAutoroles ? burnRate : (1 - multiplier) * burnRate;
            const newCoins = player.coins * (1 - rate);
            const promise = new Promise<void>(async (resolve) => {
                console.info(`Burned ${player.discordTag} from ${player.coins} to ${newCoins}`);
                await prisma.player.update({ where: { discordID: player.discordID }, data: { coins: newCoins } });
                return resolve();
            });
            promises.push(promise);
        }
        await Promise.allSettled(promises);
    } catch (err) {
        console.error(err);
        await log({ title: "Burn Error", color: "Red", content: `${JSON.stringify(err)}` });
    }

    await log({
        title: "Burn Sequence Finished",
        color: "Blue",
        content: `Finished jolts burning for  ${players.length} users ${time(new Date())}`
    });
}

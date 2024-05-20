import { PrismaClient } from "@prisma/client";
import findMultiplier from "./findMultiplier";

export default async function burn(burnRate: number, ignoreAutoroles: boolean = false, prisma: PrismaClient) {
    const players = await prisma.player.findMany({
        where: { coins: { gt: 0 } },
        include: { autoroles: { include: { autorole: true } } }
    });

    const promises = [];
    for (const player of players) {
        const autoroles = player.autoroles.map((i) => i.autorole);
        const multiplier = await findMultiplier(autoroles);
        const rate = ignoreAutoroles ? burnRate : (1 - multiplier) * burnRate;
        const newCoins = player.coins * (1 - rate);
        const promise = new Promise<void>(async (resolve) => {
            await prisma.player.update({ where: { discordID: player.discordID }, data: { coins: newCoins } });
            resolve();
        });
        promises.push(promise);
    }

    await Promise.allSettled(promises);
}

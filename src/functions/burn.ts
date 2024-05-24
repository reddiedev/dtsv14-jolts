import { PrismaClient } from "@prisma/client";
import findMultiplier from "./findMultiplier";
import log from "../utils/log";
import { time } from "discord.js";

export default async function burn(burnRate: number, ignoreAutoroles: boolean = false, prisma: PrismaClient) {
   
    const players = await prisma.player.findMany({
        where: { coins: { gt: 0 } },
        include: { autoroles: { include: { autorole: true } } }
    });

    await log({title:"Burn Initiated",color:"Green",content:`Started jolts burning for  ${players.length} users ${time(new Date())}`})

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

    await log({title:"Burn Finished",color:"Blue",content:`Finished jolts burning for  ${players.length} users ${time(new Date())}`})
}

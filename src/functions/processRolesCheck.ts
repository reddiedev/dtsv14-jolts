import { PrismaClient } from "@prisma/client";
import { Guild, time } from "discord.js";
import processAutoroles from "./processAutoroles";
import log from "../utils/log";

export default async function processRolesCheck(guild: Guild, prisma: PrismaClient) {
    const players = await prisma.player.findMany({ where: { coins: { gt: 0 } } })
    await log({title:"Roles Check Initiated",color:"Green",content:`Started running roles check for ${players.length} users ${time(new Date())}`})
    const promises = []

    for (const player of players){
        const member = await guild.members.fetch(player.discordID)
        const promise = new Promise<void>(async(resolve)=>{
            await processAutoroles(member,prisma);
            resolve()
        })
        promises.push(promise)
    }
    await Promise.allSettled(promises)
    await log({title:"Roles Check Finished",color:"Blue",content:`Finished running roles check for ${players.length} users ${time(new Date())}`})

}

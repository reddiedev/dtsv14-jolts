import { PrismaClient } from "@prisma/client";
import { GuildMember, roleMention, userMention } from "discord.js";
import log from "../utils/log";

export default async function processAutoroles(member: GuildMember, prisma: PrismaClient) {
    const roles = member.roles.cache;
    const autoroles = await prisma.autorole.findMany({ orderBy: { amount: "asc" } });
    const player = await prisma.player.findUnique({
        where: { discordID: member.id },
        include: { autoroles: true }
    });

    if (!player) return;

    for (const autorole of autoroles) {
        const isEligible = player.coins >= autorole.amount;
        const isNoted = player.autoroles.findIndex((i) => i.roleID == autorole.roleID) !== -1;

        // update user multiplier
        if (isEligible && !isNoted) {
            await prisma.playerAutorole.create({
                data: {
                    discordID: member.id,
                    roleID: autorole.roleID
                }
            });
        } else if (!isEligible && isNoted) {
            await prisma.playerAutorole.deleteMany({
                where: {
                    discordID: member.id,
                    roleID: autorole.roleID
                }
            });
        }

        // manage member roles
        if (roles.has(autorole.roleID)) {
            // check if user is still eligible
            if (!isEligible) {
                await log({title:"Autorole Lost",color:"Red",content:`${userMention(member.id)} has lost ${roleMention(autorole.roleID)}`})
                await member.roles.remove(autorole.roleID).catch(console.error);
            }
        } else {
            // check if user is eligible
            if (isEligible) {
                await log({title:"Autorole Gained",color:"Green",content:`${userMention(member.id)} has gained ${roleMention(autorole.roleID)}`})
                await member.roles.add(autorole.roleID).catch(console.error);
            }
        }
    }
}

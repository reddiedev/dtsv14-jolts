import { Autorole } from "@prisma/client";

export default async function findMultiplier(autoroles: Autorole[]) {
    if (autoroles.length == 0) return 0;

    let maxAutorole = autoroles[0];

    for (const autorole of autoroles) {
        if (autorole.multiplier > maxAutorole.multiplier) {
            maxAutorole = autorole;
        }
    }

    return maxAutorole.multiplier;
}

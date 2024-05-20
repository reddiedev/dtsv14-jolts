export default function getPercent(num: number, suffix: string): string {
    return `${Math.round(num * 100) / 100}${suffix}`;
}

# Jolts Bot
A custom economy bot with anti-inflation commands

## Requirements

### Technical Knowledge

In order to work with this bot, one needs sufficient knowledge in Javascript/ Typescript, NodeJS, Discord.js, PostgreSQL, Prisma, NPM/PNPM

### Environment

- Recommended: Ubuntu 20.04 LTS VPS
- Install Node.js v18 via NVM
- Install PM2 via PNPM
- Deploy PostgreSQL instance
- Clone this repository

### Database

1. Deploy a PostgreSQL instance

-   Use your desired postgresl hosting platform. I prefer [Railway](https://railway.app?referralCode=reddiedev) and [Digital Ocean](https://m.do.co/c/7662940d8539)

2. Save `DATABASE_URL` in the `.env`

## Setup

0. Install project dependencies:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
nvm install 18 && nvm use 18
npm install -g pnpm
pnpm setup
pnpm add -g pm2
```

1. Clone this repo on your desired working directory
```bash
git clone https://github.com/tojokely/sauceBot.git
```
2. Update the `src/config.ts` file and `.env` file with your project variables and configurations
3. Install project dependencies `pnpm install`

```bash
pnpm install
```

4. Ensure that the PostgreSQL database is running and available `pnpm run db:studio`

```bash
pnpm run db:studio
```

5. Run `pnpm run dev` to test and ensure that the bot works well

```bash
pnpm run dev
```

6. Once testing is done, run bot via docker command

```bash
pnpm run serve
pnpm run restart
```
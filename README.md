# Vault

**Vault** – Your Personal Finance Sidekick! 🚀  
Keep track of your **net worth**, **cash flow**, and **expenses** with ease. Vault is still in development, but the goal is to support **multiple currencies**, **real-time exchange rates**, **stock prices**, and **crypto tracking**. Stay tuned!

## 📌 Table of Contents

- [Getting Started](#getting-started)
- [Roadmap](#-roadmap)
- [Tech Stack](#tech-stack)
  - [Core Technologies](#core-technologies)
  - [UI & Components](#ui--components)
- [Who's Behind This?](#-whos-behind-this)
- [License](#-license)

## Getting Started

Ready to dive in? Follow these steps to get Vault up and running in no time. ⏳

### Prerequisites

Make sure you have the following installed:

- 🏗️ [Node.js](https://nodejs.org/) (Required: v22.13.1)
- 📦 [npm](https://www.npmjs.com/) (Vault uses `npm@10.9.2`)
- 🗄️ [MySQL](https://www.mysql.com/)
- 🐳 [Docker](https://www.docker.com/) (If you want to use the included DB spin up script)

### Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/oxcened/vault.git
cd vault
npm install
```

### Environment Variables

Before running the project, create a `.env` file in the root directory. You can use `.env.example` as a reference:

```sh
cp .env.example .env
```

Then, open `.env` and fill in the required secrets and configuration values.

### Authentication

Vault uses **Discord** as the authentication provider via NextAuth.js.  
To set it up, follow these steps:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a new application.
3. Under **OAuth2**, add a redirect URI matching:
   ```
   http://localhost:3000/api/auth/callback/discord
   ```
4. Copy the **Client ID** and **Client Secret** from the OAuth2 settings.
5. In your `.env` file, add the following:

   ```sh
   AUTH_DISCORD_ID=your-client-id
   AUTH_DISCORD_SECRET=your-client-secret
   ```

6. Restart the development server with:

   ```sh
   npm run dev
   ```

For more details, check out [T3 Authentication Guide](https://create.t3.gg/en/usage/first-steps#authentication).

### Database Setup

For local development, you can spin up a MySQL database in a Docker container by running:

```sh
./start-database.sh
```

Once the database is running, set up the schema with:

Run the following to set up the database schema:

```sh
npm run db:push
```

To apply migrations, use:

```sh
npm run db:migrate
```

You can also generate Prisma types:

```sh
npm run db:generate
```

### Development

Start the development server:

```sh
npm run dev
```

### Linting & Formatting

Check for linting errors:

```sh
npm run lint
```

Format code:

```sh
npm run format:write
```

### Building for Production

To build and start the production server:

```sh
npm run build
npm run start
```

Now you're ready to start using Vault!

## ✨ Roadmap

- 📊 **Net Worth Tracking** – See all your assets and liabilities in one place.
- 💰 **Cash Flow Insights** – Understand how your money moves.
- 🛍️ **Expense Tracking** – Keep an eye on where you're spending.
- 🌍 **Multi-Currency Support** – Handle different currencies with live exchange rates.
- 📈 **Stock & Crypto Tracking** – Stay updated with market prices.
- 🎨 **Slick UI** – Built with modern components for a smooth experience.

## Tech Stack

Vault is built with the **T3 Stack**, making it scalable and efficient.

### Core Technologies:

- [TypeScript](https://www.typescriptlang.org/) – Because type safety is cool.
- [Next.js](https://nextjs.org) – Full-stack framework with SSR and API routes.
- [NextAuth.js](https://next-auth.js.org) – Secure authentication and session management.
- [Prisma](https://prisma.io) – ORM for database management.
- [Tailwind CSS](https://tailwindcss.com) – Modern styling with utility classes.
- [tRPC](https://trpc.io) – Type-safe API communication.

### UI & Components:

- [Radix UI](https://www.radix-ui.com/) with [shadcn/ui](https://ui.shadcn.com) components.
- [Lucide Icons](https://lucide.dev/) for sleek and simple icons.

## 🛠 Who’s Behind This?

Built and maintained by **Alen Ajam**, a developer passionate about finance and open-source software. 🚀

- GitHub: [oxcened](https://github.com/oxcened)
- Email: [hello@alenajam.dev](mailto:hello@alenajam.dev)
- Website: [alenajam.dev](https://alenajam.dev)

## 📜 License

Vault is open-source and licensed under the [MIT License](https://opensource.org/licenses/MIT).  
Want to contribute? PRs are always welcome! 🎉

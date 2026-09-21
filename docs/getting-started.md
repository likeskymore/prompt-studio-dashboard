# Getting started

This guide explains how to install and run the PromptStudio Dashboard locally.

## Requirements

- Node.js 20 or newer
- npm
- Access to the PromptStudio API, a compatible MySQL database, or both

## Install dependencies

```bash
npm install
```

## Configure the environment

Create `.env.local` in the project root:

```dotenv
NEXT_PUBLIC_API_HOST=http://localhost:8000
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database
DB_PORT=3306
```

`NEXT_PUBLIC_API_HOST` must contain only the API base URL. Do not append `/monitoring` or `/experiments`.

## Start the dashboard

```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005).

## Production build

```bash
npm run build
npm run start
```

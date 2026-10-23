# Getting started

This guide explains how to install and run the PromptStudio Dashboard locally.

## Requirements

- Node.js 20 or newer
- npm
- **A running PromptStudio data source is required.** You must have access to the [PromptStudio API](https://github.com/likeskymore/PromptStudio/tree/main), a compatible MySQL database used by PromptStudio, or both. This dashboard does not include the API or database.

The PromptStudio Dashboard is only the monitoring interface. Set up the PromptStudio backend separately, or connect this project to the MySQL database it uses, before starting the dashboard.

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

If you are using the API, make sure the PromptStudio service is running at the configured URL. If you are using the database fallback, make sure the dashboard can reach the PromptStudio MySQL database and that the database credentials point to the correct instance.

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

# Supabase Migration Guide

This guide will help you migrate your application to a new Supabase account. Since your project uses Supabase Edge Functions (for Mux video uploading), you **must** use the Supabase CLI to deploy them to the new project.

## Prerequisites

1.  **Create a New Project**: Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
    *   Note down the **Project Reference ID** (it's the string in the URL, e.g., `gqsizmmbdsumtfgortfg`) and the **database password**.
2.  **Mux Credentials**: You will need your Mux credentials (`MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`) and a `MUX_WEBHOOK_SECRET`. If you don't have them saved, you may need to generate new ones in your [Mux Dashboard](https://dashboard.mux.com/).

## Step 1: Install & Login to Supabase CLI

Open your terminal in the project folder (`d:\daily-echo`) and run:

```bash
npm install -g supabase
```

Once installed, log in to your Supabase account:

```bash
supabase login
```
*Follow the instructions in the terminal to authenticate via your browser.*

## Step 2: Link the New Project

Link your local code to the new Supabase project using the Reference ID you noted earlier:

```bash
supabase link --project-ref <your-new-project-ref-id>
```
*You will be asked for your database password.*

## Step 3: Migrate the Database

Your project already contains migration files in `supabase/migrations`. You can push this schema to your new database directly:

```bash
supabase db push
```

*This will create all the necessary tables (`diary_entries`, `profiles`) and policies.*

## Step 4: Deploy Edge Functions

Your project uses Edge Functions (`mux-upload`, `mux-status`, `mux-webhook`). Deploy them with:

```bash
supabase functions deploy
```

## Step 5: Configure Environment Secrets

The Edge Functions need access to Mux. Set these secrets in your new Supabase project:

```bash
supabase secrets set MUX_TOKEN_ID=your_mux_token_id
supabase secrets set MUX_TOKEN_SECRET=your_mux_token_secret
supabase secrets set MUX_WEBHOOK_SECRET=your_mux_webhook_secret
```

*Alternatively, you can set these in the Supabase Dashboard under **Project Settings > Edge Functions > Secrets**.*

## Step 6: Connect the Web App

Now updating your local application to talk to the new project.

1.  Open the `.env` file in your project root.
2.  Update the following values with the keys from your new project (found in **Project Settings > API**):
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_PUBLISHABLE_KEY`
    *   `VITE_SUPABASE_PROJECT_ID` (Optional, usually matches the URL subdomain)

## Step 7: Data Migration (Optional)

If you need to move existing data:
1.  **Export**: Go to your **OLD** project's Dashboard > Table Editor. Select `diary_entries` -> "Export to CSV". Do the same for `profiles`.
2.  **Import**: Go to your **NEW** project's Dashboard > Table Editor. Select `diary_entries` -> "Import Data" -> Upload CSV.
    *   *Note*: Migrating `profiles` is tricky because it's linked to `auth.users`. New users must sign up again in the new project. If you just require the data, you can import `profiles`, but the `id` must match a valid user in `auth.users`. **Recommended approach**: Start fresh with users signing up again.

## Step 8: Setup Mux Webhook

To ensure video processing works:
1.  Go to your [Mux Dashboard settings](https://dashboard.mux.com/settings/webhooks).
2.  Create a new Webhook.
3.  Set the URL to your new function URL:
    `https://<your-new-project-ref>.supabase.co/functions/v1/mux-webhook`
4.  Copy the **Signing Secret** and use it for the `MUX_WEBHOOK_SECRET` in Step 5.

---

**Verification**:
Run your app locally (`npm run dev`) and try to sign up/login and upload a video.

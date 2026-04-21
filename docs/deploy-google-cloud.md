# Deploying on Google Cloud Free Tier

Google Cloud's **Always Free** tier includes one **e2-micro** VM instance that runs indefinitely at no cost (in eligible regions).
Specs: 0.25 vCPU (burst to 2), 1 GB RAM — sufficient for a Telegram bot.

> **Important:** The free e2-micro instance is only available in these regions:
> `us-east1` (South Carolina), `us-west1` (Oregon), `us-central1` (Iowa).
> Choosing any other region will incur charges.

---

## Part 1 — Create a Google Cloud account

1. Go to [cloud.google.com/free](https://cloud.google.com/free) and click **Get started for free**.
2. Sign in with your Google account (or create one).
3. Fill in your country and agree to the terms.
4. Enter your **credit/debit card** details.
   > Google gives you **$300 in free credits** for 90 days. After that, the e2-micro instance stays free under the Always Free tier. You will **not** be auto-charged unless you manually upgrade to a paid account.
5. Click **Start my free trial**.

---

## Part 2 — Create a VM instance

> **Before you start:** the monthly estimate shown by Google Cloud will display a non-zero price until you make all the correct selections below. Once region, machine type, and disk type are all set correctly the estimate will drop to **$0.00**.

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top search bar, type **"VM instances"** and click the result under Compute Engine.
3. If prompted, click **Enable** to enable the Compute Engine API (takes ~1 minute).
4. Click **Create Instance**.

### Step A — Name and region

| Field | Value |
|-------|-------|
| **Name** | `telegram-bot` (or any name) |
| **Region** | `us-east1` (South Carolina) ← **must be one of these three** |
| **Zone** | any zone in that region (e.g. `us-east1-b`) |

> Only `us-east1`, `us-west1`, and `us-central1` qualify for the Always Free e2-micro.
> Any other region will be charged (~$6/mo).

### Step B — Machine type

1. Under **Machine configuration**, select series **E2**.
2. In the **Machine type** dropdown choose **e2-micro** (2 vCPU shared, 1 GB RAM).

### Step C — Boot disk (this is where the $3 charge comes from)

1. Click **Change** under Boot disk.
2. Set:
   - **Operating system:** Ubuntu
   - **Version:** Ubuntu 22.04 LTS
   - **Boot disk type:** `Standard persistent disk` ← **must be Standard, not Balanced or SSD**
   - **Size:** 30 GB
3. Click **Select**.

> Balanced and SSD persistent disks cost ~$3/mo. Standard persistent disk (HDD) is free up to 30 GB.

### Step D — Firewall

Check both boxes:
- ✅ Allow HTTP traffic
- ✅ Allow HTTPS traffic

### Step E — The estimate will show ~$9 — that is normal

Before clicking Create, the **Monthly estimate** panel will likely show around **$9.11**. This is expected — Google Cloud displays the full rack rate in the preview and does **not** apply the Always Free discount there. The discount is applied on your actual invoice, which will show **$0.00**.

If the estimate shows much more than $9–10, recheck your region and machine type.

Click **Create** and wait ~1 minute for the instance status to show a green checkmark.

---

## Part 3 — Connect via SSH

Google Cloud provides a built-in SSH browser terminal — no extra setup required.

### Option A: SSH in the browser (easiest)

1. In the VM instances list, find your instance.
2. Click **SSH** in the Connect column.
3. A terminal window opens in your browser. You're in!

### Option B: SSH from your terminal (Mac / Linux / Windows PowerShell)

1. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) (`gcloud`).
2. Authenticate:
   ```bash
   gcloud auth login
   ```
3. Set your project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
   > Find your Project ID in the top bar of the Console.
4. Connect:
   ```bash
   gcloud compute ssh telegram-bot --zone=YOUR_ZONE
   # Example: gcloud compute ssh telegram-bot --zone=us-east1-b
   ```
   `gcloud` automatically manages SSH keys for you.

### Option C: SSH with a custom key

1. Generate an SSH key pair if you don't have one:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
2. In the Console, go to **Compute Engine** → **Metadata** → **SSH Keys** tab.
3. Click **Edit** → **Add item**, paste the contents of your `~/.ssh/id_ed25519.pub`.
4. Click **Save**.
5. Find your instance's **External IP** on the VM instances page.
6. Connect:
   ```bash
   ssh your_google_username@EXTERNAL_IP
   ```
   > Your Google username is the part before `@` in your Google email, e.g. `john` for `john@gmail.com`.

---

## Part 4 — Install Node.js, PM2, and deploy the bot

Once connected to the server, run these commands:

### Update the system
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # v18.x.x
```

### Install PM2
```bash
sudo npm install -g pm2
```

### Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/telegram-all-notify-bot.git
cd telegram-all-notify-bot
```

### Install dependencies and build
```bash
npm install
npm run build
```

### Create the .env file
```bash
cp .env.example .env
nano .env
```

Paste your bot token:
```env
BOT_TOKEN=your_token_from_BotFather
```
Save: `Ctrl+O` → `Enter` → `Ctrl+X`

### Start the bot
```bash
pm2 start ecosystem.config.js
pm2 status              # should show "online"
pm2 logs telegram-cs-bot  # verify it started correctly
```

### Enable auto-start on reboot
```bash
pm2 startup
# PM2 will print a command — copy and run it, then:
pm2 save
```

---

## Updating the bot

```bash
cd ~/telegram-all-notify-bot
git pull
npm run build
pm2 restart telegram-cs-bot
```

---

## Useful PM2 commands

```bash
pm2 status                   # Check bot status
pm2 logs telegram-cs-bot     # Live logs
pm2 restart telegram-cs-bot  # Restart
pm2 stop telegram-cs-bot     # Stop
```

---

## Keeping costs at $0 — checklist

- Region must be `us-east1`, `us-west1`, or `us-central1`.
- Machine type must be **e2-micro**.
- Boot disk ≤ 30 GB.
- No GPU, no premium networking, no static external IP (a static IP costs ~$0.01/hr when unused).
- Do **not** upgrade to a paid account unless you intentionally want to leave the free tier.

---

## Troubleshooting

**VM instances page is empty or asks to enable Compute Engine API**
- Click **Enable** and wait ~1 minute, then refresh the page.

**SSH button does nothing / browser SSH window won't open**
- Try a different browser. Chrome works best for the built-in SSH terminal.

**Bot not responding**
- Check logs: `pm2 logs telegram-cs-bot`
- Make sure the token in `.env` is correct (no spaces around `=`).

**e2-micro feels slow**
- This is normal — 0.25 vCPU is shared. For a Telegram bot it's more than enough.
  If the node process crashes with OOM, add a swap file:
  ```bash
  sudo fallocate -l 1G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

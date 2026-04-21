# Deploying on Oracle Cloud Free Tier

Oracle Cloud's **Always Free** tier gives you a VM that runs indefinitely at no cost.
You get 1 GB RAM, 1 vCPU (AMD), 47 GB boot volume — more than enough for a Telegram bot.

---

## Part 1 — Create an Oracle Cloud account

1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/) and click **Start for free**.
2. Fill in your name, country, email address, and password.
3. Verify your email via the confirmation link.
4. Enter your phone number and verify it with the SMS code.
5. Enter your **credit/debit card** details.
   > Oracle places a $1 authorization hold that is immediately reversed. You will **not** be billed as long as you only use Always Free resources.
6. Complete sign-up. You will receive an email when your account is ready (usually takes a few minutes).

---

## Part 2 — Create a VM instance

1. Log in to the [OCI Console](https://cloud.oracle.com/).
2. Open the navigation menu (☰) → **Compute** → **Instances**.
3. Click **Create instance**.
4. **Name:** give it any name, e.g. `telegram-bot`.
5. **Image:** click **Change image** → select **Ubuntu** → choose **Ubuntu 22.04** → click **Select image**.
6. **Shape:** click **Change shape**.
   - Select **Ampere** or **AMD** tab.
   - Choose **VM.Standard.E2.1.Micro** — this is the Always Free shape.
   - Click **Select shape**.
7. **Networking:** leave the default VCN settings as-is (a VCN and subnet will be created automatically if needed).
8. **Add SSH keys:**
   - If you already have an SSH key pair, click **Upload public key file (.pub)** and upload your `id_rsa.pub` or `id_ed25519.pub`.
   - If you don't have one, click **Generate a key pair for me**, then **Download private key** — save this file, you will need it to connect.
9. Click **Create**.

Wait ~2 minutes for the instance status to become **Running**.

---

## Part 3 — Open port 22 (SSH) in the firewall

By default Oracle Cloud blocks all inbound traffic. You need to allow SSH.

1. In the instance details page, scroll down to **Primary VNIC** → click the **Subnet** link.
2. In the subnet page, click the **Security List** link.
3. Click **Add Ingress Rules**.
4. Fill in:
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** TCP
   - **Destination Port Range:** `22`
5. Click **Add Ingress Rules**.

---

## Part 4 — Connect via SSH

Find your instance's **Public IP address** on the instance details page.

**Mac / Linux:**
```bash
# If you downloaded the key from Oracle:
chmod 400 ~/Downloads/ssh-key-*.key
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_IP

# If you used your own key:
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_IP
```

**Windows (PowerShell):**
```powershell
ssh -i C:\Users\YourName\Downloads\ssh-key-*.key ubuntu@YOUR_IP
```

**Windows (PuTTY):**
1. Open PuTTY → enter `ubuntu@YOUR_IP` in the Host Name field.
2. Go to Connection → SSH → Auth → Credentials → browse to your `.ppk` file.
   > If your key is `.key` format, convert it first with PuTTYgen: Load → Save private key.
3. Click Open.

> The default username on Oracle Cloud Ubuntu instances is **`ubuntu`**, not `root`.

---

## Part 5 — Install Node.js, PM2, and deploy the bot

Once connected, run these commands one by one:

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
# PM2 will print a command like:
# sudo env PATH=... pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Copy and run that exact command, then:
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

## Troubleshooting

**SSH connection refused / timeout**
- Double-check that you added the ingress rule for port 22 (Part 3).
- Oracle Cloud also has an OS-level firewall (`iptables`). If still blocked, run on the server:
  ```bash
  sudo iptables -I INPUT -p tcp --dport 22 -j ACCEPT
  ```

**Permission denied (publickey)**
- Make sure you are connecting as `ubuntu`, not `root`.
- Verify the key file path and permissions (`chmod 400 key.pem`).

**Bot not responding**
- Check logs: `pm2 logs telegram-cs-bot`
- Verify the token in `.env` is correct and has no extra spaces.

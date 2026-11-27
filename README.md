# Sankalpa Constructions

A mobile-first PWA for a Bengaluru building contractor running several house sites at once on a **material + labour turnkey** model.

Everything stays on the phone. There is no server and no account. Photos and UPI screenshots are compressed in the browser and stored in IndexedDB, so they are not limited by the 5MB `localStorage` cap.

## Run it

```bash
cd ~/Downloads/bengaluru-builder
npm install
npm run dev
```

Open the URL Vite prints. On your phone, use the same Wi-Fi and the network address (`--host` is already on).

```bash
npm run build
npm run preview
```

In Chrome or Safari, use **Install** / **Add to Home Screen**. The app works offline after the first load.

## Put it on your iPhone

Do this on a **personal Mac**, not a managed office laptop. After these steps the app is installed on the phone. It does not use the office Wi-Fi, and it does not need this Mac to be on. Receipts, photos, and lists stay on the phone.

A Windows PC cannot install an iPhone app. The personal computer has to be a Mac.

1. On the Mac, install **Xcode** from the App Store. Open Xcode once and let it finish installing the extra components.
2. Install Node.js from [https://nodejs.org](https://nodejs.org) if `node -v` fails.
3. Clone this repo and install:

```bash
git clone https://github.com/aarisai/constructionApp.git
cd constructionApp
npm install
npm run build:ios
npm run open:ios
```

4. Plug the iPhone into the Mac with the USB-C cable. Unlock the phone. Tap **Trust** and enter the phone passcode.
5. In Xcode’s top bar, choose your iPhone as the run destination. Choose a simulator only if you are not ready to use the real phone.
6. In the left sidebar, select the **App** project, then the **App** target, then **Signing & Capabilities**.
7. Turn on **Automatically manage signing**. Next to Team, choose **Add an Account** and sign in with your personal Apple ID. Then pick that account as the Team.
8. Press the Run button (the play triangle). The first build takes a few minutes.
9. If the phone says the developer is not trusted: open **Settings → General → VPN & Device Management**, tap the Apple ID, and tap **Trust**.
10. If iOS asks for Developer Mode: open **Settings → Privacy & Security → Developer Mode**, turn it on, and restart the phone. Then press Run in Xcode again.
11. Open **Sankalpa** on the home screen.

A free Apple ID install stops opening after 7 days. Plug the phone back into this Mac and press Run again to renew it. A paid Apple Developer account keeps the install for a year.

The book on the phone is separate from any browser tab. The first launch loads the two sample sites. Use **Reports → Clear all data** when you want your own book.

## What you can do

- See what owners still owe, what you still owe suppliers and mestris, cash in versus cash out, and material credit due in the next 7 days.
- Run each site as **fixed rate** (₹ per sq.ft or a lump sum, with stage-wise milestones) or **cost-plus** (materials + labour + your fee %).
- Log owner receipts, material bills with credit due dates, lump-sum labour contracts, and Saturday **kharchi** that reduces the contract balance.
- Attach a camera or gallery photo. It is resized before it is saved.
- Keep one vendor ledger across sites, including advance balances and overdue badges.
- Print a client-safe owner statement (Save as PDF). Supplier names stay off it. Cost-plus can optionally show category totals.
- Download a JSON backup (numbers + photos) and restore it, or a CSV for Excel. The Reports screen also shows site profit and loss.

The first launch loads two sample sites: **Lakshmi Nilaya** in JP Nagar (fixed rate) and **Oakridge Residence** in Whitefield (cost-plus 12%). Use **Reports → Restore sample data** or **Clear all data** when you want your own book. Clear keeps the statement header.

## How the money is counted

- **Fixed contract:** rate × built-up area, or the lump sum you entered. Owner pending = contract − receipts. Receipts fill the stage schedule in order.
- **Cost-plus:** owner bill = material bills + labour lump sums + fee %. It moves as you log costs.
- **Material pending** = bill − paid now − advance adjusted − later settlements.
- **Kharchi and labour payouts** reduce the lump-sum balance. They are not added on top of it.
- **Supplier advance** is cash already paid. Adjusting it on a bill does not count as cash out a second time.
- Amounts use Indian grouping (`₹14,25,000`) and dates are `DD/MM/YYYY`.

`npm run verify` checks the sample book against those rules.

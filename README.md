# Personal Website — KXK

သင့် personal website ရဲ့ source code ဖိုဒါ။ Vercel မှာ အခမဲ့ deploy လုပ်နိုင်ပါတယ်။

> **အရေးကြီး:** Preview ကြည့်ဖို့ local server (Live Server / `python3 -m http.server`) လိုပါတယ်။
> Header/footer ကို `components/` ဖိုဒါကနေ သီးသန့်ဖိုင်နဲ့ ထည့်ထားလို့ `index.html` ကို တိုက်ရိုက် double-click ဖွင့်ရင် menu မပေါ်ပါဘူး။

---

## ဖိုင်တည်ဆောက်ပုံ (အပိုင်းစီ ခွဲထားသည် — ပြင်ချင်တဲ့အပိုင်း ဖိုင်တစ်ခုတည်းပဲ ပြင်ရမယ်)

```
personal-website/
├── index.html          → redirect သာဖြစ်ပြီး home.html ကို အလိုအလျောက် ပို့ပေးတယ်
├── home.html           → ပင်မစာမျက်နှာ ("Warmly Welcome to KK" + လင့်များ)
├── posts.html          → Posts (Supabase feed — post တင်/ဖျက် လို့ရတဲ့ နေရာ)
├── services.html       → Services (Account / Apple / Mobile Phone / Hardware)
├── apps.html           → Apps (IC Finder Pro စသည်)
├── download.html       → Download (app download links ထည့်ရမယ့်နေရာ)
├── performance.html    → Performance (app စွမ်းဆောင်ရည်)
├── about.html          → About (ကိုယ့်အကြောင်း)
├── contact.html        → Contact (Email / Phone / Telegram)
├── style.css           → အရောင်/ပုံစံ အားလုံး (light + dark)
├── script.js           → header/footer ထည့် + dark/light + ဘာသာပြန် + menu
├── photos/
│   ├── windows/        → IC Finder Pro Windows screenshot များ
│   └── android/        → IC Finder Pro Android screenshot များ
├── components/
│   ├── header.html     → nav menu (ဒီဖိုင်တစ်ခုတည်းပြင်ရင် စာမျက်နှာအားလုံး ပြောင်း)
│   └── footer.html     → footer
└── README.md           → ဒီလမ်းညွှန်
```

**ဘာကို ဘယ်မှာ ပြင်ရမလဲ:**

| ပြင်ချင်တာ | ပြင်ရမယ့်ဖိုင် |
|---|---|
| Menu / nav လင့်များ | `components/header.html` — တစ်နေရာတည်းပြင်ရင် အကုန်ပြောင်း |
| Hero စာသား ("Welcome to KXK") | `home.html` |
| ဝန်ဆောင်မှု စာရင်း (Account/Apple/Mobile Phone/Hardware) | `services.html` — item ထည့်/ဖျက် လို့ရတယ် |
| App စာရင်း | `apps.html` — card copy ပြီး ထပ်ထည့်လို့ရတယ် |
| **Download link များ (Windows/Android)** | `download.html` — button ၂ ခုရဲ့ `href` ကို သင့် drive link နဲ့ အစားထိုးပါ |
| App စွမ်းဆောင်ရည် ကိန်းဂဏန်းများ | `performance.html` |
| About စာပိုဒ် | `about.html` |
| Email / Phone / Telegram | `contact.html` |
| အရောင် (accent) | `style.css` အပေါ်ဆုံးက `--accent` |

- **Dark / Light mode:** header မှာ ခလုတ်နဲ့ ပြောင်းလို့ရပြီး ရွေးချယ်မှုကို မှတ်မိပါတယ်။ ပထမဆုံးဖွင့်ချိန် ဖုန်း/ကွန်ပျူတာရဲ့ setting ကိုလိုက်ပါတယ်။
- **ဘာသာစကား:** ပထမဆုံးဝင်တာနဲ့ **English** နဲ့ပြပါတယ် — header က ခလုတ်နဲ့ မြန်မာ ⇄ English ပြောင်းလို့ရပြီး ရွေးချယ်မှုကို မှတ်မိပါတယ်။

### ကွန်ပျူတာမှာ အရင်ကြည့်ရန် (preview)

VS Code ထဲမှာ `index.html` ကို right-click → "Open with Live Server" (Live Server extension မရှိရင် install လုပ်ပါ)။
ဒါမှမဟုတ် terminal မှာ:

```bash
cd ~/Desktop/KK/personal-website
python3 -m http.server 8000
```

ပြီးရင် browser မှာ http://localhost:8000 ဖွင့်ကြည့်ပါ။

---

## Vercel မှာ Deploy လုပ်ရန်

### 1. Account ဖွင့်ရန်

1. Browser မှာ **https://vercel.com** သွားပါ။
2. **Sign Up** ကိုနှိပ်ပြီး GitHub / Google / Email — တစ်ခုခုနဲ့ စာရင်းသွင်းပါ။
3. Verification ပြီးရင် dashboard ကို ဝင်ပါ။

> Hobby (အခမဲ့) plan နဲ့ `yourname.vercel.app` လိပ်စာ အခမဲ့ ရပါတယ်။

### 2. Deploy — နည်းလမ်း A (Dashboard၊ အလွယ်ဆုံး)

1. vercel.com dashboard → **Add New…** → **Project** ကိုနှိပ်ပါ။
2. **Upload** tab → `~/Desktop/KK/personal-website` ဖိုဒါကို drop လုပ်ပါ။
3. **Deploy** ကိုနှိပ်ပါ — မိနစ်အနည်းငယ်အတွင်း `https://your-project.vercel.app` ရပါမယ်။

### နည်းလမ်း B (CLI)

```bash
npm install -g vercel
cd ~/Desktop/KK/personal-website
vercel login
vercel --prod
```

### နည်းလမ်း C (GitHub)

```bash
cd ~/Desktop/KK/personal-website
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git push -u origin main
```

vercel.com → **Add New… → Project** → **Import Git Repository** → Deploy။ GitHub နဲ့ ဆိုရင် နောက်ပိုင်း `git push` တိုင်း auto-deploy ဖြစ်ပါတယ်။

### 3. ပြောင်းလဲမှုတိုင်း ပြန်တင်ရန်

- Dashboard: **Deployments** tab → **⋯** → **Redeploy**
- CLI: `vercel --prod`
- GitHub: `git push`

---

## Posts စာမျက်နှာ (Supabase)

`posts.html` က Facebook လို post တင် / ဖျက် လို့ရတဲ့ စာမျက်နှာပါ။ Post တွေကို Supabase (အခမဲ့ cloud database) မှာ သိမ်းပါတယ်။

- Setup လုပ်ဖို့ (တစ်ခါပဲ): **`SUPABASE-SETUP.md`** ကို ဖတ်ပါ
- Database ဖွဲ့စည်းပုံ script: **`supabase-setup.sql`** (SQL Editor မှာ run ရတယ်)
- Config: **`supabase-config.js`** ထဲ Project URL + anon key ထည့်ပါ
- လူတိုင်း post ဖတ်လို့ရတယ် — မင်းပဲ login ဝင်ပြီး post တင် / ဖျက် လို့ရတယ်
- Post တဲ့အခါ ပုံလည်း တွဲတင်လို့ရတယ် (Supabase Storage မှာ သိမ်းတယ်)

## ကိုယ်ပိုင် domain

Project → **Settings → Domains** မှာ domain ထည့်ပြီး DNS ညွှန်ကြားချက်အတိုင်း ပြင်ပါ။

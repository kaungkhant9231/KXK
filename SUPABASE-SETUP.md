# Posts Feature — Supabase Setup လမ်းညွှန် (မြန်မာ)

ဒီ site မှာ **Posts** စာမျက်နှာ (Facebook လို post တင် / ဖျက် လို့ရတဲ့ နေရာ) ထည့်ထားပါတယ်။ Post တွေကို **Supabase** (အခမဲ့ cloud database) မှာ သိမ်းပါတယ်။ အောက်က step တွေ **တစ်ခါပဲ** လုပ်ရမှာ ဖြစ်ပြီး ပြီးရင် site ပေါ်မှာ တိုက်ရိုက် post တင်/ဖျက် လို့ရပါပြီ။

> **အချိန်:** ၁၀–၁၅ မိနစ်ခန့်။ **ကုန်ကျစရိတ်:** $0 (credit card မလို)။

---

## Step 1 — Supabase Account ဖွင့်ပါ

1. Browser မှာ **https://supabase.com** သွားပါ
2. **Start your project** ကိုနှိပ်ပြီး GitHub / Google / Email တစ်ခုခုနဲ့ Sign Up လုပ်ပါ
3. Email ရောက်လာရင် confirm လုပ်ပါ

## Step 2 — Project အသစ်ဖွင့်ပါ

1. Dashboard ရောက်ရင် **New project** ကိုနှိပ်ပါ
2. ဖြည့်ရမှာတွေ:
   - **Name:** `kxk-posts` (ဘာဖြစ်ဖြစ်ရပါတယ်)
   - **Database Password:** ကိုယ့်ကြိုက်တဲ့ password ရိုက်ပါ (သေချာ မှတ်ထားပါ — နောက်လိုမယ်)
   - **Region:** `Singapore` (မြန်မာနဲ့ အနီးဆုံး — မြန်မယ်)
3. **Create new project** နှိပ်ပြီး စောင့်ပါ (၁–၂ မိနစ်ခန့်)

## Step 3 — SQL ဖတ် Run လုပ်ပါ ⭐

1. Project ထဲဝင်ပြီးရင် ဘယ်ဘက် menu က **SQL Editor** → **New query** ကိုနှိပ်ပါ
2. ပရောဂျက် folder ထဲက **`supabase-setup.sql`** ဖိုင်ကို ဖွင့်ပြီး အကုန် copy လုပ်ပါ
3. SQL Editor ထဲ paste လုပ်ပြီး **Run** နှိပ်ပါ
4. အောက်မှာ `Success` ဖြစ်ပြီး statements တွေ ပေါ်လာရင် ရပါပြီ

## Step 4 — Admin User ဖွင့်ပါ (ဒီအကောင့်နဲ့ post တင်မယ်)

1. ဘယ်ဘက် menu က **Authentication** → **Users** → **Add user** နှိပ်ပါ
2. Email + Password ရိုက်ပါ (ဥပမာ: `admin@kxk.com` + ကိုယ်ကြိုက်တဲ့ password)
   - ⚠️ ဒီ email/password ကို သေချာ မှတ်ထားပါ — site ပေါ်မှာ post တင်တိုင်း ဒီနဲ့ login ဝင်ရမယ်
3. **Create user** နှိပ်ပါ

## Step 5 — API Keys ယူပြီး Config ထည့်ပါ

1. ဘယ်ဘက် menu က **Project Settings** → **API** ကိုဖွင့်ပါ
2. ဒီ၂ခု copy လုပ်ပါ:
   - **Project URL** (ဥပမာ: `https://abcdefgh.supabase.co`)
   - **anon public** key (ရှည်ရှည်လေးတစ်ခု)
3. ပရောဂျက် folder ထဲက **`supabase-config.js`** ဖိုင်ကို ဖွင့်ပြီး နေရာချထားတဲ့နေရာမှာ paste လုပ်ပါ:
   ```js
   window.KXK_SUPABASE = {
     url: "https://YOUR-PROJECT.supabase.co",   // ← Project URL ထည့်ပါ
     anonKey: "YOUR-ANON-KEY"                    // ← anon public key ထည့်ပါ
   };
   ```
4. Save လုပ်ပါ

## Step 6 — Vercel မှာ ပြန်တင်ပါ (Redeploy)

- Dashboard နည်း: vercel.com → project → **Deployments** tab → **⋯** → **Redeploy**
- (ဒါမှမဟုတ်) CLI: `vercel --prod`

## Step 7 — စမ်းကြည့်ပါ ✅

1. `https://your-site.vercel.app/posts.html` ဖွင့်ပါ
2. **＋ Post (Admin Login)** နှိပ် → Step 4 က email/password နဲ့ login ဝင်ပါ
3. စာရိုက်ပြီး **Post** နှိပ်ပါ → feed ပေါ်မှာ ပေါ်လာတာ တွေ့ရမယ်
4. Post တစ်ခုရဲ့ **ဖျက်မည်** ခလုတ်နဲ့ ဖျက်လို့ရတယ်

---

## အမေးများသောအချက်များ

**Q: လူတိုင်း post တင်လို့ရလား?**
မရပါ။ လူတိုင်း ဖတ်လို့ရတယ်၊ ဒါပေမယ့် မင်း login ဝင်မှသာ post တင်/ဖျက် လို့ရတယ် (Security rules ကို supabase-setup.sql မှာ ထည့်ထားပြီးသား)။

**Q: Post တင်တဲ့ password မေ့သွားရင်?**
Supabase → Authentication → Users → မင်း user → **Reset password** လုပ်လို့ရတယ်။

**Q: ပုံတင်ရင် ကန့်သတ်ချက်ရှိလား?**
Free plan မှာ ဖိုင်တစ်ခု 50MB အထိ ရတယ် — ပုံအတွက် ပိုနေပါတယ်။

**Q: နောက်ပိုင်း comments / likes ထည့်ချင်ရင်?**
လိုရပြီ — ဒီထဲက ဆက်တိုးလို့ရတယ်။ ပြောလိုက်ရင် ငါထည့်ပေးမယ်။

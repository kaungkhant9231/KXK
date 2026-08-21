# V2 Setup — User Accounts + Admin Panel (မြန်မာ)

ဒီ upgrade က site ကို **mini social network** ဖြစ်အောင် လုပ်ပေးတယ်:
- User တွေ ကိုယ်တိုင် account ဖွင့်လို့ရမယ် (email confirm နဲ့)
- User တိုင်း ကိုယ်ပိုင် profile (နာမည် / အကြောင်း / ပုံ)
- Post တင်ခြင်း + Like ❤️ + Comment 💬 + Share 📤
- **Admin panel** — မင်းက user အကုန် စီမံနိုင် (ban/unban/ဖျက်) + post/comment မဆိတ်တာ ဖျက်

> v1 (SUPABASE-SETUP.md) ပြီးထားပြီးသား ဖြစ်ရပါမယ်။ Setup ၃ ဆင့်ပဲ ရှိပါတယ်။

---

## Step 1 — V2 SQL Run လုပ်ပါ

1. supabase.com/dashboard → မင်း project (KXK) ထဲဝင်ပါ
2. **SQL Editor** → New query
3. **`supabase-setup-v2.sql`** ဖိုင်ကို ဖွင့်ပြီး တစ်ခုလုံး copy → paste → **Run**
4. အောက်ဆုံးမှာ `display_name | username | is_admin` row ၁ ခု ပေါ်ရင် အောင်မြင်ပြီ ✅
   (ပေါ်တာက `Kaung Khant | kxk | true` ဖြစ်ရမယ်)

## Step 2 — Email Confirmation ဖွင့်ထားကြောင်း စစ်ပါ

1. ဘယ်ဘက် menu → **Authentication** → **Providers** (သို့) **Settings**
2. **Email** tab → **Confirm email** toggle က **ON** ဖြစ်နေရမယ် (user ဖွင့်တိုင်း email link နှိပ်မှ ဝင်လို့ရမယ်)
3. (စမ်းချင်ရင် အရင်ဆုံး ကိုယ့် email တစ်ခုနဲ့ စမ်းပါ — email က inbox/spam နှစ်နေရာလုံး ကြည့်ပါ)

> 💡 Supabase ရဲ့ အခမဲ့ email service က တစ်နာရီကို အကန့်အသတ်နဲ့ပဲ ပို့နိုင်တယ်။
> Email မရောက်တာတွေ ဖြစ်ရင် → **Project Settings → Auth → SMTP** မှာ ကိုယ့် email နဲ့ SMTP ချိတ်နိုင်တယ် (Gmail ရဲ့ App Password သုံးလို့ရတယ်)။

## Step 3 — Admin Edge Function Deploy လုပ်ပါ ⭐

Admin panel က user စာရင်း (email အပါအဝင်) နဲ့ user ဖျက်ခြင်း အတွက် **Edge Function** လိုတယ် — ဒါက security ကြောင့်ပါ (secret key ကို browser ထဲ ထည့်လို့မရလို့)။

1. ဘယ်ဘက် menu → **Functions** → **Create a new function**
2. **Name:** `admin` လို့ ရိုက်ပြီး Create
3. Editor ထဲ ပေါ်လာတဲ့ code တစ်ခုလုံး ဖျက်ပြီး project folder ထဲက **`supabase/functions/admin/index.ts`** ဖိုင်ရဲ့ code ကို copy → paste လုပ်ပါ
4. **Deploy** နှိပ်ပါ
5. Deploy ပြီးရင် **Settings** tab (function ရဲ့) → **Variables / Secrets** ထဲ ဒီ ၂ ခု ထည့်ပါ:
   - `SUPABASE_URL` = `https://vnaauwfvmcurturprwys.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = Project Settings → API မှာ ရှိတဲ့ **service_role** key (⚠️ ဒါက secret — ဘယ်သူ့ကိုမှ မပြ ပါ၊ browser code ထဲ မထည့်ပါနဲ့)
6. Save / Deploy ထပ်နှိပ်ပါ

## Step 4 — Redeploy Site

- vercel.com → project → Deployments → **⋯** → **Redeploy**
- (ဒါမှမဟုတ် git push — auto-deploy)

## Step 5 — စမ်းကြည့်ပါ ✅

1. **Admin ဘက်:** https://kxk-nu.vercel.app/admin.html → `kxk@admin.com` / `KXK#2026Admin` နဲ့ login ဝင် → user စာရင်း ပေါ်ရမယ်
2. **User ဘက်:** https://kxk-nu.vercel.app/posts.html → **Register** tab နဲ့ account အသစ် ဖွင့် (email confirm) → login → post တင် → like/comment/share စမ်း
3. **Profile:** ကိုယ့်နာမည်နဲ့ @username နှိပ် (သို့) profile.html?me → ကိုယ့်အကြောင်း/ပုံ ပြင်ကြည့်

---

## Admin Panel အလုပ်လုပ်ပုံ

| လုပ်ဆောင်ချက် | ဘယ်လိုလဲ |
|---|---|
| User စာရင်း ကြည့် | Email, နာမည်, @username, ဖွင့်ရက်, confirmed/banned |
| Ban / Unban | Ban ရင် user က post/like/comment မလုပ်နိုင်တော့ (login ဝင်လို့တော့ရ) |
| User ဖျက် | အကောင့်နဲ့ သူ့ post/like/comment အကုန် ဖျက်ပစ် |
| Post / Comment ဖျက် | မဆိတ်တဲ့ content တွေ ဖျက်လို့ရ |

## အမေးများသောအချက်များ

**Q: User က email confirm မလုပ်ရသေးဘူးဆို?**
login ဝင်လို့မရဘူး — "Email not confirmed" လို့ ပြမယ်။ inbox/spam စစ်ပါ။

**Q: Admin က ဘယ်သူလဲ?**
`kxk@admin.com` — SQL run လုပ်တဲ့အခါ is_admin = true ဖြစ်သွားပြီးသား။

**Q: နောက်ထပ် admin ထပ်ထည့်ချင်ရင်?**
SQL Editor မှာ: `update public.profiles set is_admin = true where id = (select id from auth.users where email = 'EMAIL');`

**Q: Banned user ရဲ့ အရင် post တွေ?**
မဖျက်ပါ — ရှိနေတယ်။ အသစ် မတင်နိုင်တော့ဘူး။ ဖျက်ချင်ရင် Admin panel မှာ ဖျက်လို့ရတယ်။

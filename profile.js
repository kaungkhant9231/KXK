/* =========================================================
   Profile page (profile.html)
   - ?id=<user_id> → သူများ profile ကြည့်
   - ?me          → ကိုယ့် profile (login လိုတယ်)
   - Own profile ဆိုရင်: name / bio / avatar ပြင်လို့ရ
   ========================================================= */
(function () {
  "use strict";

  var cfg = window.KXK_SUPABASE || {};
  var READY = !!(cfg.url && cfg.anonKey &&
                 cfg.url.indexOf("YOUR-PROJECT") === -1 &&
                 cfg.anonKey.indexOf("YOUR-ANON-KEY") === -1 &&
                 window.supabase);

  var lang = "en";
  try { lang = localStorage.getItem("site-lang") || "en"; } catch (e) {}
  function t(en, my) { return lang === "my" ? my : en; }

  var $ = function (id) { return document.getElementById(id); };
  var setupNote = $("setupNote");
  var card = $("profileCard");
  var pAvatar = $("pAvatar");
  var pName = $("pName");
  var pHandle = $("pHandle");
  var pBio = $("pBio");
  var pJoined = $("pJoined");
  var editBtn = $("editBtn");
  var editBox = $("editBox");
  var avatarInput = $("avatarInput");
  var editName = $("editName");
  var editBio = $("editBio");
  var saveBtn = $("saveBtn");
  var cancelBtn = $("cancelBtn");
  var editStatus = $("editStatus");
  var feed = $("pFeed");
  var pEmpty = $("pEmpty");

  if (!READY) {
    if (setupNote) setupNote.style.display = "";
    return;
  }

  var sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  var me = null;
  var profile = null;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }
  function letterOf(p) {
    var s = (p && (p.display_name || p.username)) || "?";
    return s.charAt(0).toUpperCase();
  }
  function fmtDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch (e) { return iso; }
  }

  var params = new URLSearchParams(location.search);
  var targetId = params.get("id") || (params.get("me") ? "me" : null);

  function isOwn() {
    return me && profile && me.id === profile.id;
  }

  function render() {
    if (!profile) return;
    card.style.display = "";
    pName.textContent = profile.display_name || profile.username || "user";
    if (profile.is_admin) {
      pName.innerHTML += ' <span class="admin-badge">ADMIN</span>';
    }
    pHandle.textContent = "@" + (profile.username || "user");
    pBio.textContent = profile.bio || t("No bio yet.", "အကြောင်း မရေးရသေးပါ။");
    pJoined.textContent = t("Joined: ", "ဝင်ရောက်ရက်: ") + fmtDate(profile.created_at);

    if (profile.avatar_url) {
      pAvatar.outerHTML = '<img class="avatar avatar-lg" id="pAvatar" src="' + esc(profile.avatar_url) + '" alt="" />';
      pAvatar = $("pAvatar");
    } else {
      pAvatar.textContent = letterOf(profile);
    }

    editBtn.style.display = isOwn() ? "" : "none";
    loadPosts();
  }

  function loadPosts() {
    sb.from("posts")
      .select("id, content, image_url, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .then(function (res) {
        feed.innerHTML = "";
        if (res.error) { pEmpty.style.display = ""; pEmpty.textContent = t("Could not load posts.", "Post ဖတ်လို့ မရဘူး။"); return; }
        var posts = res.data || [];
        if (!posts.length) {
          pEmpty.textContent = t("No posts yet.", "Post မရှိသေးပါ။");
          pEmpty.style.display = "";
          return;
        }
        pEmpty.style.display = "none";
        posts.forEach(function (p) {
          var item = document.createElement("article");
          item.className = "post-card";
          var content = document.createElement("p");
          content.className = "post-content";
          content.textContent = p.content;
          item.appendChild(content);
          if (p.image_url) {
            var img = document.createElement("img");
            img.className = "post-image";
            img.src = p.image_url;
            img.alt = "Post image";
            img.loading = "lazy";
            item.appendChild(img);
          }
          var meta = document.createElement("div");
          meta.className = "post-meta";
          var time = document.createElement("span");
          time.className = "post-date";
          time.textContent = fmtDate(p.created_at);
          meta.appendChild(time);
          var link = document.createElement("a");
          link.href = "posts.html?post=" + p.id;
          link.className = "quick-link";
          link.textContent = t("View →", "ကြည့်ရန် →");
          meta.appendChild(link);
          item.appendChild(meta);
          feed.appendChild(item);
        });
      });
  }

  /* ---------- Auth ---------- */
  sb.auth.onAuthStateChange(function (event, session) {
    me = session ? session.user : null;
    boot();
  });

  function boot() {
    if (targetId === "me") {
      if (!me) {
        card.style.display = "";
        card.innerHTML = '<p class="support-note">' + esc(t("Please log in first — open the Posts page.", "အရင်ဆုံး login ဝင်ပါ — Posts စာမျက်နှာကနေ ဝင်ပါ။")) + "</p>";
        return;
      }
      targetId = me.id;
    }
    if (!targetId) {
      card.style.display = "";
      card.innerHTML = '<p class="support-note">' + esc(t("No user specified.", "User မရွေးရသေးပါ။")) + "</p>";
      return;
    }
    sb.from("profiles").select("*").eq("id", targetId).maybeSingle().then(function (r) {
      if (r.error || !r.data) {
        card.style.display = "";
        card.innerHTML = '<p class="support-note">' + esc(t("User not found.", "User ရှာမတွေ့ပါ။")) + "</p>";
        return;
      }
      profile = r.data;
      render();
    });
  }

  /* ---------- Edit ---------- */
  editBtn.addEventListener("click", function () {
    editName.value = profile.display_name || "";
    editBio.value = profile.bio || "";
    editStatus.textContent = "";
    editBox.style.display = "";
    editBtn.style.display = "none";
  });
  cancelBtn.addEventListener("click", function () {
    editBox.style.display = "none";
    editBtn.style.display = "";
  });

  saveBtn.addEventListener("click", function () {
    var name = editName.value.trim();
    var bio = editBio.value.trim();
    var updates = { display_name: name || profile.display_name || "user", bio: bio };
    var done = function (res) {
      if (res.error) { editStatus.textContent = t("Save failed — try again.", "သိမ်းလို့ မရဘူး — ထပ်ကြိုးစားပါ။"); editStatus.style.color = "#dc2626"; return; }
      profile.display_name = updates.display_name;
      profile.bio = updates.bio;
      editBox.style.display = "none";
      editBtn.style.display = "";
      render();
    };

    var file = avatarInput.files && avatarInput.files[0];
    if (file) {
      var path = me.id + "/" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      sb.storage.from("avatars").upload(path, file).then(function (res) {
        if (res.error) {
          editStatus.textContent = t("Photo upload failed — try a smaller image.", "ပုံတင်လို့ မရဘူး — ပုံသေးသေးတစ်ခု စမ်းကြည့်ပါ။");
          editStatus.style.color = "#dc2626";
          return;
        }
        updates.avatar_url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
        sb.from("profiles").update(updates).eq("id", me.id).then(done);
      });
    } else {
      sb.from("profiles").update(updates).eq("id", me.id).then(done);
    }
  });

  /* ---------- Boot ---------- */
  sb.auth.getSession().then(function (r) {
    me = r.data.session ? r.data.session.user : null;
    boot();
  });
})();

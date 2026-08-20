/* =========================================================
   Posts page logic — Supabase-backed mini feed (posts.html only)
   - Public feed (read) — anyone can see posts
   - Post / Delete — only after admin login (Supabase auth)
   ========================================================= */
(function () {
  "use strict";

  var cfg = window.KXK_SUPABASE || {};
  var READY = !!(cfg.url && cfg.anonKey &&
                 cfg.url.indexOf("YOUR-PROJECT") === -1 &&
                 cfg.anonKey.indexOf("YOUR-ANON-KEY") === -1 &&
                 window.supabase);

  var setupNote = document.getElementById("setupNote");
  var feed = document.getElementById("postFeed");
  var emptyNote = document.getElementById("postEmpty");
  var adminBar = document.getElementById("postAdmin");
  var loginBtn = document.getElementById("loginBtn");
  var logoutBtn = document.getElementById("logoutBtn");
  var composeBox = document.getElementById("composeBox");
  var postText = document.getElementById("postText");
  var postImage = document.getElementById("postImage");
  var fileName = document.getElementById("fileName");
  var submitBtn = document.getElementById("submitBtn");
  var adminStatus = document.getElementById("adminStatus");
  var loginModal = document.getElementById("loginModal");
  var loginForm = document.getElementById("loginForm");
  var loginEmail = document.getElementById("loginEmail");
  var loginPassword = document.getElementById("loginPassword");
  var loginError = document.getElementById("loginError");
  var loginClose = document.getElementById("loginClose");

  /* Language — script.js နဲ့ တူညီအောင် localStorage ကနေ ဖတ်တယ် */
  var lang = "en";
  try { lang = localStorage.getItem("site-lang") || "en"; } catch (e) {}

  function t(en, my) { return lang === "my" ? my : en; }

  /* Textarea placeholder ကို ဘာသာစကားနဲ့လိုက်ပြီး သတ်မှတ် (data-i18n က textContent ကို ပြောင်းလို့ textarea မှာ မသုံးရ) */
  if (postText) postText.placeholder = t("Share something...", "ဘာတွေ ဖြစ်ပျက်နေလဲ ရေးပါ...");

  /* Config မဖြည့်ရသေးရင် setup note ပြပြီး ရပ်လိုက် */
  if (!READY) {
    if (setupNote) setupNote.style.display = "";
    if (adminBar) adminBar.style.display = "none";
    return;
  }

  var sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  var user = null;

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      var opts = {
        year: "numeric",
        month: lang === "my" ? "long" : "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      };
      return d.toLocaleString("en-US", opts);
    } catch (e) { return iso; }
  }

  /* ---------- Feed ---------- */
  function renderFeed(posts) {
    feed.innerHTML = "";
    if (!posts || posts.length === 0) {
      emptyNote.textContent = t("No posts yet — be the first to post!", "Post မရှိသေးပါ — ပထမဆုံး post တင်လိုက်ပါ!");
      emptyNote.style.display = "";
      return;
    }
    emptyNote.style.display = "none";

    posts.forEach(function (p) {
      var card = document.createElement("article");
      card.className = "post-card";

      var content = document.createElement("p");
      content.className = "post-content";
      content.textContent = p.content; /* XSS-safe */
      card.appendChild(content);

      if (p.image_url) {
        var img = document.createElement("img");
        img.className = "post-image";
        img.src = p.image_url;
        img.alt = "Post image";
        img.loading = "lazy";
        card.appendChild(img);
      }

      var meta = document.createElement("div");
      meta.className = "post-meta";

      var time = document.createElement("span");
      time.className = "post-date";
      time.textContent = formatDate(p.created_at);
      meta.appendChild(time);

      /* Login ဝင်ထားမှသာ delete ခလုတ် ပြမယ် */
      if (user) {
        var del = document.createElement("button");
        del.type = "button";
        del.className = "delete-btn";
        del.textContent = t("Delete", "ဖျက်မည်");
        del.addEventListener("click", function () {
          if (!window.confirm(t("Delete this post?", "ဒီ post ကို ဖျက်မှာလား?"))) return;
          sb.from("posts").delete().eq("id", p.id).then(function (res) {
            if (res.error) {
              setStatus(t("Delete failed — try again.", "ဖျက်လို့ မရဘူး — ထပ်ကြိုးစားပါ။"), true);
              return;
            }
            loadPosts();
          });
        });
        meta.appendChild(del);
      }

      card.appendChild(meta);
      feed.appendChild(card);
    });
  }

  function loadPosts() {
    sb.from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(function (res) {
        if (res.error) {
          feed.innerHTML = "";
          emptyNote.textContent = t("Could not load posts.", "Post တွေ ဖတ်လို့ မရဘူး။");
          emptyNote.style.display = "";
          return;
        }
        renderFeed(res.data || []);
      });
  }

  /* ---------- Admin UI ---------- */
  function setStatus(msg, isError) {
    adminStatus.textContent = msg || "";
    adminStatus.style.color = isError ? "#dc2626" : "";
  }

  function updateAdmin() {
    if (user) {
      loginBtn.style.display = "none";
      composeBox.style.display = "";
      logoutBtn.style.display = "";
      setStatus(t("Logged in as: ", "ဝင်ထားသည်: ") + (user.email || ""));
    } else {
      loginBtn.style.display = "";
      composeBox.style.display = "none";
      logoutBtn.style.display = "none";
      setStatus("");
    }
  }

  sb.auth.onAuthStateChange(function (event, session) {
    user = session ? session.user : null;
    updateAdmin();
    loadPosts();
  });

  /* ---------- Login modal ---------- */
  function openLogin() {
    loginError.textContent = "";
    loginModal.classList.add("open");
    loginModal.setAttribute("aria-hidden", "false");
    loginPassword.value = "";
    setTimeout(function () { loginEmail.focus(); }, 60);
  }

  function closeLogin() {
    loginModal.classList.remove("open");
    loginModal.setAttribute("aria-hidden", "true");
  }

  loginBtn.addEventListener("click", openLogin);

  if (loginClose) loginClose.addEventListener("click", closeLogin);

  loginModal.addEventListener("click", function (e) {
    if (e.target === loginModal) closeLogin();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && loginModal.classList.contains("open")) closeLogin();
  });

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.textContent = "";
    var btn = loginForm.querySelector("button[type=submit]");
    var oldLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = t("Signing in...", "ဝင်နေသည်...");
    sb.auth.signInWithPassword({
      email: loginEmail.value.trim(),
      password: loginPassword.value
    }).then(function (res) {
      btn.disabled = false;
      btn.textContent = oldLabel;
      if (res.error) {
        loginError.textContent = t("Wrong email or password.", "Email သို့မဟုတ် password မှားနေပါတယ်။");
        return;
      }
      closeLogin();
    });
  });

  logoutBtn.addEventListener("click", function () {
    sb.auth.signOut();
  });

  /* ---------- Compose ---------- */
  postImage.addEventListener("change", function () {
    var f = postImage.files && postImage.files[0];
    fileName.textContent = f ? f.name : "";
  });

  submitBtn.addEventListener("click", function () {
    var text = postText.value.trim();
    var file = postImage.files && postImage.files[0];
    if (!text && !file) {
      setStatus(t("Write something first.", "စာတစ်ခုခု အရင်ရေးပါ။"), true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = t("Posting...", "တင်နေသည်...");

    function done() {
      submitBtn.disabled = false;
      submitBtn.textContent = t("Post", "တင်မည်");
    }

    function insertRow(imageUrl) {
      var payload = { content: text || "📷" };
      if (imageUrl) payload.image_url = imageUrl;
      sb.from("posts").insert(payload).then(function (res) {
        done();
        if (res.error) {
          setStatus(t("Post failed — try again.", "တင်လို့ မရဘူး — ထပ်ကြိုးစားပါ။"), true);
          return;
        }
        postText.value = "";
        postImage.value = "";
        fileName.textContent = "";
        setStatus("");
        loadPosts();
      });
    }

    if (file) {
      var path = "posts/" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      sb.storage.from("post-images").upload(path, file).then(function (res) {
        if (res.error) {
          done();
          setStatus(t("Image upload failed — try a smaller image.", "ပုံတင်လို့ မရဘူး — ပုံသေးသေးတစ်ခု စမ်းကြည့်ပါ။"), true);
          return;
        }
        var publicUrl = sb.storage.from("post-images").getPublicUrl(path).data.publicUrl;
        insertRow(publicUrl);
      });
    } else {
      insertRow(null);
    }
  });

})();

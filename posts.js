/* =========================================================
   Posts page — social feed (posts.html only)
   - Public feed: anyone can read
   - Register / Login (email confirm required)
   - Post / Like / Comment / Share (logged-in users)
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

  /* ---------- Elements ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var setupNote = $("setupNote");
  var authBtn = $("authBtn");
  var sessionUser = $("sessionUser");
  var meLink = $("meLink");
  var meAvatar = $("meAvatar");
  var meName = $("meName");
  var logoutBtn = $("logoutBtn");
  var composeBox = $("composeBox");
  var postText = $("postText");
  var postImage = $("postImage");
  var fileName = $("fileName");
  var submitBtn = $("submitBtn");
  var adminStatus = $("adminStatus");
  var feed = $("postFeed");
  var emptyNote = $("postEmpty");
  var authModal = $("authModal");
  var authClose = $("authClose");
  var tabLogin = $("tabLogin");
  var tabRegister = $("tabRegister");
  var loginForm = $("loginForm");
  var loginEmail = $("loginEmail");
  var loginPassword = $("loginPassword");
  var loginError = $("loginError");
  var registerForm = $("registerForm");
  var regName = $("regName");
  var regEmail = $("regEmail");
  var regPassword = $("regPassword");
  var regError = $("regError");
  var regSuccess = $("regSuccess");

  /* ---------- Setup guard ---------- */
  if (!READY) {
    if (setupNote) setupNote.style.display = "";
    var bar = $("sessionBar");
    if (bar) bar.style.display = "none";
    return;
  }

  var sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  var me = null;        /* auth user */
  var myProfile = null; /* profiles row */

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }
  function letterOf(p) {
    var s = (p && (p.display_name || p.username)) || "?";
    return s.charAt(0).toUpperCase();
  }
  function avatarHtml(p, cls) {
    cls = cls || "avatar";
    if (p && p.avatar_url) {
      return '<img class="' + cls + '" src="' + esc(p.avatar_url) + '" alt="" />';
    }
    return '<span class="' + cls + ' avatar-letter">' + esc(letterOf(p)) + "</span>";
  }
  function fmtDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: lang === "my" ? "long" : "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) { return iso; }
  }
  function postUrl(id) {
    return location.origin + "/posts.html?post=" + id;
  }

  /* ================= AUTH STATE ================= */
  function loadMyProfile() {
    sb.from("profiles").select("*").eq("id", me.id).maybeSingle().then(function (r) {
      myProfile = r.data || null;
      updateUi();
      loadFeed(); /* refresh like states after login */
    });
  }

  sb.auth.onAuthStateChange(function (event, session) {
    me = session ? session.user : null;
    if (me) { loadMyProfile(); } else { myProfile = null; updateUi(); loadFeed(); }
  });

  function updateUi() {
    var authed = !!me;
    authBtn.style.display = authed ? "none" : "";
    sessionUser.style.display = authed ? "" : "none";
    composeBox.style.display = authed && myProfile && !myProfile.is_banned ? "" : "none";
    if (authed) {
      meName.textContent = (myProfile && (myProfile.display_name || myProfile.username)) || me.email || "user";
      if (myProfile && myProfile.avatar_url) {
        meAvatar.outerHTML = '<img class="avatar avatar-sm" id="meAvatar" src="' + esc(myProfile.avatar_url) + '" alt="" />';
        meAvatar = $("meAvatar");
      } else {
        meAvatar.textContent = letterOf(myProfile);
      }
      meLink.href = "profile.html?id=" + encodeURIComponent(me.id);
      adminStatus.textContent = myProfile && myProfile.is_banned
        ? t("Your account is banned — you can still read posts.", "မင်းရဲ့ အကောင့် ပိတ်ထားခံရပါတယ် — ဖတ်လို့တော့ရတယ်။") : "";
    } else {
      adminStatus.textContent = "";
    }
  }

  /* ================= AUTH MODAL ================= */
  function openAuth() {
    loginError.textContent = ""; regError.textContent = ""; regSuccess.textContent = "";
    loginPassword.value = "";
    authModal.classList.add("open");
    authModal.setAttribute("aria-hidden", "false");
    setTimeout(function () { loginEmail.focus(); }, 60);
  }
  function closeAuth() {
    authModal.classList.remove("open");
    authModal.setAttribute("aria-hidden", "true");
  }
  authBtn.addEventListener("click", openAuth);
  authClose.addEventListener("click", closeAuth);
  authModal.addEventListener("click", function (e) { if (e.target === authModal) closeAuth(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && authModal.classList.contains("open")) closeAuth();
  });

  function showTab(reg) {
    tabLogin.classList.toggle("active", !reg);
    tabRegister.classList.toggle("active", reg);
    loginForm.style.display = reg ? "none" : "";
    registerForm.style.display = reg ? "" : "none";
  }
  tabLogin.addEventListener("click", function () { showTab(false); });
  tabRegister.addEventListener("click", function () { showTab(true); });

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.textContent = "";
    var btn = loginForm.querySelector("button[type=submit]");
    var old = btn.textContent;
    btn.disabled = true; btn.textContent = t("Signing in...", "ဝင်နေသည်...");
    sb.auth.signInWithPassword({
      email: loginEmail.value.trim(),
      password: loginPassword.value
    }).then(function (res) {
      btn.disabled = false; btn.textContent = old;
      if (res.error) {
        var m = String((res.error && res.error.message) || "");
        if (/confirm/i.test(m)) {
          loginError.textContent = t("Email not confirmed yet — check your inbox (and spam).", "Email အတည်ပြုမပြီးသေးပါ — inbox (နဲ့ spam) စစ်ပါ။");
        } else if (/invalid/i.test(m)) {
          loginError.textContent = t("Wrong email or password.", "Email သို့မဟုတ် password မှားနေပါတယ်။");
        } else {
          loginError.textContent = m;
        }
        return;
      }
      closeAuth();
      loginForm.reset();
    });
  });

  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    regError.textContent = ""; regSuccess.textContent = "";
    var email = regEmail.value.trim();
    var password = regPassword.value;
    var name = regName.value.trim();
    if (password.length < 6) {
      regError.textContent = t("Password must be at least 6 characters.", "Password က အနည်းဆုံး ၆ လုံး ရှိရမယ်။");
      return;
    }
    var btn = registerForm.querySelector("button[type=submit]");
    var old = btn.textContent;
    btn.disabled = true; btn.textContent = t("Creating...", "ဖန်တီးနေသည်...");
    sb.auth.signUp({
      email: email,
      password: password,
      options: { data: { display_name: name } }
    }).then(function (res) {
      btn.disabled = false; btn.textContent = old;
      if (res.error) {
        var m = String((res.error && res.error.message) || "");
        if (/already registered|exists/i.test(m)) {
          regError.textContent = t("This email is already registered — try logging in.", "ဒီ email နဲ့ အကောင့် ရှိပြီးသားပါ — login ဝင်ကြည့်ပါ။");
        } else {
          regError.textContent = m;
        }
        return;
      }
      regError.textContent = "";
      regSuccess.textContent = t("Account created! A confirmation link was sent to your email. Check inbox (and spam), then log in.", "အကောင့် ဖန်တီးပြီးပါပြီ! အတည်ပြု link တစ်ခု မင်း email ကို ပို့ထားပါတယ်။ inbox (နဲ့ spam) စစ်ပြီး login ဝင်ပါ။");
      registerForm.reset();
      showTab(false);
    });
  });

  logoutBtn.addEventListener("click", function () {
    sb.auth.signOut();
  });

  /* ================= FEED ================= */
  function loadFeed() {
    sb.from("posts")
      .select("id, content, image_url, created_at, user_id, profiles(display_name, username, avatar_url, is_admin, is_banned)")
      .order("created_at", { ascending: false })
      .then(function (res) {
        if (res.error) {
          emptyNote.textContent = t("Could not load posts.", "Post တွေ ဖတ်လို့ မရဘူး။");
          emptyNote.style.display = "";
          return;
        }
        var posts = res.data || [];
        if (posts.length === 0) {
          emptyNote.textContent = t("No posts yet — be the first to post!", "Post မရှိသေးပါ — ပထမဆုံး post တင်လိုက်ပါ!");
          emptyNote.style.display = "";
          feed.innerHTML = "";
          return;
        }
        loadLikeData(posts, function (likeMap, myLikes) {
          renderFeed(posts, likeMap, myLikes);
        });
      });
  }

  function loadLikeData(posts, cb) {
    var ids = posts.map(function (p) { return p.id; });
    sb.from("likes").select("post_id, user_id").in("post_id", ids).then(function (r) {
      var map = {}; var mine = {};
      (r.data || []).forEach(function (l) {
        map[l.post_id] = (map[l.post_id] || 0) + 1;
        if (me && l.user_id === me.id) mine[l.post_id] = true;
      });
      cb(map, mine);
    });
  }

  function renderFeed(posts, likeMap, myLikes) {
    emptyNote.style.display = "none";
    feed.innerHTML = "";

    posts.forEach(function (p) {
      var pr = p.profiles || {};
      var card = document.createElement("article");
      card.className = "post-card";
      card.dataset.id = p.id;

      /* Author row */
      var author = document.createElement("div");
      author.className = "post-author";
      author.innerHTML =
        '<a class="author-avatar" href="profile.html?id=' + encodeURIComponent(p.user_id) + '">' +
          avatarHtml(pr, "avatar avatar-md") +
        "</a>" +
        '<div class="author-info">' +
          '<a class="author-name" href="profile.html?id=' + encodeURIComponent(p.user_id) + '">' +
            esc(pr.display_name || pr.username || "user") +
            (pr.is_admin ? ' <span class="admin-badge">ADMIN</span>' : "") +
          "</a>" +
          '<span class="author-handle">@' + esc(pr.username || "user") + " · " + esc(fmtDate(p.created_at)) + "</span>" +
        "</div>";
      card.appendChild(author);

      /* Content */
      var content = document.createElement("p");
      content.className = "post-content";
      content.textContent = p.content;
      card.appendChild(content);

      if (p.image_url) {
        var img = document.createElement("img");
        img.className = "post-image";
        img.src = p.image_url;
        img.alt = "Post image";
        img.loading = "lazy";
        card.appendChild(img);
      }

      /* Actions */
      var actions = document.createElement("div");
      actions.className = "post-actions";

      var likeBtn = document.createElement("button");
      likeBtn.type = "button";
      likeBtn.className = "action-btn" + (myLikes[p.id] ? " liked" : "");
      likeBtn.innerHTML = '<span class="action-icon">' + (myLikes[p.id] ? "❤️" : "🤍") + "</span><span class='action-count'>" + (likeMap[p.id] || 0) + "</span>";
      likeBtn.title = t("Like", "Like လုပ်ရန်");
      likeBtn.addEventListener("click", function () {
        if (!me) { openAuth(); return; }
        toggleLike(p.id, likeBtn);
      });
      actions.appendChild(likeBtn);

      var cmtBtn = document.createElement("button");
      cmtBtn.type = "button";
      cmtBtn.className = "action-btn";
      cmtBtn.innerHTML = "<span class='action-icon'>💬</span><span class='action-count cmt-count'>0</span>";
      cmtBtn.title = t("Comments", "Comment များ");
      cmtBtn.addEventListener("click", function () {
        toggleComments(p.id, card);
      });
      actions.appendChild(cmtBtn);

      var shareBtn = document.createElement("button");
      shareBtn.type = "button";
      shareBtn.className = "action-btn";
      shareBtn.innerHTML = "<span class='action-icon'>📤</span>";
      shareBtn.title = t("Share", "Share လုပ်ရန်");
      shareBtn.addEventListener("click", function () {
        sharePost(p);
      });
      actions.appendChild(shareBtn);

      card.appendChild(actions);

      /* Comments area (hidden) */
      var cmtArea = document.createElement("div");
      cmtArea.className = "comments-area";
      cmtArea.style.display = "none";
      var cmtList = document.createElement("div");
      cmtList.className = "comments-list";
      cmtArea.appendChild(cmtList);
      card.appendChild(cmtArea);

      feed.appendChild(card);

      /* comment count */
      sb.from("comments").select("id").eq("post_id", p.id).then(function (r) {
        cmtBtn.querySelector(".cmt-count").textContent = r.data ? r.data.length : 0;
      });
    });

    /* Deep link highlight */
    var params = new URLSearchParams(location.search);
    var focusId = params.get("post");
    if (focusId) {
      var target = feed.querySelector('[data-id="' + focusId + '"]');
      if (target) {
        target.classList.add("highlight");
        setTimeout(function () {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
      }
    }
  }

  /* ---------- Likes ---------- */
  function toggleLike(postId, btn) {
    var liked = btn.classList.contains("liked");
    var countEl = btn.querySelector(".action-count");
    var n = parseInt(countEl.textContent, 10) || 0;
    btn.classList.toggle("liked", !liked);
    btn.querySelector(".action-icon").textContent = liked ? "🤍" : "❤️";
    countEl.textContent = liked ? Math.max(0, n - 1) : n + 1;

    if (liked) {
      sb.from("likes").delete().eq("post_id", postId).eq("user_id", me.id).then(function (r) {
        if (r.error) { btn.classList.toggle("liked", liked); countEl.textContent = n; }
      });
    } else {
      sb.from("likes").insert({ post_id: postId, user_id: me.id }).then(function (r) {
        if (r.error) { btn.classList.toggle("liked", liked); countEl.textContent = n; }
      });
    }
  }

  /* ---------- Comments ---------- */
  var openCommentCard = null;
  function toggleComments(postId, card) {
    var area = card.querySelector(".comments-area");
    if (area.style.display === "none") {
      if (openCommentCard && openCommentCard !== card) {
        openCommentCard.querySelector(".comments-area").style.display = "none";
      }
      area.style.display = "";
      openCommentCard = card;
      loadComments(postId, area);
    } else {
      area.style.display = "none";
      if (openCommentCard === card) openCommentCard = null;
    }
  }

  function loadComments(postId, area) {
    var list = area.querySelector(".comments-list");
    list.innerHTML = '<p class="comments-loading">…</p>';
    sb.from("comments")
      .select("id, content, created_at, user_id, profiles(display_name, username, avatar_url, is_admin)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .then(function (res) {
        list.innerHTML = "";
        if (res.error) { list.innerHTML = '<p class="comments-loading">' + t("Could not load comments.", "Comment ဖတ်လို့ မရဘူး။") + "</p>"; return; }
        var comments = res.data || [];
        if (comments.length === 0) {
          list.innerHTML = '<p class="comments-loading">' + t("No comments yet.", "Comment မရှိသေးပါ။") + "</p>";
        }
        comments.forEach(function (c) {
          var cpr = c.profiles || {};
          var row = document.createElement("div");
          row.className = "comment-item";
          row.innerHTML =
            avatarHtml(cpr, "avatar avatar-xs") +
            '<div class="comment-body">' +
              '<span class="comment-author">' + esc(cpr.display_name || cpr.username || "user") + "</span>" +
              '<p class="comment-text"></p>' +
              '<span class="comment-time">' + esc(fmtDate(c.created_at)) + "</span>" +
            "</div>";
          row.querySelector(".comment-text").textContent = c.content;
          if (me && (c.user_id === me.id || myProfile && myProfile.is_admin)) {
            var del = document.createElement("button");
            del.type = "button";
            del.className = "comment-del";
            del.textContent = "×";
            del.title = t("Delete", "ဖျက်မည်");
            del.addEventListener("click", function () {
              sb.from("comments").delete().eq("id", c.id).then(function (r) {
                if (!r.error) row.remove();
              });
            });
            row.appendChild(del);
          }
          list.appendChild(row);
        });

        /* add-comment input (only when logged in and not banned) */
        if (me && myProfile && !myProfile.is_banned) {
          var form = document.createElement("form");
          form.className = "comment-form";
          var input = document.createElement("input");
          input.type = "text";
          input.placeholder = t("Write a comment...", "Comment ရေးပါ...");
          input.autocomplete = "off";
          var btn = document.createElement("button");
          btn.type = "submit";
          btn.textContent = t("Send", "ပို့မည်");
          form.appendChild(input);
          form.appendChild(btn);
          form.addEventListener("submit", function (e) {
            e.preventDefault();
            var val = input.value.trim();
            if (!val) return;
            sb.from("comments").insert({ post_id: postId, user_id: me.id, content: val }).then(function (r) {
              if (r.error) return;
              input.value = "";
              loadComments(postId, area);
              var cnt = area.parentElement.querySelector(".cmt-count");
              if (cnt) cnt.textContent = (parseInt(cnt.textContent, 10) || 0) + 1;
            });
          });
          list.appendChild(form);
        } else if (!me) {
          var hint = document.createElement("p");
          hint.className = "comments-loading";
          var a = document.createElement("a");
          a.href = "#";
          a.textContent = t("Log in to comment", "Comment ရေးဖို့ login ဝင်ပါ");
          a.addEventListener("click", function (e) { e.preventDefault(); openAuth(); });
          hint.appendChild(a);
          list.appendChild(hint);
        }
      });
  }

  /* ---------- Share ---------- */
  function sharePost(p) {
    var url = postUrl(p.id);
    var text = t("Check this post on KXK", "KXK မှာ ဒီ post လေး ကြည့်ပါ");
    if (navigator.share) {
      navigator.share({ title: "KXK", text: text, url: url }).catch(function () {});
      return;
    }
    /* Fallback: copy link */
    function copy() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(url).then(function () { return true; });
      }
      var ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      ta.remove();
      return Promise.resolve(ok);
    }
    copy().then(function () {
      setStatus(t("Link copied ✓", "Link ကော်ပီရပြီ ✓"));
    });
  }

  /* ---------- Compose ---------- */
  postText.placeholder = t("Share something...", "ဘာတွေ ဖြစ်ပျက်နေလဲ ရေးပါ...");
  postImage.addEventListener("change", function () {
    var f = postImage.files && postImage.files[0];
    fileName.textContent = f ? f.name : "";
  });

  function setStatus(msg, isError) {
    adminStatus.textContent = msg || "";
    adminStatus.style.color = isError ? "#dc2626" : "";
  }

  submitBtn.addEventListener("click", function () {
    var text = postText.value.trim();
    var file = postImage.files && postImage.files[0];
    if (!me) { openAuth(); return; }
    if (!text && !file) { setStatus(t("Write something first.", "စာတစ်ခုခု အရင်ရေးပါ။"), true); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = t("Posting...", "တင်နေသည်...");

    function done() {
      submitBtn.disabled = false;
      submitBtn.textContent = t("Post", "တင်မည်");
    }

    function insertRow(imageUrl) {
      var payload = { content: text || "📷", user_id: me.id };
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
        loadFeed();
      });
    }

    if (file) {
      var path = "posts/" + me.id + "/" + Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      sb.storage.from("post-images").upload(path, file).then(function (res) {
        if (res.error) {
          done();
          setStatus(t("Image upload failed — try a smaller image.", "ပုံတင်လို့ မရဘူး — ပုံသေးသေးတစ်ခု စမ်းကြည့်ပါ။"), true);
          return;
        }
        insertRow(sb.storage.from("post-images").getPublicUrl(path).data.publicUrl);
      });
    } else {
      insertRow(null);
    }
  });

  /* ---------- Boot ---------- */
  sb.auth.getSession().then(function (r) {
    me = r.data.session ? r.data.session.user : null;
    if (me) { loadMyProfile(); } else { updateUi(); loadFeed(); }
  });
})();

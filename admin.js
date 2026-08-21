/* =========================================================
   Admin panel (admin.html) — admin only
   - Users: list (edge function), ban/unban, delete
   - Posts: recent list + delete
   - Comments: recent list + delete
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
  var loginBox = $("loginBox");
  var aEmail = $("aEmail");
  var aPass = $("aPass");
  var aError = $("aError");
  var aLogin = $("aLogin");
  var deniedBox = $("deniedBox");
  var panel = $("panel");
  var usersBody = $("usersBody");
  var postsPanel = $("postsPanel");
  var commentsPanel = $("commentsPanel");
  var aStatus = $("aStatus");
  var aLogout = $("aLogout");

  if (!READY) {
    if (setupNote) setupNote.style.display = "";
    return;
  }

  var sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  var me = null;
  var isAdmin = false;

  function setStatus(msg, isError) {
    aStatus.textContent = msg || "";
    aStatus.style.color = isError ? "#dc2626" : "";
  }
  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }
  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return iso || "—"; }
  }
  function letterOf(u) {
    var s = (u && (u.display_name || u.username || u.email || "?").charAt(0)) || "?";
    return String(s).toUpperCase();
  }

  /* ---------- Session / admin check ---------- */
  function onSession() {
    var authed = !!me;
    loginBox.style.display = authed ? "none" : "";
    deniedBox.style.display = "none";
    panel.style.display = "none";
    if (!authed) return;

    sb.from("profiles").select("is_admin").eq("id", me.id).maybeSingle().then(function (r) {
      isAdmin = !!(r.data && r.data.is_admin);
      if (!isAdmin) { deniedBox.style.display = ""; return; }
      panel.style.display = "";
      loadUsers();
      loadPosts();
      loadComments();
    });
  }

  sb.auth.onAuthStateChange(function (event, session) {
    me = session ? session.user : null;
    onSession();
  });

  aLogin.addEventListener("click", function () {
    aError.textContent = "";
    aLogin.disabled = true;
    sb.auth.signInWithPassword({ email: aEmail.value.trim(), password: aPass.value }).then(function (res) {
      aLogin.disabled = false;
      if (res.error) { aError.textContent = t("Wrong email or password.", "Email သို့မဟုတ် password မှားနေပါတယ်။"); }
    });
  });

  aLogout.addEventListener("click", function () { sb.auth.signOut(); });

  /* ---------- Tabs ---------- */
  function showPanel(which) {
    $("tabUsers").classList.toggle("active", which === "users");
    $("tabPosts").classList.toggle("active", which === "posts");
    $("tabComments").classList.toggle("active", which === "comments");
    $("usersPanel").style.display = which === "users" ? "" : "none";
    postsPanel.style.display = which === "posts" ? "" : "none";
    commentsPanel.style.display = which === "comments" ? "" : "none";
  }
  $("tabUsers").addEventListener("click", function () { showPanel("users"); });
  $("tabPosts").addEventListener("click", function () { showPanel("posts"); });
  $("tabComments").addEventListener("click", function () { showPanel("comments"); });

  /* ---------- Users ---------- */
  function loadUsers() {
    usersBody.innerHTML = '<tr><td colspan="6" class="table-empty">' + t("Loading...", "ဖတ်နေသည်...") + "</td></tr>";
    sb.functions.invoke("admin", { body: { action: "listUsers" } }).then(function (res) {
      if (res.error) {
        var msg = String((res.error && res.error.message) || "");
        usersBody.innerHTML = '<tr><td colspan="6" class="table-empty">' +
          esc(t("Could not load users. Is the edge function deployed? (SUPABASE-SETUP-V2.md Step 3)", "User ဖတ်လို့ မရဘူး။ Edge function deploy ဖြစ်ပြီလား? (SUPABASE-SETUP-V2.md Step 3)")) +
          (msg ? " — " + esc(msg) : "") + "</td></tr>";
        return;
      }
      var users = (res.data && res.data.users) || [];
      usersBody.innerHTML = "";
      if (!users.length) {
        usersBody.innerHTML = '<tr><td colspan="6" class="table-empty">' + t("No users yet.", "User မရှိသေးပါ။") + "</td></tr>";
        return;
      }
      users.forEach(function (u) {
        var pr = u.profile || {};
        var tr = document.createElement("tr");

        var userCell = document.createElement("td");
        userCell.innerHTML =
          '<span class="avatar avatar-xs ' + (pr.avatar_url ? "" : "avatar-letter") + '"' + (pr.avatar_url ? ' style="background-image:url(' + esc(pr.avatar_url) + ');background-size:cover;"' : "") + ">" +
          (pr.avatar_url ? "" : esc(letterOf(pr))) + "</span>" +
          "<span>" + esc(pr.display_name || pr.username || "—") +
          (pr.is_admin ? ' <span class="admin-badge">ADMIN</span>' : "") +
          "<small> @" + esc(pr.username || "—") + "</small></span>";
        tr.appendChild(userCell);

        var emailCell = document.createElement("td");
        emailCell.textContent = u.email || "—";
        tr.appendChild(emailCell);

        var joinedCell = document.createElement("td");
        joinedCell.textContent = fmtDate(u.created_at);
        tr.appendChild(joinedCell);

        var confCell = document.createElement("td");
        confCell.textContent = u.confirmed_at ? "✓" : "✗";
        tr.appendChild(confCell);

        var statusCell = document.createElement("td");
        statusCell.textContent = u.banned_until || (pr.is_banned ? t("Banned", "ပိတ်ထားသည်") : t("Active", "ပုံမှန်"));
        tr.appendChild(statusCell);

        var actCell = document.createElement("td");
        actCell.className = "admin-actions";

        if (!pr.is_admin) {
          var ban = document.createElement("button");
          ban.type = "button";
          ban.className = "delete-btn";
          ban.textContent = pr.is_banned ? t("Unban", "Unban") : t("Ban", "Ban");
          ban.addEventListener("click", function () {
            sb.from("profiles").update({ is_banned: !pr.is_banned }).eq("id", u.id).then(function (r) {
              if (r.error) { setStatus(t("Action failed.", "မအောင်မြင်ပါ။"), true); return; }
              loadUsers();
            });
          });
          actCell.appendChild(ban);

          var del = document.createElement("button");
          del.type = "button";
          del.className = "delete-btn";
          del.textContent = t("Delete", "ဖျက်မည်");
          del.addEventListener("click", function () {
            if (!window.confirm(t("Delete this user and all their data?", "ဒီ user နဲ့ သူ့ဒေတာတွေအကုန် ဖျက်မှာလား?"))) return;
            sb.functions.invoke("admin", { body: { action: "deleteUser", id: u.id } }).then(function (r) {
              if (r.error) { setStatus(t("Delete failed.", "ဖျက်လို့ မရဘူး။"), true); return; }
              loadUsers();
            });
          });
          actCell.appendChild(del);
        } else {
          actCell.textContent = "—";
        }

        tr.appendChild(actCell);
        usersBody.appendChild(tr);
      });
    });
  }

  /* ---------- Posts ---------- */
  function loadPosts() {
    postsPanel.innerHTML = '<p class="table-empty">' + t("Loading...", "ဖတ်နေသည်...") + "</p>";
    sb.from("posts")
      .select("id, content, created_at, user_id, profiles(display_name, username)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(function (res) {
        postsPanel.innerHTML = "";
        if (res.error) { postsPanel.innerHTML = '<p class="table-empty">' + t("Could not load.", "ဖတ်လို့ မရဘူး။") + "</p>"; return; }
        var posts = res.data || [];
        if (!posts.length) { postsPanel.innerHTML = '<p class="table-empty">' + t("No posts yet.", "Post မရှိသေးပါ။") + "</p>"; return; }
        posts.forEach(function (p) {
          var pr = p.profiles || {};
          var row = document.createElement("div");
          row.className = "admin-item";
          row.innerHTML =
            "<strong>" + esc(pr.display_name || pr.username || "user") + "</strong> " +
            '<span class="post-date">' + esc(fmtDate(p.created_at)) + "</span>" +
            '<p class="post-content"></p>';
          row.querySelector(".post-content").textContent = p.content;
          var del = document.createElement("button");
          del.type = "button";
          del.className = "delete-btn";
          del.textContent = t("Delete post", "Post ဖျက်မည်");
          del.addEventListener("click", function () {
            if (!window.confirm(t("Delete this post?", "ဒီ post ကို ဖျက်မှာလား?"))) return;
            sb.from("posts").delete().eq("id", p.id).then(function (r) {
              if (!r.error) loadPosts();
            });
          });
          row.appendChild(del);
          postsPanel.appendChild(row);
        });
      });
  }

  /* ---------- Comments ---------- */
  function loadComments() {
    commentsPanel.innerHTML = '<p class="table-empty">' + t("Loading...", "ဖတ်နေသည်...") + "</p>";
    sb.from("comments")
      .select("id, content, created_at, user_id, post_id, profiles(display_name, username)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(function (res) {
        commentsPanel.innerHTML = "";
        if (res.error) { commentsPanel.innerHTML = '<p class="table-empty">' + t("Could not load.", "ဖတ်လို့ မရဘူး။") + "</p>"; return; }
        var comments = res.data || [];
        if (!comments.length) { commentsPanel.innerHTML = '<p class="table-empty">' + t("No comments yet.", "Comment မရှိသေးပါ။") + "</p>"; return; }
        comments.forEach(function (c) {
          var pr = c.profiles || {};
          var row = document.createElement("div");
          row.className = "admin-item";
          row.innerHTML =
            "<strong>" + esc(pr.display_name || pr.username || "user") + "</strong> " +
            '<span class="post-date">' + esc(fmtDate(c.created_at)) + "</span>" +
            '<p class="post-content"></p>';
          row.querySelector(".post-content").textContent = c.content;
          var del = document.createElement("button");
          del.type = "button";
          del.className = "delete-btn";
          del.textContent = t("Delete comment", "Comment ဖျက်မည်");
          del.addEventListener("click", function () {
            if (!window.confirm(t("Delete this comment?", "ဒီ comment ကို ဖျက်မှာလား?"))) return;
            sb.from("comments").delete().eq("id", c.id).then(function (r) {
              if (!r.error) loadComments();
            });
          });
          row.appendChild(del);
          commentsPanel.appendChild(row);
        });
      });
  }

  /* ---------- Boot ---------- */
  sb.auth.getSession().then(function (r) {
    me = r.data.session ? r.data.session.user : null;
    onSession();
  });
})();

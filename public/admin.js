import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://edfvxbfzvzfeqcutpzhk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_vJx36vqFzXH8JKAVBEFivA_0n4FjsM8";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

const authPanel =
  document.querySelector("#adminAuthPanel");
const deniedPanel =
  document.querySelector("#adminDeniedPanel");
const deniedMessage =
  document.querySelector("#adminDeniedMessage");
const mfaPanel =
  document.querySelector("#adminMfaPanel");
const mfaExisting =
  document.querySelector("#adminMfaExisting");
const mfaEnroll =
  document.querySelector("#adminMfaEnroll");
const mfaQr =
  document.querySelector("#adminMfaQr");
const mfaSecret =
  document.querySelector("#adminMfaSecret");
const mfaForm =
  document.querySelector("#adminMfaForm");
const mfaCode =
  document.querySelector("#adminMfaCode");
const moderationPanel =
  document.querySelector("#adminModerationPanel");
const signInForm =
  document.querySelector("#adminSignInForm");
const adminEmail =
  document.querySelector("#adminEmail");
const signOutButton =
  document.querySelector("#adminSignOutButton");
const typeSelect =
  document.querySelector("#adminContentType");
const statusSelect =
  document.querySelector("#adminContentStatus");
const refreshButton =
  document.querySelector("#adminRefreshButton");
const contentList =
  document.querySelector("#adminContentList");
const message =
  document.querySelector("#adminMessage");

let currentSession = null;
let mfaFactorId = null;

function showOnly(panel) {
  for (const item of [
    authPanel,
    deniedPanel,
    mfaPanel,
    moderationPanel
  ]) {
    item.classList.toggle(
      "hidden",
      item !== panel
    );
  }
}

function showMessage(text, success = false) {
  message.textContent = text;
  message.className =
    success
      ? "message success"
      : "message";
}

function clearMessage() {
  message.textContent = "";
  message.className = "message hidden";
}

async function api(path, options = {}) {
  const token =
    currentSession?.access_token;

  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response =
    await fetch(path, {
      ...options,
      headers
    });

  let result = {};

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  return {
    response,
    result
  };
}

async function loadSession() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  currentSession = session;
  signOutButton.classList.toggle(
    "hidden",
    !session
  );

  return session;
}

async function verifyMfaCode(code) {
  if (!mfaFactorId) {
    throw new Error(
      "No authenticator factor is available."
    );
  }

  const challenge =
    await supabase.auth.mfa.challenge({
      factorId: mfaFactorId
    });

  if (challenge.error) {
    throw challenge.error;
  }

  const verification =
    await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId:
        challenge.data.id,
      code
    });

  if (verification.error) {
    throw verification.error;
  }

  await supabase.auth.refreshSession();
  await loadSession();
}

async function prepareMfa() {
  clearMessage();

  const factors =
    await supabase.auth.mfa.listFactors();

  if (factors.error) {
    throw factors.error;
  }

  const totpFactors =
    Array.isArray(factors.data?.totp)
      ? factors.data.totp
      : [];

  const verified =
    totpFactors.find(
      (factor) =>
        factor.status === "verified"
    );

  if (verified) {
    mfaFactorId = verified.id;
    mfaExisting.classList.remove("hidden");
    mfaEnroll.classList.add("hidden");
    mfaCode.value = "";
    mfaCode.focus();
    return;
  }

  for (const factor of totpFactors) {
    if (factor.status !== "verified") {
      await supabase.auth.mfa.unenroll({
        factorId: factor.id
      });
    }
  }

  const enrollment =
    await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName:
        "Project Meaningful Admin"
    });

  if (enrollment.error) {
    throw enrollment.error;
  }

  mfaFactorId =
    enrollment.data.id;

  mfaQr.src =
    enrollment.data.totp.qr_code;

  mfaSecret.textContent =
    enrollment.data.totp.secret;

  mfaExisting.classList.add("hidden");
  mfaEnroll.classList.remove("hidden");
  mfaCode.value = "";
  mfaCode.focus();
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(date);
}

function renderAdminItem(item) {
  const article =
    document.createElement("article");

  article.className =
    "admin-content-item";

  const meta =
    document.createElement("div");

  meta.className =
    "admin-content-meta";

  const username =
    document.createElement("strong");

  username.textContent =
    `@${item.username}`;

  const details =
    document.createElement("span");

  details.textContent =
    [
      item.category,
      formatDate(item.createdAt)
    ]
      .filter(Boolean)
      .join(" · ");

  meta.append(
    username,
    details
  );

  const text =
    document.createElement("p");

  text.textContent = item.text;

  const actions =
    document.createElement("div");

  actions.className =
    "admin-content-actions";

  if (item.status === "pending") {
    const publish =
      document.createElement("button");

    publish.className =
      "primary-button";
    publish.type = "button";
    publish.textContent = "Publish";
    publish.addEventListener(
      "click",
      () =>
        moderateItem(
          item,
          "published"
        )
    );

    const reject =
      document.createElement("button");

    reject.className =
      "secondary-button";
    reject.type = "button";
    reject.textContent = "Reject";
    reject.addEventListener(
      "click",
      () =>
        moderateItem(
          item,
          "rejected"
        )
    );

    actions.append(
      publish,
      reject
    );
  } else if (
    item.status === "published"
  ) {
    const remove =
      document.createElement("button");

    remove.className =
      "secondary-button";
    remove.type = "button";
    remove.textContent =
      "Remove from public feed";
    remove.addEventListener(
      "click",
      () =>
        moderateItem(
          item,
          "rejected"
        )
    );

    actions.append(remove);
  }

  article.append(
    meta,
    text,
    actions
  );

  return article;
}

async function loadContent() {
  clearMessage();

  contentList.replaceChildren();

  const loading =
    document.createElement("p");

  loading.className =
    "empty-state";
  loading.textContent =
    "Loading…";

  contentList.append(loading);

  const params =
    new URLSearchParams({
      type: typeSelect.value,
      status: statusSelect.value
    });

  const {
    response,
    result
  } = await api(
    `/api/admin/content?${params.toString()}`
  );

  if (!response.ok) {
    if (
      result.code ===
      "MFA_REQUIRED"
    ) {
      showOnly(mfaPanel);
      await prepareMfa();
      return;
    }

    contentList.replaceChildren();
    showMessage(
      result.error ||
        "Unable to load moderation content."
    );
    return;
  }

  contentList.replaceChildren();

  const items =
    Array.isArray(result.items)
      ? result.items
      : [];

  if (items.length === 0) {
    const empty =
      document.createElement("p");

    empty.className =
      "empty-state";
    empty.textContent =
      "Nothing in this view.";

    contentList.append(empty);
    return;
  }

  const fragment =
    document.createDocumentFragment();

  for (const item of items) {
    fragment.append(
      renderAdminItem(item)
    );
  }

  contentList.append(fragment);
}

async function moderateItem(
  item,
  nextStatus
) {
  clearMessage();

  const {
    response,
    result
  } = await api(
    "/api/admin/moderate",
    {
      method: "POST",
      headers: {
        "content-type":
          "application/json"
      },
      body:
        JSON.stringify({
          type: item.type,
          id: item.id,
          status: nextStatus
        })
    }
  );

  if (!response.ok) {
    showMessage(
      result.error ||
        "The moderation change failed."
    );
    return;
  }

  showMessage(
    nextStatus === "published"
      ? "Published."
      : "Removed from the public feed.",
    true
  );

  await loadContent();
}

async function loadAdmin() {
  clearMessage();

  const session =
    await loadSession();

  if (!session) {
    showOnly(authPanel);
    return;
  }

  const {
    response,
    result
  } = await api(
    "/api/admin/status"
  );

  if (!response.ok) {
    deniedMessage.textContent =
      result.error ||
      "Admin access is not enabled for this account.";

    showOnly(deniedPanel);
    return;
  }

  if (result.mfaRequired) {
    showOnly(mfaPanel);

    try {
      await prepareMfa();
    } catch (error) {
      console.error(
        "MFA setup failed:",
        error
      );

      showMessage(
        "Unable to prepare multi-factor authentication."
      );
    }

    return;
  }

  showOnly(moderationPanel);
  await loadContent();
}

signInForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    clearMessage();

    const email =
      adminEmail.value.trim();

    try {
      const response =
        await fetch(
          "/api/auth/request",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json"
            },
            body:
              JSON.stringify({
                mode: "existing",
                email,
                redirectPath:
                  "/admin.html"
              })
          }
        );

      const result =
        await response.json();

      if (response.status === 429) {
        showMessage(
          result.error ||
            "Please wait before requesting another sign-in link."
        );
        return;
      }

      showMessage(
        "If that email belongs to an authorized account, a secure sign-in link will be sent.",
        true
      );
    } catch (error) {
      console.error(
        "Admin sign-in failed:",
        error
      );

      showMessage(
        "Unable to request a sign-in link."
      );
    }
  }
);

mfaForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    clearMessage();

    const code =
      mfaCode.value.trim();

    if (!/^[0-9]{6}$/.test(code)) {
      showMessage(
        "Enter the six-digit code from your authenticator app."
      );
      return;
    }

    try {
      await verifyMfaCode(code);
      await loadAdmin();
    } catch (error) {
      console.error(
        "MFA verification failed:",
        error
      );

      showMessage(
        "That authenticator code could not be verified."
      );
    }
  }
);

typeSelect.addEventListener(
  "change",
  loadContent
);

statusSelect.addEventListener(
  "change",
  loadContent
);

refreshButton.addEventListener(
  "click",
  loadContent
);

signOutButton.addEventListener(
  "click",
  async () => {
    await supabase.auth.signOut();
    currentSession = null;
    showOnly(authPanel);
  }
);

supabase.auth.onAuthStateChange(
  async (_event, session) => {
    currentSession = session;
  }
);

await loadAdmin();

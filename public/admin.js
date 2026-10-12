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
const mfaCopyKey =
  document.querySelector("#adminMfaCopyKey");
const mfaOpenLink =
  document.querySelector("#adminMfaOpenLink");
const mfaRegenerate =
  document.querySelector("#adminMfaRegenerate");
const mfaForm =
  document.querySelector("#adminMfaForm");
const mfaCode =
  document.querySelector("#adminMfaCode");
const moderationPanel =
  document.querySelector("#adminModerationPanel");
const moderationTab =
  document.querySelector("#adminModerationTab");
const participantsTab =
  document.querySelector("#adminParticipantsTab");
const moderationView =
  document.querySelector("#adminModerationView");
const participantsView =
  document.querySelector("#adminParticipantsView");
const participantsRefreshButton =
  document.querySelector("#adminParticipantsRefreshButton");
const participantCount =
  document.querySelector("#adminParticipantCount");
const participantsList =
  document.querySelector("#adminParticipantsList");
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

  const verification =
    await supabase.auth.mfa.challengeAndVerify({
      factorId: mfaFactorId,
      code
    });

  if (verification.error) {
    throw verification.error;
  }

  await supabase.auth.refreshSession();
  await loadSession();
}

async function clearUnverifiedTotpFactors() {
  const factors =
    await supabase.auth.mfa.listFactors();

  if (factors.error) {
    throw factors.error;
  }

  const totpFactors =
    Array.isArray(factors.data?.totp)
      ? factors.data.totp
      : [];

  for (const factor of totpFactors) {
    if (factor.status !== "verified") {
      const result =
        await supabase.auth.mfa.unenroll({
          factorId: factor.id
        });

      if (result.error) {
        throw result.error;
      }
    }
  }

  return totpFactors;
}

async function enrollNewTotp() {
  clearMessage();

  await clearUnverifiedTotpFactors();

  const enrollment =
    await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer:
        "Project Meaningful",
      friendlyName:
        "Project Meaningful Admin"
    });

  if (enrollment.error) {
    throw enrollment.error;
  }

  mfaFactorId =
    enrollment.data.id;

  const totp =
    enrollment.data.totp;

  mfaQr.src =
    totp.qr_code;

  mfaSecret.textContent =
    totp.secret;

  if (totp.uri) {
    mfaOpenLink.href =
      totp.uri;
    mfaOpenLink.classList.remove(
      "hidden"
    );
  } else {
    mfaOpenLink.classList.add(
      "hidden"
    );
    mfaOpenLink.removeAttribute(
      "href"
    );
  }

  mfaExisting.classList.add("hidden");
  mfaEnroll.classList.remove("hidden");
  mfaCode.value = "";
  mfaCode.focus();
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

  await enrollNewTotp();
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

function setAdminView(view) {
  const showingParticipants =
    view === "participants";

  moderationView.classList.toggle(
    "hidden",
    showingParticipants
  );

  participantsView.classList.toggle(
    "hidden",
    !showingParticipants
  );

  moderationTab.setAttribute(
    "aria-selected",
    String(!showingParticipants)
  );

  participantsTab.setAttribute(
    "aria-selected",
    String(showingParticipants)
  );

  moderationTab.classList.toggle(
    "is-active",
    !showingParticipants
  );

  participantsTab.classList.toggle(
    "is-active",
    showingParticipants
  );
}

function renderParticipant(participant) {
  const article =
    document.createElement("article");

  article.className =
    "admin-participant-item";

  const heading =
    document.createElement("div");

  heading.className =
    "admin-participant-heading";

  const username =
    document.createElement("strong");

  username.textContent =
    `@${participant.username || "unknown"}`;

  const badges =
    document.createElement("div");

  badges.className =
    "admin-participant-badges";

  if (participant.isAdmin) {
    const adminBadge =
      document.createElement("span");

    adminBadge.className =
      "admin-participant-badge";

    adminBadge.textContent =
      "Admin";

    badges.append(adminBadge);
  }

  heading.append(
    username,
    badges
  );

  const email =
    document.createElement("div");

  email.className =
    "admin-participant-email";

  email.textContent =
    participant.email || "No email available";

  const meta =
    document.createElement("div");

  meta.className =
    "admin-participant-meta";

  const joined =
    document.createElement("span");

  joined.textContent =
    `Joined ${formatDate(participant.profileCreatedAt || participant.accountCreatedAt)}`;

  const counts =
    document.createElement("span");

  counts.textContent =
    `${participant.actionCount || 0} Actions · ${participant.discoveryCount || 0} Discoveries`;

  meta.append(
    joined,
    counts
  );

  article.append(
    heading,
    email,
    meta
  );

  return article;
}

async function loadParticipants() {
  clearMessage();

  participantsList.replaceChildren();

  const loading =
    document.createElement("p");

  loading.className =
    "empty-state";

  loading.textContent =
    "Loading participants…";

  participantsList.append(loading);

  const {
    response,
    result
  } = await api(
    "/api/admin/participants"
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

    participantsList.replaceChildren();

    showMessage(
      result.error ||
        "Unable to load participants."
    );

    return;
  }

  participantCount.textContent =
    result.summary?.registeredParticipants ?? 0;

  participantsList.replaceChildren();

  const participants =
    Array.isArray(result.participants)
      ? result.participants
      : [];

  if (participants.length === 0) {
    const empty =
      document.createElement("p");

    empty.className =
      "empty-state";

    empty.textContent =
      "No confirmed participants yet.";

    participantsList.append(empty);
    return;
  }

  const fragment =
    document.createDocumentFragment();

  for (const participant of participants) {
    fragment.append(
      renderParticipant(participant)
    );
  }

  participantsList.append(fragment);
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
  setAdminView("moderation");
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

mfaCopyKey.addEventListener(
  "click",
  async () => {
    const secret =
      mfaSecret.textContent.trim();

    if (!secret) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        secret
      );

      showMessage(
        "Setup key copied.",
        true
      );
    } catch (error) {
      console.error(
        "Copy setup key failed:",
        error
      );

      showMessage(
        "Copy was blocked by the browser. Select the setup key and copy it manually."
      );
    }
  }
);

mfaRegenerate.addEventListener(
  "click",
  async () => {
    clearMessage();

    try {
      await enrollNewTotp();

      showMessage(
        "A new setup code was generated. Add this new code to your authenticator app; the previous unverified code is no longer valid.",
        true
      );
    } catch (error) {
      console.error(
        "MFA regeneration failed:",
        error
      );

      showMessage(
        "Unable to generate a new authenticator setup code."
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

moderationTab.addEventListener(
  "click",
  async () => {
    setAdminView("moderation");
    await loadContent();
  }
);

participantsTab.addEventListener(
  "click",
  async () => {
    setAdminView("participants");
    await loadParticipants();
  }
);

participantsRefreshButton.addEventListener(
  "click",
  loadParticipants
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

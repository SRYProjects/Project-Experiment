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

let currentSession = null;

/* -------------------------
   ELEMENTS
------------------------- */

const authDialog =
  document.querySelector("#authDialog");

const actionDialog =
  document.querySelector("#actionDialog");

const discoveryDialog =
  document.querySelector("#discoveryDialog");

const updatesDialog =
  document.querySelector("#updatesDialog");

const recordDialog =
  document.querySelector("#recordDialog");

const appUpdatesButton =
  document.querySelector("#appUpdatesButton");

const closeUpdatesDialog =
  document.querySelector("#closeUpdatesDialog");

const closeUpdatesDialogButton =
  document.querySelector("#closeUpdatesDialogButton");

const closeRecordDialog =
  document.querySelector("#closeRecordDialog");

const recordPublishedActions =
  document.querySelector("#recordPublishedActions");

const recordPublishedDays =
  document.querySelector("#recordPublishedDays");

const recordFeed =
  document.querySelector("#recordFeed");

const recordLogActionButton =
  document.querySelector("#recordLogActionButton");

const communityRecordButton =
  document.querySelector("#communityRecordButton");

const railTotalActions =
  document.querySelector("#railTotalActions");

const railParticipants =
  document.querySelector("#railParticipants");

const railTodayActions =
  document.querySelector("#railTodayActions");

const participateButton =
  document.querySelector("#participateButton");

const joinProjectButton =
  document.querySelector("#joinProjectButton");

const closeDialog =
  document.querySelector("#closeDialog");

const closeActionDialog =
  document.querySelector("#closeActionDialog");

const closeDiscoveryDialog =
  document.querySelector("#closeDiscoveryDialog");

const shareDiscoveryButton =
  document.querySelector("#shareDiscoveryButton");

const discoveryEntryState =
  document.querySelector("#discoveryEntryState");

const discoveryPublishedState =
  document.querySelector("#discoveryPublishedState");

const discoveryPendingState =
  document.querySelector("#discoveryPendingState");

const discoveryForm =
  document.querySelector("#discoveryForm");

const discoveryText =
  document.querySelector("#discoveryText");

const discoveryCharacterCount =
  document.querySelector("#discoveryCharacterCount");

const discoveryMessage =
  document.querySelector("#discoveryMessage");

const submitDiscoveryButton =
  document.querySelector("#submitDiscoveryButton");

const viewPublishedDiscoveryButton =
  document.querySelector("#viewPublishedDiscoveryButton");

const shareAnotherDiscoveryButton =
  document.querySelector("#shareAnotherDiscoveryButton");

const shareAnotherPendingDiscoveryButton =
  document.querySelector("#shareAnotherPendingDiscoveryButton");

const closePendingDiscoveryButton =
  document.querySelector("#closePendingDiscoveryButton");

const discoveriesFeed =
  document.querySelector("#discoveriesFeed");

const discoveriesControls =
  document.querySelector("#discoveriesControls");

const discoveriesUsernameSearch =
  document.querySelector("#discoveriesUsernameSearch");

const clearDiscoveriesFilters =
  document.querySelector("#clearDiscoveriesFilters");

const joinForm =
  document.querySelector("#joinForm");

const signInForm =
  document.querySelector("#signInForm");

const existingUserButton =
  document.querySelector("#existingUserButton");

const newUserButton =
  document.querySelector("#newUserButton");

const authForm =
  document.querySelector("#authForm");

const existingForm =
  document.querySelector("#existingForm");

const authMessage =
  document.querySelector("#authMessage");

const recordButton =
  document.querySelector("#recordButton");

const signOutButton =
  document.querySelector("#signOutButton");

const actionEntryState =
  document.querySelector("#actionEntryState");

const actionPublishedState =
  document.querySelector("#actionPublishedState");

const actionPendingState =
  document.querySelector("#actionPendingState");

const actionForm =
  document.querySelector("#actionForm");

const actionCategory =
  document.querySelector("#actionCategory");

const actionText =
  document.querySelector("#actionText");

const actionCharacterCount =
  document.querySelector("#actionCharacterCount");

const actionMessage =
  document.querySelector("#actionMessage");

const submitActionButton =
  document.querySelector("#submitActionButton");

const viewPublishedActionButton =
  document.querySelector("#viewPublishedActionButton");

const shareAnotherActionButton =
  document.querySelector("#shareAnotherActionButton");

const shareAnotherPendingActionButton =
  document.querySelector("#shareAnotherPendingActionButton");

const closePendingActionButton =
  document.querySelector("#closePendingActionButton");

const actionsFeed =
  document.querySelector("#actionsFeed");

const actionsControls =
  document.querySelector("#actionsControls");

const actionsCategoryFilter =
  document.querySelector("#actionsCategoryFilter");

const actionsUsernameSearch =
  document.querySelector("#actionsUsernameSearch");

const clearActionsFilters =
  document.querySelector("#clearActionsFilters");

const logActionButton =
  document.querySelector("#logActionButton");

let publicActions = [];
let lastPublishedActionId = null;
let publicDiscoveries = [];
let lastPublishedDiscoveryId = null;
let discoveryTurnstileWidgetId = null;
let registrationTurnstileWidgetId = null;

/* -------------------------
   MESSAGES
------------------------- */

function showAuthMessage(message) {
  authMessage.textContent = message;
  authMessage.classList.remove("hidden");
}

function clearAuthMessage() {
  authMessage.textContent = "";
  authMessage.classList.add("hidden");
}

function showActionMessage(message) {
  actionMessage.textContent = message;
  actionMessage.className = "message";
}

function clearActionMessage() {
  actionMessage.textContent = "";
  actionMessage.className = "message hidden";
}

function showDiscoveryMessage(message) {
  discoveryMessage.textContent = message;
  discoveryMessage.className = "message";
}

function clearDiscoveryMessage() {
  discoveryMessage.textContent = "";
  discoveryMessage.className = "message hidden";
}

/* -------------------------
   ACTION DIALOG STATES
------------------------- */

function showActionEntryState() {
  actionEntryState.classList.remove("hidden");
  actionPublishedState.classList.add("hidden");
  actionPendingState.classList.add("hidden");
}

function showActionPublishedState() {
  actionEntryState.classList.add("hidden");
  actionPublishedState.classList.remove("hidden");
  actionPendingState.classList.add("hidden");
}

function showActionPendingState() {
  actionEntryState.classList.add("hidden");
  actionPublishedState.classList.add("hidden");
  actionPendingState.classList.remove("hidden");
}

function resetActionForm() {
  actionForm.reset();

  actionCharacterCount.textContent = "0";

  clearActionMessage();

  if (window.turnstile) {
    try {
      window.turnstile.reset();
    } catch (error) {
      console.warn(
        "Turnstile reset unavailable:",
        error
      );
    }
  }
}

function prepareNewAction() {
  resetActionForm();
  showActionEntryState();

  window.setTimeout(() => {
    actionCategory.focus();
  }, 0);
}

function showDiscoveryEntryState() {
  discoveryEntryState.classList.remove("hidden");
  discoveryPublishedState.classList.add("hidden");
  discoveryPendingState.classList.add("hidden");
}

function showDiscoveryPublishedState() {
  discoveryEntryState.classList.add("hidden");
  discoveryPublishedState.classList.remove("hidden");
  discoveryPendingState.classList.add("hidden");
}

function showDiscoveryPendingState() {
  discoveryEntryState.classList.add("hidden");
  discoveryPublishedState.classList.add("hidden");
  discoveryPendingState.classList.remove("hidden");
}

function resetDiscoveryTurnstile() {
  if (
    window.turnstile &&
    discoveryTurnstileWidgetId !== null
  ) {
    window.turnstile.reset(
      discoveryTurnstileWidgetId
    );
  }
}

function ensureDiscoveryTurnstile(attempt = 0) {
  if (!window.turnstile) {
    if (attempt < 20) {
      window.setTimeout(
        () => ensureDiscoveryTurnstile(attempt + 1),
        250
      );
    }

    return;
  }

  window.turnstile.ready(() => {
    try {
      if (discoveryTurnstileWidgetId === null) {
        discoveryTurnstileWidgetId =
          window.turnstile.render(
            "#discoveryTurnstile",
            {
              sitekey:
                "0x4AAAAAAFFXWD-I0BinHjw3",
              action:
                "meaningful_discovery"
            }
          );
      } else {
        resetDiscoveryTurnstile();
      }
    } catch (error) {
      console.error(
        "Discovery verification failed to initialize:",
        error
      );
    }
  });
}

function resetRegistrationTurnstile() {
  if (
    window.turnstile &&
    registrationTurnstileWidgetId !== null
  ) {
    try {
      window.turnstile.reset(
        registrationTurnstileWidgetId
      );
    } catch (error) {
      console.warn(
        "Registration verification reset unavailable:",
        error
      );
    }
  }
}

function ensureRegistrationTurnstile(attempt = 0) {
  if (!window.turnstile) {
    if (attempt < 20) {
      window.setTimeout(
        () => ensureRegistrationTurnstile(attempt + 1),
        250
      );
    }

    return;
  }

  window.turnstile.ready(() => {
    try {
      if (registrationTurnstileWidgetId === null) {
        registrationTurnstileWidgetId =
          window.turnstile.render(
            "#registrationTurnstile",
            {
              sitekey:
                "0x4AAAAAAFFXWD-I0BinHjw3",
              action:
                "meaningful_registration"
            }
          );
      } else {
        resetRegistrationTurnstile();
      }
    } catch (error) {
      console.error(
        "Registration verification failed to initialize:",
        error
      );
    }
  });
}

function prepareNewDiscovery() {
  discoveryForm.reset();
  discoveryCharacterCount.textContent = "0";
  clearDiscoveryMessage();
  showDiscoveryEntryState();
  ensureDiscoveryTurnstile();

  window.setTimeout(() => {
    discoveryText.focus();
  }, 0);
}

/* -------------------------
   AUTHENTICATED UI
------------------------- */

function setAuthenticatedUI(authenticated) {
  recordButton.classList.toggle(
    "hidden",
    !authenticated
  );

  signOutButton.classList.toggle(
    "hidden",
    !authenticated
  );
}

function openParticipation() {
  if (currentSession?.user) {
    prepareNewAction();
    actionDialog.showModal();
    return;
  }

  clearAuthMessage();
  authDialog.showModal();
  ensureRegistrationTurnstile();
}

function openDiscovery() {
  if (currentSession?.user) {
    discoveryDialog.showModal();
    prepareNewDiscovery();
    return;
  }

  clearAuthMessage();
  authDialog.showModal();
  ensureRegistrationTurnstile();
}

/* -------------------------
   DIALOGS
------------------------- */

participateButton.addEventListener(
  "click",
  openParticipation
);

joinProjectButton.addEventListener(
  "click",
  openParticipation
);

logActionButton.addEventListener(
  "click",
  openParticipation
);

shareDiscoveryButton.addEventListener(
  "click",
  openDiscovery
);

closeDialog.addEventListener(
  "click",
  () => {
    authDialog.close();
  }
);

closeActionDialog.addEventListener(
  "click",
  () => {
    actionDialog.close();
  }
);

closeDiscoveryDialog.addEventListener(
  "click",
  () => {
    discoveryDialog.close();
  }
);

/*
  Native <dialog> already supports Escape.

  This adds closing when the user clicks
  directly on the shaded backdrop.
*/

function enableBackdropClose(dialog) {
  dialog.addEventListener(
    "click",
    (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    }
  );
}

enableBackdropClose(authDialog);
enableBackdropClose(actionDialog);
enableBackdropClose(discoveryDialog);
enableBackdropClose(recordDialog);
enableBackdropClose(updatesDialog);

appUpdatesButton.addEventListener(
  "click",
  () => {
    updatesDialog.showModal();
  }
);

closeUpdatesDialog.addEventListener(
  "click",
  () => {
    updatesDialog.close();
  }
);

closeUpdatesDialogButton.addEventListener(
  "click",
  () => {
    updatesDialog.close();
  }
);

closeRecordDialog.addEventListener(
  "click",
  () => {
    recordDialog.close();
  }
);

existingUserButton.addEventListener(
  "click",
  () => {
    clearAuthMessage();

    authForm.classList.add("hidden");
    existingForm.classList.remove("hidden");
  }
);

newUserButton.addEventListener(
  "click",
  () => {
    clearAuthMessage();

    existingForm.classList.add("hidden");
    authForm.classList.remove("hidden");
    ensureRegistrationTurnstile();
  }
);

/* -------------------------
   NEW PARTICIPANT
------------------------- */

joinForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    clearAuthMessage();

    const username =
      document
        .querySelector("#username")
        .value
        .trim();

    const email =
      document
        .querySelector("#email")
        .value
        .trim();

    if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
      showAuthMessage(
        "Username must be 3–30 characters using only letters, numbers, or underscores."
      );

      return;
    }

    const turnstileToken =
      window.turnstile &&
      registrationTurnstileWidgetId !== null
        ? window.turnstile.getResponse(
            registrationTurnstileWidgetId
          )
        : "";

    if (!turnstileToken) {
      showAuthMessage(
        "Please complete the verification."
      );

      return;
    }

    localStorage.setItem(
      "meaningful_pending_username",
      username
    );

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
                mode: "new",
                username,
                email,
                turnstileToken
              })
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        localStorage.removeItem(
          "meaningful_pending_username"
        );

        showAuthMessage(
          result.error ||
            "We couldn't send the sign-in link. Please try again."
        );

        resetRegistrationTurnstile();
        return;
      }

      showAuthMessage(
        "Check your email for your secure Project Meaningful sign-in link."
      );

      resetRegistrationTurnstile();
    } catch (error) {
      console.error(
        "Registration request failed:",
        error
      );

      localStorage.removeItem(
        "meaningful_pending_username"
      );

      showAuthMessage(
        "We couldn't send the sign-in link. Please try again."
      );

      resetRegistrationTurnstile();
    }
  }
);

/* -------------------------
   RETURNING PARTICIPANT
------------------------- */

signInForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    clearAuthMessage();

    const email =
      document
        .querySelector("#existingEmail")
        .value
        .trim();

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
                email
              })
          }
        );

      const result =
        await response.json();

      if (response.status === 429) {
        showAuthMessage(
          result.error ||
            "Please wait before requesting another sign-in link."
        );

        return;
      }
    } catch (error) {
      console.error(
        "Sign-in request failed:",
        error
      );
    }

    /*
      Same response regardless of whether
      the email belongs to an account.
    */

    showAuthMessage(
      "If that email belongs to an account, a secure sign-in link will be sent."
    );
  }
);

/* -------------------------
   PROFILE
------------------------- */

async function ensureProfile(user) {
  const pendingUsername =
    localStorage.getItem(
      "meaningful_pending_username"
    ) ||
    user.user_metadata?.requested_username ||
    "";

  if (!currentSession?.access_token) {
    return;
  }

  try {
    const response =
      await fetch(
        "/api/profile",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
            Authorization:
              `Bearer ${currentSession.access_token}`
          },
          body:
            JSON.stringify({
              username:
                pendingUsername
            })
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      if (
        response.status === 400 &&
        !pendingUsername
      ) {
        console.warn(
          "Authenticated account has no Project Meaningful profile."
        );
        return;
      }

      console.error(
        "Profile creation failed:",
        result.error
      );

      if (response.status === 409) {
        localStorage.removeItem(
          "meaningful_pending_username"
        );

        alert(
          "That username is no longer available. Please sign in again and choose another username."
        );

        await supabase.auth.signOut();
      }

      return;
    }

    localStorage.removeItem(
      "meaningful_pending_username"
    );
  } catch (error) {
    console.error(
      "Profile creation failed:",
      error
    );
  }
}

/* -------------------------
   SESSION
------------------------- */

async function handleSession(session) {
  currentSession = session;

  const authenticated =
    Boolean(session?.user);

  setAuthenticatedUI(authenticated);

  if (authenticated) {
    await ensureProfile(session.user);
  }
}

const {
  data: { session }
} = await supabase.auth.getSession();

await handleSession(session);

supabase.auth.onAuthStateChange(
  async (_event, newSession) => {
    await handleSession(newSession);
  }
);

/* -------------------------
   SIGN OUT
------------------------- */

signOutButton.addEventListener(
  "click",
  async () => {
    await supabase.auth.signOut();

    currentSession = null;

    setAuthenticatedUI(false);
  }
);

/* -------------------------
   DISCOVERY CHARACTER COUNT
------------------------- */

discoveryText.addEventListener(
  "input",
  () => {
    discoveryCharacterCount.textContent =
      discoveryText.value.length;
  }
);

/* -------------------------
   PUBLIC DISCOVERIES
------------------------- */

const DISCOVERY_ICONS = [
  "✦",
  "◎",
  "↗",
  "◇"
];

function createDiscoveryCard(discovery) {
  const article =
    document.createElement("article");

  article.className =
    "action-card discovery-card";

  article.dataset.discoveryId =
    String(discovery.id);

  const tone =
    Math.abs(
      Number(discovery.id) || 0
    ) % 4;

  article.dataset.discoveryTone =
    String(tone);

  const meta =
    document.createElement("div");

  meta.className = "action-meta";

  const discoveryBadge =
    document.createElement("span");

  discoveryBadge.className =
    "discovery-badge";

  const discoveryIcon =
    document.createElement("span");

  discoveryIcon.className =
    "discovery-icon";

  discoveryIcon.setAttribute(
    "aria-hidden",
    "true"
  );

  discoveryIcon.textContent =
    DISCOVERY_ICONS[tone];

  const discoveryLabel =
    document.createElement("span");

  discoveryLabel.textContent =
    "Discovery";

  discoveryBadge.append(
    discoveryIcon,
    discoveryLabel
  );

  const username =
    document.createElement("strong");

  username.textContent =
    discovery.username;

  const date =
    document.createElement("time");

  date.dateTime =
    discovery.createdAt;

  date.textContent =
    formatActionDate(
      discovery.createdAt
    );

  meta.append(
    discoveryBadge,
    username,
    date
  );

  const text =
    document.createElement("p");

  text.className = "action-text";

  text.textContent =
    discovery.discoveryText;

  article.append(
    meta,
    text
  );

  return article;
}

function renderPublicDiscoveries() {
  const username =
    discoveriesUsernameSearch.value
      .trim()
      .toLocaleLowerCase();

  const discoveries =
    publicDiscoveries.filter(
      (discovery) =>
        !username ||
        discovery.username
          .toLocaleLowerCase() === username
    );

  const visibleDiscoveries =
    discoveries.slice(0, 20);

  discoveriesFeed.replaceChildren();

  if (
    visibleDiscoveries.length === 0
  ) {
    const empty =
      document.createElement("p");

    empty.className = "empty-state";
    empty.textContent =
      username
        ? "No results found."
        : "No Discoveries have been published yet.";

    discoveriesFeed.append(empty);
    return;
  }

  const fragment =
    document.createDocumentFragment();

  for (
    const discovery
    of visibleDiscoveries
  ) {
    fragment.append(
      createDiscoveryCard(discovery)
    );
  }

  discoveriesFeed.append(fragment);
}

async function loadPublicDiscoveries() {
  discoveriesFeed.setAttribute(
    "aria-busy",
    "true"
  );

  try {
    const response =
      await fetch("/api/discoveries");

    if (!response.ok) {
      throw new Error(
        "Public discoveries request failed"
      );
    }

    const result =
      await response.json();

    publicDiscoveries =
      Array.isArray(result.discoveries)
        ? result.discoveries
        : [];

    renderPublicDiscoveries();
  } catch (error) {
    console.error(
      "Discoveries feed failed:",
      error
    );

    publicDiscoveries = [];

    const unavailable =
      document.createElement("p");

    unavailable.className =
      "empty-state";

    unavailable.textContent =
      "Discoveries are temporarily unavailable.";

    discoveriesFeed.replaceChildren(
      unavailable
    );
  } finally {
    discoveriesFeed.setAttribute(
      "aria-busy",
      "false"
    );
  }
}

discoveriesControls.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();
  }
);

discoveriesUsernameSearch.addEventListener(
  "input",
  renderPublicDiscoveries
);

clearDiscoveriesFilters.addEventListener(
  "click",
  () => {
    discoveriesUsernameSearch.value = "";
    renderPublicDiscoveries();
    discoveriesUsernameSearch.focus();
  }
);

/* -------------------------
   YOUR RECORD
------------------------- */

function openReturningParticipantAuth() {
  clearAuthMessage();
  authForm.classList.add("hidden");
  existingForm.classList.remove("hidden");
  authDialog.showModal();
}

function setRecordLoading() {
  recordPublishedActions.textContent = "—";
  recordPublishedDays.textContent = "—";
  recordFeed.replaceChildren();

  const loading =
    document.createElement("p");

  loading.className = "empty-state";
  loading.textContent = "Loading your record…";
  recordFeed.append(loading);
}

function createRecordActionCard(action) {
  const article =
    document.createElement("article");

  article.className = "record-entry";
  article.dataset.category =
    action.category || "Other";

  const statusValue =
    ["published", "pending", "rejected"].includes(
      action.status
    )
      ? action.status
      : "pending";

  const meta =
    document.createElement("div");

  meta.className = "record-entry-meta";

  const category =
    document.createElement("span");

  category.className = "record-category";

  const categoryIcon =
    document.createElement("span");

  categoryIcon.setAttribute(
    "aria-hidden",
    "true"
  );

  categoryIcon.textContent =
    ACTION_CATEGORY_ICONS[action.category] || "•";

  const categoryText =
    document.createElement("span");

  categoryText.textContent =
    action.category || "Other";

  category.append(
    categoryIcon,
    categoryText
  );

  const date =
    document.createElement("time");

  date.dateTime = action.createdAt;
  date.textContent =
    formatActionDate(action.createdAt);

  const status =
    document.createElement("span");

  status.className = "record-status";
  status.dataset.status = statusValue;
  status.textContent =
    statusValue.charAt(0).toUpperCase() +
    statusValue.slice(1);

  meta.append(category, date, status);

  const text =
    document.createElement("p");

  text.className = "record-entry-text";
  text.textContent = action.actionText || "";

  article.append(meta, text);
  return article;
}

function renderRecord(result) {
  const summary = result?.summary || {};
  const actions = Array.isArray(result?.actions)
    ? result.actions
    : [];

  recordPublishedActions.textContent =
    summary.publishedActions ?? 0;

  recordPublishedDays.textContent =
    summary.publishedDays ?? 0;

  recordFeed.replaceChildren();

  if (actions.length === 0) {
    const empty =
      document.createElement("p");

    empty.className = "empty-state";
    empty.textContent =
      "You have not recorded a Meaningful Action yet.";

    recordFeed.append(empty);
    return;
  }

  const fragment =
    document.createDocumentFragment();

  for (const action of actions) {
    fragment.append(
      createRecordActionCard(action)
    );
  }

  recordFeed.append(fragment);
}

async function loadRecord() {
  if (!currentSession?.access_token) {
    recordDialog.close();
    openReturningParticipantAuth();
    return;
  }

  setRecordLoading();
  recordFeed.setAttribute(
    "aria-busy",
    "true"
  );

  try {
    const response = await fetch(
      "/api/record",
      {
        headers: {
          Authorization:
            `Bearer ${currentSession.access_token}`
        }
      }
    );

    if (response.status === 401) {
      currentSession = null;
      setAuthenticatedUI(false);
      recordDialog.close();
      openReturningParticipantAuth();
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
        "Your Record request failed"
      );
    }

    renderRecord(result);
  } catch (error) {
    console.error(
      "Your Record failed:",
      error
    );

    recordFeed.replaceChildren();

    const unavailable =
      document.createElement("p");

    unavailable.className = "empty-state";
    unavailable.textContent =
      "Your Record is temporarily unavailable. Please try again.";

    recordFeed.append(unavailable);
  } finally {
    recordFeed.setAttribute(
      "aria-busy",
      "false"
    );
  }
}

async function openRecord() {
  if (!currentSession?.user) {
    openReturningParticipantAuth();
    return;
  }

  recordDialog.showModal();
  await loadRecord();
}

recordButton.addEventListener(
  "click",
  openRecord
);

communityRecordButton.addEventListener(
  "click",
  openRecord
);

recordLogActionButton.addEventListener(
  "click",
  () => {
    recordDialog.close();
    openParticipation();
  }
);

/* -------------------------
   ACTION CHARACTER COUNT
------------------------- */

actionText.addEventListener(
  "input",
  () => {
    actionCharacterCount.textContent =
      actionText.value.length;
  }
);

/* -------------------------
   PUBLIC MEANINGFUL ACTIONS
------------------------- */

function formatActionDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(date);
}

const ACTION_CATEGORY_ICONS = {
  Family: "♥",
  Relationships: "↔",
  Health: "+",
  Work: "◆",
  Learning: "◫",
  Creativity: "✦",
  Service: "◎",
  Faith: "△",
  Responsibility: "✓",
  Sacrifice: "◇",
  Other: "•"
};

function createActionCard(action) {
  const article =
    document.createElement("article");

  article.className = "action-card";
  article.dataset.actionId =
    String(action.id);

  article.dataset.category =
    action.category;

  const meta =
    document.createElement("div");

  meta.className = "action-meta";

  const categoryBadge =
    document.createElement("span");

  categoryBadge.className =
    "category-badge";

  const categoryIcon =
    document.createElement("span");

  categoryIcon.className =
    "category-icon";

  categoryIcon.setAttribute(
    "aria-hidden",
    "true"
  );

  categoryIcon.textContent =
    ACTION_CATEGORY_ICONS[
      action.category
    ] || "•";

  const categoryText =
    document.createElement("span");

  categoryText.textContent =
    action.category;

  categoryBadge.append(
    categoryIcon,
    categoryText
  );

  const username =
    document.createElement("strong");

  username.textContent =
    action.username;

  const date =
    document.createElement("time");

  date.dateTime =
    action.createdAt;

  date.textContent =
    formatActionDate(action.createdAt);

  meta.append(
    categoryBadge,
    username,
    date
  );

  const text =
    document.createElement("p");

  text.className = "action-text";
  text.textContent =
    action.actionText;

  article.append(meta, text);

  return article;
}

function renderPublicActions() {
  const category =
    actionsCategoryFilter.value;

  const username =
    actionsUsernameSearch.value
      .trim()
      .toLocaleLowerCase();

  const actions =
    publicActions.filter((action) => {
      const categoryMatches =
        !category ||
        action.category === category;

      const usernameMatches =
        !username ||
        action.username
          .toLocaleLowerCase() === username;

      return (
        categoryMatches &&
        usernameMatches
      );
    });

  const visibleActions =
    actions.slice(0, 20);

  actionsFeed.replaceChildren();

  if (visibleActions.length === 0) {
    const empty =
      document.createElement("p");

    empty.className = "empty-state";
    empty.textContent =
      "No results found.";

    actionsFeed.append(empty);

    return;
  }

  const fragment =
    document.createDocumentFragment();

  for (const action of visibleActions) {
    fragment.append(
      createActionCard(action)
    );
  }

  actionsFeed.append(fragment);
}

async function loadPublicActions() {
  actionsFeed.setAttribute(
    "aria-busy",
    "true"
  );

  try {
    const response =
      await fetch("/api/actions");

    if (!response.ok) {
      throw new Error(
        "Public actions request failed"
      );
    }

    const result =
      await response.json();

    publicActions =
      Array.isArray(result.actions)
        ? result.actions
        : [];

    renderPublicActions();
  } catch (error) {
    console.error(
      "Meaningful Actions feed failed:",
      error
    );

    publicActions = [];

    const unavailable =
      document.createElement("p");

    unavailable.className =
      "empty-state";

    unavailable.textContent =
      "Meaningful Actions are temporarily unavailable.";

    actionsFeed.replaceChildren(
      unavailable
    );
  } finally {
    actionsFeed.setAttribute(
      "aria-busy",
      "false"
    );
  }
}

actionsControls.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();
  }
);

actionsCategoryFilter.addEventListener(
  "change",
  renderPublicActions
);

actionsUsernameSearch.addEventListener(
  "input",
  renderPublicActions
);

clearActionsFilters.addEventListener(
  "click",
  () => {
    actionsCategoryFilter.value = "";
    actionsUsernameSearch.value = "";
    renderPublicActions();
    actionsCategoryFilter.focus();
  }
);

/* -------------------------
   POST-SUBMISSION ACTIONS
------------------------- */

shareAnotherActionButton.addEventListener(
  "click",
  prepareNewAction
);

shareAnotherPendingActionButton.addEventListener(
  "click",
  prepareNewAction
);

closePendingActionButton.addEventListener(
  "click",
  () => {
    actionDialog.close();
  }
);

viewPublishedActionButton.addEventListener(
  "click",
  async () => {
    actionDialog.close();

    await loadPublicActions();

    document
      .querySelector("#actions")
      .scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    if (lastPublishedActionId !== null) {
      const card =
        actionsFeed.querySelector(
          `[data-action-id="${lastPublishedActionId}"]`
        );

      if (card) {
        card.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }
    }
  }
);

/* -------------------------
   SUBMIT MEANINGFUL ACTION
------------------------- */

actionForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    clearActionMessage();

    if (!currentSession?.access_token) {
      actionDialog.close();

      authDialog.showModal();
      ensureRegistrationTurnstile();

      return;
    }

    const text =
      actionText.value.trim();

    const category =
      actionCategory.value;

    if (!category) {
      showActionMessage(
        "Choose a category."
      );

      return;
    }

    if (!text || text.length > 140) {
      showActionMessage(
        "Your Meaningful Action must contain 1–140 characters."
      );

      return;
    }

    const turnstileToken =
      document.querySelector(
        '#actionForm input[name="cf-turnstile-response"]'
      )?.value;

    if (!turnstileToken) {
      showActionMessage(
        "Please complete the verification."
      );

      return;
    }

    submitActionButton.disabled = true;

    submitActionButton.textContent =
      "Sharing...";

    try {
      const response =
        await fetch(
          "/api/actions",
          {
            method: "POST",

            headers: {
              "content-type":
                "application/json",

              Authorization:
                `Bearer ${currentSession.access_token}`
            },

            body: JSON.stringify({
              category,
              actionText: text,
              turnstileToken
            })
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        showActionMessage(
          result.error ||
            "We couldn't submit your action. Please try again."
        );

        if (window.turnstile) {
          window.turnstile.reset();
        }

        return;
      }

      /*
        Clear the completed form immediately.
        The confirmation state then replaces it.
      */

      actionForm.reset();

      actionCharacterCount.textContent =
        "0";

      if (window.turnstile) {
        window.turnstile.reset();
      }

      if (result.status === "published") {
        lastPublishedActionId =
          result.action?.id ?? null;

        showActionPublishedState();

        await Promise.all([
          loadProjectStats(),
          loadPublicActions()
        ]);
      } else {
        showActionPendingState();
      }
    } catch (error) {
      console.error(
        "Submission failed:",
        error
      );

      showActionMessage(
        "We couldn't submit your action. Please try again."
      );

      if (window.turnstile) {
        window.turnstile.reset();
      }
    } finally {
      submitActionButton.disabled = false;

      submitActionButton.textContent =
        "Share Meaningful Action";
    }
  }
);

/* -------------------------
   DISCOVERY SUBMISSION
------------------------- */

shareAnotherDiscoveryButton.addEventListener(
  "click",
  prepareNewDiscovery
);

shareAnotherPendingDiscoveryButton.addEventListener(
  "click",
  prepareNewDiscovery
);

closePendingDiscoveryButton.addEventListener(
  "click",
  () => {
    discoveryDialog.close();
  }
);

viewPublishedDiscoveryButton.addEventListener(
  "click",
  async () => {
    discoveryDialog.close();

    await loadPublicDiscoveries();

    document
      .querySelector("#discoveries")
      .scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    if (
      lastPublishedDiscoveryId !== null
    ) {
      const card =
        discoveriesFeed.querySelector(
          `[data-discovery-id="${lastPublishedDiscoveryId}"]`
        );

      if (card) {
        card.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }
    }
  }
);

discoveryForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    clearDiscoveryMessage();

    if (!currentSession?.access_token) {
      discoveryDialog.close();
      authDialog.showModal();
      ensureRegistrationTurnstile();
      return;
    }

    const text =
      discoveryText.value.trim();

    if (
      !text ||
      text.length > 280
    ) {
      showDiscoveryMessage(
        "Your Discovery must contain 1–280 characters."
      );
      return;
    }

    const turnstileToken =
      document.querySelector(
        '#discoveryForm input[name="cf-turnstile-response"]'
      )?.value;

    if (!turnstileToken) {
      showDiscoveryMessage(
        "Please complete the verification."
      );
      return;
    }

    submitDiscoveryButton.disabled = true;
    submitDiscoveryButton.textContent =
      "Sharing...";

    try {
      const response =
        await fetch(
          "/api/discoveries",
          {
            method: "POST",

            headers: {
              "content-type":
                "application/json",

              Authorization:
                `Bearer ${currentSession.access_token}`
            },

            body: JSON.stringify({
              discoveryText: text,
              turnstileToken
            })
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        showDiscoveryMessage(
          result.error ||
            "We couldn't submit your Discovery. Please try again."
        );

        resetDiscoveryTurnstile();
        return;
      }

      discoveryForm.reset();
      discoveryCharacterCount.textContent =
        "0";

      resetDiscoveryTurnstile();

      if (
        result.status === "published"
      ) {
        lastPublishedDiscoveryId =
          result.discovery?.id ?? null;

        showDiscoveryPublishedState();

        await loadPublicDiscoveries();
      } else {
        showDiscoveryPendingState();
      }
    } catch (error) {
      console.error(
        "Discovery submission failed:",
        error
      );

      showDiscoveryMessage(
        "We couldn't submit your Discovery. Please try again."
      );

      resetDiscoveryTurnstile();
    } finally {
      submitDiscoveryButton.disabled =
        false;

      submitDiscoveryButton.textContent =
        "Share Discovery";
    }
  }
);

/* -------------------------
   PROJECT STATISTICS
------------------------- */

async function loadProjectStats() {
  const { data, error } =
    await supabase.rpc(
      "project_stats"
    );

  if (error || !data?.length) {
    return;
  }

  const stats = data[0];

  document.querySelector(
    "#totalActions"
  ).textContent =
    stats.total_actions ?? 0;

  document.querySelector(
    "#todayActions"
  ).textContent =
    stats.actions_today ?? 0;

  document.querySelector(
    "#participants"
  ).textContent =
    stats.real_participants ?? 0;

  railTotalActions.textContent =
    stats.total_actions ?? 0;

  railParticipants.textContent =
    stats.real_participants ?? 0;

  railTodayActions.textContent =
    stats.actions_today ?? 0;
}

await Promise.all([
  loadProjectStats(),
  loadPublicActions(),
  loadPublicDiscoveries()
]);

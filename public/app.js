import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://edfvxbfzvzfeqcutpzhk.supabase.co";
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

const authDialog = document.querySelector("#authDialog");
const participateButton = document.querySelector("#participateButton");
const closeDialog = document.querySelector("#closeDialog");
const joinForm = document.querySelector("#joinForm");
const signInForm = document.querySelector("#signInForm");
const existingUserButton = document.querySelector("#existingUserButton");
const newUserButton = document.querySelector("#newUserButton");
const authForm = document.querySelector("#authForm");
const existingForm = document.querySelector("#existingForm");
const authMessage = document.querySelector("#authMessage");
const recordButton = document.querySelector("#recordButton");
const signOutButton = document.querySelector("#signOutButton");

function showMessage(message) {
  authMessage.textContent = message;
  authMessage.classList.remove("hidden");
}

function clearMessage() {
  authMessage.textContent = "";
  authMessage.classList.add("hidden");
}

function setAuthenticatedUI(authenticated) {
  recordButton.classList.toggle("hidden", !authenticated);
  signOutButton.classList.toggle("hidden", !authenticated);
}

participateButton.addEventListener("click", () => {
  clearMessage();
  authDialog.showModal();
});

closeDialog.addEventListener("click", () => {
  authDialog.close();
});

existingUserButton.addEventListener("click", () => {
  clearMessage();
  authForm.classList.add("hidden");
  existingForm.classList.remove("hidden");
});

newUserButton.addEventListener("click", () => {
  clearMessage();
  existingForm.classList.add("hidden");
  authForm.classList.remove("hidden");
});

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const username = document.querySelector("#username").value.trim();
  const email = document.querySelector("#email").value.trim();

  if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
    showMessage(
      "Username must be 3–30 characters using only letters, numbers, or underscores."
    );
    return;
  }

  localStorage.setItem("meaningful_pending_username", username);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: "https://projectmeaningful.app",
      data: {
        requested_username: username
      }
    }
  });

  if (error) {
    localStorage.removeItem("meaningful_pending_username");
    showMessage("We couldn't send the sign-in link. Please try again.");
    return;
  }

  showMessage(
    "Check your email for your secure Project Meaningful sign-in link."
  );
});

signInForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const email = document.querySelector("#existingEmail").value.trim();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: "https://projectmeaningful.app"
    }
  });

  if (error) {
    showMessage("We couldn't send the sign-in link. Please try again.");
    return;
  }

  showMessage(
    "Check your email for your secure Project Meaningful sign-in link."
  );
});

async function ensureProfile(user) {
  const { data: existingProfile, error: readError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    console.error("Profile lookup failed:", readError);
    return;
  }

  if (existingProfile) {
    localStorage.removeItem("meaningful_pending_username");
    return;
  }

  const pendingUsername =
    localStorage.getItem("meaningful_pending_username") ||
    user.user_metadata?.requested_username;

  if (!pendingUsername) {
    return;
  }

  const { error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username: pendingUsername
    });

  if (insertError) {
    console.error("Profile creation failed:", insertError);

    if (insertError.code === "23505") {
      alert(
        "That username is already in use. Please choose another username."
      );
    }

    return;
  }

  localStorage.removeItem("meaningful_pending_username");
}

async function handleSession(session) {
  const authenticated = Boolean(session?.user);
  setAuthenticatedUI(authenticated);

  if (authenticated) {
    await ensureProfile(session.user);
  }
}

const {
  data: { session }
} = await supabase.auth.getSession();

await handleSession(session);

supabase.auth.onAuthStateChange(async (_event, newSession) => {
  await handleSession(newSession);
});

signOutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
  setAuthenticatedUI(false);
});

recordButton.addEventListener("click", () => {
  alert("Your Record will be added in the next build stage.");
});

async function loadProjectStats() {
  const { data, error } = await supabase.rpc("project_stats");

  if (error || !data?.length) {
    return;
  }

  const stats = data[0];

  document.querySelector("#totalActions").textContent =
    stats.total_actions ?? 0;

  document.querySelector("#todayActions").textContent =
    stats.actions_today ?? 0;

  document.querySelector("#participants").textContent =
    stats.real_participants ?? 0;
}

await loadProjectStats();

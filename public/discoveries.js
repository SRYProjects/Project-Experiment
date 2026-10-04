const feed =
  document.querySelector("#archiveFeed");

const username =
  document.querySelector("#archiveUsername");

const showAll =
  document.querySelector("#archiveShowAll");

const loadMore =
  document.querySelector("#loadMoreDiscoveries");

const PAGE_SIZE = 50;

let offset = 0;
let loading = false;

function formatDate(value) {
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

function createCard(discovery) {
  const article =
    document.createElement("article");

  article.className =
    "action-card discovery-card";

  const meta =
    document.createElement("div");

  meta.className = "action-meta";

  const name =
    document.createElement("strong");

  name.textContent =
    discovery.username;

  const time =
    document.createElement("time");

  time.dateTime =
    discovery.createdAt;

  time.textContent =
    formatDate(discovery.createdAt);

  meta.append(name, time);

  if (discovery.isExample) {
    const example =
      document.createElement("span");

    example.className =
      "example-label";

    example.textContent =
      "Example";

    meta.append(example);
  }

  const text =
    document.createElement("p");

  text.className = "action-text";

  text.textContent =
    discovery.discoveryText;

  article.append(meta, text);

  return article;
}

async function loadDiscoveries(
  { append = false } = {}
) {
  if (loading) {
    return;
  }

  loading = true;

  feed.setAttribute(
    "aria-busy",
    "true"
  );

  if (!append) {
    offset = 0;
    feed.replaceChildren();

    const status =
      document.createElement("p");

    status.className = "empty-state";
    status.textContent =
      "Loading Discoveries…";

    feed.append(status);
  }

  const params =
    new URLSearchParams({
      limit:
        String(PAGE_SIZE),
      offset:
        String(offset)
    });

  if (username.value.trim()) {
    params.set(
      "username",
      username.value.trim()
    );
  }

  try {
    const response =
      await fetch(
        `/api/discoveries?${params.toString()}`
      );

    if (!response.ok) {
      throw new Error(
        "Request failed"
      );
    }

    const result =
      await response.json();

    const discoveries =
      Array.isArray(result.discoveries)
        ? result.discoveries
        : [];

    if (!append) {
      feed.replaceChildren();
    }

    if (
      discoveries.length === 0 &&
      offset === 0
    ) {
      const empty =
        document.createElement("p");

      empty.className = "empty-state";
      empty.textContent =
        "No results found.";

      feed.append(empty);
    } else {
      const fragment =
        document.createDocumentFragment();

      for (
        const discovery
        of discoveries
      ) {
        fragment.append(
          createCard(discovery)
        );
      }

      feed.append(fragment);
    }

    offset += discoveries.length;

    loadMore.classList.toggle(
      "hidden",
      result.hasMore !== true
    );
  } catch (error) {
    console.error(
      "Discoveries archive failed:",
      error
    );

    if (!append) {
      feed.replaceChildren();

      const unavailable =
        document.createElement("p");

      unavailable.className =
        "empty-state";

      unavailable.textContent =
        "Discoveries are temporarily unavailable.";

      feed.append(unavailable);
    }

    loadMore.classList.add("hidden");
  } finally {
    feed.setAttribute(
      "aria-busy",
      "false"
    );

    loading = false;
  }
}

document
  .querySelector("#archiveControls")
  .addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
    }
  );

let timer;

username.addEventListener(
  "input",
  () => {
    clearTimeout(timer);

    timer =
      setTimeout(
        () => loadDiscoveries(),
        250
      );
  }
);

showAll.addEventListener(
  "click",
  () => {
    username.value = "";
    loadDiscoveries();
    username.focus();
  }
);

loadMore.addEventListener(
  "click",
  () => {
    loadDiscoveries({
      append: true
    });
  }
);

await loadDiscoveries();

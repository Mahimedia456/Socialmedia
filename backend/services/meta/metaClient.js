export async function metaGet(url) {
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j?.error?.message || "Meta request failed");
    e.meta = j?.error || j;
    throw e;
  }
  return j;
}

export async function metaPostForm(url, formObj) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(formObj || {})) {
    if (v === undefined || v === null) continue;
    body.set(k, String(v));
  }

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j?.error?.message || "Meta POST failed");
    e.meta = j?.error || j;
    throw e;
  }
  return j;
}
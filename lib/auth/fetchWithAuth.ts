export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (res.status === 401) {
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      res = await fetch(url, {
        ...options,
        credentials: "include",
      });
    } else {
      // opcjonalnie redirect
      window.location.href = "/login";
    }
  }

  return res;
}

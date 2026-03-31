const BASE_URL = "http://127.0.0.1:8000/api/expenses";

// 🔹 GET ALL
export async function fetchAllExpenses() {
  const res = await fetch(BASE_URL);

  if (!res.ok) {
    throw new Error("Failed to fetch expenses");
  }

  const data = await res.json();

  // handle Laravel pagination or plain array
  return data.data ?? data;
}

// 🔹 CREATE
export async function createExpense(payload: any) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create expense");
  }

  return await res.json();
}

// 🔹 UPDATE
export async function updateExpense(id: number, payload: unknown) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to update expense";
    try {
      const err = await res.json();
      message = err.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return await res.json();
}

// 🔹 DELETE
export async function deleteExpense(id: number) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    let message = "Failed to delete expense";
    try {
      const err = await res.json();
      message = err.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
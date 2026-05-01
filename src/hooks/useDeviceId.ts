import { useEffect, useState } from "react";

const KEY = "mylib-device-id";

export function useDeviceId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(KEY, v);
    }
    setId(v);
  }, []);
  return id;
}

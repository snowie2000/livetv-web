import { api } from "@/modules/axios.config";
import { useEffect } from "react";
import { history } from "umi";

export default function HomePage() {
  useEffect(() => {
    api.get("/auth").then(() => {
      history.replace("/channels")
    }).catch(() => {
      history.replace("/login")
    })
  }, [])

  return (
    <div>
    </div>
  );
}

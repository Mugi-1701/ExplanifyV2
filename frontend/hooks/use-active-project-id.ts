"use client";

import { useSyncExternalStore } from "react";

import { ACTIVE_PROJECT_KEY } from "@/lib/storage";
import { ACTIVE_PROJECT_CHANGED_EVENT, getActiveProjectId } from "@/services/project.service";

function useActiveProjectId() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const handleStorage = (event: StorageEvent) => {
        if (event.key === ACTIVE_PROJECT_KEY) {
          onStoreChange();
        }
      };

      const handleActiveProjectChange = () => {
        onStoreChange();
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleActiveProjectChange as EventListener);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleActiveProjectChange as EventListener);
      };
    },
    () => getActiveProjectId() ?? null,
    () => null
  );
}

export { useActiveProjectId };

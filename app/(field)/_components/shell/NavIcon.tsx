import type { NavIcon as IconName } from "@/lib/harvestly-content";

export function NavIcon({ name }: { name: IconName }) {
  if (name === "home") return <path d="M3.5 11.2 12 4l8.5 7.2v8.1h-5.7v-5.5H9.2v5.5H3.5Z" />;
  if (name === "analyze") return <path d="M5 6.5h3l1.4-2h5.2l1.4 2h3A2 2 0 0 1 21 8.5v9A2 2 0 0 1 19 19H5a2 2 0 0 1-2-2v-8.5a2 2 0 0 1 2-2Zm7 3a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z" />;
  if (name === "history") return <path d="M6 3.5h12v17H6Zm3 4h6M9 11h6m-6 3.5h4" />;
  if (name === "guide") return <path d="M12 3a6.2 6.2 0 0 0-3.6 11.3c.7.5 1.1 1.2 1.1 2V17h5v-.7c0-.8.4-1.6 1.1-2A6.2 6.2 0 0 0 12 3Zm-2.1 17h4.2" />;
  if (name === "community") return <path d="M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 19a5.5 5.5 0 0 1 11 0m-3 0a5.5 5.5 0 0 1 11 0" />;
  return <path d="M12 8.5A3.5 3.5 0 1 0 12 15a3.5 3.5 0 0 0 0-7Zm0-5v2m0 13v2M3.5 12h2m13 0h2M6 6l1.5 1.5m9 9L18 18M18 6l-1.5 1.5m-9 9L6 18" />;
}

export function IconFrame({ name }: { name: IconName }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <NavIcon name={name} />
    </svg>
  );
}

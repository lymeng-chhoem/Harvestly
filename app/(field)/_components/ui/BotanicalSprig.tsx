export function BotanicalSprig({ className = "" }: { className?: string }) {
  return (
    <svg className={`botanical-sprig ${className}`} viewBox="0 0 118 150" aria-hidden="true">
      <path d="M36 142c8-33 25-63 49-98M53 110c-20-13-28-29-26-45 19 5 28 19 26 45Zm13-23C49 69 46 52 54 38c17 12 20 28 12 49Zm14-20C70 48 72 31 84 20c12 16 10 32-4 47Zm-30 62c19-7 35-5 46 6-15 13-31 11-46-6Zm12-28c20-5 34-1 43 11-17 11-31 7-43-11Zm14-27c18-3 31 2 38 14-16 8-29 3-38-14Z" />
    </svg>
  );
}

export default function Nav() {
  return (
    <nav
      className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-end bg-transparent"
      style={{ padding: "24px 48px" }}
    >
      <a
        href="#"
        className="text-white transition-opacity hover:opacity-100"
        style={{ fontWeight: 400, fontSize: 14, opacity: 0.6 }}
      >
        Sign in
      </a>
    </nav>
  );
}

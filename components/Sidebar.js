import Link from "next/link";
import { useRouter } from "next/router";

export default function Sidebar() {
  const router = useRouter();

  const tabs = [
    { name: "Mail", path: "/" },
    { name: "Scrape", path: "/scrape" },
  ];

  return (
    <div className="h-screen w-56 bg-gray-900 text-white flex flex-col p-4">
      <h1 className="text-xl font-bold mb-6">Dashboard</h1>
      <nav className="flex flex-col space-y-2">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            href={tab.path}
            className={`p-3 rounded-lg hover:bg-gray-700 ${
              router.pathname === tab.path ? "bg-gray-700" : ""
            }`}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}

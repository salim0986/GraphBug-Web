"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    BarChart3, 
    Settings, 
    LogOut, 
    Github,
    LifeBuoy
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/analytics/reviews", icon: BarChart3 },
    { name: "Installations", href: "/installations", icon: Github },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col w-64 bg-[var(--background)] border-r border-[#3f3d43]/10 h-screen sticky top-0">
            <div className="p-6 border-b border-[#3f3d43]/10">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <img 
                        src="/logo.png" 
                        alt="Graph Bug Logo" 
                        className="w-8 h-8 rounded-lg"
                    />
                    <span className="text-xl font-bold text-[var(--text)] font-heading">Graph Bug</span>
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                isActive 
                                    ? "bg-[var(--primary)] text-[var(--text)] shadow-md shadow-[var(--primary)]/20" 
                                    : "text-[var(--text)]/70 hover:bg-[var(--text)]/5 hover:text-[var(--text)]"
                            }`}
                        >
                            <item.icon size={20} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[#3f3d43]/10 space-y-2">
                <Link
                    href="/docs"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text)]/70 hover:bg-[var(--text)]/5 hover:text-[var(--text)] rounded-lg transition-colors"
                >
                    <LifeBuoy size={20} />
                    Support
                </Link>
                <Link
                    href="/api/auth/signout"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    Sign Out
                </Link>
            </div>
        </div>
    );
}

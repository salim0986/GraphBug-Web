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
import { motion } from "framer-motion";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/analytics/reviews", icon: BarChart3 },
    { name: "Installations", href: "/installations", icon: Github },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden md:flex flex-col w-64 bg-[var(--background)]/50 backdrop-blur-xl border-r border-[var(--text)]/10 h-screen sticky top-0 z-30">
            <div className="p-6 border-b border-[var(--text)]/10">
                <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img
                        src="/logo.png"
                        alt="Graph Bug Logo"
                        className="w-8 h-8 rounded-lg shadow-sm"
                    />
                    <span className="text-xl font-bold text-[var(--text)] font-heading tracking-tight">Graph Bug</span>
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                <p className="px-4 text-xs font-semibold text-[var(--text)]/40 uppercase tracking-wider mb-2 mt-2">Menu</p>
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`group relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all overflow-hidden ${isActive
                                    ? "text-[var(--text)]"
                                    : "text-[var(--text)]/60 hover:text-[var(--text)]"
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-[var(--primary)] shadow-sm shadow-[var(--primary)]/20 rounded-xl"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            {/* Hover effect for non-active items */}
                            {!isActive && (
                                <div className="absolute inset-0 bg-[var(--text)]/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                            )}

                            <span className="relative z-10 flex items-center gap-3">
                                <item.icon size={20} className={`transition-colors ${isActive ? "text-[var(--text)]" : "text-[var(--text)]/60 group-hover:text-[var(--text)]"}`} />
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[var(--text)]/10 space-y-1">
                <p className="px-4 text-xs font-semibold text-[var(--text)]/40 uppercase tracking-wider mb-2">Account</p>
                <Link
                    href="/docs"
                    className="group relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--text)]/60 hover:text-[var(--text)] rounded-xl transition-all hover:bg-[var(--text)]/5"
                >
                    <LifeBuoy size={18} />
                    Support
                </Link>
                <Link
                    href="/api/auth/signout"
                    className="group relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:text-red-600 rounded-xl transition-all hover:bg-red-50"
                >
                    <LogOut size={18} />
                    Sign Out
                </Link>
            </div>
        </div>
    );
}

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    BarChart3,
    Settings,
    LogOut,
    Github,
    LifeBuoy,
    X
} from "lucide-react";
import { useEffect } from "react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/analytics/reviews", icon: BarChart3 },
    { name: "Installations", href: "/installations", icon: Github },
    { name: "Settings", href: "/settings", icon: Settings },
];

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    const pathname = usePathname();

    // Close sidebar on route change
    useEffect(() => {
        onClose();
    }, [pathname, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
                    />

                    {/* Sidebar Drawer */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 z-[70] w-72 bg-[var(--background)] shadow-2xl border-r border-[var(--text)]/10 md:hidden flex flex-col"
                    >
                        <div className="p-6 border-b border-[var(--text)]/10 flex items-center justify-between">
                            <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
                                <img
                                    src="/logo.png"
                                    alt="Graph Bug Logo"
                                    className="w-8 h-8 rounded-lg"
                                />
                                <span className="text-xl font-bold text-[var(--text)] font-heading">Graph Bug</span>
                            </Link>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-[var(--text)]/60 hover:text-[var(--text)] transition-colors rounded-lg hover:bg-[var(--text)]/5"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                                            ? "bg-[var(--primary)] text-[var(--text)] shadow-md shadow-[var(--primary)]/20 translate-x-1"
                                            : "text-[var(--text)]/70 hover:bg-[var(--text)]/5 hover:text-[var(--text)] hover:translate-x-1"
                                            }`}
                                    >
                                        <item.icon size={20} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-[var(--text)]/10 space-y-2 bg-[var(--background)]">
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
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

// Icons
const DashboardIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
);

const BusinessIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
);

const EmployeeIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);

const ConfigurationIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);

const PayrollIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const KnowledgebaseIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
);

const WorkedHoursIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const ProfileIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);

const LogoutIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1H6V7h4v1" /></svg>
);

const MoreIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
);

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const role = user?.role || 'EMPLOYEE'; // Default fallback role

    const [isMoreOpen, setIsMoreOpen] = useState(false);

    // Navigation setup by role
    const getNavLinks = () => {
        if (role === 'ADMIN') {
            return [
                { name: 'DASHBOARD', route: 'dashboard', icon: DashboardIcon },
                { name: 'BUSINESSES', route: 'businesses.index', icon: BusinessIcon },
                { name: 'PROFILE', route: 'profile.edit', icon: ProfileIcon },
            ];
        } else if (role === 'SHOP_OWNER') {
            return [
                { name: 'DASHBOARD', route: 'dashboard', icon: DashboardIcon },
                { name: 'BRANCHES', route: 'branches.index', icon: BusinessIcon },
                { name: 'EMPLOYEES', route: 'employees.index', icon: EmployeeIcon },
                { name: 'PAYROLL', route: 'payroll.index', icon: PayrollIcon },
                { name: 'CONFIGURATIONS', route: 'configurations.index', icon: ConfigurationIcon },
                { name: 'KNOWLEDGEBASE', route: 'knowledgebase.index', icon: KnowledgebaseIcon },
                { name: 'PROFILE', route: 'profile.edit', icon: ProfileIcon },
            ];
        } else {
            // EMPLOYEE
            return [
                { name: 'DASHBOARD', route: 'dashboard', icon: DashboardIcon },
                { name: 'WORKED HOURS', route: 'worked-hours.index', icon: WorkedHoursIcon },
                { name: 'PAYROLL', route: 'payroll.index', icon: PayrollIcon },
                { name: 'KNOWLEDGEBASE', route: 'knowledgebase.index', icon: KnowledgebaseIcon },
                { name: 'PROFILE', route: 'profile.edit', icon: ProfileIcon },
            ];
        }
    };

    const navLinks = getNavLinks();

    // Mobile specific layout splits
    const getMobileNav = () => {
        if (role === 'ADMIN') {
            return {
                primary: [
                    { name: 'Home', route: 'dashboard', icon: DashboardIcon },
                    { name: 'Business', route: 'businesses.index', icon: BusinessIcon },
                    { name: 'Profile', route: 'profile.edit', icon: ProfileIcon },
                ],
                hasMore: false,
                moreLinks: []
            };
        } else if (role === 'SHOP_OWNER') {
            return {
                primary: [
                    { name: 'Home', route: 'dashboard', icon: DashboardIcon },
                    { name: 'Staff', route: 'employees.index', icon: EmployeeIcon },
                    { name: 'Payroll', route: 'payroll.index', icon: PayrollIcon },
                    { name: 'Profile', route: 'profile.edit', icon: ProfileIcon },
                ],
                hasMore: true,
                moreLinks: [
                    { name: 'Branches', route: 'branches.index', icon: BusinessIcon },
                    { name: 'Configurations', route: 'configurations.index', icon: ConfigurationIcon },
                    { name: 'Knowledgebase', route: 'knowledgebase.index', icon: KnowledgebaseIcon },
                ]
            };
        } else {
            // EMPLOYEE
            return {
                primary: [
                    { name: 'Home', route: 'dashboard', icon: DashboardIcon },
                    { name: 'Hours', route: 'worked-hours.index', icon: WorkedHoursIcon },
                    { name: 'Payroll', route: 'payroll.index', icon: PayrollIcon },
                    { name: 'Profile', route: 'profile.edit', icon: ProfileIcon },
                ],
                hasMore: true,
                moreLinks: [
                    { name: 'Knowledgebase', route: 'knowledgebase.index', icon: KnowledgebaseIcon },
                ]
            };
        }
    };

    const mobileNav = getMobileNav();

    return (
        <div className="dark min-h-screen bg-[#121212] text-gray-200 flex font-sans selection:bg-indigo-500 selection:text-white">
            {/* Desktop Sidebar */}
            <aside className="hidden sm:flex flex-col w-64 bg-[#1E1E1E] border-r border-[#2C2C2C] fixed h-full z-10">
                <div className="flex items-center justify-center h-20 border-b border-[#2C2C2C]">
                    <Link href="/">
                        <ApplicationLogo className="block h-8 w-auto fill-current text-indigo-500" />
                    </Link>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const active = route().current(link.route) || (link.route.includes('.') && route().current(link.route.split('.')[0] + '.*'));
                        return (
                            <Link 
                                key={link.name}
                                href={route(link.route)} 
                                className={`flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#2C2C2C] hover:text-white'}`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-bold text-xs tracking-widest uppercase">{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-[#2C2C2C] space-y-2 bg-[#1A1A1A]">
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-400">
                        <ProfileIcon className="w-5 h-5 text-indigo-400" />
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-bold text-xs text-white truncate uppercase tracking-widest">{user.name}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest truncate">{role.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <Link 
                        href={route('logout')} 
                        method="post" 
                        as="button" 
                        className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-red-500 hover:bg-red-500 hover:text-white text-left"
                    >
                        <LogoutIcon className="w-5 h-5" />
                        <span className="font-bold text-xs tracking-widest uppercase">LOGOUT</span>
                    </Link>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="sm:hidden fixed bottom-0 w-full bg-[#1E1E1E] border-t border-[#2C2C2C] z-50 pb-safe">
                <div className="flex justify-around items-center h-16 px-2">
                    {mobileNav.primary.map((link) => {
                        const Icon = link.icon;
                        const active = route().current(link.route) || (link.route.includes('.') && route().current(link.route.split('.')[0] + '.*'));
                        return (
                            <Link 
                                key={link.name}
                                href={route(link.route)} 
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${active ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[9px] font-bold tracking-widest uppercase">{link.name}</span>
                            </Link>
                        );
                    })}

                    {/* Mobile "More" Drawer Trigger */}
                    {mobileNav.hasMore ? (
                        <button 
                            onClick={() => setIsMoreOpen(true)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isMoreOpen ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <MoreIcon className="w-5 h-5" />
                            <span className="text-[9px] font-bold tracking-widest uppercase">More</span>
                        </button>
                    ) : (
                        <Link 
                            href={route('logout')} 
                            method="post" 
                            as="button" 
                            className="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors text-red-500 hover:text-red-400"
                        >
                            <LogoutIcon className="w-5 h-5" />
                            <span className="text-[9px] font-bold tracking-widest uppercase">Logout</span>
                        </Link>
                    )}
                </div>
            </nav>

            {/* Mobile Slide-up More Drawer */}
            {isMoreOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        onClick={() => setIsMoreOpen(false)}
                        className="fixed inset-0 bg-black/60 z-50 sm:hidden transition-opacity"
                    />
                    
                    {/* Drawer Content */}
                    <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-[#2C2C2C] z-50 p-6 space-y-4 sm:hidden">
                        <div className="flex justify-between items-center pb-3 border-b border-[#2C2C2C]">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">More Options</span>
                            <button 
                                onClick={() => setIsMoreOpen(false)} 
                                className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest"
                            >
                                Close
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-2">
                            {mobileNav.moreLinks.map((link) => {
                                const Icon = link.icon;
                                const active = route().current(link.route) || (link.route.includes('.') && route().current(link.route.split('.')[0] + '.*'));
                                return (
                                    <Link 
                                        key={link.name}
                                        href={route(link.route)} 
                                        onClick={() => setIsMoreOpen(false)}
                                        className={`flex flex-col items-center justify-center p-4 border transition-colors ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-[#121212] border-[#2C2C2C] text-gray-400 hover:border-gray-500 hover:text-white'}`}
                                    >
                                        <Icon className="w-5 h-5 mb-2" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase text-center">{link.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                        <div className="pt-2 border-t border-[#2C2C2C]">
                            <Link 
                                href={route('logout')} 
                                method="post" 
                                as="button" 
                                onClick={() => setIsMoreOpen(false)}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-widest uppercase transition-colors"
                            >
                                <LogoutIcon className="w-5 h-5" />
                                <span>LOGOUT</span>
                            </Link>
                        </div>
                    </div>
                </>
            )}

            {/* Main Content Area */}
            <div className="flex-1 sm:ml-64 pb-20 sm:pb-0 flex flex-col min-h-screen">
                {/* Mobile Top Header */}
                <header className="sm:hidden bg-[#1E1E1E] border-b border-[#2C2C2C] flex items-center justify-between px-5 h-16 sticky top-0 z-40">
                    <div className="flex items-center gap-2">
                        <ApplicationLogo className="block text-indigo-500" />
                    </div>
                </header>

                {/* Page Header (Desktop) */}
                {header && (
                    <div className="bg-[#1E1E1E] border-b border-[#2C2C2C] z-10 hidden sm:block">
                        <div className="max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </div>
                )}

                {/* Content */}
                <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

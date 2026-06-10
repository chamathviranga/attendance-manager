import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Automated Attendance & Shift Payroll for Retail" />
            <div className="min-h-screen bg-[#121212] text-gray-200 font-sans relative overflow-hidden selection:bg-indigo-500 selection:text-white">
                
                {/* Background Glows */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none"></div>

                {/* Header Navigation */}
                <header className="border-b border-[#2C2C2C] bg-[#1E1E1E]/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                        <ApplicationLogo className="text-indigo-500" />
                        <nav className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="border border-[#2C2C2C] hover:border-indigo-500 bg-[#1E1E1E] hover:bg-[#252525] text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors"
                                >
                                    Merchant Log In
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 border-b border-[#2C2C2C]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <span className="inline-block text-[10px] font-bold tracking-[0.25em] text-indigo-400 uppercase bg-indigo-950/30 border border-indigo-500/20 px-4 py-1.5 mb-6">
                            Tailored for UK Small Businesses & Shops
                        </span>
                        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white max-w-4xl mx-auto leading-tight">
                            Automate Attendance. <br className="hidden sm:inline" />
                            Track Shifts. <span className="text-indigo-400">Simplify Payroll.</span>
                        </h1>
                        <p className="mt-6 text-sm sm:text-base text-gray-400 max-w-2xl mx-auto uppercase tracking-widest leading-relaxed">
                            No more messy spreadsheets. Secure mobile check-ins, automated weekly earnings calculations, and instant printable paysheet PDF slips.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-widest uppercase py-4 px-8 transition-colors"
                                >
                                    Open Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-widest uppercase py-4 px-8 transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                                >
                                    Log In to Partner Portal
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-20 bg-[#171717] border-b border-[#2C2C2C]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-xs font-bold tracking-widest text-indigo-400 uppercase">Core Capabilities</h2>
                            <p className="mt-2 text-2xl font-black uppercase text-white tracking-wider">Engineered for absolute accuracy</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-8 hover:border-indigo-500/50 transition-colors">
                                <div className="w-12 h-12 bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mb-6">
                                    01
                                </div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">Multi-Branch Clock In</h3>
                                <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-wider">
                                    Define physical branches with specific contact details. Employees clock in and out from assigned shop branches via any device.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-8 hover:border-indigo-500/50 transition-colors">
                                <div className="w-12 h-12 bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mb-6">
                                    02
                                </div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">Clearance Ledger</h3>
                                <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-wider">
                                    Shop owners select employees to clear payments in bulk. Live calculations show exactly how much is owed for any selected week.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-8 hover:border-indigo-500/50 transition-colors">
                                <div className="w-12 h-12 bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mb-6">
                                    03
                                </div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">On-Demand PDF Slips</h3>
                                <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-wider">
                                    Generate official weekly statement slips on demand with custom business logos, total worked hours, base rates, and Sunday highlights.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Role Flow Description */}
                <section className="py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-3">How it works</h2>
                                <h3 className="text-3xl font-black uppercase text-white tracking-wider mb-6">Designed for merchants & staff</h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full border border-indigo-500 flex items-center justify-center text-indigo-400 text-xs font-black flex-shrink-0">
                                            ✓
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Controlled Accounts</h4>
                                            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                                                Self-registration is disabled to maintain strict system compliance. Accounts are securely provisioned by your system administrator.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full border border-indigo-500 flex items-center justify-center text-indigo-400 text-xs font-black flex-shrink-0">
                                            ✓
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Owner Settings</h4>
                                            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                                                Upload your business logo, specify contact details, set base hourly rates, and apply them across your employee roster.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full border border-indigo-500 flex items-center justify-center text-indigo-400 text-xs font-black flex-shrink-0">
                                            ✓
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Weekly Pay Sheets</h4>
                                            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                                                Both employees and shop owners can download official, professionally styled PDF receipts for all cleared weeks.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-8 space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-white border-b border-[#2C2C2C] pb-4">Merchant Portal Preview</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                                        <span>SYSTEM STATUS</span>
                                        <span className="text-green-400">● SECURE & LIVE</span>
                                    </div>
                                    <div className="p-4 bg-[#121212] border border-[#2C2C2C] flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Active Partner</div>
                                            <div className="text-xs font-bold uppercase tracking-widest text-white mt-1">Attendance Mark Ltd</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Default Rate</div>
                                            <div className="text-xs font-bold uppercase tracking-widest text-indigo-400 mt-1">£10.00/hr</div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[#121212] border border-[#2C2C2C] space-y-3">
                                        <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest">
                                            <span>Weekly Summary</span>
                                            <span className="text-green-400 border border-green-500/20 px-2 py-0.5 bg-green-950/10">CLEARED</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-white uppercase tracking-widest font-bold">Tharaka (Cashier)</span>
                                            <span className="text-xs text-white font-black">40.00h (£320.00)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-[#2C2C2C] bg-[#171717] py-12 text-center text-xs text-gray-500 uppercase tracking-widest">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
                        <div>&copy; {new Date().getFullYear()} Attendance Mark. All Rights Reserved.</div>
                        <div className="text-[10px] text-gray-600">Enterprise Shift & Payroll Management.</div>
                    </div>
                </footer>

            </div>
        </>
    );
}

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Smartphone,
  ReceiptText,
  BarChart3,
  Wallet,
  Menu,
  X,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatCurrency } from "./lib/utils";
import {
  Product,
  Transaction,
  Expense,
  DigitalTopUp,
  StockMovement,
  BankTransfer,
} from "./types";
import { INITIAL_PRODUCTS } from "./constants";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./lib/firebase";
import {
  useFirestoreCollection,
  useFirestoreDocument,
} from "./lib/firestoreHooks";
import AuthView from "./components/AuthView";

// --- Components ---
import DashboardView from "./components/DashboardView";
import TransactionView from "./components/TransactionView";
import StockView from "./components/StockView";
import PulseView from "./components/PulseView";
import ExpenseView from "./components/ExpenseView";
import FinanceView from "./components/FinanceView";
import ReportView from "./components/ReportView";

type View =
  | "dashboard"
  | "transactions"
  | "stock"
  | "pulse"
  | "expenses"
  | "finance"
  | "reports";

export default function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<"owner" | "admin">(() => {
    const saved = localStorage.getItem("userRole");
    return (saved as "owner" | "admin") || "admin";
  });

  const [user, loadingUser] = useAuthState(auth);

  const [products, setProducts, initProducts] = useFirestoreCollection<Product>(
    "products",
    INITIAL_PRODUCTS,
  );
  const [transactions, setTransactions, initTransactions] =
    useFirestoreCollection<Transaction>("transactions", []);
  const [expenses, setExpenses, initExpenses] = useFirestoreCollection<Expense>(
    "expenses",
    [],
  );
  const [digitalTopups, setDigitalTopups, initTopups] =
    useFirestoreCollection<DigitalTopUp>("digitalTopups", []);
  const [incomes, setIncomes, initIncomes] = useFirestoreCollection<any>(
    "incomes",
    [],
  );
  const [transfers, setTransfers, initTransfers] =
    useFirestoreCollection<BankTransfer>("transfers", []);
  const [stockMovements, setStockMovements, initMovements] =
    useFirestoreCollection<StockMovement>("stockMovements", []);
  const [cashBankHistory, setCashBankHistory, initHistory] =
    useFirestoreCollection<any>("cashBankHistory", []);
  const [suppliers, setSuppliers, initSuppliers] = useFirestoreCollection<any>(
    "suppliers",
    [],
  );
  const [returnReasons, setReturnReasons, initReasons] =
    useFirestoreCollection<any>("returnReasons", [
      { id: "1", label: "Barang Rusak" },
      { id: "2", label: "Salah Kirim" },
      { id: "3", label: "Expired" },
      { id: "4", label: "Tidak Layak Jual" },
    ]);

  const [balances, setBalances, initBalances] = useFirestoreDocument<{
    pulseBalance: number;
    transferBalance: number;
    cashBalance: number;
    bankBalance: number;
  }>("storeSettings/balances", {
    pulseBalance: 1250000,
    transferBalance: 500000,
    cashBalance: 5000000,
    bankBalance: 10000000,
  });

  const pulseBalance = balances.pulseBalance;
  const setPulseBalance = (val: any) =>
    setBalances((prev) => ({
      ...prev,
      pulseBalance: typeof val === "function" ? val(prev.pulseBalance) : val,
    }));

  const transferBalance = balances.transferBalance;
  const setTransferBalance = (val: any) =>
    setBalances((prev) => ({
      ...prev,
      transferBalance:
        typeof val === "function" ? val(prev.transferBalance) : val,
    }));

  const cashBalance = balances.cashBalance;
  const setCashBalance = (val: any) =>
    setBalances((prev) => ({
      ...prev,
      cashBalance: typeof val === "function" ? val(prev.cashBalance) : val,
    }));

  const bankBalance = balances.bankBalance;
  const setBankBalance = (val: any) =>
    setBalances((prev) => ({
      ...prev,
      bankBalance: typeof val === "function" ? val(prev.bankBalance) : val,
    }));

  const [showPassModal, setShowPassModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  // Initial migration logic can be disabled or integrated, but since it's firestore we let INITIAL_PRODUCTS populate ifempty
  // Removed old localStorage writers
  // ...

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["owner"],
    },
    {
      id: "transactions",
      label: "Transaksi",
      icon: ShoppingCart,
      roles: ["owner", "admin"],
    },
    {
      id: "stock",
      label: "Stok Barang",
      icon: Package,
      roles: ["owner", "admin"],
    },
    {
      id: "pulse",
      label: "E-Wallet & Pulsa",
      icon: Smartphone,
      roles: ["owner", "admin"],
    },
    {
      id: "expenses",
      label: "Kas Masuk/Keluar",
      icon: ReceiptText,
      roles: ["owner", "admin"],
    },
    { id: "finance", label: "Keuangan Kas", icon: Wallet, roles: ["owner"] },
    { id: "reports", label: "Laporan", icon: BarChart3, roles: ["owner", "admin"] },
  ].filter((item) => item.roles.includes(userRole));

  useEffect(() => {
    const currentItem = sidebarItems.find((item) => item.id === activeView);
    if (!currentItem && sidebarItems.length > 0) {
      setActiveView(sidebarItems[0].id as View);
    }
  }, [userRole, activeView, sidebarItems]);

  const handleRoleSwitch = (role: "owner" | "admin") => {
    if (role === "owner" && userRole === "admin") {
      setShowPassModal(true);
      setPasswordInput("");
    } else {
      setUserRole(role);
    }
  };

  const confirmPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "001122") {
      setUserRole("owner");
      setShowPassModal(false);
    } else {
      alert("Password salah!");
    }
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <DashboardView
            products={products}
            transactions={transactions}
            expenses={expenses}
            pulseBalance={pulseBalance}
            transferBalance={transferBalance}
            cashBalance={cashBalance}
            bankBalance={bankBalance}
            userRole={userRole}
          />
        );
      case "transactions":
        return (
          <TransactionView
            products={products}
            setProducts={setProducts}
            transactions={transactions}
            setTransactions={setTransactions}
            pulseBalance={pulseBalance}
            transferBalance={transferBalance}
            cashBalance={cashBalance}
            bankBalance={bankBalance}
            setBalances={setBalances}
            setStockMovements={setStockMovements}
          />
        );
      case "stock":
        return (
          <StockView
            products={products}
            setProducts={setProducts}
            setExpenses={setExpenses}
            cashBalance={cashBalance}
            setCashBalance={setCashBalance}
            bankBalance={bankBalance}
            setBankBalance={setBankBalance}
            setStockMovements={setStockMovements}
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            returnReasons={returnReasons}
            setReturnReasons={setReturnReasons}
            userRole={userRole}
          />
        );
      case "pulse":
        return (
          <PulseView
            pulseBalance={pulseBalance}
            transferBalance={transferBalance}
            setBalances={setBalances}
            digitalTopups={digitalTopups}
            setDigitalTopups={setDigitalTopups}
            cashBalance={cashBalance}
            bankBalance={bankBalance}
            setTransactions={setTransactions}
            userRole={userRole}
          />
        );
      case "expenses":
        return (
          <ExpenseView
            expenses={expenses}
            setExpenses={setExpenses}
            incomes={incomes}
            setIncomes={setIncomes}
            cashBalance={cashBalance}
            setCashBalance={setCashBalance}
            bankBalance={bankBalance}
            setBankBalance={setBankBalance}
            setProducts={setProducts}
            products={products}
            setStockMovements={setStockMovements}
          />
        );
      case "finance":
        return (
          <FinanceView
            transactions={transactions}
            expenses={expenses}
            products={products}
            cashBalance={cashBalance}
            bankBalance={bankBalance}
            setBalances={setBalances}
            transfers={transfers}
            setTransfers={setTransfers}
            cashBankHistory={cashBankHistory}
            setCashBankHistory={setCashBankHistory}
            userRole={userRole}
          />
        );
      case "reports":
        return (
          <ReportView
            transactions={transactions}
            setTransactions={setTransactions}
            expenses={expenses}
            products={products}
            setProducts={setProducts}
            digitalTopups={digitalTopups}
            stockMovements={stockMovements}
            setStockMovements={setStockMovements}
            transfers={transfers}
            cashBankHistory={cashBankHistory}
            setBalances={setBalances}
          />
        );
      default:
        return (
          <DashboardView
            products={products}
            transactions={transactions}
            expenses={expenses}
            pulseBalance={pulseBalance}
            transferBalance={transferBalance}
            cashBalance={cashBalance}
            bankBalance={bankBalance}
            userRole={userRole}
          />
        );
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-400">
        Memuat...
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  if (
    !initProducts ||
    !initTransactions ||
    !initExpenses ||
    !initTopups ||
    !initTransfers ||
    !initMovements ||
    !initHistory ||
    !initBalances ||
    !initSuppliers ||
    !initReasons ||
    !initIncomes
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-400">
        Sinkronisasi Data...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out shrink-0 relative z-20",
          isSidebarOpen ? "w-64" : "w-20",
        )}
      >
        <div className="p-6 flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-xl tracking-tight uppercase">
              Toko Kas Pro
            </span>
          )}
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer text-left",
                  isActive
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 translate-x-1"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive ? "opacity-100" : "opacity-80",
                  )}
                />
                {isSidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {isSidebarOpen && (
          <div className="p-4 mx-4 mb-2 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2 px-1 text-center">
              Mode Akses
            </div>
            <div className="flex bg-slate-900 p-1 rounded-xl gap-1">
              <button
                onClick={() => handleRoleSwitch("owner")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all cursor-pointer",
                  userRole === "owner"
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                Owner
              </button>
              <button
                onClick={() => handleRoleSwitch("admin")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all cursor-pointer",
                  userRole === "admin"
                    ? "bg-blue-500 text-white shadow-lg"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {isSidebarOpen && (
          <div className="p-4 bg-slate-800 m-4 rounded-2xl shadow-inner">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
              Saldo Toko (Cash)
            </div>
            <div className="text-lg font-bold text-emerald-400">
              {formatCurrency(cashBalance)}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 uppercase font-bold tracking-tight">
              E-Asset
            </div>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 text-[10px] bg-blue-500/10 text-blue-400 p-1 rounded text-center border border-blue-500/20">
                {formatCurrency(pulseBalance)}
              </div>
              <div className="flex-1 text-[10px] bg-purple-500/10 text-purple-400 p-1 rounded text-center border border-purple-500/20">
                {formatCurrency(transferBalance)}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 bg-emerald-500 rounded-full p-1 text-white shadow-lg hover:scale-110 transition-transform hidden lg:block"
        >
          {isSidebarOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 z-50 flex items-center justify-around h-16 px-2 rounded-[24px] shadow-2xl safe-area-bottom">
        {sidebarItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all relative",
                isActive ? "text-emerald-400" : "text-slate-400",
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all",
                  isActive ? "bg-white/10" : "",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "stroke-[2.5]" : "stroke-[2]",
                  )}
                />
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Mobile Quick Role Switcher Button */}
        <button
          onClick={() => setIsProfileMenuOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all",
            isProfileMenuOpen ? "text-emerald-400" : "text-slate-400",
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center font-black text-[9px] border transition-all",
              userRole === "owner"
                ? "bg-emerald-500 border-emerald-400 text-white"
                : "bg-blue-500 border-blue-400 text-white",
            )}
          >
            {userRole === "owner" ? "OW" : "AD"}
          </div>
          <span className="text-[7px] font-black uppercase tracking-widest">
            Menu
          </span>
        </button>
      </nav>

      <main className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
        <header className="h-16 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between shrink-0 box-border sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base md:text-xl font-black text-slate-800 uppercase tracking-tight">
              {activeView.replace("-", " ")}
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-5 text-slate-600">
            {/* Desktop Role Switcher */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-2xl gap-1">
              <button
                onClick={() => handleRoleSwitch("admin")}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  userRole === "admin"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                Kasir
              </button>
              <button
                onClick={() => handleRoleSwitch("owner")}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  userRole === "owner"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                Owner
              </button>
            </div>

            <div className="hidden sm:flex flex-col text-right text-xs">
              <div className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                Hari ini
              </div>
              <div className="font-bold text-slate-800">
                {new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            </div>

            <div
              onClick={() => setIsProfileMenuOpen(true)}
              className="flex items-center gap-2 md:gap-3 md:border-l border-slate-100 md:pl-6 leading-none cursor-pointer active:scale-95 transition-all"
            >
              <div className="text-right hidden xs:block">
                <div className="text-sm font-black text-slate-800 uppercase tracking-tighter truncate max-w-[80px]">
                  {userRole === "owner" ? "Owner" : "Kasir"}
                </div>
              </div>
              <div
                className={cn(
                  "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs border transition-colors",
                  userRole === "owner"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : "bg-blue-50 border-blue-200 text-blue-600",
                )}
              >
                {userRole === "owner" ? "OW" : "AD"}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-3 xs:p-4 md:p-8 overflow-y-auto no-scrollbar scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {isProfileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white z-[110] shadow-2xl flex flex-col md:hidden"
            >
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border",
                      userRole === "owner"
                        ? "bg-emerald-500 border-emerald-400"
                        : "bg-blue-500 border-blue-400",
                    )}
                  >
                    {userRole === "owner" ? "OW" : "AD"}
                  </div>
                  <div>
                    <div className="font-black text-sm uppercase tracking-tight">
                      {userRole === "owner"
                        ? "Owner Account"
                        : "Admin Terminal"}
                    </div>
                    <div className="text-[9px] text-white/50 font-black uppercase tracking-widest">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                {/* Financial Summary */}
                <div className="space-y-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">
                    Ringkasan Saldo
                  </div>
                  <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Saldo Tunai (Kas)
                      </div>
                      <Wallet className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-800 tabular-nums">
                      {formatCurrency(cashBalance)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                      <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">
                        Asset Pulsa
                      </div>
                      <div className="text-xs font-black text-blue-600 tabular-nums">
                        {formatCurrency(pulseBalance)}
                      </div>
                    </div>
                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                      <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">
                        Asset Digital
                      </div>
                      <div className="text-xs font-black text-purple-600 tabular-nums">
                        {formatCurrency(transferBalance)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Menu */}
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">
                    Menu Navigasi
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {sidebarItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveView(item.id as View);
                            setIsProfileMenuOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl transition-all border",
                            isActive
                              ? "bg-slate-800 border-slate-800 text-white shadow-xl shadow-slate-200"
                              : "bg-white border-transparent text-slate-500 active:bg-slate-50",
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5",
                              isActive ? "text-emerald-400" : "text-slate-300",
                            )}
                          />
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role Switcher */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 text-center">
                    Ganti Mode Akses
                  </div>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1.5">
                    <button
                      onClick={() => handleRoleSwitch("owner")}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                        userRole === "owner"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                          : "text-slate-400",
                      )}
                    >
                      Owner
                    </button>
                    <button
                      onClick={() => handleRoleSwitch("admin")}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                        userRole === "admin"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                          : "text-slate-400",
                      )}
                    >
                      Kasir
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => auth.signOut()}
                  className="w-full py-4 bg-white border border-slate-200 text-rose-500 font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all shadow-sm"
                >
                  Keluar Sistem
                </button>
              </div>
            </motion.div>
          </>
        )}

        {showPassModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
                  <Wallet className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
                  Akses Owner
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                  Masukkan password khusus untuk
                  <br />
                  mengakses seluruh fitur sistem
                </p>

                <form onSubmit={confirmPassword} className="mt-8 space-y-4">
                  <input
                    autoFocus
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none text-center font-black tracking-[0.5em] text-lg transition-all"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPassModal(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-3 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Konfirmasi
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

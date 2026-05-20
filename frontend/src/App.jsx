import FieldOfficerDashboard from './pages/FieldOfficerDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import RealtimeWeather from './pages/Weather/RealtimeWeather';
import FertilizerRecommendation from './pages/Weather/FertilizerRecommendation';
import HistoricalData from './pages/Weather/HistoricalData';
import CropOverview from './pages/Crop/CropOverview';
import MainOperations from './pages/Crop/MainOperations';
import SeasonalOperations from './pages/Crop/SeasonalOperations';
import FoliarIntel from './pages/Crop/FoliarIntel';
import PruningDashboard from './pages/Crop/PruningDashboard';
import CropIntelligence from './pages/Crop/CropIntelligence';
import ChatbotHub from './pages/Intelligence/ChatbotHub';
import BlockwiseHarvest from './pages/Reports/BlockwiseHarvest';
import PluckingRoundMonitor from './pages/Crop/PluckingRoundMonitor';
import PluckerPerformance from './pages/Reports/PluckerPerformance';
import FactoryCropWeight from './pages/Crop/FactoryCropWeight';
import ManureRound from './pages/Crop/ManureRound';
import WeedingRound from './pages/Crop/WeedingRound';
import FoliarRound from './pages/Crop/FoliarRound';
import LoppingRound from './pages/Crop/LoppingRound';
import RoundsIntel from './pages/Crop/RoundsIntel';
import OtherCropIntel from './pages/OtherCrops/OtherCropIntel';
import OtherCropsOperations from './pages/OtherCrops/OtherCropsOperations';
import OtherCropsSales from './pages/OtherCrops/OtherCropsSales';
import KrushiAI from './pages/OtherCrops/KrushiAI';
import CinnamonCompliance from './pages/OtherCrops/CinnamonCompliance';
import WorkforceList from './pages/Workforce/WorkforceList';
import WorkerView from './pages/Workforce/WorkerView';
import LabourRegistration from './pages/Workforce/LabourRegistration';
import LabourArchive from './pages/Workforce/LabourArchive';
import DutyRelease from './pages/Workforce/DutyRelease';
import AttendanceOverview from './pages/Attendance/AttendanceOverview';
import FaceAttendancePage from './pages/Attendance/FaceAttendance';
import WorkerEnrollmentPage from './pages/Attendance/WorkerEnrollment';
import QRAttendance from './pages/Attendance/QRAttendance';
import AttendanceTerminal from './pages/Attendance/AttendanceTerminal';
import TodaysAttendance from './pages/Attendance/TodaysAttendance';
import AttendanceAnalytics from './pages/Reports/AttendanceAnalytics';
import AssetDisposals from './pages/Reports/AssetDisposals';
import NotificationsPage from './pages/Notifications';
import PrivacyPage from './pages/Privacy';
import SupportPage from './pages/Support';
import ReleaseNotesPage from './pages/ReleaseNotes';
import GoodsInventoryPage from './pages/Inventory/GoodsInventory';
import AddGoodsItem from './pages/Inventory/AddGoodsItem';
import BiologicalAssetsInventoryPage from './pages/Inventory/BiologicalAssets';
import BiologicalRegistrationPage from './pages/Inventory/BiologicalAudit';
import PhysicalAssetsInventoryPage from './pages/Inventory/PhysicalAssets';
import SuppliersPage from './pages/Inventory/Suppliers';
import IssueGoodsPage from './pages/Inventory/IssueGoods';
import IssueHistoryPage from './pages/Inventory/IssueHistory';
import AccountsList from './pages/Accounts/AccountsList';
import AccountCreate from './pages/Accounts/AccountCreate';
import AccountEdit from './pages/Accounts/AccountEdit';
import PHDolomiteCalculator from './pages/Calculators/PHDolomiteCalculator';
import FoliarSprayCalculator from './pages/Calculators/FoliarSprayCalculator';

import BCalculator from './pages/Calculators/BCalculator';
import LoginPage from './pages/Login';
import FieldMapPage from './pages/GISMapping/FieldMapPage';
import FieldDataPage from './pages/GISMapping/FieldDataPage';
import GPSTrackingPage from './pages/GISMapping/GPSTrackingPage';
import AddFieldBlocksPage from './pages/GISMapping/AddFieldBlocksPage';
import DivisionsPage from './pages/GISMapping/DivisionsPage';
import FinanceOverviewPage from './pages/Finance/FinanceOverview';
import ChartOfAccountsPage from './pages/Finance/ChartOfAccounts';
import JournalEntriesPage from './pages/Finance/JournalEntries';
import ExpensesPage from './pages/Finance/Expenses';
import TrialBalancePage from './pages/Finance/TrialBalance';
import EstateCOPPage from './pages/Finance/EstateCOP';
import DailyWeeklyCOPPage from './pages/Finance/DailyWeeklyCOP';
import LeafIncomePage from './pages/Finance/BalancePayment';
import IncomePage from './pages/Finance/Income';
import CapitalExpensesPage from './pages/Finance/CapitalExpenses';
import InsuranceManagementPage from './pages/Compliance/InsuranceManagement';
import LabourCompliancePage from './pages/Compliance/LabourCompliance';
import EstateRegistrationPage from './pages/Compliance/EstateRegistration';
import TeaLandRegistrationPage from './pages/Compliance/TeaLandRegistration';
import EPFGuidelinesPage from './pages/Compliance/EPFGuidelines';
import ETFGuidelinesPage from './pages/Compliance/ETFGuidelines';
import SubsidyReplantingPage from './pages/Compliance/SubsidyReplanting';
import UserSettingsPage from './pages/Settings/UserSettings';
import Payrall from './pages/Payrall/Payrall';
import MonthlyPayrall from './pages/Payrall/MonthlyPayrall';
import TeaPacketIssue from './pages/Payrall/TeaPacketIssue';
import CashAdvance from './pages/Payrall/CashAdvance';
import CasualPayroll from './pages/Payrall/CasualPayroll';
import TeaInventory from './pages/Inventory/TeaInventory';

const DashboardSelector = () => {
  const storedUser = localStorage.getItem('user');
  let role = 'admin';
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      role = parsed.role || 'admin';
    } catch (e) {
      console.error('Error parsing stored user', e);
    }
  }

  if (role === 'field_officer') {
    return <FieldOfficerDashboard />;
  }
  if (role === 'manager') {
    return <ManagerDashboard />;
  }
  return <Dashboard />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  const getInitialTheme = () => {
    const storedTheme = localStorage.getItem('tea-erp-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }

    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');

    localStorage.setItem('tea-erp-theme', theme);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', theme === 'dark' ? '#020617' : '#f8fafc');
    }
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      const storedTheme = localStorage.getItem('tea-erp-theme');
      if (!storedTheme) {
        setTheme(event.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <AppLayout theme={theme} onToggleTheme={toggleTheme} /> : <Navigate to="/login" />}
        >
          <Route index element={<DashboardSelector />} />
          <Route path="weather" element={<Navigate to="/weather/realtime" />} />
          <Route path="weather/realtime" element={<RealtimeWeather />} />
          <Route path="weather/fertilizer" element={<FertilizerRecommendation />} />
          <Route path="weather/historical" element={<HistoricalData />} />
          <Route path="crop" element={<Navigate to="/crop/overview" />} />
          <Route path="crop/overview" element={<CropOverview />} />
          <Route path="crop/main" element={<MainOperations />} />
          <Route path="crop/seasonal" element={<SeasonalOperations />} />
          <Route path="crop/foliar-intel" element={<FoliarIntel />} />
          <Route path="crop/pruning" element={<PruningDashboard />} />
          <Route path="crop/operations-intel" element={<CropIntelligence />} />
          <Route path="crop/plucking-intel" element={<Navigate to="/crop/operations-intel" />} />
          <Route path="crop/pruning-intel" element={<Navigate to="/crop/operations-intel" />} />
          <Route path="crop/weeding-intel" element={<Navigate to="/crop/operations-intel" />} />
          <Route path="crop/manure-intel" element={<Navigate to="/crop/operations-intel" />} />



          <Route path="reports/blockwise" element={<BlockwiseHarvest />} />
          <Route path="crop/plucking-round" element={<PluckingRoundMonitor />} />
          <Route path="crop/rounds-intel" element={<RoundsIntel />} />
          <Route path="crop/other-crop-intel" element={<OtherCropIntel />} />
          <Route path="other-crops/operations" element={<OtherCropsOperations />} />
          <Route path="cinnamon/contracts" element={<Navigate to="/other-crops/operations" />} />
          <Route path="coconut/harvest" element={<Navigate to="/other-crops/operations" />} />
          <Route path="other-crops/sales" element={<OtherCropsSales />} />
          <Route path="cinnamon/sales" element={<Navigate to="/other-crops/sales" />} />
          <Route path="coconut/sales" element={<Navigate to="/other-crops/sales" />} />
          <Route path="other-crops/krushi-ai" element={<KrushiAI />} />
          <Route path="cinnamon/compliance" element={<CinnamonCompliance />} />
          <Route path="crop/weeding-round" element={<Navigate to="/crop/rounds-intel" />} />
          <Route path="crop/manure-round" element={<Navigate to="/crop/rounds-intel" />} />
          <Route path="crop/foliar-round" element={<Navigate to="/crop/rounds-intel" />} />
          <Route path="crop/lopping-round" element={<Navigate to="/crop/rounds-intel" />} />
          <Route path="crop/factory-weight" element={<FactoryCropWeight />} />
          <Route path="reports/plucker-performance" element={<PluckerPerformance />} />
          <Route path="workforce" element={<WorkforceList />} />
          <Route path="workforce/view" element={<WorkerView />} />
          <Route path="workforce/registration" element={<LabourRegistration />} />
          <Route path="workforce/archive" element={<LabourArchive />} />
          <Route path="workforce/release" element={<DutyRelease />} />
          
          <Route path="attendance" element={<Navigate to="/reports/attendance" />} />
          <Route path="field-officer-dashboard" element={<FieldOfficerDashboard />} />
          <Route path="attendance/overview" element={<AttendanceAnalytics />} />
          <Route path="attendance/live" element={<FaceAttendancePage />} />
          <Route path="attendance/qr" element={<QRAttendance />} />
          <Route path="attendance/manual" element={<AttendanceTerminal />} />
          <Route path="attendance/off-time" element={<AttendanceTerminal />} />
          <Route path="attendance/today" element={<TodaysAttendance />} />
          <Route path="attendance/enroll" element={<WorkerEnrollmentPage />} />
          <Route path="attendance/logs" element={<TodaysAttendance />} />
          
          <Route path="reports/attendance" element={<AttendanceAnalytics />} />
          <Route path="reports/asset-disposals" element={<AssetDisposals />} />
          
          <Route path="accounts" element={<AccountsList />} />
          <Route path="accounts/new" element={<AccountCreate />} />
          <Route path="accounts/:id/edit" element={<AccountEdit />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="inventory" element={<div className="p-8 text-center text-slate-500 font-outfit">Inventory Overview (select a submodule)</div>} />
          <Route path="inventory/goods" element={<GoodsInventoryPage />} />
          <Route path="inventory/goods/new" element={<AddGoodsItem />} />
          <Route path="inventory/goods/issue" element={<IssueGoodsPage />} />
          <Route path="inventory/goods/history" element={<IssueHistoryPage />} />
          <Route path="inventory/suppliers" element={<SuppliersPage />} />
          <Route path="inventory/biological-assets" element={<BiologicalAssetsInventoryPage />} />
          <Route path="inventory/biological-audit" element={<BiologicalRegistrationPage />} />
          <Route path="inventory/physical-assets" element={<PhysicalAssetsInventoryPage />} />
          {/* Finance Module */}
          <Route path="finance" element={<Navigate to="/finance/overview" />} />
          <Route path="finance/overview" element={<FinanceOverviewPage />} />
          <Route path="finance/accounts" element={<ChartOfAccountsPage />} />
          <Route path="finance/journal" element={<JournalEntriesPage />} />
          <Route path="finance/expenses" element={<ExpensesPage />} />
          <Route path="finance/capital-expenses" element={<CapitalExpensesPage />} />
          <Route path="finance/income" element={<IncomePage />} />
          <Route path="finance/trial-balance" element={<TrialBalancePage />} />
          <Route path="finance/estate-cop" element={<EstateCOPPage />} />
          <Route path="finance/daily-weekly-cop" element={<DailyWeeklyCOPPage />} />
          <Route path="finance/leaf-income" element={<LeafIncomePage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="release-notes" element={<ReleaseNotesPage />} />
          <Route path="calculators/ph-dolomite" element={<PHDolomiteCalculator />} />
          <Route path="calculators/foliar" element={<FoliarSprayCalculator />} />

          <Route path="calculators/chatbots" element={<ChatbotHub />} />
          <Route path="calculators/b-cal" element={<BCalculator />} />
          {/* GIS Mapping Module */}
          <Route path="mapping" element={<FieldMapPage />} />
          <Route path="mapping/field-data" element={<FieldDataPage />} />
          <Route path="mapping/gps-tracking" element={<GPSTrackingPage />} />
          <Route path="mapping/blocks" element={<AddFieldBlocksPage />} />
          <Route path="mapping/divisions" element={<DivisionsPage />} />
          {/* Compliance Module */}
          <Route path="compliance" element={<Navigate to="/compliance/insurance" />} />
          <Route path="compliance/insurance" element={<InsuranceManagementPage />} />
          <Route path="compliance/labour" element={<LabourCompliancePage />} />
          <Route path="compliance/estate" element={<EstateRegistrationPage />} />
          <Route path="compliance/tea-land" element={<TeaLandRegistrationPage />} />
          <Route path="compliance/epf-guidelines" element={<EPFGuidelinesPage />} />
          <Route path="compliance/etf-guidelines" element={<ETFGuidelinesPage />} />
          <Route path="compliance/subsidies" element={<SubsidyReplantingPage />} />
          <Route path="payrall" element={<Payrall />} />
          <Route path="payrall/monthly" element={<MonthlyPayrall />} />
          <Route path="/payrall/tea-packets" element={<TeaPacketIssue />} />
          <Route path="/payrall/advances" element={<CashAdvance />} />
          <Route path="/payrall/casual" element={<CasualPayroll />} />
          <Route path="/inventory/tea-packets" element={<TeaInventory />} />
          <Route path="settings" element={<UserSettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

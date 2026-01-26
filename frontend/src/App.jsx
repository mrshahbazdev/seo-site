import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddSite from './pages/AddSite';
import SiteAudit from './pages/SiteAudit';
import PageDetails from './pages/PageDetails';
import PageContent from './pages/PageContent';
import PaidAnalysisPage from './pages/PaidAnalysisPage';
import BacklinksPage from './pages/BacklinksPage';
import OnPageSummaryPage from './pages/OnPageSummaryPage';
import OnPageCrawledPages from './pages/OnPageCrawledPages';
import OnPagePageDetails from './pages/OnPagePageDetails';
import CompetitorsPage from './pages/CompetitorsPage';
import CompetitorDetailsPage from './pages/CompetitorDetailsPage';
import CompetitorComparison from './pages/CompetitorComparison';
import KeywordResearchPage from './pages/KeywordResearchPage';
import OpportunityFinderPage from './pages/OpportunityFinderPage';
import CompetitorSpyPage from './pages/CompetitorSpyPage';
import GapAnalysisPage from './pages/GapAnalysisPage';
import SiteDetailsPage from './pages/SiteDetailsPage';
import './index.css';

import { Toaster } from 'react-hot-toast';

function App() {
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/add"
          element={
            <PrivateRoute>
              <AddSite />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:id"
          element={
            <PrivateRoute>
              <SiteDetailsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:id/audit"
          element={
            <PrivateRoute>
              <SiteAudit />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:siteId/pages/:pageId"
          element={
            <PrivateRoute>
              <PageDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:siteId/pages/:pageId/content"
          element={
            <PrivateRoute>
              <PageContent />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:siteId/pages/:pageId/paid-analysis"
          element={
            <PrivateRoute>
              <PaidAnalysisPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:siteId/backlinks"
          element={
            <PrivateRoute>
              <BacklinksPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:id/onpage-summary"
          element={
            <PrivateRoute>
              <OnPageSummaryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:id/onpage/pages"
          element={
            <PrivateRoute>
              <OnPageCrawledPages />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:id/onpage/pages/:pageId"
          element={
            <PrivateRoute>
              <OnPagePageDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:siteId/pages/:pageId/backlinks"
          element={
            <PrivateRoute>
              <BacklinksPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:id/competitors"
          element={
            <PrivateRoute>
              <CompetitorsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:id/competitors/:competitorId"
          element={
            <PrivateRoute>
              <CompetitorDetailsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/sites/:id/competitors-comparison"
          element={
            <PrivateRoute>
              <CompetitorComparison />
            </PrivateRoute>
          }
        />
        <Route
          path="/keywords/research"
          element={
            <PrivateRoute>
              <KeywordResearchPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/opportunities/finder"
          element={
            <PrivateRoute>
              <OpportunityFinderPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/competitors/gap-analysis"
          element={
            <PrivateRoute>
              <GapAnalysisPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/competitors/spy"
          element={
            <PrivateRoute>
              <CompetitorSpyPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

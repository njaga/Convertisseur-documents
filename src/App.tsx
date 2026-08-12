import { Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import SeoManager from './components/SeoManager';
import ToolEditorial from './components/ToolEditorial';
import AboutPage from './pages/AboutPage';
import BatchManager from './pages/BatchManager';
import ConverterPage from './pages/ConverterPage';
import DocumentLab from './pages/DocumentLab';
import HistoryPage from './pages/HistoryPage';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import OptimizeTools from './pages/OptimizeTools';
import PdfTools from './pages/PdfTools';
import SupportedFormats from './pages/SupportedFormats';
import TermsOfUsePage from './pages/TermsOfUsePage';
import WatermarkPdfPage from './pages/WatermarkPdfPage';
import WorkspaceDraftsPage from './pages/WorkspaceDraftsPage';

export default function App() {
  return (
    <>
      <SeoManager />
      <ScrollToTop />
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/a-propos" element={<AboutPage />} />
          <Route path="/brouillons" element={<WorkspaceDraftsPage />} />
          <Route path="/convertir" element={<ConverterPage />} />

          <Route path="/fusionner-pdf" element={<PdfTools />} />
          <Route path="/diviser-pdf" element={<PdfTools />} />
          <Route path="/modifier-pdf" element={<PdfTools />} />
          <Route path="/formulaires-pdf" element={<PdfTools />} />
          <Route path="/organiser-pdf" element={<PdfTools />} />
          <Route path="/pivoter-pdf" element={<PdfTools />} />
          <Route path="/pdf-en-png" element={<PdfTools />} />
          <Route path="/images-en-pdf" element={<PdfTools />} />
          <Route path="/filigrane-pdf" element={<WatermarkPdfPage />} />
          <Route path="/pdf" element={<PdfTools />} />

          <Route path="/compresser-pdf" element={<OptimizeTools />} />
          <Route path="/optimiser-images" element={<OptimizeTools />} />
          <Route path="/compresser-video" element={<OptimizeTools />} />
          <Route path="/optimiser" element={<OptimizeTools />} />

          <Route path="/signer-pdf" element={<DocumentLab />} />
          <Route path="/ocr-pdf" element={<DocumentLab />} />
          <Route path="/creer-pdf" element={<DocumentLab />} />
          <Route path="/documents" element={<DocumentLab />} />

          <Route path="/batch" element={<BatchManager />} />
          <Route path="/historique" element={<HistoryPage />} />
          <Route path="/formats" element={<SupportedFormats />} />
          <Route path="/conditions" element={<TermsOfUsePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToolEditorial />
        <Footer />
      </div>
    </>
  );
}

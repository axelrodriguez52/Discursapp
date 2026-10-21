/* ==========================================================================
   AppShell: reproduce el orden exacto del DOM del HTML original.
   Cada seccion vive en su propio componente (src/components/**).
   ========================================================================== */
'use client';

import Splash from './Splash';
import Sidebar from './Sidebar';
import SidebarBackdrop from './SidebarBackdrop';
import LoadingOverlay from './LoadingOverlay';
import TopNav from './TopNav';
import NavDropdown from './NavDropdown';
import MobileDrawer from './MobileDrawer';
import FileInputs from './FileInputs';
import EstadisticasView from './views/EstadisticasView';
import EditorView from './views/EditorView';
import DashboardView from './views/DashboardView';
import MonthsView from './views/MonthsView';
import RegToast from './views/RegToast';
import CalendarioView from './views/CalendarioView';
import EventoModal from './modals/EventoModal';
import CalTooltip from './views/CalTooltip';
import DiaDetalleModal from './modals/DiaDetalleModal';
import AguayoView from './views/AguayoView';
import VisitasView from './views/VisitasView';
import ContactosView from './views/ContactosView';
import BosquejosView from './views/BosquejosView';
import BloqueoModal from './modals/BloqueoModal';
import SpeakerFormModal from './modals/SpeakerFormModal';
import RecordatorioModal from './modals/RecordatorioModal';
import PlantillaRecordatorioModal from './modals/PlantillaRecordatorioModal';
import SpeakerModal from './modals/SpeakerModal';
import Cropper from './Cropper';
import PhotoLightbox from './PhotoLightbox';

export default function AppShell() {
  return (
    <>
      <Splash />
      <Sidebar />
      <SidebarBackdrop />
      <LoadingOverlay />
      <main className="main-content">
        <TopNav />
        <NavDropdown />
        <MobileDrawer />
        <FileInputs />
        <EstadisticasView />
        <EditorView />
        <DashboardView />
        <MonthsView />
        <RegToast />
        <CalendarioView />
        <EventoModal />
        <CalTooltip />
        <DiaDetalleModal />
        <AguayoView />
        <VisitasView />
        <ContactosView />
        <BosquejosView />
        <BloqueoModal />
        <SpeakerFormModal />
        <RecordatorioModal />
        <PlantillaRecordatorioModal />
      </main>
      <SpeakerModal />
      <Cropper />
      <PhotoLightbox />
    </>
  );
}

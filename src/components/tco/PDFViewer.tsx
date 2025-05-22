
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string | null;
  onLoadSuccess?: () => void;
  onLoadError?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, onLoadSuccess, onLoadError }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    if (onLoadSuccess) onLoadSuccess();
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error while loading PDF document:', error);
    if (onLoadError) onLoadError();
  };

  const changePage = (offset: number) => {
    if (numPages) {
      const newPageNumber = pageNumber + offset;
      if (newPageNumber >= 1 && newPageNumber <= numPages) {
        setPageNumber(newPageNumber);
      }
    }
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const adjustZoom = (delta: number) => {
    setScale(prevScale => {
      const newScale = prevScale + delta;
      return newScale > 0.25 && newScale <= 2.5 ? newScale : prevScale;
    });
  };

  const zoomIn = () => adjustZoom(0.1);
  const zoomOut = () => adjustZoom(-0.1);

  const toggleFullscreen = () => {
    const viewerElement = document.getElementById('pdf-viewer-container');
    
    if (!document.fullscreenElement) {
      if (viewerElement?.requestFullscreen) {
        viewerElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col" id="pdf-viewer-container">
      <div className="bg-gray-100 p-3 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Button 
            onClick={previousPage} 
            disabled={pageNumber <= 1} 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm">
            {pageNumber} de {numPages || '...'}
          </span>
          
          <Button 
            onClick={nextPage} 
            disabled={numPages === null || pageNumber >= numPages} 
            variant="outline" 
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={zoomOut} 
            variant="outline" 
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Diminuir zoom"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button 
            onClick={zoomIn} 
            variant="outline" 
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={toggleFullscreen} 
            variant="outline" 
            size="sm"
            className="h-8 w-8 p-0"
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex-grow overflow-auto bg-gray-200 flex justify-center p-4">
        {pdfUrl ? (
          <div className="pdf-container shadow-lg">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-[500px] w-[400px] bg-white p-4">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
                </div>
              }
              error={
                <div className="flex items-center justify-center h-[500px] w-[400px] bg-white p-8">
                  <p className="text-red-500 text-center">
                    Não foi possível carregar o PDF. 
                    <br />
                    Por favor, tente novamente mais tarde.
                  </p>
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="pdf-page"
              />
            </Document>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[500px] w-full bg-white rounded-lg">
            <p className="text-gray-500">Nenhum PDF selecionado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;

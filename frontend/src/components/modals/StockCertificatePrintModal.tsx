'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface StockCertificatePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: any;
}

const toPersianDigits = (num: string | number) => {
  if (num === null || num === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
};

// ============================================================================
// راهنمای تنظیم موقعیت متن‌ها:
// right: فاصله از سمت راست برگه (بیشتر = چپ‌تر)
// top:   فاصله از بالای برگه   (بیشتر = پایین‌تر)
// ============================================================================
const LAYOUT = {
  registrationNumber: { top: '17%', right: '78%' },
  registrationDate: { top: '21.5%', right: '78%' },
  registrationLocation: { top: '26%', right: '78%' },

  registeredCapital: { top: '46%' }, // full-width centered in blue bar

  // Right Column — سمت راست صفحه
  shareholderName: { top: '56.5%', right: '25%' },
  fatherName: { top: '61%', right: '25%' },
  nationalId: { top: '65.5%', right: '25%' },
  sharesCount: { top: '70%', right: '25%' },

  // Left Column — سمت چپ صفحه
  shareRange: { top: '56.5%', right: '70%' },
  shareValue: { top: '61%', right: '70%' },
  totalAmount: { top: '65.5%', right: '70%' },
  amountInWords: { top: '70%', right: '70%' },
};

// ─── Preview component (JSX, used for the on-screen preview only) ────────────
function CertificateContent({ certificate, bgImageBase64 }: { certificate: any; bgImageBase64: string }) {
  const base: React.CSSProperties = {
    position: 'absolute',
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'Kalameh, sans-serif',
    fontSize: '15px',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={bgImageBase64 || '/stock-template.jpg'} alt="Template"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>

        {/* Registration Info */}
        <div style={{ ...base, top: LAYOUT.registrationNumber.top, right: LAYOUT.registrationNumber.right }}>{toPersianDigits(certificate.registrationNumber || '')}</div>
        <div style={{ ...base, top: LAYOUT.registrationDate.top, right: LAYOUT.registrationDate.right }}>{toPersianDigits(certificate.registrationDate || '')}</div>
        <div style={{ ...base, top: LAYOUT.registrationLocation.top, right: LAYOUT.registrationLocation.right }}>{certificate.registrationLocation || ''}</div>

        {/* Blue bar — full width centered */}
        <div style={{
          position: 'absolute', top: LAYOUT.registeredCapital.top, left: 0, width: '100%',
          textAlign: 'center', transform: 'translateY(calc(-50% + 20px))', direction: 'rtl',
          fontSize: '22px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Kalameh, sans-serif',
          letterSpacing: '0.06em', whiteSpace: 'nowrap'
        }}>
          سرمایه ثبت شده : {toPersianDigits(parseFloat(certificate.registeredCapital || 0).toLocaleString())} ریال
        </div>

        {/* Right side */}
        <div style={{ ...base, top: LAYOUT.shareholderName.top, right: LAYOUT.shareholderName.right, transform: 'translateY(-50%)' }}>{certificate.shareholderName}</div>
        <div style={{ ...base, top: LAYOUT.fatherName.top, right: LAYOUT.fatherName.right, transform: 'translateY(-50%)' }}>{certificate.fatherName}</div>
        <div style={{ ...base, top: LAYOUT.nationalId.top, right: LAYOUT.nationalId.right, transform: 'translateY(-50%)' }}>{toPersianDigits(certificate.nationalId)}</div>
        <div style={{ ...base, top: LAYOUT.sharesCount.top, right: LAYOUT.sharesCount.right, transform: 'translateY(-50%)' }}>{toPersianDigits(parseFloat(certificate.sharesCount).toLocaleString())}</div>

        {/* Left side */}
        <div style={{ ...base, top: LAYOUT.shareRange.top, right: LAYOUT.shareRange.right, transform: 'translateY(-50%)' }}>از شماره {toPersianDigits(parseFloat(certificate.shareRangeFrom).toLocaleString())} تا شماره {toPersianDigits(parseFloat(certificate.shareRangeTo).toLocaleString())}</div>
        <div style={{ ...base, top: LAYOUT.shareValue.top, right: LAYOUT.shareValue.right, transform: 'translateY(-50%)' }}>{toPersianDigits(parseFloat(certificate.shareValue).toLocaleString())} ریال</div>
        <div style={{ ...base, top: LAYOUT.totalAmount.top, right: LAYOUT.totalAmount.right, transform: 'translateY(-50%)' }}>{toPersianDigits(parseFloat(certificate.totalAmount).toLocaleString())} ریال</div>
        <div style={{ ...base, top: LAYOUT.amountInWords.top, right: LAYOUT.amountInWords.right, transform: 'translateY(-50%)' }}>{certificate.amountInWords} ریال</div>

      </div>
    </>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
export function StockCertificatePrintModal({ isOpen, onClose, certificate }: StockCertificatePrintModalProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [bgImageBase64, setBgImageBase64] = useState<string>('');

  // Load background image as Base64 to avoid CORS/taint errors
  useEffect(() => {
    fetch('/stock-template.jpg')
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => setBgImageBase64(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(e => console.error('Failed to load background image:', e));
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!certificate) return null;

  // ── Shared HTML builder — same output for both Print and PDF ──────────────
  const buildHtml = (forPrint: boolean) => {
    const origin = window.location.origin;
    const bgSrc = bgImageBase64 || `${origin}/stock-template.jpg`;
    const capText = `سرمایه ثبت شده : ${toPersianDigits(parseFloat(certificate.registeredCapital || 0).toLocaleString())} ریال`;
    // Blue bar Y position in pixels (46% of 794px height)
    const capTopPx = Math.round(0.46 * 794);
    const capHeight = 52;
    const capTopOffset = capTopPx - Math.round(capHeight / 2) + 20; // +20px shift down

    // Canvas is created at 3× physical size but displayed at 1× via CSS.
    // html2canvas (scale:3) then captures it at native resolution → sharp text.
    const cvW = 1123 * 3; // 3369
    const cvH = capHeight * 3; // 156
    const blueBarHtml = forPrint
      ? `<div style="position:absolute;left:0;width:100%;top:${capTopOffset}px;
           height:${capHeight}px;display:flex;align-items:center;
           justify-content:center;font-size:22px;color:#fff;
           letter-spacing:0.06em;">${capText}</div>`
      : `<canvas id="capCvs" width="${cvW}" height="${cvH}"
           style="position:absolute;top:${capTopOffset}px;left:0;
                  width:1123px;height:${capHeight}px;z-index:15;"></canvas>`;

    const canvasScript = forPrint ? '' : `
<script>
(function(){
  function draw() {
    var c = document.getElementById('capCvs');
    if (!c) return;
    var ctx = c.getContext('2d');
    ctx.clearRect(0,0,c.width,c.height);
    ctx.font = 'bold 66px Kalameh, Tahoma, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('${capText}', ${Math.round(cvW / 2)}, ${Math.round(cvH / 2)});
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(draw);
  } else {
    window.addEventListener('load', draw);
    setTimeout(draw, 500);
  }
})();
<\/script>`;

    return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>گواهی سهام - ${certificate.serialNumber || ''}</title>
  <style>
    @font-face { font-family:'Kalameh'; src:url('${origin}/fonts/KalamehFaNum-Regular.ttf') format('truetype'); font-weight:normal; }
    @font-face { font-family:'Kalameh'; src:url('${origin}/fonts/KalamehFaNum-Bold.ttf')    format('truetype'); font-weight:bold;   }
    *    { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:1123px; height:794px; overflow:hidden; }
    body { font-family:'Kalameh',sans-serif; font-weight:bold; direction:rtl;
           -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    ${forPrint ? '@page { size:A4 landscape; margin:0; }' : ''}
    .wrap { position:relative; width:1123px; height:794px; overflow:hidden; }
    .bg   { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0; }
    .ov   { position:absolute; inset:0; z-index:10; font-size:15px; white-space:nowrap; color:#1f2937; }
    .t    { position:absolute; }
  </style>
</head>
<body>
<div class="wrap">
  <img src="${bgSrc}" class="bg" />
  <div class="ov">
    <div class="t" style="top:${LAYOUT.registrationNumber.top};right:${LAYOUT.registrationNumber.right}">${toPersianDigits(certificate.registrationNumber || '')}</div>
    <div class="t" style="top:${LAYOUT.registrationDate.top};right:${LAYOUT.registrationDate.right}">${toPersianDigits(certificate.registrationDate || '')}</div>
    <div class="t" style="top:${LAYOUT.registrationLocation.top};right:${LAYOUT.registrationLocation.right}">${certificate.registrationLocation || ''}</div>
    ${blueBarHtml}
    <div class="t" style="top:${LAYOUT.shareholderName.top};right:${LAYOUT.shareholderName.right};transform:translateY(-50%)">${certificate.shareholderName}</div>
    <div class="t" style="top:${LAYOUT.fatherName.top};right:${LAYOUT.fatherName.right};transform:translateY(-50%)">${certificate.fatherName}</div>
    <div class="t" style="top:${LAYOUT.nationalId.top};right:${LAYOUT.nationalId.right};transform:translateY(-50%)">${toPersianDigits(certificate.nationalId)}</div>
    <div class="t" style="top:${LAYOUT.sharesCount.top};right:${LAYOUT.sharesCount.right};transform:translateY(-50%)">${toPersianDigits(parseFloat(certificate.sharesCount).toLocaleString())}</div>
    <div class="t" style="top:${LAYOUT.shareRange.top};right:${LAYOUT.shareRange.right};transform:translateY(-50%)">از شماره ${toPersianDigits(parseFloat(certificate.shareRangeFrom).toLocaleString())} تا شماره ${toPersianDigits(parseFloat(certificate.shareRangeTo).toLocaleString())}</div>
    <div class="t" style="top:${LAYOUT.shareValue.top};right:${LAYOUT.shareValue.right};transform:translateY(-50%)">${toPersianDigits(parseFloat(certificate.shareValue).toLocaleString())} ریال</div>
    <div class="t" style="top:${LAYOUT.totalAmount.top};right:${LAYOUT.totalAmount.right};transform:translateY(-50%)">${toPersianDigits(parseFloat(certificate.totalAmount).toLocaleString())} ریال</div>
    <div class="t" style="top:${LAYOUT.amountInWords.top};right:${LAYOUT.amountInWords.right};transform:translateY(-50%)">${certificate.amountInWords} ریال</div>
  </div>
</div>
${canvasScript}
${forPrint ? '<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);}<\/script>' : ''}
</body></html>`;
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(buildHtml(true));
    w.document.close();
  };

  // ── PDF (iframe → html2canvas) ───────────────────────────────────────────
  // Render the SAME HTML (which works correctly for print) inside a hidden
  // iframe, then capture with html2canvas at 3× scale for high quality.
  // The iframe has dir="rtl" on the root <html> element, so RTL text is
  // rendered correctly by the browser before html2canvas takes the screenshot.
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    let iframe: HTMLIFrameElement | null = null;
    try {
      iframe = document.createElement('iframe');
      // allow-scripts needed so the inline canvas-drawing script can run
      iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
      iframe.style.cssText =
        'position:fixed;top:0;left:0;width:1123px;height:794px;border:none;' +
        'opacity:0;pointer-events:none;z-index:-1;';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument!;
      doc.open();
      doc.write(buildHtml(false));
      doc.close();

      // Wait for fonts + images inside the iframe
      await new Promise<void>(resolve => {
        const check = () => {
          if (iframe!.contentWindow?.document.readyState === 'complete') resolve();
          else setTimeout(check, 50);
        };
        check();
      });
      try { await (doc as any).fonts.ready; } catch (_) { /* ignore */ }
      // Extra wait for the inline canvas script to finish drawing
      await new Promise(r => setTimeout(r, 1200));

      const canvas = await html2canvas(doc.body, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1123,
        height: 794,
        windowWidth: 1123,
        windowHeight: 794,
        onclone: (cloned) => {
          // Remove any stylesheets with unsupported CSS color functions
          cloned.querySelectorAll('style,link[rel="stylesheet"]').forEach((el: any) => {
            if (el.tagName === 'LINK' || (el.textContent &&
              (el.textContent.includes('oklch') || el.textContent.includes('lab(')))) {
              el.remove();
            }
          });
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      const fileName = certificate?.serialNumber
        ? `StockCertificate_${certificate.serialNumber}.pdf`
        : 'StockCertificate.pdf';
      pdf.save(fileName);
    } catch (err: any) {
      console.error('PDF error:', err);
      alert('خطا در تولید PDF: ' + (err.message || 'نامشخص'));
    } finally {
      if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
      setIsGeneratingPdf(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">پیش‌نمایش گواهی سهام</h2>
              <div className="flex gap-3">
                <button onClick={handleDownloadPdf} disabled={isGeneratingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50">
                  <Download className="w-4 h-4" />
                  {isGeneratingPdf ? 'درحال آماده‌سازی...' : 'دانلود PDF'}
                </button>
                <button onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm">
                  <Printer className="w-4 h-4" />
                  چاپ مستقیم
                </button>
                <button onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview — CSS scaled down for display */}
            <div className="p-6 overflow-y-auto bg-gray-200 flex justify-center flex-1 items-start">
              <style>{`
                @font-face { font-family:'Kalameh'; src:url('/fonts/KalamehFaNum-Regular.ttf') format('truetype'); font-weight:normal; }
                @font-face { font-family:'Kalameh'; src:url('/fonts/KalamehFaNum-Bold.ttf')    format('truetype'); font-weight:bold; }
              `}</style>
              <div className="relative shadow-2xl bg-white origin-top"
                style={{ transform: 'scale(0.74)', marginBottom: '-54px' }}>
                <div style={{
                  position: 'relative', width: '1123px', height: '794px',
                  fontFamily: 'Kalameh, sans-serif', overflow: 'hidden', backgroundColor: '#ffffff'
                }}>
                  <CertificateContent certificate={certificate} bgImageBase64={bgImageBase64} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

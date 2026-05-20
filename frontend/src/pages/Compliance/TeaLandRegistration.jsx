import { useState, useRef } from "react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { apiClient } from '../../api/client';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&display=swap');

  #tea-land-form *, #tea-land-form *::before, #tea-land-form *::after { box-sizing: border-box; }

  #tea-land-form {
    background: #c8c8c8;
    font-family: 'Times New Roman', Times, serif;
    color: #000;
    padding: 8px 0 32px;
  }

  /* ── Toolbar ── */
  #tea-land-form .toolbar {
    max-width: 794px;
    margin: 16px auto 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }
  #tea-land-form .btn-guideline {
    background: #fff;
    border: 1px solid #888;
    padding: 5px 14px;
    font-size: 12px;
    font-family: Arial, sans-serif;
    cursor: pointer;
    border-radius: 2px;
  }
  #tea-land-form .btn-guideline:hover { background: #f0f0f0; }
  #tea-land-form .btn-print {
    background: #1a56a4;
    color: #fff;
    border: none;
    padding: 6px 18px;
    font-size: 12px;
    font-family: Arial, sans-serif;
    cursor: pointer;
    border-radius: 2px;
  }
  #tea-land-form .btn-print:hover { background: #1446884; }

  /* ── Guidelines panel ── */
  #tea-land-form .guidelines-panel {
    max-width: 794px;
    margin: 0 auto 10px;
    background: #fafafa;
    border: 1px solid #aaa;
    font-family: Arial, sans-serif;
    font-size: 11.5px;
  }
  #tea-land-form .gl-header {
    background: #ececec;
    border-bottom: 1px solid #ccc;
    padding: 7px 14px;
    font-weight: bold;
    color: #111;
  }
  #tea-land-form .gl-body { padding: 10px 16px 14px; }
  #tea-land-form .gl-intro {
    font-family: 'Noto Sans Sinhala', sans-serif;
    font-size: 11.5px;
    line-height: 1.8;
    color: #333;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px dashed #bbb;
  }
  #tea-land-form .gl-section-title {
    font-weight: bold;
    color: #000;
    margin: 10px 0 5px;
    text-decoration: underline;
    font-size: 11.5px;
  }
  #tea-land-form .gl-list { padding-left: 18px; margin: 0; }
  #tea-land-form .gl-list li {
    font-family: 'Noto Sans Sinhala', sans-serif;
    font-size: 11px;
    line-height: 1.85;
    color: #222;
    margin-bottom: 2px;
  }
  #tea-land-form .gl-code-row {
    display: flex; align-items: center; gap: 8px;
    margin: 8px 0;
    font-family: 'Noto Sans Sinhala', sans-serif;
    font-size: 11.5px;
  }
  #tea-land-form .gl-code-row .cboxes { display: flex; }
  #tea-land-form .gl-code-row .cboxes span {
    width: 20px; height: 20px;
    border: 1px solid #555; border-right: none;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 12px; font-family: Arial, sans-serif; font-weight: bold;
  }
  #tea-land-form .gl-code-row .cboxes span:last-child { border-right: 1px solid #555; }

  /* ═══ DOCUMENT PAGE ═══ */
  #tea-land-form .doc-page {
    max-width: 816px;
    margin: 0 auto 32px;
    background: #fff;
    border: 1px solid #999;
    padding: 40px 48px 48px;
    position: relative;
    box-sizing: border-box;
  }

  /* TR-02 top-right badge */
  #tea-land-form .doc-code {
    position: absolute;
    top: 22px; right: 42px;
    font-family: Arial, sans-serif;
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 1px;
  }

  /* ── Header ── */
  #tea-land-form .doc-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding-bottom: 14px;
    margin-bottom: 16px;
    border-bottom: 2px solid #000;
  }
  #tea-land-form .doc-emblem { width: 64px; height: 64px; object-fit: contain; flex-shrink: 0; }
  #tea-land-form .doc-title-sin {
    font-family: 'Noto Sans Sinhala', sans-serif;
    font-size: 17px; font-weight: 700;
    text-decoration: underline; text-align: center; line-height: 1.5;
  }
  #tea-land-form .doc-title-sub {
    font-family: 'Noto Sans Sinhala', sans-serif;
    font-size: 12px; text-align: center; margin-top: 3px;
  }

  /* ── Serial row ── */
  #tea-land-form .serial-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px; padding-bottom: 10px;
    border-bottom: 1px solid #000;
    flex-wrap: wrap; gap: 8px;
  }
  #tea-land-form .serial-label { font-family: 'Noto Sans Sinhala', sans-serif; font-size: 13px; }
  #tea-land-form .office-note  { font-family: 'Noto Sans Sinhala', sans-serif; font-size: 10.5px; color: #555; }

  /* ── Boxed character inputs ── */
  #tea-land-form .box-strip { display: flex; }
  #tea-land-form .box-strip input {
    width: 26px; height: 26px;
    border: 1px solid #000; border-right: none;
    text-align: center; font-size: 13px;
    font-family: Arial, sans-serif; outline: none; background: #fff;
  }
  #tea-land-form .box-strip input:last-child { border-right: 1px solid #000; }
  #tea-land-form .box-strip input:focus { background: #fffde7; }

  /* ── Section headings ── */
  #tea-land-form .sec-head {
    font-family: 'Noto Sans Sinhala', sans-serif;
    font-size: 14px; font-weight: 700; margin: 20px 0 14px;
  }

  /* ── Field label ── */
  #tea-land-form .fl { font-family: 'Noto Sans Sinhala', sans-serif; font-size: 12.5px; display: inline; }

  /* ── Dotted underline inputs ── */
  #tea-land-form .dotline {
    border: none; border-bottom: 1px dotted #666; outline: none;
    font-family: 'Times New Roman', serif; font-size: 13px;
    padding: 1px 4px; background: transparent;
    width: 100%; display: block; margin-top: 2px;
  }
  #tea-land-form .dotline:focus { border-bottom: 1.5px solid #000; background: #fffde7; }
  #tea-land-form .dotline-i {
    border: none; border-bottom: 1px dotted #666; outline: none;
    font-family: 'Times New Roman', serif; font-size: 13px;
    padding: 1px 4px; background: transparent; flex: 1; min-width: 80px;
  }
  #tea-land-form .dotline-i:focus { border-bottom: 1.5px solid #000; background: #fffde7; }

  /* ── Row wrappers ── */
  #tea-land-form .f-row { margin-bottom: 11px; }
  #tea-land-form .f-inline { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; margin-bottom: 11px; }
  #tea-land-form .f-cols2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin-bottom: 10px; }
  #tea-land-form .f-cols3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px 16px; margin-bottom: 10px; }

  /* ── Tick box ── */
  #tea-land-form .tbox {
    display: inline-flex; align-items: center; justify-content: center;
    width: 15px; height: 15px; border: 1px solid #000;
    font-size: 11px; line-height: 1; cursor: pointer; flex-shrink: 0; user-select: none;
  }
  #tea-land-form .c-opt {
    display: inline-flex; align-items: center; gap: 4px; cursor: pointer;
    font-family: 'Noto Sans Sinhala', sans-serif; font-size: 12.5px; margin-right: 16px;
  }

  /* ── Yes/No row ── */
  #tea-land-form .yn-row {
    display: flex; align-items: center; flex-wrap: wrap;
    gap: 6px 18px; margin-bottom: 11px;
    font-family: 'Noto Sans Sinhala', sans-serif; font-size: 12.5px;
  }
  #tea-land-form .yn-q { flex: 1; min-width: 180px; }

  /* ── Data table ── */
  #tea-land-form .dtable { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 12px; }
  #tea-land-form .dtable th {
    border: 1px solid #000; padding: 5px 6px; text-align: center;
    font-family: 'Noto Sans Sinhala', sans-serif; font-size: 11.5px;
    background: #f2f2f2; line-height: 1.5;
  }
  #tea-land-form .dtable td { border: 1px solid #000; padding: 0; }
  #tea-land-form .dtable td input {
    width: 100%; border: none; outline: none; padding: 5px;
    font-family: 'Times New Roman', serif; font-size: 12.5px; background: transparent;
  }
  #tea-land-form .dtable td input:focus { background: #fffde7; }
  #tea-land-form .dtable td.tc { text-align: center; vertical-align: middle; padding: 4px; }

  #tea-land-form .add-row {
    font-family: Arial, sans-serif; font-size: 11px;
    border: 1px dashed #666; background: none;
    padding: 3px 10px; cursor: pointer; color: #444;
    margin-bottom: 10px; border-radius: 2px;
  }
  #tea-land-form .add-row:hover { background: #f5f5f5; }

  /* ── Rule ── */
  #tea-land-form .hr-solid { border: none; border-top: 1px solid #000; margin: 16px 0; }

  /* ── Declaration & GN boxes ── */
  #tea-land-form .decl-box {
    border: 1px solid #000; padding: 12px 16px 16px;
    font-family: 'Noto Sans Sinhala', sans-serif; font-size: 12.5px;
    line-height: 2; margin-bottom: 0; page-break-inside: avoid;
  }
  #tea-land-form .gn-box {
    border: 1px solid #000; border-top: none; padding: 12px 16px 16px;
    font-family: 'Noto Sans Sinhala', sans-serif; font-size: 12.5px;
    line-height: 2; page-break-inside: avoid;
  }
  #tea-land-form .sig-row { display: flex; gap: 32px; flex-wrap: wrap; margin-top: 14px; }
  #tea-land-form .sig-field { flex: 1; min-width: 160px; }
  #tea-land-form .sig-label { font-family: 'Noto Sans Sinhala', sans-serif; font-size: 12px; display: block; margin-bottom: 2px; }
  #tea-land-form .sig-line {
    width: 100%; border: none; border-bottom: 1px solid #000; outline: none;
    font-size: 13px; font-family: 'Times New Roman', serif; padding: 2px 4px; background: transparent;
  }
  #tea-land-form .sig-line:focus { background: #fffde7; }
  #tea-land-form .office-bar {
    border-top: 1px solid #000; margin-top: 14px; padding-top: 6px;
    font-family: 'Noto Sans Sinhala', sans-serif; font-size: 11px; color: #555;
  }

  /* ── Action bar ── */
  #tea-land-form .action-bar {
    max-width: 816px; margin: 0 auto 40px;
    display: flex; justify-content: flex-end; gap: 10px;
  }
  #tea-land-form .btn-reset {
    font-family: Arial, sans-serif; font-size: 12px;
    border: 1px solid #666; background: #fff;
    padding: 6px 18px; cursor: pointer; border-radius: 2px;
  }
  #tea-land-form .btn-reset:hover { background: #f0f0f0; }
  #tea-land-form .btn-submit {
    font-family: Arial, sans-serif; font-size: 12px;
    border: none; background: #111; color: #fff;
    padding: 6px 20px; cursor: pointer; border-radius: 2px;
  }
  #tea-land-form .btn-submit:hover { background: #333; }

  #tea-land-form .toast {
    position: fixed; bottom: 20px; right: 20px;
    background: #111; color: #fff;
    padding: 10px 18px; font-size: 13px;
    font-family: Arial, sans-serif; border-radius: 3px; z-index: 999;
  }
`;

/* ── Helpers ── */
const FL = ({ children }) => <span className="fl">{children}</span>;

const BoxStrip = ({ count, value, onChange }) => {
  const arr = Array(count).fill('');
  return (
    <div className="box-strip">
      {arr.map((_, i) => (
        <input
          key={i} maxLength={1}
          value={value[i] || ''}
          onChange={e => {
            const a = [...(value.length ? value : arr)];
            a[i] = e.target.value.slice(-1);
            onChange(a);
          }}
        />
      ))}
    </div>
  );
};

const TBox = ({ checked, onClick }) => (
  <span className="tbox" onClick={onClick}>{checked ? '✓' : ''}</span>
);

const COpt = ({ label, checked, onClick }) => (
  <span className="c-opt" onClick={onClick}>
    <TBox checked={checked} onClick={() => { }} />
    {label}
  </span>
);

const YesNo = ({ label, value, onChange }) => (
  <div className="yn-row">
    <span className="yn-q"><FL>{label}</FL></span>
    <COpt label="ඔව්" checked={value === 'ඔව්'} onClick={() => onChange('ඔව්')} />
    <COpt label="නැත" checked={value === 'නැත'} onClick={() => onChange('නැත')} />
  </div>
);

const SigField = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div className="sig-field">
    <span className="sig-label">{label}</span>
    <input className="sig-line" type={type} value={value} onChange={onChange} placeholder={placeholder} />
  </div>
);

export default function TeaLandForm() {
  /* ── State ── */
  const [serial, setSerial] = useState(Array(10).fill(''));
  const [landName, setLandName] = useState('');
  const [landNature, setLandNature] = useState('');
  const [certNum, setCertNum] = useState(Array(12).fill(''));
  const [owners, setOwners] = useState([{ name: '', nic: '', addr: '', cap: '' }]);
  const [fPhone, setFPhone] = useState(Array(10).fill(''));
  const [mPhone, setMPhone] = useState(Array(10).fill(''));
  const [email, setEmail] = useState('');
  const [bkName, setBkName] = useState('');
  const [bkBranch, setBkBranch] = useState('');
  const [bkAcc, setBkAcc] = useState(Array(16).fill(''));
  const [bkCode, setBkCode] = useState(Array(4).fill(''));
  const [bkBCode, setBkBCode] = useState(Array(4).fill(''));
  const [ownerCult, setOwnerCult] = useState('');
  const [coName, setCoName] = useState('');
  const [coReg, setCoReg] = useState('');
  const [extA, setExtA] = useState(Array(4).fill(''));
  const [extR, setExtR] = useState(Array(2).fill(''));
  const [extP, setExtP] = useState(Array(3).fill(''));
  const [survey, setSurvey] = useState('');
  const [lot, setLot] = useState('');
  const [dist, setDist] = useState('');
  const [dsDiv, setDsDiv] = useState('');
  const [teaDiv, setTeaDiv] = useState('');
  const [gnDiv, setGnDiv] = useState('');
  const [gnCode, setGnCode] = useState('');
  const [vilg, setVilg] = useState('');
  const [isMem, setIsMem] = useState('');
  const [socName, setSocName] = useState('');
  const [teaPlots, setTeaPlots] = useState([{ v: '', oa: '', or: '', op: '', na: '', nr: '', np: '', yes: false, no: false }]);
  const [soilFert, setSoilFert] = useState('');
  const [matA, setMatA] = useState(Array(4).fill(''));
  const [matR, setMatR] = useState(Array(2).fill(''));
  const [matP, setMatP] = useState(Array(3).fill(''));
  const [matAge, setMatAge] = useState(Array(3).fill(''));
  const [immA, setImmA] = useState(Array(4).fill(''));
  const [immR, setImmR] = useState(Array(2).fill(''));
  const [immP, setImmP] = useState(Array(3).fill(''));
  const [immAge, setImmAge] = useState(Array(3).fill(''));
  const [immName, setImmName] = useState('');
  const [crops, setCrops] = useState([{ c: '', e: '', t: '' }]);
  const [bushes, setBushes] = useState('');
  const [yield_, setYield] = useState('');
  const [sigDate, setSigDate] = useState('');
  const [sigName, setSigName] = useState('');
  const [gnName, setGnName] = useState('');
  const [gnCodeS, setGnCodeS] = useState('');
  const [gnSig, setGnSig] = useState('');
  const [gnDate, setGnDate] = useState('');
  const [showGL, setShowGL] = useState(false);
  const [toast, setToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const docRef = useRef(null);

  /* ── Array helpers ── */
  const addOwner = () => setOwners([...owners, { name: '', nic: '', addr: '', cap: '' }]);
  const upOwner = (i, f, v) => { const a = [...owners]; a[i][f] = v; setOwners(a); };
  const addPlot = () => setTeaPlots([...teaPlots, { v: '', oa: '', or: '', op: '', na: '', nr: '', np: '', yes: false, no: false }]);
  const upPlot = (i, f, v) => { const a = [...teaPlots]; a[i][f] = v; setTeaPlots(a); };
  const addCrop = () => setCrops([...crops, { c: '', e: '', t: '' }]);
  const upCrop = (i, f, v) => { const a = [...crops]; a[i][f] = v; setCrops(a); };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = {
        serial, landName, landNature, certNum, owners,
        fPhone, mPhone, email, bkName, bkBranch, bkAcc, bkCode, bkBCode,
        ownerCult, coName, coReg, extA, extR, extP, survey, lot,
        dist, dsDiv, teaDiv, gnDiv, gnCode, vilg, isMem, socName,
        teaPlots, soilFert, matA, matR, matP, matAge, immA, immR, immP, immAge, immName,
        crops, bushes, yield_, sigDate, sigName, gnName, gnCodeS, gnSig, gnDate,
      };
      const response = await apiClient.post('/compliance/tea-land/register', data);
      if (response.success) {
        setToast(true);
        setTimeout(() => setToast(false), 3000);
      } else {
        alert('Failed to save registration: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Error submitting form. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Export to PDF — Legal size (8.5" x 14") ── */
  const handleExportPDF = async () => {
    if (!docRef.current) return;
    setIsExporting(true);
    
    const originalWidth = docRef.current.style.width;
    const originalShadow = docRef.current.style.boxShadow;
    
    try {
      docRef.current.style.width = '816px'; 
      docRef.current.style.boxShadow = 'none';

      const canvas = await html2canvas(docRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 816
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: 'legal',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const elementWidth = 816;
      const ratio = pdfWidth / elementWidth;
      const imgHeightInPdf = (canvas.height / 2) * ratio;

      let heightLeft = imgHeightInPdf;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Tea_Land_TR02_Legal_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please try again.');
    } finally {
      if (docRef.current) {
        docRef.current.style.width = originalWidth;
        docRef.current.style.boxShadow = originalShadow;
      }
      setIsExporting(false);
    }
  };

  const NATURES = [
    ['(i) තනි', 'තනි'], ['(ii) හවුල්', 'හවුල්'], ['(iii) බඩු රජයේ', 'බඩු රජයේ'],
    ['(iv) බඩු පුද්ගලික', 'බඩු පුද්ගලික'], ['(v) අනවසර', 'අනවසර'], ['(vi) වෙනත්', 'වෙනත්'],
  ];

  return (
    <div id="tea-land-form">
      <style>{styles}</style>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <button className="btn-guideline" onClick={() => setShowGL(g => !g)}>
          {showGL ? '▲' : '▼'} ඉල්ලුම් පතය සම්පූරණ කිරීමේ උපදෙස් (TR-03)
        </button>
        <button className="btn-print" onClick={handleExportPDF} disabled={isExporting}>
          {isExporting ? '⏳ Exporting...' : '📄 Export PDF'}
        </button>
      </div>

      {/* ── Guidelines ── */}
      {showGL && (
        <div className="guidelines-panel">
          <div className="gl-header">ඉල්ලුම් පතය සම්පූරණ කිරීමේ උපදෙස් — TR-03 | Form Filling Guidelines</div>
          <div className="gl-body">
            <div className="gl-intro">
              1957 අංක 51 දරන තේ පාලන පනතේ අංක 02 දරන වගන්තිය යටතේ තේ ඉඩම් ලියාපදිංචි කිරීම – 2016
            </div>
            <div className="gl-section-title">පොදු උපදෙස් / General Instructions</div>
            <ol className="gl-list">
              <li>මෙම ඉල්ලුම් පතය ඉඩම් අයිතිකරු විසින් සම්පූරණ කළ යුතුය.</li>
              <li>ඔප්පුවකින් හෝ මාතක සැලැස්මකින් වෙන් කර ගත් සෑම ඉඩමක් සඳහාම එක් පෝරමය සම්පූරණ කරන්න.</li>
              <li>තොරතුරු පරිගණකගත කරන බැවින් සිදේ ඒළිළිව ඉදිරිපත් කරන්න.</li>
              <li>ඉල්ලුම්කමී ලිවීමේදී අංකය ඉතා පැහැදිළිව හදුනා ගත හැකි වන ලෙස ලිව්ලිව ගන්න.</li>
              <li>ඉල්ලුම් පතය තනිව සම්පූරණ කර ගැනිමට අප හසු නම් ප්‍රාදේශීය කාර්යාලයේ සහාය ලබා ගන්න.</li>
              <li>ඉල්ලුම් පතුයේ සදහත් වන ඉඩමට අදළ වන තොරතුරු පමණක් ඇතුළත් කරන්න.</li>
            </ol>
            <div className="gl-code-row">
              <span>ගොනු අංකය / CC:</span>
              <div className="cboxes">
                {['', '', '', '', '5', '3', '1'].map((v, i) => <span key={i}>{v}</span>)}
              </div>
            </div>
            <div className="gl-section-title">කොටස 1 — ඉඩමේ විස්තරය / Section 1</div>
            <ol className="gl-list">
              <li><b>1.1</b> ඉඩම් කැබැල්ලේ නම පමණක් ලියන්න. කට්ටි අංකයක් වෙතොත් 1.13 හි සටහන් කරන්න.</li>
              <li><b>1.2</b> ඉඩමේ භූක්තියේ ස්වභාවය නිවැරිදි කොටු තුළ "√" ලකුණින් සටහන් කරන්න.</li>
              <li><b>1.3</b> ඉඩමේ අයිතිය හා සම්බන්ධ ලේඛනයේ අංකය (ඔප්පු අංකය) කොටු තුළ දක්වන්න.</li>
              <li><b>1.4</b> ඉඩමේ අයිතිකරුවන් පිළිබඳ තොරතුරු වගුවෙහි සටහන් කරන්න.</li>
              <li><b>1.5/1.6</b> ස්ථාවර දූරකථන අංකය සහ ජංගම දූරකථන අංකය නිවැරිදිව කොටු තුළ සටහන් කරන්න.</li>
              <li><b>1.7</b> විද්‍යුත් ලිපිනය ඉංග්‍රීසී භාෂාවෙන් ලියන්න.</li>
              <li><b>1.8</b> ගිනුමේ නම, බැංකුව, ගිනුම් අංකය, ශාඛාව සහ ශාඛා කේතය ලියන්න.</li>
              <li><b>1.9</b> අයිතිකරු තේ වගාකරුද "√" ලකුණෙන් සටහන් කරන්න.</li>
              <li><b>1.10</b> සමාගමේ නම සහ ලියාපදිංචි අංකය ලියන්න.</li>
              <li><b>1.11</b> ඉඩමේ මුළු ප්‍රමාණය අක්කර, රූඩ්, පර්චස් ලියන්න.</li>
              <li><b>1.12/1.13</b> මාතක සැලැස්ම සහ කට්ටි අංකය ලියන්න.</li>
              <li><b>1.14</b> I–VI ප්‍රශ්නවලට ඉඩමේ ස්ථානය ලියන්න.</li>
              <li><b>1.15/1.16</b> කුඩා තේ වතු සමිති සාමාජිකත්වය "√" ලකුණෙන් සලකුණු කරන්න.</li>
            </ol>
            <div className="gl-section-title">කොටස 2 — තේ වගාව / Section 2</div>
            <ol className="gl-list">
              <li><b>2.1</b> වර්ගය සහ ප්‍රමාණ වගුවෙහි ලියන්න. ලද ප්‍රතිලාභ "√" ලකුණෙන් සලකුණු කරන්න.</li>
              <li><b>2.2</b> පස සාරවත් කළේ දැයි "√" ලකුණෙන් සලකුණු කරන්න.</li>
              <li><b>2.3</b> ඇට/රිකිලි ප්‍රමාණ හා වයස ලියන්න.</li>
              <li><b>2.4</b> අතුරු හෝගය, ප්‍රමාණය, ගස් සංඛ්‍යාව ලියන්න.</li>
              <li><b>2.5</b> ගස් ගණනෙන් අක්කරයකට ගණනෙහි සටහන් කරන්න.</li>
              <li><b>2.6</b> දළ අස්වනු ප්‍රමාණය කි.ගු. (kg) ලියන්න.</li>
            </ol>
          </div>
        </div>
      )}

      {/* ══════════ DOCUMENT (A4 page) ══════════ */}
      {/* Horizontal scroll wrapper ensures the 794 px page never overflows on small screens */}
      <div style={{ overflowX: 'auto', margin: '0 auto 32px', maxWidth: '100%' }}>
        <div className="doc-page" ref={docRef}>
          <div className="doc-code">TR-02</div>

          {/* ── Header ── */}
          <div className="doc-header">
            <img src="/sl_national_emblem.png" className="doc-emblem" alt="SL Emblem" />
            <div>
              <div className="doc-title-sin">වැවිලි කර්මාන්ත අමාතාංශය - ශ්‍රී ලංකා තේ මණ්ඩලය</div>
              <div className="doc-title-sub">1957 අංක 51 දරන තේ පාලන පනතේ අංක 02 වගන්තිය යටතේ තේ ඉඩම් ලියාපදිංචිව් කිරීම</div>
            </div>
          </div>

          {/* ── Serial ── */}
          <div className="serial-row">
            <span className="serial-label">අනුක්‍රමික අංකය</span>
            <BoxStrip count={10} value={serial} onChange={setSerial} />
            <span className="office-note">(කාර්යාලීය පරිශ්‍රය පමණි)</span>
          </div>

          {/* ══ SECTION 1 ══ */}
          <div className="sec-head">1. ඉඩමේ විස්තරය</div>

          {/* 1.1 */}
          <div className="f-row">
            <FL>1.1 ඉඩම් කැබැල්ලේ නම</FL>
            <input className="dotline" value={landName} onChange={e => setLandName(e.target.value)} />
          </div>

          {/* 1.2 */}
          <div className="f-row">
            <FL>1.2 තේ ඉඩමේ භූක්තියේ ස්වභාවය</FL>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '4px 0' }}>
              {NATURES.map(([lbl, val]) => (
                <COpt key={val} label={lbl} checked={landNature === val} onClick={() => setLandNature(val)} />
              ))}
            </div>
          </div>

          {/* 1.3 */}
          <div className="f-inline">
            <FL>1.3 සින්නක්කර ඔප්පු / බදු ගිවිසුම් / බලපත‍්‍ර අංකය හෝ වෙනත් (අනවශ්‍ය කොටස් කප හරින්න) :</FL>
            <BoxStrip count={12} value={certNum} onChange={setCertNum} />
          </div>

          {/* 1.4 */}
          <div className="f-row">
            <FL>1.4 අයිතිකරු හෝ අයිතිකරුවන්ගේ විස්තර සහ සදහන් කරන්න.</FL>
            <table className="dtable" style={{ marginTop: 6 }}>
              <thead>
                <tr>
                  <th>නම (මූලකරු සමග නම)</th>
                  <th>ජාතික හැදුනුම්පත් අංකය</th>
                  <th>ලිපිනය</th>
                  <th>රැකියාව</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((o, i) => (
                  <tr key={i}>
                    <td><input value={o.name} onChange={e => upOwner(i, 'name', e.target.value)} /></td>
                    <td><input value={o.nic} onChange={e => upOwner(i, 'nic', e.target.value)} /></td>
                    <td><input value={o.addr} onChange={e => upOwner(i, 'addr', e.target.value)} /></td>
                    <td><input value={o.cap} onChange={e => upOwner(i, 'cap', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="add-row" onClick={addOwner}>+ Add row</button>
          </div>

          {/* 1.5 / 1.6 */}
          <div className="f-cols2">
            <div className="f-row">
              <FL>1.5 ස්ථාවර දූරකථන අංකය</FL>
              <div style={{ marginTop: 4 }}><BoxStrip count={10} value={fPhone} onChange={setFPhone} /></div>
            </div>
            <div className="f-row">
              <FL>1.6 ජංගම දූරකථන අංකය</FL>
              <div style={{ marginTop: 4 }}><BoxStrip count={10} value={mPhone} onChange={setMPhone} /></div>
            </div>
          </div>

          {/* 1.7 */}
          <div className="f-inline">
            <FL>1.7 විද්‍යුත් ලිපිනය (E-mail):</FL>
            <input className="dotline-i" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          {/* 1.8 */}
          <div className="f-row">
            <FL>1.8 සහනාධාර ගෙවීමකදී</FL>
            <div className="f-cols2" style={{ marginTop: 6 }}>
              <div className="f-inline">
                <FL>(i) මූල් බැංකු කපා යතු ගිනුමේ නම</FL>
                <input className="dotline-i" value={bkName} onChange={e => setBkName(e.target.value)} />
              </div>
              <div className="f-inline">
                <FL>(ii) ශාඛාව</FL>
                <input className="dotline-i" value={bkBranch} onChange={e => setBkBranch(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px', alignItems: 'flex-end', marginTop: 4 }}>
              <div>
                <FL>(iii) ගිනුම් අංකය</FL>
                <div style={{ marginTop: 3 }}><BoxStrip count={16} value={bkAcc} onChange={setBkAcc} /></div>
              </div>
              <div>
                <FL>(iv) බැංකු ශාඛාව</FL>
                <div style={{ marginTop: 3 }}><BoxStrip count={4} value={bkCode} onChange={setBkCode} /></div>
              </div>
              <div>
                <FL>(v) බැංකු ශාඛා අංකය</FL>
                <div style={{ marginTop: 3 }}><BoxStrip count={4} value={bkBCode} onChange={setBkBCode} /></div>
              </div>
            </div>
          </div>

          {/* 1.9 */}
          <YesNo label="1.9 තේ ඉඩමේ අයිතිකරු ඉඩමේ තේ වගාකරුද යන්න" value={ownerCult} onChange={setOwnerCult} />

          {/* 1.10 */}
          <div className="f-row">
            <FL>1.10 සමාගමකට අයිති ඉඩමක් නම්:</FL>
            <div className="f-cols2" style={{ marginTop: 5 }}>
              <div className="f-inline">
                <FL>I. සමාගමේ නම :</FL>
                <input className="dotline-i" value={coName} onChange={e => setCoName(e.target.value)} />
              </div>
              <div className="f-inline">
                <FL>II. සමාගමේ ලියාපදිංචි අංකය :</FL>
                <input className="dotline-i" value={coReg} onChange={e => setCoReg(e.target.value)} />
              </div>
            </div>
          </div>

          {/* 1.11 */}
          <div className="f-inline" style={{ marginBottom: 11 }}>
            <FL>1.11 ඉඩම් කැබැල්ලේ ඇති මුළු ඉඩම් ප්‍රමාණය:</FL>
            <FL>අක්කර</FL><BoxStrip count={4} value={extA} onChange={setExtA} />
            <FL>රූඩ්</FL><BoxStrip count={2} value={extR} onChange={setExtR} />
            <FL>පර්චස්</FL><BoxStrip count={3} value={extP} onChange={setExtP} />
          </div>

          {/* 1.12 / 1.13 */}
          <div className="f-inline">
            <FL>1.12 මාතක සැලැස්මේ අංකය (නිබේ නම්):</FL>
            <input className="dotline-i" value={survey} onChange={e => setSurvey(e.target.value)} />
          </div>
          <div className="f-inline">
            <FL>1.13 කට්ටි අංකය (නිබේ නම්):</FL>
            <input className="dotline-i" value={lot} onChange={e => setLot(e.target.value)} />
          </div>

          {/* 1.14 */}
          <div className="f-row">
            <FL>1.14 ඉඩම හදුනා ගැනීමේ විස්තර</FL>
            <div style={{ paddingLeft: 16, marginTop: 6 }}>
              {[
                ['I.', 'ඉඩම පිහිටා ඇති දිස්ත්‍රික්කය', dist, setDist],
                ['II.', 'ප්‍රාදේශීය ලේකම් කොට්ඨාශය', dsDiv, setDsDiv],
                ['III.', 'තේ පරිසේකය කොට්ඨාශය (කුඩා තේ වතු සංවර්ධන අධිකාරිය)', teaDiv, setTeaDiv],
                ['IV.', 'ග්‍රාම නිළධාරි කොට්ඨාශය', gnDiv, setGnDiv],
                ['V.', 'ග්‍රාම නිළධාරි කොට්ඨාශ අංකය', gnCode, setGnCode],
                ['VI.', 'ගමේ නම', vilg, setVilg],
              ].map(([n, l, v, s]) => (
                <div key={n} className="f-inline" style={{ marginBottom: 6 }}>
                  <span className="fl" style={{ minWidth: 28 }}>{n}</span>
                  <span className="fl" style={{ minWidth: 260 }}>{l}</span>
                  <input className="dotline-i" value={v} onChange={e => s(e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* 1.15 / 1.16 */}
          <YesNo label="1.15 කුඩා තේ වතු සමිතියේ සාමාජිකයෙකිද?" value={isMem} onChange={setIsMem} />
          <div className="f-inline">
            <FL>1.16 කුඩා තේ වතු සංවර්ධන සමිතියේ නම:</FL>
            <input className="dotline-i" value={socName} onChange={e => setSocName(e.target.value)} />
          </div>

          <hr className="hr-solid" />

          {/* ══ SECTION 2 ══ */}
          <div className="sec-head">2. තේ වගාව පිළිබඳ විස්තර</div>

          {/* 2.1 */}
          <div className="f-row">
            <FL>2.1 තේ වගා කළ වර්ගයන් සහ විස්තර</FL>
            <table className="dtable" style={{ marginTop: 6 }}>
              <thead>
                <tr>
                  <th rowSpan={2}>වගා කළ<br />වර්ගය</th>
                  <th colSpan={3}>නැවත වගාව නම් ඉඩම් ප්‍රමාණය</th>
                  <th colSpan={3}>අලුත් වගාව නම් ඉඩම් ප්‍රමාණය</th>
                  <th colSpan={2}>තේ වගා සහනාධාර ලබා ගත්තේ නම්</th>
                </tr>
                <tr>
                  <th>අක්කර</th><th>රූඩ්</th><th>පර්චස්</th>
                  <th>අක්කර</th><th>රූඩ්</th><th>පර්චස්</th>
                  <th>ඔව් (√)</th><th>නැත (√)</th>
                </tr>
              </thead>
              <tbody>
                {teaPlots.map((p, i) => (
                  <tr key={i}>
                    <td><input value={p.v} onChange={e => upPlot(i, 'v', e.target.value)} /></td>
                    <td><input value={p.oa} onChange={e => upPlot(i, 'oa', e.target.value)} style={{ width: 50 }} /></td>
                    <td><input value={p.or} onChange={e => upPlot(i, 'or', e.target.value)} style={{ width: 38 }} /></td>
                    <td><input value={p.op} onChange={e => upPlot(i, 'op', e.target.value)} style={{ width: 44 }} /></td>
                    <td><input value={p.na} onChange={e => upPlot(i, 'na', e.target.value)} style={{ width: 50 }} /></td>
                    <td><input value={p.nr} onChange={e => upPlot(i, 'nr', e.target.value)} style={{ width: 38 }} /></td>
                    <td><input value={p.np} onChange={e => upPlot(i, 'np', e.target.value)} style={{ width: 44 }} /></td>
                    <td className="tc"><TBox checked={p.yes} onClick={() => upPlot(i, 'yes', !p.yes)} /></td>
                    <td className="tc"><TBox checked={p.no} onClick={() => upPlot(i, 'no', !p.no)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="add-row" onClick={addPlot}>+ Add row</button>
          </div>

          {/* 2.2 */}
          <YesNo label="2.2 තාණ සිටුවීමට පෙර භාෂා සිටුවා පස සාරවත් කළේ ද?" value={soilFert} onChange={setSoilFert} />

          {/* 2.3 */}
          <div className="f-row">
            <FL>2.3 ඉඩමේ ඉඩම් ප්‍රමාණය (තේ වගා කරා ඇති)</FL>
            <div style={{ paddingLeft: 12, marginTop: 6 }}>
              <div className="f-inline" style={{ marginBottom: 8 }}>
                <FL style={{ minWidth: 110 }}>i. ඇට තේ: අක්කර</FL>
                <BoxStrip count={4} value={matA} onChange={setMatA} />
                <FL>රූඩ්</FL><BoxStrip count={2} value={matR} onChange={setMatR} />
                <FL>පර්චස්</FL><BoxStrip count={3} value={matP} onChange={setMatP} />
                <FL>තේ වගාවේ වයස (අවු.)</FL><BoxStrip count={3} value={matAge} onChange={setMatAge} />
              </div>
              <div className="f-inline" style={{ marginBottom: 8 }}>
                <FL style={{ minWidth: 110 }}>ii. රිකිලි තේ: අක්කර</FL>
                <BoxStrip count={4} value={immA} onChange={setImmA} />
                <FL>රූඩ්</FL><BoxStrip count={2} value={immR} onChange={setImmR} />
                <FL>පර්චස්</FL><BoxStrip count={3} value={immP} onChange={setImmP} />
                <FL>තේ වගාවේ වයස (අවු.)</FL><BoxStrip count={3} value={immAge} onChange={setImmAge} />
              </div>
              <div className="f-inline">
                <FL>iii. රිකිලි තේ නම් තිබෙන ප්‍රශ්නේද....</FL>
                <input className="dotline-i" value={immName} onChange={e => setImmName(e.target.value)} />
              </div>
            </div>
          </div>

          {/* 2.4 */}
          <div className="f-row">
            <FL>2.4 තේ වගාවන් සමග ඇති අතුරු වගාවන් පිළිබඳ විස්තර:</FL>
            <table className="dtable" style={{ marginTop: 6 }}>
              <thead>
                <tr>
                  <th rowSpan={2}>හෝගය</th>
                  <th colSpan={2}>තේ සමග අතුරු හෝග කරා ඇති ඉඩම් ප්‍රමාණය ගස් සංඛ්‍යාව / පදුරු සංඛ්‍යාව</th>
                </tr>
                <tr>
                  <th>ඉඩම් ප්‍රමාණය</th>
                  <th>ගස් සංඛ්‍යාව / පදුරු සංඛ්‍යාව</th>
                </tr>
              </thead>
              <tbody>
                {crops.map((c, i) => (
                  <tr key={i}>
                    <td><input value={c.c} onChange={e => upCrop(i, 'c', e.target.value)} placeholder="e.g. පොල්, රබර්..." /></td>
                    <td><input value={c.e} onChange={e => upCrop(i, 'e', e.target.value)} /></td>
                    <td><input value={c.t} onChange={e => upCrop(i, 't', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontFamily: 'Noto Sans Sinhala,sans-serif', fontSize: 11, color: '#555', marginBottom: 6 }}>
              (පොල්, රබර්, සූව අපනයන හෝග, පළතුරු සහ වෙනත් හෝග)
            </div>
            <button className="add-row" onClick={addCrop}>+ Add row</button>
          </div>

          {/* 2.5 / 2.6 */}
          <div className="f-inline">
            <FL>2.5 පවතින මූල් තේ පදුරු සංඛ්‍යාව / අක්කරයකට (ආසන්න වශයෙන්)</FL>
            <input className="dotline-i" value={bushes} onChange={e => setBushes(e.target.value)} style={{ maxWidth: 160 }} />
          </div>
          <div className="f-inline">
            <FL>2.6 මූල් තේ ඉඩමේ මාසකට දළ අස්වනු ප්‍රමාණය (කි.ගු.ළි.):</FL>
            <input className="dotline-i" value={yield_} onChange={e => setYield(e.target.value)} style={{ maxWidth: 160 }} />
          </div>

          <hr className="hr-solid" />

          {/* ══ SECTION 3 ══ */}
          <div className="sec-head">3. තේ ඉඩමේ අයිතිකරු / බදුකරු / බලයලත් නිලයෝජිතා හෝ වගාකරුගේ ප්‍රකාශය</div>

          <div className="decl-box">
            <span style={{ fontFamily: 'Noto Sans Sinhala,sans-serif', fontSize: 12.5 }}>
              ............................................ වන මෙහි දක්වා ඇති තේ ඉඩම &nbsp;
              <input className="dotline-i" style={{ minWidth: 130, maxWidth: 180 }} placeholder="ග්‍රාම නිළධාරි කොට්ඨාශය" />
              &nbsp; ග්‍රාම නිළධාරි කොට්ඨාශය තුළ පිහිටා ඇති බවටත්, මෙහි දක්වා ඇති තොරතුරු සතය බවටත් ප්‍රකාශ කරමි.
            </span>
            <div className="sig-row">
              <SigField label="දිනය :" value={sigDate} onChange={e => setSigDate(e.target.value)} type="date" />
              <SigField label="අයදුම්කරුගේ අත්සන :" value={sigName} onChange={e => setSigName(e.target.value)} placeholder="අත්සන" />
            </div>
          </div>

          <div className="gn-box">
            <span style={{ fontFamily: 'Noto Sans Sinhala,sans-serif', fontSize: 12.5 }}>
              ඉහත විස්තර සඳහත් ඉඩම මෙම ග්‍රාම නිළධාරි වසම තුළ පිහිටි ඉඩමක් බවට සහතික කරමි.
            </span>
            <div className="sig-row">
              <SigField label="ග්‍රාම නිළධාරිගේ නම :" value={gnName} onChange={e => setGnName(e.target.value)} />
              <SigField label="කොට්ඨාශය :" value={gnCodeS} onChange={e => setGnCodeS(e.target.value)} />
            </div>
            <div className="sig-row" style={{ marginTop: 10 }}>
              <SigField label="අත්සන :" value={gnSig} onChange={e => setGnSig(e.target.value)} placeholder="GN Signature" />
              <SigField label="දිනය :" value={gnDate} onChange={e => setGnDate(e.target.value)} type="date" />
            </div>
            <div className="office-bar">කාර්යාලීය පරිශ්‍රය පමණි</div>
          </div>

        </div>{/* /doc-page */}
      </div>{/* /scroll-wrap */}

      {/* ── Action bar ── */}
      <div className="action-bar">
        <button className="btn-reset" onClick={() => { if (window.confirm('Reset all fields?')) window.location.reload(); }}>
          Reset
        </button>
        <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Submit Application'}
        </button>
      </div>

      {toast && <div className="toast">✅ Application submitted!</div>}
    </div>
  );
}
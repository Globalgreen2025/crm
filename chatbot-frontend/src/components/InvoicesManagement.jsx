import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Card,
  Statistic,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Steps,
  Tooltip,
  Alert,
} from "antd";
import {
  EyeOutlined,
  FilePdfOutlined,
  CheckOutlined,
  ReloadOutlined,
  SendOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import { jsPDF } from "jspdf";
import logo from "../assets/logo.jpeg";
import logorge from "../assets/glgr.JPEG";

const { Option } = Select;
const { Step } = Steps;

const InvoicesManagement = ({ command, onUpdateCommand }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentForm] = Form.useForm();
  const [refreshKey, setRefreshKey] = useState(0);
  const [creatingInvoices, setCreatingInvoices] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [command, refreshKey]);

  const forceRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    message.info("Liste actualisée");
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/command/${command._id}/invoices`);
      setInvoices(response.data);
      setLoading(false);
    } catch (error) {
      message.error("Erreur lors du chargement des factures");
      setLoading(false);
    }
  };

  const createInvoices = async () => {
    // Check if invoices already exist
    if (invoices && invoices.length > 0) {
      message.warning("Les factures ont déjà été créées pour ce devis.");
      return;
    }

    setCreatingInvoices(true);
    try {
      await axios.post(`/command/${command._id}/create-invoices`);
      message.success("Factures créées avec succès");
      fetchInvoices();

      if (onUpdateCommand) {
        onUpdateCommand();
      }
    } catch (error) {
      message.error("Erreur lors de la création des factures");
    } finally {
      setCreatingInvoices(false);
    }
  };
  
//   const generateConsolidatedInvoicePdf = (invoices, command) => {
//     const doc = new jsPDF();
//     const pageWidth = doc.internal.pageSize.width;
//     const pageHeight = doc.internal.pageSize.height;
//     const marginTop = 10;
//     const marginLeft = 5;
//     const margin = 8;
    
//     const addFooter = (pageNum) => {
//       const footerY = pageHeight - 5; 
//       const leftText = "Global Green - SAS au capital social de 5000 €";
//       const centerText = "N°SIREN 94305436100010 - RCS Blois";
//       const rightText = "N° de TVA FR41492502992";
  
//       doc.setFontSize(9);
//       doc.setFont(undefined, "normal");
  
//       // Left-aligned
//       doc.text(leftText, margin, footerY);
  
//       // Centered
//       doc.text(centerText, pageWidth / 2, footerY, { align: "center" });
  
//       // Right-aligned
//       doc.text(rightText, pageWidth - margin, footerY, { align: "right" });
//     };
  
//     const logoWidth = 40;
//     const logoHeight = 40;
//     const logoleftwidth = 40;
//     const logoleftheight = 40;
  
//     // Calculate consolidated amounts
//     const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
//     const totalHT = totalAmount / 1.2;
//     const totalTVA = totalAmount * 0.055 / 1.2;
    
//     // Get the latest invoice for dates
//     const latestInvoice = invoices.reduce((latest, invoice) => {
//       return new Date(invoice.issueDate) > new Date(latest.issueDate) ? invoice : latest;
//     }, invoices[0]);

//     // Use command number for consolidated invoice
//     const invoiceNumber = command.numCommand || "F218235";
//     const isConsolidatedInvoice = true;

//     // === Page 1 ===

//     // Add logos - left logo only
//     doc.addImage(
//       logo,
//       "JPEG",
//       marginLeft,
//       marginTop, 
//       logoleftwidth,
//       logoleftheight
//     );

//     // Company info on the right side
//     doc.setFontSize(10);
//     const rightStartX = pageWidth - 50;

//     // "Entreprise:" in bold
//     doc.setFont("Helvetica", "bold");
//     doc.setTextColor(0, 0, 0);
//     doc.text("Entreprise:", rightStartX, 15);

//     // The rest in regular Helvetica
//     doc.setFont("Helvetica", "bold");
//     doc.setFontSize(10);
//     doc.setTextColor(0, 128, 0);
//     doc.text("GLOBAL GREEN", rightStartX, 21);

//     doc.setFont(undefined, "Helvetica");
//     doc.setFontSize(10);
//     doc.setTextColor(0, 0, 0);
//     doc.text("641 AVENUE DU GRAIN D'OR", rightStartX, 27);
//     doc.text("41350 VINEUIL - France", rightStartX, 32);
//     doc.text("Contact@global-green.fr", rightStartX, 37);
//     doc.text("07 64 71 26 87", rightStartX, 42);

//     // Center logo
//     doc.addImage(
//       logorge,
//       "JPEG",
//       pageWidth/2 - logoWidth/2,
//       marginLeft,
//       logoWidth,
//       logoHeight,
//       marginTop, 
//     );

//     doc.setFont(undefined, "Helvetica");
//     doc.setFontSize(11);

//     // Configuration
//     const LINE_SPACING = 6;
//     const UNDERLINE_OFFSET = 1;
//     const DASH_COLOR = 100;
//     const LINE_WIDTH = 0.2;
//     const SECTION_SPACING = 0.1;

//     // Invoice header
//     doc.setFontSize(12);
//     doc.setFont(undefined, "bold");
//     doc.setTextColor(0, 0, 0);
//     const invoiceY = 55;
    
//     // Invoice title for consolidated invoice
//     const invoiceTitle = "Facture - Solde";

//     doc.text(invoiceTitle, margin, invoiceY + 4);

//     // Left info under "Facture"
//     const emissionMoment = moment(latestInvoice.issueDate || new Date());
//     const dueMoment = moment(latestInvoice.dueDate || emissionMoment.clone().add(1, "month"));

//     const leftTexts = [
//       `Numéro                               ${invoiceNumber}`,
//       `Date d'émission:                 ${emissionMoment.format("DD/MM/YYYY")}`,
//       `Date d'expiration:               ${dueMoment.format("DD/MM/YYYY")}`,
//       `Type de vente:                    Prestation de service`,
//       `Type facture:                      Solde Consolidé`,
//     ];

//     // Client information on the right
//     doc.setFontSize(10);
//     doc.setFont(undefined, "Helvetica");
//     doc.setTextColor(0, 0, 0);
//     const rightTexts = [
//       `${command.nom || ""}`,
//       `${command.address || ""}`,
//       `${command.ville || ""},  ${command.codepostal || ""}`,
//       `${command.email || ""}`,
//     ];

//     const maxRightWidth = Math.max(
//       ...rightTexts.map(
//         (t) =>
//           (doc.getStringUnitWidth(t) * doc.internal.getFontSize()) /
//           doc.internal.scaleFactor
//       )
//     );

//     // Right-side starting X
//     const rightStartXd = pageWidth - margin - maxRightWidth - 4;

//     // Starting Y position
//     let currentRightYy = 58;

//     // "Client ou cliente:" in bold
//     doc.setFont(undefined, "bold");
//     doc.setFontSize(12);
//     doc.setTextColor(0, 0, 0);
//     doc.text("Client ou Cliente:", rightStartXd, currentRightYy);

//     // Client name in bold and green
//     currentRightYy += LINE_SPACING;
//     doc.setFont("Helvetica", "bold");
//     doc.setFontSize(10);
//     doc.setTextColor(0, 128, 0);
//     doc.text(`${command.nom || ""}`, rightStartXd, currentRightYy);

//     // Rest of client details
//     const otherRightTexts = [
//       `${command.address || ""}`,
//       `${command.ville || ""}   ${command.codepostal || ""}`,
//       `${command.email || ""}`,
//     ];

//     doc.setFont(undefined, "Helvetica");
//     doc.setFontSize(10);
//     doc.setTextColor(0, 0, 0);

//     currentRightYy += LINE_SPACING;
//     otherRightTexts.forEach((text, index) => {
//       doc.text(text, rightStartXd, currentRightYy);
//       currentRightYy +=
//         LINE_SPACING + (index < otherRightTexts.length - 1 ? SECTION_SPACING : 0);
//     });

//     // Left side information
//     let currentLeftY = 68;
//     leftTexts.forEach((text, index) => {
//       doc.text(text, margin, currentLeftY);
//       currentLeftY +=
//         LINE_SPACING + (index < leftTexts.length - 1 ? SECTION_SPACING : 0);
//     });

//     // Invoice description
//     doc.setFontSize(10);
//     const currentTextColors = doc.getTextColor();
//     doc.setFont(undefined, "bold");
//     doc.setFontSize(10);
//     doc.setTextColor(0, 0, 0);

    
//     const prestationsYStart = 105; // Y position of the first line
//     const lineSpacing = 6; // space between lines

//     // Line 1: Nature des prestations
//     doc.text(
//       `Nature des prestations:`,
//       margin,
//       prestationsYStart
//     );
//     doc.setFont(undefined, "Helvetica");
//     // Line 3: Installation description
//     doc.text(
//       `Installation et raccordement d'une pompe à chaleur AIR/EAU`,
//       margin,
//       prestationsYStart + lineSpacing,
//     );

//     // Line 4: Nota
//     doc.text(
//       `Note: Fourniture des radiateurs par le client.`,
//       margin,
//       prestationsYStart + lineSpacing * 2
//     );

//     // // Consolidated invoice note
//     // doc.setFont(undefined, "bold");
//     // doc.setTextColor(255, 0, 0);
//     // doc.text(
//     //   `Facture de solde consolidée - Regroupement de ${invoices.length} facture(s)`,
//     //   margin,
//     //   prestationsYStart + lineSpacing * 3
//     // );
//     doc.setTextColor(0, 0, 0);

//     // Page number
//     doc.setTextColor(0, 0, 0);
//     doc.setFont(undefined, "Helvetica");
//     doc.setFontSize(10);
//     doc.text(`Page(s): 1 sur 2`, pageWidth - margin, prestationsYStart + 10, { align: "right" });

//     doc.setTextColor(currentTextColors);

//     // // Table configuration
//     // const descWidth = 120;
//     // const qteWidth = 20;
//     // const prixWidth = 35;
//     // const ttcWidth = 20;

//     // const descX = margin;
//     // const qteX = descX + descWidth;
//     // const prixX = qteX + qteWidth;
//     // const ttcX = prixX + prixWidth;

//     // const line1 = descX + descWidth;
//     // const line2 = line1 + qteWidth;
//     // const line3 = line2 + prixWidth;
//     // Table configuration - EQUAL COLUMN WIDTHS
// const descWidth = 110; // slightly narrower description
// const availableWidth = pageWidth - 2 * margin - descWidth;
// const equalColumnWidth = availableWidth / 3; // Divide remaining space equally

// const qteWidth = equalColumnWidth;
// const prixWidth = equalColumnWidth;
// const ttcWidth = equalColumnWidth;

// const descX = margin;
// const qteX = descX + descWidth;
// const prixX = qteX + qteWidth;
// const ttcX = prixX + prixWidth;

// const line1 = descX + descWidth;
// const line2 = line1 + qteWidth;
// const line3 = line2 + prixWidth;




//     // Header parameters
//     const headerY = 122;
//     const headerHeight = 8;
//     const textY = headerY + 5;
//     const firstLineY = headerY + headerHeight;

//     // Draw header background
//     doc.setFillColor(21, 128, 61); 
//     doc.rect(
//       margin + 0.2,
//       headerY + 0.2,
//       pageWidth - 2 * margin - 0.4,
//       headerHeight - 0.4,
//       "F"
//     );

//     doc.line(margin, headerY, pageWidth - margin, headerY);

//     // Table headers
//     doc.setFont(undefined, "bold");
//     doc.setTextColor(0, 0, 0);

//     const descCenter = descX + descWidth / 2;
//     const qteCenter = qteX + qteWidth / 2;
//     const prixCenter = prixX + prixWidth / 2;
//     const ttcCenter = ttcX + ttcWidth / 2;

//     const tableTitle = "Descriptif de la facture consolidée";
      
//     doc.text(tableTitle, descCenter, textY, {
//       align: "center",
//     });
//     doc.text("QTÉ", qteCenter, textY, { align: "center" });
//     doc.text("Prix u. HT", prixCenter, textY, { align: "center" });
//     doc.text("Total HT", ttcCenter, textY, { align: "center" });

//     doc.setFont(undefined, "normal");

//     // Table body
//     const tableEndY = pageHeight - 14;
//     const rowCount = 1;
//     const rowHeights = (tableEndY - firstLineY) / rowCount;

//     // Draw horizontal lines
//     for (let i = 0; i <= rowCount; i++) {
//       const yPos = firstLineY + i * rowHeights;
//       doc.line(margin, yPos, pageWidth - margin, yPos);
//     }

//     // Draw vertical lines
//     doc.line(margin, headerY, margin, tableEndY);
//     doc.line(line1, headerY, line1, tableEndY);
//     doc.line(line2, headerY, line2, tableEndY);
//     doc.line(line3, headerY, line3, tableEndY);
//     doc.line(pageWidth - margin, headerY, pageWidth - margin, tableEndY);

//     // Fill table with consolidated data
//     const originalTextColor = doc.getTextColor();
//     // const tableData = [{
//     //     title: command.title,
//     //     reference: command.reference,
//     //     description: command.description,
//     //     quantity: 1,
//     //     unitPrice: totalHT,
//     //     total: totalHT,
//     // }];
//     const tableData = [];
// if (command.items && command.items.length > 0) {
//   command.items.forEach((item) => {
//     tableData.push({
//       title: item.title || "N/A",
//       reference: item.reference || "",
//       description: item.description || "",
//       quantity: item.quantite || 1,
//       unitPrice: item.prixUnitaire || 0,
//       total:
//         item.montantTTC ||
//         item.prixUnitaire * item.quantite * (1 + (item.tva || 0) / 100),
//     });
//   });
// } else {
//   tableData.push({
//     title: command.title || "N/A",
//     reference: command.reference || "",
//     description: command.description || "",
//     quantity: command.quantite || 1,
//     unitPrice:
//       command.prixUnitaire || command.totalHT / (command.quantite || 1),
//     total: command.totalTTC || 0,
//   });
// }

//     let currentRowY = firstLineY + 8;
//   //   tableData.forEach((row) => {
//   //     const titleFontSize = 10;
//   //     const refFontSize = 10;
//   //     const descFontSize = 9;
//   //     const titleRefSpacing = 0.5;
//   //     const refDescSpacing = 0.5;
//   //     const descLineSpacing = 0.3;

//   //     const descLines = doc.splitTextToSize(row.description, descWidth - 15);
//   //     const totalHeight = titleFontSize + titleRefSpacing + refFontSize + refDescSpacing + descLines.length * (descFontSize + descLineSpacing);
//   //     const centerY = currentRowY + totalHeight / 2;

//   //     // Left column content
//   //     let lineY = currentRowY;

//   //     doc.setFontSize(titleFontSize);
//   //     doc.setFont(undefined, "bold");
//   //     doc.setTextColor(0, 0, 0);
//   //     doc.text(row.title, descX + 5, lineY);
//   //     lineY += titleFontSize;

//   //     if (row.reference) {
//   //       doc.setFontSize(refFontSize);
//   //       doc.setFont(undefined, "italic");
//   //       doc.text(`Réf: ${row.reference}`, descX + 5, lineY);
//   //       lineY += refFontSize;
//   //     }

//   //     doc.setFontSize(descFontSize);
//   //     doc.setFont(undefined, "normal");
//   //     const rawDescLines = row.description.split("\n");

//   //     rawDescLines.forEach((rawLine) => {
//   //       if (rawLine.trim() !== "") {   // ✅ Skip empty lines
//   //         const lineWithBullet = `• ${rawLine}`;
//   //         const wrappedLines = doc.splitTextToSize(lineWithBullet, descWidth - 15);
//   //         wrappedLines.forEach((line) => {
//   //           doc.text(line, descX + 4, lineY);
//   //           lineY += descFontSize + descLineSpacing;
//   //         });
//   //       }
//   //     });
      

//   //     // Numeric columns
//   //     doc.setFontSize(9);
//   //     doc.setFont(undefined, "normal");
//   //     doc.setTextColor(0, 0, 0);
//   //     const numY = currentRowY; // align with title top
//   // doc.text(row.quantity.toString(), qteX + qteWidth / 2, numY, { align: "center" });
//   // doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth / 2, numY, { align: "center" });
//   // doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth / 2, numY, { align: "center" });

//   //     currentRowY += totalHeight + 2;
//   //   });
//   tableData.forEach((row) => {
//     // Font sizes and spacing
//     const titleFontSize = 10;
//     const refFontSize = 10;
//     const descFontSize = 9;
//     const titleRefSpacing = 0.5; // small space between title and ref
//     const refDescSpacing = 0.5; // small space between ref and description
//     const descLineSpacing = 0.3; // space between description lines
  
//     // Split description into lines
//     const descLines = doc.splitTextToSize(row.description, descWidth - 15);
  
//     // Calculate total height of the left cell
//     const totalHeight =
//       titleFontSize +
//       titleRefSpacing +
//       refFontSize +
//       refDescSpacing +
//       descLines.length * (descFontSize + descLineSpacing);
  
//     // Center Y for numeric columns
//     const centerY = currentRowY + totalHeight / 2;
  
//     // --- Left column: title, reference, description ---
//     let lineY = currentRowY;
  
//     // Title
//     doc.setFontSize(titleFontSize);
//     doc.setFont(undefined, "bold");
//     doc.setTextColor(0, 0, 0);
//     doc.text(row.title, descX + 5, lineY);
//     lineY += titleFontSize;
  
//     // Reference
//     doc.setFontSize(refFontSize);
//     doc.setFont(undefined, "italic");
//     doc.setTextColor(0, 0, 0);
//     doc.text(`Réf: ${row.reference}`, descX + 5, lineY);
//     lineY += refFontSize;
  
//     // Description with bullets
//     doc.setFontSize(descFontSize);
//     doc.setFont(undefined, "normal");
//     doc.setTextColor(0, 0, 0);
//     const rawDescLines = row.description.split("\n");
  
//     rawDescLines.forEach((rawLine) => {
//       // Prepend bullet only once per original line
//       const lineWithBullet = `• ${rawLine}`;
  
//       // Wrap long lines
//       const wrappedLines = doc.splitTextToSize(
//         lineWithBullet,
//         descWidth - 15
//       );
  
//       // Draw each wrapped line (lineY moves down each time)
//       wrappedLines.forEach((line) => {
//         doc.text(line, descX + 4, lineY);
//         lineY += descFontSize + descLineSpacing;
//       });
//     });
//     // --- Numeric columns: centered vertically ---
//     doc.setFontSize(9);
//     doc.setFont(undefined, "normal");
//     doc.setTextColor(0, 0, 0);
  
//     const numY = currentRowY; // align with title top
//     doc.text(row.quantity.toString(), qteX + qteWidth / 2, numY, { align: "center" });
//     doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth / 2, numY, { align: "center" });
//     doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth / 2, numY, { align: "center" });
//     // Move currentRowY for next row
//     currentRowY += totalHeight + 2; // small spacing between rows
    
//   });
//     const subtotal = tableData.reduce((acc, row) => acc + row.total, 0);

// // --- Determine Y position for bottom of table ---
// const tableBottomY = pageHeight - 14; // same as your tableEndY
// const sousTotalY = tableBottomY - 4; // small padding from bottom

// // Title: "Sous-Total"
// doc.setFontSize(10);
// doc.setFont(undefined, "bold");
// doc.setTextColor(0, 0, 0);// white text
// doc.text("Sous-Total", descX + 5, sousTotalY);

// // Numeric column: subtotal under "Total HT"
// doc.setFontSize(10);
// doc.setFont(undefined, "bold");
// doc.setTextColor(0, 0, 0);
// doc.text(`${subtotal.toFixed(2)} €`, ttcX + ttcWidth / 2, sousTotalY, { align: "center" });

// doc.setDrawColor(0, 0, 0);
// doc.line(margin, sousTotalY - 8, pageWidth - margin, sousTotalY - 8);

//     doc.setPage(1);
//     addFooter(1);

//     // === Page 2 ===
//     doc.addPage();

//     const marginTopp = 10;
//     const marginLeftp = 5;
//     const logoWidthp = 38;
//     const logoHeightp = 38;
//     const logoleftwidthp = 40;
//     const logoleftheightp = 40;

//     // Left logo
//     doc.addImage(
//       logo,
//       "JPEG",
//       marginLeftp,
//       marginTopp,
//       logoleftwidthp,
//       logoleftheightp
//     );

//     // Center logo
//     doc.addImage(
//       logorge,
//       "JPEG",
//       (pageWidth - logoWidthp) / 2,
//       marginTopp,
//       logoWidthp,
//       logoHeightp
//     );

//     // Page number and invoice number
//     doc.setFontSize(10);
//     doc.text(`Page(s): 2 sur 2`, pageWidth - 30, marginTopp + 55);

//     // Consolidated invoice header
//     // doc.setFontSize(12);
//     // doc.setFont(undefined, "bold");
//     // doc.setTextColor(255, 0, 0);
//     // doc.text("FACTURE SOLDE CONSOLIDÉE", pageWidth / 2, marginTopp + 45, { align: "center" });
//     // doc.setTextColor(0, 0, 0);

//     // Detailed breakdown of invoices
//     if (invoices.length > 0) {
//       doc.setFontSize(9);
//       doc.setFont(undefined, "bold");
//       doc.text("Détail des factures regroupées:", margin, marginTopp + 53);
      
//       let invoiceY = marginTopp + 60;
      
//       invoices.forEach((invoice, index) => {
//         doc.setFont(undefined, "normal");
        
//         const installment = command.billingPlan?.installments?.find(inst => 
//           Math.abs(inst.amount - invoice.amount) < 0.01
//         );
        
//         doc.text(
//           `${invoice.invoiceNumber}: ${installment?.description || 'Facture'} - ${installment?.percentage || 0}% - ${invoice.amount.toFixed(2)} € TTC - ${moment(invoice.issueDate).format('DD/MM/YYYY')}`,
//           margin + 5,
//           invoiceY
//         );
//         invoiceY += 4;
//       });
      
//       doc.setTextColor(0, 0, 0);
//       doc.setFont(undefined, "normal");
//     }

//     const BODY_ROW_HEIGHT = 125; // Height of body rows
// const HEADER_ROW_HEIGHT = 8; // Smaller header height (reduced from 15)
//     const ROWS_PER_PAGE = 1;
  
//     const DESC_WIDTH = 110;
//     const QTY_WIDTH = equalColumnWidth;
// const UNIT_PRICE_WIDTH = equalColumnWidth;
// const TOTAL_WIDTH = equalColumnWidth;

// // Column positions
// const DESC_X = margin;
// const QTY_X = DESC_X + DESC_WIDTH;
// const UNIT_PRICE_X = QTY_X + QTY_WIDTH;
// const TOTAL_X = UNIT_PRICE_X + UNIT_PRICE_WIDTH;

// // Vertical line positions
// const LINE1 = DESC_X + DESC_WIDTH;
// const LINE2 = QTY_X + QTY_WIDTH;
// const LINE3 = UNIT_PRICE_X + UNIT_PRICE_WIDTH;

// const drawTableFrame = (startY, pageNum, pageItems) => {
//   const headerBgColor = [21, 128, 61];

//   // Draw header background
//   doc.setFillColor(...headerBgColor);
//   doc.rect(margin + 0.2, startY + 0.2, pageWidth - 2 * margin - 0.4, HEADER_ROW_HEIGHT - 0.4, "F");

//   // Header top border
//   doc.line(margin, startY, pageWidth - margin, startY);

//   // Header text
//   const textY = startY + HEADER_ROW_HEIGHT / 2 + 1;
//   doc.setFontSize(9);
//   doc.setFont(undefined, "bold");
  
//   // Calculate center positions for equal columns
//   const descCenter = DESC_X + DESC_WIDTH / 2;
//   const qtyCenter = QTY_X + QTY_WIDTH / 2;
//   const unitPriceCenter = UNIT_PRICE_X + UNIT_PRICE_WIDTH / 2;
//   const totalCenter = TOTAL_X + TOTAL_WIDTH / 2;
  
//   doc.text("Descriptif des travaux", descCenter, textY, { align: "center" });
//   doc.text("QTÉ", qtyCenter, textY, { align: "center" });
//   doc.text("Prix u. HT", unitPriceCenter, textY, { align: "center" });
//   doc.text("Total HT", totalCenter, textY, { align: "center" });
//   doc.setFont(undefined, "normal");

//   // Horizontal lines
//   const yPos = startY + HEADER_ROW_HEIGHT + BODY_ROW_HEIGHT;
//   doc.line(margin, startY + HEADER_ROW_HEIGHT, pageWidth - margin, startY + HEADER_ROW_HEIGHT); // header bottom
//   doc.line(margin, yPos, pageWidth - margin, yPos); // row bottom
  
//   if (pageItems && pageItems.length > 0) {
//     const subtotalPage = pageItems.reduce((acc, row) => acc + row.total, 0);

//     const tableBottom = startY + HEADER_ROW_HEIGHT + ROWS_PER_PAGE * BODY_ROW_HEIGHT;
//     const sousTotalY = tableBottom - 10; // 10 units above bottom

//     // Label
//     doc.setFontSize(10);
//     doc.setFont(undefined, "bold");
//     doc.setTextColor(0, 0, 0);
//     doc.text("Sous-Total", DESC_X + 5, sousTotalY);

//     // Value
//     doc.text(`${subtotalPage.toFixed(2)} €`, TOTAL_X + TOTAL_WIDTH / 2, sousTotalY, { align: "center" });

//     // Line above subtotal
//     doc.setDrawColor(0, 0, 0);
//     doc.line(margin, sousTotalY - 5, pageWidth - margin, sousTotalY - 5);
//   }

//   // Vertical lines
//   const tableBottom = startY + HEADER_ROW_HEIGHT + ROWS_PER_PAGE * BODY_ROW_HEIGHT;
//   doc.line(margin, startY, margin, tableBottom);
//   doc.line(LINE1, startY, LINE1, tableBottom);
//   doc.line(LINE2, startY, LINE2, tableBottom);
//   doc.line(LINE3, startY, LINE3, tableBottom);
//   doc.line(pageWidth - margin, startY, pageWidth - margin, tableBottom);

// };

//     const tableStartY2 = 80;
//     drawTableFrame(tableStartY2);

//     // === TVA Recap Section ===
//     let recapY = tableStartY2 + 150;

//     doc.setFontSize(12);
//     doc.setFont(undefined, "bold");
//     doc.text("Détail TVA", margin, recapY);

//     doc.setFontSize(10);
//     doc.setFont(undefined, "normal");
//     recapY += 10;

//     const col1X = margin;
//     const col2X = margin + 40;
//     const col3X = margin + 80;

//     doc.setFont(undefined, "bold");
//     doc.text("Taux:", col1X, recapY);
//     doc.setFont(undefined, "normal");
//     doc.text("5.5%", col1X, recapY + 6);

//     doc.setFont(undefined, "bold");
//     doc.text("Montant TVA:", col2X, recapY);
//     doc.setFont(undefined, "normal");
//     doc.text(`${totalTVA.toFixed(2)} €`, col2X, recapY + 6);

//     doc.setFont(undefined, "bold");
//     doc.text("Base HT:", col3X, recapY);
//     doc.setFont(undefined, "normal");
//     doc.text(`${totalHT.toFixed(2)} €`, col3X, recapY + 6);

//     // Recap box
//     const recapBoxX = pageWidth - 80;
//     let recapBoxY = recapY - 16;

//     doc.setFillColor(200);
//     doc.rect(recapBoxX - 5, recapBoxY, 80, 35, "F");

//     doc.setFont(undefined, "bold");
//     doc.setFontSize(12);
//     doc.text("Récapitulatif", recapBoxX, recapBoxY + 5);

//     doc.setFontSize(11);
//     recapBoxY += 16;
//     doc.text("Total HT:", recapBoxX, recapBoxY);
//     doc.text(`${totalHT.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });

//     recapBoxY += 8;
//     doc.text("Total TVA:", recapBoxX, recapBoxY);
//     doc.text(`${totalTVA.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });

//     recapBoxY += 8;
//     doc.text("Total TTC:", recapBoxX, recapBoxY);
//     doc.text(`${totalAmount.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });

//     // Consolidated summary
//     // recapY += 12;
//     // doc.text(`Total du projet: ${totalAmount.toFixed(2)} €`, margin, recapY + 6);
//     // doc.text(`Montant de cette facture consolidée: ${totalAmount.toFixed(2)} € (100%)`, margin, recapY + 12);
//     // doc.text(`Nombre de factures regroupées: ${invoices.length}`, margin, recapY + 18);

//     // Signature section
//     // recapY += 30;
//     // doc.text('Date et signature précédée de la mention :', margin, recapY);
//     // recapY += 6;
//     // doc.text('"Bon pour accord"', margin, recapY);

//     doc.setPage(2);
//     addFooter(2);

//     return doc;
// };
const generateConsolidatedInvoicePdf = (invoices, command) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginTop = 10;
  const marginLeft = 5;
  const margin = 8;
  
  const addFooter = (pageNum) => {
    const footerY = pageHeight - 5; 
    const leftText = "Global Green - SAS au capital social de 5000 €";
    const centerText = "N°SIREN 94305436100010 - RCS Blois";
    const rightText = "N° de TVA FR41492502992";

    doc.setFontSize(9);
    doc.setFont(undefined, "normal");

    // Left-aligned
    doc.text(leftText, margin, footerY);

    // Centered
    doc.text(centerText, pageWidth / 2, footerY, { align: "center" });

    // Right-aligned
    doc.text(rightText, pageWidth - margin, footerY, { align: "right" });
  };

  const logoWidth = 40;
  const logoHeight = 40;
  const logoleftwidth = 40;
  const logoleftheight = 40;

  // Calculate consolidated amounts
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalHT = totalAmount / 1.2;
  const totalTVA = totalAmount * 0.055 / 1.2;
  
  // Get the latest invoice for dates
  const latestInvoice = invoices.reduce((latest, invoice) => {
    return new Date(invoice.issueDate) > new Date(latest.issueDate) ? invoice : latest;
  }, invoices[0]);

  // Use command number for consolidated invoice
  const invoiceNumber = command.numCommand || "F218235";
  const isConsolidatedInvoice = true;

  // === Page 1 ===

  // Add logos - left logo only
  doc.addImage(
    logo,
    "JPEG",
    marginLeft,
    marginTop, 
    logoleftwidth,
    logoleftheight
  );

  // Company info on the right side
  doc.setFontSize(10);
  const rightStartX = pageWidth - 50;

  // "Entreprise:" in bold
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Entreprise:", rightStartX, 15);

  // The rest in regular Helvetica
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 128, 0);
  doc.text("GLOBAL GREEN", rightStartX, 21);

  doc.setFont(undefined, "Helvetica");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("641 AVENUE DU GRAIN D'OR", rightStartX, 27);
  doc.text("41350 VINEUIL - France", rightStartX, 32);
  doc.text("Contact@global-green.fr", rightStartX, 37);
  doc.text("07 64 71 26 87", rightStartX, 42);

  // Center logo
  doc.addImage(
    logorge,
    "JPEG",
    pageWidth/2 - logoWidth/2,
    marginLeft,
    logoWidth,
    logoHeight,
    marginTop, 
  );

  doc.setFont(undefined, "Helvetica");
  doc.setFontSize(11);

  // Configuration
  const LINE_SPACING = 6;
  const UNDERLINE_OFFSET = 1;
  const DASH_COLOR = 100;
  const LINE_WIDTH = 0.2;
  const SECTION_SPACING = 0.1;

  // Invoice header
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  const invoiceY = 55;
  
  // Invoice title for consolidated invoice
  const invoiceTitle = "Facture - Solde";

  doc.text(invoiceTitle, margin, invoiceY + 4);

  // Left info under "Facture"
  const emissionMoment = moment(latestInvoice.issueDate || new Date());
  const dueMoment = moment(latestInvoice.dueDate || emissionMoment.clone().add(1, "month"));

  const leftTexts = [
    `Numéro                               ${invoiceNumber}`,
    `Date d'émission:                 ${emissionMoment.format("DD/MM/YYYY")}`,
    `Date d'expiration:               ${dueMoment.format("DD/MM/YYYY")}`,
    `Type de vente:                    Prestation de service`,
    `Type facture:                      Solde Consolidé`,
  ];

  // Client information on the right
  doc.setFontSize(10);
  doc.setFont(undefined, "Helvetica");
  doc.setTextColor(0, 0, 0);
  const rightTexts = [
    `${command.nom || ""}`,
    `${command.address || ""}`,
    `${command.ville || ""},  ${command.codepostal || ""}`,
    `${command.email || ""}`,
  ];

  const maxRightWidth = Math.max(
    ...rightTexts.map(
      (t) =>
        (doc.getStringUnitWidth(t) * doc.internal.getFontSize()) /
        doc.internal.scaleFactor
    )
  );

  // Right-side starting X
  const rightStartXd = pageWidth - margin - maxRightWidth - 4;

  // Starting Y position
  let currentRightYy = 58;

  // "Client ou cliente:" in bold
  doc.setFont(undefined, "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Client ou Cliente:", rightStartXd, currentRightYy);

  // Client name in bold and green
  currentRightYy += LINE_SPACING;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 128, 0);
  doc.text(`${command.nom || ""}`, rightStartXd, currentRightYy);

  // Rest of client details
  const otherRightTexts = [
    `${command.address || ""}`,
    `${command.ville || ""}   ${command.codepostal || ""}`,
    `${command.email || ""}`,
  ];

  doc.setFont(undefined, "Helvetica");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  currentRightYy += LINE_SPACING;
  otherRightTexts.forEach((text, index) => {
    doc.text(text, rightStartXd, currentRightYy);
    currentRightYy +=
      LINE_SPACING + (index < otherRightTexts.length - 1 ? SECTION_SPACING : 0);
  });

  // Left side information
  let currentLeftY = 68;
  leftTexts.forEach((text, index) => {
    doc.text(text, margin, currentLeftY);
    currentLeftY +=
      LINE_SPACING + (index < leftTexts.length - 1 ? SECTION_SPACING : 0);
  });

  // Invoice description
  doc.setFontSize(10);
  const currentTextColors = doc.getTextColor();
  doc.setFont(undefined, "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  
  const prestationsYStart = 105; // Y position of the first line
  const lineSpacing = 6; // space between lines

  // Line 1: Nature des prestations
  doc.text(
    `Nature des prestations:`,
    margin,
    prestationsYStart
  );
  doc.setFont(undefined, "Helvetica");
  // Line 3: Installation description
  doc.text(
    `Installation et raccordement d'une pompe à chaleur AIR/EAU`,
    margin,
    prestationsYStart + lineSpacing,
  );

  // Line 4: Nota
  doc.text(
    `Note: Fourniture des radiateurs par le client.`,
    margin,
    prestationsYStart + lineSpacing * 2
  );

  // Page number
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, "Helvetica");
  doc.setFontSize(10);
  doc.text(`Page(s): 1 sur ${command.items && command.items.length > 2 ? '2' : '1'}`, pageWidth - margin, prestationsYStart + 10, { align: "right" });

  doc.setTextColor(currentTextColors);

  // Table configuration - EQUAL COLUMN WIDTHS
  const descWidth = 110; // slightly narrower description
  const availableWidth = pageWidth - 2 * margin - descWidth;
  const equalColumnWidth = availableWidth / 3; // Divide remaining space equally

  const qteWidth = equalColumnWidth;
  const prixWidth = equalColumnWidth;
  const ttcWidth = equalColumnWidth;

  const descX = margin;
  const qteX = descX + descWidth;
  const prixX = qteX + qteWidth;
  const ttcX = prixX + prixWidth;

  const line1 = descX + descWidth;
  const line2 = line1 + qteWidth;
  const line3 = line2 + prixWidth;

  // Header parameters
  const headerY = 122;
  const headerHeight = 8;
  const textY = headerY + 5;
  const firstLineY = headerY + headerHeight;

  // Draw header background
  doc.setFillColor(21, 128, 61); 
  doc.rect(
    margin + 0.2,
    headerY + 0.2,
    pageWidth - 2 * margin - 0.4,
    headerHeight - 0.4,
    "F"
  );

  doc.line(margin, headerY, pageWidth - margin, headerY);

  // Table headers
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);

  const descCenter = descX + descWidth / 2;
  const qteCenter = qteX + qteWidth / 2;
  const prixCenter = prixX + prixWidth / 2;
  const ttcCenter = ttcX + ttcWidth / 2;

  const tableTitle = "Descriptif de la facture consolidée";
    
  doc.text(tableTitle, descCenter, textY, {
    align: "center",
  });
  doc.text("QTÉ", qteCenter, textY, { align: "center" });
  doc.text("Prix u. HT", prixCenter, textY, { align: "center" });
  doc.text("Total HT", ttcCenter, textY, { align: "center" });

  doc.setFont(undefined, "normal");

  // Prepare table data
  const tableData = [];
  if (command.items && command.items.length > 0) {
    command.items.forEach((item) => {
      tableData.push({
        title: item.title || "N/A",
        reference: item.reference || "",
        description: item.description || "",
        quantity: item.quantite || 1,
        unitPrice: item.prixUnitaire || 0,
        total: item.montantTTC || item.prixUnitaire * item.quantite * (1 + (item.tva || 0) / 100),
      });
    });
  } else {
    tableData.push({
      title: command.title || "N/A",
      reference: command.reference || "",
      description: command.description || "",
      quantity: command.quantite || 1,
      unitPrice: command.prixUnitaire || command.totalHT / (command.quantite || 1),
      total: command.totalTTC || 0,
    });
  }

  // === NEW: Calculate which products go on page 1 vs page 2 ===
  const maxProductsPage1 = 2; // Maximum 2 products on page 1
  const productsPage1 = tableData.slice(0, maxProductsPage1);
  const productsPage2 = tableData.slice(maxProductsPage1);

  // === PAGE 1 TABLE CONTENT ===
  let currentRowY = firstLineY + 8;
  
  productsPage1.forEach((row, index) => {
    const titleFontSize = 10;
    const refFontSize = 10;
    const descFontSize = 9;
    const titleRefSpacing = 0.5;
    const refDescSpacing = 0.5;
    const descLineSpacing = 0.3;

    const descLines = doc.splitTextToSize(row.description, descWidth - 15);
    const totalHeight = titleFontSize + titleRefSpacing + refFontSize + refDescSpacing + descLines.length * (descFontSize + descLineSpacing);

    let lineY = currentRowY;

    // Title
    doc.setFontSize(titleFontSize);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(row.title, descX + 5, lineY);
    lineY += titleFontSize;

    // Reference
    doc.setFontSize(refFontSize);
    doc.setFont(undefined, "italic");
    doc.setTextColor(0, 0, 0);
    doc.text(`Réf: ${row.reference}`, descX + 5, lineY);
    lineY += refFontSize;

    // Description with bullets
    doc.setFontSize(descFontSize);
    doc.setFont(undefined, "normal");
    doc.setTextColor(0, 0, 0);
    const rawDescLines = row.description.split("\n");

    rawDescLines.forEach((rawLine) => {
      const lineWithBullet = `• ${rawLine}`;
      const wrappedLines = doc.splitTextToSize(lineWithBullet, descWidth - 15);
      wrappedLines.forEach((line) => {
        doc.text(line, descX + 4, lineY);
        lineY += descFontSize + descLineSpacing;
      });
    });

    // Numeric columns
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(row.quantity.toString(), qteX + qteWidth / 2, currentRowY, { align: "center" });
    doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth / 2, currentRowY, { align: "center" });
    doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth / 2, currentRowY, { align: "center" });

    currentRowY += totalHeight + 2;

    // Add horizontal line between products (except after last product on page)
    if (index < productsPage1.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin + 5, currentRowY - 6, pageWidth - margin - 5, currentRowY - 6);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
    }
  });

  // Draw table frame for page 1
  const tableEndY = pageHeight - 20;
  doc.line(margin, headerY, margin, tableEndY);
  doc.line(line1, headerY, line1, tableEndY);
  doc.line(line2, headerY, line2, tableEndY);
  doc.line(line3, headerY, line3, tableEndY);
  doc.line(pageWidth - margin, headerY, pageWidth - margin, tableEndY);
  
  // ADDED: Bottom horizontal line to close the table
  doc.line(margin, tableEndY, pageWidth - margin, tableEndY);

  // Subtotal for page 1 (only products on this page)
  const subtotalPage1 = productsPage1.reduce((acc, row) => acc + row.total, 0);
  const sousTotalY = tableEndY - 4;

  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Sous-Total", descX + 5, sousTotalY);
  doc.text(`${subtotalPage1.toFixed(2)} €`, ttcX + ttcWidth / 2, sousTotalY, { align: "center" });

  doc.setDrawColor(0, 0, 0);
  doc.line(margin, sousTotalY - 8, pageWidth - margin, sousTotalY - 8);

  doc.setPage(1);
  addFooter(1);

  // === PAGE 2 (only if there are products for page 2) ===
  if (productsPage2.length > 0) {
    doc.addPage();

    const marginTopp = 10;
    const marginLeftp = 5;
    const logoWidthp = 40;
    const logoHeightp = 40;

    // Left logo
    doc.addImage(logo, "JPEG", marginLeftp, marginTopp, 40, 40);

    // Center logo
    doc.addImage(logorge, "JPEG", (pageWidth - logoWidthp) / 2, marginTopp, logoWidthp, logoHeightp);

    // Page number
    doc.setFontSize(10);
    doc.text(`Page(s): 2 sur 2`, pageWidth - 30, marginTopp + 60);

    // Detailed breakdown of invoices
    if (invoices.length > 0) {
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text("Détail des factures regroupées:", margin, marginTopp + 53);
      
      let invoiceY = marginTopp + 60;
      
      invoices.forEach((invoice, index) => {
        doc.setFont(undefined, "normal");
        
        const installment = command.billingPlan?.installments?.find(inst => 
          Math.abs(inst.amount - invoice.amount) < 0.01
        );
        
        doc.text(
          `${invoice.invoiceNumber}: ${installment?.description || 'Facture'} - ${installment?.percentage || 0}% - ${invoice.amount.toFixed(2)} € TTC - ${moment(invoice.issueDate).format('DD/MM/YYYY')}`,
          margin + 5,
          invoiceY
        );
        invoiceY += 4;
      });
      
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "normal");
    }

    // Table header for page 2
    const page2HeaderY = 80;
    const page2HeaderHeight = 8;
    const page2TextY = page2HeaderY + 5;
    const page2FirstLineY = page2HeaderY + page2HeaderHeight;

    // Draw header background
    doc.setFillColor(21, 128, 61);
    doc.rect(margin + 0.2, page2HeaderY + 0.2, pageWidth - 2 * margin - 0.4, page2HeaderHeight - 0.4, "F");
    doc.line(margin, page2HeaderY, pageWidth - margin, page2HeaderY);

    // Table headers
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Descriptif des travaux (suite)", descCenter, page2TextY, { align: "center" });
    doc.text("QTÉ", qteCenter, page2TextY, { align: "center" });
    doc.text("Prix u. HT", prixCenter, page2TextY, { align: "center" });
    doc.text("Total HT", ttcCenter, page2TextY, { align: "center" });

    doc.setFont(undefined, "normal");

    // === PAGE 2 TABLE CONTENT ===
    let page2CurrentRowY = page2FirstLineY + 8;

    productsPage2.forEach((row, index) => {
      const titleFontSize = 10;
      const refFontSize = 10;
      const descFontSize = 9;
      const titleRefSpacing = 0.5;
      const refDescSpacing = 0.5;
      const descLineSpacing = 0.3;

      const descLines = doc.splitTextToSize(row.description, descWidth - 15);
      const totalHeight = titleFontSize + titleRefSpacing + refFontSize + refDescSpacing + descLines.length * (descFontSize + descLineSpacing);

      let lineY = page2CurrentRowY;

      // Title
      doc.setFontSize(titleFontSize);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(row.title, descX + 5, lineY);
      lineY += titleFontSize;

      // Reference
      doc.setFontSize(refFontSize);
      doc.setFont(undefined, "italic");
      doc.setTextColor(0, 0, 0);
      doc.text(`Réf: ${row.reference}`, descX + 5, lineY);
      lineY += refFontSize;

      // Description with bullets
      doc.setFontSize(descFontSize);
      doc.setFont(undefined, "normal");
      doc.setTextColor(0, 0, 0);
      const rawDescLines = row.description.split("\n");

      rawDescLines.forEach((rawLine) => {
        const lineWithBullet = `• ${rawLine}`;
        const wrappedLines = doc.splitTextToSize(lineWithBullet, descWidth - 15);
        wrappedLines.forEach((line) => {
          doc.text(line, descX + 4, lineY);
          lineY += descFontSize + descLineSpacing;
        });
      });

      // Numeric columns
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(row.quantity.toString(), qteX + qteWidth / 2, page2CurrentRowY, { align: "center" });
      doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth / 2, page2CurrentRowY, { align: "center" });
      doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth / 2, page2CurrentRowY, { align: "center" });

      page2CurrentRowY += totalHeight + 2;

      // Add horizontal line between products
      if (index < productsPage2.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin + 5, page2CurrentRowY - 2, pageWidth - margin - 5, page2CurrentRowY - 2);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
      }
    });

    // DECREASED HEIGHT: Changed table height for page 2
    const page2TableEndY = pageHeight - 100;
    
    // Draw table frame for page 2
    doc.line(margin, page2HeaderY, margin, page2TableEndY);
    doc.line(line1, page2HeaderY, line1, page2TableEndY);
    doc.line(line2, page2HeaderY, line2, page2TableEndY);
    doc.line(line3, page2HeaderY, line3, page2TableEndY);
    doc.line(pageWidth - margin, page2HeaderY, pageWidth - margin, page2TableEndY);
    
    // ADDED: Bottom horizontal line to close the table on page 2
    doc.line(margin, page2TableEndY, pageWidth - margin, page2TableEndY);


    const finalSousTotalY = page2TableEndY - 4;

    // === TVA Recap Section ===
    // ADJUSTED: Moved TVA section higher up due to decreased table height
    let recapY = page2TableEndY + 10;

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Détail TVA", margin, recapY);

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    recapY += 10;

    const col1X = margin;
    const col2X = margin + 40;
    const col3X = margin + 80;

    doc.setFont(undefined, "bold");
    doc.text("Taux:", col1X, recapY);
    doc.setFont(undefined, "normal");
    doc.text("5.5%", col1X, recapY + 6);

    doc.setFont(undefined, "bold");
    doc.text("Montant TVA:", col2X, recapY);
    doc.setFont(undefined, "normal");
    doc.text(`${totalTVA.toFixed(2)} €`, col2X, recapY + 6);

    doc.setFont(undefined, "bold");
    doc.text("Base HT:", col3X, recapY);
    doc.setFont(undefined, "normal");
    doc.text(`${totalHT.toFixed(2)} €`, col3X, recapY + 6);

    // Recap box
    const recapBoxX = pageWidth - 80;
    let recapBoxY = recapY - 8;

    doc.setFillColor(200);
    doc.rect(recapBoxX - 5, recapBoxY, 80, 35, "F");

    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text("Récapitulatif", recapBoxX, recapBoxY + 5);

    doc.setFontSize(11);
    recapBoxY += 16;
    doc.text("Total HT:", recapBoxX, recapBoxY);
    doc.text(`${totalHT.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });

    recapBoxY += 8;
    doc.text("Total TVA:", recapBoxX, recapBoxY);
    doc.text(`${totalTVA.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });

    recapBoxY += 8;
    doc.text("Total TTC:", recapBoxX, recapBoxY);
    doc.text(`${totalAmount.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });

    doc.setPage(2);
    addFooter(2);
  }

  return doc;
};
//   const generateInvoicePdf = (invoice, command) => {
//     const doc = new jsPDF();
//     const pageWidth = doc.internal.pageSize.width;
//     const pageHeight = doc.internal.pageSize.height;
//     const marginTop = 10;
//     const marginLeft = 5;
//     const margin = 8;
    
//     const addFooter = (pageNum) => {
//       const footerY = pageHeight - 5; 
//       const leftText = "Global Green - SAS au capital social de 5000 €";
//       const centerText = "N°SIREN 94305436100010 - RCS Blois";
//       const rightText = "N° de TVA FR41492502992";
  
//       doc.setFontSize(9);
//       doc.setFont(undefined, "normal");
  
//       // Left-aligned
//       doc.text(leftText, margin, footerY);
  
//       // Centered
//       doc.text(centerText, pageWidth / 2, footerY, { align: "center" });
  
//       // Right-aligned
//       doc.text(rightText, pageWidth - margin, footerY, { align: "right" });
//     };
  
//     const logoWidth = 40;
//     const logoHeight = 40;
//     const logoleftwidth = 40;
//     const logoleftheight = 40;
  
//     // Get billing plan data from command
//     const billingPlan = command.billingPlan;
//     const installments = billingPlan?.installments || [];
  
//     // Find the correct installment for this invoice
//     const currentInstallment = installments.find(inst => 
//         Math.abs(inst.amount - invoice.amount) < 0.01
//     ) || installments[0];
    
//     const isAcompteInvoice = currentInstallment?.description?.toLowerCase().includes('acompte') || false;
  
//     // Use the actual invoice number from the data
//     const invoiceNumber = invoice.invoiceNumber || command.numCommand || "F218235";
  
//     // === Page 1 ===

// // Add logos - left logo only
// doc.addImage(
//   logo,
//   "JPEG",
//   marginLeft,
//   marginTop, 
//   logoleftwidth,
//   logoleftheight
// );

// // Company info on the right side
// doc.setFontSize(10);
// const rightStartX = pageWidth - 50;

// // "Entreprise:" in bold
// doc.setFont(undefined, "bold");
// doc.setTextColor(0, 0, 0);
// doc.text("Entreprise:", rightStartX, 15);

// // The rest in regular Helvetica
// doc.setFont("Helvetica", "bold");
// doc.setFontSize(10);
// doc.setTextColor(0, 128, 0); 
// doc.text("GLOBAL GREEN", rightStartX, 21);

// doc.setFont(undefined, "Helvetica");
// doc.setFontSize(10);
// doc.setTextColor(0, 0, 0);
// doc.text("641 AVENUE DU GRAIN D'OR", rightStartX, 27);
// doc.text("41350 VINEUIL - France", rightStartX, 32);
// doc.text("Contact@global-green.fr", rightStartX, 37);
// doc.text("07 64 71 26 87", rightStartX, 42);

// // Center logo
// doc.addImage(
//   logorge,
//   "JPEG",
//   pageWidth/2 - logoWidth/2,
//   marginLeft,
//   logoWidth,
//   logoHeight,
//   marginTop, 
// );

// doc.setFont(undefined, "Helvetica");
// doc.setFontSize(11);

// // Configuration
// const LINE_SPACING = 6;
// const UNDERLINE_OFFSET = 1;
// const DASH_COLOR = 100;
// const LINE_WIDTH = 0.2;
// const SECTION_SPACING = 0.1;

// // Invoice header
// doc.setFontSize(11);
// doc.setFont(undefined, "bold");
// doc.setTextColor(0, 0, 0);
// const invoiceY = 60;

// // Determine invoice title based on current installment
// let invoiceTitle = "Facture";
// if (currentInstallment) {
//     if (isAcompteInvoice) {
//         invoiceTitle = "Facture - Acompte";
//     } else if (installments.length > 1) {
//         invoiceTitle = "Facture - Intermediaire";
//     }
// }

// doc.text(invoiceTitle, margin, invoiceY);

// // Left info under "Facture"
// const emissionMoment = moment(invoice.issueDate || new Date());
// const dueMoment = moment(invoice.dueDate || emissionMoment.clone().add(1, "month"));

// const leftTexts = [
//   `Numéro                               ${invoiceNumber}`,
//   `Date d'émission:                 ${emissionMoment.format("DD/MM/YYYY")}`,
//   `Date d'expiration:               ${dueMoment.format("DD/MM/YYYY")}`,
//   `Type de vente:                    Prestation de service`,
// ];

// // Add special note for acompte invoices
// if (isAcompteInvoice) {
//   leftTexts.push(`Type facture:                      Acompte`);
// }

// // Client information on the right
// doc.setFontSize(11);
// doc.setFont(undefined, "Helvetica");
// doc.setTextColor(0, 0, 0);
// const rightTexts = [
//   `${command.nom || ""}`,
//   `${command.address || ""}`,
//   `${command.ville || ""},  ${command.codepostal || ""}`,
//   `${command.email || ""}`,
// ];

// const maxRightWidth = Math.max(
//   ...rightTexts.map(
//     (t) =>
//       (doc.getStringUnitWidth(t) * doc.internal.getFontSize()) /
//       doc.internal.scaleFactor
//   )
// );

// // Right-side starting X
// const rightStartXd = pageWidth - margin - maxRightWidth - 4;

// // Starting Y position
// let currentRightYy = 58;

// // "Client ou cliente:" in bold
// doc.setFont(undefined, "bold");
// doc.setFontSize(12);
// doc.setTextColor(0, 0, 0);
// doc.text("Client ou Cliente:", rightStartXd, currentRightYy);

// // Client name in bold and green
// currentRightYy += LINE_SPACING;
// doc.setFont("Helvetica", "bold");
// doc.setFontSize(10);
// doc.setTextColor(0, 128, 0); 
// doc.text(`${command.nom || ""}`, rightStartXd, currentRightYy);

// // Rest of client details
// const otherRightTexts = [
//   `${command.address || ""}`,
//   `${command.ville || ""}   ${command.codepostal || ""}`,
//   `${command.email || ""}`,
// ];

// doc.setFont(undefined, "Helvetica");
// doc.setFontSize(11);
// doc.setTextColor(0, 0, 0);

// currentRightYy += LINE_SPACING;
// otherRightTexts.forEach((text, index) => {
//   doc.text(text, rightStartXd, currentRightYy);
//   currentRightYy +=
//     LINE_SPACING + (index < otherRightTexts.length - 1 ? SECTION_SPACING : 0);
// });

// // Left side information
// let currentLeftY = 60;
// leftTexts.forEach((text, index) => {
//   doc.text(text, margin, currentLeftY + 6);
//   currentLeftY +=
//     LINE_SPACING + (index < leftTexts.length - 1 ? SECTION_SPACING : 0);
// });

// // Invoice description
// doc.setFontSize(10);
// const currentTextColors = doc.getTextColor();
// doc.setFont(undefined, "bold");
// doc.setFontSize(10);
// doc.setTextColor(0, 0, 0);

// const prestationsYStart = 100; // Y position of the first line
// const lineSpacing = 6; // space between lines

// doc.setFontSize(11);
// // Line 1: Nature des prestations
// doc.text(
//   `Nature des prestations:`,
//   margin,
//   prestationsYStart
// );
// doc.setFont(undefined, "Helvetica");
// // Line 3: Installation description
// doc.text(
//   `Installation et raccordement d'une pompe à chaleur AIR/EAU`,
//   margin,
//   prestationsYStart + lineSpacing,
// );

// // Line 4: Nota
// doc.text(
//   `Note: Fourniture des radiateurs par le client.`,
//   margin,
//   prestationsYStart + lineSpacing * 2
// );

// // Page number
// doc.setTextColor(0, 0, 0);
// doc.setFont(undefined, "Helvetica");
// doc.setFontSize(10);
// doc.text(`Page(s): 1 sur 2`, pageWidth - margin, prestationsYStart + 10, { align: "right" });

// doc.setTextColor(currentTextColors);

// // Table configuration - EQUAL COLUMN WIDTHS
// const descWidth = 110; // slightly narrower description
// const availableWidth = pageWidth - 2 * margin - descWidth;
// const equalColumnWidth = availableWidth / 3; // Divide remaining space equally

// const qteWidth = equalColumnWidth;
// const prixWidth = equalColumnWidth;
// const ttcWidth = equalColumnWidth;

// const descX = margin;
// const qteX = descX + descWidth;
// const prixX = qteX + qteWidth;
// const ttcX = prixX + prixWidth;

// const line1 = descX + descWidth;
// const line2 = line1 + qteWidth;
// const line3 = line2 + prixWidth;

// // Header parameters (adjust Y position for acompte)
// const headerY = isAcompteInvoice ? 118 : 115;
// const headerHeight = 8;
// const textY = headerY + 5;
// const firstLineY = headerY + headerHeight;

// // Draw header background
// doc.setFillColor(21, 128, 61); 
// doc.rect(
//   margin + 0.2,
//   headerY + 0.2,
//   pageWidth - 2 * margin - 0.4,
//   headerHeight - 0.4,
//   "F"
// );

// doc.line(margin, headerY, pageWidth - margin, headerY);

// // Table headers
// doc.setFont(undefined, "bold");
// doc.setTextColor(0, 0, 0);

// const descCenter = descX + descWidth / 2;
// const qteCenter = qteX + qteWidth / 2;
// const prixCenter = prixX + prixWidth / 2;
// const ttcCenter = ttcX + ttcWidth / 2;

// const tableTitle = isAcompteInvoice ? 
//   "Descriptif de l'acompte" : 
//   "Descriptif de la facture";
  
// doc.text(tableTitle, descCenter, textY, {
//   align: "center",
// });
// doc.text("QTÉ", qteCenter, textY, { align: "center" });
// doc.text("Prix u. HT", prixCenter, textY, { align: "center" });
// doc.text("Total HT", ttcCenter, textY, { align: "center" });

// doc.setFont(undefined, "normal");

// // Table body
// const tableEndY = pageHeight - 14;
// const rowCount = 1;
// const rowHeights = (tableEndY - firstLineY) / rowCount;

// // Draw horizontal lines
// for (let i = 0; i <= rowCount; i++) {
//   const yPos = firstLineY + i * rowHeights;
//   doc.line(margin, yPos, pageWidth - margin, yPos);
// }

// // Draw vertical lines
// doc.line(margin, headerY, margin, tableEndY);
// doc.line(line1, headerY, line1, tableEndY);
// doc.line(line2, headerY, line2, tableEndY);
// doc.line(line3, headerY, line3, tableEndY);
// doc.line(pageWidth - margin, headerY, pageWidth - margin, tableEndY);

// // Fill table with correct installment data
// const originalTextColor = doc.getTextColor();
// const tableData = [];
// if (command.items && command.items.length > 0) {
//   command.items.forEach((item) => {
//     tableData.push({
//       title: item.title || "N/A",
//       reference: item.reference || "",
//       description: item.description || "",
//       quantity: item.quantite || 1,
//       unitPrice: item.prixUnitaire || 0,
//       total:
//         item.montantTTC ||
//         item.prixUnitaire * item.quantite * (1 + (item.tva || 0) / 100),
//     });
//   });
// } else {
//   tableData.push({
//     title: command.title || "N/A",
//     reference: command.reference || "",
//     description: command.description || "",
//     quantity: command.quantite || 1,
//     unitPrice:
//       command.prixUnitaire || command.totalHT / (command.quantite || 1),
//     total: command.totalTTC || 0,
//   });
// }

// let currentRowY = firstLineY + 8;
// tableData.forEach((row) => {
//   const titleFontSize = 10;
//   const refFontSize = 10;
//   const descFontSize = 9;
//   const titleRefSpacing = 0.5;
//   const refDescSpacing = 0.5;
//   const descLineSpacing = 0.3;

//   const descLines = doc.splitTextToSize(row.description, descWidth - 15);
//   const totalHeight = titleFontSize + titleRefSpacing + refFontSize + refDescSpacing + descLines.length * (descFontSize + descLineSpacing);
//   const centerY = currentRowY + totalHeight / 2;

//   // Left column content
//   let lineY = currentRowY;

//   doc.setFontSize(titleFontSize);
//   doc.setFont(undefined, "bold");
//   doc.setTextColor(0, 0, 0);
//   doc.text(row.title, descX + 5, lineY);
//   lineY += titleFontSize;

//   if (row.reference) {
//     doc.setFontSize(refFontSize);
//     doc.setFont(undefined, "italic");
//     doc.text(`Réf: ${row.reference}`, descX + 5, lineY);
//     lineY += refFontSize;
//   }

//   doc.setFontSize(descFontSize);
//   doc.setFont(undefined, "normal");
//   const rawDescLines = row.description.split("\n");

//   rawDescLines.forEach((rawLine) => {
//     const lineWithBullet = `• ${rawLine}`;
//     const wrappedLines = doc.splitTextToSize(lineWithBullet, descWidth - 15);
//     wrappedLines.forEach((line) => {
//       doc.text(line, descX + 4, lineY);
//       lineY += descFontSize + descLineSpacing;
//     });
//   });

//   // Numeric columns - centered in equal width columns
//   doc.setFontSize(9);
//   doc.setFont(undefined, "normal");
//   doc.setTextColor(0, 0, 0);
//   // doc.text(row.quantity.toString(), qteX + qteWidth / 2, centerY, { align: "center" });
//   // doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth / 2, centerY, { align: "center" });
//   // doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth / 2, centerY, { align: "center" });
//   const numY = currentRowY; // align with title top
//   doc.text(row.quantity.toString(), qteX + qteWidth / 2, numY, { align: "center" });
//   doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth / 2, numY, { align: "center" });
//   doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth / 2, numY, { align: "center" });

//   currentRowY += totalHeight + 2;
// });

// const subtotal = tableData.reduce((acc, row) => acc + row.total, 0);

// // --- Determine Y position for bottom of table ---
// const tableBottomY = pageHeight - 14; // same as your tableEndY
// const sousTotalY = tableBottomY - 4; // small padding from bottom

// // Title: "Sous-Total"
// doc.setFontSize(10);
// doc.setFont(undefined, "bold");
// doc.setTextColor(0, 0, 0);// white text
// doc.text("Sous-Total", descX + 5, sousTotalY);

// // Numeric column: subtotal under "Total HT"
// doc.setFontSize(10);
// doc.setFont(undefined, "bold");
// doc.setTextColor(0, 0, 0);
// doc.text(`${subtotal.toFixed(2)} €`, ttcX + ttcWidth / 2, sousTotalY, { align: "center" });

// doc.setDrawColor(0, 0, 0);
// doc.line(margin, sousTotalY - 8, pageWidth - margin, sousTotalY - 8);
// doc.setPage(1);
// addFooter(1);
  
//     // === Page 2 ===
//     doc.addPage();
  
//     const marginTopp = 10;
//     const marginLeftp = 5;
//     const logoWidthp = 38;
//     const logoHeightp = 38;
//     const logoleftwidthp = 40;
//     const logoleftheightp = 40;
  
//     // Left logo
//     doc.addImage(
//       logo,
//       "JPEG",
//       marginLeftp,
//       marginTopp,
//       logoleftwidthp,
//       logoleftheightp
//     );
  
//     // Center logo
//     doc.addImage(
//       logorge,
//       "JPEG",
//       (pageWidth - logoWidthp) / 2,
//       marginTopp,
//       logoWidthp,
//       logoHeightp
//     );
  
//     // Page number and invoice number
//     doc.setFontSize(10);
//     doc.text(`Page(s): 2 sur 2`, pageWidth - 30, marginTopp + 55);
  
//     // Special header for acompte invoices
//     // if (isAcompteInvoice) {
//     //   doc.setFontSize(12);
//     //   doc.setFont(undefined, "bold");
//     //   doc.setTextColor(255, 0, 0);
//     //   doc.text("FACTURE ACOMPTE", pageWidth / 2, marginTopp + 25, { align: "center" });
//     //   doc.setTextColor(0, 0, 0);
//     // }
  
//     // Billing plan information
//     if (installments.length > 0) {
//       doc.setFontSize(9);
//       doc.setFont(undefined, "bold");
//       doc.text("Plan de facturation complet:", margin, marginTopp  + (isAcompteInvoice ? 50 : 50));
      
//       let installmentY = marginTopp + (isAcompteInvoice ? 56 : 55);
      
//       installments.forEach((installment, index) => {
//         const isCurrent = installment === currentInstallment;
//         doc.setFont(undefined, isCurrent ? "bold" : "normal");
        
//         // const status = isCurrent ? "(Cette facture)" : "(À venir)";
//         doc.text(
//           `${installment.description}: ${installment.percentage}% - ${installment.amount.toFixed(2)} € TTC - ${moment(installment.dueDate).format('DD/MM/YYYY')}`,
//           margin + 5,
//           installmentY
//         );
//         installmentY += 4;
//       });
      
//       doc.setTextColor(0, 0, 0);
//       doc.setFont(undefined, "normal");
//     }
  
//     // Table constants for page 2
//     // const BODY_ROW_HEIGHT = 55;
//     // const HEADER_ROW_HEIGHT = 8;
//     const TABLE_ROW_HEIGHT = 55; // Increased from 8 to 10 for better spacing
// const BODY_ROW_HEIGHT = 125; // Height of body rows
// const HEADER_ROW_HEIGHT = 8; // Smaller header height (reduced from 15)
//     const ROWS_PER_PAGE = 1;
  
//     const DESC_WIDTH = 110;
//     // const QTY_WIDTH = 20;
//     // const UNIT_PRICE_WIDTH = 35;
//     // const TOTAL_WIDTH = 20;
  
//     // const DESC_X = margin;
//     // const QTY_X = DESC_X + DESC_WIDTH;
//     // const UNIT_PRICE_X = QTY_X + QTY_WIDTH;
//     // const TOTAL_X = UNIT_PRICE_X + UNIT_PRICE_WIDTH;
  
//     // const LINE1 = DESC_X + DESC_WIDTH;
//     // const LINE2 = QTY_X + QTY_WIDTH;
//     // const LINE3 = UNIT_PRICE_X + UNIT_PRICE_WIDTH;
  
// const QTY_WIDTH = equalColumnWidth;
// const UNIT_PRICE_WIDTH = equalColumnWidth;
// const TOTAL_WIDTH = equalColumnWidth;

// // Column positions
// const DESC_X = margin;
// const QTY_X = DESC_X + DESC_WIDTH;
// const UNIT_PRICE_X = QTY_X + QTY_WIDTH;
// const TOTAL_X = UNIT_PRICE_X + UNIT_PRICE_WIDTH;

// // Vertical line positions
// const LINE1 = DESC_X + DESC_WIDTH;
// const LINE2 = QTY_X + QTY_WIDTH;
// const LINE3 = UNIT_PRICE_X + UNIT_PRICE_WIDTH;

// const drawTableFrame = (startY, pageNum, pageItems) => {
//   const headerBgColor = [21, 128, 61];

//   // Draw header background
//   doc.setFillColor(...headerBgColor);
//   doc.rect(margin + 0.2, startY + 0.2, pageWidth - 2 * margin - 0.4, HEADER_ROW_HEIGHT - 0.4, "F");

//   // Header top border
//   doc.line(margin, startY, pageWidth - margin, startY);

//   // Header text
//   const textY = startY + HEADER_ROW_HEIGHT / 2 + 1;
//   doc.setFontSize(9);
//   doc.setFont(undefined, "bold");
  
//   // Calculate center positions for equal columns
//   const descCenter = DESC_X + DESC_WIDTH / 2;
//   const qtyCenter = QTY_X + QTY_WIDTH / 2;
//   const unitPriceCenter = UNIT_PRICE_X + UNIT_PRICE_WIDTH / 2;
//   const totalCenter = TOTAL_X + TOTAL_WIDTH / 2;
  
//   doc.text("Descriptif des travaux", descCenter, textY, { align: "center" });
//   doc.text("QTÉ", qtyCenter, textY, { align: "center" });
//   doc.text("Prix u. HT", unitPriceCenter, textY, { align: "center" });
//   doc.text("Total HT", totalCenter, textY, { align: "center" });
//   doc.setFont(undefined, "normal");

//   // Horizontal lines
//   const yPos = startY + HEADER_ROW_HEIGHT + BODY_ROW_HEIGHT;
//   doc.line(margin, startY + HEADER_ROW_HEIGHT, pageWidth - margin, startY + HEADER_ROW_HEIGHT); // header bottom
//   doc.line(margin, yPos, pageWidth - margin, yPos); // row bottom
  


//   // Vertical lines
//   const tableBottom = startY + HEADER_ROW_HEIGHT + ROWS_PER_PAGE * BODY_ROW_HEIGHT;
//   doc.line(margin, startY, margin, tableBottom);
//   doc.line(LINE1, startY, LINE1, tableBottom);
//   doc.line(LINE2, startY, LINE2, tableBottom);
//   doc.line(LINE3, startY, LINE3, tableBottom);
//   doc.line(pageWidth - margin, startY, pageWidth - margin, tableBottom);

// }
//     const tableStartY2 = isAcompteInvoice ? 75 : 73;
//     drawTableFrame(tableStartY2);
  
//     // === TVA Recap Section ===
//     let recapY = tableStartY2 + 150;
  
//     doc.setFontSize(12);
//     doc.setFont(undefined, "bold");
//     doc.text("Détail TVA", margin, recapY);
  
//     doc.setFontSize(10);
//     doc.setFont(undefined, "normal");
//     recapY += 10;
  
//     const col1X = margin;
//     const col2X = margin + 40;
//     const col3X = margin + 80;
  
//     // TVA details from current installment
//     const amountHT = currentInstallment ? currentInstallment.amount / 1.2 : 0;
//     const tvaAmount = currentInstallment ? currentInstallment.amount * 0.2 / 1.2 : 0;
//     const amountTTC = currentInstallment ? currentInstallment.amount : 0;
  
//     doc.setFont(undefined, "bold");
//     doc.text("Taux:", col1X, recapY);
//     doc.setFont(undefined, "normal");
//     doc.text("5.5%", col1X, recapY + 6);
  
//     doc.setFont(undefined, "bold");
//     doc.text("Montant TVA:", col2X, recapY);
//     doc.setFont(undefined, "normal");
//     doc.text(`${tvaAmount.toFixed(2)} €`, col2X, recapY + 6);
  
//     doc.setFont(undefined, "bold");
//     doc.text("Base HT:", col3X, recapY);
//     doc.setFont(undefined, "normal");
//     doc.text(`${amountHT.toFixed(2)} €`, col3X, recapY + 6);
  
//     // Recap box
//     const recapBoxX = pageWidth - 80;
//     let recapBoxY = recapY - 16;
  
//     doc.setFillColor(200);
//     doc.rect(recapBoxX - 5, recapBoxY, 80, 35, "F");
  
//     doc.setFont(undefined, "bold");
//     doc.setFontSize(12);
//     doc.text("Récapitulatif", recapBoxX, recapBoxY + 5);
  
//     doc.setFontSize(11);
//     recapBoxY += 16;
//     doc.text("Total HT:", recapBoxX, recapBoxY);
//     doc.text(`${amountHT.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });
  
//     recapBoxY += 8;
//     doc.text("Total TVA:", recapBoxX, recapBoxY);
//     doc.text(`${tvaAmount.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });
  
//     recapBoxY += 8;
//     doc.text("Total TTC:", recapBoxX, recapBoxY);
//     doc.text(`${amountTTC.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });
  
//     // Billing plan summary
//     // if (installments.length > 0) {
//     //   const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
//     //   recapY += 12;
//     //   doc.text(`Total du projet: ${totalAmount.toFixed(2)} €`, margin, recapY + 6);
//     //   doc.text(`Montant de cette facture: ${amountTTC.toFixed(2)} € (${currentInstallment?.percentage || 0}%)`, margin, recapY + 12);
      
//     // }
  
//     // Signature section
//     // recapY += 30;
//     // doc.text('Date et signature précédée de la mention :', margin, recapY);
//     // recapY += 6;
//     // doc.text('"Bon pour accord"', margin, recapY);

//     doc.setPage(2);
//     addFooter(2);
  
//     return doc;
//   };
const generateInvoicePdf = (invoice, command) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginTop = 10;
  const marginLeft = 5;
  const margin = 8;
  
  const addFooter = (pageNum) => {
    const footerY = pageHeight - 5; 
    const leftText = "Global Green - SAS au capital social de 5000 €";
    const centerText = "N°SIREN 94305436100010 - RCS Blois";
    const rightText = "N° de TVA FR41492502992";

    doc.setFontSize(9);
    doc.setFont(undefined, "normal");

    // Left-aligned
    doc.text(leftText, margin, footerY);

    // Centered
    doc.text(centerText, pageWidth / 2, footerY, { align: "center" });

    // Right-aligned
    doc.text(rightText, pageWidth - margin, footerY, { align: "right" });
  };

  const logoWidth = 40;
  const logoHeight = 40;
  const logoleftwidth = 40;
  const logoleftheight = 40;

  // Get billing plan data from command
  const billingPlan = command.billingPlan;
  const installments = billingPlan?.installments || [];

  // Find the correct installment for this invoice
  const currentInstallment = installments.find(inst => 
      Math.abs(inst.amount - invoice.amount) < 0.01
  ) || installments[0];
  
  const isAcompteInvoice = currentInstallment?.description?.toLowerCase().includes('acompte') || false;

  // Use the actual invoice number from the data
  const invoiceNumber = invoice.invoiceNumber || command.numCommand || "F218235";

  // === Page 1 ===

  // Add logos - left logo only
  doc.addImage(
    logo,
    "JPEG",
    marginLeft,
    marginTop, 
    logoleftwidth,
    logoleftheight
  );

  // Company info on the right side
  doc.setFontSize(10);
  const rightStartX = pageWidth - 50;

  // "Entreprise:" in bold
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Entreprise:", rightStartX, 15);

  // The rest in regular Helvetica
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 128, 0); 
  doc.text("GLOBAL GREEN", rightStartX, 21);

  doc.setFont(undefined, "Helvetica");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("641 AVENUE DU GRAIN D'OR", rightStartX, 27);
  doc.text("41350 VINEUIL - France", rightStartX, 32);
  doc.text("Contact@global-green.fr", rightStartX, 37);
  doc.text("07 64 71 26 87", rightStartX, 42);

  // Center logo
  doc.addImage(
    logorge,
    "JPEG",
    pageWidth/2 - logoWidth/2,
    marginLeft,
    logoWidth,
    logoHeight,
    marginTop, 
  );

  doc.setFont(undefined, "Helvetica");
  doc.setFontSize(11);

  // Configuration
  const LINE_SPACING = 6;
  const SECTION_SPACING = 0.1;

  // Invoice header
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  const invoiceY = 60;

  // Determine invoice title based on current installment
  let invoiceTitle = "Facture";
  if (currentInstallment) {
      if (isAcompteInvoice) {
          invoiceTitle = "Facture - Acompte";
      } else if (installments.length > 1) {
          invoiceTitle = "Facture - Intermediaire";
      }
  }

  doc.text(invoiceTitle, margin, invoiceY);

  // Left info under "Facture"
  const emissionMoment = moment(invoice.issueDate || new Date());
  const dueMoment = moment(invoice.dueDate || emissionMoment.clone().add(1, "month"));

  const leftTexts = [
    `Numéro                               ${invoiceNumber}`,
    `Date d'émission:                 ${emissionMoment.format("DD/MM/YYYY")}`,
    `Date d'expiration:               ${dueMoment.format("DD/MM/YYYY")}`,
    `Type de vente:                    Prestation de service`,
  ];

  // Add special note for acompte invoices
  if (isAcompteInvoice) {
    leftTexts.push(`Type facture:                      Acompte`);
  }

  // Client information on the right
  doc.setFontSize(11);
  doc.setFont(undefined, "Helvetica");
  doc.setTextColor(0, 0, 0);
  const rightTexts = [
    `${command.nom || ""}`,
    `${command.address || ""}`,
    `${command.ville || ""},  ${command.codepostal || ""}`,
    `${command.email || ""}`,
  ];

  const maxRightWidth = Math.max(
    ...rightTexts.map(
      (t) =>
        (doc.getStringUnitWidth(t) * doc.internal.getFontSize()) /
        doc.internal.scaleFactor
    )
  );

  // Right-side starting X
  const rightStartXd = pageWidth - margin - maxRightWidth - 4;

  // Starting Y position
  let currentRightYy = 58;

  // "Client ou cliente:" in bold
  doc.setFont(undefined, "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Client ou Cliente:", rightStartXd, currentRightYy);

  // Client name in bold and green
  currentRightYy += LINE_SPACING;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 128, 0); 
  doc.text(`${command.nom || ""}`, rightStartXd, currentRightYy);

  // Rest of client details
  const otherRightTexts = [
    `${command.address || ""}`,
    `${command.ville || ""}   ${command.codepostal || ""}`,
    `${command.email || ""}`,
  ];

  doc.setFont(undefined, "Helvetica");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  currentRightYy += LINE_SPACING;
  otherRightTexts.forEach((text, index) => {
    doc.text(text, rightStartXd, currentRightYy);
    currentRightYy +=
      LINE_SPACING + (index < otherRightTexts.length - 1 ? SECTION_SPACING : 0);
  });

  // Left side information
  let currentLeftY = 60;
  leftTexts.forEach((text, index) => {
    doc.text(text, margin, currentLeftY + 6);
    currentLeftY +=
      LINE_SPACING + (index < leftTexts.length - 1 ? SECTION_SPACING : 0);
  });

  // Invoice description
  doc.setFontSize(10);
  const currentTextColors = doc.getTextColor();
  doc.setFont(undefined, "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const prestationsYStart = 100; // Y position of the first line
  const lineSpacing = 6; // space between lines

  doc.setFontSize(11);
  // Line 1: Nature des prestations
  doc.text(
    `Nature des prestations:`,
    margin,
    prestationsYStart
  );
  doc.setFont(undefined, "Helvetica");
  // Line 3: Installation description
  doc.text(
    `Installation et raccordement d'une pompe à chaleur AIR/EAU`,
    margin,
    prestationsYStart + lineSpacing,
  );

  // Line 4: Nota
  doc.text(
    `Note: Fourniture des radiateurs par le client.`,
    margin,
    prestationsYStart + lineSpacing * 2
  );

  // Prepare table data
  const tableData = [];
  if (command.items && command.items.length > 0) {
    command.items.forEach((item) => {
      tableData.push({
        title: item.title || "N/A",
        reference: item.reference || "",
        description: item.description || "",
        quantity: item.quantite || 1,
        unitPrice: item.prixUnitaire || 0,
        total: item.montantTTC || item.prixUnitaire * item.quantite * (1 + (item.tva || 0) / 100),
      });
    });
  } else {
    tableData.push({
      title: command.title || "N/A",
      reference: command.reference || "",
      description: command.description || "",
      quantity: command.quantite || 1,
      unitPrice: command.prixUnitaire || command.totalHT / (command.quantite || 1),
      total: command.totalTTC || 0,
    });
  }

  // Dynamic page count based on number of products
  const totalPages = tableData.length > 2 ? '2' : '1';
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, "Helvetica");
  doc.setFontSize(10);
  doc.text(`Page(s): 1 sur ${totalPages}`, pageWidth - margin, prestationsYStart + 10, { align: "right" });

  doc.setTextColor(currentTextColors);

  // Table configuration - EQUAL COLUMN WIDTHS
  const descWidth = 110; // slightly narrower description
  const availableWidth = pageWidth - 2 * margin - descWidth;
  const equalColumnWidth = availableWidth / 3; // Divide remaining space equally

  const qteWidth = equalColumnWidth;
  const prixWidth = equalColumnWidth;
  const ttcWidth = equalColumnWidth;

  const descX = margin;
  const qteX = descX + descWidth;
  const prixX = qteX + qteWidth;
  const ttcX = prixX + prixWidth;

  const line1 = descX + descWidth;
  const line2 = line1 + qteWidth;
  const line3 = line2 + prixWidth;

  // Header parameters (adjust Y position for acompte)
  const headerY = isAcompteInvoice ? 118 : 115;
  const headerHeight = 8;
  const textY = headerY + 5;
  const firstLineY = headerY + headerHeight;

  // Draw header background
  doc.setFillColor(21, 128, 61); 
  doc.rect(
    margin + 0.2,
    headerY + 0.2,
    pageWidth - 2 * margin - 0.4,
    headerHeight - 0.4,
    "F"
  );

  doc.line(margin, headerY, pageWidth - margin, headerY);

  // Table headers
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);

  const descCenter = descX + descWidth / 2;
  const qteCenter = qteX + qteWidth / 2;
  const prixCenter = prixX + prixWidth / 2;
  const ttcCenter = ttcX + ttcWidth / 2;

  const tableTitle = isAcompteInvoice ? 
    "Descriptif de l'acompte" : 
    "Descriptif de la facture";
    
  doc.text(tableTitle, descCenter, textY, {
    align: "center",
  });
  doc.text("QTÉ", qteCenter, textY, { align: "center" });
  doc.text("Prix u. HT", prixCenter, textY, { align: "center" });
  doc.text("Total HT", ttcCenter, textY, { align: "center" });

  doc.setFont(undefined, "normal");

  // === NEW: Calculate which products go on page 1 vs page 2 ===
  const maxProductsPage1 = 2; // Maximum 2 products on page 1
  const productsPage1 = tableData.slice(0, maxProductsPage1);
  const productsPage2 = tableData.slice(maxProductsPage1);

  // === PAGE 1 TABLE CONTENT ===
  let currentRowY = firstLineY + 8;
  
  productsPage1.forEach((row, index) => {
    const titleFontSize = 10;
    const refFontSize = 10;
    const descFontSize = 9;
    const titleRefSpacing = 0.5;
    const refDescSpacing = 0.5;
    const descLineSpacing = 0.3;

    const descLines = doc.splitTextToSize(row.description, descWidth - 15);
    const totalHeight = titleFontSize + titleRefSpacing + refFontSize + refDescSpacing + descLines.length * (descFontSize + descLineSpacing);

    let lineY = currentRowY;

    // Title
    doc.setFontSize(titleFontSize);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(row.title, descX + 5, lineY);
    lineY += titleFontSize;

    // Reference
    doc.setFontSize(refFontSize);
    doc.setFont(undefined, "italic");
    doc.setTextColor(0, 0, 0);
    doc.text(`Réf: ${row.reference}`, descX + 5, lineY);
    lineY += refFontSize;

    // Description with bullets
    doc.setFontSize(descFontSize);
    doc.setFont(undefined, "normal");
    doc.setTextColor(0, 0, 0);
    const rawDescLines = row.description.split("\n");

    rawDescLines.forEach((rawLine) => {
      const lineWithBullet = `• ${rawLine}`;
      const wrappedLines = doc.splitTextToSize(lineWithBullet, descWidth - 15);
      wrappedLines.forEach((line) => {
        doc.text(line, descX + 4, lineY);
        lineY += descFontSize + descLineSpacing;
      });
    });

    // Numeric columns
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(row.quantity.toString(), qteX + qteWidth / 2, currentRowY, { align: "center" });
    doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth / 2, currentRowY, { align: "center" });
    doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth / 2, currentRowY, { align: "center" });

    currentRowY += totalHeight + 2;

    // Add horizontal line between products (except after last product on page)
    if (index < productsPage1.length - 1) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin + 5, currentRowY - 6, pageWidth - margin - 5, currentRowY - 6);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
    }
  });

  // Draw table frame for page 1
  const tableEndY = pageHeight - 20;
  doc.line(margin, headerY, margin, tableEndY);
  doc.line(line1, headerY, line1, tableEndY);
  doc.line(line2, headerY, line2, tableEndY);
  doc.line(line3, headerY, line3, tableEndY);
  doc.line(pageWidth - margin, headerY, pageWidth - margin, tableEndY);
  
  // ADDED: Bottom horizontal line to close the table
  doc.line(margin, tableEndY, pageWidth - margin, tableEndY);

  // Subtotal for page 1 (only products on this page)
  const subtotalPage1 = productsPage1.reduce((acc, row) => acc + row.total, 0);
  const sousTotalY = tableEndY - 4;

  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Sous-Total", descX + 5, sousTotalY);
  doc.text(`${subtotalPage1.toFixed(2)} €`, ttcX + ttcWidth / 2, sousTotalY, { align: "center" });

  doc.setDrawColor(0, 0, 0);
  doc.line(margin, sousTotalY - 8, pageWidth - margin, sousTotalY - 8);

  doc.setPage(1);
  addFooter(1);

  // === PAGE 2 (only if there are products for page 2) ===
  if (productsPage2.length > 0) {
    doc.addPage();

    const marginTopp = 10;
    const marginLeftp = 5;
    const logoWidthp = 40;
    const logoHeightp = 40;

    // Left logo
    doc.addImage(logo, "JPEG", marginLeftp, marginTopp, 40, 40);

    // Center logo
    doc.addImage(logorge, "JPEG", (pageWidth - logoWidthp) / 2, marginTopp, logoWidthp, logoHeightp);

    // Page number
    doc.setFontSize(10);
    doc.text(`Page(s): 2 sur 2`, pageWidth - 30, marginTopp + 60);

    // Billing plan information
    if (installments.length > 0) {
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text("Plan de facturation complet:", margin, marginTopp + 55);
      
      let installmentY = marginTopp + 60;
      
      installments.forEach((installment, index) => {
        const isCurrent = installment === currentInstallment;
        doc.setFont(undefined, isCurrent ? "bold" : "normal");
        
        doc.text(
          `${installment.description}: ${installment.percentage}% - ${installment.amount.toFixed(2)} € TTC - ${moment(installment.dueDate).format('DD/MM/YYYY')}`,
          margin + 5,
          installmentY
        );
        installmentY += 4;
      });
      
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "normal");
    }

    // Table header for page 2
    const page2HeaderY = 80;
    const page2HeaderHeight = 8;
    const page2TextY = page2HeaderY + 5;
    const page2FirstLineY = page2HeaderY + page2HeaderHeight;

    // Draw header background
    doc.setFillColor(21, 128, 61);
    doc.rect(margin + 0.2, page2HeaderY + 0.2, pageWidth - 2 * margin - 0.4, page2HeaderHeight - 0.4, "F");
    doc.line(margin, page2HeaderY, pageWidth - margin, page2HeaderY);

    // Table headers
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Descriptif des travaux (suite)", descCenter, page2TextY, { align: "center" });
    doc.text("QTÉ", qteCenter, page2TextY, { align: "center" });
    doc.text("Prix u. HT", prixCenter, page2TextY, { align: "center" });
    doc.text("Total HT", ttcCenter, page2TextY, { align: "center" });

    doc.setFont(undefined, "normal");

    // === PAGE 2 TABLE CONTENT ===
    let page2CurrentRowY = page2FirstLineY + 8;

    productsPage2.forEach((row, index) => {
      const titleFontSize = 10;
      const refFontSize = 10;
      const descFontSize = 9;
      const titleRefSpacing = 0.5;
      const refDescSpacing = 0.5;
      const descLineSpacing = 0.3;

      const descLines = doc.splitTextToSize(row.description, descWidth - 15);
      const totalHeight = titleFontSize + titleRefSpacing + refFontSize + refDescSpacing + descLines.length * (descFontSize + descLineSpacing);

      let lineY = page2CurrentRowY;

      // Title
      doc.setFontSize(titleFontSize);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(row.title, descX + 5, lineY);
      lineY += titleFontSize;

      // Reference
      doc.setFontSize(refFontSize);
      doc.setFont(undefined, "italic");
      doc.setTextColor(0, 0, 0);
      doc.text(`Réf: ${row.reference}`, descX + 5, lineY);
      lineY += refFontSize;

      // Description with bullets
      doc.setFontSize(descFontSize);
      doc.setFont(undefined, "normal");
      doc.setTextColor(0, 0, 0);
      const rawDescLines = row.description.split("\n");

      rawDescLines.forEach((rawLine) => {
        const lineWithBullet = `• ${rawLine}`;
        const wrappedLines = doc.splitTextToSize(lineWithBullet, descWidth - 15);
        wrappedLines.forEach((line) => {
          doc.text(line, descX + 4, lineY);
          lineY += descFontSize + descLineSpacing;
        });
      });

      // Numeric columns
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(row.quantity.toString(), qteX + qteWidth / 2, page2CurrentRowY, { align: "center" });
      doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth / 2, page2CurrentRowY, { align: "center" });
      doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth / 2, page2CurrentRowY, { align: "center" });

      page2CurrentRowY += totalHeight + 2;

      // Add horizontal line between products
      if (index < productsPage2.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin + 5, page2CurrentRowY - 2, pageWidth - margin - 5, page2CurrentRowY - 2);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
      }
    });

    // DECREASED HEIGHT: Changed table height for page 2
    const page2TableEndY = pageHeight - 100;
    
    // Draw table frame for page 2
    doc.line(margin, page2HeaderY, margin, page2TableEndY);
    doc.line(line1, page2HeaderY, line1, page2TableEndY);
    doc.line(line2, page2HeaderY, line2, page2TableEndY);
    doc.line(line3, page2HeaderY, line3, page2TableEndY);
    doc.line(pageWidth - margin, page2HeaderY, pageWidth - margin, page2TableEndY);
    
    // ADDED: Bottom horizontal line to close the table on page 2
    doc.line(margin, page2TableEndY, pageWidth - margin, page2TableEndY);


    // === TVA Recap Section ===
    // ADJUSTED: Moved TVA section higher up due to decreased table height
    let recapY = page2TableEndY + 30;

    // TVA details from current installment
    const amountHT = currentInstallment ? currentInstallment.amount / 1.2 : 0;
    const tvaAmount = currentInstallment ? currentInstallment.amount * 0.2 / 1.2 : 0;
    const amountTTC = currentInstallment ? currentInstallment.amount : 0;

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Détail TVA", margin, recapY);

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    recapY += 10;

    const col1X = margin;
    const col2X = margin + 40;
    const col3X = margin + 80;

    doc.setFont(undefined, "bold");
    doc.text("Taux:", col1X, recapY);
    doc.setFont(undefined, "normal");
    doc.text("5.5%", col1X, recapY + 6);

    doc.setFont(undefined, "bold");
    doc.text("Montant TVA:", col2X, recapY);
    doc.setFont(undefined, "normal");
    doc.text(`${tvaAmount.toFixed(2)} €`, col2X, recapY + 6);

    doc.setFont(undefined, "bold");
    doc.text("Base HT:", col3X, recapY);
    doc.setFont(undefined, "normal");
    doc.text(`${amountHT.toFixed(2)} €`, col3X, recapY + 6);

    // Recap box
    const recapBoxX = pageWidth - 80;
    let recapBoxY = recapY - 16;

    doc.setFillColor(200);
    doc.rect(recapBoxX - 5, recapBoxY, 80, 35, "F");

    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text("Récapitulatif", recapBoxX, recapBoxY + 5);

    doc.setFontSize(11);
    recapBoxY += 16;
    doc.text("Total HT:", recapBoxX, recapBoxY);
    doc.text(`${amountHT.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });

    recapBoxY += 8;
    doc.text("Total TVA:", recapBoxX, recapBoxY);
    doc.text(`${tvaAmount.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });

    recapBoxY += 8;
    doc.text("Total TTC:", recapBoxX, recapBoxY);
    doc.text(`${amountTTC.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });

    doc.setPage(2);
    addFooter(2);
  }

  return doc;
};

  const handleSendInvoiceEmail = async (invoice, command, e) => {
    e.stopPropagation();
    setSendingInvoice(true);
  
    try {
      // Generate the PDF - use consolidated invoice if payment is 100%
      let doc;
      let invoiceToUse = invoice;
      
      if (paymentInfo.paymentStatus === "paid") {
        doc = generateConsolidatedInvoicePdf(invoices, command);
        // Create a mock invoice object for the consolidated invoice
        invoiceToUse = {
          _id: "consolidated",
          invoiceNumber: `F${Math.floor(100000 + Math.random() * 900000)}`,
          amount: paymentInfo.paidAmount,
          issueDate: new Date(),
          dueDate: new Date(),
          status: "payée",
          percentage: 100
        };
      } else {
        doc = generateInvoicePdf(invoice, command);
      }
      
      const pdfBase64 = doc.output("datauristring");
  
      // Send email with the invoice PDF - ADD factureId HERE
      await axios.post(`/invoice/${invoiceToUse._id}/send-email`, {
        factureId: invoice._id, // Add this line - send the actual invoice ID
        email: command.email,
        
        societe: command.societe,
        pdf: pdfBase64,
        commandNum: command.numCommand,
        phone: command.phone,
        societeName: command.raissociale, // Changed from nom_societé to raissociale
        montantTTC: invoiceToUse.amount,
        description: command.description,
        code: invoiceToUse.invoiceNumber,
        montantHT: (invoiceToUse.amountHT || invoiceToUse.amount / 1.1).toFixed(2),
        clientName: command.nom,
        date: invoiceToUse.dueDate,
      });
  
      // Update invoice status to "envoyée" if not consolidated
      if (invoiceToUse._id !== "consolidated") {
        const response = await axios.put(`/invoice/${invoice._id}/status`, {
          status: "envoyée",
        });
  
        // Update the specific invoice in local state immediately
        setInvoices((prevInvoices) =>
          prevInvoices.map((inv) =>
            inv._id === invoice._id ? response.data : inv
          )
        );
  
        // If this is the selected invoice, update that too
        if (selectedInvoice && selectedInvoice._id === invoice._id) {
          setSelectedInvoice(response.data);
        }
      }
  
      message.success("Facture envoyée avec succès par email !");
  
      // Also refresh the full list in background
      fetchInvoices();
  
      if (onUpdateCommand) {
        onUpdateCommand();
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de la facture :", error);
      message.error("Échec de l'envoi de la facture.");
    } finally {
      setSendingInvoice(false);
    }
  };
  const handleSendConsolidatedInvoiceEmail = async (command, e) => {
    e.stopPropagation();
    setSendingInvoice(true);
  
    try {
      const doc = generateConsolidatedInvoicePdf(invoices, command);
      const pdfBase64 = doc.output("datauristring");
  
      // Use the correct endpoint with proper parameters
      await axios.post(`/invoice/consolidated/send-email`, {
        email: command.email,
        pdf: pdfBase64,
        commandNum: command.numCommand,
        phone: command.phone,
        societeName: command.raissociale,
        montantTTC: paymentInfo.paidAmount,
        description: command.description,
        code: command.numCommand,
        montantHT: (paymentInfo.paidAmount / 1.2).toFixed(2),
        clientName: command.nom,
        date: new Date()
      });
  
      message.success("Facture de solde envoyée avec succès par email !");
      fetchInvoices();
      if (onUpdateCommand) onUpdateCommand();
    } catch (error) {
      console.error("Erreur lors de l'envoi de la facture de solde :", error);
      message.error("Échec de l'envoi de la facture de solde.");
    } finally {
      setSendingInvoice(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      await axios.put(`/invoice/${invoiceId}/status`, { status: newStatus });
      message.success("Statut mis à jour avec succès");
      fetchInvoices();

      if (onUpdateCommand) {
        onUpdateCommand();
      }
    } catch (error) {
      message.error("Erreur lors de la mise à jour du statut");
    }
  };

  const recordPayment = async (values) => {
    setProcessingPayment(true);
    try {
      const response = await axios.post(
        `/invoice/${selectedInvoice._id}/payment`,
        values
      );

      // Update both invoices list and selected invoice immediately
      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) =>
          invoice._id === selectedInvoice._id ? response.data.invoice : invoice
        )
      );

      // Update selected invoice if it's the same
      if (selectedInvoice) {
        setSelectedInvoice(response.data.invoice);
      }

      setPaymentModalVisible(false);
      paymentForm.resetFields();
      message.success("Paiement enregistré avec succès");

      // Refresh all data in background
      fetchInvoices();

      if (onUpdateCommand) {
        onUpdateCommand();
      }
    } catch (error) {
      message.error("Erreur lors de l'enregistrement du paiement");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Add this useEffect to handle modal updates when invoices change
  useEffect(() => {
    if (selectedInvoice) {
      // Find the updated invoice in the invoices array
      const updatedInvoice = invoices.find(
        (inv) => inv._id === selectedInvoice._id
      );
      if (updatedInvoice) {
        setSelectedInvoice(updatedInvoice);
      }
    }
  }, [invoices]);
  const sendReminder = async (invoiceId, reminderType) => {
    try {
      await axios.post(`/invoice/${invoiceId}/send-reminder`, { reminderType });
      message.success("Rappel envoyé avec succès");
      fetchInvoices();
    } catch (error) {
      message.error("Erreur lors de l'envoi du rappel");
    }
  };

  const handlePaymentModalOpen = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentModalVisible(true);
    paymentForm.setFieldsValue({
      amount: invoice.amount,
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "0.00 €"; // or "" if you prefer empty
    }
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `${num.toFixed(2)} €`;
  };
  

  const calculatePaymentStatus = () => {
    if (!invoices || invoices.length === 0) {
      return {
        paidAmount: 0,
        remainingAmount: command.totalTTC,
        paymentStatus: "unpaid",
      };
    }

    const totalPaid = invoices.reduce((sum, invoice) => {
      if (invoice.payments && invoice.payments.length > 0) {
        const invoicePaid = invoice.payments.reduce(
          (invoiceSum, payment) => invoiceSum + payment.amount,
          0
        );
        return sum + invoicePaid;
      }
      return sum;
    }, 0);

    // Fix floating-point precision issues
    const preciseTotalPaid = parseFloat(totalPaid.toFixed(2));
    const preciseTotalTTC = parseFloat(command.totalTTC.toFixed(2));
    const remaining = parseFloat(
      (preciseTotalTTC - preciseTotalPaid).toFixed(2)
    );

    let paymentStatus = "unpaid";

    // Use a small epsilon for comparison to handle floating-point errors
    if (Math.abs(remaining) < 0.01) {
      // Consider amounts less than 1 cent as paid
      paymentStatus = "paid";
    } else if (preciseTotalPaid > 0) {
      paymentStatus = "partial";
    }

    return {
      paidAmount: preciseTotalPaid,
      remainingAmount: Math.max(0, remaining), // Ensure no negative values
      paymentStatus: paymentStatus,
    };
  };
  const getWorkflowStep = () => {
    if (!invoices || invoices.length === 0) return 0;

    const sortedInvoices = [...invoices].sort(
      (a, b) => a.billingPlanIndex - b.billingPlanIndex
    );

    for (let i = 0; i < sortedInvoices.length; i++) {
      const invoice = sortedInvoices[i];
      if (invoice.status === "brouillon" || invoice.status === "émise")
        return i;
      if (invoice.status !== "payée") return i;
    }

    return sortedInvoices.length;
  };

  const currentStep = getWorkflowStep();
  const hasWorkflowStarted = invoices && invoices.length > 0;
  const isWorkflowCompleted =
    invoices &&
    invoices.length > 0 &&
    invoices.every((invoice) => invoice.status === "payée");

  const paymentInfo = calculatePaymentStatus();
  // const currentStep = getWorkflowStep();

  const isInvoiceActionable = (invoice, index) => {
    return currentStep >= index;
  };

  const columns = [
    {
      title: "Facture",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
    },
    {
      title: "Montant",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => formatCurrency(amount),
    },
    {
      title: "Pourcentage",
      dataIndex: "percentage",
      key: "percentage",
      render: (percentage) => (percentage ? `${percentage}%` : "-"),
    },
    {
      title: "Date Émission",
      dataIndex: "issueDate",
      key: "issueDate",
      render: (date) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: "Date Échéance",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status, record, index) => {
        const colorMap = {
          brouillon: "default",
          émise: "blue",
          envoyée: "geekblue",
          payée: "green",
          en_retard: "red",
          avoir: "orange",
        };

        const isActionable = isInvoiceActionable(record, index);

        return (
          <Select
            value={status}
            style={{ width: 120 }}
            onChange={(value) => updateInvoiceStatus(record._id, value)}
            disabled={!isActionable}
          >
            <Option value="brouillon">Brouillon</Option>
            <Option value="émise">Émise</Option>
            <Option value="envoyée">Envoyée</Option>
            <Option value="payée">Payée</Option>
            <Option value="en_retard">En retard</Option>
            <Option value="avoir">Avoir</Option>
          </Select>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record, index) => {
        const isActionable = isInvoiceActionable(record, index);

        return (
          <Space>
            <Button
              icon={<EyeOutlined />}
              onClick={() => setSelectedInvoice(record)}
            >
              Détails
            </Button>
            {/* <Button 
          icon={<FilePdfOutlined />}
          onClick={() => {
            const doc = generateInvoicePdf(record, command);
            doc.save(`Facture-Global-Green.pdf`);
          }}
        >
          PDF
        </Button> */}
<Button 
    icon={<FilePdfOutlined />}
    onClick={() => {
        const doc = generateInvoicePdf(record, command);
        const percentage = record.percentage ? `-${record.percentage}%` : '';
        const invoiceType = record.percentage === 30 ? "Acompte" : "Intermediaire";
        
        doc.save(`${invoiceType}-${record.invoiceNumber}${percentage}.pdf`);
    }}
>
    PDF
</Button>
            {record.status === "brouillon" && isActionable && (
              <Tooltip title="Envoyer cette facture au client">
                <Button
                  icon={<SendOutlined />}
                  onClick={(e) => handleSendInvoiceEmail(record, command, e)}
                  loading={sendingInvoice}
                >
                  Envoyer
                </Button>
              </Tooltip>
            )}

            {/* Show payment button only for invoices that have been sent (envoyée) and are not paid */}
            {record.status === "envoyée" && isActionable && (
              <Button
                icon={<CheckOutlined />}
                onClick={() => handlePaymentModalOpen(record)}
              >
                Paiement
              </Button>
            )}

            {/* Also show payment button for other non-paid statuses except brouillon */}
            {(record.status === "émise" || record.status === "en_retard") &&
              isActionable && (
                <Button
                  icon={<CheckOutlined />}
                  onClick={() => handlePaymentModalOpen(record)}
                >
                  Paiement
                </Button>
              )}

            {record.status === "en_retard" && isActionable && (
              <Button onClick={() => sendReminder(record._id, "first")}>
                Relancer
              </Button>
            )}

            {!isActionable && (
              <Tooltip title="Cette facture ne peut pas être modifiée tant que les factures précédentes ne sont pas payées">
                <Button icon={<LockOutlined />} disabled>
                  Verrouillé
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h3>Gestion des Factures</h3>
        <Space>
          {paymentInfo.paymentStatus === "paid" && (
            <>
     
              {/* <Button
  icon={<SendOutlined />}
  onClick={(e) => {
    const invoiceToSend = invoices[0];
    if (invoiceToSend) {
      handleSendInvoiceEmail(invoiceToSend, command, e);
    }
  }}
  loading={sendingInvoice}
>
  Envoyer Facture (100% solde)
</Button> */}

<Button
  icon={<SendOutlined />}
  onClick={(e) => handleSendConsolidatedInvoiceEmail(command, e)}
  loading={sendingInvoice}
>
  Envoyer Facture (100% solde)
</Button>      
<Button 
    icon={<FilePdfOutlined />}
    onClick={() => {
        if (invoices.length > 0) {
            const doc = generateConsolidatedInvoicePdf(invoices, command);
            doc.save(`Facture-Solde-${command.numCommand || 'SOLDE'}.pdf`);
        }
    }}
>
    Télécharger Facture de Solde
</Button>
            </>
          )}
          <Button
            type="primary"
            onClick={createInvoices}
            loading={creatingInvoices}
          >
            Créer Factures
          </Button>
          <Button icon={<ReloadOutlined />} onClick={forceRefresh}>
            Actualiser
          </Button>
        </Space>
      </div>

      {command.billingPlan && (
        <Card
          title="Plan de Facturation"
          size="small"
          style={{ marginBottom: 16 }}
        >
          {command.billingPlan.installments.map((inst, index) => (
            <div key={index} style={{ marginBottom: 8 }}>
              <strong>{inst.description}:</strong> {inst.percentage}% (
              {formatCurrency(inst.amount)}) - Échéance:{" "}
              {moment(inst.dueDate).format("DD/MM/YYYY")}
            </div>
          ))}
        </Card>
      )}

      {/* Workflow Progress */}
      {invoices.length > 0 && (
        <Card
          title="Progression du Workflow"
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Steps current={currentStep}>
            {invoices.map((invoice, index) => (
              <Step
                key={index}
                title={`Facture ${index + 1}`}
                description={`${invoice.percentage}% - ${invoice.status}`}
              />
            ))}
          </Steps>

          {currentStep < invoices.length && (
            <Alert
              message={`Étape en cours: ${
                invoices[currentStep].description ||
                `Facture ${currentStep + 1}`
              }`}
              description={`Veuillez traiter la facture de ${invoices[currentStep].percentage}% avant de passer à la suivante.`}
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      )}

      <Card
        title="Suivi des Paiements"
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Space className="w-full justify-between">
          <Statistic
            title="Total TTC"
            value={command.totalTTC}
            formatter={(value) => formatCurrency(value)}
          />
          <Statistic
            title="Payé"
            value={paymentInfo.paidAmount}
            formatter={(value) => formatCurrency(value)}
          />
          <Statistic
            title="Reste à Payer"
            value={paymentInfo.remainingAmount}
            formatter={(value) => formatCurrency(value)}
          />
          <Tag
            color={
              paymentInfo.paymentStatus === "paid"
                ? "green"
                : paymentInfo.paymentStatus === "partial"
                ? "orange"
                : "red"
            }
          >
            {paymentInfo.paymentStatus === "paid"
              ? "Payé"
              : paymentInfo.paymentStatus === "partial"
              ? "Partiel"
              : "Impayé"}
          </Tag>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={invoices.map((inv, index) => ({ ...inv, index }))}
        loading={loading}
        rowKey="_id"
        pagination={false}
        scroll={{ x: "max-content" }}
      />

      <Modal
        title={`Enregistrer un Paiement - ${
          selectedInvoice?.invoiceNumber || ""
        }`}
        key={selectedInvoice?._id || "payment-modal"}
        visible={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          paymentForm.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={paymentForm} layout="vertical" onFinish={recordPayment}>
          <Form.Item
            label="Montant du paiement"
            name="amount"
            rules={[{ required: true, message: "Veuillez saisir le montant" }]}
          >
            <InputNumber
              min={0}
              max={selectedInvoice?.amount}
              style={{ width: "100%" }}
              precision={2}
              formatter={(value) => {
                if (value === undefined || value === null) return '';
                return `${parseFloat(value).toFixed(2)} €`; // rounds to 2 decimals
              }}
              parser={(value) => value.replace(" €", "")}
              disabled
            />
          </Form.Item>

          <Form.Item
            label="Mode de paiement"
            name="method"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner un mode de paiement",
              },
            ]}
          >
            <Select placeholder="Sélectionnez un mode de paiement">
              <Option value="cash">Espèces</Option>
              <Option value="chèque">Chèque</Option>
              <Option value="bank_transfer">Virement bancaire</Option>
              <Option value="credit_card">Carte de crédit</Option>
              <Option value="online">Paiement en ligne</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Référence" name="reference">
            <Input placeholder="Numéro de chèque, référence virement, etc." />
          </Form.Item>

          <Form.Item
            label="Date du paiement"
            name="date"
            rules={[
              { required: true, message: "Veuillez sélectionner la date" },
            ]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              // defaultValue={moment()}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Button
              onClick={() => {
                setPaymentModalVisible(false);
                paymentForm.resetFields();
              }}
              style={{ marginRight: 8 }}
              disabled={processingPayment}
            >
              Annuler
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={processingPayment}
            >
              Enregistrer le paiement
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Invoice Details Modal */}
      <Modal
        title={`Détails de la facture ${selectedInvoice?.invoiceNumber || ""}`}
        key={selectedInvoice?._id || "details-modal"}
        visible={!!selectedInvoice && !paymentModalVisible}
        onCancel={() => setSelectedInvoice(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedInvoice(null)}>
            Fermer
          </Button>,
        ]}
        width={800}
      >
        {selectedInvoice && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space className="w-full justify-between">
                <Statistic
                  title="Montant"
                  value={selectedInvoice.amount}
                  formatter={(value) => formatCurrency(value)}
                />
                <Statistic title="Statut" value={selectedInvoice.status} />
                <Statistic
                  title="Échéance"
                  value={moment(selectedInvoice.dueDate).format("DD/MM/YYYY")}
                />
              </Space>
            </Card>

            <Table
              columns={[
                { title: "Description", dataIndex: "title", key: "title" },
                { title: "Quantité", dataIndex: "quantity", key: "quantity" },
                {
                  title: "Prix unitaire",
                  dataIndex: "unitPrice",
                  key: "unitPrice",
                  render: (value) => formatCurrency(value),
                },
                {
                  title: "TVA",
                  dataIndex: "tva",
                  key: "tva",
                  render: (value) => `${value}%`,
                },
                {
                  title: "Total TTC",
                  dataIndex: "totalTTC",
                  key: "totalTTC",
                  render: (value) => formatCurrency(value),
                },
              ]}
              dataSource={selectedInvoice.items}
              pagination={false}
              size="small"
            />

            {selectedInvoice.payments &&
              selectedInvoice.payments.length > 0 && (
                <Card title="Paiements" size="small" style={{ marginTop: 16 }}>
                  <Table
                    columns={[
                      {
                        title: "Date",
                        dataIndex: "date",
                        key: "date",
                        render: (date) => moment(date).format("DD/MM/YYYY"),
                      },
                      {
                        title: "Montant",
                        dataIndex: "amount",
                        key: "amount",
                        render: (amount) => formatCurrency(amount),
                      },
                      { title: "Méthode", dataIndex: "method", key: "method" },
                      {
                        title: "Référence",
                        dataIndex: "reference",
                        key: "reference",
                      },
                    ]}
                    dataSource={selectedInvoice.payments}
                    pagination={false}
                    size="small"
                  />
                </Card>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoicesManagement;

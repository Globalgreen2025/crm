import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  Table,
  Space,
  message,
  Card,
  Descriptions,
  Modal,
  Tag,
  Button,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { jwtDecode } from "jwt-decode";
import { jsPDF } from "jspdf";
import logo from "../assets/logo.png";
import logorge from "../assets/glgr.png";
import moment from "moment/moment";
import InvoicesManagement from "./InvoicesManagement";
import GenerateBillingPlan from "./GenerateBillingPlan";

const ProgressBar = ({ progress, width = 100, height = 8 }) => {
  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: "#f0f0f0",
        borderRadius: "4px",
        overflow: "hidden",
        marginTop: "4px",
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: "100%",
          backgroundColor: progress === 100 ? "#52c41a" : "#1890ff",
          borderRadius: "4px",
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
};

const Devis = ({ onValidate, shouldRefresh }) => {
  const [commands, setCommands] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [sendingEmails, setSendingEmails] = useState({});
  const [billingModalVisible, setBillingModalVisible] = useState(false);
  const [invoicesModalVisible, setInvoicesModalVisible] = useState(false);

  const handleGenerateBillingPlan = (command) => {
    setSelectedCommand(command);
    setBillingModalVisible(true);
  };

  const handleManageInvoices = (command) => {
    setSelectedCommand(command);
    setInvoicesModalVisible(true);
  };

  const refreshCommandInvoices = async (commandId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const invoicesResponse = await axios.get(
        `/command/${commandId}/invoices`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCommands((prevCommands) =>
        prevCommands.map((command) =>
          command._id === commandId
            ? { ...command, invoices: invoicesResponse.data || [] }
            : command
        )
      );

      return invoicesResponse.data || [];
    } catch (error) {
      console.error(
        `Error refreshing invoices for command ${commandId}:`,
        error
      );
      return [];
    }
  };

  const handleUpdateCommand = async (id) => {
    // Refresh the command data and invoices
    const token = localStorage.getItem("token");
    try {
      const updatedCommand = await axios.get(`/command/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Also refresh invoices for this command
      const invoices = await refreshCommandInvoices(id);

      setCommands((prevCommands) =>
        prevCommands.map((command) =>
          command._id === id
            ? { ...updatedCommand.data, invoices: invoices }
            : command
        )
      );
    } catch (error) {
      console.error("Error updating command:", error);
    }
  };

  // Helper function to safely round numbers to 2 decimals
  const safeRound = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  };

  // Helper function to safely format numbers
  const safeFormat = (value, fallback = "0") => {
    const num = parseFloat(value);
    return isNaN(num) ? fallback : num.toFixed(2);
  };

  // Helper function to calculate totals from items safely
  const calculateItemTotals = (items, field) => {
    if (!items || !Array.isArray(items)) return 0;
    return safeRound(
      items.reduce((sum, item) => sum + safeRound(item[field] || 0), 0)
    );
  };

  const handleDelete = (commandId) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer cette commande ?",
      content: "Cette action est irréversible.",
      okText: "Oui",
      cancelText: "Non",
      onOk: async () => {
        try {
          await axios.delete(`/command/${commandId}`);
          setCommands((prev) => prev.filter((cmd) => cmd._id !== commandId));
          message.success("Commande supprimée avec succès !");
        } catch (err) {
          console.error(err);
          message.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const handleUpdate = (commandId) => {
    navigate(`/leads/${id}/create-command/${commandId}`, {
      state: { commandId },
    });
  };

  const handleUpdateStatus = async (commandId, newStatus) => {
    try {
      const response = await axios.put(`/command/update-status/${commandId}`, {
        status: newStatus,
      });

      // Update the command in the UI
      setCommands((prevCommands) =>
        prevCommands.map((command) =>
          command._id === commandId
            ? { ...command, status: newStatus }
            : command
        )
      );

      message.success(`Statut mis à jour: ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      message.error("Échec de la mise à jour du statut");
    }
  };

  // const fetchCommands = async () => {
  //   const token = localStorage.getItem("token");
  //   if (!token) return;
  //   try {
  //     const response = await axios.get(`/command/${id}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     console.log("Response dataaaaa:", response.data);
  //     const commandsData = response?.data;
  //     const decodedToken = token ? jwtDecode(token) : null;
  //     const currentUserId = decodedToken?.userId;

  //     const filterecommand = commandsData.filter(
  //       (cmd) => cmd.session === currentUserId
  //     );
  //     const filteredCommands = filterecommand.filter(
  //       (command) =>
  //         command.command === "devis" && command.lead.toString() === id
  //     );
  //     setCommands(filteredCommands);
  //   } catch (error) {
  //     console.error("Error fetching commands:", error);
  //   }
  // };
  const fetchCommands = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await axios.get(`/command/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const commandsData = response?.data;
      // const decodedToken = token ? jwtDecode(token) : null;
      // const currentUserId = decodedToken?.userId;

      // const filterecommand = commandsData.filter(
      //   (cmd) => cmd.session === currentUserId
      // );
      const filteredCommands = commandsData.filter(
        (command) =>
          command.command === "devis" && command.lead.toString() === id
      );

      // SORT COMMANDS BY DATE (most recent first)
      const sortedCommands = filteredCommands.sort((a, b) => {
        return new Date(b.date) - new Date(a.date); // Descending order (newest first)
      });

      setCommands(sortedCommands);
    } catch (error) {
      console.error("Error fetching commands:", error);
    }
  };
  useEffect(() => {
    if (shouldRefresh) {
      fetchCommands();
    }
  }, [shouldRefresh, id]);

  function stringToColor(str) {
    const colors = [
      "magenta",
      "red",
      "volcano",
      "orange",
      "gold",
      "lime",
      "green",
      "cyan",
      "blue",
      "geekblue",
      "purple",
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }
  const handleDownload = (id) => {
    const command = commands.find((cmd) => cmd._id === id);
    if (!command) {
      message.error("Commande non trouvée");
      return;
    }
  
      
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginTop = 10;
    const marginLeft = 10;
    const marginLesfts = -12;
    const margin = 6;
  
    const addFooter = (pageNum) => {
      const footerY = pageHeight - 5;
      const leftText = "Global Green - SAS au capital social de 5000 €";
      const centerText = "N°SIREN 94305436100010 - RCS Blois";
      const rightText = "N° de TVA FR41492502992";
  
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text(leftText, margin, footerY);
      doc.text(centerText, pageWidth / 2, footerY, { align: "center" });
      doc.text(rightText, pageWidth - margin, footerY, { align: "right" });
    };
  
    const logoWidth = 60;
    const logoHeight = 60;
    const logoleftwidth = 60;
    const logoleftheight = 60;
  
    // Add logos
    doc.addImage(
      logo,
      "JPEG",
      marginLesfts,
      marginTop,
      logoleftwidth,
      logoleftheight
    );
    doc.addImage(
      logorge,
      "JPEG",
      pageWidth / 2 - logoWidth / 2,
      marginLeft,
      logoWidth,
      logoHeight,
      marginTop
    );
  
    // Company info on the right side
    doc.setFontSize(10);
    const rightStartX = pageWidth - 52;
  
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Entreprise:", rightStartX, 12);
  
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(0, 128, 0);
    doc.text("GLOBAL GREEN", rightStartX, 18);
  
    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("641 AVENUE DU GRAIN D'OR", rightStartX, 24);
    doc.text("41350 VINEUIL - France", rightStartX, 29);
    doc.text("Contact@global-green.fr", rightStartX, 34);
    doc.text("07 64 71 26 87", rightStartX, 39);
  
    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(11);
  
    const LINE_SPACING = 6;
    const SECTION_SPACING = 0.1;
  
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    const devisY = 50;
    doc.text("Devis", margin, devisY);
  
    // Left info under "Devis"
    const emissionMoment = command.date ? moment(command.date) : moment();
  
    const leftTexts = [
      `Numéro                               ${command.originalNumCommand || ""}`,
      `Date d'émission:                 ${emissionMoment.format("DD/MM/YYYY")}`,
      `Date d'expiration:               ${emissionMoment.clone().add(1, "month").format("DD/MM/YYYY")}`,
      `Type de vente:                    Prestation de service`,
    ];
  
    doc.setFontSize(11);
    doc.setFont(undefined, "Helvetica");
    doc.setTextColor(0, 0, 0);
    const rightTexts = [
      `${command.nom || ""}`,
      `${command.address || ""}`,
      `${command.ville || ""},   ${command.codepostal || ""}`,
      `${command.email || ""}`,
    ];
  
    const maxRightWidth = Math.max(
      ...rightTexts.map(
        (t) =>
          (doc.getStringUnitWidth(t) * doc.internal.getFontSize()) /
          doc.internal.scaleFactor
      )
    );
    const rightStartXd = pageWidth - margin - maxRightWidth;
  
    let currentRightYy = 50;
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Client ou Cliente:", rightStartXd, currentRightYy);
  
    currentRightYy += LINE_SPACING;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 128, 0);
    doc.text(`${command.nom || ""}`, rightStartXd, currentRightYy);
  
    const otherRightTexts = [
      `${command.address || ""}`,
      `${command.ville || ""}, ${command.codepostal || ""}`,
      `${command.email || ""}`,
    ];
  
    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    currentRightYy += LINE_SPACING;
    otherRightTexts.forEach((text, index) => {
      doc.text(text, rightStartXd, currentRightYy);
      currentRightYy += LINE_SPACING + (index < otherRightTexts.length - 1 ? SECTION_SPACING : 0);
    });
  
    let currentLeftY = 56;
    leftTexts.forEach((text, index) => {
      doc.text(text, margin, currentLeftY);
      currentLeftY += LINE_SPACING + (index < leftTexts.length - 1 ? SECTION_SPACING : 0);
    });
  
    doc.setFontSize(10);
    const currentTextColors = doc.getTextColor();
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
  
    const prestationsYStart = 85;
    const lineSpacing = 6;
  
    doc.setFontSize(10);
    doc.text(`Nature de l'intervention:`, margin, prestationsYStart);
    doc.setFont(undefined, "Helvetica");
    let currentY = prestationsYStart + lineSpacing;
    if (command.naturePrestations) {
      const prestationsLines = doc.splitTextToSize(command.naturePrestations, pageWidth - margin * 2);
      doc.text(prestationsLines, margin, currentY);
      const prestationsHeight = prestationsLines.length * lineSpacing;
      currentY += prestationsHeight;
    }
  
    // Add Note
    if (command.note) {
      currentY += lineSpacing;
      let noteText = command.note;
      if (noteText && !noteText.trim().toLowerCase().startsWith("note:")) {
        noteText = `Note: ${noteText.trim()}`;
      }
      const noteLines = doc.splitTextToSize(noteText, pageWidth - margin * 2);
      doc.text(noteLines, margin, currentY - 6);
    }
  
    let totalBaseHT = 0;
    let totalBaseTTC = 0;
    let totalForfait = 0;
    let totalBaseTVA = 0;
  
    const tableData = [];
    if (command.items && command.items.length > 0) {
      command.items.forEach((item) => {
        const itemHT = item.montantHT || 0;
        const itemTVA = item.montantTVA || 0;
        const itemTTC = item.montantTTC || 0;
        const quantity = item.quantite || 1;
        const unitPrice = item.prixUnitaire || itemHT / quantity;
  
        // Check if this is an offer product (has "Offert" in title or all prices are 0)
        const isOffer = item.title.includes("Offert") || (itemHT === 0 && itemTVA === 0 && itemTTC === 0);
  
        // Add the main product with unité next to quantity
        tableData.push({
          title: item.title || "N/A",
          reference: item.reference || "",
          description: item.description || "",
          quantity: item.quantite || 1,
          unite: item.unite,
          tvaRate: item.TVAappliquée,
          unitPrice: unitPrice,
          total: itemHT,
          isForfait: false,
          groupId: item._id || Math.random(),
          hasForfait: item.forfait && parseFloat(item.forfait) > 0,
          isOffer: isOffer,
        });
  
        totalBaseHT += itemHT;
        totalBaseTVA += itemTVA;
        totalBaseTTC += itemTTC;
  
        // Add forfait as a separate entry if it exists
        if (item.forfait && parseFloat(item.forfait) > 0) {
          const forfaitAmount = parseFloat(item.forfait);
          tableData.push({
            title: "Forfait pose",
            reference: "",
            description: "",
            quantity: 1,
            unite: "",
            unitPrice: forfaitAmount,
            tvaRate: 5.5,
            total: forfaitAmount,
            isForfait: true,
            groupId: item._id || Math.random(),
            hasForfait: false,
            isOffer: false,
          });
          totalForfait += forfaitAmount;
        }
      });
    }
  
    // TVA & TOTALS CALCULATION
    const productTotalHT = totalBaseHT;
    const productTotalTVA = totalBaseTVA;
    const productTotalTTC = totalBaseTTC;
  
    const forfaitHT = totalForfait;
    const forfaitTTC = totalForfait;
  
    const finalTotalHT = productTotalHT + forfaitHT;
    const finalTotalTVA = productTotalTVA;
    const finalTotalTTC = productTotalTTC + forfaitTTC;
  
    const usedTotalHT = Number(finalTotalHT.toFixed(2));
    const usedTotalTVA = Number(finalTotalTVA.toFixed(2));
    const usedTotalTTC = Number(finalTotalTTC.toFixed(2));
  
    // Group products with their forfaits
    const groupedProducts = [];
    let currentGroup = [];
  
    tableData.forEach((item, index) => {
      if (item.isForfait) {
        currentGroup.push(item);
        groupedProducts.push([...currentGroup]);
        currentGroup = [];
      } else {
        if (currentGroup.length > 0) {
          groupedProducts.push([...currentGroup]);
        }
        currentGroup = [item];
        if (index === tableData.length - 1) {
          groupedProducts.push([...currentGroup]);
        }
      }
    });
  
    // Distribute products across pages (2 products per page)
    const productsPerPage = 2;
    const productPages = [];
    
    for (let i = 0; i < groupedProducts.length; i += productsPerPage) {
      const pageProducts = [];
      for (let j = 0; j < productsPerPage && i + j < groupedProducts.length; j++) {
        pageProducts.push(...groupedProducts[i + j]);
      }
      productPages.push(pageProducts);
    }
  
    const totalPages = Math.max(productPages.length, 1);
  
    // Table configuration
    doc.setTextColor(currentTextColors);
    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(9);
  
    const originalTextColor = doc.getTextColor();
  
    // Calculate column widths
    const descWidth = 120;
    const availableWidth = pageWidth - 2 * margin - descWidth;
    const equalColumnWidth = availableWidth / 4;
  
    const qteWidth = equalColumnWidth;
    const prixWidth = equalColumnWidth;
    const tvaWidth = equalColumnWidth;
    const ttcWidth = equalColumnWidth;
  
    const descX = margin;
    const qteX = descX + descWidth;
    const prixX = qteX + qteWidth;
    const tvaX = prixX + prixWidth;
    const ttcX = tvaX + tvaWidth;
  
    const line1 = descX + descWidth;
    const line2 = line1 + qteWidth;
    const line3 = line2 + prixWidth;
    const line4 = line3 + tvaWidth;
  

const addTvaRecapAndTotals = (startY) => {
  let recapY = startY + 5; // Fixed spacing below table

  // Group items by TVA rate and calculate totals for each rate
  const tvaGroups = {};
  let totalHTProducts = 0;
  let totalTVAProducts = 0;

  if (command.items && command.items.length > 0) {
    command.items.forEach((item) => {
      const tvaRate = item.TVAappliquée;
      const itemHT = item.montantHT || 0;
      const itemTVA = item.montantTVA || 0;

      if (!tvaGroups[tvaRate]) {
        tvaGroups[tvaRate] = { baseHT: 0, montantTVA: 0 };
      }

      tvaGroups[tvaRate].baseHT += itemHT;
      tvaGroups[tvaRate].montantTVA += itemTVA;
      totalHTProducts += itemHT;
      totalTVAProducts += itemTVA;
    });
  }

  // Check if ALL TVA values are zero (not just some)
  const allTVAZero = Object.values(tvaGroups).every(group => 
    group.montantTVA === 0 && group.baseHT === 0
  );

  // Calculate the position for Récapitulatif (right side)
  const recapStartX = pageWidth / 2 + 20; // Start from middle + some margin
  let recapBoxY = recapY;

  // Only show TVA detail if we have non-zero values
  if (!allTVAZero) {
    // Section title - Détail TVA (left side)
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Détail TVA", margin, recapY);

    // Reset font
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    recapY += 8;

    // Display TVA groups - filter out zero groups
    const tvaRates = Object.keys(tvaGroups)
      .filter(tvaRate => {
        const group = tvaGroups[tvaRate];
        return group.montantTVA > 0 || group.baseHT > 0;
      })
      .sort((a, b) => parseFloat(a) - parseFloat(b));

    if (tvaRates.length === 1) {
      const tvaRate = tvaRates[0];
      const group = tvaGroups[tvaRate];

      const col1X = margin;
      const col2X = margin + 40;
      const col3X = margin + 80;

      doc.setFont(undefined, "bold");
      doc.text("Taux:", col1X, recapY);
      doc.setFont(undefined, "normal");
      doc.text(`${parseFloat(tvaRate).toFixed(1)}%`, col1X, recapY + 6);

      doc.setFont(undefined, "bold");
      doc.text("Montant TVA:", col2X, recapY);
      doc.setFont(undefined, "normal");
      doc.text(`${group.montantTVA.toFixed(2)} €`, col2X, recapY + 6);

      doc.setFont(undefined, "bold");
      doc.text("Base HT:", col3X, recapY);
      doc.setFont(undefined, "normal");
      doc.text(`${group.baseHT.toFixed(2)} €`, col3X, recapY + 6);

      recapY += 20;
    } else if (tvaRates.length > 1) {
      const col1X = margin;
      const col2X = margin + 40;
      const col3X = margin + 80;

      // Headers
      doc.setFont(undefined, "bold");
      doc.text("Taux", col1X, recapY);
      doc.text("Montant TVA", col2X, recapY);
      doc.text("Base HT", col3X, recapY);

      recapY += 8;

      // Data rows
      tvaRates.forEach((tvaRate) => {
        const group = tvaGroups[tvaRate];
        doc.setFont(undefined, "normal");
        doc.text(`${parseFloat(tvaRate).toFixed(1)}%`, col1X, recapY);
        doc.text(`${group.montantTVA.toFixed(2)} €`, col2X, recapY);
        doc.text(`${group.baseHT.toFixed(2)} €`, col3X, recapY);
        recapY += 6;
      });
      recapY += 8;
    }
  } else {
    // Skip TVA detail section entirely but maintain consistent spacing
    recapY = startY + 15;
  }

  // Récapitulatif section - RIGHT SIDE
  // Background rectangle
  const boxWidth = 80;
  const boxHeight = 35;
  doc.setFillColor(200);
  doc.rect(recapStartX - 5, recapBoxY, boxWidth, boxHeight, "F");

  // Title
  doc.setFont(undefined, "bold");
  doc.setFontSize(12);
  doc.text("Récapitulatif", recapStartX, recapBoxY + 5, { align: "left" });

  // Totals
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  let currentRecapY = recapBoxY + 16;
  
  doc.text("Total HT:", recapStartX, currentRecapY, { align: "left" });
  doc.text(`${usedTotalHT.toFixed(2)} €`, pageWidth - margin - 6, currentRecapY, { align: "right" });

  currentRecapY += 8;
  doc.text("Total TVA:", recapStartX, currentRecapY, { align: "left" });
  doc.text(`${usedTotalTVA.toFixed(2)} €`, pageWidth - margin - 6, currentRecapY, { align: "right" });

  currentRecapY += 8;
  doc.text("Total TTC:", recapStartX, currentRecapY, { align: "left" });
  doc.text(`${usedTotalTTC.toFixed(2)} €`, pageWidth - margin - 6, currentRecapY, { align: "right" });

  // Signature Section - centered at bottom
  const signatureY = Math.max(recapY, currentRecapY) + 20;
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("Date et signature précédée de la mention :", margin, signatureY);
  doc.text('"Bon pour accord"', margin, signatureY + 6);
};
  
    const renderTablePage = (pageIndex, products) => {
      const isFirstPage = pageIndex === 0;
      
      if (!isFirstPage) {
        doc.addPage();
        
        // Add minimal header for subsequent pages
        const marginTopp = 5;
        const marginLeftp = -8;
        
        doc.addImage(logo, "JPEG", marginLeftp, marginTopp, 60, 60);
        doc.addImage(logorge, "JPEG", (pageWidth - logoWidth) / 2, marginTopp, logoWidth, logoHeight);
        
        doc.setFontSize(10);
        doc.text(`Page(s): ${pageIndex + 1} sur ${totalPages}`, pageWidth - 30, marginTopp + 30);
      } else {
        doc.text(`Page(s): 1 sur ${totalPages}`, pageWidth - margin, 90, { align: "right" });
      }
  
      const headerY = isFirstPage ? 100 : 40;
      const headerHeight = 8;
      const textY = headerY + 5;
      const firstLineY = headerY + headerHeight;
  
      // Draw header background
      doc.setFillColor(21, 128, 61);
      doc.rect(margin + 0.2, headerY + 0.2, pageWidth - 2 * margin - 0.4, headerHeight - 0.4, "F");
      doc.line(margin, headerY, pageWidth - margin, headerY);
  
      // Table headers
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
  
      const descCenter = descX + descWidth / 2;
      const qteCenter = qteX + qteWidth / 2;
      const prixCenter = prixX + prixWidth / 2;
      const tvaCenter = tvaX + tvaWidth / 2;
      const ttcCenter = ttcX + ttcWidth / 2;
  
      doc.text("Descriptif", descCenter, textY, { align: "center" });
      doc.text("Unité", qteCenter, textY, { align: "center" });
      doc.text("Prix u. HT", prixCenter, textY, { align: "center" });
      doc.text("TVA %", tvaCenter, textY, { align: "center" });
      doc.text("Total HT", ttcCenter, textY, { align: "center" });
  
      doc.setFont(undefined, "normal");
  
      // Table content
      let currentRowY = firstLineY + 8;
      let currentGroupId = null;
  
      products.forEach((row, index) => {
        const isNewGroup = currentGroupId !== row.groupId;
        currentGroupId = row.groupId;
  
        const titleFontSize = 10;
        const refFontSize = 9;
        const descFontSize = 8;
        const titleRefSpacing = 0.7;
        const refDescSpacing = 0.1;
        const descLineSpacing = -0.9;
  
        let totalHeight;
        let lineY = currentRowY;
  
        if (row.isForfait) {
          totalHeight = titleFontSize - 6;
        } else {
          const descLines = doc.splitTextToSize(row.description, descWidth - 15);
          totalHeight = titleFontSize + titleRefSpacing + refFontSize + refDescSpacing + descLines.length * (descFontSize + descLineSpacing);
        }
  
        // Title - FIXED: Detect "Offert" in title and display separately
        doc.setFontSize(titleFontSize);
        doc.setFont(undefined, "bold");
        if (row.isForfait) {
          doc.setTextColor(0, 0, 0);
          doc.text(row.title, descX + 5, currentRowY - 4);
        } else {
          doc.setTextColor(0, 0, 0);
          
          // Check if this is an offer product (has "Offert" in title)
          if (row.isOffer && row.title.includes("Offert")) {
            // Remove "Offert" from title and display it separately below
            const titleWithoutOffert = row.title.replace(" Offert", "").trim();
            
            // Draw the title without "Offert"
            doc.text(titleWithoutOffert, descX + 5, lineY);
            lineY += titleFontSize + 2;
            
            // Draw "Offert" with yellow background below title
            const offertText = "Offert";
            doc.setFontSize(10);
            doc.setFont(undefined, "bold");
            
            // Calculate text width for background
            const offertWidth = doc.getTextWidth(offertText);
            const offertX = descX + 5;
            const offertY = lineY - 3;
            
            // Draw yellow background
            doc.setFillColor(255, 255, 0); // Yellow background
            doc.rect(offertX - 2, offertY - 8, offertWidth + 4, 8, 'F');
            
            // Draw "Offert" text in red
            doc.setTextColor(255, 0, 0); // Red text
            doc.text(offertText, offertX, offertY - 2);
            
            // Reset styles
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(titleFontSize);
            lineY += 6; // Add space after offert line
          } else {
            // Regular product without offer
            doc.text(row.title, descX + 5, lineY);
            lineY += titleFontSize;
          }
        }
  
        // Reference
        if (!row.isForfait && row.reference) {
          doc.setFontSize(refFontSize);
          doc.setFont(undefined, "italic");
          doc.setTextColor(0, 0, 0);
          doc.text(`Réf: ${row.reference}`, descX + 5, lineY);
          lineY += refFontSize;
        }
  
        // Description
        if (!row.isForfait && row.description) {
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
        }
  
        // Numeric columns
        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        doc.setTextColor(0, 0, 0);
  
        if (row.isForfait) {
          doc.text(`${row.quantity}`, qteX + qteWidth / 2, currentRowY - 4, { align: "center" });
          doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth / 2, currentRowY - 4, { align: "center" });
          doc.text(`${row.tvaRate}%`, tvaX + tvaWidth / 2, currentRowY - 4, { align: "center" });
          doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth / 2, currentRowY - 4, { align: "center" });
        } else {
          doc.text(`${row.quantity} ${row.unite}`, qteX + qteWidth / 2, currentRowY, { align: "center" });
          doc.text(`${row.total.toFixed(2)} €`, prixX + prixWidth / 2, currentRowY, { align: "center" });
          doc.text(`${row.tvaRate}%`, tvaX + tvaWidth / 2, currentRowY, { align: "center" });
          doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth / 2, currentRowY, { align: "center" });
        }
  
        // Smart spacing
        if (row.isForfait) {
          currentRowY += totalHeight;
        } else {
          const nextItem = products[index + 1];
          const nextItemIsMyForfait = nextItem && nextItem.isForfait && nextItem.groupId === row.groupId;
          if (nextItemIsMyForfait) {
            currentRowY += totalHeight + 4;
          } else {
            currentRowY += totalHeight + 6;
          }
        }
      });
  
      // Draw table frame
      const tableEndY = isFirstPage ? pageHeight - 12 : firstLineY + 140;
      doc.line(margin, headerY, margin, tableEndY);
      doc.line(line1, headerY, line1, tableEndY);
      doc.line(line2, headerY, line2, tableEndY);
      doc.line(line3, headerY, line3, tableEndY);
      doc.line(line4, headerY, line4, tableEndY);
      doc.line(pageWidth - margin, headerY, pageWidth - margin, tableEndY);
      doc.line(margin, tableEndY, pageWidth - margin, tableEndY);
  
      // ADD SUBTOTAL ONLY ON PAGE ONE
      if (isFirstPage) {
        const subtotalPage1 = products.reduce((acc, row) => acc + row.total, 0);
        const sousTotalY = tableEndY - 4;
  
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Sous-Total", descX + 5, sousTotalY);
        doc.text(`${subtotalPage1.toFixed(2)} €`, ttcX + ttcWidth / 2, sousTotalY, { align: "center" });
  
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, sousTotalY - 8, pageWidth - margin, sousTotalY - 8);
      }
  
      // Add footer
      addFooter(pageIndex + 1);
  
      // If this is the last page with products, add TVA recap and totals
      // BUT ONLY if it's page 2 or higher
      if (pageIndex === productPages.length - 1 && pageIndex >= 1) {
        // Fixed positioning below table on page 2
        addTvaRecapAndTotals(tableEndY + 10);
      }
    };
  
    // Render all product pages
    productPages.forEach((products, index) => {
      renderTablePage(index, products);
    });
  
    // ALWAYS CREATE SECOND PAGE WITH TABLE AND TVA DETAILS IF NEEDED
    const currentPageCount = doc.internal.getNumberOfPages();
    
    if (currentPageCount === 1) {
      // Add second page with empty table structure
      doc.addPage();
      
      // Add minimal header for second page
      const marginTopp = 5;
      const marginLeftp = -8;
      
      doc.addImage(logo, "JPEG", marginLeftp, marginTopp, 60, 60);
      doc.addImage(logorge, "JPEG", (pageWidth - logoWidth) / 2, marginTopp, logoWidth, logoHeight);
      
      doc.setFontSize(10);
      doc.text(`Page(s): 2 sur 2`, pageWidth - 30, marginTopp + 30);
  
      // Create empty table structure on page 2
      const headerY = 40;
      const headerHeight = 8;
      const textY = headerY + 5;
      const firstLineY = headerY + headerHeight;
  
      // Draw header background
      doc.setFillColor(21, 128, 61);
      doc.rect(margin + 0.2, headerY + 0.2, pageWidth - 2 * margin - 0.4, headerHeight - 0.4, "F");
      doc.line(margin, headerY, pageWidth - margin, headerY);
  
      // Table headers
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
  
      const descCenter = descX + descWidth / 2;
      const qteCenter = qteX + qteWidth / 2;
      const prixCenter = prixX + prixWidth / 2;
      const tvaCenter = tvaX + tvaWidth / 2;
      const ttcCenter = ttcX + ttcWidth / 2;
  
      doc.text("Descriptif", descCenter, textY, { align: "center" });
      doc.text("Unité", qteCenter, textY, { align: "center" });
      doc.text("Prix u. HT", prixCenter, textY, { align: "center" });
      doc.text("TVA %", tvaCenter, textY, { align: "center" });
      doc.text("Total HT", ttcCenter, textY, { align: "center" });
  
      // Draw empty table frame
      const tableEndY = firstLineY + 140;
      doc.line(margin, headerY, margin, tableEndY);
      doc.line(line1, headerY, line1, tableEndY);
      doc.line(line2, headerY, line2, tableEndY);
      doc.line(line3, headerY, line3, tableEndY);
      doc.line(line4, headerY, line4, tableEndY);
      doc.line(pageWidth - margin, headerY, pageWidth - margin, tableEndY);
      doc.line(margin, tableEndY, pageWidth - margin, tableEndY);
  
      // Add TVA recap and signature on second page with fixed positioning
      addTvaRecapAndTotals(tableEndY + 10);
      addFooter(2);
    }
    // Save the PDF
    doc.save(`Devis_${command.originalNumCommand || command._id}.pdf`);
  };

 
  const handleSendPdf = async (commandId, e) => {
    e.stopPropagation();

    setSendingEmails((prev) => ({ ...prev, [commandId]: true }));

    const command = commands.find((cmd) => cmd._id === commandId);
    if (command.command_type !== "devis") {
      setSendingEmails((prev) => ({ ...prev, [commandId]: false }));
      return message.warning(
        "Le devis est déjà validé et converti en commande."
      );
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginTop = 10;
    const marginLeft = 10;
    const marginLesfts = -12;
    const margin = 6;
  
    const addFooter = (pageNum) => {
      const footerY = pageHeight - 5;
      const leftText = "Global Green - SAS au capital social de 5000 €";
      const centerText = "N°SIREN 94305436100010 - RCS Blois";
      const rightText = "N° de TVA FR41492502992";
  
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text(leftText, margin, footerY);
      doc.text(centerText, pageWidth / 2, footerY, { align: "center" });
      doc.text(rightText, pageWidth - margin, footerY, { align: "right" });
    };
  
    const logoWidth = 60;
    const logoHeight = 60;
    const logoleftwidth = 60;
    const logoleftheight = 60;
  
    // Add logos
    doc.addImage(
      logo,
      "JPEG",
      marginLesfts,
      marginTop,
      logoleftwidth,
      logoleftheight
    );
    doc.addImage(
      logorge,
      "JPEG",
      pageWidth / 2 - logoWidth / 2,
      marginLeft,
      logoWidth,
      logoHeight,
      marginTop
    );
  
    // Company info on the right side
    doc.setFontSize(10);
    const rightStartX = pageWidth - 52;
  
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Entreprise:", rightStartX, 12);
  
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(0, 128, 0);
    doc.text("GLOBAL GREEN", rightStartX, 18);
  
    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("641 AVENUE DU GRAIN D'OR", rightStartX, 24);
    doc.text("41350 VINEUIL - France", rightStartX, 29);
    doc.text("Contact@global-green.fr", rightStartX, 34);
    doc.text("07 64 71 26 87", rightStartX, 39);
  
    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(11);
  
    const LINE_SPACING = 6;
    const SECTION_SPACING = 0.1;
  
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    const devisY = 50;
    doc.text("Devis", margin, devisY);
  
    // Left info under "Devis"
    const emissionMoment = command.date ? moment(command.date) : moment();
  
    const leftTexts = [
      `Numéro                               ${command.originalNumCommand || ""}`,
      `Date d'émission:                 ${emissionMoment.format("DD/MM/YYYY")}`,
      `Date d'expiration:               ${emissionMoment.clone().add(1, "month").format("DD/MM/YYYY")}`,
      `Type de vente:                    Prestation de service`,
    ];
  
    doc.setFontSize(11);
    doc.setFont(undefined, "Helvetica");
    doc.setTextColor(0, 0, 0);
    const rightTexts = [
      `${command.nom || ""}`,
      `${command.address || ""}`,
      `${command.ville || ""},   ${command.codepostal || ""}`,
      `${command.email || ""}`,
    ];
  
    const maxRightWidth = Math.max(
      ...rightTexts.map(
        (t) =>
          (doc.getStringUnitWidth(t) * doc.internal.getFontSize()) /
          doc.internal.scaleFactor
      )
    );
    const rightStartXd = pageWidth - margin - maxRightWidth;
  
    let currentRightYy = 50;
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Client ou Cliente:", rightStartXd, currentRightYy);
  
    currentRightYy += LINE_SPACING;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 128, 0);
    doc.text(`${command.nom || ""}`, rightStartXd, currentRightYy);
  
    const otherRightTexts = [
      `${command.address || ""}`,
      `${command.ville || ""}, ${command.codepostal || ""}`,
      `${command.email || ""}`,
    ];
  
    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    currentRightYy += LINE_SPACING;
    otherRightTexts.forEach((text, index) => {
      doc.text(text, rightStartXd, currentRightYy);
      currentRightYy += LINE_SPACING + (index < otherRightTexts.length - 1 ? SECTION_SPACING : 0);
    });
  
    let currentLeftY = 56;
    leftTexts.forEach((text, index) => {
      doc.text(text, margin, currentLeftY);
      currentLeftY += LINE_SPACING + (index < leftTexts.length - 1 ? SECTION_SPACING : 0);
    });
  
    doc.setFontSize(10);
    const currentTextColors = doc.getTextColor();
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
  
    const prestationsYStart = 85;
    const lineSpacing = 6;
  
    doc.setFontSize(10);
    doc.text(`Nature de l'intervention:`, margin, prestationsYStart);
    doc.setFont(undefined, "Helvetica");
    let currentY = prestationsYStart + lineSpacing;
    if (command.naturePrestations) {
      const prestationsLines = doc.splitTextToSize(command.naturePrestations, pageWidth - margin * 2);
      doc.text(prestationsLines, margin, currentY);
      const prestationsHeight = prestationsLines.length * lineSpacing;
      currentY += prestationsHeight;
    }
  
    // Add Note
    if (command.note) {
      currentY += lineSpacing;
      let noteText = command.note;
      if (noteText && !noteText.trim().toLowerCase().startsWith("note:")) {
        noteText = `Note: ${noteText.trim()}`;
      }
      const noteLines = doc.splitTextToSize(noteText, pageWidth - margin * 2);
      doc.text(noteLines, margin, currentY - 6);
    }
  
    let totalBaseHT = 0;
    let totalBaseTTC = 0;
    let totalForfait = 0;
    let totalBaseTVA = 0;
  
    const tableData = [];
    if (command.items && command.items.length > 0) {
      command.items.forEach((item) => {
        const itemHT = item.montantHT || 0;
        const itemTVA = item.montantTVA || 0;
        const itemTTC = item.montantTTC || 0;
        const quantity = item.quantite || 1;
        const unitPrice = item.prixUnitaire || itemHT / quantity;
  
        // Check if this is an offer product (has "Offert" in title or all prices are 0)
        const isOffer = item.title.includes("Offert") || (itemHT === 0 && itemTVA === 0 && itemTTC === 0);
  
        // Add the main product with unité next to quantity
        tableData.push({
          title: item.title || "N/A",
          reference: item.reference || "",
          description: item.description || "",
          quantity: item.quantite || 1,
          unite: item.unite,
          tvaRate: item.TVAappliquée,
          unitPrice: unitPrice,
          total: itemHT,
          isForfait: false,
          groupId: item._id || Math.random(),
          hasForfait: item.forfait && parseFloat(item.forfait) > 0,
          isOffer: isOffer,
        });
  
        totalBaseHT += itemHT;
        totalBaseTVA += itemTVA;
        totalBaseTTC += itemTTC;
  
        // Add forfait as a separate entry if it exists
        if (item.forfait && parseFloat(item.forfait) > 0) {
          const forfaitAmount = parseFloat(item.forfait);
          tableData.push({
            title: "Forfait pose",
            reference: "",
            description: "",
            quantity: 1,
            unite: "",
            unitPrice: forfaitAmount,
            tvaRate: 5.5,
            total: forfaitAmount,
            isForfait: true,
            groupId: item._id || Math.random(),
            hasForfait: false,
            isOffer: false,
          });
          totalForfait += forfaitAmount;
        }
      });
    }
  
    // TVA & TOTALS CALCULATION
    const productTotalHT = totalBaseHT;
    const productTotalTVA = totalBaseTVA;
    const productTotalTTC = totalBaseTTC;
  
    const forfaitHT = totalForfait;
    const forfaitTTC = totalForfait;
  
    const finalTotalHT = productTotalHT + forfaitHT;
    const finalTotalTVA = productTotalTVA;
    const finalTotalTTC = productTotalTTC + forfaitTTC;
  
    const usedTotalHT = Number(finalTotalHT.toFixed(2));
    const usedTotalTVA = Number(finalTotalTVA.toFixed(2));
    const usedTotalTTC = Number(finalTotalTTC.toFixed(2));
  
    // Group products with their forfaits
    const groupedProducts = [];
    let currentGroup = [];
  
    tableData.forEach((item, index) => {
      if (item.isForfait) {
        currentGroup.push(item);
        groupedProducts.push([...currentGroup]);
        currentGroup = [];
      } else {
        if (currentGroup.length > 0) {
          groupedProducts.push([...currentGroup]);
        }
        currentGroup = [item];
        if (index === tableData.length - 1) {
          groupedProducts.push([...currentGroup]);
        }
      }
    });
  
    // Distribute products across pages (2 products per page)
    const productsPerPage = 2;
    const productPages = [];
    
    for (let i = 0; i < groupedProducts.length; i += productsPerPage) {
      const pageProducts = [];
      for (let j = 0; j < productsPerPage && i + j < groupedProducts.length; j++) {
        pageProducts.push(...groupedProducts[i + j]);
      }
      productPages.push(pageProducts);
    }
  
    const totalPages = Math.max(productPages.length, 1);
  
    // Table configuration
    doc.setTextColor(currentTextColors);
    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(9);
  
    const originalTextColor = doc.getTextColor();
  
    // Calculate column widths
    const descWidth = 120;
    const availableWidth = pageWidth - 2 * margin - descWidth;
    const equalColumnWidth = availableWidth / 4;
  
    const qteWidth = equalColumnWidth;
    const prixWidth = equalColumnWidth;
    const tvaWidth = equalColumnWidth;
    const ttcWidth = equalColumnWidth;
  
    const descX = margin;
    const qteX = descX + descWidth;
    const prixX = qteX + qteWidth;
    const tvaX = prixX + prixWidth;
    const ttcX = tvaX + tvaWidth;
  
    const line1 = descX + descWidth;
    const line2 = line1 + qteWidth;
    const line3 = line2 + prixWidth;
    const line4 = line3 + tvaWidth;
  

const addTvaRecapAndTotals = (startY) => {
  let recapY = startY + 5; // Fixed spacing below table

  // Group items by TVA rate and calculate totals for each rate
  const tvaGroups = {};
  let totalHTProducts = 0;
  let totalTVAProducts = 0;

  if (command.items && command.items.length > 0) {
    command.items.forEach((item) => {
      const tvaRate = item.TVAappliquée;
      const itemHT = item.montantHT || 0;
      const itemTVA = item.montantTVA || 0;

      if (!tvaGroups[tvaRate]) {
        tvaGroups[tvaRate] = { baseHT: 0, montantTVA: 0 };
      }

      tvaGroups[tvaRate].baseHT += itemHT;
      tvaGroups[tvaRate].montantTVA += itemTVA;
      totalHTProducts += itemHT;
      totalTVAProducts += itemTVA;
    });
  }

  // Check if ALL TVA values are zero (not just some)
  const allTVAZero = Object.values(tvaGroups).every(group => 
    group.montantTVA === 0 && group.baseHT === 0
  );

  // Calculate the position for Récapitulatif (right side)
  const recapStartX = pageWidth / 2 + 20; // Start from middle + some margin
  let recapBoxY = recapY;

  // Only show TVA detail if we have non-zero values
  if (!allTVAZero) {
    // Section title - Détail TVA (left side)
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Détail TVA", margin, recapY);

    // Reset font
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    recapY += 8;

    // Display TVA groups - filter out zero groups
    const tvaRates = Object.keys(tvaGroups)
      .filter(tvaRate => {
        const group = tvaGroups[tvaRate];
        return group.montantTVA > 0 || group.baseHT > 0;
      })
      .sort((a, b) => parseFloat(a) - parseFloat(b));

    if (tvaRates.length === 1) {
      const tvaRate = tvaRates[0];
      const group = tvaGroups[tvaRate];

      const col1X = margin;
      const col2X = margin + 40;
      const col3X = margin + 80;

      doc.setFont(undefined, "bold");
      doc.text("Taux:", col1X, recapY);
      doc.setFont(undefined, "normal");
      doc.text(`${parseFloat(tvaRate).toFixed(1)}%`, col1X, recapY + 6);

      doc.setFont(undefined, "bold");
      doc.text("Montant TVA:", col2X, recapY);
      doc.setFont(undefined, "normal");
      doc.text(`${group.montantTVA.toFixed(2)} €`, col2X, recapY + 6);

      doc.setFont(undefined, "bold");
      doc.text("Base HT:", col3X, recapY);
      doc.setFont(undefined, "normal");
      doc.text(`${group.baseHT.toFixed(2)} €`, col3X, recapY + 6);

      recapY += 20;
    } else if (tvaRates.length > 1) {
      const col1X = margin;
      const col2X = margin + 40;
      const col3X = margin + 80;

      // Headers
      doc.setFont(undefined, "bold");
      doc.text("Taux", col1X, recapY);
      doc.text("Montant TVA", col2X, recapY);
      doc.text("Base HT", col3X, recapY);

      recapY += 8;

      // Data rows
      tvaRates.forEach((tvaRate) => {
        const group = tvaGroups[tvaRate];
        doc.setFont(undefined, "normal");
        doc.text(`${parseFloat(tvaRate).toFixed(1)}%`, col1X, recapY);
        doc.text(`${group.montantTVA.toFixed(2)} €`, col2X, recapY);
        doc.text(`${group.baseHT.toFixed(2)} €`, col3X, recapY);
        recapY += 6;
      });
      recapY += 8;
    }
  } else {
    // Skip TVA detail section entirely but maintain consistent spacing
    recapY = startY + 15;
  }

  // Récapitulatif section - RIGHT SIDE
  // Background rectangle
  const boxWidth = 80;
  const boxHeight = 35;
  doc.setFillColor(200);
  doc.rect(recapStartX - 5, recapBoxY, boxWidth, boxHeight, "F");

  // Title
  doc.setFont(undefined, "bold");
  doc.setFontSize(12);
  doc.text("Récapitulatif", recapStartX, recapBoxY + 5, { align: "left" });

  // Totals
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  let currentRecapY = recapBoxY + 16;
  
  doc.text("Total HT:", recapStartX, currentRecapY, { align: "left" });
  doc.text(`${usedTotalHT.toFixed(2)} €`, pageWidth - margin - 6, currentRecapY, { align: "right" });

  currentRecapY += 8;
  doc.text("Total TVA:", recapStartX, currentRecapY, { align: "left" });
  doc.text(`${usedTotalTVA.toFixed(2)} €`, pageWidth - margin - 6, currentRecapY, { align: "right" });

  currentRecapY += 8;
  doc.text("Total TTC:", recapStartX, currentRecapY, { align: "left" });
  doc.text(`${usedTotalTTC.toFixed(2)} €`, pageWidth - margin - 6, currentRecapY, { align: "right" });

  // Signature Section - centered at bottom
  const signatureY = Math.max(recapY, currentRecapY) + 20;
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("Date et signature précédée de la mention :", margin, signatureY);
  doc.text('"Bon pour accord"', margin, signatureY + 6);
};
  
    const renderTablePage = (pageIndex, products) => {
      const isFirstPage = pageIndex === 0;
      
      if (!isFirstPage) {
        doc.addPage();
        
        // Add minimal header for subsequent pages
        const marginTopp = 5;
        const marginLeftp = -8;
        
        doc.addImage(logo, "JPEG", marginLeftp, marginTopp, 60, 60);
        doc.addImage(logorge, "JPEG", (pageWidth - logoWidth) / 2, marginTopp, logoWidth, logoHeight);
        
        doc.setFontSize(10);
        doc.text(`Page(s): ${pageIndex + 1} sur ${totalPages}`, pageWidth - 30, marginTopp + 30);
      } else {
        doc.text(`Page(s): 1 sur ${totalPages}`, pageWidth - margin, 90, { align: "right" });
      }
  
      const headerY = isFirstPage ? 100 : 40;
      const headerHeight = 8;
      const textY = headerY + 5;
      const firstLineY = headerY + headerHeight;
  
      // Draw header background
      doc.setFillColor(21, 128, 61);
      doc.rect(margin + 0.2, headerY + 0.2, pageWidth - 2 * margin - 0.4, headerHeight - 0.4, "F");
      doc.line(margin, headerY, pageWidth - margin, headerY);
  
      // Table headers
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
  
      const descCenter = descX + descWidth / 2;
      const qteCenter = qteX + qteWidth / 2;
      const prixCenter = prixX + prixWidth / 2;
      const tvaCenter = tvaX + tvaWidth / 2;
      const ttcCenter = ttcX + ttcWidth / 2;
  
      doc.text("Descriptif", descCenter, textY, { align: "center" });
      doc.text("Unité", qteCenter, textY, { align: "center" });
      doc.text("Prix u. HT", prixCenter, textY, { align: "center" });
      doc.text("TVA %", tvaCenter, textY, { align: "center" });
      doc.text("Total HT", ttcCenter, textY, { align: "center" });
  
      doc.setFont(undefined, "normal");
  
      // Table content
      let currentRowY = firstLineY + 8;
      let currentGroupId = null;
  
      products.forEach((row, index) => {
        const isNewGroup = currentGroupId !== row.groupId;
        currentGroupId = row.groupId;
  
        const titleFontSize = 10;
        const refFontSize = 9;
        const descFontSize = 8;
        const titleRefSpacing = 0.7;
        const refDescSpacing = 0.1;
        const descLineSpacing = -0.9;
  
        let totalHeight;
        let lineY = currentRowY;
  
        if (row.isForfait) {
          totalHeight = titleFontSize - 6;
        } else {
          const descLines = doc.splitTextToSize(row.description, descWidth - 15);
          totalHeight = titleFontSize + titleRefSpacing + refFontSize + refDescSpacing + descLines.length * (descFontSize + descLineSpacing);
        }
  
        // Title - FIXED: Detect "Offert" in title and display separately
        doc.setFontSize(titleFontSize);
        doc.setFont(undefined, "bold");
        if (row.isForfait) {
          doc.setTextColor(0, 0, 0);
          doc.text(row.title, descX + 5, currentRowY - 4);
        } else {
          doc.setTextColor(0, 0, 0);
          
          // Check if this is an offer product (has "Offert" in title)
          if (row.isOffer && row.title.includes("Offert")) {
            // Remove "Offert" from title and display it separately below
            const titleWithoutOffert = row.title.replace(" Offert", "").trim();
            
            // Draw the title without "Offert"
            doc.text(titleWithoutOffert, descX + 5, lineY);
            lineY += titleFontSize + 2;
            
            // Draw "Offert" with yellow background below title
            const offertText = "Offert";
            doc.setFontSize(10);
            doc.setFont(undefined, "bold");
            
            // Calculate text width for background
            const offertWidth = doc.getTextWidth(offertText);
            const offertX = descX + 5;
            const offertY = lineY - 3;
            
            // Draw yellow background
            doc.setFillColor(255, 255, 0); // Yellow background
            doc.rect(offertX - 2, offertY - 8, offertWidth + 4, 8, 'F');
            
            // Draw "Offert" text in red
            doc.setTextColor(255, 0, 0); // Red text
            doc.text(offertText, offertX, offertY - 2);
            
            // Reset styles
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(titleFontSize);
            lineY += 6; // Add space after offert line
          } else {
            // Regular product without offer
            doc.text(row.title, descX + 5, lineY);
            lineY += titleFontSize;
          }
        }
  
        // Reference
        if (!row.isForfait && row.reference) {
          doc.setFontSize(refFontSize);
          doc.setFont(undefined, "italic");
          doc.setTextColor(0, 0, 0);
          doc.text(`Réf: ${row.reference}`, descX + 5, lineY);
          lineY += refFontSize;
        }
  
        // Description
        if (!row.isForfait && row.description) {
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
        }
  
        // Numeric columns
        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        doc.setTextColor(0, 0, 0);
  
        if (row.isForfait) {
          doc.text(`${row.quantity}`, qteX + qteWidth / 2, currentRowY - 4, { align: "center" });
          doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth / 2, currentRowY - 4, { align: "center" });
          doc.text(`${row.tvaRate}%`, tvaX + tvaWidth / 2, currentRowY - 4, { align: "center" });
          doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth / 2, currentRowY - 4, { align: "center" });
        } else {
          doc.text(`${row.quantity} ${row.unite}`, qteX + qteWidth / 2, currentRowY, { align: "center" });
          doc.text(`${row.total.toFixed(2)} €`, prixX + prixWidth / 2, currentRowY, { align: "center" });
          doc.text(`${row.tvaRate}%`, tvaX + tvaWidth / 2, currentRowY, { align: "center" });
          doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth / 2, currentRowY, { align: "center" });
        }
  
        // Smart spacing
        if (row.isForfait) {
          currentRowY += totalHeight;
        } else {
          const nextItem = products[index + 1];
          const nextItemIsMyForfait = nextItem && nextItem.isForfait && nextItem.groupId === row.groupId;
          if (nextItemIsMyForfait) {
            currentRowY += totalHeight + 4;
          } else {
            currentRowY += totalHeight + 6;
          }
        }
      });
  
      // Draw table frame
      const tableEndY = isFirstPage ? pageHeight - 12 : firstLineY + 140;
      doc.line(margin, headerY, margin, tableEndY);
      doc.line(line1, headerY, line1, tableEndY);
      doc.line(line2, headerY, line2, tableEndY);
      doc.line(line3, headerY, line3, tableEndY);
      doc.line(line4, headerY, line4, tableEndY);
      doc.line(pageWidth - margin, headerY, pageWidth - margin, tableEndY);
      doc.line(margin, tableEndY, pageWidth - margin, tableEndY);
  
      // ADD SUBTOTAL ONLY ON PAGE ONE
      if (isFirstPage) {
        const subtotalPage1 = products.reduce((acc, row) => acc + row.total, 0);
        const sousTotalY = tableEndY - 4;
  
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Sous-Total", descX + 5, sousTotalY);
        doc.text(`${subtotalPage1.toFixed(2)} €`, ttcX + ttcWidth / 2, sousTotalY, { align: "center" });
  
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, sousTotalY - 8, pageWidth - margin, sousTotalY - 8);
      }
  
      // Add footer
      addFooter(pageIndex + 1);
  
      // If this is the last page with products, add TVA recap and totals
      // BUT ONLY if it's page 2 or higher
      if (pageIndex === productPages.length - 1 && pageIndex >= 1) {
        // Fixed positioning below table on page 2
        addTvaRecapAndTotals(tableEndY + 10);
      }
    };
  
    // Render all product pages
    productPages.forEach((products, index) => {
      renderTablePage(index, products);
    });
  
    // ALWAYS CREATE SECOND PAGE WITH TABLE AND TVA DETAILS IF NEEDED
    const currentPageCount = doc.internal.getNumberOfPages();
    
    if (currentPageCount === 1) {
      // Add second page with empty table structure
      doc.addPage();
      
      // Add minimal header for second page
      const marginTopp = 5;
      const marginLeftp = -8;
      
      doc.addImage(logo, "JPEG", marginLeftp, marginTopp, 60, 60);
      doc.addImage(logorge, "JPEG", (pageWidth - logoWidth) / 2, marginTopp, logoWidth, logoHeight);
      
      doc.setFontSize(10);
      doc.text(`Page(s): 2 sur 2`, pageWidth - 30, marginTopp + 30);
  
      // Create empty table structure on page 2
      const headerY = 40;
      const headerHeight = 8;
      const textY = headerY + 5;
      const firstLineY = headerY + headerHeight;
  
      // Draw header background
      doc.setFillColor(21, 128, 61);
      doc.rect(margin + 0.2, headerY + 0.2, pageWidth - 2 * margin - 0.4, headerHeight - 0.4, "F");
      doc.line(margin, headerY, pageWidth - margin, headerY);
  
      // Table headers
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
  
      const descCenter = descX + descWidth / 2;
      const qteCenter = qteX + qteWidth / 2;
      const prixCenter = prixX + prixWidth / 2;
      const tvaCenter = tvaX + tvaWidth / 2;
      const ttcCenter = ttcX + ttcWidth / 2;
  
      doc.text("Descriptif", descCenter, textY, { align: "center" });
      doc.text("Unité", qteCenter, textY, { align: "center" });
      doc.text("Prix u. HT", prixCenter, textY, { align: "center" });
      doc.text("TVA %", tvaCenter, textY, { align: "center" });
      doc.text("Total HT", ttcCenter, textY, { align: "center" });
  
      // Draw empty table frame
      const tableEndY = firstLineY + 140;
      doc.line(margin, headerY, margin, tableEndY);
      doc.line(line1, headerY, line1, tableEndY);
      doc.line(line2, headerY, line2, tableEndY);
      doc.line(line3, headerY, line3, tableEndY);
      doc.line(line4, headerY, line4, tableEndY);
      doc.line(pageWidth - margin, headerY, pageWidth - margin, tableEndY);
      doc.line(margin, tableEndY, pageWidth - margin, tableEndY);
  
      // Add TVA recap and signature on second page with fixed positioning
      addTvaRecapAndTotals(tableEndY + 10);
      addFooter(2);
    }

    const pdfBase64 = doc.output("datauristring");

    try {
      await axios.post(`/command/send-devis-email/${commandId}`, {
        email: command.email,
        pdf: pdfBase64,
        commandId: command._id,
        commandNum: command.numCommand,
        phone: command.phone,
        clientName: command.nom,
        societeName: command.nom_societé,
        title: command.title,
        description: command.description,
      });

      const response = await axios.put(`/command/send/${commandId}`);

      // Update the command in the UI
      setCommands((prevCommands) =>
        prevCommands.map((command) =>
          command._id === commandId
            ? {
                ...command,
                status: "envoyé",
                date_envoi: new Date(),
                date_expiration: new Date(
                  Date.now() + 180 * 24 * 60 * 60 * 1000
                ),
              }
            : command
        )
      );

      message.success("Devis envoyé avec succès par email !");
    } catch (error) {
      console.error("Erreur lors de l'envoi par email :", error);
      message.error("Échec de l'envoi du devis.");
    }
  };

  const columns = [
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        let color = "";
        let icon = null;
        let text = "";

        switch (status) {
          case "accepté":
          case "validé":
            color = "green";
            icon = <CheckCircleOutlined />;
            text = "Validé";
            break;
          case "refusé":
          case "rejeté":
            color = "red";
            icon = <CloseCircleOutlined />;
            text = "Refusé";
            break;
          case "en attente":
          case "pending":
            color = "orange";
            icon = <ExclamationCircleOutlined />;
            text = "En attente";
            break;
          default:
            color = "default";
            icon = <ExclamationCircleOutlined />;
            text = status || "Non défini";
        }

        return (
          <Tag
            color={color}
            icon={icon}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: "500",
            }}
          >
            {text}
          </Tag>
        );
      },
      filters: [
        { text: "Validé", value: "accepté" },
        { text: "Refusé", value: "refusé" },
        { text: "En attente", value: "en attente" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Facturation",
      key: "billing",
      render: (_, record) => {
        const calculateOverallProgress = () => {
          if (
            !record.invoices ||
            !Array.isArray(record.invoices) ||
            record.invoices.length === 0
          ) {
            return 0;
          }

          const totalAmount = record.invoices.reduce(
            (sum, inv) => sum + (inv.amount || 0),
            0
          );
          const totalPaid = record.invoices.reduce(
            (sum, inv) =>
              sum +
              (inv.payments && Array.isArray(inv.payments)
                ? inv.payments.reduce((pSum, p) => pSum + (p.amount || 0), 0)
                : 0),
            0
          );

          return totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
        };

        const calculatePaymentDetails = () => {
          if (!record.invoices || !Array.isArray(record.invoices)) {
            return { paid: 0, total: 0, paidInvoices: 0, totalInvoices: 0 };
          }

          const totalAmount = record.invoices.reduce(
            (sum, inv) => sum + (inv.amount || 0),
            0
          );
          const totalPaid = record.invoices.reduce(
            (sum, inv) =>
              sum +
              (inv.payments && Array.isArray(inv.payments)
                ? inv.payments.reduce((pSum, p) => pSum + (p.amount || 0), 0)
                : 0),
            0
          );

          const paidInvoices = record.invoices.filter(
            (inv) =>
              inv.payments &&
              Array.isArray(inv.payments) &&
              inv.payments.length > 0
          ).length;

          return {
            paid: totalPaid,
            total: totalAmount,
            paidInvoices: paidInvoices,
            totalInvoices: record.invoices.length,
          };
        };

        const overallProgress = calculateOverallProgress();
        const paymentDetails = calculatePaymentDetails();
        const hasInvoices = record.invoices && record.invoices.length > 0;
        const hasBillingPlan = record.billingPlan;

        return (
          <Space direction="vertical">
            {record.status === "accepté" && (
              <>
                <Button
                  size="small"
                  onClick={() => handleGenerateBillingPlan(record)}
                  // disabled={record.command_type !== "facture"}
                  disabled={
                    !record.billingPlan ||
                    (record.invoices && record.invoices.length > 0)
                  }
                  style={{ width: "120px" }}
                >
                  Plan Facturation
                </Button>
                <Button
                  size="small"
                  onClick={() => handleManageInvoices(record)}
                  disabled={!record.billingPlan}
                  style={{ width: "120px" }}
                >
                  Gérer Factures
                </Button>

                {/* Single progress bar for overall payment progress */}
                {/* {hasBillingPlan && hasInvoices && (
                  <Tooltip
                    title={
                      <div>
                        <div>
                          <strong>Détails des paiements:</strong>
                        </div>
                        <div>
                          Total facturé: {paymentDetails.total.toFixed(2)}€
                        </div>
                        <div>Total payé: {paymentDetails.paid.toFixed(2)}€</div>
                        <div>
                          Factures payées: {paymentDetails.paidInvoices}/
                          {paymentDetails.totalInvoices}
                        </div>
                      </div>
                    }
                  >
                    <div
                      style={{
                        padding: "6px",
                        backgroundColor: "#f9f9f9",
                        borderRadius: "6px",
                        border: "1px solid #e8e8e8",
                        marginTop: "8px",
                        width: "120px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: "bold",
                          marginBottom: "4px",
                          textAlign: "center",
                        }}
                      >
                        Paiement Global
                      </div>
                      <ProgressBar
                        progress={overallProgress}
                        width={110}
                        height={8}
                      />
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#1890ff",
                          marginTop: "4px",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {overallProgress.toFixed(0)}%
                      </div>
                    </div>
                  </Tooltip>
                )} */}

                {/* Show message if billing plan exists but no invoices yet */}
                {hasBillingPlan && !hasInvoices && (
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#999",
                      padding: "6px",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "4px",
                      marginTop: "8px",
                      width: "120px",
                      textAlign: "center",
                    }}
                  >
                    📋 Plan créé
                  </div>
                )}
              </>
            )}
          </Space>
        );
      },
    },
    {
      title: "Date de Création",
      dataIndex: "date",
      key: "date",
      render: (text) => new Date(text).toLocaleDateString("fr-FR"),
    },
    // {
    //   title: "Category",
    //   dataIndex: "category",
    //   key: "category",
    //   render: (category) => <Tag color="blue">{category}</Tag>,
    // },

    {
      title: "Forfait",
      dataIndex: "forfait",
      key: "forfait",
      render: (text, record) => (
        <div className="flex flex-col gap-1">
          {text && safeRound(text) !== 0 && (
            <Tag color="#f50" className="text-xs font-medium">
              Forfait: {safeFormat(text)} €
            </Tag>
          )}

          {record.items?.some((item) => item.forfait) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {record.items
                .filter((item) => item.forfait)
                .map((item, index) => (
                  <Tag
                    key={`forfait-${index}`}
                    color="#f50"
                    className="text-xs font-medium"
                  >
                    Forfait: {safeFormat(item.forfait)} €
                    {item.quantite > 1 && (
                      <span className="font-bold ml-1">(x{item.quantite})</span>
                    )}
                  </Tag>
                ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Total HT",
      dataIndex: "totalHT",
      key: "totalHT",
      render: (text, record) => {
        const displayTotal =
          record.items?.length > 0
            ? calculateItemTotals(record.items, "montantHT")
            : safeRound(text);

        const itemDetails =
          record.items?.length > 0
            ? record.items.map((item) => safeFormat(item.montantHT) + "€")
            : [safeFormat(text) + "€"];

        return (
          <div className="text-right">
            <div>{`${safeFormat(displayTotal)} €`}</div>
            <div className="text-xs text-gray-500">
              {itemDetails.join(" + ")}
            </div>
          </div>
        );
      },
      sorter: (a, b) => {
        const getTotalHT = (record) =>
          record.items?.length > 0
            ? calculateItemTotals(record.items, "montantHT")
            : safeRound(record.totalHT);
        return getTotalHT(a) - getTotalHT(b);
      },
    },
    // {
    //   title: "Total TVA",
    //   dataIndex: "totalTVA",
    //   key: "totalTVA",
    //   render: (text, record) => {
    //     const displayTotal = record.items?.length > 0
    //       ? calculateItemTotals(record.items, 'montantTVA')
    //       : safeRound(text);

    //     const itemDetails = record.items?.length > 0
    //       ? record.items.map(item => safeFormat(item.montantTVA) + '€')
    //       : [safeFormat(text) + '€'];

    //     return (
    //       <div className="text-right">
    //         <div>{`${safeFormat(displayTotal)} €`}</div>
    //         <div className="text-xs text-gray-500">
    //           {itemDetails.join(' + ')}
    //         </div>
    //       </div>
    //     );
    //   },
    //   sorter: (a, b) => {
    //     const getTotalTVA = (record) => record.items?.length > 0
    //       ? calculateItemTotals(record.items, 'montantTVA')
    //       : safeRound(record.totalTVA);
    //     return getTotalTVA(a) - getTotalTVA(b);
    //   },
    // },
    {
      title: "Prix Total TTC",
      dataIndex: "totalTTC",
      key: "totalTTC",
      render: (text, record) => {
        const displayTotal =
          record.items?.length > 0
            ? calculateItemTotals(record.items, "montantTTC")
            : safeRound(text);

        const itemDetails =
          record.items?.length > 0
            ? record.items.map((item) => safeFormat(item.montantTTC) + "€")
            : [safeFormat(text) + "€"];

        return (
          <div className="text-right">
            <div className="font-medium">{`${safeFormat(displayTotal)} €`}</div>
            <div className="text-xs text-gray-500">
              {itemDetails.join(" + ")}
            </div>
          </div>
        );
      },
      sorter: (a, b) => {
        const getTotalTTC = (record) =>
          record.items?.length > 0
            ? calculateItemTotals(record.items, "montantTTC")
            : safeRound(record.totalTTC);
        return getTotalTTC(a) - getTotalTTC(b);
      },
    },

    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record._id)}
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Télécharger
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            disabled={record.status === "accepté"}
            onClick={() => handleUpdate(record._id)}
            style={{
              backgroundColor: "#1890ff",
              borderColor: "#1890ff",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Modifier
          </Button>
          {record.status === "brouillon" && (
            <Button
              type="primary"
              size="small"
              loading={sendingEmails[record._id] || false}
              onClick={(e) => {
                e.stopPropagation();
                handleSendPdf(record._id, e);
              }}
              title="Envoyer le devis"
              style={{
                backgroundColor: "#1890ff",
                borderColor: "#1890ff",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Envoyé
            </Button>
          )}
  

          {/* Status management buttons - for Admin */}
          {record.status === "envoyé" && (
            <>
              <Button
                type="primary"
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(record._id, "accepté");
                }}
                title="Marquer comme accepté"
              >
                Validé
              </Button>
              <Button
                type="primary"
                danger
                style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(record._id, "refusé");
                }}
                title="Marquer comme refusé"
              >
                Refusé
              </Button>
            </>
          )}
          <Button
            type="primary"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full max-w-6xl overflow-x-hidden px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Devis Récemment Ajoutées
      </h2>

      <Table
        columns={[
          ...columns.map((col) => ({
            ...col,
            title: (
              <div className="flex flex-col items-center">
                <div className="text-xs">{col.title}</div>
              </div>
            ),
            width:
              col.key === "actions"
                ? 150
                : col.key === "reference"
                ? 100
                : col.key === "status"
                ? 120
                : col.key === "date"
                ? 120
                : col.key === "category"
                ? 100
                : col.key === "forfait"
                ? 120
                : col.key === "totalHT"
                ? 100
                : col.key === "totalTTC"
                ? 100
                : undefined,
          })),
        ]}
        dataSource={commands}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
        size="small"
        className="compact-table"
      />
      {selectedCommand && (
        <>
          <GenerateBillingPlan
            command={selectedCommand}
            visible={billingModalVisible}
            onCancel={() => setBillingModalVisible(false)}
            onSuccess={fetchCommands}
          />
          <Modal
            title={`Gestion des Factures - ${selectedCommand.numCommand}`}
            visible={invoicesModalVisible}
            onCancel={() => setInvoicesModalVisible(false)}
            width={1000}
            footer={null}
          >
            <InvoicesManagement
              command={selectedCommand}
              onUpdateCommand={() => {
                handleUpdateCommand(selectedCommand._id);
                fetchCommands(); // Also refresh the entire list
              }}
            />
          </Modal>
        </>
      )}
      {/* {selectedCommand && (
        <Card
          title={`Détails de la commande: ${selectedCommand.code}`}
          className="mt-8 shadow-md"
          bordered
        >
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Type">
              {selectedCommand.command}
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {new Date(selectedCommand.date).toLocaleDateString("fr-FR")}
            </Descriptions.Item>
            <Descriptions.Item label="Nom">
              {selectedCommand.nom}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedCommand.email}
            </Descriptions.Item>
            <Descriptions.Item label="Téléphone">
              {selectedCommand.phone}
            </Descriptions.Item>
            <Descriptions.Item label="SIRET">
              {selectedCommand.siret}
            </Descriptions.Item>
            <Descriptions.Item label="Code Postal">
              {selectedCommand.codepostal}
            </Descriptions.Item>
            <Descriptions.Item label="Ville">
              {selectedCommand.ville}
            </Descriptions.Item>
            <Descriptions.Item label="Adresse">
              {selectedCommand.address}
            </Descriptions.Item>
            <Descriptions.Item label="Raison Sociale">
              {selectedCommand.raissociale}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              <div style={{ lineHeight: "1.5" }}>
                {selectedCommand.description?.map((desc, index) => (
                  <div key={index} style={{ display: "flex", marginBottom: 4 }}>
                    <span style={{ marginRight: 8 }}>•</span>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Quantité">
              {selectedCommand.quantite}
            </Descriptions.Item>
            <Descriptions.Item label="Total HT">
              {safeFormat(selectedCommand.totalHT)} €
            </Descriptions.Item>
            <Descriptions.Item label="Total TVA (5.5%)">
              {safeFormat(selectedCommand.totalTVA)} €
            </Descriptions.Item>
            <Descriptions.Item label="Total TTC">
              {safeFormat(selectedCommand.totalTTC)} €
            </Descriptions.Item>
            <Descriptions.Item label="Numéro de Commande">
              {selectedCommand.originalNumCommand}
            </Descriptions.Item>
            <Descriptions.Item label="Titre">
              <div style={{ lineHeight: "1.5" }}>
                {selectedCommand.code?.map((code, index) => (
                  <div key={index} style={{ display: "flex", marginBottom: 4 }}>
                    <span style={{ marginRight: 8 }}>•</span>
                    <span>{code}</span>
                  </div>
                ))}
              </div>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )} */}
    </div>
  );
};

export default Devis;

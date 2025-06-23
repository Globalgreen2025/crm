import React, { useState, useEffect } from "react";
import {
  Table,
  Space,
  Button,
  message,
  Modal,
  Card,
  Statistic,
  Tag,
  Form,
  Input,
  Select,
  DatePicker,
  Radio,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined,
  SendOutlined,
  CloseOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import { jsPDF } from "jspdf";
import logo from "../assets/logo.jpeg";
import logorge from "../assets/logorge.PNG";

const { confirm } = Modal;

const AllDevis = () => {
  const [devisModalVisible, setDevisModalVisible] = useState(false);
  const [produits, setProduits] = useState([]);
  const TVA = 10;
  const [form] = Form.useForm();
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [chatData, setChatData] = useState([]);

  const [allCommands, setAllCommands] = useState([]);
  const [error, setError] = useState(null);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHT: 0,
    totalTTC: 0,
    totalCommands: 0,
  });
  const [activeFilter, setActiveFilter] = useState("all");
  const token = localStorage.getItem("token");
  const decodedUser = token ? jwtDecode(token) : null;
  // const userLoged = decodedUser?.userId;
  const userRole = decodedUser?.role;
  const [previewImage, setPreviewImage] = useState(false);

  useEffect(() => {
    applyFilter(activeFilter);
  }, [allCommands, activeFilter]);

  const fetchCommands = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get("/command", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API Responssssssssse:", response);
      const commandsData = response?.data;
      const decodedToken = token ? jwtDecode(token) : null;
      const currentUserId = decodedToken?.userId;
      const role = decodedToken.role;
      if (role === "Admin") {
        setAllCommands(commandsData);
        updateStatistics(commandsData);
      } else {
        const filterecommand = commandsData.filter(
          (cmd) => cmd.session === currentUserId
        );

        // Filter commands to display only "devis" type
        const devisCommands = filterecommand.filter(
          (command) => command.command === "devis"
        );
        console.log("devisCommands", devisCommands);

        setAllCommands(devisCommands); // Set only the "devis" commands
        updateStatistics(devisCommands);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching commands:", error);
      message.error("Failed to fetch commands");
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCommands();
  }, []);

  useEffect(() => {
    const fetchProduits = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("/produit", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const allProduits = response.data;
        console.log("Fetched produits:", allProduits);

        setProduits(allProduits);
      } catch (error) {
        console.error("Error fetching produits:", error);
      }
    };

    fetchProduits();
  }, []);

  const generateRandomNumber = (prefix) => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomNum}`;
  };

  const handleCommandTypeChange = (value) => {
    const prefix = value === "devis" ? "D" : "C";
    const randomNumber = generateRandomNumber(prefix);
    form.setFieldsValue({
      numCommand: randomNumber,
    });
  };

  // Handle client selection change
  const handleClientChange = (clientId) => {
    setSelectedLeadId(clientId);
    const selectedClient = chatData.find((client) => client._id === clientId);
    if (selectedClient) {
      form.setFieldsValue({
        nom: selectedClient.nom,
        address: selectedClient.address,
        ville: selectedClient.ville,
        codepostal: selectedClient.codepostal,
        email: selectedClient.email || selectedClient.email1,
        phone: selectedClient.phone,
        siret: selectedClient.siret,
        raissociale: selectedClient.societe,
      });
    }
  };

  const handleSubmitDevis = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const decodedToken = token ? jwtDecode(token) : null;
      const commercialName = decodedToken?.name || decodedToken?.commercialName;

      if (!decodedToken) {
        alert("User not authenticated");
        return;
      }

      // Get current form values including calculated totals
      const formValues = form.getFieldsValue();

      // const commercialId = decodedToken.commercialId || null;
      const formData = {
        ...values,
        totalHT: formValues.totalHT || 0,
        totalTVA: formValues.totalTVA || 0,
        totalTTC: formValues.totalTTC || 0,
        quantite: formValues.quantite || 1,
        forfait: formValues.forfait || 0,
        prixUnitaire: formValues.prixUnitaire || 0,
        session: decodedToken?.userId || decodedToken?.commercialId,
        leadId: selectedLeadId,
        commercialName,
      };

      const response = await axios.post("/command", formData);
      message.success("Devis ajoutée avec succès !");
      setDevisModalVisible(false);
      fetchCommands();
    } catch (error) {
      message.error("Impossible d'ajouter le devis");
      console.error(error);
    }
  };

  const calculateTotals = (quantity, unitPrice) => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    const forfait = parseFloat(form.getFieldValue("forfait")) || 0;
    const tvaRate = parseFloat(form.getFieldValue("TVA")) || 0;

    const baseHT = qty * price;
    // const totalHT = baseHT + forfait;
    const totalHT = baseHT;
    const totalTVA = totalHT * (tvaRate / 100);
    const totalTTC = totalHT + totalTVA;

    form.setFieldsValue({
      totalHT: parseFloat(totalHT.toFixed(2)),
      totalTVA: parseFloat(totalTVA.toFixed(2)),
      totalTTC: parseFloat(totalTTC.toFixed(2)),
      quantite: qty,
      prixUnitaire: price,
    });
  };

  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await axios.get("/data");
        console.log("Fetched data:", response.data);
        setChatData(response.data.chatData);
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, []);

  const applyFilter = (filterType) => {
    let filtered = [];
    switch (filterType) {
      case "en_cours":
        filtered = allCommands.filter((cmd) => cmd.command_type === "devis");
        break;
      case "accepte":
        filtered = allCommands.filter((cmd) => cmd.command_type === "commande");
        console.log("filtered", filtered);
        break;
      case "all":
      default:
        filtered = allCommands;
        break;
    }
    setFilteredCommands(filtered);
    updateStatistics(filtered);
  };

  const handleFilter = (filterType) => {
    setActiveFilter(filterType);
  };

  const updateStatistics = (commands) => {
    const totals = commands.reduce(
      (acc, cmd) => ({
        totalHT: acc.totalHT + (cmd.totalHT || 0),
        totalTTC: acc.totalTTC + (cmd.totalTTC || 0),
        totalCommands: acc.totalCommands + 1,
      }),
      { totalHT: 0, totalTTC: 0, totalCommands: 0 }
    );

    setStats(totals);
  };

  const handleEdit = (record, e) => {
    e.stopPropagation();
    window.location.href = `/leads/${record.lead}/create-command/${record._id}`;
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    confirm({
      title: "Confirmation de suppression",
      icon: <ExclamationCircleOutlined />,
      content: "Êtes-vous sûr de vouloir supprimer ce devis ?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => deleteCommand(id),
    });
  };

  const deleteCommand = async (id) => {
    try {
      await axios.delete(`/command/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Devis supprimé avec succès");
      fetchCommands(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting command:", error);
      message.error("Failed to delete command");
    }
  };

  const safeRender = (value, fallback = "N/A") => {
    return value !== undefined && value !== null ? value : fallback;
  };

  const handleDownload = (commandId, e) => {
    e.stopPropagation();

    const command = allCommands.find((cmd) => cmd._id === commandId);
    if (!command) {
      message.error("Commande non trouvée");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginTop = 0;
    const marginLeft = 5;
    const margin = 8;
    const logoWidth = 40;
    const logoHeight = 25;
    const logoleftwidth = 50;
    const logoleftheight = 40;

    // === Page 1 ===

    // Add logos in top corners
    doc.addImage(
      logo,
      "JPEG",
      marginTop,
      marginTop,
      logoleftwidth,
      logoleftheight
    ); // Left logo
    doc.addImage(
      logorge,
      "PNG",
      pageWidth - marginLeft - logoWidth,
      marginLeft,
      logoWidth,
      logoHeight
    ); // Right logo

    // Company info
    doc.setFontSize(12);
    doc.setTextColor(0, 128, 0);
    doc.setFont(undefined, "Helvetica");
    doc.text("SAS GLOBAL GREEN", pageWidth / 2, 10, { align: "center" });
    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(10);
    doc.text("641 Avenue du grain d'or", pageWidth / 2, 16, {
      align: "center",
    });
    doc.text("41350 Vineuil", pageWidth / 2, 22, { align: "center" });
    doc.text("Tél : 02 54 42 97 74", pageWidth / 2, 28, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Legal information
    doc.setFontSize(6);
    doc.text(
      "SAS au capital de 5000€ - Siret 923 000 234 00014 - NAT 4329A RCS BLOIS - TVA intra FR 62 501 806 657",
      pageWidth / 2,
      32,
      { align: "center" }
    );

    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(11);

    // Configuration
    const LINE_SPACING = 8; // Space between text lines (was 6)
    const UNDERLINE_OFFSET = 1; // Space between text and underline (was 2)
    const DASH_COLOR = 100; // Dark gray
    const LINE_WIDTH = 0.2;
    const SECTION_SPACING = 0.1; // Added space between sections
    doc.setFont(undefined, "Helvetica");
    // Calculate maximum widths
    const leftTexts = [
      `M./Mme. ${command.nom || ""}`,
      `Adresse: ${command.address || ""}`,
      `Ville: ${command.ville || ""}`,
      `Code postal: ${command.codepostal || ""}                        Tél: ${
        command.phone || ""
      }`,
    ];

    const rightTexts = [
      `Conseiller: ${command.commercialName || ""}`,
      `Délai Travaux: ${command.workDelay || ""}`,
    ];

    // Get max widths
    const maxLeftWidth = Math.max(
      ...leftTexts.map(
        (t) =>
          (doc.getStringUnitWidth(t) * doc.internal.getFontSize()) /
          doc.internal.scaleFactor
      )
    );

    const maxRightWidth = Math.max(
      ...rightTexts.map(
        (t) =>
          (doc.getStringUnitWidth(t) * doc.internal.getFontSize()) /
          doc.internal.scaleFactor
      )
    );

    // Improved dashed line function
    function drawUnderline(doc, x, y, width) {
      doc.setDrawColor(DASH_COLOR);
      doc.setLineWidth(LINE_WIDTH);

      const dashPattern = [2, 0.8]; // 3mm dash, 2mm gap
      let currentX = x;

      while (currentX < x + width) {
        const dashEnd = Math.min(currentX + dashPattern[0], x + width);
        doc.line(currentX, y, dashEnd, y);
        currentX += dashPattern[0] + dashPattern[1];
      }

      doc.setDrawColor(0);
    }

    // Draw left section with spacing and added section spacing
    let currentLeftY = 50;
    leftTexts.forEach((text, index) => {
      doc.text(text, margin, currentLeftY);
      drawUnderline(doc, margin, currentLeftY + UNDERLINE_OFFSET, maxLeftWidth);
      // Add extra space after each section except the last one
      currentLeftY +=
        LINE_SPACING + (index < leftTexts.length - 1 ? SECTION_SPACING : 0);
    });

    // Draw right section with spacing and added section spacing
    let currentRightY = 50;
    const rightX = pageWidth - margin - maxRightWidth;

    rightTexts.forEach((text, index) => {
      doc.text(text, rightX, currentRightY);
      drawUnderline(
        doc,
        rightX,
        currentRightY + UNDERLINE_OFFSET,
        maxRightWidth
      );
      // Add extra space after each section except the last one
      currentRightY +=
        LINE_SPACING + (index < rightTexts.length - 1 ? SECTION_SPACING : 0);
    });

    // Order number and date (moved down by 6pt)
    doc.setFontSize(10);

    // Save current text color
    const currentTextColors = doc.getTextColor();
    doc.setFont(undefined, "Helvetica");
    // Draw "Bon de commande N°" in black
    doc.setTextColor(0, 0, 0); // Black
    doc.text(`Bon de commande N° `, margin, 85);

    // Draw the command number in red
    doc.setTextColor(255, 0, 0); // Red
    const prefixWidths =
      (doc.getStringUnitWidth("Bon de commande N° ") *
        doc.internal.getFontSize()) /
      doc.internal.scaleFactor;
    doc.text(`${command.numCommand}`, margin + prefixWidths, 85);

    // Draw date in black (right aligned)
    doc.setTextColor(0, 0, 0); // Black
    doc.text(
      `Du. ${moment(command.date).format("DD/MM/YYYY")}`,
      pageWidth - margin,
      85,
      { align: "right" }
    );

    doc.setTextColor(0, 0, 0); // Black
    const dateText = `Du. ${moment(command.date).format("DD/MM/YYYY")}`;
    doc.text(dateText, pageWidth - margin, 85, { align: "right" });

    // Calculate width of date text
    const dateTextWidth =
      (doc.getStringUnitWidth(dateText) * doc.internal.getFontSize()) /
      doc.internal.scaleFactor;

    // Draw underline aligned with right margin
    const underlineY = 85 + UNDERLINE_OFFSET; // Same Y position as text plus offset
    const underlineX = pageWidth - margin - dateTextWidth; // Right-aligned start position
    drawUnderline(doc, underlineX, underlineY, dateTextWidth);

    // Restore original text color
    doc.setTextColor(currentTextColors);

    doc.setFont(undefined, "Helvetica");
    // Restore original text color
    doc.setTextColor(currentTextColors);
    // Work description header
    doc.setFontSize(9);

    const originalTextColor = doc.getTextColor();

    const descWidth = 100;
    const qteWidth = 15;
    const prixWidth = 30;
    const ttcWidth = 40;

    // Calculate x positions
    const descX = margin;
    const qteX = descX + descWidth;
    const prixX = qteX + qteWidth;
    const ttcX = prixX + prixWidth;

    // Vertical lines positions
    const line1 = descX + descWidth;
    const line2 = line1 + qteWidth;
    const line3 = line2 + prixWidth;

    // Header parameters - ADJUSTED VALUES
    const headerY = 90;
    const headerHeight = 8; // Height of the green background
    const textY = headerY + 6; // Text positioned 6 units down from header top
    const firstLineY = headerY + headerHeight; // First line goes right below header

    // Draw header background (light green)
    doc.setFillColor(217, 234, 211);
    doc.rect(
      margin + 0.2,
      headerY + 0.2,
      pageWidth - 2 * margin - 0.4,
      headerHeight - 0.4,
      "F"
    );

    // Top border line
    doc.line(margin, headerY, pageWidth - margin, headerY);

    // Table headers - bold and centered
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);

    // Calculate center positions
    const descCenter = descX + descWidth / 2;
    const qteCenter = qteX + qteWidth / 2;
    const prixCenter = prixX + prixWidth / 2;
    const ttcCenter = ttcX + ttcWidth / 2;

    doc.text("Descriptif des travaux (Page 1/2)", descCenter, textY, {
      align: "center",
    });
    doc.text("QTÉ", qteCenter, textY, { align: "center" });
    doc.text("PRIX UNITAIRE", prixCenter, textY, { align: "center" });
    doc.text("MONTANT T.T.C", ttcCenter, textY, { align: "center" });

    // Reset to normal font
    doc.setFont(undefined, "normal");

    // Table body parameters
    const tableEndY = pageHeight - 10;
    const rowCount = 10;
    const rowHeights = (tableEndY - firstLineY) / rowCount; // Calculate from firstLineY

    // Draw horizontal lines - STARTING FROM BELOW HEADER
    for (let i = 0; i <= rowCount; i++) {
      const yPos = firstLineY + i * rowHeights;
      doc.line(margin, yPos, pageWidth - margin, yPos);
    }

    // Draw vertical lines (full height)
    doc.line(margin, headerY, margin, tableEndY);
    doc.line(line1, headerY, line1, tableEndY);
    doc.line(line2, headerY, line2, tableEndY);
    doc.line(line3, headerY, line3, tableEndY);
    doc.line(pageWidth - margin, headerY, pageWidth - margin, tableEndY);

    doc.setTextColor(originalTextColor);


// const tableData = [
//   {
//     description: command.title || "N/A",
//     quantity: command.quantite || 1,
//     unitPrice: command.totalHT / (command.quantite || 1), // Calculate unit price
//     total: command.totalTTC || 0
//   }
// ];

// // If you have additional items in command.items
// if (command.items && command.items.length > 0) {
//   command.items.forEach(item => {
//     tableData.push({
//       description: item.title || "N/A",
//       quantity: item.quantity || 1,
//       unitPrice: (item.unitPrice || 0) / (item.quantity || 1), // Calculate unit price
//       total: item.total || 0
//     });
//   });
// }

// // Fill the table with data
// let currentRowY = firstLineY + (rowHeights / 2);

// tableData.forEach((row, rowIndex) => {
//   // Break description into multiple lines if needed
//   const descLines = doc.splitTextToSize(row.description, descWidth - 10);
  
//   // Description (left-aligned)
//   doc.text(descLines, descX + 5, currentRowY);
  
//   // Quantity (centered)
//   doc.text(row.quantity.toString(), qteX + (qteWidth / 2), currentRowY, { align: "center" });
  
//   // Unit Price (right-aligned, calculated as totalHT/quantity)
//   doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth - 5, currentRowY, { align: "right" });
  
//   // Total TTC (right-aligned, kept as original)
//   doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth - 5, currentRowY, { align: "right" });
  
//   currentRowY += rowHeights;
  
//   if (rowIndex >= rowCount - 1) return;
// });


// Generate table data with proper product rows
const tableData = [];

// First check if we have items array
if (command.items && command.items.length > 0) {
  // Create one row per item
  command.items.forEach(item => {
    tableData.push({
      description: item.title || "N/A",
      quantity: item.quantite || 1,
      unitPrice: item.prixUnitaire || 0, // Use direct unit price
      total: item.montantTTC || (item.prixUnitaire * item.quantite * (1 + (item.tva || 0)/100))
    });
  });
} else {
  // Fallback to command-level data
  tableData.push({
    description: command.title || "N/A",
    quantity: command.quantite || 1,
    unitPrice: command.prixUnitaire || (command.totalHT / (command.quantite || 1)),
    total: command.totalTTC || 0
  });
}

// Fill the table with data
let currentRowY = firstLineY + (rowHeights / 2);

tableData.forEach((row, rowIndex) => {
  // Break description into multiple lines if needed
  const descLines = doc.splitTextToSize(row.description, descWidth - 10);
  
  // Description (left-aligned)
  doc.text(descLines, descX + 5, currentRowY);
  
  // Quantity (centered)
  doc.text(row.quantity.toString(), qteX + (qteWidth / 2), currentRowY, { align: "center" });
  
  // Unit Price (right-aligned)
  doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth - 5, currentRowY, { align: "right" });
  
  // Total TTC (right-aligned)
  doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth - 5, currentRowY, { align: "right" });
  
  currentRowY += rowHeights;
  
  if (rowIndex >= rowCount - 1) return;
});


    // === Page 2 ======================================================================================
    doc.addPage();

    doc.addImage(
      logo,
      "JPEG",
      marginTop,
      marginTop,
      logoleftwidth,
      logoleftheight
    ); // Left logo
    doc.addImage(
      logorge,
      "PNG",
      pageWidth - marginLeft - logoWidth,
      marginLeft,
      logoWidth,
      logoHeight
    ); // Right logo

    // Company info
    doc.setFontSize(12);
    doc.setTextColor(0, 128, 0);
    doc.setFont(undefined, "bold");
    doc.text("SAS GLOBAL GREEN", pageWidth / 2, 10, { align: "center" });
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    doc.text("641 Avenue du grain d'or", pageWidth / 2, 16, {
      align: "center",
    });
    doc.text("41350 Vineuil", pageWidth / 2, 22, { align: "center" });
    doc.text("Tél : 02 54 42 97 74", pageWidth / 2, 28, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Legal information
    doc.setFontSize(6);
    doc.text(
      "SAS au capital de 5000€ - Siret 923 000 234 00014 - NAT 4329A RCS BLOIS - TVA intra FR 62 501 806 657",
      pageWidth / 2,
      32,
      { align: "center" }
    );
    doc.setFontSize(10);

    // Draw "Bon de commande N°" in black
    doc.setTextColor(0, 0, 0); // Black
    doc.text(`Bon de commande N° `, margin, 50);

    // Draw the command number in red
    doc.setTextColor(255, 0, 0); // Red
    const prefixWidth =
      (doc.getStringUnitWidth("Bon de commande N° ") *
        doc.internal.getFontSize()) /
      doc.internal.scaleFactor;
    doc.text(`${command.numCommand}`, margin + prefixWidth, 50);

    // Draw date in black (right aligned)
    doc.setTextColor(0, 0, 0); // Black
    doc.text(
      `Du. ${moment(command.date).format("DD/MM/YYYY")}`,
      pageWidth - margin,
      50,
      { align: "right" }
    );
    // Draw date in black (right aligned)
    doc.setTextColor(0, 0, 0); // Black
    const dateTexts = `Du. ${moment(command.date).format("DD/MM/YYYY")}`;
    doc.text(dateTexts, pageWidth - margin, 50, { align: "right" });

    // Calculate width of date text
    const dateTextWidths =
      (doc.getStringUnitWidth(dateTexts) * doc.internal.getFontSize()) /
      doc.internal.scaleFactor;

    // Draw underline aligned with right margin
    const underlineYs = 50 + UNDERLINE_OFFSET; // Position below the text
    const underlineXs = pageWidth - margin - dateTextWidths; // Right-aligned start
    drawUnderline(doc, underlineXs, underlineYs, dateTextWidths);

    // Restore original text color
    doc.setTextColor(currentTextColors);

    // // === Common Constants ===
    const TABLE_ROW_HEIGHT = 15; // Increased from 8 to 10 for better spacing

    // };
    // === Common Constants ===
    const BODY_ROW_HEIGHT = 15; // Height of body rows
    const HEADER_ROW_HEIGHT = 6; // Smaller header height (reduced from 15)
    const ROWS_PER_PAGE = 6;

    // Column widths
    const DESC_WIDTH = 100;
    const QTY_WIDTH = 15;
    const UNIT_PRICE_WIDTH = 30;
    const TOTAL_WIDTH = 40;

    // Column positions
    const DESC_X = margin;
    const QTY_X = DESC_X + DESC_WIDTH;
    const UNIT_PRICE_X = QTY_X + QTY_WIDTH;
    const TOTAL_X = UNIT_PRICE_X + UNIT_PRICE_WIDTH;

    // Vertical line positions
    const LINE1 = DESC_X + DESC_WIDTH;
    const LINE2 = QTY_X + QTY_WIDTH;
    const LINE3 = UNIT_PRICE_X + UNIT_PRICE_WIDTH;

    const drawTableFrame = (startY, pageNum) => {
      // Define header background color (light green)
      const headerBgColor = [217, 234, 211];

      // Draw smaller header background
      doc.setFillColor(...headerBgColor);
      doc.rect(
        margin + 0.2,
        startY + 0.2,
        pageWidth - 2 * margin - 0.4,
        HEADER_ROW_HEIGHT - 0.4,
        "F"
      );

      // Header top border
      doc.line(margin, startY, pageWidth - margin, startY);

      // Header text (adjusted for smaller height)
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      const textY = startY + HEADER_ROW_HEIGHT / 2 + 1; // Better vertical centering
      doc.text('Descriptif des travaux (Page 2/2)',
        DESC_X + DESC_WIDTH / 2,
        textY,
        { align: "center" }
      );
      doc.text("QTÉ", QTY_X + QTY_WIDTH / 2, textY, { align: "center" });
      doc.text("PRIX UNITAIRE", UNIT_PRICE_X + UNIT_PRICE_WIDTH / 2, textY, {
        align: "center",
      });
      doc.text("MONTANT T.T.C", TOTAL_X + TOTAL_WIDTH / 2, textY, {
        align: "center",
      });
      doc.setFont(undefined, "normal");

      // Draw horizontal lines
      // 1. Header bottom line
      doc.line(
        margin,
        startY + HEADER_ROW_HEIGHT,
        pageWidth - margin,
        startY + HEADER_ROW_HEIGHT
      );

      // 2. Body rows (taller than header)
      for (let i = 1; i <= ROWS_PER_PAGE; i++) {
        const yPos = startY + HEADER_ROW_HEIGHT + i * BODY_ROW_HEIGHT;
        doc.line(margin, yPos, pageWidth - margin, yPos);
      }

      // Vertical lines (full height)
      const tableBottom =
        startY + HEADER_ROW_HEIGHT + ROWS_PER_PAGE * BODY_ROW_HEIGHT;
      doc.line(margin, startY, margin, tableBottom);
      doc.line(LINE1, startY, LINE1, tableBottom);
      doc.line(LINE2, startY, LINE2, tableBottom);
      doc.line(LINE3, startY, LINE3, tableBottom);
      doc.line(pageWidth - margin, startY, pageWidth - margin, tableBottom);
    };


    const addPaymentSection = (startY) => {
      const tableWidth = pageWidth - 2 * margin;
      const rowHeight = 10;
      const primeRowHeight = 15; // Increased height for Prime CEE row
      const col1Width = 120;
      const col2Width = 40;
    
      // Adjust starting position
      const adjustedStartY = startY + 6;
    
      // Adjust main table frame height to accommodate additional row
      doc.rect(
        margin,
        adjustedStartY,
        tableWidth,
        primeRowHeight + rowHeight * 5 // Changed from 4 to 5
      );
    
      // Prime CEE row (special taller section)
      doc.line(margin, adjustedStartY, margin + col1Width, adjustedStartY);
      doc.line(
        margin + col1Width,
        adjustedStartY,
        margin + col1Width,
        adjustedStartY + primeRowHeight
      );
      doc.line(
        margin + col1Width + col2Width,
        adjustedStartY,
        margin + col1Width + col2Width,
        adjustedStartY + primeRowHeight
      );
    
      // Horizontal lines for main rows (now 5 rows instead of 4)
      for (let i = 1; i <= 5; i++) { // Changed from 4 to 5
        const yPos = adjustedStartY + primeRowHeight + i * rowHeight - rowHeight;
        doc.line(margin, yPos, margin + tableWidth, yPos);
      }
    
      // Vertical lines (extended for additional row)
      doc.line(
        margin + col1Width,
        adjustedStartY + primeRowHeight,
        margin + col1Width,
        adjustedStartY + primeRowHeight + rowHeight * 5 // Changed from 4 to 5
      );
      doc.line(
        margin + col1Width + col2Width,
        adjustedStartY + primeRowHeight,
        margin + col1Width + col2Width,
        adjustedStartY + primeRowHeight + rowHeight * 5 // Changed from 4 to 5
      );
    
      // Prime CEE section (unchanged)
      doc.setFillColor(220, 230, 241);
      doc.rect(
        margin + 0.2,
        adjustedStartY + 0.2,
        col1Width - 0.4,
        primeRowHeight - 0.4,
        "F"
      );
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Prime correspondant à la prime CEE", margin + 2, adjustedStartY + 5);
      doc.text("d'incitation aux travaux d'économie d'énergie:", margin + 2, adjustedStartY + 10);
      
      // Checkboxes (unchanged)
      doc.setFont(undefined, "bold");
      doc.rect(margin + col1Width + 10, adjustedStartY + primeRowHeight / 2 - 3, 10, 6);
      doc.text("OUI", margin + col1Width + 12, adjustedStartY + primeRowHeight / 2 + 1);
      doc.rect(margin + col1Width + col2Width + 10, adjustedStartY + primeRowHeight / 2 - 3, 10, 6);
      doc.text("NON", margin + col1Width + col2Width + 12, adjustedStartY + primeRowHeight / 2 + 1);
    
      // MODE DE RÈGLEMENT section (yellow background)
      const firstNormalRowY = adjustedStartY + primeRowHeight;
      doc.setFillColor(255, 255, 153);
      doc.rect(margin + 0.2, firstNormalRowY + 0.2, col1Width - 0.4, rowHeight - 0.4, "F");
      doc.setFont(undefined, "bold");
      doc.text("MODE DE RÈGLEMENT:", margin + 2, firstNormalRowY + 5);
    
      // TOTAL HT row
      doc.setFont(undefined, "bold");
      doc.text("TOTAL HT", margin + col1Width + 2, firstNormalRowY + 5);
      doc.text(
        `${command.totalHT || ""} €`,
        margin + col1Width + col2Width + 26,
        firstNormalRowY + 5,
        { align: "right" }
      );

      const forfaitValue = command.forfait || 
      (command.items && command.items.length > 0 && command.items[0].forfait) || 
      0;
    
      // NEW: Forfait tarif forfait row
      doc.text("Tarif forfait", margin + col1Width + 2, firstNormalRowY + rowHeight + 5);
      doc.text(
        `${forfaitValue || ""} €`,
        margin + col1Width + col2Width + 26,
        firstNormalRowY + rowHeight + 5,
        { align: "right" }
      );
    
      // Acompte row (moved down)
      doc.text("Acompte après 8 Jours", margin + 2, firstNormalRowY + rowHeight * 2 + 5);
      doc.text("TVA(10%)", margin + col1Width + 2, firstNormalRowY + rowHeight * 2 + 5);
      doc.text(
        `${command.totalTVA || ""} €`,
        margin + col1Width + col2Width + 26,
        firstNormalRowY + rowHeight * 2 + 5,
        { align: "right" }
      );
    
      // Solde row (moved down)
      doc.text("Solde aux travaux", margin + 2, firstNormalRowY + rowHeight * 3 + 5);
      doc.text("PRIME CEE", margin + col1Width + 2, firstNormalRowY + rowHeight * 3 + 5);
      doc.text(
        `${command.primeCEE || ""} €`,
        margin + col1Width + col2Width + 26,
        firstNormalRowY + rowHeight * 3 + 5,
        { align: "right" }
      );
    
      // MONTANT TOTAL DU (moved down)
      const totalRowY = firstNormalRowY + rowHeight * 4;
      doc.setFillColor(217, 234, 211);
      doc.rect(margin + col1Width + 0.2, totalRowY + 0.2, col2Width - 0.4, rowHeight - 0.4, "F");
      doc.setFont(undefined, "bold");
      doc.text("TOTAL DU", margin + col1Width + 2, totalRowY + 5);
      
      doc.setFont(undefined, "bold");
      doc.text("Fait à:                                   Le:", margin + 2, totalRowY + 5);
      doc.text(
        `${command.totalFinal || ""} €`,
        margin + col1Width + col2Width + 26,
        totalRowY + 5,
        { align: "right" }
      );
    
      // Adjust return value for additional row
      return adjustedStartY + primeRowHeight + rowHeight * 5;
    };
    // const addPaymentSection = (startY) => {
    //   const tableWidth = pageWidth - 2 * margin;
    //   const rowHeight = 10;
    //   const primeRowHeight = 15; // Increased height for Prime CEE row
    //   const col1Width = 120;
    //   const col2Width = 40;

    //   // Calculate the correct starting position (adjusted from old version)
    //   const adjustedStartY = startY + 6; // This pushes it down by 15 units

    //   // Main table frame (adjusted for taller first row)
    //   doc.rect(
    //     margin,
    //     adjustedStartY,
    //     tableWidth,
    //     primeRowHeight + rowHeight * 4
    //   );

    //   // Prime CEE row (special taller section)
    //   doc.line(margin, adjustedStartY, margin + col1Width, adjustedStartY);
    //   doc.line(
    //     margin + col1Width,
    //     adjustedStartY,
    //     margin + col1Width,
    //     adjustedStartY + primeRowHeight
    //   );
    //   doc.line(
    //     margin + col1Width + col2Width,
    //     adjustedStartY,
    //     margin + col1Width + col2Width,
    //     adjustedStartY + primeRowHeight
    //   );

    //   // Horizontal lines for main rows (starting after taller row)
    //   for (let i = 1; i <= 4; i++) {
    //     const yPos =
    //       adjustedStartY + primeRowHeight + i * rowHeight - rowHeight;
    //     doc.line(margin, yPos, margin + tableWidth, yPos);
    //   }

    //   // Vertical lines (full height)
    //   doc.line(
    //     margin + col1Width,
    //     adjustedStartY + primeRowHeight,
    //     margin + col1Width,
    //     adjustedStartY + primeRowHeight + rowHeight * 4
    //   );
    //   doc.line(
    //     margin + col1Width + col2Width,
    //     adjustedStartY + primeRowHeight,
    //     margin + col1Width + col2Width,
    //     adjustedStartY + primeRowHeight + rowHeight * 4
    //   );

    //   // Prime CEE text with light blue background and increased height
    //   doc.setFillColor(220, 230, 241);
    //   doc.rect(
    //     margin + 0.2,
    //     adjustedStartY + 0.2,
    //     col1Width - 0.4,
    //     primeRowHeight - 0.4,
    //     "F"
    //   );
    //   doc.setFontSize(9);
    //   doc.setFont(undefined, "bold");

    //   // Split the long text into two lines
    //   const primeText1 = "Prime correspondant à la prime CEE";
    //   const primeText2 = "d'incitation aux travaux d'économie d'énergie:";

    //   doc.text(primeText1, margin + 2, adjustedStartY + 5);
    //   doc.text(primeText2, margin + 2, adjustedStartY + 10);

    //   // Checkboxes positioned relative to taller row
    //   doc.setFont(undefined, "normal");
    //   doc.rect(
    //     margin + col1Width + 10,
    //     adjustedStartY + primeRowHeight / 2 - 3,
    //     10,
    //     6
    //   );
    //   doc.text(
    //     "OUI",
    //     margin + col1Width + 12,
    //     adjustedStartY + primeRowHeight / 2 + 1
    //   );
    //   doc.rect(
    //     margin + col1Width + col2Width + 10,
    //     adjustedStartY + primeRowHeight / 2 - 3,
    //     10,
    //     6
    //   );
    //   doc.text(
    //     "NON",
    //     margin + col1Width + col2Width + 12,
    //     adjustedStartY + primeRowHeight / 2 + 1
    //   );

    //   // MODE DE RÈGLEMENT (yellow) - adjusted y-position for taller first row
    //   const firstNormalRowY = adjustedStartY + primeRowHeight;
    //   doc.setFillColor(255, 255, 153);
    //   doc.rect(
    //     margin + 0.2,
    //     firstNormalRowY + 0.2,
    //     col1Width - 0.4,
    //     rowHeight - 0.4,
    //     "F"
    //   );
    //   doc.setFont(undefined, "bold");
    //   doc.text("MODE DE RÈGLEMENT:", margin + 2, firstNormalRowY + 5);

    //   // Rest of the row
    //   doc.setFont(undefined, "normal");
    //   doc.text("TOTAL HT", margin + col1Width + 2, firstNormalRowY + 5);
    //   doc.text(
    //     `${command.totalHT || ""} €`,
    //     margin + col1Width + col2Width + 26,
    //     firstNormalRowY + 5,
    //     { align: "right" }
    //   );

    //   // Acompte row (no background)
    //   doc.text(
    //     "Acompte après 8 Jours",
    //     margin + 2,
    //     firstNormalRowY + rowHeight + 5
    //   );
    //   doc.text(
    //     "TVA(10%)",
    //     margin + col1Width + 2,
    //     firstNormalRowY + rowHeight + 5
    //   );
    //   doc.text(
    //     `${command.totalTVA || ""} €`,
    //     margin + col1Width + col2Width + 26,
    //     firstNormalRowY + rowHeight + 5,
    //     { align: "right" }
    //   );

    //   // Solde row (no background)
    //   doc.text(
    //     "Solde aux travaux",
    //     margin + 2,
    //     firstNormalRowY + rowHeight * 2 + 5
    //   );
    //   doc.text(
    //     "PRIME CEE",
    //     margin + col1Width + 2,
    //     firstNormalRowY + rowHeight * 2 + 5
    //   );
    //   doc.text(
    //     `${command.primeCEE || ""} €`,
    //     margin + col1Width + col2Width + 26,
    //     firstNormalRowY + rowHeight * 2 + 5,
    //     { align: "right" }
    //   );

    //   // MONTANT TOTAL DU (light green)
    //   doc.setFillColor(217, 234, 211);
    //   doc.rect(
    //     margin + col1Width + 0.2,
    //     firstNormalRowY + rowHeight * 3 + 0.2,
    //     col2Width - 0.4,
    //     rowHeight - 0.4,
    //     "F"
    //   );
    //   doc.setFont(undefined, "bold");
    //   doc.text(
    //     "TOTAL DU",
    //     margin + col1Width + 2,
    //     firstNormalRowY + rowHeight * 3 + 5
    //   );

    //   // Rest of the row
    //   doc.setFont(undefined, "normal");
    //   doc.text(
    //     "Fait à:                      Le:",
    //     margin + 2,
    //     firstNormalRowY + rowHeight * 3 + 5
    //   );
    //   doc.text(
    //     `${command.totalFinal || ""} €`,
    //     margin + col1Width + col2Width + 26,
    //     firstNormalRowY + rowHeight * 3 + 5,
    //     { align: "right" }
    //   );

    //   return adjustedStartY + primeRowHeight + rowHeight * 4;
    // };

    // Draw table frame for page 2 with increased row height
    const tableStartY2 = 55;
    const tableEndY2 = tableStartY2 + ROWS_PER_PAGE * TABLE_ROW_HEIGHT;
    drawTableFrame(tableStartY2, tableEndY2, 2);

    // Payment section with increased row height
    const paymentStartY = tableEndY2; // Reduced gap to connect tables
    const signatureY = addPaymentSection(paymentStartY) + 20;

    // Signature section
    doc.text("Signature du conseiller", 30, signatureY);
    doc.text("Signature du client", 120, signatureY);

    const legalText = [
      {
        text: "Je soussigné......déclare avoir reçu l'information précontractuelle avant la signature de la présente commande et avoir accepté les conditions ci-dessus et au recto. Je reconnais rester en possession d'un double du présent bon de commande, doté d'un formulaire détachable de rétractation.",
        style: "paragraph",
      },
      {
        text: "- Je déclare, conformément à l'article L. 223-2 du Code de la Consommation, avoir été informé de mon droit d'inscription sur les fichiers bloc tel.",
        style: "bullet",
      },
      {
        text: "- Je déclare avoir en ma possession la notice explicative détaillée du ou des produits énoncés ci-dessus",
        style: "bullet",
      },
    ];

    // Styling Configuration
    const LEGAL_FONT_SIZE = 9;
    const LINE_HEIGHT = 5;
    const BULLET_INDENT = 5;
    const MAX_WIDTH = pageWidth - 2 * margin;

    // Draw the professional legal section
    let currentY = signatureY + 15;

    // Add subtle top border
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, currentY - 3, pageWidth - margin, currentY - 3);
    doc.setDrawColor(0);

    // Legal text header
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    // doc.text("DECLARATIONS LEGALES", pageWidth / 2, currentY, { align: "center" });
    currentY += LINE_HEIGHT + 2;

    doc.setFontSize(LEGAL_FONT_SIZE);
    doc.setFont(undefined, "normal");

    legalText.forEach((item) => {
      const options = {
        maxWidth: MAX_WIDTH,
        align: "justify",
      };

      if (item.style === "paragraph") {
        // Split long text into multiple lines automatically
        const lines = doc.splitTextToSize(item.text, MAX_WIDTH);
        lines.forEach((line) => {
          doc.text(line, margin, currentY, options);
          currentY += LINE_HEIGHT;
        });
        currentY += 2; // Extra space after paragraph
      } else if (item.style === "bullet") {
        // Handle bullet points with proper indentation
        doc.text("•", margin, currentY);
        const bulletText = item.text.substring(1); // Remove the '-' from original
        const bulletLines = doc.splitTextToSize(
          bulletText,
          MAX_WIDTH - BULLET_INDENT
        );

        bulletLines.forEach((line, i) => {
          const xPos =
            i === 0 ? margin + BULLET_INDENT : margin + BULLET_INDENT;
          doc.text(line, xPos, currentY, {
            maxWidth: MAX_WIDTH - BULLET_INDENT,
            align: "left",
          });
          currentY += LINE_HEIGHT;
        });
      }
    });

    // Add signature lines
    currentY += 10;
    doc.setDrawColor(0);
    doc.setFontSize(10);
    // Save the PDF
    doc.save(`Bon_de_commande_${command.numCommand}.pdf`);
  };

  const handleSendPdf = async (commandId, e) => {
    e.stopPropagation();

    const command = allCommands.find((cmd) => cmd._id === commandId);
    if (command.command_type !== "devis") {
      return message.warning(
        "Le devis est déjà validé et converti en commande."
      );
    }

    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginTop = 0;
    const marginLeft = 5;
    const margin = 8;
    const logoWidth = 40;
    const logoHeight = 25;
    const logoleftwidth = 50;
    const logoleftheight = 40;

    // === Page 1 ===

    // Add logos in top corners
    doc.addImage(
      logo,
      "JPEG",
      marginTop,
      marginTop,
      logoleftwidth,
      logoleftheight
    ); // Left logo
    doc.addImage(
      logorge,
      "PNG",
      pageWidth - marginLeft - logoWidth,
      marginLeft,
      logoWidth,
      logoHeight
    ); // Right logo

    // Company info
    doc.setFontSize(12);
    doc.setTextColor(0, 128, 0);
    doc.setFont(undefined, "Helvetica");
    doc.text("SAS GLOBAL GREEN", pageWidth / 2, 10, { align: "center" });
    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(10);
    doc.text("641 Avenue du grain d'or", pageWidth / 2, 16, {
      align: "center",
    });
    doc.text("41350 Vineuil", pageWidth / 2, 22, { align: "center" });
    doc.text("Tél : 02 54 42 97 74", pageWidth / 2, 28, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Legal information
    doc.setFontSize(6);
    doc.text(
      "SAS au capital de 5000€ - Siret 923 000 234 00014 - NAT 4329A RCS BLOIS - TVA intra FR 62 501 806 657",
      pageWidth / 2,
      32,
      { align: "center" }
    );

    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(11);

    // Configuration
    const LINE_SPACING = 8; // Space between text lines (was 6)
    const UNDERLINE_OFFSET = 1; // Space between text and underline (was 2)
    const DASH_COLOR = 100; // Dark gray
    const LINE_WIDTH = 0.2;
    const SECTION_SPACING = 0.1; // Added space between sections
    doc.setFont(undefined, "Helvetica");
    // Calculate maximum widths
    const leftTexts = [
      `M./Mme. ${command.nom || ""}`,
      `Adresse: ${command.address || ""}`,
      `Ville: ${command.ville || ""}`,
      `Code postal: ${command.codepostal || ""}                        Tél: ${
        command.phone || ""
      }`,
    ];

    const rightTexts = [
      `Conseiller: ${command.commercialName || ""}`,
      `Délai Travaux: ${command.workDelay || ""}`,
    ];

    // Get max widths
    const maxLeftWidth = Math.max(
      ...leftTexts.map(
        (t) =>
          (doc.getStringUnitWidth(t) * doc.internal.getFontSize()) /
          doc.internal.scaleFactor
      )
    );

    const maxRightWidth = Math.max(
      ...rightTexts.map(
        (t) =>
          (doc.getStringUnitWidth(t) * doc.internal.getFontSize()) /
          doc.internal.scaleFactor
      )
    );

    // Improved dashed line function
    function drawUnderline(doc, x, y, width) {
      doc.setDrawColor(DASH_COLOR);
      doc.setLineWidth(LINE_WIDTH);

      const dashPattern = [2, 0.8]; // 3mm dash, 2mm gap
      let currentX = x;

      while (currentX < x + width) {
        const dashEnd = Math.min(currentX + dashPattern[0], x + width);
        doc.line(currentX, y, dashEnd, y);
        currentX += dashPattern[0] + dashPattern[1];
      }

      doc.setDrawColor(0);
    }

    // Draw left section with spacing and added section spacing
    let currentLeftY = 50;
    leftTexts.forEach((text, index) => {
      doc.text(text, margin, currentLeftY);
      drawUnderline(doc, margin, currentLeftY + UNDERLINE_OFFSET, maxLeftWidth);
      // Add extra space after each section except the last one
      currentLeftY +=
        LINE_SPACING + (index < leftTexts.length - 1 ? SECTION_SPACING : 0);
    });

    // Draw right section with spacing and added section spacing
    let currentRightY = 50;
    const rightX = pageWidth - margin - maxRightWidth;

    rightTexts.forEach((text, index) => {
      doc.text(text, rightX, currentRightY);
      drawUnderline(
        doc,
        rightX,
        currentRightY + UNDERLINE_OFFSET,
        maxRightWidth
      );
      // Add extra space after each section except the last one
      currentRightY +=
        LINE_SPACING + (index < rightTexts.length - 1 ? SECTION_SPACING : 0);
    });

    // Order number and date (moved down by 6pt)
    doc.setFontSize(10);

    // Save current text color
    const currentTextColors = doc.getTextColor();
    doc.setFont(undefined, "Helvetica");
    // Draw "Bon de commande N°" in black
    doc.setTextColor(0, 0, 0); // Black
    doc.text(`Bon de commande N° `, margin, 85);

    // Draw the command number in red
    doc.setTextColor(255, 0, 0); // Red
    const prefixWidths =
      (doc.getStringUnitWidth("Bon de commande N° ") *
        doc.internal.getFontSize()) /
      doc.internal.scaleFactor;
    doc.text(`${command.numCommand}`, margin + prefixWidths, 85);

    // Draw date in black (right aligned)
    doc.setTextColor(0, 0, 0); // Black
    doc.text(
      `Du. ${moment(command.date).format("DD/MM/YYYY")}`,
      pageWidth - margin,
      85,
      { align: "right" }
    );

    doc.setTextColor(0, 0, 0); // Black
    const dateText = `Du. ${moment(command.date).format("DD/MM/YYYY")}`;
    doc.text(dateText, pageWidth - margin, 85, { align: "right" });

    // Calculate width of date text
    const dateTextWidth =
      (doc.getStringUnitWidth(dateText) * doc.internal.getFontSize()) /
      doc.internal.scaleFactor;

    // Draw underline aligned with right margin
    const underlineY = 85 + UNDERLINE_OFFSET; // Same Y position as text plus offset
    const underlineX = pageWidth - margin - dateTextWidth; // Right-aligned start position
    drawUnderline(doc, underlineX, underlineY, dateTextWidth);

    // Restore original text color
    doc.setTextColor(currentTextColors);

    doc.setFont(undefined, "Helvetica");
    // Restore original text color
    doc.setTextColor(currentTextColors);
    // Work description header
    doc.setFontSize(9);

    const originalTextColor = doc.getTextColor();

    const descWidth = 100;
    const qteWidth = 15;
    const prixWidth = 30;
    const ttcWidth = 40;

    // Calculate x positions
    const descX = margin;
    const qteX = descX + descWidth;
    const prixX = qteX + qteWidth;
    const ttcX = prixX + prixWidth;

    // Vertical lines positions
    const line1 = descX + descWidth;
    const line2 = line1 + qteWidth;
    const line3 = line2 + prixWidth;

    // Header parameters - ADJUSTED VALUES
    const headerY = 90;
    const headerHeight = 8; // Height of the green background
    const textY = headerY + 6; // Text positioned 6 units down from header top
    const firstLineY = headerY + headerHeight; // First line goes right below header

    // Draw header background (light green)
    doc.setFillColor(217, 234, 211);
    doc.rect(
      margin + 0.2,
      headerY + 0.2,
      pageWidth - 2 * margin - 0.4,
      headerHeight - 0.4,
      "F"
    );

    // Top border line
    doc.line(margin, headerY, pageWidth - margin, headerY);

    // Table headers - bold and centered
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);

    // Calculate center positions
    const descCenter = descX + descWidth / 2;
    const qteCenter = qteX + qteWidth / 2;
    const prixCenter = prixX + prixWidth / 2;
    const ttcCenter = ttcX + ttcWidth / 2;

    doc.text("Descriptif des travaux (Page 1/2)", descCenter, textY, {
      align: "center",
    });
    doc.text("QTÉ", qteCenter, textY, { align: "center" });
    doc.text("PRIX UNITAIRE", prixCenter, textY, { align: "center" });
    doc.text("MONTANT T.T.C", ttcCenter, textY, { align: "center" });

    // Reset to normal font
    doc.setFont(undefined, "normal");

    // Table body parameters
    const tableEndY = pageHeight - 10;
    const rowCount = 10;
    const rowHeights = (tableEndY - firstLineY) / rowCount; // Calculate from firstLineY

    // Draw horizontal lines - STARTING FROM BELOW HEADER
    for (let i = 0; i <= rowCount; i++) {
      const yPos = firstLineY + i * rowHeights;
      doc.line(margin, yPos, pageWidth - margin, yPos);
    }

    // Draw vertical lines (full height)
    doc.line(margin, headerY, margin, tableEndY);
    doc.line(line1, headerY, line1, tableEndY);
    doc.line(line2, headerY, line2, tableEndY);
    doc.line(line3, headerY, line3, tableEndY);
    doc.line(pageWidth - margin, headerY, pageWidth - margin, tableEndY);

    doc.setTextColor(originalTextColor);


    const tableData = [];

    // First check if we have items array
    if (command.items && command.items.length > 0) {
      // Create one row per item
      command.items.forEach(item => {
        tableData.push({
          description: item.title || "N/A",
          quantity: item.quantite || 1,
          unitPrice: item.prixUnitaire || 0, // Use direct unit price
          total: item.montantTTC || (item.prixUnitaire * item.quantite * (1 + (item.tva || 0)/100))
        });
      });
    } else {
      // Fallback to command-level data
      tableData.push({
        description: command.title || "N/A",
        quantity: command.quantite || 1,
        unitPrice: command.prixUnitaire || (command.totalHT / (command.quantite || 1)),
        total: command.totalTTC || 0
      });
    }
    
    // Fill the table with data
    let currentRowY = firstLineY + (rowHeights / 2);
    
    tableData.forEach((row, rowIndex) => {
      // Break description into multiple lines if needed
      const descLines = doc.splitTextToSize(row.description, descWidth - 10);
      
      // Description (left-aligned)
      doc.text(descLines, descX + 5, currentRowY);
      
      // Quantity (centered)
      doc.text(row.quantity.toString(), qteX + (qteWidth / 2), currentRowY, { align: "center" });
      
      // Unit Price (right-aligned)
      doc.text(`${row.unitPrice.toFixed(2)} €`, prixX + prixWidth - 5, currentRowY, { align: "right" });
      
      // Total TTC (right-aligned)
      doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth - 5, currentRowY, { align: "right" });
      
      currentRowY += rowHeights;
      
      if (rowIndex >= rowCount - 1) return;
    });




    // === Page 2 ======================================================================================
    doc.addPage();

    doc.addImage(
      logo,
      "JPEG",
      marginTop,
      marginTop,
      logoleftwidth,
      logoleftheight
    ); // Left logo
    doc.addImage(
      logorge,
      "PNG",
      pageWidth - marginLeft - logoWidth,
      marginLeft,
      logoWidth,
      logoHeight
    ); // Right logo

    // Company info
    doc.setFontSize(12);
    doc.setTextColor(0, 128, 0);
    doc.setFont(undefined, "bold");
    doc.text("SAS GLOBAL GREEN", pageWidth / 2, 10, { align: "center" });
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    doc.text("641 Avenue du grain d'or", pageWidth / 2, 16, {
      align: "center",
    });
    doc.text("41350 Vineuil", pageWidth / 2, 22, { align: "center" });
    doc.text("Tél : 02 54 42 97 74", pageWidth / 2, 28, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Legal information
    doc.setFontSize(6);
    doc.text(
      "SAS au capital de 5000€ - Siret 923 000 234 00014 - NAT 4329A RCS BLOIS - TVA intra FR 62 501 806 657",
      pageWidth / 2,
      32,
      { align: "center" }
    );
    doc.setFontSize(10);

    // Draw "Bon de commande N°" in black
    doc.setTextColor(0, 0, 0); // Black
    doc.text(`Bon de commande N° `, margin, 50);

    // Draw the command number in red
    doc.setTextColor(255, 0, 0); // Red
    const prefixWidth =
      (doc.getStringUnitWidth("Bon de commande N° ") *
        doc.internal.getFontSize()) /
      doc.internal.scaleFactor;
    doc.text(`${command.numCommand}`, margin + prefixWidth, 50);

    // Draw date in black (right aligned)
    doc.setTextColor(0, 0, 0); // Black
    doc.text(
      `Du. ${moment(command.date).format("DD/MM/YYYY")}`,
      pageWidth - margin,
      50,
      { align: "right" }
    );
    // Draw date in black (right aligned)
    doc.setTextColor(0, 0, 0); // Black
    const dateTexts = `Du. ${moment(command.date).format("DD/MM/YYYY")}`;
    doc.text(dateTexts, pageWidth - margin, 50, { align: "right" });

    // Calculate width of date text
    const dateTextWidths =
      (doc.getStringUnitWidth(dateTexts) * doc.internal.getFontSize()) /
      doc.internal.scaleFactor;

    // Draw underline aligned with right margin
    const underlineYs = 50 + UNDERLINE_OFFSET; // Position below the text
    const underlineXs = pageWidth - margin - dateTextWidths; // Right-aligned start
    drawUnderline(doc, underlineXs, underlineYs, dateTextWidths);

    // Restore original text color
    doc.setTextColor(currentTextColors);

    // // === Common Constants ===
    const TABLE_ROW_HEIGHT = 15; // Increased from 8 to 10 for better spacing

    // };
    // === Common Constants ===
    const BODY_ROW_HEIGHT = 15; // Height of body rows
    const HEADER_ROW_HEIGHT = 6; // Smaller header height (reduced from 15)
    const ROWS_PER_PAGE = 6;

    // Column widths
    const DESC_WIDTH = 100;
    const QTY_WIDTH = 15;
    const UNIT_PRICE_WIDTH = 30;
    const TOTAL_WIDTH = 40;

    // Column positions
    const DESC_X = margin;
    const QTY_X = DESC_X + DESC_WIDTH;
    const UNIT_PRICE_X = QTY_X + QTY_WIDTH;
    const TOTAL_X = UNIT_PRICE_X + UNIT_PRICE_WIDTH;

    // Vertical line positions
    const LINE1 = DESC_X + DESC_WIDTH;
    const LINE2 = QTY_X + QTY_WIDTH;
    const LINE3 = UNIT_PRICE_X + UNIT_PRICE_WIDTH;

    const drawTableFrame = (startY, pageNum) => {
      // Define header background color (light green)
      const headerBgColor = [217, 234, 211];

      // Draw smaller header background
      doc.setFillColor(...headerBgColor);
      doc.rect(
        margin + 0.2,
        startY + 0.2,
        pageWidth - 2 * margin - 0.4,
        HEADER_ROW_HEIGHT - 0.4,
        "F"
      );

      // Header top border
      doc.line(margin, startY, pageWidth - margin, startY);

      // Header text (adjusted for smaller height)
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      const textY = startY + HEADER_ROW_HEIGHT / 2 + 1; // Better vertical centering
      doc.text(
        `Descriptif des travaux (Page ${pageNum}/2)`,
        DESC_X + DESC_WIDTH / 2,
        textY,
        { align: "center" }
      );
      doc.text("QTÉ", QTY_X + QTY_WIDTH / 2, textY, { align: "center" });
      doc.text("PRIX UNITAIRE", UNIT_PRICE_X + UNIT_PRICE_WIDTH / 2, textY, {
        align: "center",
      });
      doc.text("MONTANT T.T.C", TOTAL_X + TOTAL_WIDTH / 2, textY, {
        align: "center",
      });
      doc.setFont(undefined, "normal");

      // Draw horizontal lines
      // 1. Header bottom line
      doc.line(
        margin,
        startY + HEADER_ROW_HEIGHT,
        pageWidth - margin,
        startY + HEADER_ROW_HEIGHT
      );

      // 2. Body rows (taller than header)
      for (let i = 1; i <= ROWS_PER_PAGE; i++) {
        const yPos = startY + HEADER_ROW_HEIGHT + i * BODY_ROW_HEIGHT;
        doc.line(margin, yPos, pageWidth - margin, yPos);
      }

      // Vertical lines (full height)
      const tableBottom =
        startY + HEADER_ROW_HEIGHT + ROWS_PER_PAGE * BODY_ROW_HEIGHT;
      doc.line(margin, startY, margin, tableBottom);
      doc.line(LINE1, startY, LINE1, tableBottom);
      doc.line(LINE2, startY, LINE2, tableBottom);
      doc.line(LINE3, startY, LINE3, tableBottom);
      doc.line(pageWidth - margin, startY, pageWidth - margin, tableBottom);
    };


    const addPaymentSection = (startY) => {
      const tableWidth = pageWidth - 2 * margin;
      const rowHeight = 10;
      const primeRowHeight = 15; // Increased height for Prime CEE row
      const col1Width = 120;
      const col2Width = 40;
    
      // Adjust starting position
      const adjustedStartY = startY + 6;
    
      // Adjust main table frame height to accommodate additional row
      doc.rect(
        margin,
        adjustedStartY,
        tableWidth,
        primeRowHeight + rowHeight * 5 // Changed from 4 to 5
      );
    
      // Prime CEE row (special taller section)
      doc.line(margin, adjustedStartY, margin + col1Width, adjustedStartY);
      doc.line(
        margin + col1Width,
        adjustedStartY,
        margin + col1Width,
        adjustedStartY + primeRowHeight
      );
      doc.line(
        margin + col1Width + col2Width,
        adjustedStartY,
        margin + col1Width + col2Width,
        adjustedStartY + primeRowHeight
      );
    
      // Horizontal lines for main rows (now 5 rows instead of 4)
      for (let i = 1; i <= 5; i++) { // Changed from 4 to 5
        const yPos = adjustedStartY + primeRowHeight + i * rowHeight - rowHeight;
        doc.line(margin, yPos, margin + tableWidth, yPos);
      }
    
      // Vertical lines (extended for additional row)
      doc.line(
        margin + col1Width,
        adjustedStartY + primeRowHeight,
        margin + col1Width,
        adjustedStartY + primeRowHeight + rowHeight * 5 // Changed from 4 to 5
      );
      doc.line(
        margin + col1Width + col2Width,
        adjustedStartY + primeRowHeight,
        margin + col1Width + col2Width,
        adjustedStartY + primeRowHeight + rowHeight * 5 // Changed from 4 to 5
      );
    
      // Prime CEE section (unchanged)
      doc.setFillColor(220, 230, 241);
      doc.rect(
        margin + 0.2,
        adjustedStartY + 0.2,
        col1Width - 0.4,
        primeRowHeight - 0.4,
        "F"
      );
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Prime correspondant à la prime CEE", margin + 2, adjustedStartY + 5);
      doc.text("d'incitation aux travaux d'économie d'énergie:", margin + 2, adjustedStartY + 10);
      
      // Checkboxes (unchanged)
      doc.setFont(undefined, "bold");
      doc.rect(margin + col1Width + 10, adjustedStartY + primeRowHeight / 2 - 3, 10, 6);
      doc.text("OUI", margin + col1Width + 12, adjustedStartY + primeRowHeight / 2 + 1);
      doc.rect(margin + col1Width + col2Width + 10, adjustedStartY + primeRowHeight / 2 - 3, 10, 6);
      doc.text("NON", margin + col1Width + col2Width + 12, adjustedStartY + primeRowHeight / 2 + 1);
    
      // MODE DE RÈGLEMENT section (yellow background)
      const firstNormalRowY = adjustedStartY + primeRowHeight;
      doc.setFillColor(255, 255, 153);
      doc.rect(margin + 0.2, firstNormalRowY + 0.2, col1Width - 0.4, rowHeight - 0.4, "F");
      doc.setFont(undefined, "bold");
      doc.text("MODE DE RÈGLEMENT:", margin + 2, firstNormalRowY + 5);
    
      // TOTAL HT row
      doc.setFont(undefined, "bold");
      doc.text("TOTAL HT", margin + col1Width + 2, firstNormalRowY + 5);
      doc.text(
        `${command.totalHT || ""} €`,
        margin + col1Width + col2Width + 26,
        firstNormalRowY + 5,
        { align: "right" }
      );

      const forfaitValue = command.forfait || 
      (command.items && command.items.length > 0 && command.items[0].forfait) || 
      0;
    
      // NEW: Forfait tarif forfait row
      doc.text("Tarif forfait", margin + col1Width + 2, firstNormalRowY + rowHeight + 5);
      doc.text(
        `${forfaitValue || ""} €`,
        margin + col1Width + col2Width + 26,
        firstNormalRowY + rowHeight + 5,
        { align: "right" }
      );
    
      // Acompte row (moved down)
      doc.text("Acompte après 8 Jours", margin + 2, firstNormalRowY + rowHeight * 2 + 5);
      doc.text("TVA(10%)", margin + col1Width + 2, firstNormalRowY + rowHeight * 2 + 5);
      doc.text(
        `${command.totalTVA || ""} €`,
        margin + col1Width + col2Width + 26,
        firstNormalRowY + rowHeight * 2 + 5,
        { align: "right" }
      );
    
      // Solde row (moved down)
      doc.text("Solde aux travaux", margin + 2, firstNormalRowY + rowHeight * 3 + 5);
      doc.text("PRIME CEE", margin + col1Width + 2, firstNormalRowY + rowHeight * 3 + 5);
      doc.text(
        `${command.primeCEE || ""} €`,
        margin + col1Width + col2Width + 26,
        firstNormalRowY + rowHeight * 3 + 5,
        { align: "right" }
      );
    
      // MONTANT TOTAL DU (moved down)
      const totalRowY = firstNormalRowY + rowHeight * 4;
      doc.setFillColor(217, 234, 211);
      doc.rect(margin + col1Width + 0.2, totalRowY + 0.2, col2Width - 0.4, rowHeight - 0.4, "F");
      doc.setFont(undefined, "bold");
      doc.text("TOTAL DU", margin + col1Width + 2, totalRowY + 5);
      
      doc.setFont(undefined, "bold");
      doc.text("Fait à:                                   Le:", margin + 2, totalRowY + 5);
      doc.text(
        `${command.totalFinal || ""} €`,
        margin + col1Width + col2Width + 26,
        totalRowY + 5,
        { align: "right" }
      );
    
      // Adjust return value for additional row
      return adjustedStartY + primeRowHeight + rowHeight * 5;
    };
  
    // Draw table frame for page 2 with increased row height
    const tableStartY2 = 55;
    const tableEndY2 = tableStartY2 + ROWS_PER_PAGE * TABLE_ROW_HEIGHT;
    drawTableFrame(tableStartY2, tableEndY2, 2);

    // Payment section with increased row height
    const paymentStartY = tableEndY2; // Reduced gap to connect tables
    const signatureY = addPaymentSection(paymentStartY) + 20;

    // Signature section
    doc.text("Signature du conseiller", 30, signatureY);
    doc.text("Signature du client", 120, signatureY);

    const legalText = [
      {
        text: "Je soussigné......déclare avoir reçu l'information précontractuelle avant la signature de la présente commande et avoir accepté les conditions ci-dessus et au recto. Je reconnais rester en possession d'un double du présent bon de commande, doté d'un formulaire détachable de rétractation.",
        style: "paragraph",
      },
      {
        text: "- Je déclare, conformément à l'article L. 223-2 du Code de la Consommation, avoir été informé de mon droit d'inscription sur les fichiers bloc tel.",
        style: "bullet",
      },
      {
        text: "- Je déclare avoir en ma possession la notice explicative détaillée du ou des produits énoncés ci-dessus",
        style: "bullet",
      },
    ];

    // Styling Configuration
    const LEGAL_FONT_SIZE = 9;
    const LINE_HEIGHT = 5;
    const BULLET_INDENT = 5;
    const MAX_WIDTH = pageWidth - 2 * margin;

    // Draw the professional legal section
    let currentY = signatureY + 15;

    // Add subtle top border
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, currentY - 3, pageWidth - margin, currentY - 3);
    doc.setDrawColor(0);

    // Legal text header
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    // doc.text("DECLARATIONS LEGALES", pageWidth / 2, currentY, { align: "center" });
    currentY += LINE_HEIGHT + 2;

    doc.setFontSize(LEGAL_FONT_SIZE);
    doc.setFont(undefined, "normal");

    legalText.forEach((item) => {
      const options = {
        maxWidth: MAX_WIDTH,
        align: "justify",
      };

      if (item.style === "paragraph") {
        // Split long text into multiple lines automatically
        const lines = doc.splitTextToSize(item.text, MAX_WIDTH);
        lines.forEach((line) => {
          doc.text(line, margin, currentY, options);
          currentY += LINE_HEIGHT;
        });
        currentY += 2; // Extra space after paragraph
      } else if (item.style === "bullet") {
        // Handle bullet points with proper indentation
        doc.text("•", margin, currentY);
        const bulletText = item.text.substring(1); // Remove the '-' from original
        const bulletLines = doc.splitTextToSize(
          bulletText,
          MAX_WIDTH - BULLET_INDENT
        );

        bulletLines.forEach((line, i) => {
          const xPos =
            i === 0 ? margin + BULLET_INDENT : margin + BULLET_INDENT;
          doc.text(line, xPos, currentY, {
            maxWidth: MAX_WIDTH - BULLET_INDENT,
            align: "left",
          });
          currentY += LINE_HEIGHT;
        });
      }
    });

    // Add signature lines
    currentY += 10;
    doc.setDrawColor(0);
    doc.setFontSize(10);

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

      message.success("Devis envoyé avec succès par email !");
    } catch (error) {
      console.error("Erreur lors de l'envoi par email :", error);
      message.error("Échec de l'envoi du devis.");
    }
  };
  const handleValidate = async (commandId) => {
    try {
      const currentCommand = allCommands.find(
        (command) => command._id === commandId
      );
      if (!currentCommand) {
        console.error("Commande non trouvée");
        message.error("Commande non trouvée");
        return;
      }

      const isCurrentlyValid = currentCommand.command_type === "commande";
      const oldNumCommand = currentCommand.numCommand;

      let newNumCommand, newCommandType;

      if (isCurrentlyValid) {
        // Revert to devis (invalidate)
        newNumCommand = "D" + oldNumCommand.slice(1);
        newCommandType = "devis";
      } else {
        // Validate to commande
        newNumCommand = "C" + oldNumCommand.slice(1);
        newCommandType = "commande";
      }

      const response = await axios.put(`/command/validate/${commandId}`, {
        ...currentCommand,
        command_type: newCommandType,
        numCommand: newNumCommand,
        originalNumCommand: oldNumCommand,
      });

      // Update the command in the UI instead of removing it
      setAllCommands((prevCommands) =>
        prevCommands.map((command) =>
          command._id === commandId
            ? {
                ...command,
                command_type: newCommandType,
                numCommand: newNumCommand,
                originalNumCommand: oldNumCommand,
              }
            : command
        )
      );

      message.success(
        isCurrentlyValid
          ? "Devis invalidé avec succès !"
          : "Devis validée avec succès !"
      );
      onValidate();
    } catch (error) {
      console.error("Error toggling command status:", error);
      // Use a generic error message since we can't access isCurrentlyValid here
      // message.error("❌ Échec de la modification du statut");
    }
  };

  function stringToColor(str) {
    // List of distinct Ant Design tag colors
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

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  const columns = [
    {
      title: "Devis",
      dataIndex: "originalNumCommand",
      key: "originalNumCommand",
      render: (text, record) => {
        const decodedToken = jwtDecode(localStorage.getItem("token"));
        const role = decodedToken?.role;

        return (
          <div className="flex items-center gap-2">
            {safeRender(text)}
            {role === "Admin" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleValidate(record._id);
                }}
                className={`px-2 py-1 text-xs rounded-md ${
                  record.command_type === "commande"
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                } transition-colors`}
              >
                {record.command_type === "commande" ? "Invalider" : "Valider"}
              </button>
            )}
          </div>
        );
      },
      sorter: (a, b) =>
        (a.originalNumCommand || "").localeCompare(b.originalNumCommand || ""),
    },
    {
      title: "Statut",
      dataIndex: "command_type",
      key: "status",
      render: (command_type) => (
        <Tag color={command_type === "devis" ? "orange" : "green"}>
          {command_type === "devis" ? "En cours" : "Accepté"}
        </Tag>
      ),
      filters: [
        { text: "En cours", value: "devis" },
        { text: "Accepté", value: "commande" },
      ],
      onFilter: (value, record) => record.command_type === value,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => moment(safeRender(date)).format("DD/MM/YYYY"),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Client",
      dataIndex: "nom",
      key: "nom",
      render: (text) => safeRender(text),
      ellipsis: true,
    },
    {
      title: "Créer par",
      dataIndex: "commercialName",
      key: "commercialName",
      render: (text) => safeRender(text),
      ellipsis: true,
    },
    // {
    //   title: "Référence",
    //   dataIndex: "reference",
    //   key: "reference",
    //   render: (text, record) => (
    //     <div>
    //       {record.items?.length > 0 && (
    //         <div className="flex flex-wrap gap-1 mt-1">
    //           {record.items.map((item, index) => {
    //             const colorHash = stringToColor(item.reference);
    //             return (
    //               <Tag
    //                 key={index}
    //                 color={colorHash}
    //                 className="text-xs font-medium"
    //               >
    //                 {item.reference} <span className="font-bold">(x{item.quantite})</span>
    //               </Tag>
    //             );
    //           })}
    //         </div>
    //       )}
    //     </div>
    //   ),
    // },
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
      render: (text, record) => (
        <div>
          {/* Check if items exists and has elements OR use reference directly */}
          {record.items?.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {record.items.map((item, index) => {
                const colorHash = stringToColor(item.reference);
                return (
                  <Tag
                    key={index}
                    color={colorHash}
                    className="text-xs font-medium"
                  >
                    {item.reference}{" "}
                    <span className="font-bold">(x{item.quantite})</span>
                  </Tag>
                );
              })}
            </div>
          ) : record.reference ? (
            <Tag
              color={stringToColor(record.reference)}
              className="text-xs font-medium"
            >
              {record.reference}{" "}
              <span className="font-bold">(x{record.quantite})</span>
            </Tag>
          ) : null}
        </div>
      ),
    },

    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (categoryString) => {
        const categories =
          typeof categoryString === "string"
            ? categoryString.split(",").map((c) => c.trim())
            : [];

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {categories.map((category, index) => (
              <Tag key={index} color="blue">
                {category}
              </Tag>
            ))}
          </div>
        );
      },
    },

    {
      title: "Quantité",
      dataIndex: "quantite",
      key: "quantite",
      render: (text) => `${safeRender(text, "0")}`,
    },
  
   
    {
      title: "Forfait",
      dataIndex: "forfait",
      key: "forfait",
      render: (text, record) => (
        <div className="flex flex-col gap-1">
          {/* Main Forfait Tag - Only shows if value exists */}
          {text && parseFloat(text) !== 0 && (
            <Tag color="#f50" className="text-xs font-medium">
              Forfait: {parseFloat(text).toFixed(2)} €
            </Tag>
          )}

          {/* Item-Level Forfaits - Only shows if items with forfait exist */}
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
                    Forfait: {parseFloat(item.forfait || 0).toFixed(2)} €
                    {/* {item.quantite > 1 && (
                      <span className="font-bold ml-1">(x{item.quantite})</span>
                    )} */}
                  </Tag>
                ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Prix Unitaire",
      dataIndex: "prixUnitaire",
      key: "prixUnitaire",
      render: (text, record) => (
        <div className="flex flex-col gap-1">
          {/* Main Forfait Tag - Only shows if value exists */}
          {text && parseFloat(text) !== 0 && (
            <Tag color="#f50" className="text-xs font-medium">
              prix Unitaire: {parseFloat(text).toFixed(2)} €
            </Tag>
          )}

          {/* Item-Level Forfaits - Only shows if items with forfait exist */}
          {record.items?.some((item) => item.forfait) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {record.items
                .filter((item) => item.prixUnitaire)
                .map((item, index) => (
                  <Tag
                    key={`prixUnitaire-${index}`}
                    color="#f50"
                    className="text-xs font-medium"
                  >
                    Prix Unitaire: {parseFloat(item.prixUnitaire || 0).toFixed(2)} €
                    {/* {item.quantite > 1 && (
                      <span className="font-bold ml-1">(x{item.quantite})</span>
                    )} */}
                  </Tag>
                ))}
            </div>
          )}
        </div>
      ),
    },
    // {
    //   title: "Prix Unitaire HT",
    //   dataIndex: "prixUnitaire",
    //   key: "prixUnitaire",
    //   render: (text) => `${safeRender(text, "0")} €`,
    // },
    // {
    //   title: "Total HT",
    //   dataIndex: "totalHT",
    //   key: "totalHT",
    //   render: (text, record) => (
    //     <div className="text-right">
    //       <div>{`${safeRender(text, "0")} €`}</div>
    //       {record.items?.length > 0 ? (
    //         <div className="text-xs text-gray-500">
    //           {record.items.map((item) => item.montantHT + "€").join(" + ")}
    //         </div>
    //       ) : (
    //         <div className="text-xs text-gray-500">
    //           {safeRender(text, "0")} €
    //         </div>
    //       )}
    //     </div>
    //   ),
    //   sorter: (a, b) => (a.totalHT || 0) - (b.totalHT || 0),
    // },
    {
      title: "Total HT",
      dataIndex: "totalHT",
      key: "totalHT",
      render: (text, record) => {
        // Calculate total from items if they exist
        const itemsTotal = record.items?.reduce(
          (sum, item) => sum + (parseFloat(item.prixUnitaire || 0) * parseInt(item.quantite || 1)),
          0
        );
    
        // Use either the calculated itemsTotal or the root-level prixUnitaire * quantite
        const calculatedTotal = itemsTotal 
          ? itemsTotal 
          : parseFloat(record.prixUnitaire || 0) * parseInt(record.quantite || 1);
    
        // Fallback to the API-provided totalHT if calculations don't make sense
        const displayTotal = itemsTotal || record.prixUnitaire 
          ? calculatedTotal 
          : parseFloat(text || 0);
    
        return (
          <div className="text-right">
            {/* Main Total */}
            <div className="font-medium">
              {displayTotal.toFixed(2)} €
            </div>
    
            {/* Breakdown */}
            {record.items?.length > 0 ? (
              <div className="text-xs text-gray-500">
                {record.items.map((item, i) => (
                  <div key={`item-ht-${i}`}>
                    {item.prixUnitaire} € × {item.quantite} = {(item.prixUnitaire * item.quantite).toFixed(2)} €
                  </div>
                ))}
              </div>
            ) : record.prixUnitaire ? (
              <div className="text-xs text-gray-500">
                {record.prixUnitaire} € × {record.quantite} = {calculatedTotal.toFixed(2)} €
              </div>
            ) : null}
          </div>
        );
      },
      sorter: (a, b) => {
        // Get comparable values for both records
        const getValue = (record) => {
          const itemsTotal = record.items?.reduce(
            (sum, item) => sum + (parseFloat(item.prixUnitaire || 0) * parseInt(item.quantite || 1)),
            0
          );
          return itemsTotal || parseFloat(record.totalHT || 0);
        };
        return getValue(a) - getValue(b);
      },
    },
    // {
    //   title: "Total TVA",
    //   dataIndex: "totalTVA",
    //   key: "totalTVA",
    //   render: (text, record) => (
    //     <div className="text-right">
    //       <div>{`${safeRender(text, "0")} €`}</div>
    //       {record.items?.length > 0 ? (
    //         <div className="text-xs text-gray-500">
    //           {record.items.map((item) => item.montantTVA + "€").join(" + ")}
    //         </div>
    //       ) : (
    //         <div className="text-xs text-gray-500">
    //           {safeRender(text, "0")} €
    //         </div>
    //       )}
    //     </div>
    //   ),
    //   sorter: (a, b) => (a.totalTVA || 0) - (b.totalTVA || 0),
    // },
    // {
    //   title: "Prix Total TTC",
    //   dataIndex: "totalTTC",
    //   key: "totalTTC",
    //   render: (text, record) => (
    //     <div className="text-right">
    //       <div className="font-medium">{`${safeRender(text, "0")} €`}</div>
    //       {record.items?.length > 0 ? (
    //         <div className="text-xs text-gray-500">
    //           {record.items.map((item) => item.montantTTC + "€").join(" + ")}
    //         </div>
    //       ) : (
    //         <div className="text-xs text-gray-500">
    //           {safeRender(text, "0")} €
    //         </div>
    //       )}
    //     </div>
    //   ),
    //   sorter: (a, b) => (a.totalTTC || 0) - (b.totalTTC || 0),
    // },

    // {
    //   title: "Total TVA",
    //   dataIndex: "totalTVA",
    //   key: "totalTVA",
    //   render: (text, record) => {
    //     // Calculate TVA from items if they exist
    //     const itemsTVA = record.items?.reduce(
    //       (sum, item) => sum + (parseFloat(item.montantTVA || 0)),
    //       0
    //     );
    
    //     // Use either the calculated itemsTVA or the root-level totalTVA
    //     const displayTVA = itemsTVA !== undefined 
    //       ? itemsTVA 
    //       : parseFloat(text || 0);
    
    //     return (
    //       <div className="text-right">
    //         {/* Main TVA */}
    //         <div className="font-medium">
    //           {displayTVA.toFixed(2)} €
    //         </div>
    
    //         {/* Breakdown */}
    //         {record.items?.length > 0 ? (
    //           <div className="text-xs text-gray-500">
    //             {record.items.map((item, i) => (
    //               item.montantTVA ? (
    //                 <div key={`item-tva-${i}`}>
    //                   {item.montantTVA.toFixed(2)} €
    //                   {item.tva ? ` (${item.tva}%)` : ''}
    //                 </div>
    //               ) : null
    //             ))}
    //           </div>
    //         ) : null}
    //       </div>
    //     );
    //   },
    //   sorter: (a, b) => {
    //     const getTVA = (record) => {
    //       const itemsTVA = record.items?.reduce(
    //         (sum, item) => sum + (parseFloat(item.montantTVA || 0)),
    //         0
    //       );
    //       return itemsTVA || parseFloat(record.totalTVA || 0);
    //     };
    //     return getTVA(a) - getTVA(b);
    //   },
    // },
    // {
    //   title: "Prix Total TTC",
    //   dataIndex: "totalTTC",
    //   key: "totalTTC",
    //   render: (text, record) => {
    //     // Calculate from items if they exist
    //     const itemsTTC = record.items?.reduce(
    //       (sum, item) => sum + (parseFloat(item.montantTTC || 0)),
    //       0
    //     );
    
    //     // Calculate from HT + TVA if no items but both exist
    //     const calculatedTTC = !record.items?.length && record.totalHT && record.totalTVA
    //       ? parseFloat(record.totalHT) + parseFloat(record.totalTVA)
    //       : null;
    
    //     // Use the most appropriate value
    //     const displayTTC = itemsTTC !== undefined 
    //       ? itemsTTC 
    //       : calculatedTTC !== null 
    //         ? calculatedTTC 
    //         : parseFloat(text || 0);
    
    //     return (
    //       <div className="text-right">
    //         {/* Main TTC */}
    //         <div className="font-medium">
    //           {displayTTC.toFixed(2)} €
    //         </div>
    
    //         {/* Breakdown */}
    //         {record.items?.length > 0 ? (
    //           <div className="text-xs text-gray-500">
    //             {record.items.map((item, i) => (
    //               <div key={`item-ttc-${i}`}>
    //                 {item.montantTTC.toFixed(2)} €
    //               </div>
    //             ))}
    //           </div>
    //         ) : calculatedTTC ? (
    //           <div className="text-xs text-gray-500">
    //             HT: {record.totalHT} € + TVA: {record.totalTVA} €
    //           </div>
    //         ) : null}
    //       </div>
    //     );
    //   },
    //   sorter: (a, b) => {
    //     const getTTC = (record) => {
    //       const itemsTTC = record.items?.reduce(
    //         (sum, item) => sum + (parseFloat(item.montantTTC || 0)),
    //         0
    //       );
    //       return itemsTTC || parseFloat(record.totalTTC || 0);
    //     };
    //     return getTTC(a) - getTTC(b);
    //   },
    // },
    // For Total TVA column
{
  title: "Total TVA",
  dataIndex: "totalTVA",
  key: "totalTVA",
  render: (text, record) => {
    // Get TVA from either items or root level
    const tvaSource = record.items?.length ? 
      record.items.reduce((sum, item) => sum + (item.montantTVA || 0), 0) : 
      record.totalTVA || 0;

    return (
      <div className="text-right">
        <div className="font-medium">
          {parseFloat(tvaSource).toFixed(2)} €
        </div>
        {record.items?.length > 0 && (
          <div className="text-xs text-gray-500">
            {record.items
              .filter(item => item.montantTVA)
              .map((item, i) => (
                <div key={`tva-detail-${i}`}>
                  {item.montantTVA.toFixed(2)} € {item.tva && `(${item.tva}%)`}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  },
  sorter: (a, b) => {
    const getTva = (record) => 
      record.items?.reduce((sum, item) => sum + (item.montantTVA || 0), 0) || 
      parseFloat(record.totalTVA || 0);
    return getTva(a) - getTva(b);
  }
},


{
  title: "Prix Total TTC",
  dataIndex: "totalTTC",
  key: "totalTTC",
  render: (text, record) => {
    // Get TTC from the most reliable source
    const ttcSource = record.items?.length ?
      record.items.reduce((sum, item) => sum + (item.montantTTC || 0), 0) :
      record.totalTTC || 
      (parseFloat(record.totalHT || 0) + parseFloat(record.totalTVA || 0));

    return (
      <div className="text-right">
        <div className="font-medium">
          {parseFloat(ttcSource).toFixed(2)} €
        </div>
        {record.items?.length > 0 ? (
          <div className="text-xs text-gray-500">
            {record.items
              .filter(item => item.montantTTC)
              .map((item, i) => (
                <div key={`ttc-detail-${i}`}>
                  {item.montantTTC.toFixed(2)} €
                </div>
              ))}
          </div>
        ) : (
          !record.items?.length && record.totalHT && record.totalTVA && (
            <div className="text-xs text-gray-500">
              HT: {record.totalHT} € + TVA: {record.totalTVA} €
            </div>
          )
        )}
      </div>
    );
  },
  sorter: (a, b) => {
    const getTtc = (record) => 
      record.items?.reduce((sum, item) => sum + (item.montantTTC || 0), 0) || 
      parseFloat(record.totalTTC || 0) ||
      (parseFloat(record.totalHT || 0) + parseFloat(record.totalTVA || 0));
    return getTtc(a) - getTtc(b);
  }
},
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={(e) => handleEdit(record, e)}
          />
          <Button
            icon={<FilePdfOutlined />}
            onClick={(e) => handleDownload(record._id, e)}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => handleDelete(record._id, e)}
          />
          <Button
            icon={<SendOutlined />}
            onClick={(e) => handleSendPdf(record._id, e)}
            title="Envoyer le devis"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Devis Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <Statistic title="Total Devis" value={stats.totalCommands} />
          <Button
            className="w-full mt-4 bg-blue-500 text-white font-bold"
            onClick={() => setDevisModalVisible(true)}
          >
            Création Devis
          </Button>
        </Card>
        <Card>
          <Statistic title="Total HT" value={stats.totalHT} suffix="€" />
          <Button
            className={`w-full mt-4 ${
              activeFilter === "en_cours" ? "bg-blue-500" : "bg-blue-300"
            } text-white font-bold`}
            onClick={() => handleFilter("en_cours")}
          >
            Devis en cours
          </Button>
        </Card>
        <Card>
          <Statistic title="Total TTC" value={stats.totalTTC} suffix="€" />
          <Button
            className={`w-full mt-4 ${
              activeFilter === "accepte" ? "bg-blue-500" : "bg-blue-300"
            } text-white font-bold`}
            onClick={() => handleFilter("accepte")}
          >
            Devis Accepté
          </Button>
        </Card>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {userRole === "commercial" ? "Mes Devis" : "Tous les Devis"}
          </h2>
        </div>

        <Table
          columns={columns.map((col) => ({
            ...col,
            title: (
              <div className="flex flex-col items-center">
                <div className="text-xs">{col.title}</div>
              </div>
            ),
          }))}
          // dataSource={allCommands}
          dataSource={filteredCommands}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
          bordered
          onRow={(record) => ({
            onClick: () => (window.location.href = `/lead/${record.lead}`),
            style: { cursor: "pointer" },
          })}
        />
      </div>
      <Modal
        title={
          <div className="bg-gray-100 p-3 -mx-6 -mt-6 flex justify-between items-center sticky top-0 z-10 border-b">
            <span className="font-medium text-sm">Créer un Devis</span>
            <button
              onClick={() => setDevisModalVisible(false)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none text-xs"
            >
              <CloseOutlined className="text-xs" />
            </button>
          </div>
        }
        open={devisModalVisible}
        onCancel={() => setDevisModalVisible(false)}
        footer={null}
        width="30%"
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          height: "100vh",
          margin: 0,
          padding: 0,
          overflow: "hidden",
        }}
        bodyStyle={{
          height: "calc(100vh - 49px)",
          padding: "0 16px",
          margin: 0,
          overflowY: "auto",
        }}
        maskStyle={{
          backgroundColor: "rgba(0, 0, 0, 0.1)",
        }}
        closeIcon={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitDevis}
          className="space-y-4 py-4"
        >
          <div className="flex items-center justify-center">
            <Form.Item
              name="command_type"
              className="font-bold w-full"
              rules={[
                { required: true, message: "Type de commande est requis" },
              ]}
            >
              <Radio.Group
                onChange={(e) => handleCommandTypeChange(e.target.value)}
                className="w-full flex justify-center items-center gap-6"
              >
                <Radio value="devis">Devis</Radio>
                <Radio value="commande">Contrat</Radio>
              </Radio.Group>
            </Form.Item>
          </div>
          <Form.Item
            label="Numéro de Commande"
            name="numCommand"
            rules={[
              { required: true, message: "Numéro de commande est requis" },
            ]}
          >
            <Input
              disabled
              className="w-full"
              placeholder="Généré automatiquement"
            />
          </Form.Item>
          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: "La date est requise" }]}
          >
            <DatePicker
              className="w-full"
              placeholder="Sélectionnez une date"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            name="nom"
            label="Séléctioner le client"
            rules={[{ required: true, message: "Client est requis" }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              className="w-full"
              onChange={handleClientChange}
              placeholder="Sélectionnez un client"
            >
              {chatData.map((client) => (
                <Option key={client._id} value={client._id}>
                  {client.nom || "Client sans nom"}{" "}
                  {client.phone ? `- ${client.phone}` : ""}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Product Selection Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-4">
              Sélection des Produits
            </h3>

            {/* Product Dropdown - Full width */}
            <Form.Item
              label="Produit"
              name="produit"
              rules={[{ required: true, message: "Produit est requis" }]}
              className="w-full"
            >
              <Select
                showSearch
                optionFilterProp="children"
                placeholder="Sélectionnez un produit"
                onChange={(value) => {
                  const selectedProduct = produits.find((p) => p._id === value);
                  if (selectedProduct) {
                    form.setFieldsValue({
                      category: selectedProduct.category,
                      title: selectedProduct.title,
                      reference: selectedProduct.reference,
                      description: selectedProduct.description,
                      TVA: selectedProduct.tva || 10,
                    });
                  }
                }}
                className="w-full"
              >
                {produits.map((produit) => (
                  <Option key={produit._id} value={produit._id}>
                    {produit.title} - {produit.reference}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Category - Full width */}
            <Form.Item label="Catégorie" name="category" className="w-full">
              <Input disabled className="w-full" />
            </Form.Item>

            {/* Reference - Full width */}
            <Form.Item label="Référence" name="reference" className="w-full">
              <Input disabled className="w-full" />
            </Form.Item>

            {/* Title - Full width */}
            <Form.Item label="Titre" name="title" className="w-full">
              <Input disabled className="w-full" />
            </Form.Item>

            {/* Description - Full width */}
            <Form.Item
              label="Description"
              name="description"
              className="w-full"
            >
              <Input.TextArea rows={3} disabled className="w-full" />
            </Form.Item>

            {/* Quantity and Price in a row */}
            <div className="flex gap-4">
              <Form.Item
                label="Quantité"
                name="quantite"
                rules={[{ required: true, message: "Quantité est requise" }]}
                className="flex-1"
              >
                <Input
                  type="number"
                  min={1}
                  className="w-full"
                  onChange={(e) =>
                    calculateTotals(
                      e.target.value,
                      form.getFieldValue("prixUnitaire")
                    )
                  }
                />
              </Form.Item>

              <Form.Item
                label="Prix de vente (€)"
                name="prixUnitaire"
                rules={[
                  { required: true, message: "Prix de vente est requis" },
                ]}
                className="flex-1"
              >
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  className="w-full"
                  onChange={(e) =>
                    calculateTotals(
                      form.getFieldValue("quantite"),
                      e.target.value
                    )
                  }
                />
              </Form.Item>

              <Form.Item name="totalHT" hidden>
                <Input type="hidden" />
              </Form.Item>
              <Form.Item name="totalTTC" hidden>
                <Input type="hidden" />
              </Form.Item>
              <Form.Item name="totalTVA" hidden>
                <Input type="hidden" />
              </Form.Item>
              <Form.Item name="TVA" hidden>
                <Input type="hidden" />
              </Form.Item>
            </div>

            {/* Forfait - Full width */}
            {/* <Form.Item label="Forfait (€)" name="forfait" className="w-full">
                    <Input type="number" step="0.01" min={0} className="w-full" />
                  </Form.Item> */}
            <Form.Item
              label={
                <div className="flex items-center gap-2">
                  <span>Forfait (€)</span>
                  <Button
                    type="text"
                    icon={<InfoCircleOutlined />}
                    onClick={() => setPreviewImage(true)}
                    className="p-0 h-4"
                  />
                </div>
              }
              name="forfait"
              className="w-full"
            >
              <Input type="number" step="0.01" min={0} className="w-full" />
            </Form.Item>
          </div>

          <Form.Item
            label="Adresse"
            name="address"
            rules={[{ required: false, message: "L'adresse est requis" }]}
          >
            <Input.TextArea
              placeholder="Adresse du client"
              className="w-full"
              rows={2}
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "L'email est requis" },
              { type: "email", message: "Email invalide" },
            ]}
          >
            <Input placeholder="email@client.com" className="w-full" />
          </Form.Item>

          <Form.Item
            label="Téléphone"
            name="phone"
            rules={[{ required: true, message: "Le téléphone est requis" }]}
          >
            <Input placeholder="0612345678" className="w-full" />
          </Form.Item>

          <Form.Item label="TVA">
            <Input value={`${TVA}%`} disabled className="w-full" />
          </Form.Item>

          <Form.Item label="Siret" name="siret" rules={[{ required: false }]}>
            <Input placeholder="123 456 789 00012" className="w-full" />
          </Form.Item>

          <Form.Item
            label="Code Postal"
            name="codepostal"
            rules={[{ required: false }]}
          >
            <Input placeholder="75000" className="w-full" />
          </Form.Item>

          <Form.Item
            label="Raison Sociale"
            name="raissociale"
            rules={[{ required: false }]}
          >
            <Input placeholder="Entreprise SARL" className="w-full" />
          </Form.Item>

          <Form.Item label="Ville" name="ville" rules={[{ required: false }]}>
            <Input placeholder="Paris" className="w-full" />
          </Form.Item>

          <div className="flex justify-center gap-2 pt-4 border-t">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-green-600 text-white"
            >
              Créer le Devis
            </Button>
          </div>
        </Form>
        {previewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-full max-h-full">
              <img
                src={logo} // Use your logo or any other image
                alt="Forfait details"
                className="max-h-[90vh] max-w-full object-contain"
              />
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setPreviewImage(false)}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllDevis;

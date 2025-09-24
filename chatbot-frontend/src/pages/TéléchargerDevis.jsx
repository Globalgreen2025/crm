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
  Tooltip,
  Row,
  Col,

} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined ,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined 
} from "@ant-design/icons";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import { jsPDF } from "jspdf";
import logo from "../assets/logo.jpeg";
import logorge from "../assets/glgr.png";
import GenerateBillingPlan from "../components/GenerateBillingPlan";
import InvoicesManagement from "../components/InvoicesManagement";

const { confirm } = Modal;

// Add this component before your main component
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


const AllDevis = () => {
  const [devisModalVisible, setDevisModalVisible] = useState(false);
  const [produits, setProduits] = useState([]);
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
  const userRole = decodedUser?.role;
  const [billingModalVisible, setBillingModalVisible] = useState(false);
  const [invoicesModalVisible, setInvoicesModalVisible] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [sendingEmails, setSendingEmails] = useState({});


  const [factureStats, setFactureStats] = useState({
    totalFactures: 0,
    totalHTFactures: 0,
    totalTTCAFactures: 0,
    totalPaye: 0,
    resteAPayer: 0,
    facturesPayees: 0,
    facturesEnAttente: 0,
    facturesPartielles: 0
  });


  const calculateFactureStats = (commands) => {
    // Filtrer seulement les commandes de type facture
    const factures = commands.filter(cmd => cmd.command_type === "facture");
    
    // Calculer les totaux
    const totalHT = factures.reduce((sum, f) => sum + (f.totalHT || 0), 0);
    const totalTTC = factures.reduce((sum, f) => sum + (f.totalTTC || 0), 0);
    
    // Calculer le montant payé basé sur les factures individuelles
    const totalPaye = factures.reduce((sum, facture) => {
      if (facture.invoices && Array.isArray(facture.invoices)) {
        return sum + facture.invoices
          .filter(inv => inv.status === 'payée')
          .reduce((invSum, inv) => invSum + (inv.amount || 0), 0);
      }
      return sum + (facture.paidAmount || 0);
    }, 0);
    
    const resteAPayer = totalTTC - totalPaye;
    
    // Compter les statuts des factures
    const facturesPayees = factures.filter(facture => {
      if (facture.invoices && Array.isArray(facture.invoices)) {
        return facture.invoices.length > 0 && 
               facture.invoices.every(inv => inv.status === 'payée');
      }
      return facture.paymentStatus === 'paid';
    }).length;
    
    const facturesEnAttente = factures.filter(facture => {
      if (facture.invoices && Array.isArray(facture.invoices)) {
        return facture.invoices.length === 0 || 
               facture.invoices.every(inv => inv.status !== 'payée');
      }
      return facture.paymentStatus === 'pending' || !facture.paymentStatus;
    }).length;
    
    const facturesPartielles = factures.filter(facture => {
      if (facture.invoices && Array.isArray(facture.invoices)) {
        const paidInvoices = facture.invoices.filter(inv => inv.status === 'payée').length;
        return paidInvoices > 0 && paidInvoices < facture.invoices.length;
      }
      return facture.paymentStatus === 'partial';
    }).length;

    return {
      totalFactures: factures.length,
      totalHTFactures: totalHT,
      totalTTCAFactures: totalTTC,
      totalPaye: totalPaye,
      resteAPayer: resteAPayer,
      facturesPayees: facturesPayees,
      facturesEnAttente: facturesEnAttente,
      facturesPartielles: facturesPartielles
    };
  };

  // Add these functions:
  const handleGenerateBillingPlan = (command) => {
    setSelectedCommand(command);
    setBillingModalVisible(true);
  };

  const handleManageInvoices = (command) => {
    setSelectedCommand(command);
    setInvoicesModalVisible(true);
  };

  useEffect(() => {
    applyFilter(activeFilter);
  }, [allCommands, activeFilter]);


  // const fetchCommands = async () => {
  //   const token = localStorage.getItem("token");
  //   if (!token) return;
  //   try {
  //     setLoading(true);
  //     const response = await axios.get("/command", {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     const commandsData = response?.data;
  //     const decodedToken = token ? jwtDecode(token) : null;
  //     const currentUserId = decodedToken?.userId;
  //     const role = decodedToken.role;

  //     let filteredCommands = [];

  //     if (role === "Admin") {
  //       filteredCommands = commandsData;
  //     } else {
  //       filteredCommands = commandsData.filter(
  //         (cmd) => cmd.session === currentUserId && cmd.command === "devis"
  //       );
  //     }
  //     filteredCommands.sort((a, b) => new Date(b.date) - new Date(a.date));
  //     // Fetch invoices for each command
  //     const commandsWithInvoices = await Promise.all(
  //       filteredCommands.map(async (command) => {
  //         try {
  //           const invoicesResponse = await axios.get(
  //             `/command/${command._id}/invoices`,
  //             {
  //               headers: { Authorization: `Bearer ${token}` },
  //             }
  //           );
  //           return {
  //             ...command,
  //             invoices: invoicesResponse.data || [],
  //           };
  //         } catch (error) {
  //           console.error(
  //             `Error fetching invoices for command ${command._id}:`,
  //             error
  //           );
  //           return {
  //             ...command,
  //             invoices: [],
  //           };
  //         }
  //       })
  //     );
  //     commandsWithInvoices.sort((a, b) => new Date(b.date) - new Date(a.date));
  //     setAllCommands(commandsWithInvoices);
  //     updateStatistics(commandsWithInvoices);
  //     setLoading(false);
  //   } catch (error) {
  //     console.error("Error fetching commands:", error);
  //     message.error("Failed to fetch commands");
  //     setLoading(false);
  //   }
  // };
  const fetchCommands = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get("/command", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const commandsData = response?.data;
      const decodedToken = token ? jwtDecode(token) : null;
      const currentUserId = decodedToken?.userId;
      const role = decodedToken.role;
  
      let filteredCommands = [];
  
      if (role === "Admin") {
        filteredCommands = commandsData;
      } else {
        filteredCommands = commandsData.filter(
          (cmd) => cmd.session === currentUserId && cmd.command === "devis"
        );
      }
      filteredCommands.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Fetch invoices for each command
      const commandsWithInvoices = await Promise.all(
        filteredCommands.map(async (command) => {
          try {
            const invoicesResponse = await axios.get(
              `/command/${command._id}/invoices`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            return {
              ...command,
              invoices: invoicesResponse.data || [],
            };
          } catch (error) {
            console.error(
              `Error fetching invoices for command ${command._id}:`,
              error
            );
            return {
              ...command,
              invoices: [],
            };
          }
        })
      );
      
      commandsWithInvoices.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAllCommands(commandsWithInvoices);
      updateStatistics(commandsWithInvoices);
      
      // CORRECTION : Calculer les statistiques des factures après avoir défini allCommands
      const factureStats = calculateFactureStats(commandsWithInvoices);
      setFactureStats(factureStats);
      
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
    const prefix = value === "devis" ? "D" : "F";
    const randomNumber = generateRandomNumber(prefix);
    form.setFieldsValue({
      numCommand: randomNumber,
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
        filtered = allCommands.filter((cmd) => cmd.command_type === "facture");
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

    // === Page 1 ===

    // Add logos - left logo only
    doc.addImage(
      logo,
      "JPEG",
      marginLeft, // Use marginLeft instead of marginTop for horizontal positioning
      marginTop,
      logoleftwidth,
      logoleftheight
    ); // Left logo

    // Company info on the right side
    doc.setFontSize(10); // same font size for all lines

    const rightStartX = pageWidth - 50; // Adjust X position

    // "Entreprise:" in bold
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Entreprise:", rightStartX, 15);

    // The rest in regular Helvetica
    doc.setFont(undefined, "Helvetica");
    doc.setTextColor(0, 128, 0); // green for company name
    doc.text("GLOBAL GREEN", rightStartX, 21);

    doc.setTextColor(0, 0, 0); // black for the rest
    doc.text("641 AVENUE DU GRAIN D'OR", rightStartX, 27);
    doc.text("41350 VINEUIL - France", rightStartX, 32);
    doc.text("Contact@global-green.fr", rightStartX, 37);
    doc.text("07 64 71 26 87", rightStartX, 42);

    doc.addImage(
      logorge, // You'll need to define this variable
      "PNG",
      pageWidth / 2 - logoWidth / 2,
      marginLeft,
      logoWidth,
      logoHeight,
      marginTop
    );

    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(11);
    // Configuration
    const LINE_SPACING = 6; // Space between text lines (was 6)
    const UNDERLINE_OFFSET = 1; // Space between text and underline (was 2)
    const DASH_COLOR = 100; // Dark gray
    const LINE_WIDTH = 0.2;
    const SECTION_SPACING = 0.1; // Added space between sections
    doc.setFont(undefined, "Helvetica");

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    const devisY = 60;
    doc.text("Devis", margin, devisY);

    // Left info under "Devis"
    const emissionMoment = command.date ? moment(command.date) : moment();

    const leftTexts = [
      `Numéro                               ${
        command.originalNumCommand || ""
      }`,
      `Date d'émission:                 ${emissionMoment.format("DD/MM/YYYY")}`,
      `Date d'expiration:               ${emissionMoment
        .clone()
        .add(1, "month")
        .format("DD/MM/YYYY")}`,
      `Type de vente:                    Prestation de service`,
    ];

    // Draw left texts in regular font size 10
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
    let currentRightYy = 58; // adjust if needed

    // 1️⃣ "Client ou cliente:" in bold, size 12
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // black
    doc.text("Client ou cliente:", rightStartXd, currentRightYy);

    // 2️⃣ Client name in bold and green
    currentRightYy += LINE_SPACING; // space below header
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 128, 0); // green
    doc.text(`${command.nom || ""}`, rightStartXd, currentRightYy);

    // 3️⃣ Rest of the details in regular font
    const otherRightTexts = [
      `${command.address || ""}`,
      `${command.ville || ""}   ${command.codepostal || ""}`,
      `${command.email || ""}`,
    ];

    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    currentRightYy += LINE_SPACING; // spacing below client name
    otherRightTexts.forEach((text, index) => {
      doc.text(text, rightStartXd, currentRightYy);
      currentRightYy +=
        LINE_SPACING +
        (index < otherRightTexts.length - 1 ? SECTION_SPACING : 0);
    });

    // Get max widths
    const maxLeftWidth = Math.max(
      ...leftTexts.map(
        (t) =>
          (doc.getStringUnitWidth(t) * doc.internal.getFontSize()) /
          doc.internal.scaleFactor
      )
    );

    // INCREASED STARTING Y POSITIONS - PUSHED DOWN BY 20 UNITS
    let currentLeftY = 65; // Changed from 50 to 70
    leftTexts.forEach((text, index) => {
      doc.text(text, margin, currentLeftY);
      // drawUnderline(doc, margin, currentLeftY + UNDERLINE_OFFSET, maxLeftWidth);
      // Add extra space after each section except the last one
      currentLeftY +=
        LINE_SPACING + (index < leftTexts.length - 1 ? SECTION_SPACING : 0);
    });

    // Order number and date (moved down by additional 20pt)
    doc.setFontSize(10);

    // Save current text color
    const currentTextColors = doc.getTextColor();
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black

    const prestationsYStart = 100; // Y position of the first line
    const lineSpacing = 6; // space between lines

    // Line 1: Nature des prestations
    doc.text(`Nature des prestations:`, margin, prestationsYStart);
    doc.setFont(undefined, "Helvetica");
    // Line 3: Installation description
    doc.text(
      `Installation et raccordement d'une pompe à chaleur AIR/EAU`,
      margin,
      prestationsYStart + lineSpacing
    );

    // Line 4: Nota
    doc.text(
      `Nota: Fourniture des radiateurs par le client.`,
      margin,
      prestationsYStart + lineSpacing * 2
    );

    // Draw date in black (right aligned)
    doc.setTextColor(0, 0, 0); // Black
    // Right-aligned page number
    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black
    doc.text(
      `Page(s): 1 sur 2`,
      pageWidth - margin,
      105, // same Y as previous date
      { align: "right" }
    );

    // Restore original text color
    doc.setTextColor(currentTextColors);

    doc.setFont(undefined, "Helvetica");
    // Restore original text color
    doc.setTextColor(currentTextColors);
    // Work description header
    doc.setFontSize(9);

    const originalTextColor = doc.getTextColor();

    // const descWidth = 100;
    // const qteWidth = 15;
    // const prixWidth = 30;
    // const ttcWidth = 40;
    const descWidth = 120; // a bit narrower description
    const qteWidth = 20; // increase quantity width
    const prixWidth = 35; // increase unit price width
    const ttcWidth = 20; // increase total TTC width

    const descX = margin;
    const qteX = descX + descWidth;
    const prixX = qteX + qteWidth;
    const ttcX = prixX + prixWidth;

    // Vertical line positions
    const line1 = descX + descWidth;
    const line2 = line1 + qteWidth;
    const line3 = line2 + prixWidth;

    // Header parameters - ADJUSTED VALUES (PUSHED DOWN BY 20 UNITS)
    const headerY = 120; // Changed from 90 to 110
    const headerHeight = 8; // Height of the green background
    const textY = headerY + 6; // Text positioned 6 units down from header top
    const firstLineY = headerY + headerHeight; // First line goes right below header

    // Draw header background (light green)
    doc.setFillColor(21, 128, 61);
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
    doc.text("Prix u. HT", prixCenter, textY, { align: "center" });
    doc.text("Total HT", ttcCenter, textY, { align: "center" });

    // Reset to normal font
    doc.setFont(undefined, "normal");

    // Table body parameters
    const tableEndY = pageHeight - 14;
    const rowCount = 2;
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
    if (command.items && command.items.length > 0) {
      command.items.forEach((item) => {
        tableData.push({
          title: item.title || "N/A",
          reference: item.reference || "",
          description: item.description || "",
          quantity: item.quantite || 1,
          unitPrice: item.prixUnitaire || 0,
          total:
            item.montantTTC ||
            item.prixUnitaire * item.quantite * (1 + (item.tva || 0) / 100),
        });
      });
    } else {
      tableData.push({
        title: command.title || "N/A",
        reference: command.reference || "",
        description: command.description || "",
        quantity: command.quantite || 1,
        unitPrice:
          command.prixUnitaire || command.totalHT / (command.quantite || 1),
        total: command.totalTTC || 0,
      });
    }
    let currentRowY = firstLineY + 8; // start just below header
    tableData.forEach((row) => {
      // Font sizes and spacing
      const titleFontSize = 10;
      const refFontSize = 10;
      const descFontSize = 9;
      const titleRefSpacing = 0.5; // small space between title and ref
      const refDescSpacing = 0.5; // small space between ref and description
      const descLineSpacing = 0.3; // space between description lines

      // Split description into lines
      const descLines = doc.splitTextToSize(row.description, descWidth - 15);

      // Calculate total height of the left cell
      const totalHeight =
        titleFontSize +
        titleRefSpacing +
        refFontSize +
        refDescSpacing +
        descLines.length * (descFontSize + descLineSpacing);

      // Center Y for numeric columns
      const centerY = currentRowY + totalHeight / 2;

      // --- Left column: title, reference, description ---
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
        // Prepend bullet only once per original line
        const lineWithBullet = `• ${rawLine}`;

        // Wrap long lines
        const wrappedLines = doc.splitTextToSize(
          lineWithBullet,
          descWidth - 15
        );

        // Draw each wrapped line (lineY moves down each time)
        wrappedLines.forEach((line) => {
          doc.text(line, descX + 4, lineY);
          lineY += descFontSize + descLineSpacing;
        });
      });
      // --- Numeric columns: centered vertically ---
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(row.quantity.toString(), qteX + qteWidth / 2, centerY, {
        align: "center",
      });
      doc.text(
        `${row.unitPrice.toFixed(2)} €`,
        prixX + prixWidth - 5,
        centerY,
        { align: "right" }
      );
      doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth - 5, centerY, {
        align: "right",
      });

      // Move currentRowY for next row
      currentRowY += totalHeight + 2; // small spacing between rows
    });
    doc.setPage(1);
    addFooter(1);

    // === Page 2 ======================================================================================
    doc.addPage();

    const marginTopp = 10;
    const marginLeftp = 5;
    const logoWidthp = 40;
    const logoHeightp = 40;
    const logoleftwidthp = 40;
    const logoleftheightp = 40;

    // Left logo
    doc.addImage(
      logo,
      "JPEG",
      marginLeftp, // X
      marginTopp, // Y
      logoleftwidthp, // width
      logoleftheightp // height
    );

    // Center logo
    doc.addImage(
      logorge,
      "PNG",
      (pageWidth - logoWidthp) / 2, // center horizontally
      marginTopp, // Y
      logoWidthp,
      logoHeightp
    );

    // Page number bottom right
    doc.setFontSize(10);
    doc.text(`Page(s): 2 sur 2`, pageWidth - 30, marginTopp + 40);

    // Restore original text color
    doc.setTextColor(currentTextColors);

    // // === Common Constants ===
    const TABLE_ROW_HEIGHT = 15; // Increased from 8 to 10 for better spacing

    // };
    // === Common Constants ===
    const BODY_ROW_HEIGHT = 55; // Height of body rows
    const HEADER_ROW_HEIGHT = 8; // Smaller header height (reduced from 15)
    const ROWS_PER_PAGE = 2;

    // Column widths
    const DESC_WIDTH = 120;
    const QTY_WIDTH = 20;
    const UNIT_PRICE_WIDTH = 35;
    const TOTAL_WIDTH = 20;

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
      const headerBgColor = [21, 128, 61];

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
        "Descriptif des travaux (Page 2/2)",
        DESC_X + DESC_WIDTH / 2,
        textY,
        { align: "center" }
      );
      doc.text("QTÉ", QTY_X + QTY_WIDTH / 2, textY, { align: "center" });
      doc.text("Prix u. HT", UNIT_PRICE_X + UNIT_PRICE_WIDTH / 2, textY, {
        align: "center",
      });
      doc.text("Total HT", TOTAL_X + TOTAL_WIDTH / 2, textY, {
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

    // Draw table frame for page 2 with increased row height
    const tableStartY2 = 55;
    const tableEndY2 = tableStartY2 + ROWS_PER_PAGE * TABLE_ROW_HEIGHT;
    drawTableFrame(tableStartY2, tableEndY2, 2);

    // === TVA Recap Section ===
    let recapY = tableEndY2 + 110;

    // Section title
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Détail TVA", margin, recapY);

    // Reset font
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");

    recapY += 10;

    // --- TVA stacked format ---
    const col1X = margin;
    const col2X = margin + 40;
    const col3X = margin + 80;

    // Taux
    doc.setFont(undefined, "bold");
    doc.text("Taux:", col1X, recapY);
    doc.setFont(undefined, "normal");
    doc.text("5,5%", col1X, recapY + 6);

    // Montant TVA
    doc.setFont(undefined, "bold");
    doc.text("Montant TVA:", col2X, recapY);
    doc.setFont(undefined, "normal");
    doc.text(`${command.totalTVA || "42,40"} €`, col2X, recapY + 6);

    // Base HT
    doc.setFont(undefined, "bold");
    doc.text("Base HT:", col3X, recapY);
    doc.setFont(undefined, "normal");
    doc.text(`${command.totalHT || "424"} €`, col3X, recapY + 6);

    // --- Récapitulatif box ---
    const recapBoxX = pageWidth - 80; // widen the box
    let recapBoxY = recapY - 16;

    // Background rectangle (gray box)
    const boxWidth = 80;
    const boxHeight = 35; // adjust depending on spacing
    doc.setFillColor(200); // gray 400
    doc.rect(recapBoxX - 5, recapBoxY, boxWidth, boxHeight, "F");

    // Title
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text("Récapitulatif", recapBoxX, recapBoxY + 5, { align: "left" });

    // Totals
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);

    recapBoxY += 16;
    doc.text("Total HT:", recapBoxX, recapBoxY, { align: "left" });
    doc.text(
      `${command.totalHT || "17 800,51"} €`,
      pageWidth - margin,
      recapBoxY,
      { align: "right" }
    );

    recapBoxY += 8;
    doc.text("Total TVA:", recapBoxX, recapBoxY, { align: "left" });
    doc.text(
      `${command.totalTVA || "979,03"} €`,
      pageWidth - margin,
      recapBoxY,
      { align: "right" }
    );

    recapBoxY += 8;
    doc.text("Total TTC:", recapBoxX, recapBoxY, { align: "left" });
    doc.text(`${command.totalTTC} €`, pageWidth - margin, recapBoxY, {
      align: "right",
    });

    // === Signature Section ===
    recapY += 40;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text("Date et signature précédée de la mention :", margin, recapY);
    recapY += 6;
    doc.text('"Bon pour accord"', margin, recapY);
    // Styling Configuration
    const LEGAL_FONT_SIZE = 9;
    const LINE_HEIGHT = 5;
    const BULLET_INDENT = 5;
    const MAX_WIDTH = pageWidth - 2 * margin;

    // Draw the professional legal section
    let currentY = 200;

    doc.setDrawColor(0);

    // Legal text header
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    // doc.text("DECLARATIONS LEGALES", pageWidth / 2, currentY, { align: "center" });
    currentY += LINE_HEIGHT + 2;

    doc.setFontSize(LEGAL_FONT_SIZE);
    doc.setFont(undefined, "normal");

    // Add signature lines
    currentY += 10;
    doc.setDrawColor(0);
    doc.setFontSize(10);
    doc.setPage(2);
    addFooter(2);
    // Save the PDF
    doc.save(`Devis_${command.originalNumCommand}.pdf`);
  };

  const handleSendPdf = async (commandId, e) => {
    e.stopPropagation();

    // const command = allCommands.find((cmd) => cmd._id === commandId);
    // if (command.command_type !== "devis") {
    //   return message.warning(
    //     "Le devis est déjà validé et converti en commande."
    //   );
    // }
    setSendingEmails(prev => ({ ...prev, [commandId]: true }));

    const command = allCommands.find((cmd) => cmd._id === commandId);
    if (command.command_type !== "devis") {
      setSendingEmails(prev => ({ ...prev, [commandId]: false }));
      return message.warning("Le devis est déjà validé et converti en commande.");
    }

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

    // === Page 1 ===

    // Add logos - left logo only
    doc.addImage(
      logo,
      "JPEG",
      marginLeft, // Use marginLeft instead of marginTop for horizontal positioning
      marginTop,
      logoleftwidth,
      logoleftheight
    ); // Left logo

    // Company info on the right side
    doc.setFontSize(10); // same font size for all lines

    const rightStartX = pageWidth - 50; // Adjust X position

    // "Entreprise:" in bold
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Entreprise:", rightStartX, 15);

    // The rest in regular Helvetica
    doc.setFont(undefined, "Helvetica");
    doc.setTextColor(0, 128, 0); // green for company name
    doc.text("GLOBAL GREEN", rightStartX, 21);

    doc.setTextColor(0, 0, 0); // black for the rest
    doc.text("641 AVENUE DU GRAIN D'OR", rightStartX, 27);
    doc.text("41350 VINEUIL - France", rightStartX, 32);
    doc.text("Contact@global-green.fr", rightStartX, 37);
    doc.text("07 64 71 26 87", rightStartX, 42);

    doc.addImage(
      logorge, // You'll need to define this variable
      "PNG",
      pageWidth / 2 - logoWidth / 2,
      marginLeft,
      logoWidth,
      logoHeight,
      marginTop
    );

    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(11);
    // Configuration
    const LINE_SPACING = 6; // Space between text lines (was 6)
    const UNDERLINE_OFFSET = 1; // Space between text and underline (was 2)
    const DASH_COLOR = 100; // Dark gray
    const LINE_WIDTH = 0.2;
    const SECTION_SPACING = 0.1; // Added space between sections
    doc.setFont(undefined, "Helvetica");

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    const devisY = 60;
    doc.text("Devis", margin, devisY);

    // Left info under "Devis"
    const emissionMoment = command.date ? moment(command.date) : moment();

    const leftTexts = [
      `Numéro                               ${
        command.originalNumCommand || ""
      }`,
      `Date d'émission:                 ${emissionMoment.format("DD/MM/YYYY")}`,
      `Date d'expiration:               ${emissionMoment
        .clone()
        .add(1, "month")
        .format("DD/MM/YYYY")}`,
      `Type de vente:                    Prestation de service`,
    ];

    // Draw left texts in regular font size 10
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
    let currentRightYy = 58; // adjust if needed

    // 1️⃣ "Client ou cliente:" in bold, size 12
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // black
    doc.text("Client ou cliente:", rightStartXd, currentRightYy);

    // 2️⃣ Client name in bold and green
    currentRightYy += LINE_SPACING; // space below header
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 128, 0); // green
    doc.text(`${command.nom || ""}`, rightStartXd, currentRightYy);

    // 3️⃣ Rest of the details in regular font
    const otherRightTexts = [
      `${command.address || ""}`,
      `${command.ville || ""}   ${command.codepostal || ""}`,
      `${command.email || ""}`,
    ];

    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    currentRightYy += LINE_SPACING; // spacing below client name
    otherRightTexts.forEach((text, index) => {
      doc.text(text, rightStartXd, currentRightYy);
      currentRightYy +=
        LINE_SPACING +
        (index < otherRightTexts.length - 1 ? SECTION_SPACING : 0);
    });

    // Get max widths
    const maxLeftWidth = Math.max(
      ...leftTexts.map(
        (t) =>
          (doc.getStringUnitWidth(t) * doc.internal.getFontSize()) /
          doc.internal.scaleFactor
      )
    );

    // INCREASED STARTING Y POSITIONS - PUSHED DOWN BY 20 UNITS
    let currentLeftY = 65; // Changed from 50 to 70
    leftTexts.forEach((text, index) => {
      doc.text(text, margin, currentLeftY);
      // drawUnderline(doc, margin, currentLeftY + UNDERLINE_OFFSET, maxLeftWidth);
      // Add extra space after each section except the last one
      currentLeftY +=
        LINE_SPACING + (index < leftTexts.length - 1 ? SECTION_SPACING : 0);
    });

    // Order number and date (moved down by additional 20pt)
    doc.setFontSize(10);

    // Save current text color
    const currentTextColors = doc.getTextColor();
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black

    const prestationsYStart = 100; // Y position of the first line
    const lineSpacing = 6; // space between lines

    // Line 1: Nature des prestations
    doc.text(`Nature des prestations:`, margin, prestationsYStart);
    doc.setFont(undefined, "Helvetica");
    // Line 3: Installation description
    doc.text(
      `Installation et raccordement d'une pompe à chaleur AIR/EAU`,
      margin,
      prestationsYStart + lineSpacing
    );

    // Line 4: Nota
    doc.text(
      `Nota: Fourniture des radiateurs par le client.`,
      margin,
      prestationsYStart + lineSpacing * 2
    );

    // Draw date in black (right aligned)
    doc.setTextColor(0, 0, 0); // Black
    // Right-aligned page number
    doc.setFont(undefined, "Helvetica");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black
    doc.text(
      `Page(s): 1 sur 2`,
      pageWidth - margin,
      105, // same Y as previous date
      { align: "right" }
    );

    // Restore original text color
    doc.setTextColor(currentTextColors);

    doc.setFont(undefined, "Helvetica");
    // Restore original text color
    doc.setTextColor(currentTextColors);
    // Work description header
    doc.setFontSize(9);

    const originalTextColor = doc.getTextColor();

    // const descWidth = 100;
    // const qteWidth = 15;
    // const prixWidth = 30;
    // const ttcWidth = 40;
    const descWidth = 120; // a bit narrower description
    const qteWidth = 20; // increase quantity width
    const prixWidth = 35; // increase unit price width
    const ttcWidth = 20; // increase total TTC width

    const descX = margin;
    const qteX = descX + descWidth;
    const prixX = qteX + qteWidth;
    const ttcX = prixX + prixWidth;

    // Vertical line positions
    const line1 = descX + descWidth;
    const line2 = line1 + qteWidth;
    const line3 = line2 + prixWidth;

    // Header parameters - ADJUSTED VALUES (PUSHED DOWN BY 20 UNITS)
    const headerY = 120; // Changed from 90 to 110
    const headerHeight = 8; // Height of the green background
    const textY = headerY + 6; // Text positioned 6 units down from header top
    const firstLineY = headerY + headerHeight; // First line goes right below header

    // Draw header background (light green)
    doc.setFillColor(21, 128, 61);
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
    doc.text("Prix u. HT", prixCenter, textY, { align: "center" });
    doc.text("Total HT", ttcCenter, textY, { align: "center" });

    // Reset to normal font
    doc.setFont(undefined, "normal");

    // Table body parameters
    const tableEndY = pageHeight - 14;
    const rowCount = 2;
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
    if (command.items && command.items.length > 0) {
      command.items.forEach((item) => {
        tableData.push({
          title: item.title || "N/A",
          reference: item.reference || "",
          description: item.description || "",
          quantity: item.quantite || 1,
          unitPrice: item.prixUnitaire || 0,
          total:
            item.montantTTC ||
            item.prixUnitaire * item.quantite * (1 + (item.tva || 0) / 100),
        });
      });
    } else {
      tableData.push({
        title: command.title || "N/A",
        reference: command.reference || "",
        description: command.description || "",
        quantity: command.quantite || 1,
        unitPrice:
          command.prixUnitaire || command.totalHT / (command.quantite || 1),
        total: command.totalTTC || 0,
      });
    }
    let currentRowY = firstLineY + 8; // start just below header
    tableData.forEach((row) => {
      // Font sizes and spacing
      const titleFontSize = 10;
      const refFontSize = 10;
      const descFontSize = 9;
      const titleRefSpacing = 0.5; // small space between title and ref
      const refDescSpacing = 0.5; // small space between ref and description
      const descLineSpacing = 0.3; // space between description lines

      // Split description into lines
      const descLines = doc.splitTextToSize(row.description, descWidth - 15);

      // Calculate total height of the left cell
      const totalHeight =
        titleFontSize +
        titleRefSpacing +
        refFontSize +
        refDescSpacing +
        descLines.length * (descFontSize + descLineSpacing);

      // Center Y for numeric columns
      const centerY = currentRowY + totalHeight / 2;

      // --- Left column: title, reference, description ---
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
        // Prepend bullet only once per original line
        const lineWithBullet = `• ${rawLine}`;

        // Wrap long lines
        const wrappedLines = doc.splitTextToSize(
          lineWithBullet,
          descWidth - 15
        );

        // Draw each wrapped line (lineY moves down each time)
        wrappedLines.forEach((line) => {
          doc.text(line, descX + 4, lineY);
          lineY += descFontSize + descLineSpacing;
        });
      });
      // --- Numeric columns: centered vertically ---
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(row.quantity.toString(), qteX + qteWidth / 2, centerY, {
        align: "center",
      });
      doc.text(
        `${row.unitPrice.toFixed(2)} €`,
        prixX + prixWidth - 5,
        centerY,
        { align: "right" }
      );
      doc.text(`${row.total.toFixed(2)} €`, ttcX + ttcWidth - 5, centerY, {
        align: "right",
      });

      // Move currentRowY for next row
      currentRowY += totalHeight + 2; // small spacing between rows
    });
    doc.setPage(1);
    addFooter(1);

    // === Page 2 ======================================================================================
    doc.addPage();

    const marginTopp = 10;
    const marginLeftp = 5;
    const logoWidthp = 40;
    const logoHeightp = 40;
    const logoleftwidthp = 40;
    const logoleftheightp = 40;

    // Left logo
    doc.addImage(
      logo,
      "JPEG",
      marginLeftp, // X
      marginTopp, // Y
      logoleftwidthp, // width
      logoleftheightp // height
    );

    // Center logo
    doc.addImage(
      logorge,
      "PNG",
      (pageWidth - logoWidthp) / 2, // center horizontally
      marginTopp, // Y
      logoWidthp,
      logoHeightp
    );

    // Page number bottom right
    doc.setFontSize(10);
    doc.text(`Page(s): 2 sur 2`, pageWidth - 30, marginTopp + 40);

    // Restore original text color
    doc.setTextColor(currentTextColors);

    // // === Common Constants ===
    const TABLE_ROW_HEIGHT = 15; // Increased from 8 to 10 for better spacing

    // };
    // === Common Constants ===
    const BODY_ROW_HEIGHT = 55; // Height of body rows
    const HEADER_ROW_HEIGHT = 8; // Smaller header height (reduced from 15)
    const ROWS_PER_PAGE = 2;

    // Column widths
    const DESC_WIDTH = 120;
    const QTY_WIDTH = 20;
    const UNIT_PRICE_WIDTH = 35;
    const TOTAL_WIDTH = 20;

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
      const headerBgColor = [21, 128, 61];

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
        "Descriptif des travaux (Page 2/2)",
        DESC_X + DESC_WIDTH / 2,
        textY,
        { align: "center" }
      );
      doc.text("QTÉ", QTY_X + QTY_WIDTH / 2, textY, { align: "center" });
      doc.text("Prix u. HT", UNIT_PRICE_X + UNIT_PRICE_WIDTH / 2, textY, {
        align: "center",
      });
      doc.text("Total HT", TOTAL_X + TOTAL_WIDTH / 2, textY, {
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

    // Draw table frame for page 2 with increased row height
    const tableStartY2 = 55;
    const tableEndY2 = tableStartY2 + ROWS_PER_PAGE * TABLE_ROW_HEIGHT;
    drawTableFrame(tableStartY2, tableEndY2, 2);

    // === TVA Recap Section ===
    let recapY = tableEndY2 + 110;

    // Section title
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Détail TVA", margin, recapY);

    // Reset font
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");

    recapY += 10;

    // --- TVA stacked format ---
    const col1X = margin;
    const col2X = margin + 40;
    const col3X = margin + 80;

    // Taux
    doc.setFont(undefined, "bold");
    doc.text("Taux:", col1X, recapY);
    doc.setFont(undefined, "normal");
    doc.text("5,5%", col1X, recapY + 6);

    // Montant TVA
    doc.setFont(undefined, "bold");
    doc.text("Montant TVA:", col2X, recapY);
    doc.setFont(undefined, "normal");
    doc.text(`${command.totalTVA || "42,40"} €`, col2X, recapY + 6);

    // Base HT
    doc.setFont(undefined, "bold");
    doc.text("Base HT:", col3X, recapY);
    doc.setFont(undefined, "normal");
    doc.text(`${command.totalHT || "424"} €`, col3X, recapY + 6);

    // --- Récapitulatif box ---
    const recapBoxX = pageWidth - 80; // widen the box
    let recapBoxY = recapY - 16;

    // Background rectangle (gray box)
    const boxWidth = 80;
    const boxHeight = 35; // adjust depending on spacing
    doc.setFillColor(200); // gray 400
    doc.rect(recapBoxX - 5, recapBoxY, boxWidth, boxHeight, "F");

    // Title
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text("Récapitulatif", recapBoxX, recapBoxY + 5, { align: "left" });

    // Totals
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);

    recapBoxY += 16;
    doc.text("Total HT:", recapBoxX, recapBoxY, { align: "left" });
    doc.text(
      `${command.totalHT || "17 800,51"} €`,
      pageWidth - margin,
      recapBoxY,
      { align: "right" }
    );

    recapBoxY += 8;
    doc.text("Total TVA:", recapBoxX, recapBoxY, { align: "left" });
    doc.text(
      `${command.totalTVA || "979,03"} €`,
      pageWidth - margin,
      recapBoxY,
      { align: "right" }
    );

    recapBoxY += 8;
    doc.text("Total TTC:", recapBoxX, recapBoxY, { align: "left" });
    doc.text(`${command.totalTTC} €`, pageWidth - margin, recapBoxY, {
      align: "right",
    });

    // === Signature Section ===
    recapY += 40;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text("Date et signature précédée de la mention :", margin, recapY);
    recapY += 6;
    doc.text('"Bon pour accord"', margin, recapY);
    // Styling Configuration
    const LEGAL_FONT_SIZE = 9;
    const LINE_HEIGHT = 5;
    const BULLET_INDENT = 5;
    const MAX_WIDTH = pageWidth - 2 * margin;

    // Draw the professional legal section
    let currentY = 200;

    doc.setDrawColor(0);

    // Legal text header
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    // doc.text("DECLARATIONS LEGALES", pageWidth / 2, currentY, { align: "center" });
    currentY += LINE_HEIGHT + 2;

    doc.setFontSize(LEGAL_FONT_SIZE);
    doc.setFont(undefined, "normal");

    // Add signature lines
    currentY += 10;
    doc.setDrawColor(0);
    doc.setFontSize(10);
    doc.setPage(2);
    addFooter(2);
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
      setAllCommands((prevCommands) =>
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

  const handleUpdateStatus = async (commandId, newStatus) => {
    try {
      const response = await axios.put(`/command/update-status/${commandId}`, {
        status: newStatus,
      });

      // Update the command in the UI
      setAllCommands((prevCommands) =>
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

      setAllCommands((prevCommands) =>
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

  // const handleUpdateCommand = async (id) => {
  //   // Logic to refresh command data
  //   const updatedCommand = await axios.get(`/command/${id}`);
  //   setCommand(updatedCommand);
  // };
  const handleUpdateCommand = async (id) => {
    // Refresh the command data and invoices
    const token = localStorage.getItem("token");
    try {
      const updatedCommand = await axios.get(`/command/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Also refresh invoices for this command
      const invoices = await refreshCommandInvoices(id);

      setAllCommands((prevCommands) =>
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
  // Update the handleValidate function to work with the new status system
  const handleValidate = async (commandId) => {
    try {
      await handleUpdateStatus(commandId, "accepté");

      // Also update command_type to "facture" for accepted devis
      const currentCommand = allCommands.find(
        (command) => command._id === commandId
      );

      if (currentCommand) {
        const isCurrentlyValid = currentCommand.command_type === "facture";
        const oldNumCommand = currentCommand.numCommand;

        let newNumCommand, newCommandType;

        if (isCurrentlyValid) {
          // Revert to devis (invalidate)
          newNumCommand = "D" + oldNumCommand.slice(1);
          newCommandType = "devis";
        } else {
          // Validate to facture
          newNumCommand = "F" + oldNumCommand.slice(1);
          newCommandType = "facture";
        }

        const response = await axios.put(`/command/validate/${commandId}`, {
          ...currentCommand,
          command_type: newCommandType,
          numCommand: newNumCommand,
          originalNumCommand: oldNumCommand,
        });

        // Update the command in the UI
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
      }
    } catch (error) {
      console.error("Error toggling command status:", error);
    } finally {
      setSendingEmails(prev => ({ ...prev, [commandId]: false }));
    }
  };

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
            {role === "Admin" && record.status === "accepté" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleValidate(record._id);
                }}
                className={`px-2 py-1 text-xs rounded-md ${
                  record.command_type === "facture"
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                } transition-colors`}
              >
                {record.command_type === "facture" ? "Invalider" : "Valider"}
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
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        let color, text;

        switch (status) {
          case "brouillon":
            color = "default";
            text = "Brouillon";
            break;
          case "envoyé":
            color = "blue";
            text = "Envoyé";
            break;
          case "accepté":
            color = "green";
            text = "Accepté";
            break;
          case "refusé":
            color = "red";
            text = "Refusé";
            break;
          case "expiré":
            color = "orange";
            text = "Expiré";
            break;
          default:
            color = "default";
            text = status;
        }

        return (
          <div className="flex items-center gap-2">
            <Tag color={color}>{text}</Tag>
            {record.date_expiration && status === "envoyé" && (
              <span className="text-xs text-gray-500">
                Exp: {moment(record.date_expiration).format("DD/MM/YYYY")}
              </span>
            )}
          </div>
        );
      },
      filters: [
        { text: "Brouillon", value: "brouillon" },
        { text: "Envoyé", value: "envoyé" },
        { text: "Accepté", value: "accepté" },
        { text: "Refusé", value: "refusé" },
        { text: "Expiré", value: "expiré" },
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
                  disabled={record.command_type !== "facture"}
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
                {hasBillingPlan && hasInvoices && (
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
                )}

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
                    Prix Unitaire:{" "}
                    {parseFloat(item.prixUnitaire || 0).toFixed(2)} €
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
      title: "Total HT",
      dataIndex: "totalHT",
      key: "totalHT",
      render: (text, record) => {
        // Calculate total from items if they exist
        const itemsTotal = record.items?.reduce(
          (sum, item) =>
            sum +
            parseFloat(item.prixUnitaire || 0) * parseInt(item.quantite || 1),
          0
        );

        // Use either the calculated itemsTotal or the root-level prixUnitaire * quantite
        const calculatedTotal = itemsTotal
          ? itemsTotal
          : parseFloat(record.prixUnitaire || 0) *
            parseInt(record.quantite || 1);

        // Fallback to the API-provided totalHT if calculations don't make sense
        const displayTotal =
          itemsTotal || record.prixUnitaire
            ? calculatedTotal
            : parseFloat(text || 0);

        return (
          <div className="text-right">
            {/* Main Total */}
            <div className="font-medium">{displayTotal.toFixed(2)} €</div>

            {/* Breakdown */}
            {record.items?.length > 0 ? (
              <div className="text-xs text-gray-500">
                {record.items.map((item, i) => (
                  <div key={`item-ht-${i}`}>
                    {item.prixUnitaire} € × {item.quantite} ={" "}
                    {(item.prixUnitaire * item.quantite).toFixed(2)} €
                  </div>
                ))}
              </div>
            ) : record.prixUnitaire ? (
              <div className="text-xs text-gray-500">
                {record.prixUnitaire} € × {record.quantite} ={" "}
                {calculatedTotal.toFixed(2)} €
              </div>
            ) : null}
          </div>
        );
      },
      sorter: (a, b) => {
        // Get comparable values for both records
        const getValue = (record) => {
          const itemsTotal = record.items?.reduce(
            (sum, item) =>
              sum +
              parseFloat(item.prixUnitaire || 0) * parseInt(item.quantite || 1),
            0
          );
          return itemsTotal || parseFloat(record.totalHT || 0);
        };
        return getValue(a) - getValue(b);
      },
    },

    {
      title: "Total TVA",
      dataIndex: "totalTVA",
      key: "totalTVA",
      render: (text, record) => {
        // Get TVA from either items or root level
        const tvaSource = record.items?.length
          ? record.items.reduce((sum, item) => sum + (item.montantTVA || 0), 0)
          : record.totalTVA || 0;

        return (
          <div className="text-right">
            <div className="font-medium">
              {parseFloat(tvaSource).toFixed(2)} €
            </div>
            {record.items?.length > 0 && (
              <div className="text-xs text-gray-500">
                {record.items
                  .filter((item) => item.montantTVA)
                  .map((item, i) => (
                    <div key={`tva-detail-${i}`}>
                      {item.montantTVA.toFixed(2)} €{" "}
                      {item.tva && `(${item.tva}%)`}
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      },
      sorter: (a, b) => {
        const getTva = (record) =>
          record.items?.reduce(
            (sum, item) => sum + (item.montantTVA || 0),
            0
          ) || parseFloat(record.totalTVA || 0);
        return getTva(a) - getTva(b);
      },
    },

    {
      title: "Prix Total TTC",
      dataIndex: "totalTTC",
      key: "totalTTC",
      render: (text, record) => {
        // Get TTC from the most reliable source
        const ttcSource = record.items?.length
          ? record.items.reduce((sum, item) => sum + (item.montantTTC || 0), 0)
          : record.totalTTC ||
            parseFloat(record.totalHT || 0) + parseFloat(record.totalTVA || 0);

        return (
          <div className="text-right">
            <div className="font-medium">
              {parseFloat(ttcSource).toFixed(2)} €
            </div>
            {record.items?.length > 0 ? (
              <div className="text-xs text-gray-500">
                {record.items
                  .filter((item) => item.montantTTC)
                  .map((item, i) => (
                    <div key={`ttc-detail-${i}`}>
                      {item.montantTTC.toFixed(2)} €
                    </div>
                  ))}
              </div>
            ) : (
              !record.items?.length &&
              record.totalHT &&
              record.totalTVA && (
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
          record.items?.reduce(
            (sum, item) => sum + (item.montantTTC || 0),
            0
          ) ||
          parseFloat(record.totalTTC || 0) ||
          parseFloat(record.totalHT || 0) + parseFloat(record.totalTVA || 0);
        return getTtc(a) - getTtc(b);
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const decodedToken = jwtDecode(localStorage.getItem("token"));
        const role = decodedToken?.role;

        return (
          <Space size="middle">
            <Button
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(record, e);
              }}
              disabled={record.status === "accepté"}
              title={
                record.status === "accepté"
                  ? "Devis verrouillé"
                  : "Modifier le devis"
              }
            />
            <Button
              icon={<FilePdfOutlined />}
              onClick={(e) => {
                e.stopPropagation(); // Add this line
                handleDownload(record._id, e);
              }}
              title="Télécharger le devis"
            />

            {/* Send button - only for brouillon status */}
            {record.status === "brouillon" && (
              <Button
                icon={<SendOutlined />}
                loading={sendingEmails[record._id] || false}
                onClick={(e) => {
                  e.stopPropagation(); // Add this line
                  handleSendPdf(record._id, e);
                }}
                title="Envoyer le devis"
              />
            )}

            {/* Status management buttons - for Admin */}
            {role === "Admin" && record.status === "envoyé" && (
              <>
                <Button
                  icon={<CheckOutlined />}
                  onClick={(e) => {
                    e.stopPropagation(); // Add this line
                    handleUpdateStatus(record._id, "accepté");
                  }}
                  title="Marquer comme accepté"
                />
                <Button
                  icon={<CloseOutlined />}
                  onClick={(e) => {
                    e.stopPropagation(); // Add this line
                    handleUpdateStatus(record._id, "refusé");
                  }}
                  title="Marquer comme refusé"
                  danger
                />
              </>
            )}

            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation(); // Add this line
                handleDelete(record._id, e);
              }}
            />
          </Space>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Devis Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <Statistic title="Total Devis" value={stats.totalCommands} />
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
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Statistiques Factures</h2>
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Factures"
                value={factureStats.totalFactures}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total HT Factures"
                value={factureStats.totalHTFactures}
                precision={2}
                suffix="€"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total TTC Factures"
                value={factureStats.totalTTCAFactures}
                precision={2}
                suffix="€"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Montant Payé"
                value={factureStats.totalPaye}
                precision={2}
                suffix="€"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Reste à Payer"
                value={factureStats.resteAPayer}
                precision={2}
                suffix="€"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Factures Payées"
                value={factureStats.facturesPayees}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Factures En Attente"
                value={factureStats.facturesEnAttente}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Paiements Partiels"
                value={factureStats.facturesPartielles}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
        
        {/* Barre de progression globale */}
        {factureStats.totalTTCAFactures > 0 && (
          <Card className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Progression globale des paiements</span>
              <span className="text-sm text-gray-600">
                {((factureStats.totalPaye / factureStats.totalTTCAFactures) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-green-500 h-4 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(factureStats.totalPaye / factureStats.totalTTCAFactures) * 100}%`,
                  maxWidth: '100%'
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Payé: {factureStats.totalPaye.toFixed(2)}€</span>
              <span>Total: {factureStats.totalTTCAFactures.toFixed(2)}€</span>
            </div>
          </Card>
        )}
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
          dataSource={filteredCommands}
          onRow={(record) => ({
            onClick: (e) => {
              if (
                e.target.tagName !== "BUTTON" &&
                !e.target.closest("button")
              ) {
                window.location.href = `/lead/${record.lead}`;
              }
            },
            style: { cursor: "pointer" },
          })}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
          bordered
        />
      </div>
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
    </div>
  );
};

export default AllDevis;

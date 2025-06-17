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
  Radio
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined,
  SendOutlined,
  CloseOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import { jsPDF } from "jspdf";
import logo from "../assets/logo.jpeg";

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
  const [activeFilter, setActiveFilter] = useState('all'); 
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
      const role = decodedToken.role
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
      console.log('devisCommands', devisCommands)

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
      const totalHT = baseHT + forfait; // Include forfait in HT
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
    switch(filterType) {
      case 'en_cours':
        filtered = allCommands.filter(cmd => cmd.command_type === "devis");
        break;
      case 'accepte':
        filtered = allCommands.filter(cmd => cmd.command_type === "commande");
        console.log('filtered', filtered)
        break;
      case 'all':
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

    // === Add logo ===
    const logoWidth = 20;
    const logoHeight = 20;
    doc.addImage(logo, "JPEG", 15, 15, logoWidth, logoHeight);

    // === Company info just below logo ===
    const infoStartY = 10 + logoHeight + 18; // e.g., 40
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text("Global energy", 15, infoStartY);
    doc.text("99c boulevard Constantin Descat", 15, infoStartY + 6);
    doc.text("9200 Tourcoing, France", 15, infoStartY + 12);
    doc.text("Tél: +33 6 10 08 33 86", 15, infoStartY + 20);
    doc.text("Email: global.energy@gmail.com", 15, infoStartY + 26);
    doc.setTextColor(0, 102, 204);
    doc.setFont(undefined, "bold");
    doc.text(`Devis n°: ${command.originalNumCommand}`, 15, infoStartY + 50);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.text(`Valable 10 jours`, 15, infoStartY + 55);
    doc.text(
      `En date du: ${moment(command.date).format("DD/MM/YYYY")}`,
      120,
      infoStartY + 50
    );

    const infoBoxWidth = 80;
    const infoBoxX = 120; // Starting X position

    // Set text color that contrasts with the background
    doc.setTextColor(40, 40, 40); // Dark gray text
    const maxAddressWidth = 80; // Maximum width in points (about 80mm)

    // Split the address into multiple lines if needed
    const addressLines = doc.splitTextToSize(
      command.address || "Non spécifié",
      maxAddressWidth
    );

    const lineHeight = 7; // Height per line in points

    const infoBoxHeights = 28 + (addressLines.length - 1) * lineHeight;
    doc.setFillColor(229, 231, 235);
    doc.setTextColor(40, 40, 40);
    doc.rect(infoBoxX, infoStartY, infoBoxWidth, infoBoxHeights, "F");
    // Add text on top of the background
    doc.setFontSize(8);
    doc.text(
      `MONSIEUR: ${command.nom || "Non spécifié"}`,
      infoBoxX + 5,
      infoStartY + 8
    );
    // doc.text(`${command.address || "Non spécifié"}`, infoBoxX + 5, infoStartY + 16);
    addressLines.forEach((line, index) => {
      doc.text(line, infoBoxX + 5, infoStartY + 16 + index * lineHeight);
    });
    doc.text(
      `${command.siret || "Non spécifié"}`,
      infoBoxX + 5,
      infoStartY + 16 + addressLines.length * lineHeight
    );
    // doc.text(`SIRET: ${command.siret || "Non spécifié"}`, infoBoxX + 5, infoBoxX + 24);

    // === Table headers ===
    const tableStartY = infoStartY + 70;
    doc.setFillColor(0, 102, 204);
    doc.setTextColor(255, 255, 255);
    doc.setDrawColor(209, 213, 219);
    doc.rect(15, tableStartY, 190, 10, "F");

    doc.text("N°", 20, tableStartY + 6);
    doc.text("Désignation", 35, tableStartY + 6);
    doc.text("Qté", 125, tableStartY + 6);
    doc.text("PU HT", 145, tableStartY + 6);
    doc.text("TVA", 165, tableStartY + 6);
    doc.text("Total HT", 200, tableStartY + 6, { align: "right" });

    // === Table row ===
    const cleanDescription = command.description.split(",")[0].trim();
    const splitDescription = doc.splitTextToSize(cleanDescription, 90);
    const rowHeight = Math.max(10, splitDescription.length * 30);
    const rowY = tableStartY + 10;

    doc.setFillColor(255, 255, 255);
    doc.setTextColor(40, 40, 40);

    // Borders
    doc.rect(15, rowY, 15, rowHeight); // N°
    doc.rect(30, rowY, 90, rowHeight); // Désignation
    doc.rect(120, rowY, 20, rowHeight); // Qté
    doc.rect(140, rowY, 20, rowHeight); // PU HT
    doc.rect(160, rowY, 20, rowHeight); // TVA
    doc.rect(180, rowY, 25, rowHeight); // Total HT

    // Content
    doc.text("1", 20, rowY + 12);
    doc.text(splitDescription, 32, rowY + 12);
    doc.text(command.quantite.toString() + " u", 125, rowY + 12);
    doc.text(
      `${(command.totalHT / command.quantite).toFixed(2)} €`,
      142,
      rowY + 12
    );
    doc.text("(20%)", 165, rowY + 12);
    doc.text(`${command.totalHT.toFixed(2)} €`, 200, rowY + 12, {
      align: "right",
    });

    // doc.setFont(undefined, "bold");
    // doc.text("Le client", 30, rowY + rowHeight + 40);
    const infoBoxWidths = 80;
    const infoBoxXs = 30;
    const infoStartYs = 250;
    const infoBoxHeightss = 28;

    doc.setFillColor(229, 231, 235);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);
    doc.rect(infoBoxXs, infoStartYs, infoBoxWidths, infoBoxHeightss, "F");
    // Add text on top of the background
    doc.text("Le client", infoBoxXs + 5, infoStartYs + 4);
    doc.text("Mention manuscrite et datée :", infoBoxXs + 5, infoStartYs + 8);

    doc.text("« Bon pour accord. »", infoBoxXs + 5, infoStartYs + 12);

    const pageWidth = doc.internal.pageSize.getWidth(); // Get full width of the page
    const paymentY = rowY + rowHeight + 15;
    const totalsColWidth = 60;
    const totalsRowHeight = 8;

    // Align table to the far right
    const totalsX = pageWidth - totalsColWidth - 5;

    // Payment info (left side)
    doc.setTextColor(40, 40, 40);
    doc.text(
      "Paiement par virement bancaire ou par carte bleue.",
      15,
      paymentY
    );
    doc.setDrawColor(209, 213, 219); // black line
    doc.setLineWidth(0.2);
    doc.line(totalsX, paymentY - 3, totalsX + totalsColWidth, paymentY - 3);
    // Totals table data
    const totalsData = [
      { label: "Total HT", value: `${command.totalHT.toFixed(2)} €` },
      { label: "TVA à 20%", value: `${command.totalTVA.toFixed(2)} €` },
      {
        label: "Total TTC",
        value: `${command.totalTTC.toFixed(2)} €`,
        bold: true,
        bgColor: [229, 231, 235], // gray-200
      },
    ];

    // Draw table background and border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.2);

    // Add rows
    totalsData.forEach((row, index) => {
      const rowY = paymentY + index * totalsRowHeight;

      // Background
      if (row.bgColor) {
        doc.setFillColor(...row.bgColor);
        doc.rect(totalsX, rowY - 1, totalsColWidth, totalsRowHeight, "F");
      }

      // Text
      if (row.bold) {
        doc.setFont(undefined, "normal");
      } else {
        doc.setFont(undefined, "normal");
      }

      // Label and value
      doc.setTextColor(40, 40, 40);
      doc.text(row.label, totalsX + 4, rowY + 5);
      doc.text(row.value, totalsX + totalsColWidth - 4, rowY + 5, {
        align: "right",
      });

      // Divider line between rows
      if (index < totalsData.length - 1) {
        doc.line(
          totalsX,
          rowY + totalsRowHeight,
          totalsX + totalsColWidth,
          rowY + totalsRowHeight
        );
      }
    });

    // === Save ===
    doc.save(`Devis_${command.numCommand}.pdf`);
  };

  const handleSendPdf = async (commandId, e) => {
    e.stopPropagation();
  
    const command = allCommands.find((cmd) => cmd._id === commandId);
    if (command.command_type !== "devis") {
      return message.warning("Le devis est déjà validé et converti en commande.");

    }
  
    const doc = new jsPDF();
  
     // === Add logo ===
     const logoWidth = 20;
     const logoHeight = 20;
     doc.addImage(logo, "JPEG", 15, 15, logoWidth, logoHeight);
 
     // === Company info just below logo ===
     const infoStartY = 10 + logoHeight + 18; // e.g., 40
     doc.setFontSize(10);
     doc.setTextColor(40, 40, 40);
     doc.text("Global energy", 15, infoStartY);
     doc.text("99c boulevard Constantin Descat", 15, infoStartY + 6);
     doc.text("9200 Tourcoing, France", 15, infoStartY + 12);
     doc.text("Tél: +33 6 10 08 33 86", 15, infoStartY + 20);
     doc.text("Email: global.energy@gmail.com", 15, infoStartY + 26);
     doc.setTextColor(0, 102, 204);
     doc.setFont(undefined, "bold");
     doc.text(`Devis n°: ${command.numCommand}`, 15, infoStartY + 50);
     doc.setTextColor(0, 0, 0);
     doc.setFont(undefined, "normal");
     doc.setFontSize(8);
     doc.text(`Valable 10 jours`, 15, infoStartY + 55);
     doc.text(
       `En date du: ${moment(command.date).format("DD/MM/YYYY")}`,
       120,
       infoStartY + 50
     );
 
     const infoBoxWidth = 80;
     const infoBoxX = 120; // Starting X position
 
     // Set text color that contrasts with the background
     doc.setTextColor(40, 40, 40); // Dark gray text
     const maxAddressWidth = 80; // Maximum width in points (about 80mm)
 
     // Split the address into multiple lines if needed
     const addressLines = doc.splitTextToSize(
       command.address || "Non spécifié",
       maxAddressWidth
     );
 
     const lineHeight = 7; // Height per line in points
 
     const infoBoxHeights = 28 + (addressLines.length - 1) * lineHeight;
     doc.setFillColor(229, 231, 235);
     doc.setTextColor(40, 40, 40);
     doc.rect(infoBoxX, infoStartY, infoBoxWidth, infoBoxHeights, "F");
     // Add text on top of the background
     doc.setFontSize(8);
     doc.text(
       `MONSIEUR: ${command.nom || "Non spécifié"}`,
       infoBoxX + 5,
       infoStartY + 8
     );
     // doc.text(`${command.address || "Non spécifié"}`, infoBoxX + 5, infoStartY + 16);
     addressLines.forEach((line, index) => {
       doc.text(line, infoBoxX + 5, infoStartY + 16 + index * lineHeight);
     });
     doc.text(
       `${command.siret || "Non spécifié"}`,
       infoBoxX + 5,
       infoStartY + 16 + addressLines.length * lineHeight
     );
     // doc.text(`SIRET: ${command.siret || "Non spécifié"}`, infoBoxX + 5, infoBoxX + 24);
 
     // === Table headers ===
     const tableStartY = infoStartY + 70;
     doc.setFillColor(0, 102, 204);
     doc.setTextColor(255, 255, 255);
     doc.setDrawColor(209, 213, 219);
     doc.rect(15, tableStartY, 190, 10, "F");
 
     doc.text("N°", 20, tableStartY + 6);
     doc.text("Désignation", 35, tableStartY + 6);
     doc.text("Qté", 125, tableStartY + 6);
     doc.text("PU HT", 145, tableStartY + 6);
     doc.text("TVA", 165, tableStartY + 6);
     doc.text("Total HT", 200, tableStartY + 6, { align: "right" });
 
     // === Table row ===
     const cleanDescription = command.description.split(",")[0].trim();
     const splitDescription = doc.splitTextToSize(cleanDescription, 90);
     const rowHeight = Math.max(10, splitDescription.length * 30);
     const rowY = tableStartY + 10;
 
     doc.setFillColor(255, 255, 255);
     doc.setTextColor(40, 40, 40);
 
     // Borders
     doc.rect(15, rowY, 15, rowHeight); // N°
     doc.rect(30, rowY, 90, rowHeight); // Désignation
     doc.rect(120, rowY, 20, rowHeight); // Qté
     doc.rect(140, rowY, 20, rowHeight); // PU HT
     doc.rect(160, rowY, 20, rowHeight); // TVA
     doc.rect(180, rowY, 25, rowHeight); // Total HT
 
     // Content
     doc.text("1", 20, rowY + 12);
     doc.text(splitDescription, 32, rowY + 12);
     doc.text(command.quantite.toString() + " u", 125, rowY + 12);
     doc.text(
       `${(command.totalHT / command.quantite).toFixed(2)} €`,
       142,
       rowY + 12
     );
     doc.text("(20%)", 165, rowY + 12);
     doc.text(`${command.totalHT.toFixed(2)} €`, 200, rowY + 12, {
       align: "right",
     });
 
    //  doc.setFont(undefined, "bold");
    //  doc.text("Le client", 30, rowY + rowHeight + 40);
     const infoBoxWidths = 80;
     const infoBoxXs = 30;
     const infoStartYs = 250;
     const infoBoxHeightss = 28;
 
     doc.setFillColor(229, 231, 235);
     doc.setTextColor(40, 40, 40);
     doc.setFontSize(8);
     doc.rect(infoBoxXs, infoStartYs, infoBoxWidths, infoBoxHeightss, "F");
     // Add text on top of the background
     doc.text("Le client", infoBoxXs + 5, infoStartYs + 4);
     doc.text("Mention manuscrite et datée :", infoBoxXs + 5, infoStartYs + 8);
 
     doc.text("« Bon pour accord. »", infoBoxXs + 5, infoStartYs + 12);
 
     const pageWidth = doc.internal.pageSize.getWidth(); // Get full width of the page
     const paymentY = rowY + rowHeight + 15;
     const totalsColWidth = 60;
     const totalsRowHeight = 8;
 
     // Align table to the far right
     const totalsX = pageWidth - totalsColWidth - 5;
 
     // Payment info (left side)
     doc.setTextColor(40, 40, 40);
     doc.text(
       "Paiement par virement bancaire ou par carte bleue.",
       15,
       paymentY
     );
     doc.setDrawColor(209, 213, 219); // black line
     doc.setLineWidth(0.2);
     doc.line(totalsX, paymentY - 3, totalsX + totalsColWidth, paymentY - 3);
     // Totals table data
     const totalsData = [
       { label: "Total HT", value: `${command.totalHT.toFixed(2)} €` },
       { label: "TVA à 20%", value: `${command.totalTVA.toFixed(2)} €` },
       {
         label: "Total TTC",
         value: `${command.totalTTC.toFixed(2)} €`,
         bold: true,
         bgColor: [229, 231, 235], // gray-200
       },
     ];
 
     // Draw table background and border
     doc.setFillColor(255, 255, 255);
     doc.setDrawColor(209, 213, 219);
     doc.setLineWidth(0.2);
 
     // Add rows
     totalsData.forEach((row, index) => {
       const rowY = paymentY + index * totalsRowHeight;
 
       // Background
       if (row.bgColor) {
         doc.setFillColor(...row.bgColor);
         doc.rect(totalsX, rowY - 1, totalsColWidth, totalsRowHeight, "F");
       }
 
       // Text
       if (row.bold) {
         doc.setFont(undefined, "normal");
       } else {
         doc.setFont(undefined, "normal");
       }
 
       // Label and value
       doc.setTextColor(40, 40, 40);
       doc.text(row.label, totalsX + 4, rowY + 5);
       doc.text(row.value, totalsX + totalsColWidth - 4, rowY + 5, {
         align: "right",
       });
 
       // Divider line between rows
       if (index < totalsData.length - 1) {
         doc.line(
           totalsX,
           rowY + totalsRowHeight,
           totalsX + totalsColWidth,
           rowY + totalsRowHeight
         );
       }
     });
 
    const pdfBase64 = doc.output("datauristring"); // OR use doc.output("dataurlstring");
  
    try {
      await axios.post(
        `/command/send-devis-email/${commandId}`, 
        {
          email: command.email,
          pdf: pdfBase64,
          commandId: command._id,
          commandNum: command.numCommand,
          phone: command.phone,
          clientName: command.nom,
          societeName: command.nom_societé,
          code: command.code,
          description: command.description,
        },
      );
  
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
      setAllCommands(prevCommands =>
        prevCommands.map(command =>
          command._id === commandId
            ? {
                ...command,
                command_type: newCommandType,
                numCommand: newNumCommand,
                originalNumCommand: oldNumCommand
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
      'magenta', 'red', 'volcano', 'orange', 'gold',
      'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'
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
      sorter: (a, b) => (a.originalNumCommand || "").localeCompare(b.originalNumCommand || ""),
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
    {
      title: "Référence",
      dataIndex: "reference",
      key: "reference",
      render: (text, record) => (
        <div>
          {record.items?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {record.items.map((item, index) => {
                const colorHash = stringToColor(item.reference);
                return (
                  <Tag 
                    key={index}
                    color={colorHash}
                    className="text-xs font-medium"
                  >
                    {item.reference} <span className="font-bold">(x{item.quantite})</span>
                  </Tag>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
 
      {
        title: "Category",
        dataIndex: "category",
        key: "category",
        render: (categoryString) => {
          const categories = typeof categoryString === 'string' 
            ? categoryString.split(',').map(c => c.trim()) 
            : [];
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {categories.map((category, index) => (
                <Tag key={index} color="blue">
                  {category}
                </Tag>
              ))}
            </div>
          );
        },
      },
      // {
      //   title: "Titre",
      //   dataIndex: "title",
      //   key: "title",
      //   render: (text, record) => (
      //     <div>
      //       {record.items?.length > 0 && (
      //         <div className="flex flex-wrap gap-1 mt-1">
      //           {record.items.map((item, index) => {
      //             // Generate a consistent color based on product reference
      //             const colorHash = stringToColor(item.reference || item.title);
      //             return (
      //               <Tag 
      //                 key={index}
      //                 color={colorHash}
      //                 className="text-xs font-medium"
      //               >
      //                 {item.quantite}x {item.title.split('(')[0].trim()}
      //               </Tag>
      //             );
      //           })}
      //         </div>
      //       )}
      //     </div>
      //   ),
      // },
    {
      title: "Quantité",
      dataIndex: "quantite",
      key: "quantite",
      render: (text) => `${safeRender(text, "0")}`,
    },
    // {
    //   title: "Total HT",
    //   dataIndex: "totalHT",
    //   key: "totalHT",
    //   render: (text) => `${safeRender(text, "0")} €`,
    //   sorter: (a, b) => (a.totalHT || 0) - (b.totalHT || 0),
    // },
    // {
    //   title: "Total TVA",
    //   dataIndex: "totalTVA",
    //   key: "totalTVA",
    //   render: (text) => `${safeRender(text, "0")} €`,
    //   sorter: (a, b) => (a.totalHT || 0) - (b.totalHT || 0),
    // },
    // {
    //   title: "Total TTC",
    //   dataIndex: "totalTTC",
    //   key: "totalTTC",
    //   render: (text) => `${safeRender(text, "0")} €`,
    //   sorter: (a, b) => (a.totalTTC || 0) - (b.totalTTC || 0),
    // },
    {
      title: "Total HT",
      dataIndex: "totalHT",
      key: "totalHT",
      render: (text, record) => (
        <div className="text-right">
          <div>{`${safeRender(text, "0")} €`}</div>
          {record.items?.length > 0 && (
            <div className="text-xs text-gray-500">
              {record.items.map(item => item.montantHT + '€').join(' + ')}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.totalHT || 0) - (b.totalHT || 0),
    },
    {
      title: "Total TVA",
      dataIndex: "totalTVA",
      key: "totalTVA",
      render: (text, record) => (
        <div className="text-right">
          <div>{`${safeRender(text, "0")} €`}</div>
          {record.items?.length > 0 && (
            <div className="text-xs text-gray-500">
              {record.items.map(item => item.montantTVA + '€').join(' + ')}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.totalTVA || 0) - (b.totalTVA || 0),
    },
    {
      title: "Prix Total TTC",
      dataIndex: "totalTTC",
      key: "totalTTC",
      render: (text, record) => (
        <div className="text-right">
          <div className="font-medium">{`${safeRender(text, "0")} €`}</div>
          {record.items?.length > 0 && (
            <div className="text-xs text-gray-500">
              {record.items.map(item => item.montantTTC + '€').join(' + ')}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.totalTTC || 0) - (b.totalTTC || 0),
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
            className={`w-full mt-4 ${activeFilter === 'en_cours' ? 'bg-blue-500' : 'bg-blue-300'} text-white font-bold`} 
            onClick={() => handleFilter('en_cours')}
          >
            Devis en cours
          </Button>
        </Card>
        <Card>
          <Statistic title="Total TTC" value={stats.totalTTC} suffix="€" />
          <Button 
            className={`w-full mt-4 ${activeFilter === 'accepte' ? 'bg-blue-500' : 'bg-blue-300'} text-white font-bold`} 
            onClick={() => handleFilter('accepte')}
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

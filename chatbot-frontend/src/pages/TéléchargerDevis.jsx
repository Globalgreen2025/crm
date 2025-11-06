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
import logo from "../assets/logo.png";
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
  // const [stats, setStats] = useState({
  //   totalHT: 0,
  //   totalTTC: 0,
  //   totalCommands: 0,
  // });
  const [activeFilter, setActiveFilter] = useState("all");
  const token = localStorage.getItem("token");
  const decodedUser = token ? jwtDecode(token) : null;
  const userRole = decodedUser?.role;
  const [billingModalVisible, setBillingModalVisible] = useState(false);
  const [invoicesModalVisible, setInvoicesModalVisible] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [sendingEmails, setSendingEmails] = useState({});

  const [stats, setStats] = useState({
    totalCommands: 0,
    totalHT: 0,
    totalTTC: 0,
    totalTVA: 0
  });
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

  // Calculate statistics including forfait amounts
  const calculateStats = (commands) => {
    const newStats = {
      totalCommands: commands.length,
      totalHT: 0,
      totalTTC: 0,
      totalTVA: 0
    };

    commands.forEach(command => {
      // Calculate totals including forfait
      let commandHT = command.totalHT || 0;
      let commandTTC = command.totalTTC || 0;
      
      // Add forfait amounts if they exist in items
      if (command.items && command.items.length > 0) {
        command.items.forEach(item => {
          if (item.forfait && parseFloat(item.forfait) > 0) {
            const forfaitAmount = parseFloat(item.forfait);
            commandHT += forfaitAmount;
            commandTTC += forfaitAmount; // Forfait is HT, so add to both HT and TTC
          }
        });
      }

      newStats.totalHT += commandHT;
      newStats.totalTTC += commandTTC;
      newStats.totalTVA += commandTTC - commandHT;
    });

    return newStats;
  };

// Calculate facture statistics - CORRECTED VERSION
const calculateFactureStats = (commands) => {
  const newFactureStats = {
    totalFactures: 0,
    totalHTFactures: 0,
    totalTTCAFactures: 0,
    totalPaye: 0,
    resteAPayer: 0,
    facturesPayees: 0,
    facturesEnAttente: 0,
    facturesPartielles: 0
  };

  // Track commands we've already processed to avoid double counting
  const processedCommands = new Set();

  commands.forEach(command => {
    // Case 1: It's a command with invoices array (like your devis example)
    if (command.invoices && command.invoices.length > 0) {
      // Only count this command once
      if (!processedCommands.has(command._id)) {
        newFactureStats.totalFactures++;
        processedCommands.add(command._id);

        let totalCommandTTC = command.totalTTC || 0;
        let totalPaidAmount = command.paidAmount || 0;
        let totalForfait = 0;

        // Add forfait amounts from items
        if (command.items && command.items.length > 0) {
          command.items.forEach(item => {
            if (item.forfait && parseFloat(item.forfait) > 0) {
              const forfaitAmount = parseFloat(item.forfait);
              totalForfait += forfaitAmount;
            }
          });
        }

        // Calculate total TTC including forfait
        totalCommandTTC += totalForfait;

        // Calculate total paid amount from all invoices
        let totalInvoicePayments = 0;
        command.invoices.forEach(invoice => {
          if (invoice.payments && invoice.payments.length > 0) {
            invoice.payments.forEach(payment => {
              totalInvoicePayments += payment.amount || 0;
            });
          }
        });

        // Use the higher of command.paidAmount or total invoice payments
        totalPaidAmount = Math.max(totalPaidAmount, totalInvoicePayments);

        newFactureStats.totalTTCAFactures += totalCommandTTC;
        newFactureStats.totalPaye += totalPaidAmount;

        const remaining = totalCommandTTC - totalPaidAmount;
        newFactureStats.resteAPayer += Math.max(0, remaining);

        // Determine status for the entire command
        if (totalPaidAmount >= totalCommandTTC) {
          newFactureStats.facturesPayees++;
        } else if (totalPaidAmount > 0) {
          newFactureStats.facturesPartielles++;
        } else {
          newFactureStats.facturesEnAttente++;
        }
      }
    }
    // Case 2: It's a standalone invoice (no parent command)
    else if (command.invoiceNumber && !command.commande) {
      newFactureStats.totalFactures++;
      
      const invoiceTTC = command.amount || 0;
      let paidAmount = 0;

      // Calculate paid amount from payments
      if (command.payments && command.payments.length > 0) {
        command.payments.forEach(payment => {
          paidAmount += payment.amount || 0;
        });
      }

      newFactureStats.totalTTCAFactures += invoiceTTC;
      newFactureStats.totalPaye += paidAmount;

      const remaining = invoiceTTC - paidAmount;
      newFactureStats.resteAPayer += Math.max(0, remaining);

      // Determine status
      if (paidAmount >= invoiceTTC) {
        newFactureStats.facturesPayees++;
      } else if (paidAmount > 0) {
        newFactureStats.facturesPartielles++;
      } else {
        newFactureStats.facturesEnAttente++;
      }
    }
    // Case 3: It's an accepted devis or facture without invoices
    else if ((command.command_type === 'facture' || command.status === 'accepté') && !command.invoices) {
      newFactureStats.totalFactures++;
      
      let commandTTC = command.totalTTC || 0;
      let paidAmount = command.paidAmount || 0;

      // Add forfait amounts
      if (command.items && command.items.length > 0) {
        command.items.forEach(item => {
          if (item.forfait && parseFloat(item.forfait) > 0) {
            const forfaitAmount = parseFloat(item.forfait);
            commandTTC += forfaitAmount;
          }
        });
      }

      newFactureStats.totalTTCAFactures += commandTTC;
      newFactureStats.totalPaye += paidAmount;

      const remaining = commandTTC - paidAmount;
      newFactureStats.resteAPayer += Math.max(0, remaining);

      // Determine status
      if (paidAmount >= commandTTC) {
        newFactureStats.facturesPayees++;
      } else if (paidAmount > 0) {
        newFactureStats.facturesPartielles++;
      } else {
        newFactureStats.facturesEnAttente++;
      }
    }
  });

  return newFactureStats;
};

  // Update statistics when commands change
  const updateStatistics = (commands) => {
    const newStats = calculateStats(commands);
    const newFactureStats = calculateFactureStats(commands);
    
    setStats(newStats);
    setFactureStats(newFactureStats);
  };

  // const [factureStats, setFactureStats] = useState({
  //   totalFactures: 0,
  //   totalHTFactures: 0,
  //   totalTTCAFactures: 0,
  //   totalPaye: 0,
  //   resteAPayer: 0,
  //   facturesPayees: 0,
  //   facturesEnAttente: 0,
  //   facturesPartielles: 0
  // });

  // const calculateFactureStats = (commands) => {
  //   // Helper function to safely parse numbers
  //   const safeNumber = (value) => {
  //     const num = parseFloat(value);
  //     return isNaN(num) ? 0 : num;
  //   };
  
  //   // Filtrer seulement les commandes de type facture
  //   const factures = commands.filter(cmd => cmd.command_type === "facture");
    
  //   // Calculer les totaux avec sécurité
  //   const totalHT = factures.reduce((sum, f) => {
  //     // Try to calculate from items first, then fallback to totalHT
  //     if (f.items && Array.isArray(f.items)) {
  //       const itemsHT = f.items.reduce((itemSum, item) => {
  //         return itemSum + safeNumber(item.prixUnitaire) * safeNumber(item.quantite);
  //       }, 0);
  //       return sum + itemsHT;
  //     }
  //     return sum + safeNumber(f.totalHT);
  //   }, 0);
  
  //   const totalTTC = factures.reduce((sum, f) => {
  //     // Try to calculate from items first, then fallback to totalTTC
  //     if (f.items && Array.isArray(f.items)) {
  //       const itemsTTC = f.items.reduce((itemSum, item) => {
  //         return itemSum + safeNumber(item.montantTTC);
  //       }, 0);
  //       return sum + itemsTTC;
  //     }
  //     return sum + safeNumber(f.totalTTC);
  //   }, 0);
  
  //   // Calculer le montant payé avec sécurité
  //   const totalPaye = factures.reduce((sum, facture) => {
  //     if (facture.invoices && Array.isArray(facture.invoices)) {
  //       const paidAmount = facture.invoices
  //         .filter(inv => inv.status === 'payée')
  //         .reduce((invSum, inv) => invSum + safeNumber(inv.amount), 0);
  //       return sum + paidAmount;
  //     }
  //     return sum + safeNumber(facture.paidAmount);
  //   }, 0);
  
  //   // Calculer reste à payer avec arrondi pour éviter -0.00
  //   let resteAPayer = Math.round((totalTTC - totalPaye) * 100) / 100;
  //   if (Math.abs(resteAPayer) < 0.001) {
  //     resteAPayer = 0;
  //   }
  
  //   // Compter les statuts des factures avec logique améliorée
  //   let facturesPayees = 0;
  //   let facturesEnAttente = 0;
  //   let facturesPartielles = 0;
  
  //   factures.forEach(facture => {
  //     if (facture.invoices && Array.isArray(facture.invoices) && facture.invoices.length > 0) {
  //       const totalInvoiceAmount = facture.invoices.reduce((sum, inv) => sum + safeNumber(inv.amount), 0);
  //       const paidAmount = facture.invoices
  //         .filter(inv => inv.status === 'payée')
  //         .reduce((sum, inv) => sum + safeNumber(inv.amount), 0);
  
  //       if (paidAmount >= totalInvoiceAmount) {
  //         facturesPayees++;
  //       } else if (paidAmount > 0) {
  //         facturesPartielles++;
  //       } else {
  //         facturesEnAttente++;
  //       }
  //     } else {
  //       // No invoices or empty invoices array
  //       const paidAmount = safeNumber(facture.paidAmount);
  //       const totalAmount = safeNumber(facture.totalTTC);
  
  //       if (paidAmount >= totalAmount) {
  //         facturesPayees++;
  //       } else if (paidAmount > 0) {
  //         facturesPartielles++;
  //       } else {
  //         facturesEnAttente++;
  //       }
  //     }
  //   });
  
  //   // Arrondir tous les montants pour la cohérence
  //   return {
  //     totalFactures: factures.length,
  //     totalHTFactures: Math.round(totalHT * 100) / 100,
  //     totalTTCAFactures: Math.round(totalTTC * 100) / 100,
  //     totalPaye: Math.round(totalPaye * 100) / 100,
  //     resteAPayer: resteAPayer,
  //     facturesPayees: facturesPayees,
  //     facturesEnAttente: facturesEnAttente,
  //     facturesPartielles: facturesPartielles
  //   };
  // };
  // Add this after calculating factureStats to see what's happening
useEffect(() => {
  if (factureStats.totalFactures > 0) {
    console.log('Facture Stats Debug:', {
      totalTTC: factureStats.totalTTCAFactures,
      totalPaye: factureStats.totalPaye,
      calculatedDifference: factureStats.totalTTCAFactures - factureStats.totalPaye,
      displayedReste: factureStats.resteAPayer,
      factures: allCommands.filter(cmd => cmd.command_type === "facture").map(f => ({
        num: f.numCommand,
        totalTTC: f.totalTTC,
        invoices: f.invoices,
        paidAmount: f.paidAmount
      }))
    });
  }
}, [factureStats]);
  // const calculateFactureStats = (commands) => {
  //   // Filtrer seulement les commandes de type facture
  //   const factures = commands.filter(cmd => cmd.command_type === "facture");
    
  //   // Calculer les totaux
  //   const totalHT = factures.reduce((sum, f) => sum + (f.totalHT || 0), 0);
  //   const totalTTC = factures.reduce((sum, f) => sum + (f.totalTTC || 0), 0);
    
  //   // Calculer le montant payé basé sur les factures individuelles
  //   const totalPaye = factures.reduce((sum, facture) => {
  //     if (facture.invoices && Array.isArray(facture.invoices)) {
  //       return sum + facture.invoices
  //         .filter(inv => inv.status === 'payée')
  //         .reduce((invSum, inv) => invSum + (inv.amount || 0), 0);
  //     }
  //     return sum + (facture.paidAmount || 0);
  //   }, 0);
    
  //   // const resteAPayer = totalTTC - totalPaye;
  //   const resteAPayer = Math.round((totalTTC - totalPaye) * 100) / 100;
    
  //   // Compter les statuts des factures
  //   const facturesPayees = factures.filter(facture => {
  //     if (facture.invoices && Array.isArray(facture.invoices)) {
  //       return facture.invoices.length > 0 && 
  //              facture.invoices.every(inv => inv.status === 'payée');
  //     }
  //     return facture.paymentStatus === 'paid';
  //   }).length;
    
  //   const facturesEnAttente = factures.filter(facture => {
  //     if (facture.invoices && Array.isArray(facture.invoices)) {
  //       return facture.invoices.length === 0 || 
  //              facture.invoices.every(inv => inv.status !== 'payée');
  //     }
  //     return facture.paymentStatus === 'pending' || !facture.paymentStatus;
  //   }).length;
    
  //   const facturesPartielles = factures.filter(facture => {
  //     if (facture.invoices && Array.isArray(facture.invoices)) {
  //       const paidInvoices = facture.invoices.filter(inv => inv.status === 'payée').length;
  //       return paidInvoices > 0 && paidInvoices < facture.invoices.length;
  //     }
  //     return facture.paymentStatus === 'partial';
  //   }).length;

  //   return {
  //     totalFactures: factures.length,
  //     totalHTFactures: totalHT,
  //     totalTTCAFactures: totalTTC,
  //     totalPaye: totalPaye,
  //     resteAPayer: resteAPayer,
  //     facturesPayees: facturesPayees,
  //     facturesEnAttente: facturesEnAttente,
  //     facturesPartielles: facturesPartielles
  //   };
  // };

  // Add these functions:
  const handleGenerateBillingPlan = (command) => {
    console.log("cooooooomand", command)
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

  // const updateStatistics = (commands) => {
  //   const totals = commands.reduce(
  //     (acc, cmd) => ({
  //       totalHT: acc.totalHT + (cmd.totalHT || 0),
  //       totalTTC: acc.totalTTC + (cmd.totalTTC || 0),
  //       totalCommands: acc.totalCommands + 1,
  //     }),
  //     { totalHT: 0, totalTTC: 0, totalCommands: 0 }
  //   );

  //   setStats(totals);
  // };

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
       if (pageIndex === productPages.length - 1) {
         addTvaRecapAndTotals(currentRowY + 60);
       }
     };
   
     // Function to add TVA recap and totals (only on last page)
     const addTvaRecapAndTotals = (startY) => {
       let recapY = startY + 10;
   
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
   
       // Only show TVA detail if we have non-zero values
       if (!allTVAZero) {
         // Section title
         doc.setFontSize(12);
         doc.setFont(undefined, "bold");
         doc.text("Détail TVA", margin, recapY);
   
         // Reset font
         doc.setFontSize(10);
         doc.setFont(undefined, "normal");
         recapY += 10;
   
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
   
           recapY += 16;
         } else if (tvaRates.length > 1) {
           const col1X = margin;
           const col2X = margin + 40;
           const col3X = margin + 80;
   
           doc.setFont(undefined, "bold");
           doc.text("Taux", col1X, recapY);
           doc.text("Montant TVA", col2X, recapY);
           doc.text("Base HT", col3X, recapY);
   
           recapY += 8;
   
           tvaRates.forEach((tvaRate) => {
             const group = tvaGroups[tvaRate];
             doc.setFont(undefined, "normal");
             doc.text(`${parseFloat(tvaRate).toFixed(1)}%`, col1X, recapY);
             doc.text(`${group.montantTVA.toFixed(2)} €`, col2X, recapY);
             doc.text(`${group.baseHT.toFixed(2)} €`, col3X, recapY);
             recapY += 6;
           });
           recapY += 12;
         }
       } else {
         // Skip TVA detail section entirely
         recapY = startY;
       }
   
       // Récapitulatif box
       const recapBoxX = pageWidth - 80;
       let recapBoxY = recapY - 50;
   
       // Background rectangle
       const boxWidth = 80;
       const boxHeight = 35;
       doc.setFillColor(200);
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
       doc.text(`${usedTotalHT.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });
   
       recapBoxY += 8;
       doc.text("Total TVA:", recapBoxX, recapBoxY, { align: "left" });
       doc.text(`${usedTotalTVA.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });
   
       recapBoxY += 8;
       doc.text("Total TTC:", recapBoxX, recapBoxY, { align: "left" });
       doc.text(`${usedTotalTTC.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });
   
       // Signature Section
       recapY = recapBoxY + 20;
       doc.setFontSize(10);
       doc.setFont(undefined, "normal");
       doc.text("Date et signature précédée de la mention :", margin, recapY);
       recapY += 6;
       doc.text('"Bon pour accord"', margin, recapY);
     };
   
     // Render all product pages
     productPages.forEach((products, index) => {
       renderTablePage(index, products);
     });
   
     // ALWAYS CREATE SECOND PAGE WITH TABLE
     const currentPageCount = doc.internal.getNumberOfPages();
     
     if (currentPageCount === 1 && productPages.length === 1) {
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
   
       // Add TVA recap on second page
       addTvaRecapAndTotals(tableEndY + 20);
       addFooter(2);
     }
   
     // Save the PDF
     doc.save(`Devis_${command.originalNumCommand || command._id}.pdf`);
};
  const handleSendPdf = async (commandId, e) => {
    e.stopPropagation();

  
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
         if (pageIndex === productPages.length - 1) {
           addTvaRecapAndTotals(currentRowY + 60);
         }
       };
     
       // Function to add TVA recap and totals (only on last page)
       const addTvaRecapAndTotals = (startY) => {
         let recapY = startY + 10;
     
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
     
         // Only show TVA detail if we have non-zero values
         if (!allTVAZero) {
           // Section title
           doc.setFontSize(12);
           doc.setFont(undefined, "bold");
           doc.text("Détail TVA", margin, recapY);
     
           // Reset font
           doc.setFontSize(10);
           doc.setFont(undefined, "normal");
           recapY += 10;
     
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
     
             recapY += 16;
           } else if (tvaRates.length > 1) {
             const col1X = margin;
             const col2X = margin + 40;
             const col3X = margin + 80;
     
             doc.setFont(undefined, "bold");
             doc.text("Taux", col1X, recapY);
             doc.text("Montant TVA", col2X, recapY);
             doc.text("Base HT", col3X, recapY);
     
             recapY += 8;
     
             tvaRates.forEach((tvaRate) => {
               const group = tvaGroups[tvaRate];
               doc.setFont(undefined, "normal");
               doc.text(`${parseFloat(tvaRate).toFixed(1)}%`, col1X, recapY);
               doc.text(`${group.montantTVA.toFixed(2)} €`, col2X, recapY);
               doc.text(`${group.baseHT.toFixed(2)} €`, col3X, recapY);
               recapY += 6;
             });
             recapY += 12;
           }
         } else {
           // Skip TVA detail section entirely
           recapY = startY;
         }
     
         // Récapitulatif box
         const recapBoxX = pageWidth - 80;
         let recapBoxY = recapY - 50;
     
         // Background rectangle
         const boxWidth = 80;
         const boxHeight = 35;
         doc.setFillColor(200);
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
         doc.text(`${usedTotalHT.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });
     
         recapBoxY += 8;
         doc.text("Total TVA:", recapBoxX, recapBoxY, { align: "left" });
         doc.text(`${usedTotalTVA.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });
     
         recapBoxY += 8;
         doc.text("Total TTC:", recapBoxX, recapBoxY, { align: "left" });
         doc.text(`${usedTotalTTC.toFixed(2)} €`, pageWidth - margin, recapBoxY, { align: "right" });
     
         // Signature Section
         recapY = recapBoxY + 20;
         doc.setFontSize(10);
         doc.setFont(undefined, "normal");
         doc.text("Date et signature précédée de la mention :", margin, recapY);
         recapY += 6;
         doc.text('"Bon pour accord"', margin, recapY);
       };
     
       // Render all product pages
       productPages.forEach((products, index) => {
         renderTablePage(index, products);
       });
     
       // ALWAYS CREATE SECOND PAGE WITH TABLE
       const currentPageCount = doc.internal.getNumberOfPages();
       
       if (currentPageCount === 1 && productPages.length === 1) {
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
     
         // Add TVA recap on second page
         addTvaRecapAndTotals(tableEndY + 20);
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
            {record.status === "accepté" && (
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
                  // disabled={record.command_type !== "facture"}
                  disabled={!record.billingPlan || (record.invoices && record.invoices.length > 0)}
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
    // {
    //   title: "Category",
    //   dataIndex: "category",
    //   key: "category",
    //   render: (categoryString) => {
    //     const categories =
    //       typeof categoryString === "string"
    //         ? categoryString.split(",").map((c) => c.trim())
    //         : [];

    //     return (
    //       <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    //         {categories.map((category, index) => (
    //           <Tag key={index} color="blue">
    //             {category}
    //           </Tag>
    //         ))}
    //       </div>
    //     );
    //   },
    // },

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
                   {parseFloat(item.forfait || 0).toFixed(2)} €
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
    //   title: "Prix Unitaire",
    //   dataIndex: "prixUnitaire",
    //   key: "prixUnitaire",
    //   render: (text, record) => (
    //     <div className="flex flex-col gap-1">
    //       {/* Main Forfait Tag - Only shows if value exists */}
    //       {text && parseFloat(text) !== 0 && (
    //         <Tag color="#f50" className="text-xs font-medium">
    //           prix Unitaire: {parseFloat(text).toFixed(2)} €
    //         </Tag>
    //       )}

    //       {/* Item-Level Forfaits - Only shows if items with forfait exist */}
    //       {record.items?.some((item) => item.forfait) && (
    //         <div className="flex flex-wrap gap-1 mt-1">
    //           {record.items
    //             .filter((item) => item.prixUnitaire)
    //             .map((item, index) => (
    //               <Tag
    //                 key={`prixUnitaire-${index}`}
    //                 color="#f50"
    //                 className="text-xs font-medium"
    //               >
    //                 Prix Unitaire:{" "}
    //                 {parseFloat(item.prixUnitaire || 0).toFixed(2)} €
    //                 {item.quantite > 1 && (
    //                   <span className="font-bold ml-1">(x{item.quantite})</span>
    //                 )}
    //               </Tag>
    //             ))}
    //         </div>
    //       )}
    //     </div>
    //   ),
    // },

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
                    {/* {item.prixUnitaire} € × {item.quantite} ={" "} */}
                    {/* {(item.prixUnitaire * item.quantite).toFixed(2)} € */}
                  </div>
                ))}
              </div>
            ) : record.prixUnitaire ? (
              <div className="text-xs text-gray-500">
                {/* {record.prixUnitaire} € × {record.quantite} ={" "} */}
                {/* {calculatedTotal.toFixed(2)} € */}
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
                      {/* {item.montantTVA.toFixed(2)} €{" "} */}
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
                      {/* {item.montantTTC.toFixed(2)} € */}
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
            {record.status === "envoyé" && (
              // <>
              //   <Button
              //     icon={<CheckOutlined />}
              //     onClick={(e) => {
              //       e.stopPropagation(); // Add this line
              //       handleUpdateStatus(record._id, "accepté");
              //     }}
              //     title="Marquer comme accepté"
              //   />
              //   <Button
              //     icon={<CloseOutlined />}
              //     onClick={(e) => {
              //       e.stopPropagation(); // Add this line
              //       handleUpdateStatus(record._id, "refusé");
              //     }}
              //     title="Marquer comme refusé"
              //     danger
              //   />
              // </>
                 <>
            <Button
              type="primary"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
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
              style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
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
      <h1 className="text-xl font-bold mb-6">Gestion des Devis et Factures</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <Statistic title="Total Devis" value={stats.totalCommands} />
        </Card>
        <Card>
          <Statistic title="Total HT" value={stats.totalHT.toFixed(2)} suffix="€" />
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
          <Statistic title="Total TTC" value={stats.totalTTC.toFixed(2)}  suffix="€" />
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
      {/* <div className="mb-6">
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
        

        {factureStats.totalTTCAFactures > 0 && (
          <Card className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Progression globale des paiements</span>
              <span className="text-sm text-gray-600">
                {((factureStats.totalPaye / factureStats.totalTTCAFactures) * 100)}%
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
              <span>Payé: {factureStats.totalPaye}€</span>
              <span>Total: {factureStats.totalTTCAFactures}€</span>
            </div>
          </Card>
        )}
      </div> */}
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
                value={factureStats.totalHTFactures.toFixed(2)}
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
                value={factureStats.totalTTCAFactures.toFixed(2)}
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
                value={factureStats.totalPaye.toFixed(2)}
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
                value={factureStats.resteAPayer.toFixed(2)}
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
           className="compact-table"
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
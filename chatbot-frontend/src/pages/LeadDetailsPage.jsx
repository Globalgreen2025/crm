import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Tabs,
  Button,
  Input,
  Form,
  Calendar,
  Row,
  Col,
  Select,
  ConfigProvider,
  Table,
  Card,
  Statistic,
  Timeline,
  Tag,
  Progress,
  Modal,
  TimePicker
} from "antd";
import { jwtDecode } from "jwt-decode";
import CalendarEvents from "../components/CalendarEvents";

import Panier from "./Panier";
import Produits from "../components/Produits";
import Devis from "../components/Devis";
import { LeftOutlined, RightOutlined, DeleteOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined  } from "@ant-design/icons";
import moment from "moment";
import "moment/locale/fr";

// Set French locale
moment.locale("fr");

const { TabPane } = Tabs;

const LeadDetailsPage = () => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState("1");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const token = localStorage.getItem("token");
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTabKey, setActiveTabKey] = useState("7");
  const [cartQuantity, setCartQuantity] = useState(0);
  const [refreshCart, setRefreshCart] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [factures, setFactures] = useState([]);
  const [loadingFactures, setLoadingFactures] = useState(false);
  const handleRefreshCommands = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  // Add this effect to load initial quantity PROPERLY
  useEffect(() => {
    const loadInitialCart = async () => {
      try {
        const token = localStorage.getItem("token");
        // 1. First check localStorage (for quick UI update)
        const localCart = JSON.parse(localStorage.getItem("panierItems")) || [];
        const localQuantity = localCart.reduce(
          (sum, item) => sum + (item.quantite || 0),
          0
        );
        setCartQuantity(localQuantity);

        // 2. Then verify with backend (for accurate data)
        // const response = await axios.get(`/panier/${id}`);
        const response = await axios.get(`/panier/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const allPanier = response.data;
        console.log("allPanier", allPanier);

        const decodedToken = token ? jwtDecode(token) : null;
        const currentUserId = decodedToken?.userId;

        const filteredpanier = allPanier.filter(
          (panier) => panier.session === currentUserId
        );

        const backendQuantity = filteredpanier.reduce(
          (sum, item) => sum + (item.quantite || 0),
          0
        );

        // 3. Use whichever is larger (or implement your preferred merge logic)
        if (backendQuantity !== localQuantity) {
          setCartQuantity(backendQuantity);
          localStorage.setItem("panierItems", JSON.stringify(response.data));
          localStorage.setItem("cartQuantity", backendQuantity.toString());
        }
      } catch (error) {
        console.error("Error loading initial cart:", error);
      }
    };

    loadInitialCart();
  }, []);
  // In LeadDetailsPage.jsx
  useEffect(() => {
    const handleStorageChange = () => {
      const localCart = JSON.parse(localStorage.getItem("panierItems")) || [];
      const newQuantity = localCart.reduce(
        (sum, item) => sum + (item.quantite || 0),
        0
      );
      setCartQuantity(newQuantity);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const onDateSelect = (date) => {
    setSelectedDate(date);
    form.setFieldsValue({
      event_date: date.format("YYYY-MM-DD"), // Set selected date in the form field
    });
  };

  const fetchFactures = async () => {
    setLoadingFactures(true);
    try {
      // 1. Récupérer les commandes principales
      const commandsResponse = await axios.get(`/commands/lead/${id}`);
      console.log("Commands Response:", commandsResponse.data);
      let commands = commandsResponse.data.data || commandsResponse.data || [];
      
      // 2. Pour chaque commande, récupérer le détail des factures
      const commandsWithInvoiceDetails = await Promise.all(
        commands.map(async (command) => {
          try {
            // Récupérer les factures détaillées pour cette commande
            const invoicesResponse = await axios.get(`/command/${command._id}/invoices`);
            const invoices = invoicesResponse.data.data || invoicesResponse.data || [];
            
            // Calculer le statut réel basé sur les factures
            const allInvoicesPaid = invoices.length > 0 && invoices.every(inv => inv.status === 'payée');
            const someInvoicesPaid = invoices.length > 0 && invoices.some(inv => inv.status === 'payée');
            
            // Mettre à jour le statut de paiement
            let actualPaymentStatus = command.paymentStatus;
            if (allInvoicesPaid) {
              actualPaymentStatus = 'paid';
            } else if (someInvoicesPaid) {
              actualPaymentStatus = 'partial';
            }
            
            // Calculer le montant payé réel basé sur les factures
            const actualPaidAmount = invoices
              .filter(inv => inv.status === 'payée')
              .reduce((sum, inv) => sum + (inv.amount || 0), 0);
            
            return {
              ...command,
              invoicesDetail: invoices, // Garder les détails des factures
              actualPaymentStatus, // Statut calculé
              actualPaidAmount, // Montant payé calculé
              isFullyPaid: allInvoicesPaid // Flag pour paiement complet
            };
          } catch (error) {
            console.error(`Error fetching invoices for command ${command._id}:`, error);
            return command; // Retourner la commande sans modifications en cas d'erreur
          }
        })
      );
      
      setFactures(commandsWithInvoiceDetails);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setFactures([]);
    } finally {
      setLoadingFactures(false);
    }
  };
  useEffect(() => {
    if (activeTab === "8") {
      fetchFactures();
    }
  }, [activeTab, id]);

  const handleFormSubmit = async (values) => {
    try {
      // Send values to your backend API to add a new lead
      const response = await axios.post("/data", values);
      console.log("Lead added successfully:", response.data);
      form.resetFields(); // Reset form fields
      alert("Lead créé avec succès !");
      // Handle successful submission, e.g., show a success message or reset form
    } catch (error) {
      console.error("Error adding lead:", error);
      // Handle error (e.g., show error message)
    }
  };

  // useEffect(() => {
  //   const storedCartQuantity = localStorage.getItem("cartQuantity") || 0;
  //   setCartQuantity(Number(storedCartQuantity));
  // }, [refreshCart]);

  const handleFormSubmitCalendar = async (values) => {
    const token = localStorage.getItem("token");
    const decodedToken = token ? jwtDecode(token) : null;
    if (!decodedToken) {
      alert("User not authenticated");
      return;
    }

    // Use userId as adminId (based on the decoded token)
    const session = decodedToken.userId; // Use userId here

    const eventData = {
      ...values, // This includes event_date, event_time, objective, and comment
      session, // Add the userId as the admin field
      leadId: id, // Add the leadId to the event
    };

    try {
      const response = await axios.post("/events", eventData, {
        headers: {
          Authorization: `Bearer ${token}`, // Include token for backend validation if needed
        },
      });
      console.log("Event added successfully:", response.data);
      form.resetFields(); // Reset form fields
      alert("Calendrier créé avec succès !");
    } catch (error) {
      console.error("Error adding event:", error);
      // Handle error
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    // navigate(key === "2" ? `/lead/${id}/commentaires` : `/lead/${id}`);
  };

  useEffect(() => {
    // Set the active tab based on the route
    if (window.location.pathname.includes("commentaires")) {
      setActiveTab("2");
    } else {
      setActiveTab("1");
    }
  }, [window.location.pathname]);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await axios.get(`/lead/${id}`);
        setLead(response.data.chat);
        console.log("Lead Details:", response.data.chat);
        setComments(response.data.chat.commentaires || []);
        setFormData(response.data.chat);
      } catch (error) {
        console.error("Error fetching lead details:", error);
      }
    };

    fetchLead();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return alert("Comment cannot be empty!");

    const token = localStorage.getItem("token");
    const decodedToken = token ? jwtDecode(token) : null;
    console.log("Decoded Token:", decodedToken);
    if (!decodedToken) {
      alert("User not authenticated");
      return;
    }

    try {
      const response = await axios.put(
        `/add-comment/${id}`,
        {
          text: newComment,
          name: decodedToken.name, // Send the name
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include token for backend validation if needed
          },
        }
      );
      console.log("Sending comment:", {
        text: newComment,
        name: decodedToken.name, // This should match the expected structure
      });

      if (response.status === 200) {
        alert("Commentaire ajouté avec succès !");
        setComments(response.data.commentaires); // Update comments list
        setNewComment(""); // Clear input field
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Could not add comment, please try again.");
    }
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(`/lead/${id}`, formData);
      if (response.status === 200) {
        alert("Modifications enregistrées avec succès !");
        setLead(formData);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Error saving changes, please try again.");
    }
  };

  if (!lead) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await axios.delete(
        `/lead/${id}/delete-comment/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        alert("Commentaire supprimé avec succès !");
        setComments(comments.filter((comment) => comment._id !== commentId)); // Update comments list by removing the deleted comment
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Could not delete comment, please try again.");
    }
  };
// Fonctions utilitaires mises à jour
const getPaymentStatus = (facture) => {
  // Utiliser le statut calculé si disponible, sinon celui de la commande
  const status = facture.actualPaymentStatus || facture.paymentStatus;
  
  if (status === "paid" || facture.isFullyPaid) return "Payé";
  if (status === "partial") return "Partiel";
  return "En attente";
};

const getStatusColor = (status) => {
  switch (status) {
    case "Payé": return "green";
    case "Partiel": return "orange";
    default: return "red";
  }
};

// Colonnes mises à jour pour le tableau
const factureColumns = [
  {
    title: 'N° Facture',
    dataIndex: 'numCommand',
    key: 'numCommand',
    render: (text, record) => (
      <div>
        <strong>{text}</strong>
        {record.isFullyPaid && (
          <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
        )}
      </div>
    ),
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    render: (date) => moment(date).format('DD/MM/YYYY'),
  },
  {
    title: 'Montant TTC',
    dataIndex: 'totalTTC',
    key: 'totalTTC',
    render: (amount) => `${amount?.toFixed(2)} €` || '0.00 €',
  },
  {
    title: 'Montant Payé Réel',
    key: 'actualPaidAmount',
    render: (_, record) => {
      const paid = record.actualPaidAmount || record.paidAmount || 0;
      return `${paid.toFixed(2)} €`;
    },
  },
  {
    title: 'Reste à Payer',
    key: 'remainingAmount',
    render: (_, record) => {
      const total = record.totalTTC || 0;
      const paid = record.actualPaidAmount || record.paidAmount || 0;
      const remaining = total - paid;
      return `${remaining.toFixed(2)} €`;
    },
  },
  {
    title: 'Statut Paiement',
    key: 'paymentStatus',
    render: (_, record) => {
      const status = getPaymentStatus(record);
      const isFullyPaid = record.isFullyPaid;
      
      return (
        <Tag color={getStatusColor(status)}>
          {isFullyPaid ? "Payé" : status}
          {isFullyPaid && <CheckCircleOutlined style={{ marginLeft: 4 }} />}
        </Tag>
      );
    },
  },
  {
    title: 'Progression',
    key: 'progress',
    render: (_, record) => {
      const total = record.totalTTC || 0;
      const paid = record.actualPaidAmount || record.paidAmount || 0;
      const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
      const isFullyPaid = record.isFullyPaid;
      
      return (
        <Progress 
          percent={percent} 
          size="small" 
          status={isFullyPaid ? "success" : percent > 0 ? "active" : "exception"}
        />
      );
    },
  },
];

  return (
    <div className="max-w-6xl mx-auto mt-10 p-2">
      {/* Page Title */}
      <div className="flex-1 mb-12">
        <h1 className="text-center text-2xl font-bold text-gray-800">
          Details du client
        </h1>
        <div className="flex justify-center mb-4">
          <span className="px-4 py-2 bg-purple-900 text-white font-bold rounded-full">
            {lead.nom}
          </span>
        </div>
      </div>

      {/* Two Boxes Side by Side */}
      <div className="flex justify-between space-x-4">
        <div className="flex-1 bg-white shadow-md rounded-lg p-6">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            onTabClick={(key) => {
              if (key === "7") {
                // "Devis à valider" tab
                setRefreshCounter((prev) => prev + 1);
              }
            }}
          >
            <TabPane tab="Informations" key="1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column (Informations Leads) */}
                <div className="space-y-4 mt-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Informations Leads
                  </h2>
                  {[
                    { label: "Prénom et Nom", value: lead.nom || "-" },
                    { label: "Email", value: lead.email || "-" },
                    { label: "Téléphone", value: lead.phone || "-" },
                    { label: "Address", value: lead.address || "-" },
                    { label: "Ville", value: lead.ville || "-" },
                    { label: "Siret", value: lead.siret || "-" },
                    { label: "Code Postal", value: lead.codepostal || "-" },
                    // { label: "Contacter", value: lead.initial || "-" },
                    // { label: "Besoin", value: lead.information_request || "-" },
                    { label: "Status de lead", value: lead.type || "-" },
                  ].map(({ label, value }) => (
                    <div className="flex items-center gap-2" key={label}>
                      <p className="text-gray-600 font-semibold">{label}:</p>
                      <p className="text-gray-800 font-semibold">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Right Column (Informations Commercial) */}
                <div className="space-y-4 mt-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Informations Commercial
                  </h2>
                  {[
                    {
                      label: "Commercial prénom",
                      value: lead.commercial?.prenom || "-",
                    },
                    {
                      label: "Commercial nom",
                      value: lead.commercial?.nom || "-",
                    },
                  ].map(({ label, value }) => (
                    <div className="flex items-center gap-2" key={label}>
                      <p className="text-gray-600 font-semibold">{label}:</p>
                      <p className="text-gray-800 font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabPane>

            <TabPane tab="Commentaires" key="2">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full border rounded-lg"
                  />
                  <Button
                    type="primary"
                    onClick={handleAddComment}
                    className="bg-purple-800 text-white"
                  >
                    Submit
                  </Button>
                </div>
                <div className="mt-4">
                  {comments.length ? (
                    comments.map((comment) => (
                      <div
                        key={comment._id}
                        className="p-4 border rounded-lg mb-2 bg-gray-100"
                      >
                        <div className="flex justify-between">
                          <div>
                            <p className="text-gray-800">{comment.text}</p>
                            {/* <p className="text-gray-600 text-sm">
                              Added by: {comment.addedBy?.name || "Unknown"}
                            </p> */}
                            <p className="text-gray-600 text-sm">
                              {comment.addedAt
                                ? new Date(comment.addedAt).toLocaleString()
                                : "Unknown Date"}
                            </p>
                          </div>
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteComment(comment._id)}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">
                      Aucun commentaire pour le moment.
                    </p>
                  )}
                </div>
              </div>
            </TabPane>

            {/* <TabPane tab="Contact" key="3">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Ajouter un Lead
                </h2>

                <Form
                  form={form}
                  onFinish={handleFormSubmit}
                  layout="vertical"
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Form.Item
                      label="Prénom et Nom"
                      name="nom"
                      rules={[{ required: true, message: "Prénom est requis" }]}
                    >
                      <Input className="w-full p-2 border rounded-lg" />
                    </Form.Item>

                    <Form.Item
                      label="Adresse"
                      name="address"
                      rules={[
                        { required: true, message: "L'address est requis." },
                      ]}
                    >
                      <Input className="w-full p-2 border rounded-lg" />
                    </Form.Item>

                    <Form.Item
                      label="Ville"
                      name="ville"
                      rules={[{ required: true, message: "Ville est requis." }]}
                    >
                      <Input className="w-full p-2 border rounded-lg" />
                    </Form.Item>
                    <Form.Item
                      label="Codepostal"
                      name="codepostal"
                      rules={[
                        { required: true, message: "Codepostal est requis." },
                      ]}
                    >
                      <Input className="w-full p-2 border rounded-lg" />
                    </Form.Item>

                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        { required: true, message: "Email est requis." },
                        {
                          type: "email",
                          message: "Veuillez entrer une adresse e-mail valide.",
                        },
                      ]}
                    >
                      <Input className="w-full p-2 border rounded-lg" />
                    </Form.Item>

                    <Form.Item
                      label="Téléphone"
                      name="phone"
                      rules={[
                        { required: true, message: "Téléphone is required" },
                      ]}
                    >
                      <Input className="w-full p-2 border rounded-lg" />
                    </Form.Item>

                    <Form.Item label="Siret" name="siret">
                      <Input className="w-full p-2 border rounded-lg" />
                    </Form.Item>
                  </div>

                  <div className="mt-4">
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="px-4 py-2 bg-purple-800 text-white rounded-lg"
                    >
                      Ajouter Lead
                    </Button>
                  </div>
                </Form>
              </div>
            </TabPane> */}

            <TabPane tab="Calendrier" key="4">
              <Row gutter={24}>
                {/* Left Column for Event Details */}
                <Col xs={24} sm={12}>
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Ajouter un Événement
                    </h2>
                    <Form
                      form={form}
                      onFinish={handleFormSubmitCalendar}
                      layout="vertical"
                      className="space-y-4"
                    >
                      <Form.Item label="Date" name="event_date">
                        <Input
                          readOnly
                          value={
                            selectedDate
                              ? selectedDate.format("YYYY-MM-DD")
                              : ""
                          }
                        />
                      </Form.Item>

                      {/* <Form.Item
                        label="Heure"
                        name="event_time"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="HH:mm" />
                      </Form.Item> */}
                      <Form.Item
  label="Heure"
  name="event_time"
  rules={[{ required: true, message: "Veuillez sélectionner une heure" }]}
>
  <TimePicker
    format="HH:mm"
    placeholder="Sélectionnez l'heure"
    style={{ width: "100%" }}
  />
</Form.Item>
                      <Form.Item
                        label="Objectif"
                        name="objective"
                        rules={[{ required: true }]}
                      >
                        <Select placeholder="Choisissez un objectif">
                          <Option value="Appel de vente">Appel de vente</Option>
                          <Option value="Négociation de produit">
                            Négociation de produit
                          </Option>
                          <Option value="Conclusion vente">
                            Conclusion vente
                          </Option>
                          <Option value="Vente">Vente</Option>
                          <Option value="Appel de fidélisation">
                            Appel de fidélisation
                          </Option>
                          <Option value="Ne répond pas">Ne répond pas</Option>
                          <Option value="Ne pas déranger">
                            Ne pas déranger
                          </Option>
                          <Option value="Faux numéro // Hors planning">
                            Faux numéro // Hors planning
                          </Option>
                          <Option value="Pose d'ouvrage">
                            Pose d'ouvrage
                          </Option>
                          <Option value="SAV">
                            SAV
                          </Option>

                        </Select>
                      </Form.Item>

                      <Form.Item label="Commentaire" name="comment">
                        <Input.TextArea rows={4} />
                      </Form.Item>

                      <Button
                        type="primary"
                        htmlType="submit"
                        className="px-4 py-2 bg-purple-800 text-white rounded-lg"
                      >
                        Ajouter Événement
                      </Button>
                    </Form>
                  </div>
                </Col>

                {/* Right Column for Calendar */}
                <Col xs={24} sm={12}>
                  <Calendar onSelect={onDateSelect} fullscreen />
                </Col>
              </Row>
              <CalendarEvents />
            </TabPane>

            <TabPane tab="Produits" key="5">
              <div className="space-y-4">
                <Produits
                  onCartChange={(newQuantity) => {
                    setCartQuantity(newQuantity); // Directly use the passed quantity
                    setRefreshCart((prev) => !prev); // Also trigger refresh
                  }}
                  refreshTrigger={refreshCart}
                />
              </div>
            </TabPane>
            <TabPane tab={`Commande (${cartQuantity})`} key="6">
              <div className="space-y-4">
                <Panier
                  setCartQuantity={setCartQuantity}
                  refreshTrigger={refreshCart}
                />
              </div>
            </TabPane>
            <TabPane tab="Devis" key="7" forceRender>
              <div className="space-y-4">
                <Devis
                  onValidate={handleRefreshCommands}
                  key={refreshCounter}
                  shouldRefresh={activeTabKey === "7"}
                />
              </div>
            </TabPane>
            <TabPane tab="Factures" key="8">
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-800">
        Suivi des Factures
      </h2>
      <Button 
        type="primary" 
        icon={<FileTextOutlined />}
        onClick={fetchFactures}
        loading={loadingFactures}
      >
        Actualiser
      </Button>
    </div>

    {/* Message si pas de données */}
    {!loadingFactures && factures.length === 0 && (
      <div className="text-center py-8">
        <FileTextOutlined className="text-4xl text-gray-400 mb-4" />
        <p className="text-gray-500">Aucune facture trouvée pour ce client</p>
      </div>
    )}

    {/* Statistiques - Mises à jour pour utiliser le statut calculé */}
    {factures.length > 0 && (
      <>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Factures"
                value={factures.length}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Payées"
                value={factures.filter(f => f.isFullyPaid || f.actualPaymentStatus === 'paid').length}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="En Attente"
                value={factures.filter(f => 
                  !f.isFullyPaid && 
                  (f.actualPaymentStatus === 'pending' || !f.actualPaymentStatus) &&
                  (!f.paidAmount || f.paidAmount === 0)
                ).length}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Paiements Partiels"
                value={factures.filter(f => 
                  !f.isFullyPaid && 
                  (f.actualPaymentStatus === 'partial' || (f.paidAmount > 0 && f.paidAmount < f.totalTTC))
                ).length}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Tableau des factures avec colonnes mises à jour */}
        <Table
          columns={[
            {
              title: 'N° Facture',
              dataIndex: 'numCommand',
              key: 'numCommand',
              render: (text, record) => (
                <div>
                  <strong>{text}</strong>
                  {record.isFullyPaid && (
                    <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                  )}
                </div>
              ),
            },
            {
              title: 'Date',
              dataIndex: 'date',
              key: 'date',
              render: (date) => moment(date).format('DD/MM/YYYY'),
            },
            {
              title: 'Montant TTC',
              dataIndex: 'totalTTC',
              key: 'totalTTC',
              render: (amount) => `${amount?.toFixed(2)} €` || '0.00 €',
            },
            {
              title: 'Montant Payé Réel',
              key: 'actualPaidAmount',
              render: (_, record) => {
                const paid = record.actualPaidAmount || record.paidAmount || 0;
                return `${paid.toFixed(2)} €`;
              },
            },
            {
              title: 'Reste à Payer',
              key: 'remainingAmount',
              render: (_, record) => {
                const total = record.totalTTC.toFixed(2) || 0;
                const paid = record.actualPaidAmount.toFixed(2) || record.paidAmount.toFixed(2) || 0;
                const remaining = total - paid;
                return `${remaining.toFixed(2)} €`;
              },
            },
            {
              title: 'Statut Paiement',
              key: 'paymentStatus',
              render: (_, record) => {
                const status = record.isFullyPaid ? "Payé" : 
                             record.actualPaymentStatus === "paid" ? "Payé" :
                             record.actualPaymentStatus === "partial" ? "Partiel" : 
                             record.paymentStatus === "paid" ? "Payé" :
                             record.paymentStatus === "partial" ? "Partiel" : "En attente";
                
                const color = status === "Payé" ? "green" : 
                            status === "Partiel" ? "orange" : "red";
                
                return (
                  <Tag color={color}>
                    {status}
                    {record.isFullyPaid && <CheckCircleOutlined style={{ marginLeft: 4 }} />}
                  </Tag>
                );
              },
            },
            {
              title: 'Progression',
              key: 'progress',
              render: (_, record) => {
                const total = record.totalTTC || 0;
                const paid = record.actualPaidAmount || record.paidAmount || 0;
                const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
                const isFullyPaid = record.isFullyPaid;
                
                return (
                  <Progress 
                    percent={percent} 
                    size="small" 
                    status={isFullyPaid ? "success" : percent > 0 ? "active" : "exception"}
                  />
                );
              },
            },
          ]}
          dataSource={factures}
          rowKey="_id"
          loading={loadingFactures}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <div>
                <h4 className="font-semibold mb-2">Détails de la commande:</h4>
                <p><strong>Client:</strong> {record.nom}</p>
                <p><strong>Société:</strong> {record.societe}</p>
                <p><strong>Description:</strong> {record.title}</p>
                <p><strong>Statut calculé:</strong> 
                  <Tag color={record.isFullyPaid ? "green" : "orange"} className="ml-2">
                    {record.isFullyPaid ? "COMPLÈTEMENT PAYÉ" : "EN COURS"}
                  </Tag>
                </p>
                
                {/* Détails des factures individuelles */}
                <h4 className="font-semibold mt-4 mb-2">Factures associées:</h4>
                {record.invoicesDetail && record.invoicesDetail.length > 0 ? (
                  <Table
                    size="small"
                    columns={[
                      {
                        title: 'N° Facture',
                        dataIndex: 'invoiceNumber',
                        key: 'invoiceNumber',
                      },
                      {
                        title: 'Montant',
                        dataIndex: 'amount',
                        key: 'amount',
                        render: (amount) => `${amount?.toFixed(2)} €` || '0.00 €',
                      },
                      {
                        title: 'Statut',
                        dataIndex: 'status',
                        key: 'status',
                        render: (status) => (
                          <Tag color={status === 'payée' ? 'green' : 'red'}>
                            {status === 'payée' ? 'Payée' : 'En attente'}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Date échéance',
                        dataIndex: 'dueDate',
                        key: 'dueDate',
                        render: (date) => moment(date).format('DD/MM/YYYY'),
                      },
                      {
                        title: 'Pourcentage',
                        dataIndex: 'percentage',
                        key: 'percentage',
                        render: (percentage) => `${percentage}%`,
                      },
                    ]}
                    dataSource={record.invoicesDetail}
                    pagination={false}
                  />
                ) : (
                  <p>Aucune facture détaillée disponible</p>
                )}
                
                {/* Échéancier avec statut réel */}
                <h4 className="font-semibold mt-4 mb-2">Échéancier:</h4>
                <Timeline>
                  {record.billingPlan?.installments?.map((installment, index) => {
                    // Vérifier si cette échéance est payée
                    const correspondingInvoice = record.invoicesDetail?.find(inv => 
                      inv.percentage === installment.percentage
                    );
                    const isPaid = correspondingInvoice?.status === 'payée';
                    
                    return (
                      <Timeline.Item
                        key={installment._id}
                        color={isPaid ? 'green' : 'red'}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p><strong>{installment.description}</strong></p>
                            <p>Montant: {installment.amount.toFixed(2)} €</p>
                            <p>Échéance: {moment(installment.dueDate).format('DD/MM/YYYY')}</p>
                            <p>Pourcentage: {installment.percentage}%</p>
                            {isPaid && (
                              <Tag color="green" className="mt-1">
                                <CheckCircleOutlined /> Payée
                              </Tag>
                            )}
                          </div>
                          {isPaid && correspondingInvoice?.payments && correspondingInvoice.payments.length > 0 && (
                            <div className="text-right">
                              <p><strong>Paiement:</strong></p>
                              <p>Méthode: {correspondingInvoice.payments[0]?.method}</p>
                              <p>Référence: {correspondingInvoice.payments[0]?.reference}</p>
                              <p>Date: {moment(correspondingInvoice.payments[0]?.date).format('DD/MM/YYYY')}</p>
                            </div>
                          )}
                        </div>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </div>
            ),
          }}
        />

        {/* Résumé financier mis à jour */}
        <Card title="Résumé Financier" className="mt-4">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Total TTC"
                value={factures.reduce((sum, f) => sum + (f.totalTTC || 0), 0)}
                precision={2}
                suffix="€"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Total Payé Réel"
                value={factures.reduce((sum, f) => sum + (f.actualPaidAmount || f.paidAmount || 0), 0)}
                precision={2}
                suffix="€"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Reste à Payer"
                value={factures.reduce((sum, f) => {
                  const total = f.totalTTC.toFixed(2) || 0;
                  const paid = f.actualPaidAmount.toFixed(2) || f.paidAmount.toFixed(2) || 0;
                  return sum + (total - paid);
                }, 0)}
                precision={2}
                suffix="€"
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
          </Row>
        </Card>
      </>
    )}
  </div>
</TabPane>
          </Tabs>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => navigate("/leads")}
          className="bg-purple-800 hover:bg-purple-900 underline text-white font-semibold py-2 px-4 rounded"
        >
          Retour
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-800 hover:bg-purple-900 text-white font-semibold py-2 px-4 rounded"
        >
          Modifier le client
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 sm:w-11/12 lg:w-2/3 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              Modifier le client
            </h2>
            <div className="flex flex-col space-y-6 justify-center">
              {/* Form Fields */}
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-lg font-medium text-gray-700">
                    Prénom et Nom
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom || ""}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Enter Lead prenom"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-lg font-medium text-gray-700">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Enter cllient Phone"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-lg font-medium text-gray-700">
                    Sociéte
                  </label>
                  <input
                    type="text"
                    name="societe"
                    value={formData.societe || ""}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Enter client Sociéte"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-lg font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Enter Lead's Email"
                  />
                </div>
              </div>

              <div className="flex gap-4"></div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-lg font-medium text-gray-700">
                    Code Postal
                  </label>
                  <input
                    type="text"
                    name="codepostal"
                    value={formData.codepostal || ""}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Enter code postal"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-lg font-medium text-gray-700">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville || ""}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Enter la ville"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-lg font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    type="text"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Enter l'address"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-lg font-medium text-gray-700">
                    Siret
                  </label>
                  <input
                    type="text"
                    name="siret"
                    value={formData.siret || ""}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Enter siret"
                  />
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex justify-between space-x-4 mt-8">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="bg-purple-800 hover:bg-purple-900 text-white font-medium py-3 px-6 rounded-lg transition-all"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetailsPage;

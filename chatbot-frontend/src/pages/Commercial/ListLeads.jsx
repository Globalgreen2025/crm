import React, { useState, useEffect } from "react";
import {
  Table,
  Select,
  message,
  Spin,
  Input,
  Button,
  Form,
  Modal,
  Radio,
  Row,
  Col,
  DatePicker,
  Alert as AntdAlert,
} from "antd";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import "tailwindcss/tailwind.css";
import { useNavigate } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";

const { Option } = Select;

const ListLeads = () => {
  const [devisModalVisible, setDevisModalVisible] = useState(false);
  const [chatData, setChatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commercials, setCommercials] = useState([]);
  const [showSpinner, setShowSpinner] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("prospect");
  const [filteredData, setFilteredData] = useState([]);
  const [form] = Form.useForm();
  const TVA = 10;
  const [produits, setProduits] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const handleColumnSearch = async (e, columnKey) => {
    const value = e.target.value.toLowerCase().trim();
    setSearchQuery(value);

    try {
      // If search value is empty, show all data
      if (value === "") {
        setFilteredData(chatData);
        return;
      }

      // If searching on 'commercial', handle 'N/A' or empty value cases
      if (columnKey === "commercial") {
        const filteredData = chatData.filter((item) => {
          const commercialValue = item[columnKey]
            ? `${item[columnKey].prenom} ${item[columnKey].nom}`.toLowerCase()
            : "n/a"; // Set 'n/a' as default if commercial is empty or null

          return commercialValue.includes(value);
        });
        setFilteredData(filteredData);
        return;
      }

      // Default search (for other fields)
      const response = await axios.get("/search", {
        params: {
          query: value,
          columnKey: columnKey,
        },
      });
      setFilteredData(response.data);
    } catch (error) {
      console.error("Error in search:", error);
      message.error("Error while searching.");
    }
  };

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

  const handlePageChange = (value) => {
    setCurrentPage(value);
  };
  const totalPages = Math.ceil(chatData.length / pageSize);

  const fetchCoaches = async () => {
    const token = localStorage.getItem("token");
    const decodedToken = jwtDecode(token); // Decode token to get user details
    const userId = decodedToken?.userId; // Extract user ID
    const userName = decodedToken?.name; // Extract full name

    try {
      setLoading(true);

      // Fetch leads from backend
      const response = await axios.get("/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Response data:", response.data); // Debug response structure

      // Ensure `allLeads` is an array
      const allLeads = response.data?.chatData || [];
      console.log("All leads:", allLeads); // Debug all leads

      // Split user's full name into first and last names
      const nameParts = userName?.trim().split(" ") || [];
      const firstName = nameParts[1] || ""; // First name
      const lastName = nameParts[0] || ""; // Last name

      // Filter leads based on the current commercial's info
      const filteredLeads = allLeads.filter((lead) => {
        const commercial = lead.commercial || {}; // Ensure commercial exists
        return (
          commercial._id === userId && // Match ID
          commercial.nom === lastName && // Match last name
          commercial.prenom === firstName // Match first name
        );
      });
      console.log("Filtered leads:", filteredLeads); // Debug filtered leads

      setChatData(filteredLeads); // Update state with filtered leads
      if (activeFilter === "prospect") {
        setFilteredData(
          response.data.chatData.filter((item) => item.type === "prospect")
        );
      } else if (activeFilter === "client") {
        setFilteredData(
          response.data.chatData.filter((item) => item.type === "client")
        );
      } else {
        setFilteredData(response.data.chatData);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      message.error("Failed to fetch leads");
    } finally {
      setLoading(false); // End loading state
    }
  };

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

  useEffect(() => {
    fetchCommercials();
    fetchCoaches();
  }, []);

  const fetchCommercials = async () => {
    try {
      const response = await axios.get("/commercials");
      setCommercials(response.data);
      console.log("Fetched commercials:", response.data);
    } catch (error) {
      console.error("Error fetching commercials:", error);
      message.error("Failed to fetch commercials");
    }
  };

  const handleLeadClick = (chatData) => {
    navigate(`/lead/${chatData._id}`);
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
      console.log("formData", formData);

      const response = await axios.post("/command", formData);
      message.success("Devis ajoutée avec succès !");
      setDevisModalVisible(false);
    } catch (error) {
      message.error("Impossible d'ajouter le devis");
      console.error(error);
    }
  };

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

  const handleFilter = (type) => {
    setActiveFilter(type);

    if (type === "prospect") {
      const filtered = chatData.filter((item) => item.type === "prospect");
      setFilteredData(filtered);
    } else if (type === "client") {
      const filtered = chatData.filter((item) => item.type === "client");
      setFilteredData(filtered);
    } else {
      setFilteredData(chatData); // Optional: show all
    }
  };

  if (loading && showSpinner) return <Spin tip="Loading..." />;

  if (error)
    return <Alert message="Error" description={error} type="error" showIcon />;

  const columns = [
    {
      title: "Prénom et Nom", // Changed title to "Prenom and Nom"
      key: "nom",
      dataIndex: "nom",
      render: (text, record) => (
        <div className="cursor-pointer" onClick={() => handleLeadClick(record)}>
          <div>{record.nom || ""}</div>
        </div>
      ),
    },

    {
      title: "Email",
      key: "email" || "email1",
      dataIndex: "email" || "email1",
      render: (text, record) => (
        <div className="cursor-pointer" onClick={() => handleLeadClick(record)}>
          <div className="text-gray-500 text-xs">
            {record.verification_email === "Non" ? record.email1 : record.email}
          </div>
        </div>
      ),
    },
    {
      title: "TELEPHONE",
      dataIndex: "phone",
      key: "phone",
      render: (text) => text || "",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: (text) => text || "",
    },
    {
      title: "code postal",
      dataIndex: "codepostal",
      key: "codepostal",
      render: (text) => text || "",
    },
    {
      title: "Ville",
      dataIndex: "ville",
      key: "ville",
      render: (text) => text || "",
    },

    {
      title: "Siret",
      dataIndex: "siret",
      key: "siret",
      render: (text, record) => text || record.siret || "",
    },

    {
      title: "STATUS LEAD",
      key: "type",
      dataIndex: "type",
    },

    {
      title: "Commentaire",
      key: "lastComment",
      render: (text, record) => {
        const lastComment =
          record.commentaires?.[record.commentaires.length - 1];
        if (!lastComment)
          return (
            <span className="text-gray-400 text-xs">Aucun commentaire</span>
          );
        const date = new Date(lastComment.addedAt).toLocaleDateString("fr-FR");
        const time = new Date(lastComment.addedAt).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div className="text-xs">
            <div className="font-semibold text-gray-800">
              {lastComment.text}
            </div>
            <div className="text-gray-500">{lastComment.addedBy.name}</div>
            <div className="text-gray-400">
              {date} à {time}
            </div>
          </div>
        );
      },
    },
    {
      title: "commercial",
      key: "commercial",
      dataIndex: "commercial",
      render: (text, record) => (
        <div>
          {record.commercial
            ? `${record.commercial.prenom} ${record.commercial.nom}`
            : "N/A"}
        </div>
      ),
    },
  ];

  return (
    <section>
      <div className="md:flex flex-row justify-between  items-center p-4 bg-white rounded-t-md shadow-sm">
        <h2 className="text-md font-semibold text-gray-700">
          NOUVAEU PROSPET/CLIENT
        </h2>
        <div className="flex flex-row md:flex-row gap-1 sm:gap-4">
          <Button
            type={activeFilter === "prospect" ? "primary" : "default"}
            onClick={() => handleFilter("prospect")}
          >
            Prospect
          </Button>
          <Button
            type={activeFilter === "client" ? "primary" : "default"}
            onClick={() => handleFilter("client")}
          >
            Client
          </Button>
        </div>
      </div>

      {/* <div className="mb-4 p-4 flex items-center rounded-md gap-4">
        <span className="font-thin text-gray-600">Afficher</span>
        <Select
          defaultValue={1}
          onChange={handlePageChange}
          className="w-20 border-gray-300"
        >
          {[...Array(totalPages)].map((_, index) => (
            <Option key={index + 1} value={index + 1}>
              {index + 1}
            </Option>
          ))}
        </Select>

        <span className="font-thin text-gray-600">résultats par page</span>
      </div> */}
      <div className="mb-6 p-4 bg-white border mt-4 border-gray-200 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Afficher</span>
          <Select
            defaultValue={1}
            onChange={handlePageChange}
            className="w-20 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          >
            {[...Array(totalPages)].map((_, index) => (
              <Option key={index + 1} value={index + 1}>
                {index + 1}
              </Option>
            ))}
          </Select>
          <span className="text-sm font-medium text-gray-700">
            résultats par page
          </span>
        </div>

        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setDevisModalVisible(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Créer un Devis
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md w-full md:p-6 overflow-x-auto">
        <Table
          columns={[
            ...columns.map((col) => ({
              ...col,
              title: (
                <div className="flex flex-col items-center">
                  <div className="text-xs">{col.title}</div>
                  {col.key !== "action" && (
                    <Input
                      placeholder={`${col.title}`}
                      onChange={(e) => handleColumnSearch(e, col.key)}
                      // className="mt-2 text-sm sm:text-base w-full sm:w-auto"
                      size="medium"
                    />
                  )}
                </div>
              ),
            })),
          ]}
          // dataSource={chatData.slice(
          //   (currentPage - 1) * pageSize,
          //   currentPage * pageSize
          // )}
          // pagination={{
          //   current: currentPage,
          //   pageSize,
          //   total: chatData.length,
          //   onChange: (page) => setCurrentPage(page),
          // }}
          dataSource={filteredData.slice(
            (currentPage - 1) * pageSize,
            currentPage * pageSize
          )}
          pagination={{
            current: currentPage,
            pageSize,
            total: filteredData.length,
            // onChange: (page) => setCurrentPage(page),
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
          }}
          rowKey={(record) => record._id}
          bordered
          className="custom-table text-xs sm:text-sm"
          tableLayout="auto"
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
            <Form.Item label="Forfait (€)" name="forfait" className="w-full">
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
      </Modal>
    </section>
  );
};

export default ListLeads;

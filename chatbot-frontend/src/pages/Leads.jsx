import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Spin,
  Table,
  Alert,
  Select,
  Button,
  Popconfirm,
  Space,
  message,
  Input,
  Form,
  Modal,
  Radio,
  Row,
  Col,
  DatePicker,
  Alert as AntdAlert,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  DeleteOutlined,
  CloseOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import { jwtDecode } from "jwt-decode";
import logo from "../assets/logo.jpeg"

const { Option } = Select;

const Leads = () => {
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [devisModalVisible, setDevisModalVisible] = useState(false);
  const [chatData, setChatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [showSpinner, setShowSpinner] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [activeFilter, setActiveFilter] = useState("prospect");
  const [formVisible, setFormVisible] = useState(false);
  const [form] = Form.useForm();
  const [clientForm] = Form.useForm();
  const TVA = 5.5;
  const [produits, setProduits] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [previewImage, setPreviewImage] = useState(false);

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

  const handleFormSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post("/data", values);
      message.success("Client créé avec succès !");
      form.resetFields();
      setClientModalVisible(false); 
    } catch (error) {
      console.error("Error adding client:", error);
      message.error("Erreur lors de la création du client");
    } finally {
      setLoading(false);
    }
  };

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
        forfait: formValues.forfait,
        prixUnitaire: formValues.prixUnitaire || 0,
        session: decodedToken?.userId || decodedToken?.commercialId,
        leadId: selectedLeadId,
        commercialName,
      };
      console.log("formDataaaa", formData);

      const response = await axios.post("/command", formData);
      message.success("Devis ajoutée avec succès !");
      setDevisModalVisible(false);
    } catch (error) {
      message.error("Impossible d'ajouter le devis");
      console.error(error);
    }
  };

  const handlePageChange = (value) => {
    setCurrentPage(value);
  };
  const handleLeadClick = (chatData) => {
    navigate(`/lead/${chatData._id}`);
  };

  const totalPages = Math.ceil(chatData.length / pageSize);


  const handleStatusLeadChange = async (statusLead, record) => {
    try {
      const validStatuses = ["prospect", "client"];

      if (!validStatuses.includes(statusLead)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      const response = await axios.put(`/updateStatusLead/${record._id}`, {
        statusLead,
      });

      // Update both states
      setChatData((prev) =>
        prev.map((item) =>
          item._id === record._id ? { ...item, type: statusLead } : item
        )
      );
      setFilteredData((prev) =>
        prev.map((item) =>
          item._id === record._id ? { ...item, type: statusLead } : item
        )
      );

      console.log("Updated status:", response.data);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`/lead/${id}`);

      // Update both states
      setChatData((prev) => prev.filter((lead) => lead._id !== id));
      setFilteredData((prev) => prev.filter((lead) => lead._id !== id));

      message.success("Lead supprimé avec succès");
    } catch (error) {
      console.error("Error deleting coach:", error);
      message.error("Failed to delete coach");
    }
  };

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

 

  const columns = [
    {
      title: "Prénom et Nom",
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
      title: "TEL FIX",
      dataIndex: "phoneFix",
      key: "phoneFix",
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
      title: "Prestation",
      dataIndex: "prestation",
      key: "prestation",
      render: (text) => text || "",
    },
    //     prestation
    // societe
    // reglement
    {
      title: "Société",
      dataIndex: "societe",
      key: "societe",
      render: (text, record) => text || record.societe || "",
    },
    {
      title: "STATUS LEAD",
      key: "statusLead",
      render: (text, record) => (
        <Select
          value={record.type || "prospect"} // Use record.type as value
          style={{ width: 90 }}
          onChange={(value) => handleStatusLeadChange(value, record)}
        >
          {/* <Option value="nouveau">Nouveau</Option> */}
          <Option value="prospect">Prospect</Option>
          <Option value="client">Client</Option>
        </Select>
      ),
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
    {
      title: <span style={{ fontSize: "12px" }}>Action</span>,
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce lead ?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={<DeleteOutlined />}
              style={{ backgroundColor: "red", color: "white" }}
              danger
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await axios.get("/data");
        console.log("Fetched data:", response.data);
        setChatData(response.data.chatData);

        // Apply the initial filter right after setting the data
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
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, [activeFilter]); // Add activeFilter to dependencies
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpinner(true);
    }, 1000); // Show spinner after 1 second

    // Cleanup timer if component unmounts
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fakeLoad = setTimeout(() => {
      setLoading(false);
    }, 3000); // Replace with actual loading duration

    return () => clearTimeout(fakeLoad);
  }, []);

  if (error)
    return <Alert message="Error" description={error} type="error" showIcon />;
  const rowSelection = {
    onChange: (selectedRowKeys) => {
      setSelectedLeads(selectedRowKeys);
    },
    selectedRowKeys: selectedLeads,
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

  useEffect(() => {
    // When chatData changes, reapply the current filter
    if (activeFilter === "prospect") {
      const filtered = chatData.filter((item) => item.type === "prospect");
      setFilteredData(filtered);
    } else if (activeFilter === "client") {
      const filtered = chatData.filter((item) => item.type === "client");
      setFilteredData(filtered);
    } else {
      setFilteredData(chatData);
    }
  }, [chatData, activeFilter]);

  if (loading && showSpinner) return <Spin tip="Loading..." />;

  return (
    <section>
      <div className="mb-12 md:p-4 p-1">
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

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setClientModalVisible(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Créer un client
            </button>
            <button
              onClick={() => setDevisModalVisible(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Créer un Devis
            </button>
          </div>
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
    <span className="text-sm font-medium text-gray-700">résultats par page</span>
  </div>

  <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
    <button
      onClick={() => setClientModalVisible(true)}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Créer un client
    </button>
    {/* <button
      onClick={() => setDevisModalVisible(true)}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
    >
      Créer un Devis
    </button> */}
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
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "30", "50", "100"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            rowKey={(record) => record._id}
            bordered
            className="custom-table text-xs sm:text-sm"
            // rowSelection={rowSelection}
            tableLayout="auto"
          />
        </div>
      </div>

      <Modal
        title={
          <div className="bg-gray-100 p-3 -mx-6 -mt-6 flex justify-between items-center sticky top-0 z-10 border-b">
            <span className="font-medium text-sm">Créer un Client</span>
            <button
              onClick={() => setClientModalVisible(false)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none text-xs"
            >
              <CloseOutlined className="text-xs" />
            </button>
          </div>
        }
        open={clientModalVisible}
        onCancel={() => setClientModalVisible(false)}
        footer={null}
        width="25%"
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
          form={clientForm}
          onFinish={handleFormSubmit}
          layout="vertical"
          className="space-y-4"
        >
          <Form.Item
            label="Prénom et Nom"
            name="nom"
            rules={[{ required: false, message: "Prénom est requis" }]}
          >
            <Input
              className="w-full p-2 border rounded-lg"
              placeholder="Jean Dupont"
            />
          </Form.Item>

          <Form.Item
            label="Adresse"
            name="address"
            rules={[{ required: false, message: "L'adresse est requise." }]}
          >
            <Input
              className="w-full p-2 border rounded-lg"
              placeholder="123 Rue de la République"
            />
          </Form.Item>

          <Form.Item
            label="Ville"
            name="ville"
            rules={[{ required: false, message: "Ville est requise." }]}
          >
            <Input
              className="w-full p-2 border rounded-lg"
              placeholder="Paris"
            />
          </Form.Item>

          <Form.Item
            label="Code postal"
            name="codepostal"
            rules={[{ required: false, message: "Code postal est requis." }]}
          >
            <Input
              className="w-full p-2 border rounded-lg"
              placeholder="75001"
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: false, message: "Email est requis." },
              {
                type: "email",
                message: "Veuillez entrer une adresse e-mail valide.",
              },
            ]}
          >
            <Input
              className="w-full p-2 border rounded-lg"
              placeholder="jean.dupont@example.com"
            />
          </Form.Item>

          <Form.Item
            label="Téléphone"
            name="phone"
            rules={[{ required: true, message: "Téléphone est requis." }]}
          >
            <Input
              className="w-full p-2 border rounded-lg"
              placeholder="0612345678"
            />
          </Form.Item>

          <Form.Item label="Siret" name="siret">
            <Input
              className="w-full p-2 border rounded-lg"
              placeholder="123 456 789 00012"
            />
          </Form.Item>

          <Form.Item label="Société" name="societe">
            <Input
              className="w-full p-2 border rounded-lg"
              placeholder="Entreprise Dupont SARL"
            />
          </Form.Item>

          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t">
            <div className="flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="px-4 py-2 bg-purple-800 text-white rounded-lg"
              >
                Ajouter Client
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

    </section>
  );
};

export default Leads;

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import {
//   Table,
//   Button,
//   Modal,
//   Form,
//   Input,
//   message,
//   Popconfirm,
//   Upload,
//   Avatar,
//   Breadcrumb,
// } from "antd";
// import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
// import ListAdmin from "./Admin/ListAdmin";
// // import ListManager from "./Manager/ListManager";

// const getInitials = (prenom, nom) => {
//   if (!prenom || !nom) return "";
//   return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
// };

// const CommerciauxPage = () => {
//   const [commercials, setCommercials] = useState([]);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [currentCommercial, setCurrentCommercial] = useState(null);
//   const [form] = Form.useForm();

//   useEffect(() => {
//     fetchCommercials();
//   }, []);

//   const fetchCommercials = async () => {
//     try {
//       const response = await axios.get("/commercials");
//       setCommercials(response.data);
//     } catch (error) {
//       console.error("Error fetching commercials:", error);
//     }
//   };

//   const handleAddCommercial = () => {
//     setIsEditing(false);
//     setCurrentCommercial(null);
//     setIsModalVisible(true);
//   };

//   const handleEditCommercial = (commercial) => {
//     setIsEditing(true);
//     setCurrentCommercial(commercial);
//     form.setFieldsValue({
//       ...commercial,
//       password: "", // Clear the password field when editing
//     });
//     setIsModalVisible(true);
//   };

//   const handleDeleteCommercial = async (commercialId) => {
//     try {
//       await axios.delete(`/commercials/${commercialId}`);
//       message.success("Commercial supprimé avec succès");
//       fetchCommercials();
//     } catch (error) {
//       console.error("Error deleting commercial:", error);
//       message.error("Erreur lors de la suppression du commercial");
//     }
//   };

//   const handleCancel = () => {
//     setIsModalVisible(false);
//     form.resetFields();
//     setCurrentCommercial(null);
//   };

//   const handleSave = async (values) => {
//     try {
//       if (isEditing) {
//         await axios.put(`/commercials/${currentCommercial._id}`, values);
//         message.success("Commercial mis à jour avec succès");
//       } else {
//         await axios.post("/commercials", values);
//         message.success("Commercial ajouté avec succès");
//       }
//       setIsModalVisible(false);
//       form.resetFields();
//       fetchCommercials();
//     } catch (error) {
//       console.error("Error saving commercial:", error);
//       message.error("Erreur lors de la sauvegarde du commercial");
//     }
//   };

//   const columns = [
//     {
//       title: "Nom Prénom",
//       key: "nomPrenom",
//       render: (text, record) => (
//         <div className="flex items-center">
//           {record.image ? (
//             <img
//               src={record.image}
//               alt="Commercial"
//               className="w-9 h-9 rounded-full mr-2"
//             />
//           ) : (
//             <Avatar
//               style={{ backgroundColor: "" }}
//               size={40}
//               className="mr-2 bg-purple-800 text-white"
//             >
//               {getInitials(record.prenom, record.nom)}
//             </Avatar>
//           )}
//           <span>
//             {" "}
//             {record.prenom} {record.nom}
//           </span>
//         </div>
//       ),
//     },
//     {
//       title: "Email",
//       dataIndex: "email",
//       key: "email",
//     },
//     {
//       title: "Téléphone",
//       dataIndex: "phone",
//       key: "phone",
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (text, record) => (
//         <div>
//           <Button
//             type="primary"
//             icon={<EditOutlined style={{ color: "white" }} />}
//             className="mr-2"
//             style={{ backgroundColor: "green", borderColor: "green" }}
//             onClick={() => handleEditCommercial(record)}
//             shape="circle"
//           />
//           <Popconfirm
//             title="Êtes-vous sûr de vouloir supprimer ce commercial?"
//             onConfirm={() => handleDeleteCommercial(record._id)}
//             okText="Oui"
//             cancelText="Non"
//           >
//             <Button
//               type="danger"
//               icon={<DeleteOutlined style={{ color: "white" }} />}
//               style={{ backgroundColor: "red", borderColor: "red" }}
//               shape="circle"
//             />
//           </Popconfirm>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <>
//       <div className="p-8 border rounded shadow-lg mt-4">
//         <h2 className="text-2xl font-bold mb-4">Gestion des Commerciaux</h2>
//         <Button
//           type=""
//           className="bg-purple-800 text-white"
//           icon={<PlusOutlined />}
//           onClick={handleAddCommercial}
//         >
//           Ajouter un Commercial
//         </Button>
//         <Table
//           columns={columns}
//           dataSource={commercials}
//           rowKey="_id"
//           className="mt-4"
//           scroll={{ x: "max-content" }}
//         />
//         <Modal
//           title={isEditing ? "Modifier le Commercial" : "Ajouter un Commercial"}
//           visible={isModalVisible}
//           onCancel={handleCancel}
//           footer={null}
//           centered
//         >
//           <Form form={form} layout="vertical" onFinish={handleSave}>
//             <Form.Item
//               name="nom"
//               label="Nom"
//               rules={[{ required: true, message: "Veuillez entrer le nom" }]}
//             >
//               <Input />
//             </Form.Item>
//             <Form.Item
//               name="prenom"
//               label="Prénom"
//               rules={[{ required: true, message: "Veuillez entrer le prénom" }]}
//             >
//               <Input />
//             </Form.Item>
//             <Form.Item
//               name="email"
//               label="Email"
//               rules={[{ required: true, message: "Veuillez entrer l'email" }]}
//             >
//               <Input type="email" />
//             </Form.Item>
//             <Form.Item
//               name="phone"
//               label="Téléphone"
//               rules={[
//                 { required: true, message: "Veuillez entrer le téléphone" },
//               ]}
//             >
//               <Input />
//             </Form.Item>
//             <Form.Item
//               name="password"
//               label="Mot de passe"
//               rules={[
//                 {
//                   required: !isEditing,
//                   message: "Veuillez entrer le mot de passe",
//                 },
//               ]}
//             >
//               <Input.Password />
//             </Form.Item>

//             <Form.Item>
//               <Button
//                 type=""
//                 className="bg-purple-800 text-white"
//                 htmlType="submit"
//               >
//                 Enregistrer
//               </Button>
//               <Button onClick={handleCancel} className="ml-2">
//                 Annuler
//               </Button>
//             </Form.Item>
//           </Form>
//         </Modal>
//       </div>
//       <div className="p-4 border rounded shadow-lg mt-4">
//         <ListAdmin />
//       </div>
//     </>
//   );
// };

// export default CommerciauxPage;

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Avatar,
  Card,
  Tabs,
  Tag,
  Space,
  Divider,
  Badge,
  Select,
  DatePicker
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  SearchOutlined,
  FilterOutlined
} from "@ant-design/icons";
import ListAdmin from "./Admin/ListAdmin";


const { TabPane } = Tabs;
const { Option } = Select;

const getInitials = (prenom, nom) => {
  if (!prenom || !nom) return "";
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
};

const statusColors = {
  active: "green",
  inactive: "red",
  pending: "orange"
};

const CommerciauxPage = () => {
  const [commercials, setCommercials] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCommercial, setCurrentCommercial] = useState(null);
  const [activeTab, setActiveTab] = useState("commerciaux");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCommercials();
  }, []);

  const fetchCommercials = async () => {
    try {
      const response = await axios.get("/commercials");
      console.log("Commercials fetched:", response.data);
      setCommercials(response.data);
    } catch (error) {
      console.error("Error fetching commercials:", error);
    }
  };

  const handleAddCommercial = () => {
    setIsEditing(false);
    setCurrentCommercial(null);
    setIsModalVisible(true);
  };

  const handleEditCommercial = (commercial) => {
    setIsEditing(true);
    setCurrentCommercial(commercial);
    form.setFieldsValue({
      ...commercial,
      password: "", 
    });
    setIsModalVisible(true);
  };

  const handleDeleteCommercial = async (commercialId) => {
    try {
      await axios.delete(`/commercials/${commercialId}`);
      message.success("Commercial supprimé avec succès");
      fetchCommercials();
    } catch (error) {
      console.error("Error deleting commercial:", error);
      message.error("Erreur lors de la suppression du commercial");
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setCurrentCommercial(null);
  };

  const handleSave = async (values) => {
    try {
      if (isEditing) {
        const res = await axios.put(`/commercials/${currentCommercial._id}`, values);
        console.log("Commercial updated:", res.data);
        message.success("Commercial mis à jour avec succès");
      } else {
        const res = await axios.post("/commercials", values);
        console.log("Commercial added:", res.data);
        message.success("Commercial ajouté avec succès");
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchCommercials();
    } catch (error) {
      console.error("Error saving commercial:", error);
      message.error("Erreur lors de la sauvegarde du commercial");
    }
  };

  const filteredCommercials = commercials.filter(commercial => {
    const matchesSearch = 
      commercial.nom.toLowerCase().includes(searchText.toLowerCase()) ||
      commercial.prenom.toLowerCase().includes(searchText.toLowerCase()) ||
      commercial.email.toLowerCase().includes(searchText.toLowerCase()) ||
      commercial.phone.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" || commercial.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  const formatLastActivity = (dateString) => {
    if (!dateString) return 'Never active';
    
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - activityDate) / 1000);
    
    // Time intervals in seconds
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365;

    if (diffInSeconds < minute) return 'Just now';
    if (diffInSeconds < hour) {
      const mins = Math.floor(diffInSeconds / minute);
      return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
    }
    if (diffInSeconds < day) {
      const hours = Math.floor(diffInSeconds / hour);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffInSeconds < month) {
      const days = Math.floor(diffInSeconds / day);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    if (diffInSeconds < year) {
      return activityDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
    
    // For dates older than 1 year
    return activityDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const columns = [
    {
      title: "COMMERCIAL",
      key: "nomPrenom",
      render: (text, record) => (
        <div className="flex items-center">
          {record.image ? (
            <img
              src={record.image}
              alt="Commercial"
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <Avatar
              size={40}
              className="mr-3 bg-blue-600 text-white"
              icon={<UserOutlined />}
            >
              {getInitials(record.prenom, record.nom)}
            </Avatar>
          )}
          <div>
            <div className="font-medium text-gray-900">
              {record.prenom} {record.nom}
            </div>
            <div className="text-gray-500 text-sm">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status] || "blue"} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "TÉLÉPHONE",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => (
        <div className="text-gray-700">
          {phone || <span className="text-gray-400">Non renseigné</span>}
        </div>
      ),
    },
    {
      title: "LAST ACTIVITY",
      key: "lastActivity",
      render: (_, record) => (
        <div className="text-gray-600">
          {formatLastActivity(record.lastActivity)}
          <div className="text-xs text-gray-400">
            {record.lastActivity && new Date(record.lastActivity).toLocaleString()}
          </div>
        </div>
      )
    },
    {
      title: "ACTIONS",
      key: "actions",
      render: (text, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined className="text-blue-600" />}
            onClick={() => handleEditCommercial(record)}
            className="action-button"
          />
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce commercial?"
            onConfirm={() => handleDeleteCommercial(record._id)}
            okText="Oui"
            cancelText="Non"
            placement="left"
          >
            <Button
              type="text"
              icon={<DeleteOutlined className="text-red-600" />}
              className="action-button"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="crm-container">
      <div className="crm-header">
        <h1 className="crm-title">
          <TeamOutlined className="mr-2" /> Gestion des Utilisateurs
        </h1>
        <div className="crm-actions">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddCommercial}
            className="add-button"
          >
            Nouveau Commercial
          </Button>
        </div>
      </div>

      <Card className="crm-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="crm-tabs"
        >
          <TabPane
            tab={
              <span>
                <UserOutlined /> Commerciaux
                {commercials.length > 0 && (
                  <Badge
                    count={commercials.length}
                    style={{ backgroundColor: '#1890ff', marginLeft: 8 }}
                  />
                )}
              </span>
            }
            key="commerciaux"
          >
            <div className="crm-filters">
              <Input
                placeholder="Rechercher un commercial..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="search-input"
              />
              <Select
                placeholder="Statut"
                value={filterStatus}
                onChange={setFilterStatus}
                className="status-filter"
                allowClear
              >
                <Option value="all">Tous les statuts</Option>
                <Option value="active">Actif</Option>
                <Option value="inactive">Inactif</Option>
                <Option value="pending">En attente</Option>
              </Select>
              <Button icon={<FilterOutlined />} className="advanced-filter">
                Filtres avancés
              </Button>
            </div>

            <Divider className="crm-divider" />

            <Table
                     columns={[
                      ...columns.map((col) => ({
                        ...col,
                        title: (
                          <div className="flex flex-col items-center">
                            <div className="text-xs">{col.title}</div>
                      
                          </div>
                        ),
                      })),
                    ]}
              dataSource={filteredCommercials}
              rowKey="_id"
              className="crm-table"
              scroll={{ x: '100%' }}
              pagination={{
                showSizeChanger: true,
                pageSizeOptions: ['10', '25', '50', '100'],
                showTotal: (total) => `Total: ${total} commerciaux`,
              }}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <UserOutlined /> Administrateurs
              </span>
            }
            key="administrateurs"
          >
            <ListAdmin />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={
          <span className="modal-title">
            {isEditing ? "Modifier le Commercial" : "Nouveau Commercial"}
          </span>
        }
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        centered
        className="crm-modal"
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div className="form-grid">
            <Form.Item
              name="nom"
              label="Nom"
              rules={[{ required: true, message: "Veuillez entrer le nom" }]}
              className="form-item"
            >
              <Input placeholder="Entrez le nom" />
            </Form.Item>
            <Form.Item
              name="prenom"
              label="Prénom"
              rules={[{ required: true, message: "Veuillez entrer le prénom" }]}
              className="form-item"
            >
              <Input placeholder="Entrez le prénom" />
            </Form.Item>
          </div>

          <div className="form-grid">
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: "Veuillez entrer l'email" }]}
              className="form-item"
            >
              <Input type="email" placeholder="Entrez l'email" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Téléphone"
              rules={[
                { required: true, message: "Veuillez entrer le téléphone" },
              ]}
              className="form-item"
            >
              <Input placeholder="Entrez le téléphone" />
            </Form.Item>
          </div>

          <div className="form-grid">
            <Form.Item
              name="status"
              label="Statut"
              initialValue="active"
              className="form-item"
            >
              <Select>
                <Option value="active">Actif</Option>
                <Option value="inactive">Inactif</Option>
                <Option value="pending">En attente</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="password"
              label="Mot de passe"
              rules={[
                {
                  required: !isEditing,
                  message: "Veuillez entrer le mot de passe",
                },
              ]}
              className="form-item"
            >
              <Input.Password placeholder="Entrez le mot de passe" />
            </Form.Item>
          </div>

          <Form.Item className="form-actions">
            <Space>
              <Button onClick={handleCancel} className="cancel-button">
                Annuler
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                className="submit-button"
              >
                {isEditing ? "Mettre à jour" : "Créer"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CommerciauxPage;
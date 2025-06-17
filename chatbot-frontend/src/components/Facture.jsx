// import React, { useState, useEffect } from "react";
// import { Table, Button, Modal, Form, Input, Select, Tag, message } from "antd";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";

// const { Option } = Select;
// const { TextArea } = Input;

// const Reclamations = () => {
//   const [tickets, setTickets] = useState([]);
//   const [clients, setClients] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [form] = Form.useForm();
//   const navigate = useNavigate();
//   const [userRole, setUserRole] = useState("commercial");
//   const [currentUser, setCurrentUser] = useState(null);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       const decoded = jwtDecode(token);
//       setCurrentUser({
//         id: decoded.userId,
//         name: decoded.name,
//         role: decoded.role,
//       });
//     }
//   }, []);
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [ticketsRes, clientsRes] = await Promise.all([
//           axios.get("/tickets"),
//           axios.get("/data"),
//         ]);

//         console.log("Clients data structure:", clientsRes.data); // Debug log

//         setTickets(ticketsRes.data);

//         // Handle both possible response structures:
//         const clientsData = clientsRes.data.chatData || clientsRes.data || [];
//         setClients(clientsData);
//       } catch (error) {
//         message.error("Failed to fetch data");
//         console.error("Fetch error:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const handleCreateTicket = async (values) => {
//     try {
//       const token = localStorage.getItem("token");
//       const decoded = jwtDecode(token);

//       const ticketData = {
//         title: values.title,
//         description: values.description,
//         clientId: values.client,
//         priority: values.priority,
//         createdBy: {
//           id: decoded.userId,
//           name: decoded.name,
//           role: decoded.role,
//         },
//       };

//       const response = await axios.post(
//         "http://localhost:5000/tickets",
//         ticketData,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (response.data.success) {
//         setTickets([...tickets, response.data.data]);
//         setIsModalVisible(false);
//         form.resetFields();
//         message.success("Ticket created successfully");
//       } else {
//         message.error(response.data.message);
//       }
//     } catch (error) {
//       console.error("Ticket creation error:", error);
//       message.error(error.response?.data?.message || "Failed to create ticket");
//     }
//   };

//   const handleStatusChange = async (ticketId, status) => {
//     try {
//       const response = await axios.put(`/tickets/${ticketId}`, { status });
//       setTickets(tickets.map((t) => (t._id === ticketId ? response.data : t)));
//       message.success("Status updated");
//     } catch (error) {
//       message.error("Failed to update status");
//     }
//   };

//   const columns = [
//     {
//       title: "Ticket ID",
//       dataIndex: "_id",
//       key: "_id",
//       render: (id) => <span>{id.slice(-6)}</span>,
//     },
//     {
//       title: "Title",
//       dataIndex: "title",
//       key: "title",
//     },
//     {
//       title: "Client",
//       dataIndex: "client",
//       key: "client",
//       render: (client) => client?.nom || "N/A",
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       render: (status) => {
//         let color = "";
//         switch (status) {
//           case "open":
//             color = "orange";
//             break;
//           case "in_progress":
//             color = "blue";
//             break;
//           case "resolved":
//             color = "green";
//             break;
//           case "closed":
//             color = "gray";
//             break;
//           default:
//             color = "default";
//         }
//         return (
//           <Tag color={color}>{status.toUpperCase().replace("_", " ")}</Tag>
//         );
//       },
//     },
//     {
//       title: "Priority",
//       dataIndex: "priority",
//       key: "priority",
//       render: (priority) => {
//         let color = "";
//         switch (priority) {
//           case "high":
//             color = "red";
//             break;
//           case "medium":
//             color = "orange";
//             break;
//           case "low":
//             color = "green";
//             break;
//           default:
//             color = "default";
//         }
//         return <Tag color={color}>{priority.toUpperCase()}</Tag>;
//       },
//     },
//     {
//       title: "Created By",
//       dataIndex: "createdBy",
//       key: "createdBy",
//       render: (createdBy) => (
//         <div>
//           <div>{createdBy?.name || "Unknown"}</div>
//           <Tag color={createdBy?.userType === "Admin" ? "blue" : "green"}>
//             {createdBy?.userType}
//           </Tag>
//         </div>
//       ),
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_, record) => (
//         <div className="flex gap-2">
//           <Button onClick={() => navigate(`/reclamations/${record._id}`)}>
//             View
//           </Button>
//           {userRole === "admin" && record.status !== "closed" && (
//             <Select
//               defaultValue={record.status}
//               onChange={(value) => handleStatusChange(record._id, value)}
//               style={{ width: 120 }}
//             >
//               <Option value="open">Open</Option>
//               <Option value="in_progress">In Progress</Option>
//               <Option value="resolved">Resolved</Option>
//               <Option value="closed">Closed</Option>
//             </Select>
//           )}
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="container mx-auto px-4 py-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold">Mes Réclamations</h1>
//         <Button type="primary" onClick={() => setIsModalVisible(true)}>
//           Create New Ticket
//         </Button>
//       </div>

//       <Table
//         columns={[
//           ...columns.map((col) => ({
//             ...col,
//             title: (
//               <div className="flex flex-col items-center">
//                 <div className="text-xs">{col.title}</div>
//               </div>
//             ),
//           })),
//         ]}
//         dataSource={tickets}
//         loading={loading}
//         rowKey="_id"
//       />

//       <Modal
//         title="Create New Ticket"
//         visible={isModalVisible}
//         onCancel={() => setIsModalVisible(false)}
//         footer={null}
//       >
//         <Form form={form} onFinish={handleCreateTicket} layout="vertical">
//           <Form.Item name="title" label="Title" rules={[{ required: true }]}>
//             <Input />
//           </Form.Item>
//           <Form.Item name="client" label="Client" rules={[{ required: true }]}>
//             <Select showSearch optionFilterProp="children">
//               {clients.map((client) => (
//                 <Option key={client._id} value={client._id}>
//                   {client.nom || "Unnamed Client"} -{" "}
//                   {client.phone || "No phone"}
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Form.Item name="priority" label="Priority" initialValue="medium">
//             <Select>
//               <Option value="low">Faible</Option>
//               <Option value="medium">Moyen</Option>
//               <Option value="high">Élevé</Option>
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name="description"
//             label="Description"
//             rules={[{ required: true }]}
//           >
//             <TextArea rows={4} />
//           </Form.Item>

//           <Form.Item>
//             <Button type="primary" htmlType="submit">
//               Submit
//             </Button>
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default Reclamations;

import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, Tag, message, Card, Badge, Space } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { PlusOutlined, SearchOutlined, EyeOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

const Reclamations = () => {
  const [tickets, setTickets] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("commercial");
  const [currentUser, setCurrentUser] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setCurrentUser({
        id: decoded.userId,
        name: decoded.name,
        role: decoded.role,
      });
      setUserRole(decoded.role);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, clientsRes] = await Promise.all([
          axios.get("/tickets"),
          axios.get("/data"),
        ]);

        setTickets(ticketsRes.data);
        const clientsData = clientsRes.data.chatData || clientsRes.data || [];
        setClients(clientsData);
      } catch (error) {
        message.error("Échec du chargement des données");
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateTicket = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);

      const ticketData = {
        title: values.title,
        description: values.description,
        clientId: values.client,
        priority: values.priority,
        createdBy: {
          id: decoded.userId,
          name: decoded.name,
          role: decoded.role,
        },
      };

      const response = await axios.post("/tickets", ticketData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setTickets([...tickets, response.data.data]);
        setIsModalVisible(false);
        form.resetFields();
        message.success("Réclamation créée avec succès");
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.error("Erreur:", error);
      message.error(error.response?.data?.message || "Échec de la création");
    }
  };

  const handleStatusChange = async (ticketId, status) => {
    try {
      const response = await axios.put(`/tickets/${ticketId}`, { status });
      setTickets(tickets.map((t) => (t._id === ticketId ? response.data : t)));
      message.success("Statut mis à jour");
    } catch (error) {
      message.error("Échec de la mise à jour");
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    return (
      ticket.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (ticket.client?.nom && ticket.client.nom.toLowerCase().includes(searchText.toLowerCase())) ||
      ticket._id.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const columns = [
    {
      title: "ID Réclamation",
      dataIndex: "_id",
      key: "_id",
      render: (id) => <span className="font-mono">#{id.slice(-6)}</span>,
    },
    {
      title: "Titre",
      dataIndex: "title",
      key: "title",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => <span className="text-sm text-gray-600">{text}</span>,
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      render: (client) => (
        <div>
          <div className="font-medium">{client?.nom || "N/A"}</div>
          <div className="text-xs text-gray-500">{client?.phone || ""}</div>
        </div>
      ),
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusMap = {
          open: { text: "Ouvert", color: "orange" },
          in_progress: { text: "En Cours", color: "blue" },
          resolved: { text: "Résolu", color: "green" },
          closed: { text: "Fermé", color: "gray" },
        };
        const current = statusMap[status] || { text: status, color: "default" };
        return (
          <Tag color={current.color} className="capitalize">
            {current.text}
          </Tag>
        );
      },
    },
    {
      title: "Priorité",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        const priorityMap = {
          high: { text: "Élevée", color: "red" },
          medium: { text: "Moyenne", color: "orange" },
          low: { text: "Faible", color: "green" },
        };
        const current = priorityMap[priority] || { text: priority, color: "default" };
        return <Tag color={current.color}>{current.text}</Tag>;
      },
    },
    {
      title: "Créé Par",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (createdBy) => (
        <div>
          <div className="font-medium">{createdBy?.name || "Inconnu"}</div>
          <Tag color={createdBy?.role === "admin" ? "blue" : "green"}>
            {createdBy?.role === "admin" ? "Administrateur" : "Commercial"}
          </Tag>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/reclamations/${record._id}`)}
          />
          {userRole === "admin" && record.status !== "closed" && (
            <Select
              defaultValue={record.status}
              onChange={(value) => handleStatusChange(record._id, value)}
              style={{ width: 120 }}
            >
              <Option value="open">Ouvert</Option>
              <Option value="in_progress">En Cours</Option>
              <Option value="resolved">Résolu</Option>
              <Option value="closed">Fermé</Option>
            </Select>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Gestion des Réclamations</h1>
            <Badge count={tickets.length} showZero color="#1890ff">
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                Nouvelle Réclamation
              </Button>
            </Badge>
          </div>
        }
        bordered={false}
      >
        <div className="mb-4 flex justify-between">
          <Input
            placeholder="Rechercher une réclamation..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </div>

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
          dataSource={filteredTickets}
          loading={loading}
          rowKey="_id"
          scroll={{ x: 1300 }}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50"],
            showTotal: (total) => `Total: ${total} réclamations`,
          }}
        />
      </Card>

      <Modal
        title={<span className="font-bold">Nouvelle Réclamation</span>}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} onFinish={handleCreateTicket} layout="vertical">
          <Form.Item 
            name="title" 
            label="Titre" 
            rules={[{ required: true, message: "Veuillez saisir un titre" }]}
          >
            <Input placeholder="Saisissez le titre de la réclamation" />
          </Form.Item>
          
          {/* <Form.Item 
            name="client" 
            label="Client" 
            rules={[{ required: true, message: "Veuillez sélectionner un client" }]}
          >
            <Select 
              showSearch 
              placeholder="Sélectionnez un client"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {clients.map((client) => (
                <Option key={client._id} value={client._id}>
                  {client.nom || "Client sans nom"} - {client.phone || "Pas de téléphone"}
                </Option>
              ))}
            </Select>
          </Form.Item> */}
                    <Form.Item name="client" label="Client" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
             {clients.map((client) => (
                <Option key={client._id} value={client._id}>
                  {client.nom || "Unnamed Client"} -{" "}
                  {client.phone || "No phone"}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item 
            name="priority" 
            label="Priorité" 
            initialValue="medium"
          >
            <Select>
              <Option value="low">Faible</Option>
              <Option value="medium">Moyenne</Option>
              <Option value="high">Élevée</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Veuillez saisir une description" }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Décrivez la réclamation en détail..." 
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Annuler
              </Button>
              <Button type="primary" htmlType="submit">
                Enregistrer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Reclamations;
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import {
//   Card,
//   Tag,
//   Button,
//   Descriptions,
//   Divider,
//   List,
//   Form,
//   Input,
//   Select,
//   Space,
//   Avatar,
//   Popconfirm,
//   message,
//   Badge,
//   Timeline,
//   Collapse,
// } from "antd";
// import {
//   ArrowLeftOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   MessageOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   CloseCircleOutlined,
//   UserOutlined,
// } from "@ant-design/icons";
// import axios from "axios";
// import moment from "moment";
// import "moment/locale/fr";
// import { jwtDecode } from "jwt-decode";
// const { Option } = Select;
// const { Panel } = Collapse;

// const TicketDetail = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [ticket, setTicket] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [commentText, setCommentText] = useState("");
//   const [updatingStatus, setUpdatingStatus] = useState(false);
//    const [userRole, setUserRole] = useState('');
//   const [form] = Form.useForm();
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         setUserRole(decoded.role);
//       } catch (error) {
//         console.error("Error decoding token:", error);
//       }
//     }
//   }, []);
//   // Fetch ticket details
//   useEffect(() => {
//     const fetchTicket = async () => {
//       try {
//         const response = await axios.get(`/tickets/${id}`);
//         setTicket(response.data);
//       } catch (error) {
//         message.error("Failed to fetch ticket details");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchTicket();
//   }, [id]);

//   // Handle status change
//   const handleStatusChange = async (status) => {
//     setUpdatingStatus(true);
//     try {
//       const response = await axios.put(`/tickets/${id}`, { status });
//       setTicket(response.data);
//       message.success("Status updated successfully");
//     } catch (error) {
//       message.error("Failed to update status");
//     } finally {
//       setUpdatingStatus(false);
//     }
//   };

//   // Delete ticket
//   const handleDeleteTicket = async () => {
//     try {
//       await axios.delete(`/tickets/${id}`);
//       message.success("Ticket deleted successfully");
//       navigate("/tickets");
//     } catch (error) {
//       message.error("Failed to delete ticket");
//     }
//   };

//   // Status tag component
//   const StatusTag = ({ status }) => {
//     const statusMap = {
//       open: { color: "orange", icon: <ClockCircleOutlined />, text: "Open" },
//       in_progress: {
//         color: "blue",
//         icon: <ClockCircleOutlined />,
//         text: "In Progress",
//       },
//       resolved: {
//         color: "green",
//         icon: <CheckCircleOutlined />,
//         text: "Resolved",
//       },
//       closed: { color: "gray", icon: <CloseCircleOutlined />, text: "Closed" },
//     };

//     return (
//       <Tag
//         icon={statusMap[status]?.icon}
//         color={statusMap[status]?.color}
//         style={{ fontWeight: "bold" }}
//       >
//         {statusMap[status]?.text}
//       </Tag>
//     );
//   };

//   // Priority badge component
//   const PriorityBadge = ({ priority }) => {
//     const priorityMap = {
//       high: { color: "red", text: "High" },
//       medium: { color: "orange", text: "Medium" },
//       low: { color: "green", text: "Low" },
//     };

//     return (
//       <Badge
//         color={priorityMap[priority]?.color}
//         text={priorityMap[priority]?.text}
//         style={{ fontWeight: "bold" }}
//       />
//     );
//   };

//   if (loading) {
//     return (
//       <div className="container mx-auto p-6">Loading ticket details...</div>
//     );
//   }

//   if (!ticket) {
//     return <div className="container mx-auto p-6">Ticket not found</div>;
//   }

//   return (
//     <div className="container mx-auto p-4 md:p-6">
//       <Button
//         type="text"
//         icon={<ArrowLeftOutlined />}
//         onClick={() => navigate(-1)}
//         className="mb-4"
//       >
//         Retour aux réclamations
//       </Button>

//       <Card
//         title={`Ticket #${ticket._id.slice(-6).toUpperCase()}`}
//         loading={loading}
//         extra={
//           <Space>
//             {userRole === "Admin" && (
//               <Popconfirm
//                 title="Êtes-vous sûr de vouloir supprimer ce ticket ?"
//                 onConfirm={handleDeleteTicket}
//                 okText="Oui"
//                 cancelText="Non"
//               >
//                 <Button danger icon={<DeleteOutlined />}>
//                   Supprimer
//                 </Button>
//               </Popconfirm>
//             )}
//           </Space>
//         }
//         className="shadow-lg"
//       >
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left Column - Ticket Details */}
//           <div className="lg:col-span-2">
//             <Descriptions bordered column={1}>
//               <Descriptions.Item label="Title">
//                 <span className="font-semibold">{ticket.title}</span>
//               </Descriptions.Item>
//               <Descriptions.Item label="Description">
//                 {ticket.description}
//               </Descriptions.Item>
//               <Descriptions.Item label="Status">
//                 <StatusTag status={ticket.status} />
//                 <Select
//                   value={ticket.status}
//                   onChange={handleStatusChange}
//                   loading={updatingStatus}
//                   style={{ width: 150, marginLeft: 10 }}
//                 >
//                   <Option value="open">Open</Option>
//                   <Option value="in_progress">In Progress</Option>
//                   <Option value="resolved">Resolved</Option>
//                   <Option value="closed">Closed</Option>
//                 </Select>
//               </Descriptions.Item>
//               <Descriptions.Item label="Priority">
//                 <PriorityBadge priority={ticket.priority} />
//               </Descriptions.Item>
//               <Descriptions.Item label="Created At">
//                 {moment(ticket.createdAt).format("LLL")}
//               </Descriptions.Item>
//               {ticket.closedAt && (
//                 <Descriptions.Item label="Closed At">
//                   {moment(ticket.closedAt).format("LLL")}
//                 </Descriptions.Item>
//               )}
//             </Descriptions>

//           </div>

//           {/* Right Column - Activity */}
//           <div>
//             <Card title="Activity Timeline" className="mb-6">
//               <Timeline mode="left">
//                 <Timeline.Item
//                   color="green"
//                   label={moment(ticket.createdAt).format("LLL")}
//                 >
//                   Ticket created by {ticket.createdBy?.name || "System"}
//                 </Timeline.Item>

//                 {ticket.comments?.map((comment, index) => (
//                   <Timeline.Item
//                     key={index}
//                     color="blue"
//                     label={moment(comment.createdAt).format("LLL")}
//                   >
//                     <strong>{comment.postedBy?.name || "Unknown"}</strong> added
//                     a comment
//                   </Timeline.Item>
//                 ))}

//                 {ticket.closedAt && (
//                   <Timeline.Item
//                     color="red"
//                     label={moment(ticket.closedAt).format("LLL")}
//                   >
//                     Ticket closed by {ticket.closedBy?.name || "System"}
//                   </Timeline.Item>
//                 )}
//               </Timeline>
//             </Card>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );
// };

// export default TicketDetail;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Tag,
  Button,
  Descriptions,
  Divider,
  Form,
  Input,
  Select,
  Space,
  Avatar,
  Popconfirm,
  message,
  Badge,
  Timeline,
  Collapse,
  Tabs,
  Tooltip,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import "moment/locale/fr";
import { jwtDecode } from "jwt-decode";

const { Option } = Select;
const { Panel } = Collapse;
const { TabPane } = Tabs;
const { Text } = Typography;

moment.locale("fr");

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [form] = Form.useForm();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role); // This will set the userRole state
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await axios.get(`/tickets/${id}`);
        setTicket(response.data);
      } catch (error) {
        message.error("Échec du chargement des détails du ticket");
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  const handleStatusChange = async (status) => {
    setUpdatingStatus(true);
    try {
      // const response = await axios.put(`/tickets/${id}`, { status });
      const response = await axios.put(
        `/tickets/${id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setTicket(response.data);
      message.success("Statut mis à jour avec succès");
    } catch (error) {
      message.error("Échec de la mise à jour du statut");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteTicket = async () => {
    try {
      await axios.delete(`/tickets/${id}`);
      message.success("Ticket supprimé avec succès");
      navigate("/tickets");
    } catch (error) {
      message.error("Échec de la suppression du ticket");
    }
  };

  const StatusTag = ({ status }) => {
    const statusMap = {
      open: { color: "orange", icon: <ClockCircleOutlined />, text: "Ouvert" },
      in_progress: {
        color: "blue",
        icon: <ClockCircleOutlined />,
        text: "En Cours",
      },
      resolved: {
        color: "green",
        icon: <CheckCircleOutlined />,
        text: "Résolu",
      },
      closed: { color: "gray", icon: <CloseCircleOutlined />, text: "Fermé" },
    };

    return (
      <Tag
        icon={statusMap[status]?.icon}
        color={statusMap[status]?.color}
        style={{ fontWeight: "bold", textTransform: "uppercase" }}
      >
        {statusMap[status]?.text}
      </Tag>
    );
  };

  const PriorityBadge = ({ priority }) => {
    const priorityMap = {
      high: { color: "red", text: "Élevée" },
      medium: { color: "orange", text: "Moyenne" },
      low: { color: "green", text: "Faible" },
    };

    return (
      <Badge
        color={priorityMap[priority]?.color}
        text={
          <span style={{ fontWeight: "bold" }}>
            {priorityMap[priority]?.text}
          </span>
        }
      />
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        Chargement des détails du ticket...
      </div>
    );
  }

  if (!ticket) {
    return <div className="container mx-auto p-6">Ticket non trouvé</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        Retour aux réclamations
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Réclamation #{ticket._id.slice(-6).toUpperCase()}
          </h1>
          <div className="flex items-center mt-2">
            <StatusTag status={ticket.status} />
            <PriorityBadge priority={ticket.priority} className="ml-2" />
          </div>
        </div>
        {userRole === "Admin" && (
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce ticket ?"
            onConfirm={handleDeleteTicket}
            okText="Oui"
            cancelText="Non"
          >
            <Button danger icon={<DeleteOutlined />}>
              Supprimer
            </Button>
          </Popconfirm>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        className="custom-tabs"
      >
        <TabPane
          tab={
            <span>
              <FileTextOutlined />
              Détails
            </span>
          }
          key="details"
        >
          <Card className="shadow-sm mb-6">
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item
                label={<span className="font-semibold">Titre</span>}
              >
                <Text strong>{ticket.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span className="font-semibold">Description</span>}
              >
                {ticket.description}
              </Descriptions.Item>
              {/* <Descriptions.Item
                label={<span className="font-semibold">Statut</span>}
              >
                <Space>
                  <StatusTag status={ticket.status} />
                  {["Admin", "Manager"].includes(userRole) && (
                    <Select
                      value={ticket.status}
                      onChange={handleStatusChange}
                      loading={updatingStatus}
                      style={{ width: 150 }}
                    >
                      <Option value="open">Ouvert</Option>
                      <Option value="in_progress">En Cours</Option>
                      <Option value="resolved">Résolu</Option>
                      <Option value="closed">Fermé</Option>
                    </Select>
                  )}
                </Space>
              </Descriptions.Item> */}
              <Descriptions.Item label={<span className="font-semibold">Statut</span>}>
  <Space>
    <StatusTag status={ticket.status} />
    {["Admin", "Manager"].includes(userRole) ? (
      <Select
        value={ticket.status}
        onChange={handleStatusChange}
        loading={updatingStatus}
        style={{ width: 150 }}
      >
        <Option value="open">Ouvert</Option>
        <Option value="in_progress">En Cours</Option>
        <Option value="resolved">Résolu</Option>
        <Option value="closed">Fermé</Option>
      </Select>
    ) : (
      <Select
        value={ticket.status}
        onChange={handleStatusChange}
        loading={updatingStatus}
        style={{ width: 150 }}
      >
        <Option value="open">Ouvert</Option>
        <Option value="in_progress">En Cours</Option>
        <Option value="resolved">Résolu</Option>
      </Select>
    )}
  </Space>
</Descriptions.Item>
              <Descriptions.Item
                label={<span className="font-semibold">Priorité</span>}
              >
                <PriorityBadge priority={ticket.priority} />
              </Descriptions.Item>
              <Descriptions.Item
                label={<span className="font-semibold">Créé le</span>}
              >
                {moment(ticket.createdAt).format("LLL")}
              </Descriptions.Item>
              <Descriptions.Item
                label={<span className="font-semibold">Créé par</span>}
              >
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {ticket.createdBy?.name || "Système"}
                </Space>
              </Descriptions.Item>

              {/* {ticket.closedAt && (
                <>
                  <Descriptions.Item
                    label={<span className="font-semibold">Fermé le</span>}
                  >
                    {moment(ticket.closedAt).format("LLL")}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={<span className="font-semibold">Fermé par</span>}
                  >
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      {ticket.closedBy?.name}
                    </Space>
                  </Descriptions.Item>
                </>
              )} */}
               {ticket.status === 'closed' ? (
      <>
        <Descriptions.Item label={<span className="font-semibold">Fermé le</span>}>
          {ticket.closedAt ? moment(ticket.closedAt).format("LLL") : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label={<span className="font-semibold">Fermé par</span>}>
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            {ticket.closedBy?.name}
          </Space>
        </Descriptions.Item>
      </>
    ) : ticket.status === 'resolved' ? (
      <Descriptions.Item label={<span className="font-semibold">Résolu le</span>}>
        {moment(ticket.updatedAt).format("LLL")}
      </Descriptions.Item>
    ) : (
      <Descriptions.Item label={<span className="font-semibold">Dernière mise à jour</span>}>
        {moment(ticket.updatedAt).format("LLL")}
      </Descriptions.Item>
    )}

            </Descriptions>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TicketDetail;

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate, Link, useParams } from "react-router-dom";
import "tailwindcss/tailwind.css";
import { Spin, Alert } from "antd";

const { Option } = Select;

const AffectuerLead = () => {
  const [chatData, setChatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commercials, setCommercials] = useState([]);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [isUnassignModalVisible, setIsUnassignModalVisible] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [unassignForm] = Form.useForm();
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);

 

  const handlePageChange = (value) => {
    setCurrentPage(value);
  };
  const totalPages = Math.ceil(chatData.length / pageSize);


// useEffect(() => {
//     const getUserData = async () => {
//       try {
//         const response = await axios.get("/data");
//         console.log("Fetched data leads:", response.data);
//         console.log("Fetched leads:", response.data.chatData); 
//         setChatData(response.data.chatData);
//       } catch (err) {
//         console.error("Failed to fetch data:", err);
//         setError("Failed to fetch data");
//       } finally {
//         setLoading(false);
//       }
//     };
//     getUserData();
//   }, []);
useEffect(() => {
  const getUserData = async () => {
    try {
      const response = await axios.get("/data");
      console.log("Fetched data leads:", response.data);
      console.log("Fetched leads:", response.data.chatData); 
      
      // Sort data by creation date (newest first)
      const sortedData = response.data.chatData.sort((a, b) => {
        // Try different possible date fields, fallback to _id
        const dateA = a.createdAt || a.updatedAt || a.date || a._id;
        const dateB = b.createdAt || b.updatedAt || b.date || b._id;
        return new Date(dateB) - new Date(dateA);
      });
      
      setChatData(sortedData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };
  getUserData();
}, []);
useEffect(() => {
  const getUserData = async () => {
    try {
      const response = await axios.get("/data");
      console.log("Fetched data leads:", response.data);
      console.log("Fetched leads:", response.data.chatData); 

      if (response.data && response.data.chatData) {
        // Filter chatData to get "all" or "nouveau" types
        const filteredData = response.data.chatData.filter(chat => chat.type === "all" || chat.type === "nouveau");

        // Check if any of the filtered data contains the 'commercial' field
        const commercialExists = filteredData.some(chat => chat.commercial);

        if (commercialExists) {
          setChatData(filteredData); // Set filtered data if 'commercial' doesn't exist
          console.log("Fetched leads (without commercial):", filteredData);
        } else {
          // If 'commercial' exists, do something else if needed (e.g., handle that case)
          console.log("Commercial data exists, handle accordingly");
        }
      } else {
        setChatData([]); // Fallback to an empty array if chatData is missing
        console.error("chatData is missing in the response");
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  getUserData();
}, []);

  // useEffect(() => {
//     const getUserData = async () => {
//       try {
//         const response = await axios.get("/data");
//         console.log("Fetched data leads:", response.data);
//         console.log("Fetched leads:", response.data.chatData); 
//         if (response.data && response.data.chatData) {
//           const filteredData = response.data.chatData.filter(chat => chat.type === "all" || chat.type === "nouveau");
//           setChatData(filteredData);
//           console.log("Fetched leads:", filteredData);
//         } else {
//           setChatData([]); // Fallback to an empty array
//           console.error("chatData is missing in the response");
//         }
//       } catch (err) {
//         console.error("Failed to fetch data:", err);
//         setError("Failed to fetch data");
//       } finally {
//         setLoading(false);
//       }
//     };
//     getUserData();
//   }, []);
  useEffect(() => {
    fetchCommercials();
  }, []);

  const handleColumnSearch = async (e, columnKey) => {
    const value = e.target.value.toLowerCase().trim();
    setSearchQuery(value);
  
    try {
      // If search value is empty, show all data
      if (value === '') {
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

 
  const handleAssign = async (values) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("No token found, please login first");
        return;
      }

      await axios.post(
        "/assign-leads",
        {
          id: selectedLeads,
          commercialId: values.commercial,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    const updatedLeads = chatData.map((lead) => {
        if (selectedLeads.includes(lead._id)) {
          return {
            ...lead,
            commercial: commercials.find(com => com._id === values.commercial),
          };
        }
        return lead; // Fix here, it was returning `chatData`
      });
      setChatData(updatedLeads);
      message.success("Leads assigned to commercial successfully");
      setIsAssignModalVisible(false);
      setSelectedLeads([]);
    } catch (error) {
      console.error("Error assigning leads:", error);
      message.error("Failed to assign leads");
    }
  };
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

  const handleUnassign = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("No token found, please login first");
        return;
      }
      await axios.post(
        "/unassign-leads",
        {
          id: selectedLeads,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedLeads = chatData.map((lead) => {
        if (selectedLeads.includes(lead._id)) {
          return {
            ...lead,
            commercial: null,
          };
        }
        return lead;
      });
      setChatData(updatedLeads);
      message.success("Leads unassigned from commercial successfully");
      setIsUnassignModalVisible(false);
      setSelectedLeads([]);
    } catch (error) {
      console.error("Error unassigning leads:", error);
      message.error("Failed to unassign leads");
    }
  };

  if (loading && showSpinner) return <Spin tip="Loading..." />;

  if (error)
    return <Alert message="Error" description={error} type="error" showIcon />;
  
  const columns = [
    // {
    //   title: "Prénom",
    //   key: "request_lastname",
    //   dataIndex: "request_lastname",
    //   render: (text, record) => (
    //     <div
    //       className="cursor-pointer"
    //       onClick={() => handleLeadClick(record)}
    //     >
    //       <div>{record.request_lastname || "-"}</div>
         
    //     </div>
    //   ),
    // },
    // {
    //   title: "Nom",
    //   key: "request_name",
    //   dataIndex: "request_name",
    //   render: (text, record) => (
    //     <div
    //       className="cursor-pointer"
    //       onClick={() => handleLeadClick(record)}
    //     >
    //       <div>{record.request_name || "-"}</div>
         
    //     </div>
    //   ),
    // },
    {
      title: "Prénom et Nom", // Changed title to "Prenom and Nom"
      key: "nom",
      dataIndex: "nom",
      render: (text, record) => (
        <div className="cursor-pointer" onClick={() => handleLeadClick(record)}>
          <div>{`${record.nom || ""}`}</div>
        </div>
      ),
    },
 
    {
      title: "Email",
      key: "email" || "email1",
      dataIndex: "email" || "email1",
      render: (text, record) => (
        <div
          className="cursor-pointer"
          onClick={() => handleLeadClick(record)}
        >
         <div className="text-gray-500 text-xs">
            {record.verification_email === "Non"
              ? record.email1 || ""
              : record.email || ""}
          </div>
         
        </div>
      ),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: (text) => text || ""
    },
    {
      title: "code postal",
      dataIndex: "codepostal",
      key: "codepostal",
      render: (text) => text || ""
    },
    {
      title: "Ville",
      dataIndex: "ville",
      key: "ville",
      render: (text) => text || ""
    },
    {
      title: "DATE",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => {
        if (!date) return "-";
        const formattedDate = new Date(date);
        const day = formattedDate.toLocaleDateString("en-GB");
        const time = formattedDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return (
          <div
            className="cursor-pointer"
            onClick={() => handleLeadClick(record)}
          >
            <div>{day}</div>
            <div className="text-gray-500 text-sm">{time}</div>
          </div>
        );
      },
    },
    {
      title: "TELEPHONE",
      dataIndex: "phone",
      key: "phone",
      render: (text) => text || ""
    },
    {
      title: "STATUS LEAD",
      dataIndex: "type",  // This ensures the column can be sorted by the original value
      key: "statusLead",
      render: (type) => (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
          type === "client" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
        }`}>
          {type === "client" ? "Client" : "Prospect"}
        </span>
      ),
    },
    {
      title: "Siret",
      dataIndex: "siret",
      key: "siret",
      render: (text, record) => (
        <div className="text-gray-500 text-xs">
          {record.siret ||
            ""}
        </div>
      ),
    },
    // {
    //   title: "Nom de société",
    //   dataIndex: "nom_societé",
    //   key: "nom_societé",
    //   render: (text, record) => (
    //     <div className="text-gray-500 text-xs">
    //       {record.nom_societé ||
    //         ""}
    //     </div>
    //   ),
    // },
    {
      title: "Commentaire",
      dataIndex: "commentaire",
      key: "commentaire",
      render: (text, record) => (
        <div className="text-gray-500 text-xs">
          {record.commentaire ||
            ""}
        </div>
      ),
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


  const rowSelection = {
    onChange: (selectedRowKeys) => {
      setSelectedLeads(selectedRowKeys);
    },
    selectedRowKeys: selectedLeads,
  };
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`/lead/${id}`);

      console.log("Chat deleted successfully:", response.data);
      setChatData(chatData.filter((lead) => lead._id !== id));
      message.success("Coach deleted successfully");
    } catch (error) {
      console.error("Error deleting coach:", error);
      message.error("Failed to delete coach");
    }
  };
  

  return (
    <div className="md:p-4 p-1 w-full">
      <h1 className="text-xl font-bold mb-4">Affectation des Leads</h1>
    
      <div className="flex-1 space-y-4 justify-between mb-4">
        <div className="flex md:flex-row md:space-y-0 flex-col space-y-4">
          <Button type="" className="bg-purple-800 text-white" onClick={() => setIsAssignModalVisible(true)}>
            Affecter les Leads au Commercial
          </Button>
          <Button
            type=""
            onClick={() => setIsUnassignModalVisible(true)}
            className="bg-purple-800 text-white lg:ml-2"
          >
            Désaffecter les leads du Commercial
          </Button>
        </div>
      </div>
      <div className="mb-4 p-4 flex items-center rounded-md gap-4">
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

        
      </div>
      <div className="mb-4">
        <span className="font-semibold text-gray-700">
          Total Leads: {filteredData.length}
        </span>
      </div>
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 overflow-x-auto">
      <Table
         dataSource={filteredData.length ? filteredData : chatData}
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
                    className="mt-2"
                    size="medium"
                    style={{ width: "120%" }}
                    placeholderStyle={{ fontSize: "2px" }}
             
                  />
                )}
              </div>
            ),
          })),
        ]}
        rowKey={(record) => record._id}
        // pagination={false}
        pagination={{
          current: currentPage,
          pageSize,
          total: chatData.length,
          onChange: (page) => setCurrentPage(page),
        }}
        bordered
        rowSelection={rowSelection}
        className="custom-table text-xs sm:text-sm"
        tableLayout="auto"
      />
</div>
      <Modal
        title="Affecter les leads au Commercial"
        visible={isAssignModalVisible}
        onCancel={() => setIsAssignModalVisible(false)}
        footer={null}
      >
        <Form form={assignForm} onFinish={handleAssign}>
          <Form.Item
            name="commercial"
            label="Commercial"
            rules={[
              {
                required: true,
                message: "Veuillez sélectionner un commercial",
              },
            ]}
          >
            <Select placeholder="Sélectionnez un commercial">
              {commercials.map((commercial) => (
                <Option key={commercial._id} value={commercial._id}>
                  {commercial.nom} {commercial.prenom}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Affecter
            </Button>
            <Button
              onClick={() => setIsAssignModalVisible(false)}
              className="ml-2"
            >
              Annuler
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Désaffecter les Leads du Commercial"
        visible={isUnassignModalVisible}
        onCancel={() => setIsUnassignModalVisible(false)}
        footer={null}
      >
        <Form form={unassignForm} onFinish={handleUnassign}>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Désaffecter
            </Button>
            <Button
              onClick={() => setIsUnassignModalVisible(false)}
              className="ml-2"
            >
              Annuler
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AffectuerLead;

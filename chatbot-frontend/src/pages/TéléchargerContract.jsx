import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  message,
  Modal,
  Card,
  Statistic,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import moment from "moment";


const { confirm } = Modal;

const AllCommands = () => {
  const [allCommands, setAllCommands] = useState([]);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHT: 0,
    totalTTC: 0,
    totalCommands: 0,
  });
  const token = localStorage.getItem("token");
  const decodedUser = token ? jwtDecode(token) : null;
  const userLoged = decodedUser?.userId;
  const userRole = decodedUser?.role;

  useEffect(() => {
    fetchCommands();
  }, []);


  const fetchCommands = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get("/command", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API Response:", response);
      const commandsData = response?.data;
      const decodedToken = token ? jwtDecode(token) : null;
      const currentUserId = decodedToken?.userId;
      const role = decodedToken.role
      if (role === "Admin") {
        const filterecommand = commandsData

      // Filter commands to display only "devis" type
      const devisCommands = filterecommand.filter(
        (command) => command.command_type === "commande"
      );
        setAllCommands(devisCommands); // Set only the "devis" commands
        updateStatistics(devisCommands);
      } else {
        const filterecommand = commandsData.filter(
          (cmd) => cmd.session === currentUserId
        );

      // Filter commands to display only "devis" type
      const devisCommands = filterecommand.filter(
        (command) => command.command_type === "commande"
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

  const handleEdit = (e) => {
    e.stopPropagation();
    window.location.href = `/lead/${record.lead}`;
  };

 

  const handleDelete = (id, e) => {
    e.stopPropagation();
    confirm({
      title: "Confirm Deletion",
      icon: <ExclamationCircleOutlined />,
      content: "Are you sure you want to delete this command?",
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
      message.success("Command deleted successfully");
      fetchCommands(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting command:", error);
      message.error("Failed to delete command");
    }
  };

  const safeRender = (value, fallback = "N/A") => {
    return value !== undefined && value !== null ? value : fallback;
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
      title: "Command",
      dataIndex: "numCommand",
      key: "numCommand",
      render: (text) => safeRender(text),
      sorter: (a, b) => (a.numCommand || "").localeCompare(b.numCommand || ""),
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
                    {item.reference} <span className="font-bold">(x{item.quantite})</span>
                  </Tag>
                );
              })}
            </div>
          ) : record.reference ? (
            <Tag color={stringToColor(record.reference)} className="text-xs font-medium">
            {record.reference} <span className="font-bold">(x{record.quantite})</span>
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
   
    {
      title: "Quantité",
      dataIndex: "quantite",
      key: "quantite",
      render: (text) => `${safeRender(text, "0")}`,
      // sorter: (a, b) => (a.quantite || 0) - (b.quantite || 0),
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
    //   title: "Marge",
    //   dataIndex: "marge",
    //   key: "marge",
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
              {record.items?.some(item => item.forfait) && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {record.items
                    .filter(item => item.forfait)
                    .map((item, index) => (
                      <Tag
                        key={`forfait-${index}`}
                        color="#f50"
                        className="text-xs font-medium"
                      >
                        Forfait: {parseFloat(item.forfait || 0).toFixed(2)} €
                        {item.quantite > 1 && (
                          <span className="font-bold ml-1">(x{item.quantite})</span>
                        )}
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
          render: (text, record) => (
            <div className="text-right">
              <div>{`${safeRender(text, "0")} €`}</div>
              {record.items?.length > 0 ? (
                <div className="text-xs text-gray-500">
                  {record.items.map(item => item.montantHT + '€').join(' + ')}
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  {safeRender(text, "0")} € 
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
              {record.items?.length > 0 ? (
                <div className="text-xs text-gray-500">
                  {record.items.map(item => item.montantTVA + '€').join(' + ')}
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  {safeRender(text, "0")} € 
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
              {record.items?.length > 0 ? (
                <div className="text-xs text-gray-500">
                  {record.items.map(item => item.montantTTC + '€').join(' + ')}
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  {safeRender(text, "0")} € 
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
          {/* <Button
            icon={<FilePdfOutlined />}
            onClick={(e) => handleDownload(record._id, e)}
          /> */}
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => handleDelete(record._id, e)}
          />
        </Space>
      ),
    },
  ];


  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Contrat Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <Statistic title="Total Contrats" value={stats.totalCommands} />
        </Card>
        <Card>
          <Statistic title="Total HT" value={stats.totalHT} suffix="€" />
        </Card>
        <Card>
          <Statistic title="Total TTC" value={stats.totalTTC} suffix="€" />
        </Card>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {userRole === "commercial" ? "Mes contrats" : "Les contrats"}
          </h2>
          {/* <Button 
            type="primary" 
            onClick={() => window.location.href = '/command/new'}
          >
            Create New Command
          </Button> */}
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
          dataSource={allCommands}
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
    </div>
  );
};

export default AllCommands;

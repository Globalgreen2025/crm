// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import {message, Button } from "antd";
// import { PlusOutlined, DeleteOutlined, EditOutlined, DollarOutlined } from "@ant-design/icons";
// import { Link, useNavigate } from "react-router-dom";

// const Programmes = () => {
//   const [program, setProgram] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchBanners = async () => {
//       try {
//         const response = await axios.get("/produit");
//         setProgram(response.data);
//       } catch (error) {
//         message.error("Failed to fetch programmes.");
//         console.error(error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBanners();
//   }, []);

//   const handleCreateNewBanner = () => {
//     navigate("/create-produit");
//   };

//   const handleDeleteBanner = async (programId) => {
//     try {
//       await axios.delete(`/program/${programId}`);
//       const updatedBanners = program.filter((program) => program._id !== programId);
//       setProgram(updatedBanners);
//       message.success("Produit supprimé avec succès !");
//     } catch (error) {
//       message.error("Failed to delete Programme.");
//       console.error(error);
//     }
//   };

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="p-4">
//       <div className="mb-6">
//         <Button
//           type="primary"
//           icon={<PlusOutlined />}
//           className="bg-purple-800 text-white"
//           onClick={handleCreateNewBanner}
//         >
//           Ajouter produit
//         </Button>
//       </div>

//       <h1 className="text-2xl font-bold mb-4">Produits</h1>

//       <div className="program-container">
//   {program.map((pro) => (
//     <div key={pro._id} className="program-card">
//       {/* <img
//         src={pro.imageUrl}
//         alt={pro.title}
//         className="program-card-image"
//       /> */}
//       <div className="program-card-content">
//         <h2 className="program-title">{pro.title}</h2>
//         <p className="program-description">{pro.mainText}</p>
//         <p className="program-price flex items-center">
//                 <DollarOutlined className="mr-2" /> {/* Dollar icon */}
//                 <span className="font-bold">{pro.total}€</span> {/* Display total price in bold */}
//               </p>
//       </div>
//       <div className="program-card-actions">
//         <Link to={`/create-produit/${pro._id}`}>
//           <Button icon={<EditOutlined />} type="primary" />
//         </Link>
//         <Button
//           icon={<DeleteOutlined />}
//           type="danger"
//           onClick={() => handleDeleteBanner(pro._id)}
//         />
//       </div>
//     </div>
//   ))}
// </div>

//     </div>
//   );
// };

// export default Programmes;




import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Tag, message, Space } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

const Programmes = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("/produit");
        setProducts(response.data);
      } catch (error) {
        message.error("Failed to fetch products.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCreateNewProduct = () => {
    navigate("/create-produit");
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`/produit/${productId}`);
      setProducts(products.filter(product => product._id !== productId));
      message.success("Produit supprimé avec succès !");
    } catch (error) {
      message.error("Failed to delete product.");
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Catégorie',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue" key={category}>
          {category}
        </Tag>
      ),
    },
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
    },
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => (
        <div style={{ 
          whiteSpace: 'pre-line',
          maxHeight: '100px',
          padding: '8px 0'
        }}>
          {text}
        </div>
      ),
    },
    {
      title: 'TVA',
      dataIndex: 'tva',
      key: 'tva',
      render: (tva) => `${tva}%`,
      align: 'right',
    },
    {
      title: 'Date création',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/create-produit/${record._id}`}>
            <Button icon={<EditOutlined />} type="primary" />
          </Link>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteProduct(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Produits</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="bg-purple-800 text-white"
          onClick={handleCreateNewProduct}
        >
          Ajouter produit
        </Button>
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
        dataSource={products}
        rowKey="_id"
        loading={loading}
        bordered
        scroll={{ x: true }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          // showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} produits`,
        }}
      />
    </div>
  );
};

export default Programmes;
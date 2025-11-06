// import React, { useState, useEffect } from 'react';
// import { Table, Button, Modal, Form, Input, Upload, message, Space, Tag, Popconfirm, List } from 'antd';
// import { UploadOutlined, DeleteOutlined, PlusOutlined, InboxOutlined, FilePdfOutlined, FileImageOutlined } from '@ant-design/icons';
// import axios from 'axios';

// const { Dragger } = Upload;

// const SousTraitance = () => {
//   const [documents, setDocuments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [form] = Form.useForm();
//   const [fileList, setFileList] = useState([]);
//   const [uploading, setUploading] = useState(false);

//   // Fetch documents from backend
//   const fetchDocuments = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get('/document');
//       const data = response.data;
//       setDocuments(data);
//     } catch (error) {
//       message.error('Erreur lors du chargement des documents');
//       console.error('Error fetching documents:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDocuments();
//   }, []);

//   // Delete document
//   const handleDelete = async (id) => {
//     try {
//       const response = await axios.delete(`/document/${id}`);

//       if (response.status === 200) {
//         message.success('Sous-traitant supprimé avec succès');
//         fetchDocuments();
//       } else {
//         message.error('Erreur lors de la suppression du sous-traitant');
//       }
//     } catch (error) {
//       message.error('Erreur lors de la suppression du sous-traitant');
//       console.error('Delete error:', error);
//     }
//   };

//   // Handle file upload changes
//   const handleFileChange = ({ fileList: newFileList }) => {
//     setFileList(newFileList);
//   };

//   // Custom file validation before upload
//   const beforeUpload = (file) => {
//     const isPdfOrImage = file.type === 'application/pdf' || 
//                          file.type.startsWith('image/');
//     if (!isPdfOrImage) {
//       message.error('Vous ne pouvez uploader que des fichiers PDF ou images (JPG, PNG, GIF)!');
//       return Upload.LIST_IGNORE;
//     }

//     const isLt10M = file.size / 1024 / 1024 < 10;
//     if (!isLt10M) {
//       message.error('Le fichier doit être plus petit que 10MB!');
//       return Upload.LIST_IGNORE;
//     }

//     // Add file to the list
//     setFileList([file]);
//     return false; // Prevent auto upload
//   };

//   // Remove file
//   const handleRemove = () => {
//     setFileList([]);
//   };

//   // Add new sous-traitant with file upload
// //   const handleAddSousTraitant = async (values) => {
// //     if (fileList.length === 0) {
// //       message.error('Veuillez uploader un document');
// //       return;
// //     }

// //     setUploading(true);
// //     try {
// //       const formData = new FormData();
// //       formData.append('document', fileList[0]);
// //       console.log('File to upload:', fileList[0]);
// //       // Append company information
// //       formData.append('nom_entreprise', values.nom_entreprise);
// //       formData.append('adresse', values.adresse);
// //       formData.append('nom_dirigeant', values.nom_dirigeant);
// //       formData.append('KbIS', values.KbIS);


// //       const response = await axios.post('/document', formData, {
// //         headers: {
// //             "Content-Type": "application/json",
// //           },
// //       });
// //       console.log('Add sous-traitant response:', response);
// //       if (response.status === 200) {
// //         message.success('Sous-traitant ajouté avec succès');
// //         setModalVisible(false);
// //         form.resetFields();
// //         setFileList([]);
// //         fetchDocuments();
// //       } else {
// //         message.error('Erreur lors de l\'ajout du sous-traitant');
// //       }
// //     } catch (error) {
// //       message.error('Erreur lors de l\'ajout du sous-traitant');
// //       console.error('Add sous-traitant error:', error);
// //     } finally {
// //       setUploading(false);
// //     }
// //   };
// // Add new sous-traitant with file upload
// const handleAddSousTraitant = async (values) => {
//     // if (fileList.length === 0) {
//     //   message.error('Veuillez uploader un document');
//     //   return;
//     // }
  
//     setUploading(true);
//     try {
//       const formData = new FormData();
//       // const fileObj = fileList[0];
      
//       // // Get the actual File object from Ant Design's file object
//       // const actualFile = fileObj.originFileObj || fileObj;
      
//       // console.log('Actual file:', actualFile);
//       // console.log('Actual file is File instance:', actualFile instanceof File);
      
//       // // Append the actual File object
//       // formData.append('document', actualFile);
      
//       // Append company information
//       formData.append('nom_entreprise', values.nom_entreprise);
//       formData.append('adresse', values.adresse);
//       formData.append('nom_dirigeant', values.nom_dirigeant);
//       formData.append('KbIS', values.KbIS);
  
//       // Debug: Check FormData contents
//       // for (let [key, value] of formData.entries()) {
//       //   console.log(`FormData: ${key} =`, value, value instanceof File ? '(File)' : '(String)');
//       // }
  
//       const response = await axios.post('/document', formData, {
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });
  
//       if (response.status === 200 || response.status === 201) {
//         message.success('Sous-traitant ajouté avec succès');
//         setModalVisible(false);
//         form.resetFields();
//         // setFileList([]);
//         fetchDocuments();
//       } else {
//         message.error('Erreur lors de l\'ajout du sous-traitant');
//       }
//     } catch (error) {
//       console.error('Full error:', error);
//       console.error('Error response:', error.response?.data);
//       message.error(`Erreur lors de l'ajout du sous-traitant: ${error.response?.data?.message || error.message}`);
//     } finally {
//       setUploading(false);
//     }
//   };

//   // Get file icon based on type
//   const getFileIcon = (file) => {
//     if (file.type === 'application/pdf') {
//       return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />;
//     } else if (file.type.startsWith('image/')) {
//       return <FileImageOutlined style={{ color: '#52c41a', fontSize: '20px' }} />;
//     }
//     return <InboxOutlined style={{ fontSize: '20px' }} />;
//   };

//   // Format file size
//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   // Table columns for sous-traitants
//   const columns = [
//     {
//       title: 'Nom de l\'Entreprise',
//       dataIndex: 'nom_entreprise',
//       key: 'nom_entreprise',
//       render: (text, record) => (
//         <a href={record.url} target="_blank" rel="noopener noreferrer">
//           {text}
//         </a>
//       ),
//     },
//     {
//       title: 'Adresse',
//       dataIndex: 'adresse',
//       key: 'adresse',
//     },
//     {
//       title: 'Nom du Dirigeant',
//       dataIndex: 'nom_dirigeant',
//       key: 'nom_dirigeant',
//     },
//     {
//       title: 'KbIS',
//       dataIndex: 'KbIS',
//       key: 'KbIS',
//     },
//     // {
//     //   title: 'Document',
//     //   dataIndex: 'name',
//     //   key: 'document',
//     //   render: (name, record) => (
//     //     <Space>
//     //       <Tag color="blue">{record.type}</Tag>
//     //       <span>{name}</span>
//     //     </Space>
//     //   ),
//     // },
//     // {
//     //   title: 'Taille',
//     //   dataIndex: 'size',
//     //   key: 'size',
//     //   render: (size) => `${(size / 1024 / 1024).toFixed(2)} MB`,
//     // },
//     {
//       title: 'Date d\'Ajout',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       render: (date) => new Date(date).toLocaleDateString('fr-FR'),
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space>
//           {/* <Button
//             type="link"
//             href={record.url}
//             target="_blank"
//             size="small"
//           >
//             Voir Document
//           </Button> */}
//           <Popconfirm
//             title="Êtes-vous sûr de vouloir supprimer ce sous-traitant?"
//             onConfirm={() => handleDelete(record._id)}
//             okText="Oui"
//             cancelText="Non"
//           >
//             <Button
//               type="link"
//               danger
//               size="small"
//               icon={<DeleteOutlined />}
//             >
//               Supprimer
//             </Button>
//           </Popconfirm>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="p-6">
//       {/* Title */}
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold text-gray-800">Gestion des Sous-Traitances</h1>
//         <p className="text-gray-600">Managez vos sous-traitants</p>
//       </div>

//       {/* Content */}
//       <div className="bg-white rounded-lg shadow">
//         <div className="p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-lg font-semibold text-gray-800">Liste des Sous-Traitants</h2>
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => setModalVisible(true)}
//             >
//               Ajouter un Sous-Traitant
//             </Button>
//           </div>

//           {/* Ant Design Table */}
//           <Table
//             columns={columns}
//             dataSource={documents}
//             rowKey="_id"
//             loading={loading}
//             pagination={{ pageSize: 10 }}
//           />
//         </div>
//       </div>

//       {/* Add Sous-Traitant Modal */}
//       <Modal
//         title="Ajouter un Sous-Traitant"
//         open={modalVisible}
//         onCancel={() => {
//           setModalVisible(false);
//           form.resetFields();
//           setFileList([]);
//         }}
//         footer={null}
//         width={700}
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleAddSousTraitant}
//         >
//           {/* Company Information Section */}
//           <div className="mb-6">
//             <h3 className="text-lg font-medium text-gray-800 mb-4">Informations de l'Entreprise</h3>
//             <div className="grid grid-cols-1 gap-4">
//               <Form.Item
//                 name="nom_entreprise"
//                 label="Nom de l'Entreprise"
//                 rules={[{ required: true, message: 'Veuillez saisir le nom de l\'entreprise' }]}
//               >
//                 <Input placeholder="Nom de l'entreprise" />
//               </Form.Item>

//               <Form.Item
//                 name="adresse"
//                 label="Adresse"
//                 rules={[{ required: true, message: 'Veuillez saisir l\'adresse' }]}
//               >
//                 <Input.TextArea placeholder="Adresse complète" rows={3} />
//               </Form.Item>

//               <div className="grid grid-cols-2 gap-4">
//                 <Form.Item
//                   name="nom_dirigeant"
//                   label="Nom du Dirigeant"
//                   rules={[{ required: true, message: 'Veuillez saisir le nom du dirigeant' }]}
//                 >
//                   <Input placeholder="Nom du dirigeant" />
//                 </Form.Item>

//                 <Form.Item
//                   name="KbIS"
//                   label="KbIS"
//                   rules={[{ required: true, message: 'Veuillez saisir le numéro KbIS' }]}
//                 >
//                   <Input placeholder="Numéro KbIS" />
//                 </Form.Item>
//               </div>
//             </div>
//           </div>

//           {/* Document Upload Section */}
//           {/* <div className="mb-6">
//             <h3 className="text-lg font-medium text-gray-800 mb-4">Document du Sous-Traitant</h3>
    
//             <Dragger
//               name="document"
//               multiple={false}
//               fileList={fileList}
//               beforeUpload={beforeUpload}
//               onRemove={handleRemove}
//               onChange={handleFileChange}
//               accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
//             >
//               <p className="ant-upload-drag-icon">
//                 <InboxOutlined />
//               </p>
//               <p className="ant-upload-text">
//                 Cliquez ou glissez-déposez le fichier ici
//               </p>
//               <p className="ant-upload-hint">
//                 Support pour PDF, JPG, PNG, GIF, WEBP. Taille maximale: 10MB
//               </p>
//             </Dragger>


//             {fileList.length > 0 && (
//               <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50">
//                 <h4 className="text-sm font-medium text-green-800 mb-2">Fichier sélectionné:</h4>
//                 <div className="flex items-center space-x-3 p-2 bg-white rounded border">
//                   {getFileIcon(fileList[0])}
//                   <div className="flex-1">
//                     <p className="text-sm font-medium text-gray-800">{fileList[0].name}</p>
//                     <p className="text-xs text-gray-500">
//                       {formatFileSize(fileList[0].size)} • {fileList[0].type}
//                     </p>
//                   </div>
//                   <Button
//                     type="text"
//                     danger
//                     size="small"
//                     icon={<DeleteOutlined />}
//                     onClick={handleRemove}
//                   >
//                     Retirer
//                   </Button>
//                 </div>
//               </div>
//             )}
//           </div> */}


//           <Form.Item>
//             <div className="flex justify-end space-x-3">
//               <Button 
//                 onClick={() => {
//                   setModalVisible(false);
//                   form.resetFields();
//                   setFileList([]);
//                 }}
//                 disabled={uploading}
//               >
//                 Annuler
//               </Button>
//               <Button 
//                 type="primary" 
//                 htmlType="submit" 
//                 // loading={uploading}
//                 // disabled={fileList.length === 0}
//               >
//                 {/* {loading ? 'Ajout en cours...' : 'Ajouter le Sous-Traitant'} */}
//                 Ajouter le Sous-Traitant
//               </Button>
//             </div>
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default SousTraitance;


import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Upload, message, Space, Tag, Popconfirm, List, Rate } from 'antd';
import { UploadOutlined, DeleteOutlined, PlusOutlined, InboxOutlined, FilePdfOutlined, FileImageOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Dragger } = Upload;
const { TextArea } = Input;

const SousTraitance = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Fetch documents from backend
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/document');
      const data = response.data;
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Delete document
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`/document/${id}`);

      if (response.status === 200) {
        message.success('Sous-traitant supprimé avec succès');
        fetchDocuments();
      } else {
        message.error('Erreur lors de la suppression du sous-traitant');
      }
    } catch (error) {
      message.error('Erreur lors de la suppression du sous-traitant');
      console.error('Delete error:', error);
    }
  };

  // Add new sous-traitant
  const handleAddSousTraitant = async (values) => {
    setUploading(true);
    try {
      const formData = new FormData();
      
      // Append company information
      formData.append('nom_entreprise', values.nom_entreprise);
      formData.append('numero_siret', values.numero_siret);
      formData.append('adresse', values.adresse);
      formData.append('nom_dirigeant', values.nom_dirigeant);
      formData.append('numero_telephone', values.numero_telephone);
      formData.append('email', values.email);
      formData.append('nom_assureur', values.nom_assureur);
      formData.append('numero_assurance', values.numero_assurance);
      formData.append('note', values.note);

      const response = await axios.post('/document', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200 || response.status === 201) {
        message.success('Sous-traitant ajouté avec succès');
        setModalVisible(false);
        form.resetFields();
        fetchDocuments();
      } else {
        message.error('Erreur lors de l\'ajout du sous-traitant');
      }
    } catch (error) {
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      message.error(`Erreur lors de l'ajout du sous-traitant: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Table columns for sous-traitants
  const columns = [
    {
      title: 'Nom de l\'Entreprise',
      dataIndex: 'nom_entreprise',
      key: 'nom_entreprise',
    },
    {
      title: 'SIRET',
      dataIndex: 'numero_siret',
      key: 'numero_siret',
    },
    {
      title: 'Adresse',
      dataIndex: 'adresse',
      key: 'adresse',
    },
    {
      title: 'Dirigeant',
      dataIndex: 'nom_dirigeant',
      key: 'nom_dirigeant',
    },
    {
      title: 'Téléphone',
      dataIndex: 'numero_telephone',
      key: 'numero_telephone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Assureur',
      dataIndex: 'nom_assureur',
      key: 'nom_assureur',
    },
    {
      title: "Numéro de l'assurance",
      dataIndex: "numero_assurance",
      key: "numero_assurance"
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: 'Date d\'Ajout',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('fr-FR'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer ce sous-traitant?"
            onConfirm={() => handleDelete(record._id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Sous-Traitances</h1>
        <p className="text-gray-600">Managez vos sous-traitants</p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Liste des Sous-Traitants</h2>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              Ajouter un Sous-Traitant
            </Button>
          </div>

          {/* Ant Design Table */}
          <Table
            columns={columns}
            dataSource={documents}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
            bordered
             className="compact-table"
          />
        </div>
      </div>

      {/* Add Sous-Traitant Modal */}
      <Modal
        title="Ajouter un Sous-Traitant"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddSousTraitant}
        >
          {/* Company Information Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Informations de l'Entreprise</h3>
            <div className="grid grid-cols-1 gap-4">
              <Form.Item
                name="nom_entreprise"
                label="Nom de l'Entreprise"
                rules={[{  message: 'Veuillez saisir le nom de l\'entreprise' }]}
              >
                <Input placeholder="Nom de l'entreprise" />
              </Form.Item>

              <Form.Item
                name="numero_siret"
                label="Numéro de SIRET (KBIS)"
                rules={[
                  {  message: 'Veuillez saisir le numéro SIRET' },
                ]}
              >
                <Input placeholder="Numéro SIRET (14 chiffres)" maxLength={14} />
              </Form.Item>

              <Form.Item
                name="adresse"
                label="Adresse postale"
                rules={[{ message: 'Veuillez saisir l\'adresse' }]}
              >
                <TextArea placeholder="Adresse postale complète" rows={3} />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="nom_dirigeant"
                  label="Nom du Dirigeant"
                  rules={[{  message: 'Veuillez saisir le nom du dirigeant' }]}
                >
                  <Input placeholder="Nom du dirigeant" />
                </Form.Item>

                <Form.Item
                  name="numero_telephone"
                  label="Numéro de téléphone"
                  rules={[
                    {  message: 'Veuillez saisir le numéro de téléphone' },
                  ]}
                >
                  <Input placeholder="Numéro de téléphone" />
                </Form.Item>
              </div>

              <Form.Item
                name="email"
                label="Adresse email"
                rules={[
                  {  message: 'Veuillez saisir l\'adresse email' },
                ]}
              >
                <Input placeholder="Adresse email" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="nom_assureur"
                  label="Nom de l'assureur"
                  rules={[{  message: 'Veuillez saisir le nom de l\'assureur' }]}
                >
                  <Input placeholder="Nom de l'assureur" />
                </Form.Item>

                <Form.Item
                  name="numero_assurance"
                  label="Numéro de l'assurance"
                  rules={[{  message: 'Veuillez saisir le numéro d\'assurance' }]}
                >
                  <Input placeholder="Numéro d'assurance" />
                </Form.Item>
              </div>

              <Form.Item
                name="note"
                label="Note"
                rules={[{message: 'Veuillez attribuer une note' }]}
              >
                <TextArea placeholder="Note" rows={3} />
              </Form.Item>
            </div>
          </div>

          <Form.Item>
            <div className="flex justify-end space-x-3">
              <Button 
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setFileList([]);
                }}
                disabled={uploading}
              >
                Annuler
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={uploading}
              >
                Ajouter le Sous-Traitant
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SousTraitance;
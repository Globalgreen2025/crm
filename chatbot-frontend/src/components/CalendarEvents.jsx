// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { Table, Popconfirm, Space, Button, message } from "antd";
// import { useParams } from "react-router-dom";
// import { DeleteOutlined } from "@ant-design/icons";
// import { jwtDecode } from "jwt-decode";

// const CalendarEvents = () => {
//   const [leadsEvents, setLeadsEvents] = useState({}); // Store events grouped by lead ID
//   const { id } = useParams(); // Get leadId from URL

//   const fetchEvents = async () => {
//     const token = localStorage.getItem("token");
//     if (!token) return;
//     try {
//       const response = await axios.get(`/events/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       }); // Fetch all events
//       console.log("Fetched Events:", response.data);
//       const dataEvent = response?.data;
//       const decodedToken = token ? jwtDecode(token) : null;
//       const currentUserId = decodedToken?.userId;

//       const filterevent = dataEvent.filter(
//         (event) => event.session === currentUserId
//       );
//       // Group events by lead ID
//       const groupedEvents = filterevent.reduce((acc, event) => {
//         const leadId = event.lead;
//         if (!acc[leadId]) {
//           acc[leadId] = [];
//         }
//         acc[leadId].push({ ...event, key: event._id }); // Add key for Ant Design table
//         return acc;
//       }, {});

//       setLeadsEvents(groupedEvents);
//     } catch (error) {
//       console.error("Error fetching events:", error);
//     }
//   };

//   useEffect(() => {
//     // Fetch events initially
//     fetchEvents();

//     // Set up polling to fetch events every 5 seconds
//     const intervalId = setInterval(() => {
//       fetchEvents();
//     }, 5000);

//     return () => clearInterval(intervalId); // Cleanup interval on component unmount
//   }, [id]);

//   const handleDelete = async (id) => {
//     try {
//       const response = await axios.delete(`/event/${id}`);
//       message.success("Event deleted successfully");
//     } catch (error) {
//       console.error("Error deleting coach:", error);
//       message.error("Failed to delete coach");
//     }
//   };

//   // Define table columns
//   const columns = [
//     {
//       title: "Date",
//       dataIndex: "event_date",
//       key: "event_date",
//     },
//     {
//       title: "Heure",
//       dataIndex: "event_time",
//       key: "event_time",
//     },
//     {
//       title: "Objectif",
//       dataIndex: "objective",
//       key: "objective",
//     },
//     {
//       title: "Commentaire",
//       dataIndex: "comment",
//       key: "comment",
//     },
//     {
//       title: <span style={{ fontSize: "12px" }}>Action</span>,
//       key: "action",
//       render: (text, record) => (
//         <Space size="middle">
//           <Popconfirm
//             title="Are you sure you want to delete this coach?"
//             onConfirm={() => handleDelete(record._id)}
//             okText="Yes"
//             cancelText="No"
//           >
//             <Button
//               icon={<DeleteOutlined />}
//               style={{ backgroundColor: "red", color: "white" }}
//               danger
//               size="small"
//             />
//           </Popconfirm>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//         Calendrier
//       </h2>

//       {/* Render a table for each lead */}
//       {Object.keys(leadsEvents).length > 0 ? (
//         Object.entries(leadsEvents).map(([leadId, events]) => (
//           <div
//             key={leadId}
//             className="bg-white border border-gray-200 shadow-md rounded-lg p-4 mb-8"
//           >
//             <Table
//                       columns={[
//               ...columns.map((col) => ({
//                 ...col,
//                 title: (
//                   <div className="flex flex-col items-center">
//                     <div className="text-xs font-bold">{col.title}</div>
//                   </div>
//                 ),
//               })),
//             ]}
//               dataSource={events}
//               pagination={false}
//             />
//           </div>
//         ))
//       ) : (
//         <p className="text-center text-gray-600 text-lg">
//           Aucun événement trouvé.
//         </p>
//       )}
//     </div>
//   );
// };

// export default CalendarEvents;
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { Table, Popconfirm, Space, Button, message } from "antd";
// import { useParams } from "react-router-dom";
// import { DeleteOutlined } from "@ant-design/icons";
// import { jwtDecode } from "jwt-decode";
// import moment from "moment";
// import 'moment/locale/fr'; // Import French locale

// // Set moment locale to French
// moment.locale('fr');

// const CalendarEvents = () => {
//   const [leadsEvents, setLeadsEvents] = useState({}); // Store events grouped by lead ID
//   const { id } = useParams(); // Get leadId from URL

//   const fetchEvents = async () => {
//     const token = localStorage.getItem("token");
//     if (!token) return;
//     try {
//       const response = await axios.get(`/events/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       }); // Fetch all events
//       console.log("Fetched Events:", response.data);
//       const dataEvent = response?.data;
//       const decodedToken = token ? jwtDecode(token) : null;
//       const currentUserId = decodedToken?.userId;

//       const filterevent = dataEvent.filter(
//         (event) => event.session === currentUserId
//       );
      
//       // Format dates to French format before grouping
//       const formattedEvents = filterevent.map(event => ({
//         ...event,
//         key: event._id,
//         formattedDate: formatDateToFrench(event.event_date),
//         formattedTime: formatTimeToFrench(event.event_time)
//       }));

//       // Group events by lead ID
//       const groupedEvents = formattedEvents.reduce((acc, event) => {
//         const leadId = event.lead;
//         if (!acc[leadId]) {
//           acc[leadId] = [];
//         }
//         acc[leadId].push(event);
//         return acc;
//       }, {});

//       setLeadsEvents(groupedEvents);
//     } catch (error) {
//       console.error("Error fetching events:", error);
//     }
//   };

//   // Format date to French format (dddd D MMMM YYYY)
//   const formatDateToFrench = (dateString) => {
//     if (!dateString) return '';
//     return moment(dateString).format('dddd D MMMM YYYY');
//   };

//   // Format time to French format (HH:mm)
//   const formatTimeToFrench = (timeString) => {
//     if (!timeString) return '';
//     // If time contains 'h', replace with ':'
//     if (timeString.includes('h')) {
//       return timeString.replace('h', 'h');
//     }
//     // If it's a proper time string, format it
//     const time = moment(timeString, 'HH:mm:ss');
//     if (time.isValid()) {
//       return time.format('HH:mm');
//     }
//     return timeString;
//   };

//   // Format date for sorting (YYYY-MM-DD)
//   const formatDateForSorting = (dateString) => {
//     if (!dateString) return '';
//     return moment(dateString).format('YYYY-MM-DD');
//   };

//   useEffect(() => {
//     // Fetch events initially
//     fetchEvents();

//     // Set up polling to fetch events every 5 seconds
//     const intervalId = setInterval(() => {
//       fetchEvents();
//     }, 5000);

//     return () => clearInterval(intervalId); // Cleanup interval on component unmount
//   }, [id]);

//   const handleDelete = async (id) => {
//     try {
//       const response = await axios.delete(`/event/${id}`);
//       message.success("Événement supprimé avec succès");
//       fetchEvents(); // Refresh the list after deletion
//     } catch (error) {
//       console.error("Error deleting event:", error);
//       message.error("Échec de la suppression de l'événement");
//     }
//   };

//   // Define table columns with French labels
//   const columns = [
//     {
//       title: "Date",
//       dataIndex: "event_date",
//       key: "event_date",
//       render: (date, record) => record.formattedDate,
//       sorter: (a, b) => {
//         const dateA = formatDateForSorting(a.event_date);
//         const dateB = formatDateForSorting(b.event_date);
//         return dateA.localeCompare(dateB);
//       },
//       defaultSortOrder: 'ascend',
//     },
//     {
//       title: "Heure",
//       dataIndex: "event_time",
//       key: "event_time",
//       render: (time, record) => record.formattedTime,
//       sorter: (a, b) => {
//         const timeA = a.event_time || '';
//         const timeB = b.event_time || '';
//         return timeA.localeCompare(timeB);
//       },
//     },
//     {
//       title: "Objectif",
//       dataIndex: "objective",
//       key: "objective",
//     },
//     {
//       title: "Commentaire",
//       dataIndex: "comment",
//       key: "comment",
//     },
//     {
//       title: <span style={{ fontSize: "12px" }}>Actions</span>,
//       key: "action",
//       render: (text, record) => (
//         <Space size="middle">
//           <Popconfirm
//             title="Êtes-vous sûr de vouloir supprimer cet événement ?"
//             onConfirm={() => handleDelete(record._id)}
//             okText="Oui"
//             cancelText="Non"
//             okButtonProps={{ danger: true }}
//           >
//             <Button
//               icon={<DeleteOutlined />}
//               style={{ backgroundColor: "#ff4d4f", color: "white" }}
//               danger
//               size="small"
//             />
//           </Popconfirm>
//         </Space>
//       ),
//     },
//   ];

//   // French month names for grouping if needed
//   const frenchMonths = [
//     'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
//     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
//   ];

//   // French day names
//   const frenchDays = [
//     'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//         Événements du Calendrier
//       </h2>

//       {/* Render a table for each lead */}
//       {Object.keys(leadsEvents).length > 0 ? (
//         Object.entries(leadsEvents).map(([leadId, events]) => (
//           <div
//             key={leadId}
//             className="bg-white border border-gray-200 shadow-md rounded-lg p-4 mb-8"
//           >
//             <div className="mb-4">
//               <h3 className="text-xl font-semibold text-gray-700">
//                 Événements pour le Lead ID: {leadId}
//               </h3>
//               <p className="text-sm text-gray-500">
//                 {events.length} événement(s) trouvé(s)
//               </p>
//             </div>
            
//             <Table
//               columns={columns.map((col) => ({
//                 ...col,
//                 title: (
//                   <div className="flex flex-col items-center">
//                     <div className="text-xs font-bold whitespace-nowrap">{col.title}</div>
//                   </div>
//                 ),
//               }))}
//               dataSource={events}
//               pagination={{
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 pageSizeOptions: ['10', '20', '50'],
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} sur ${total} événements`,
//               }}
//               locale={{
//                 emptyText: "Aucun événement trouvé",
//                 filterConfirm: "OK",
//                 filterReset: "Réinitialiser",
//                 filterEmptyText: "Aucun filtre",
//                 filterCheckall: "Sélectionner tout",
//                 filterSearchPlaceholder: "Rechercher",
//                 selectAll: "Sélectionner tout",
//                 selectInvert: "Inverser la sélection",
//                 selectNone: "Aucune sélection",
//                 selectionAll: "Sélectionner toutes les données",
//                 sortTitle: "Trier",
//                 expand: "Développer",
//                 collapse: "Réduire",
//                 triggerDesc: "Trier par ordre décroissant",
//                 triggerAsc: "Trier par ordre croissant",
//                 cancelSort: "Annuler le tri",
//               }}
//             />
//           </div>
//         ))
//       ) : (
//         <div className="text-center py-8">
//           <p className="text-gray-600 text-lg mb-4">
//             Aucun événement trouvé pour ce lead.
//           </p>
//           <p className="text-gray-500 text-sm">
//             Les événements s'afficheront ici une fois créés.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CalendarEvents;
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { Table, Popconfirm, Space, Button, message } from "antd";
// import { useParams } from "react-router-dom";
// import { DeleteOutlined } from "@ant-design/icons";
// import { jwtDecode } from "jwt-decode";
// import moment from "moment";
// import 'moment/locale/fr'; // Import French locale

// // Force set moment locale to French
// moment.locale('fr');

// const CalendarEvents = () => {
//   const [leadsEvents, setLeadsEvents] = useState({});
//   const { id } = useParams();

//   // French date formatting function
//   const formatDateToFrench = (dateString) => {
//     if (!dateString) return '';
    
//     // Force French locale for this specific moment instance
//     const date = moment(dateString).locale('fr');
    
//     // Check if locale is properly set
//     console.log('Current locale:', moment.locale());
//     console.log('Date object locale:', date.locale());
//     console.log('Formatted date:', date.format('dddd D MMMM YYYY'));
    
//     return date.format('dddd D MMMM YYYY');
//   };

//   const formatTimeToFrench = (timeString) => {
//     if (!timeString) return '';
    
//     if (timeString.includes('h')) {
//       return timeString.replace('h', 'h');
//     }
    
//     const time = moment(timeString, 'HH:mm:ss').locale('fr');
//     if (time.isValid()) {
//       return time.format('HH:mm');
//     }
//     return timeString;
//   };

//   const fetchEvents = async () => {
//     const token = localStorage.getItem("token");
//     if (!token) return;
//     try {
//       const response = await axios.get(`/events/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       console.log("Fetched Events:", response.data);
//       const dataEvent = response?.data;
//       const decodedToken = token ? jwtDecode(token) : null;
//       const currentUserId = decodedToken?.userId;

//       const filterevent = dataEvent.filter(
//         (event) => event.session === currentUserId
//       );
      
//       // Format dates to French format before grouping
//       const formattedEvents = filterevent.map(event => ({
//         ...event,
//         key: event._id,
//         formattedDate: formatDateToFrench(event.event_date),
//         formattedTime: formatTimeToFrench(event.event_time)
//       }));

//       // Sort events by creation date (newest first)
//       const sortedEvents = formattedEvents.sort((a, b) => {
//         return new Date(b.createdAt) - new Date(a.createdAt);
//       });

//       // Group events by lead ID
//       const groupedEvents = sortedEvents.reduce((acc, event) => {
//         const leadId = event.lead;
//         if (!acc[leadId]) {
//           acc[leadId] = [];
//         }
//         acc[leadId].push(event);
//         return acc;
//       }, {});

//       setLeadsEvents(groupedEvents);
//     } catch (error) {
//       console.error("Error fetching events:", error);
//     }
//   };

//   const formatDateForSorting = (dateString) => {
//     if (!dateString) return '';
//     return moment(dateString).format('YYYY-MM-DD');
//   };

//   useEffect(() => {
//     // Force French locale on component mount
//     moment.locale('fr');
//     console.log('Moment locale set to:', moment.locale());
    
//     fetchEvents();

//     const intervalId = setInterval(() => {
//       fetchEvents();
//     }, 5000);

//     return () => clearInterval(intervalId);
//   }, [id]);

//   const handleDelete = async (id) => {
//     try {
//       const response = await axios.delete(`/event/${id}`);
//       message.success("Événement supprimé avec succès");
//       fetchEvents();
//     } catch (error) {
//       console.error("Error deleting event:", error);
//       message.error("Échec de la suppression de l'événement");
//     }
//   };

//   // Manual French date formatting as fallback
//   const manualFrenchFormat = (dateString) => {
//     if (!dateString) return '';
    
//     const date = new Date(dateString);
//     const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
//     const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
//     const dayName = days[date.getDay()];
//     const day = date.getDate();
//     const monthName = months[date.getMonth()];
//     const year = date.getFullYear();
    
//     return `${dayName} ${day} ${monthName} ${year}`;
//   };

//   const columns = [
//     {
//       title: "Date",
//       dataIndex: "event_date",
//       key: "event_date",
//       render: (date, record) => {
//         // Manual French formatting
//         const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
//         const frenchMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
//         const eventDate = new Date(record.event_date);
//         const dayName = frenchDays[eventDate.getDay()];
//         const day = eventDate.getDate();
//         const monthName = frenchMonths[eventDate.getMonth()];
//         const year = eventDate.getFullYear();
        
//         return `${dayName} ${day} ${monthName} ${year}`;
//       },
//       sorter: (a, b) => formatDateForSorting(a.event_date).localeCompare(formatDateForSorting(b.event_date)),
//       defaultSortOrder: 'descend',
//     },
//     {
//       title: "Heure",
//       dataIndex: "event_time",
//       key: "event_time",
//       render: (time, record) => record.formattedTime,
//       sorter: (a, b) => a.event_time.localeCompare(b.event_time),
//     },
//     {
//       title: "Objectif",
//       dataIndex: "objective",
//       key: "objective",
//     },
//     {
//       title: "Commentaire",
//       dataIndex: "comment",
//       key: "comment",
//     },
//     {
//       title: <span style={{ fontSize: "12px" }}>Actions</span>,
//       key: "action",
//       render: (text, record) => (
//         <Space size="middle">
//           <Popconfirm
//             title="Êtes-vous sûr de vouloir supprimer cet événement ?"
//             onConfirm={() => handleDelete(record._id)}
//             okText="Oui"
//             cancelText="Non"
//             okButtonProps={{ danger: true }}
//           >
//             <Button
//               icon={<DeleteOutlined />}
//               style={{ backgroundColor: "#ff4d4f", color: "white" }}
//               danger
//               size="small"
//             />
//           </Popconfirm>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//         Événements du Calendrier
//       </h2>

//       {Object.keys(leadsEvents).length > 0 ? (
//         Object.entries(leadsEvents).map(([leadId, events]) => (
//           <div key={leadId} className="bg-white border border-gray-200 shadow-md rounded-lg p-4 mb-8">            
//             <Table
//               columns={columns}
//               dataSource={events}
//               pagination={{
//                 pageSize: 10,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 pageSizeOptions: ['10', '20', '50'],
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} sur ${total} événements`,
//               }}
//               locale={{
//                 emptyText: "Aucun événement trouvé",
//                 filterConfirm: "OK",
//                 filterReset: "Réinitialiser",
//                 filterEmptyText: "Aucun filtre",
//                 filterCheckall: "Sélectionner tout",
//                 filterSearchPlaceholder: "Rechercher",
//                 selectAll: "Sélectionner tout",
//                 selectInvert: "Inverser la sélection",
//                 selectNone: "Aucune sélection",
//                 selectionAll: "Sélectionner toutes les données",
//                 sortTitle: "Trier",
//                 expand: "Développer",
//                 collapse: "Réduire",
//                 triggerDesc: "Trier par ordre décroissant",
//                 triggerAsc: "Trier par ordre croissant",
//                 cancelSort: "Annuler le tri",
//               }}
//             />
//           </div>
//         ))
//       ) : (
//         <div className="text-center py-8">
//           <p className="text-gray-600 text-lg mb-4">
//             Aucun événement trouvé pour ce lead.
//           </p>
//           <p className="text-gray-500 text-sm">
//             Les événements s'afficheront ici une fois créés.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CalendarEvents;
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Popconfirm, Space, Button, message } from "antd";
import { useParams } from "react-router-dom";
import { DeleteOutlined } from "@ant-design/icons";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import 'moment/locale/fr';

moment.locale('fr');

const CalendarEvents = () => {
  const [leadsEvents, setLeadsEvents] = useState({});
  const { id } = useParams();

  // Manual French date formatting
  const formatDateToFrench = (dateString) => {
    if (!dateString) return '';
    
    const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const frenchMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    const eventDate = new Date(dateString);
    const dayName = frenchDays[eventDate.getDay()];
    const day = eventDate.getDate();
    const monthName = frenchMonths[eventDate.getMonth()];
    const year = eventDate.getFullYear();
    
    return `${dayName} ${day} ${monthName} ${year}`;
  };

  const formatTimeToFrench = (timeString) => {
    if (!timeString) return '';
    
    if (timeString.includes('h')) {
      return timeString.replace('h', 'h');
    }
    
    // Simple time formatting without moment.js
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    }
    
    return timeString;
  };

  const fetchEvents = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await axios.get(`/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched Events:", response.data);
      const dataEvent = response?.data;
      const decodedToken = token ? jwtDecode(token) : null;
      const currentUserId = decodedToken?.userId;

      const filterevent = dataEvent.filter(
        (event) => event.session === currentUserId
      );
      
      // Ensure all events have the required formatted properties
      const formattedEvents = filterevent.map(event => ({
        ...event,
        key: event._id,
        formattedDate: formatDateToFrench(event.event_date),
        formattedTime: formatTimeToFrench(event.event_time)
      }));

      // Sort events by creation date (newest first)
      const sortedEvents = formattedEvents.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      // Group events by lead ID
      const groupedEvents = sortedEvents.reduce((acc, event) => {
        const leadId = event.lead;
        if (!acc[leadId]) {
          acc[leadId] = [];
        }
        acc[leadId].push(event);
        return acc;
      }, {});

      setLeadsEvents(groupedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const formatDateForSorting = (dateString) => {
    if (!dateString) return '';
    return moment(dateString).format('YYYY-MM-DD');
  };

  useEffect(() => {
    // Fetch events immediately on component mount
    fetchEvents();

    // Set up polling to fetch events every 3 seconds (reduced from 5 for better responsiveness)
    const intervalId = setInterval(() => {
      fetchEvents();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [id]); // Add id as dependency

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`/event/${id}`);
      message.success("Événement supprimé avec succès");
      // No need to call fetchEvents() here as polling will update the table
    } catch (error) {
      console.error("Error deleting event:", error);
      message.error("Échec de la suppression de l'événement");
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "event_date",
      key: "event_date",
      render: (date, record) => {
        // Use the pre-formatted date or format on the fly as fallback
        return record.formattedDate || formatDateToFrench(record.event_date);
      },
      sorter: (a, b) => formatDateForSorting(a.event_date).localeCompare(formatDateForSorting(b.event_date)),
      defaultSortOrder: 'descend',
    },
    {
      title: "Heure",
      dataIndex: "event_time",
      key: "event_time",
      render: (time, record) => {
        // Use the pre-formatted time or format on the fly as fallback
        return record.formattedTime || formatTimeToFrench(record.event_time);
      },
      sorter: (a, b) => (a.event_time || '').localeCompare(b.event_time || ''),
    },
    {
      title: "Objectif",
      dataIndex: "objective",
      key: "objective",
    },
    {
      title: "Commentaire",
      dataIndex: "comment",
      key: "comment",
    },
    {
      title: <span style={{ fontSize: "12px" }}>Actions</span>,
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Popconfirm
            title="Êtes-vous sûr de vouloir supprimer cet événement ?"
            onConfirm={() => handleDelete(record._id)}
            okText="Oui"
            cancelText="Non"
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<DeleteOutlined />}
              style={{ backgroundColor: "#ff4d4f", color: "white" }}
              danger
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Événements du Calendrier
      </h2>

      {Object.keys(leadsEvents).length > 0 ? (
        Object.entries(leadsEvents).map(([leadId, events]) => (
          <div key={leadId} className="bg-white border border-gray-200 shadow-md rounded-lg p-4 mb-8">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-700">
                Événements pour le Lead ID: {leadId}
              </h3>
              <p className="text-sm text-gray-500">
                {events.length} événement(s) trouvé(s)
              </p>
            </div>
            
            <Table
              columns={columns}
              dataSource={events}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} sur ${total} événements`,
              }}
              locale={{
                emptyText: "Aucun événement trouvé",
                filterConfirm: "OK",
                filterReset: "Réinitialiser",
                filterEmptyText: "Aucun filtre",
                filterCheckall: "Sélectionner tout",
                filterSearchPlaceholder: "Rechercher",
                selectAll: "Sélectionner tout",
                selectInvert: "Inverser la sélection",
                selectNone: "Aucune sélection",
                selectionAll: "Sélectionner toutes les données",
                sortTitle: "Trier",
                expand: "Développer",
                collapse: "Réduire",
                triggerDesc: "Trier par ordre décroissant",
                triggerAsc: "Trier par ordre croissant",
                cancelSort: "Annuler le tri",
              }}
            />
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 text-lg mb-4">
            Aucun événement trouvé pour ce lead.
          </p>
          <p className="text-gray-500 text-sm">
            Les événements s'afficheront ici une fois créés.
          </p>
        </div>
      )}
    </div>
  );
};

export default CalendarEvents;
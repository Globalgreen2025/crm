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

  // const formatTimeToFrench = (timeString) => {
  //   if (!timeString) return '';
    
  //   if (timeString.includes('h')) {
  //     return timeString.replace('h', 'h');
  //   }
    
  //   // Simple time formatting without moment.js
  //   if (timeString.includes(':')) {
  //     const [hours, minutes] = timeString.split(':');
  //     return `${hours}:${minutes}`;
  //   }
    
  //   return timeString;
  // };
  const formatTimeToFrench = (timeString) => {
    if (!timeString) return '';
    
    // Handle ISO date format like "2025-10-14T15:03"
    if (timeString.includes('T')) {
      try {
        const date = new Date(timeString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      } catch (error) {
        console.error('Error parsing time:', timeString, error);
        return '';
      }
    }
    
    // Handle existing French format with 'h'
    if (timeString.includes('h')) {
      return timeString.replace('h', 'h');
    }
    
    // Handle simple time format
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
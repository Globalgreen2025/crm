import React, { useState, useEffect } from "react";
import { Calendar, Modal, ConfigProvider, Button } from "antd";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import moment from "moment";
import 'moment/locale/fr'; // Import French locale

// Set moment locale to French
moment.locale('fr');

const MyCalendar = () => {
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const token = localStorage.getItem("token");
  const decodedUser = token ? jwtDecode(token) : "";
  const userLoged = decodedUser.userId;

  const formatEventTime = (event) => {
    if (!event.event_time) return '';
    
    let timeValue = event.event_time;
    
    // If it's an ISO date string, extract just the time part
    if (typeof timeValue === 'string' && timeValue.includes('T')) {
      try {
        return moment(timeValue).format('HH:mm');
      } catch (error) {
        console.error('Error parsing time:', timeValue, error);
        return '';
      }
    }
    
    // If it's already in HH:mm format, return as is
    if (typeof timeValue === 'string' && timeValue.match(/^\d{1,2}:\d{2}$/)) {
      return timeValue;
    }
    
    // If it's in French format "14h30", convert to "14:30"
    if (typeof timeValue === 'string' && timeValue.includes('h')) {
      return timeValue.replace('h', ':');
    }
    
    // Default fallback
    return moment(timeValue).format('HH:mm');
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get('/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const eventsData = response?.data;
      
      const formattedEvents = eventsData.map((event) => {
        // Extract lead data
        const leadId = event.lead?._id || event.lead;
        const leadName = event.lead?.nom || 'Client inconnu';
  
        // Format time
        let formattedTime = '';
        if (event.event_time) {
          if (typeof event.event_time === 'string' && event.event_time.includes('T')) {
            formattedTime = moment(event.event_time).format('HH:mm');
          } else if (typeof event.event_time === 'string' && event.event_time.includes('h')) {
            formattedTime = event.event_time.replace('h', ':');
          } else {
            formattedTime = event.event_time;
          }
        }
  
        // Format date properly - ensure it's a valid date
        let eventDate = event.event_date;
        if (!eventDate) {
          console.warn('Missing event_date for event:', event._id);
          eventDate = new Date().toISOString().split('T')[0];
        }
  
        return {
          ...event,
          color: getEventColor(event.objective),
          formattedTime: formattedTime,
          event_date: eventDate,
          leadId: leadId,
          leadName: leadName
        };
      });
  
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };
  
  const getEventColor = (objective) => {
    const colors = {
      'SAV': '#ff4d4f',
      'Pose d\'ouvrage': '#52c41a',
      'Vente': '#1890ff',
      'Rendez-vous': '#faad14',
      'default': '#4096ff'
    };
    return colors[objective] || colors.default;
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setEventModalVisible(true);
  };

  const handleRedirectToClient = () => {
    if (selectedEvent && selectedEvent.leadId && selectedEvent.leadId !== 'unknown') {
      window.location.href = `/lead/${selectedEvent.leadId}`;
    }
  };

  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    
    const matchingEvents = events.filter((event) => {
      if (!event.event_date) {
        console.warn('Event missing event_date:', event._id);
        return false;
      }
      
      try {
        const eventDate = moment(event.event_date).format('YYYY-MM-DD');
        return eventDate === dateStr;
      } catch (error) {
        console.error('Error parsing event date:', event.event_date, error);
        return false;
      }
    });
  
    if (matchingEvents.length === 0) {
      return null;
    }
  
    return (
      <div className="min-h-[100px] space-y-1 py-1">
        {matchingEvents.map((event, index) => (
          <div
            key={`${dateStr}-${event._id}-${index}`}
            className="border-l-4 rounded-r p-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-gray-50"
            style={{ 
              borderLeftColor: event.color || "#4096ff",
              border: '1px solid #e5e7eb',
              backgroundColor: 'transparent'
            }}
            onClick={() => handleEventClick(event)}
          >
            <div className="flex justify-between items-center mb-1">
              <span 
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ 
                  color: event.color || "#4096ff",
                  backgroundColor: `${event.color}15` || "#4096ff15"
                }}
              >
                {event.formattedTime || '--:--'}
              </span>
              <span 
                className="text-xs font-semibold truncate ml-1"
                style={{ color: event.color || "#4096ff" }}
              >
                {event.objective}
              </span>
            </div>
            
            <div className="text-xs truncate font-medium text-gray-700">
              {event.leadName}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleSelect = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const matchingEvents = events.filter((event) => 
      moment(event.event_date).format('YYYY-MM-DD') === dateStr
    );
    setSelectedEvents(matchingEvents);
    setSelectedDate(value);
  };

  // French day names for calendar
  const frenchDayNames = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];

  // Custom header render without day names
  const customHeaderRender = ({ value, onChange }) => {
    const current = value;
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const monthName = months[current.month()];
    const year = current.year();
    
    return (
      <div className="flex justify-between items-center py-4 px-2">
        <div className="text-xl font-bold text-gray-800">
          {monthName} {year}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onChange(current.clone().subtract(1, 'month'))}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            ‹
          </button>
          <button
            onClick={() => onChange(current.clone().add(1, 'month'))}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            ›
          </button>
        </div>
      </div>
    );
  };

  const customDateFullCellRender = (value) => {
    const date = value.date();
    const isToday = value.isSame(moment(), 'day');
    const isSelected = value.isSame(selectedDate, 'day');
    
    // Get French day name for the column
    const dayOfWeek = value.day(); // 0-6 (Sunday to Saturday)
    const frenchDayName = frenchDayNames[dayOfWeek];
    
    return (
      <div 
        className={`w-full h-full p-1 min-h-[100px] border border-transparent
          ${isToday ? 'bg-blue-50 border-blue-200' : ''}
          ${isSelected ? 'bg-gray-100' : ''}
          hover:bg-gray-50`}
      >
        {/* Centered day name and date */}
        <div className="flex flex-col items-center text-center">
          <span className="text-xs text-gray-500 font-medium mb-1">
            {frenchDayName}
          </span>
          <span className={`text-sm font-medium ${
            isToday ? 'text-blue-600' : 'text-gray-900'
          }`}>
            {date}
          </span>
        </div>
        <div className="mt-1">
          {dateCellRender(value)}
        </div>
      </div>
    );
  };

  const frenchLocale = {
    lang: {
      locale: 'fr_FR',
      placeholder: 'Sélectionner une date',
      rangePlaceholder: ['Date de début', 'Date de fin'],
      today: "Aujourd'hui",
      now: 'Maintenant',
      backToToday: "Retour à aujourd'hui",
      ok: 'OK',
      clear: 'Effacer',
      month: 'Mois',
      year: 'Année',
      timeSelect: "Sélectionner l'heure",
      dateSelect: 'Sélectionner la date',
      monthSelect: 'Choisir un mois',
      yearSelect: 'Choisir une année',
      decadeSelect: 'Choisir une décennie',
      yearFormat: 'YYYY',
      dateFormat: 'D/M/YYYY',
      dayFormat: 'D',
      dateTimeFormat: 'D/M/YYYY HH:mm:ss',
      monthFormat: 'MMMM',
      monthBeforeYear: true,
      previousMonth: 'Mois précédent (PageUp)',
      nextMonth: 'Mois suivant (PageDown)',
      previousYear: 'Année précédente (Ctrl + gauche)',
      nextYear: 'Année suivante (Ctrl + droite)',
      previousDecade: 'Décennie précédente',
      nextDecade: 'Décennie suivante',
      previousCentury: 'Siècle précédent',
      nextCentury: 'Siècle suivant',
    },
    timePickerLocale: {
      placeholder: "Sélectionner l'heure",
    },
    dateFormat: 'DD/MM/YYYY',
    dateTimeFormat: 'DD/MM/YYYY HH:mm:ss',
    weekFormat: 'wo',
    monthFormat: 'MM/YYYY',
  };

  return (
    <ConfigProvider locale={frenchLocale}>
      <div className="w-full mx-auto mt-1 max-w-screen">
        <h2 className="text-xl font-bold mb-4 text-start">Calendrier</h2>
        <div className="border border-gray-300 rounded-lg p-4 shadow-md bg-white">
          <Calendar
            className="w-full custom-calendar"
            style={{ 
              maxWidth: "100%",
              minHeight: "600px"
            }}
            dateFullCellRender={customDateFullCellRender}
            fullscreen={true}
            onSelect={handleSelect}
            headerRender={customHeaderRender}
          />
        </div>

        {/* Event Details Modal */}
        <Modal
          title="Détails du Rendez-vous"
          open={eventModalVisible}
          onCancel={() => setEventModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setEventModalVisible(false)}>
              Fermer
            </Button>,
            <Button 
              key="client" 
              type="primary" 
              onClick={handleRedirectToClient}
              disabled={!selectedEvent?.leadId || selectedEvent.leadId === 'unknown'}
            >
              Voir les Détails du Client
            </Button>
          ]}
          width={500}
        >
          {selectedEvent && (
            <div className="space-y-4">
              <div className="border-l-4 rounded-r p-4 bg-white border border-gray-200"
                style={{
                  borderLeftColor: selectedEvent.color,
                  borderLeftWidth: '4px'
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <span 
                      className="px-3 py-1 rounded-full font-bold text-sm"
                      style={{ 
                        color: selectedEvent.color,
                        backgroundColor: `${selectedEvent.color}15`
                      }}
                    >
                      {selectedEvent.formattedTime || '--:--'}
                    </span>
                    <span 
                      className="font-bold text-lg"
                      style={{ color: selectedEvent.color }}
                    >
                      {selectedEvent.objective}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Client:</span>
                    <span>{selectedEvent.leadName}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Date:</span>
                    <span>{moment(selectedEvent.event_date).format('DD/MM/YYYY')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Heure:</span>
                    <span>{selectedEvent.formattedTime || 'Non spécifiée'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Type:</span>
                    <span>{selectedEvent.objective}</span>
                  </div>
                  
                  {selectedEvent.comment && (
                    <div className="mt-3">
                      <span className="font-semibold text-gray-700 block mb-2">Commentaire:</span>
                      <div className="p-3 rounded bg-gray-50 text-gray-700">
                        {selectedEvent.comment}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm text-gray-500 mt-3">
                    <span>Créé le:</span>
                    <span>{moment(selectedEvent.createdAt).format('DD/MM/YYYY')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>


      </div>
    </ConfigProvider>
  );
};

export default MyCalendar;